// Figures for the play-along page. Pure drawing from the pre-built blob: no fetches, no recomputation of judgments.
// Palette (validated for colour-vision deficiency): blue / amber / purple. Red and green are never used to separate series.
(function(){
const PAL = ['#2b5fb8', '#b7851a', '#7a3e9d'];
const INK = '#1c1c1c', MUTED = '#6b6b6b', LINE = '#e4e4e0', SURF = '#fff';
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : null;
const key = (t,r,j) => `${t}|${r}|${j}`;
let figFam = null;   // family shown in the figure card; follows the selected rubric unless the reader picks a tab

// ---- fuzzy title similarity (same recipe as the diff view) ----
const toks = s => new Set(String(s||'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(w=>w.length>2));
const grams = s => { const t = String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,''); const g=new Set(); for (let i=0;i<t.length-1;i++) g.add(t.slice(i,i+2)); return g; };
function sim(a,b){
  const ta=toks(a), tb=toks(b); let inter=0; for (const w of ta) if (tb.has(w)) inter++;
  const jac = (ta.size+tb.size-inter) ? inter/(ta.size+tb.size-inter) : 0;
  const ga=grams(a), gb=grams(b); let gi=0; for (const g of ga) if (gb.has(g)) gi++;
  const dice = (ga.size+gb.size) ? 2*gi/(ga.size+gb.size) : 0;
  return 0.5*jac + 0.5*dice;
}

function svgOpen(w,h){ return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block;font:12px -apple-system,system-ui,sans-serif" role="img">`; }
const txt = (x,y,s,o={}) => `<text x="${x}" y="${y}" fill="${o.fill||INK}" font-size="${o.size||12}" text-anchor="${o.anchor||'start'}" dominant-baseline="${o.base||'middle'}" font-weight="${o.weight||400}">${esc(s)}</text>`;
const legend = (items, x, y) => items.map((it,i)=>`<g transform="translate(${x+i*150},${y})"><rect width="12" height="12" rx="2" fill="${it.color}" ${it.hollow?`fill="${SURF}" stroke="${it.color}" stroke-width="2"`:''}/>${txt(18,6,it.label,{fill:MUTED})}</g>`).join('');

// ---------- 1. Downs & Black: agreement strip ----------
function figDownsBlack(B){
  const rub = B.dims.rubric.find(r=>r.family==='downs_black'); if (!rub) return '';
  const cols = []; for (const t of B.dims.text) for (const j of B.dims.judge) cols.push({t,j, c:B.cells[key(t.id,rub.id,j.id)]});
  const ans = (cr, c) => {
    if (!c) return 'none'; const x = c.results[cr.id]; if (!x) return 'none';
    if (cr.kind==='boolean') return x.answer || 'unclear';
    if (x.normalized==null) return 'none'; return x.normalized===0 ? 'no' : x.normalized>=0.5 ? 'yes' : 'unclear';
  };
  const rows = rub.criteria.map(cr => { const a = cols.map(c=>ans(cr,c.c)); const distinct = new Set(a.filter(v=>v!=='none')).size; return {cr, a, distinct, split: distinct>1}; });
  rows.sort((p,q)=> q.distinct-p.distinct || rub.criteria.indexOf(p.cr)-rub.criteria.indexOf(q.cr));
  const COL = {yes: PAL[0], unclear: PAL[1], no: LINE, none: SURF};
  const L=300, top=96, cw=26, rh=16, W=L+cols.length*cw+20, H=top+rows.length*rh+20;
  let s = svgOpen(W,H);
  s += txt(0,14,'Which checklist items the twelve judges disagree on',{weight:600,size:13});
  s += txt(0,32,`${rows.filter(r=>r.split).length} of ${rows.length} items get more than one answer across the 12 (text x judge) cells; the rest are unanimous. Split items are listed first.`,{fill:MUTED});
  s += legend([{label:'yes',color:PAL[0]},{label:'unclear / partial',color:PAL[1]},{label:'no / not applicable',color:LINE}], 0, 46);
  // column headers: text group label over each block of 4 judges
  B.dims.text.forEach((t,ti)=>{ s += txt(L+ti*4*cw+2*cw, top-18, t.label, {anchor:'middle', fill:MUTED, size:11}); });
  cols.forEach((c,i)=>{ const j=c.j; s += txt(L+i*cw+cw/2, top-6, (j.model.includes('opus')?'O':'S')+(j.thinking==='high'?'↑':'↓'), {anchor:'middle', fill:MUTED, size:10}); });
  rows.forEach((r,ri)=>{
    const y = top+ri*rh;
    s += txt(0, y+rh/2, `${r.cr.id}  ${r.cr.name}`.slice(0,48), {fill: r.split?INK:MUTED, size:11, weight: r.split?600:400});
    r.a.forEach((a,i)=>{ const c=cols[i]; s += `<rect x="${L+i*cw+1}" y="${y+1}" width="${cw-2}" height="${rh-2}" rx="3" fill="${COL[a]}" ${a==='none'?`stroke="${LINE}"`:''}><title>${esc(c.t.label)} · ${esc(c.j.label)}\n${esc(r.cr.name)}: ${esc(a)}${c.c&&c.c.results[r.cr.id]?'\n'+esc(c.c.results[r.cr.id].rationale.slice(0,220)):''}</title></rect>`; });
  });
  s += txt(L, H-4, 'Columns: O = Opus, S = Sonnet; ↓ low thinking, ↑ high thinking.', {fill:MUTED, size:10});
  return s + '</svg>';
}

// ---------- 2. Claim audit: how the hunter instruction and the judge move the audit ----------
function figClaimAudit(B){
  const fam = B.families.find(f=>f.id==='claim_audit'); if (!fam) return '';
  const rubs = fam.rubrics.map(id=>B.dims.rubric.find(r=>r.id===id));
  const cellsOf = r => { const o=[]; for (const t of B.dims.text) for (const j of B.dims.judge){ const c=B.cells[key(t.id,r.id,j.id)]; if (c) o.push({t,j,c}); } return o; };
  const judgeColor = j => j.model.includes('opus') ? PAL[0] : PAL[1];
  const dot = (x,y,color,hollow,title) => `<circle cx="${x}" cy="${y}" r="5" fill="${hollow?SURF:color}" stroke="${color}" stroke-width="2"><title>${esc(title)}</title></circle>`;

  // Panel A: findings per cell by variant, with low-confidence share
  const W=980, H=400; let s = svgOpen(W,H);
  s += txt(0,14,'Claim audit: what the instruction changes, and what the judge changes',{weight:600,size:13});
  s += legend([{label:'Opus',color:PAL[0]},{label:'Sonnet',color:PAL[1]},{label:'hollow = low thinking',color:MUTED,hollow:true}], 0, 28);
  const ax = 160, aw = 300, atop = 70, rowh = 50;
  const maxN = Math.max(6, ...rubs.flatMap(r=>cellsOf(r).map(x=>(x.c.results.problems.items||[]).length)));
  s += txt(ax, atop-14, 'Findings per cell', {weight:600});
  for (let v=0; v<=maxN; v+=2){ const x=ax+aw*v/maxN; s += `<line x1="${x}" y1="${atop}" x2="${x}" y2="${atop+rubs.length*rowh}" stroke="${LINE}"/>` + txt(x, atop+rubs.length*rowh+10, v, {anchor:'middle', fill:MUTED, size:10}); }
  rubs.forEach((r,ri)=>{
    const y = atop+ri*rowh+rowh/2, cs = cellsOf(r);
    const all = cs.flatMap(x=>x.c.results.problems.items||[]); const low = all.filter(it=>Number(it.confidence)<=0.3).length;
    s += txt(0, y-7, r.variant, {weight:600, size:11}) + txt(0, y+8, `mean ${mean(cs.map(x=>(x.c.results.problems.items||[]).length)).toFixed(1)} · low-conf ${low}/${all.length}`, {fill:MUTED, size:10});
    // jitter identical counts
    const seen = {};
    cs.forEach(x=>{ const n=(x.c.results.problems.items||[]).length; const k=n+'|'+x.j.model; seen[k]=(seen[k]||0)+1; const jy = (x.j.model.includes('opus')?-8:8) + (seen[k]-1)*5;
      s += dot(ax+aw*n/maxN, y+jy, judgeColor(x.j), x.j.thinking==='low', `${x.t.label} · ${x.j.label}\n${n} findings, ${(x.c.results.problems.items||[]).filter(it=>Number(it.confidence)<=0.3).length} at confidence ≤ 0.3`); });
  });
  s += txt(ax, atop+rubs.length*rowh+26, '"Report when unsure" adds findings, and most of the low-confidence ones;', {fill:MUTED, size:10});
  s += txt(ax, atop+rubs.length*rowh+40, '"quote or skip" trims them. Hue (judge) separates less than you might expect.', {fill:MUTED, size:10});

  // Panel B: headline_survives by judge, coloured by variant
  const bx = 560, bw = 340, btop = 70;
  s += txt(bx, btop-14, '"Headline survives audit" (0–100), by judge', {weight:600});
  for (let v=0; v<=100; v+=25){ const x=bx+bw*v/100; s += `<line x1="${x}" y1="${btop}" x2="${x}" y2="${btop+4*34}" stroke="${LINE}"/>` + txt(x, btop+4*34+10, v, {anchor:'middle', fill:MUTED, size:10}); }
  B.dims.judge.forEach((j,ji)=>{
    const y = btop+ji*34+17; s += txt(bx-6, y, j.label, {anchor:'end', size:11});
    const vals=[];
    rubs.forEach((r,ri)=>{ for (const t of B.dims.text){ const c=B.cells[key(t.id,r.id,j.id)]; if(!c) continue; const v=c.results.headline_survives.score; vals.push(v);
      s += `<circle cx="${bx+bw*v/100}" cy="${y+(ri-1)*7}" r="4.5" fill="${PAL[ri]}" stroke="${SURF}" stroke-width="1.5"><title>${esc(t.label)} · ${esc(r.variant)}\nheadline survives ${v}</title></circle>`; } });
    const m = mean(vals); s += `<line x1="${bx+bw*m/100}" y1="${y-14}" x2="${bx+bw*m/100}" y2="${y+14}" stroke="${INK}" stroke-width="2"/>` + txt(bx+bw+8, y, `mean ${m.toFixed(0)}`, {size:10, fill:MUTED});
  });
  s += legend(rubs.map((r,i)=>({label:r.variant, color:PAL[i]})), bx, btop+4*34+22);
  s += txt(bx, btop+4*34+46, 'Black tick = judge mean over 9 cells.', {fill:MUTED, size:10});
  s += txt(bx, btop+4*34+60, 'The judge moves this number more than the hunter instruction does.', {fill:MUTED, size:10});

  // Panel C: which problems are found by how many of the 36 cells (fuzzy clustering of finding titles)
  const allItems = []; rubs.forEach(r=>cellsOf(r).forEach(x=>(x.c.results.problems.items||[]).forEach(it=>allItems.push({it, cell:`${x.t.id}|${r.id}|${x.j.id}`}))));
  const clusters = [];
  for (const rec of allItems){ let best=null, bs=0; for (const cl of clusters){ const sc = sim(cl.title, rec.it.title); if (sc>bs){ bs=sc; best=cl; } } if (best && bs>=0.42){ best.cells.add(rec.cell); best.items.push(rec.it); } else clusters.push({title: rec.it.title, cells:new Set([rec.cell]), items:[rec.it]}); }
  clusters.sort((a,b)=>b.cells.size-a.cells.size);
  const top = clusters.slice(0,8), nCells = rubs.reduce((n,r)=>n+cellsOf(r).length,0);
  const cy0 = 300, ch = 12;
  s += txt(0, cy0-16, `Problems found, by how many of the ${nCells} claim-audit cells raised them (titles clustered by similarity)`, {weight:600});
  const cx = 420, cwid = 520;
  top.forEach((cl,i)=>{ const y=cy0+i*ch; const w=cwid*cl.cells.size/nCells; const sev = {major:0,moderate:0,minor:0}; cl.items.forEach(it=>sev[it.severity]=(sev[it.severity]||0)+1);
    s += txt(cx-8, y+ch/2, cl.title.slice(0,64), {anchor:'end', size:10}) + `<rect x="${cx}" y="${y+1}" width="${w}" height="${ch-2}" rx="3" fill="${PAL[2]}"><title>${esc(cl.title)}\n${cl.cells.size} of ${nCells} cells · severities: ${sev.major} major, ${sev.moderate} moderate, ${sev.minor} minor</title></rect>` + txt(cx+w+4, y+ch/2, cl.cells.size, {size:10, fill:MUTED}); });
  return s + '</svg>';
}

// ---------- 3. Quality framing: slope chart of the three framings ----------
function figQuality(B){
  const fam = B.families.find(f=>f.id==='general_quality'); if (!fam) return '';
  const rubs = fam.rubrics.map(id=>B.dims.rubric.find(r=>r.id===id));
  const crits = rubs[0].criteria;
  const W=980, H=360, L=60, R=200, top=70, bottom=40, pw=W-L-R, ph=H-top-bottom;
  const x = i => L + pw*i/(crits.length-1), y = v => top + ph*(1-v/100);
  let s = svgOpen(W,H);
  s += txt(0,14,'Does the number move with the sign of the question? Mean 0–100 score per criterion, three framings of the same seven questions',{weight:600,size:13});
  s += txt(0,32,'Each point averages 12 cells (3 text versions x 4 judges). The negative-leading framing is reverse-scored, so a higher value always means "better paper".',{fill:MUTED});
  for (let v=0; v<=100; v+=25){ s += `<line x1="${L}" y1="${y(v)}" x2="${L+pw}" y2="${y(v)}" stroke="${LINE}"/>` + txt(L-8, y(v), v, {anchor:'end', fill:MUTED, size:10}); }
  crits.forEach((c,i)=> s += txt(x(i), H-bottom+16, c.name.replace('Claims proportional to evidence','Claims vs evidence').replace('Appropriateness of design','Design').replace('Clarity of research question','Clarity').replace('Transparency and reproducibility','Transparency').replace('Honesty about limitations','Limitations').replace('Statistical rigor','Stats'), {anchor:'middle', fill:MUTED, size:11}));
  const series = rubs.map((r,ri)=>{ const pts = crits.map(c=>{ const vals=[]; for (const t of B.dims.text) for (const j of B.dims.judge){ const cell=B.cells[key(t.id,r.id,j.id)]; if (cell && cell.results[c.id] && cell.results[c.id].score!=null) vals.push(cell.results[c.id].score); } return {m: mean(vals), n: vals.length, lo: Math.min(...vals), hi: Math.max(...vals)}; }); return {r, pts, color: PAL[ri]}; });
  const ends = series.map(se=>({se, y:y(se.pts[se.pts.length-1].m)})).sort((a,b)=>a.y-b.y);
  for (let i=1;i<ends.length;i++) if (ends[i].y-ends[i-1].y<13) ends[i].y = ends[i-1].y+13;
  const labelY = Object.fromEntries(ends.map(e=>[e.se.r.id, e.y]));
  series.forEach(se=>{
    s += `<path d="${se.pts.map((p,i)=>`${i?'L':'M'}${x(i)},${y(p.m)}`).join(' ')}" fill="none" stroke="${se.color}" stroke-width="2"/>`;
    se.pts.forEach((p,i)=> s += `<circle cx="${x(i)}" cy="${y(p.m)}" r="4.5" fill="${se.color}" stroke="${SURF}" stroke-width="1.5"><title>${esc(se.r.variant)} · ${esc(crits[i].name)}\nmean ${p.m.toFixed(1)} over ${p.n} cells (range ${p.lo}–${p.hi})</title></circle>`);
    const last = se.pts[se.pts.length-1]; s += txt(L+pw+10, labelY[se.r.id], `${se.r.variant}  (${last.m.toFixed(0)})`, {fill:se.color, weight:600, size:11});
  });
  // caption: mean shift per model
  const shift = (ri, model) => { const d=[]; for (const c of crits) for (const t of B.dims.text) for (const j of B.dims.judge){ if (!j.model.includes(model)) continue; const a=B.cells[key(t.id,rubs[0].id,j.id)], b=B.cells[key(t.id,rubs[ri].id,j.id)]; if (a&&b&&a.results[c.id]&&b.results[c.id]) d.push(b.results[c.id].score-a.results[c.id].score); } return mean(d); };
  s += legend(series.map(se=>({label:se.r.variant, color:se.color})), L, 46);
  s += txt(L, H-6, `Average shift from neutral, Opus / Sonnet: positive-leading ${shift(1,'opus')>=0?'+':''}${shift(1,'opus').toFixed(1)} / ${shift(1,'sonnet')>=0?'+':''}${shift(1,'sonnet').toFixed(1)}; negative-leading ${shift(2,'opus')>=0?'+':''}${shift(2,'opus').toFixed(1)} / ${shift(2,'sonnet')>=0?'+':''}${shift(2,'sonnet').toFixed(1)} points.`, {fill:MUTED, size:10});
  return s + '</svg>';
}

window.playFigQuality = figQuality;   // nested into the tour scene
const RENDER = {downs_black: figDownsBlack, claim_audit: figClaimAudit, general_quality: figQuality};

window.renderPlayFigures = function(B, S, el, onChange){
  const selFam = B.dims.rubric.find(r=>r.id===S.rubric).family;
  if (!figFam || !RENDER[figFam]) figFam = selFam;
  if (el.dataset.lastSel !== selFam){ figFam = selFam; el.dataset.lastSel = selFam; }
  const tabs = B.families.map(f=>`<button class="small ${f.id===figFam?'primary':''}" data-fam="${f.id}">${esc(f.label)}</button>`).join(' ');
  const fig = RENDER[figFam] ? RENDER[figFam](B) : '<p class="muted">No figure for this family.</p>';
  el.innerHTML = `<div class="row" style="justify-content:space-between"><h2 style="margin:0">Figures</h2><div class="row">${tabs}</div></div><div class="fig">${fig}</div><p class="small muted">Drawn in the browser from the same pre-computed blob as the rest of the page. Hover any mark for the cell behind it.</p>`;
  el.querySelectorAll('[data-fam]').forEach(b => b.onclick = () => { figFam = b.dataset.fam; window.renderPlayFigures(B, S, el, onChange); });
};
})();

// ---------- Process diagram: how one paper becomes 84 runs and this page ----------
(function(){
const PAL = ['#2b5fb8', '#b7851a', '#7a3e9d'];
const INK = '#1c1c1c', MUTED = '#6b6b6b', LINE = '#e4e4e0';
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const T = (x,y,s,o={}) => `<text x="${x}" y="${y}" fill="${o.fill||INK}" font-size="${o.size||12}" text-anchor="${o.anchor||'start'}" dominant-baseline="middle" font-weight="${o.weight||400}">${esc(s)}</text>`;
const box = (x,y,w,h,label,sub,color,cls='') => `<g class="${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#fff" stroke="${color||LINE}" stroke-width="1.5"/>${T(x+w/2,y+(sub?h/2-7:h/2),label,{anchor:'middle',weight:600,size:11})}${sub?T(x+w/2,y+h/2+8,sub,{anchor:'middle',fill:MUTED,size:10}):''}</g>`;
const curve = (x1,y1,x2,y2,cls,color,w) => { const mx=(x1+x2)/2; return `<path class="${cls}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="${color||LINE}" stroke-width="${w||1}"/>`; };

// Layout and tree markup shared by the process diagram and the tour. wrap(stage, inner) decides how each stage group is tagged.
function processLayout(B){
  const texts = B.dims.text, rubs = B.dims.rubric, judges = B.dims.judge;
  const W = 1220, H = 440, bw = 150, rw = 200, bh = 34;
  const X = [20, 230, 460, 740, 980];                   // stage x positions
  const cy = H/2 + 10;
  const ys = (n, gap) => Array.from({length:n}, (_,i)=> cy + (i-(n-1)/2)*gap);
  const famColor = Object.fromEntries(B.families.map((f,i)=>[f.id, PAL[i%3]]));
  return {W, H, bw, rw, bh, X, cy, ty: ys(texts.length, 70), ry: ys(rubs.length, 42), jy: ys(judges.length, 56), famColor};
}
function processTree(B, L, wrap){
  const texts = B.dims.text, rubs = B.dims.rubric, judges = B.dims.judge;
  const {H, bw, rw, bh, X, cy, ty, ry, jy, famColor} = L;
  let s = '';
  const hdr = (x,label,n) => T(x, 22, label, {weight:600,size:12}) + T(x, 38, n, {fill:MUTED,size:11});
  s += wrap('s1', hdr(X[0],'1. Paper','resolve, enrich, fetch PDF'));
  s += wrap('s2', hdr(X[1],'2. Text versions',`${texts.length} extractors, one Document shape`));
  s += wrap('s3', hdr(X[2],'3. Rubric configs',`${rubs.length} YAML files in ${B.families.length} families`));
  s += wrap('s4', hdr(X[3],'4. Judges',`${judges.length} model x thinking settings`));
  s += wrap('s5', hdr(X[4],'5. Runs → page',`${B.n_done} of ${B.n_cells} cells, pre-computed`));
  // edges (faint fan-outs), drawn before boxes
  s += wrap('s2', texts.map((t,i)=> curve(X[0]+bw, cy, X[1], ty[i], '')).join(''));
  s += wrap('s3', texts.map((t,i)=> rubs.map((r,j)=> curve(X[1]+bw, ty[i], X[2], ry[j], '')).join('')).join(''));
  s += wrap('s4', rubs.map((r,j)=> judges.map((jj,k)=> curve(X[2]+rw, ry[j], X[3], jy[k], '')).join('')).join(''));
  s += wrap('s5', judges.map((jj,k)=> curve(X[3]+bw, jy[k], X[4], cy, '')).join(''));
  // figures side-channel
  s += wrap('s2', `${curve(X[0]+bw, cy, X[1], H-40, '', PAL[1], 1.5)}${box(X[1], H-56, bw, 32, `${B.figures.length} figure/table crops`, 'attached to every cell', PAL[1])}`);
  s += wrap('s4', `${curve(X[1]+bw, H-40, X[3]+bw/2, jy[jy.length-1]+bh/2+18, '', PAL[1], 1.5)}${T(X[3]+bw/2, jy[jy.length-1]+bh/2+30, 'every judge sees the images', {anchor:'middle', fill:PAL[1], size:10})}`);
  // boxes
  s += wrap('s1', box(X[0], cy-bh/2-6, bw, bh+12, 'Ioannidis 2005', (B.paper.doi||'').slice(0,28), INK));
  s += wrap('s2', texts.map((t,i)=> box(X[1], ty[i]-bh/2, bw, bh, t.label, t.chars ? `${Math.round(t.chars/1000)}k chars` : 'missing', PAL[0])).join(''));
  s += wrap('s3', rubs.map((r,j)=> box(X[2], ry[j]-bh/2+2, rw, bh-4, r.label.length>34?r.label.slice(0,33)+'…':r.label, `${r.criteria.length} criteria`, famColor[r.family])).join(''));
  s += wrap('s4', judges.map((jj,k)=> box(X[3], jy[k]-bh/2, bw, bh, jj.label, 'Claude Code subagent', PAL[2])).join(''));
  s += wrap('s5', box(X[4], cy-bh/2-10, bw+60, bh+20, `${B.n_done} runs in SQLite`, 'one JSON blob → this page', INK));
  s += wrap('cnt', T(X[4]+bw/2+30, cy+38, `${texts.length} x ${rubs.length} x ${judges.length} = ${B.n_cells}`, {anchor:'middle', fill:MUTED, size:11}));
  return s;
}
window.playProcessLayout = processLayout;
window.playProcessTree = processTree;

window.renderProcessDiagram = function(B, el){
  const texts = B.dims.text, rubs = B.dims.rubric, judges = B.dims.judge;
  const L = processLayout(B), {W, H, bw, rw, bh, X, cy, ty, ry, jy, famColor} = L;
  // three example cells that light up in turn (first/mid/last of each dimension)
  const examples = [[0,1,0],[1,4,3],[2,6,1]].map(([a,b,c])=>[Math.min(a,texts.length-1),Math.min(b,rubs.length-1),Math.min(c,judges.length-1)]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;font:12px -apple-system,system-ui,sans-serif" role="img" class="process">`;
  s += `<style>
    .process .stage{opacity:0;animation:pin 9s ease-out infinite}
    .process .s1{animation-delay:.2s}.process .s2{animation-delay:.9s}.process .s3{animation-delay:1.6s}.process .s4{animation-delay:2.3s}.process .s5{animation-delay:3s}
    @keyframes pin{0%{opacity:0;transform:translateX(-6px)}6%{opacity:1;transform:none}100%{opacity:1}}
    .process .ex{opacity:0;animation:ex 9s linear infinite}
    .process .ex.e0{animation-delay:3.6s}.process .ex.e1{animation-delay:5.3s}.process .ex.e2{animation-delay:7s}
    @keyframes ex{0%{opacity:0}3%{opacity:1}16%{opacity:1}19%{opacity:0}100%{opacity:0}}
    .process .ex path{stroke-dasharray:6 4;animation:dash 1s linear infinite}
    @keyframes dash{to{stroke-dashoffset:-20}}
    .process .cnt{opacity:0;animation:pin 9s ease-out infinite;animation-delay:3.4s}
    @media (prefers-reduced-motion: reduce){.process .stage,.process .ex,.process .cnt{animation:none;opacity:1}.process .ex{opacity:.9}}
  </style>`;
  s += processTree(B, L, (k, inner) => `<g class="${k==='cnt'?'cnt':'stage '+k}">${inner}</g>`);
  // example paths that light up in turn
  examples.forEach(([a,b,c],i)=>{
    const col = famColor[rubs[b].family];
    s += `<g class="ex e${i}">`
      + curve(X[0]+bw, cy, X[1], ty[a], '', col, 2.5) + curve(X[1]+bw, ty[a], X[2], ry[b], '', col, 2.5)
      + curve(X[2]+rw, ry[b], X[3], jy[c], '', col, 2.5) + curve(X[3]+bw, jy[c], X[4], cy, '', col, 2.5)
      + `<rect x="${X[1]-3}" y="${ty[a]-bh/2-3}" width="${bw+6}" height="${bh+6}" rx="8" fill="none" stroke="${col}" stroke-width="2"/>`
      + `<rect x="${X[2]-3}" y="${ry[b]-bh/2-1}" width="${rw+6}" height="${bh+2}" rx="8" fill="none" stroke="${col}" stroke-width="2"/>`
      + `<rect x="${X[3]-3}" y="${jy[c]-bh/2-3}" width="${bw+6}" height="${bh+6}" rx="8" fill="none" stroke="${col}" stroke-width="2"/>`
      + T(X[2]+rw/2, H-14, `one cell: ${texts[a].label} · ${rubs[b].label} · ${judges[c].label}`, {anchor:'middle', fill:col, weight:600, size:11})
      + `</g>`;
  });
  s += '</svg>';
  el.innerHTML = `<details open class="process-card"><summary><b>How this page was made</b> <span class="muted small">one paper → ${texts.length} texts → ${rubs.length} rubric configs → ${judges.length} judges → ${B.n_cells} runs. Animates; three example cells light up in turn.</span></summary><div class="fig">${s}</div></details>`;
};
})();

// ---------- Zoom-in scenes: one animated explainer per dimension, with the real examples popping out ----------
(function(){
const PAL = ['#2b5fb8', '#b7851a', '#7a3e9d'];
const INK = '#1c1c1c', MUTED = '#6b6b6b', LINE = '#e4e4e0', BG = '#fafaf8';
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const key = (t,r,j) => `${t}|${r}|${j}`;
const LOOP = 14;  // seconds per scene loop
// every animated element carries data-d (delay in s) so the GIF exporter can reproduce a frame without CSS
const A = (d, inner, cls='a') => `<g class="${cls}" data-d="${d}" style="animation-delay:${d}s">${inner}</g>`;
const T = (x,y,s,o={}) => `<text x="${x}" y="${y}" fill="${o.fill||INK}" font-size="${o.size||12}" text-anchor="${o.anchor||'start'}" dominant-baseline="middle" font-weight="${o.weight||400}" ${o.mono?'font-family="ui-monospace,Menlo,monospace"':''}>${esc(s)}</text>`;
function wrap(s, n){ const out=[]; let line=''; for (const w of String(s).split(/\s+/)){ if ((line+' '+w).trim().length>n){ out.push(line.trim()); line=w; } else line+=' '+w; } if (line.trim()) out.push(line.trim()); return out; }
const lines = (x,y,arr,o={}) => arr.map((l,i)=>T(x, y+i*(o.lh||14), l, o)).join('');
const pill = (x,y,label,color) => `<rect x="${x}" y="${y-11}" width="${label.length*6.6+16}" height="22" rx="11" fill="${color}"/>${T(x+8+label.length*3.3, y, label, {fill:'#fff', weight:600, size:11, anchor:'middle'})}`;
const panel = (x,y,w,h,color) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="${color||LINE}" stroke-width="1.5"/>`;
const STYLE = `<style>
  .zoom .a{opacity:0;animation:zin ${LOOP}s ease-out infinite}
  .zoom .pop{opacity:0;transform-box:fill-box;transform-origin:center;animation:zpop ${LOOP}s ease-out infinite}
  @keyframes zin{0%{opacity:0;transform:translateY(4px)}4%{opacity:1;transform:none}94%{opacity:1}100%{opacity:0}}
  @keyframes zpop{0%{opacity:0;transform:scale(.6)}3%{opacity:1;transform:scale(1.12)}5%{transform:scale(1)}94%{opacity:1}100%{opacity:0}}
  @media (prefers-reduced-motion: reduce){.zoom .a,.zoom .pop{animation:none;opacity:1}}
</style>`;
const open = (w,h) => `<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;display:block;font:12px -apple-system,system-ui,sans-serif" role="img" class="zoom">${STYLE}`;
const first = (B, pred) => B.dims.rubric.find(pred);

// Scene 1: same passage, three extractors, then what came out of each
function sceneText(B){
  const W=1220, H=470; let s = open(W,H);
  const texts = B.dims.text, cw = 380, x0 = 20, gap = 20, top = 70;
  const rub = first(B, r=>r.family==='claim_audit') || B.dims.rubric[0];
  const judge = B.dims.judge.find(j=>j.model.includes('opus') && j.thinking==='high') || B.dims.judge[0];
  s += A(0, T(x0, 20, 'Zoom 1 · Text version: the same paper, three shapes', {weight:600, size:14}) + T(x0, 40, `The judge never sees the PDF, only a Document. Here is the same passage as each extractor delivered it, and what the same judge (${judge.label}) found in it with "${rub.label}".`, {fill:MUTED}));
  texts.forEach((t,i)=>{
    const x = x0 + i*(cw+gap), d = 0.8 + i*2.6;
    s += A(d, panel(x, top, cw, 150, PAL[0]) + T(x+12, top+18, t.label, {weight:600, size:13}) + T(x+12, top+36, t.note, {fill:MUTED, size:10}));
    // headings typed in one by one
    (t.headings||[]).slice(0,7).forEach((h,k)=> s += A(d+0.3+k*0.18, T(x+12, top+58+k*13, '§ ' + h.slice(0,52), {size:10, fill: h.length<4||/ﬁ|ﬂ|Are False|Front/.test(h)?PAL[1]:INK})));
    // the shared passage
    const snip = wrap(t.snippet||'', 60).slice(0,5);
    s += A(d+1.6, `<rect x="${x}" y="${top+162}" width="${cw}" height="88" rx="8" fill="${BG}" stroke="${LINE}"/>` + lines(x+12, top+180, snip, {size:10.5, mono:true, lh:15, fill: /ﬁ |ﬂ |The Essay section/.test(t.snippet||'')?'#5a3f00':INK}));
    if (/ﬁ |ﬂ |The Essay section/.test(t.snippet||'')) s += A(d+1.9, T(x+cw-12, top+262, 'ligatures split, sidebar text spliced into the sentence', {anchor:'end', fill:PAL[1], size:10, weight:600}));
    // outputs pop
    const c = B.cells[key(t.id, rub.id, judge.id)];
    if (c){
      const n = (c.results.problems&&c.results.problems.items||[]).length, hs = c.results.headline_survives && c.results.headline_survives.score;
      s += A(d+2.2, T(x+12, top+282, 'what came out:', {fill:MUTED, size:10}), 'a');
      s += A(d+2.3, pill(x+12, top+306, `${n} findings`, PAL[2]), 'pop');
      s += A(d+2.5, pill(x+120, top+306, `headline survives ${hs==null?'—':Math.round(hs)}`, PAL[0]), 'pop');
      const firstTitle = (c.results.problems&&c.results.problems.items||[])[0];
      if (firstTitle) s += A(d+2.7, lines(x+12, top+336, wrap('first finding: ' + firstTitle.title, 62).slice(0,3), {size:10.5, lh:14}));
    } else s += A(d+2.2, T(x+12, top+300, 'not run', {fill:MUTED}));
  });
  s += A(9.6, T(x0, H-22, 'Publisher XML and the LLM OCR agree almost sentence for sentence; the PDF text layer has broken ligatures, lost headings and spliced sidebars. Watch whether the numbers move with it.', {fill:MUTED, size:11}));
  return s + '</svg>';
}

// Scene 2: rubric config. Top: the one rule line that differs across claim-audit variants. Bottom: the one definition that differs across quality framings.
function sceneRubric(B){
  const W=1220, H=520; let s = open(W,H);
  const text = B.dims.text[0], judge = B.dims.judge.find(j=>j.model.includes('opus') && j.thinking==='high') || B.dims.judge[0];
  s += A(0, T(20, 20, 'Zoom 2 · Rubric config: change one line of the YAML, keep everything else', {weight:600, size:14}) + T(20, 40, `Same text (${text.label}), same judge (${judge.label}). Only the rubric file changes.`, {fill:MUTED}));
  // claim audit family
  const ca = B.families.find(f=>f.id==='claim_audit');
  if (ca){
    const rubs = ca.rubrics.map(id=>B.dims.rubric.find(r=>r.id===id));
    const base = rubs[0].rules;
    s += A(0.6, T(20, 70, 'Claim audit: how cautious is the hunter?', {weight:600, size:13}));
    rubs.forEach((r,i)=>{
      const x = 20 + i*395, d = 1 + i*2.2, extra = r.rules.replace(base, '').trim() || '(as shipped: no extra rule)';
      s += A(d, panel(x, 85, 375, 120, PAL[i]) + T(x+12, 103, r.label, {weight:600, size:12}) + T(x+12, 120, 'added to rules:', {fill:MUTED, size:10}) + lines(x+12, 136, wrap(extra, 58).slice(0,4), {size:10.5, mono:true, lh:14, fill: extra.startsWith('(')?MUTED:INK}));
      const c = B.cells[key(text.id, r.id, judge.id)];
      if (c){
        const items = c.results.problems.items||[], low = items.filter(it=>Number(it.confidence)<=0.3).length;
        s += A(d+1.2, pill(x+12, 225, `${items.length} findings`, PAL[2]), 'pop');
        s += A(d+1.4, pill(x+115, 225, `${low} at confidence ≤ 0.3`, low?PAL[1]:MUTED), 'pop');
        s += A(d+1.6, pill(x+265, 225, `headline ${Math.round(c.results.headline_survives.score)}`, PAL[0]), 'pop');
        const lowest = items.slice().sort((a,b)=>a.confidence-b.confidence)[0];
        if (lowest) s += A(d+1.8, lines(x+12, 250, wrap(`least confident: "${lowest.title}" (${Number(lowest.confidence).toFixed(2)})`, 60).slice(0,2), {size:10, lh:13, fill:MUTED}));
      }
    });
  }
  // quality framing family
  const gq = B.families.find(f=>f.id==='general_quality');
  if (gq){
    const rubs = gq.rubrics.map(id=>B.dims.rubric.find(r=>r.id===id)), crit = 'claims';
    s += A(7.4, T(20, 300, 'General quality: ask the same question three ways', {weight:600, size:13}) + T(20, 318, 'The "claims proportional to evidence" criterion, as each framing words it. Negative framing is reverse-scored on import, so the pill shows 100 − the judge\'s number.', {fill:MUTED, size:11}));
    rubs.forEach((r,i)=>{
      const x = 20 + i*395, d = 7.8 + i*1.6, cr = r.criteria.find(c=>c.id===crit);
      s += A(d, panel(x, 332, 375, 96, PAL[i]) + T(x+12, 350, r.variant, {weight:600, size:12}) + lines(x+12, 368, wrap(cr?cr.definition:'', 60).slice(0,4), {size:10.5, lh:14}));
      const c = B.cells[key(text.id, r.id, judge.id)];
      if (c && c.results[crit]) s += A(d+1.0, pill(x+12, 450, `${cr.name}: ${Math.round(c.results[crit].score)}${cr.reverse_scored?' (reversed)':''}`, PAL[i]), 'pop') + A(d+1.2, lines(x+12, 474, wrap(c.results[crit].rationale, 62).slice(0,2), {size:10, lh:13, fill:MUTED}));
    });
  }
  return s + '</svg>';
}

// Scene 3: judge. Same text, same rubric; four judges answer.
function sceneJudge(B){
  const W=1220, H=380; let s = open(W,H);
  const text = B.dims.text[0], rub = first(B, r=>r.family==='claim_audit') || B.dims.rubric[0];
  s += A(0, T(20, 20, 'Zoom 3 · Judge: same text, same rubric, four model x thinking settings', {weight:600, size:14}) + T(20, 40, `${text.label} · ${rub.label}. Each judge was a Claude Code subagent; low/high thinking was prompt-instructed.`, {fill:MUTED}));
  B.dims.judge.forEach((j,i)=>{
    const x = 20 + i*295, d = 0.8 + i*2.4, color = j.model.includes('opus') ? PAL[0] : PAL[1];
    s += A(d, panel(x, 60, 275, 290, color) + T(x+12, 78, j.label, {weight:600, size:12}) + T(x+12, 94, j.model, {fill:MUTED, size:10, mono:true}));
    const c = B.cells[key(text.id, rub.id, j.id)];
    if (!c){ s += A(d+0.5, T(x+12, 130, 'not run', {fill:MUTED})); return; }
    const items = c.results.problems.items||[];
    s += A(d+0.6, pill(x+12, 120, `${items.length} findings`, PAL[2]), 'pop');
    s += A(d+0.8, pill(x+112, 120, `headline ${Math.round(c.results.headline_survives.score)}`, PAL[0]), 'pop');
    s += A(d+1.0, pill(x+12, 148, `replicability ${Math.round(c.results.replicability.score)}`, color), 'pop');
    s += A(d+1.2, T(x+12, 176, 'severities:', {fill:MUTED, size:10}) + ['major','moderate','minor'].map((sv,k)=>T(x+80+k*62, 176, `${items.filter(it=>it.severity===sv).length} ${sv}`, {size:10})).join(''));
    s += A(d+1.4, lines(x+12, 200, wrap(c.overall_comment||'', 48).slice(0,9), {size:10, lh:13}));
  });
  s += A(11, T(20, H-14, 'Model matters more than thinking depth here: Sonnet rates the headline more generously; Opus writes longer audits.', {fill:MUTED, size:11}));
  return s + '</svg>';
}


// Scene 4: distribution of results for every rubric family, all cells at once
function sceneResults(B){
  const W=1220, H=560; let s = open(W,H);
  const judges = B.dims.judge, texts = B.dims.text;
  const cellsOf = r => { const o=[]; for (const t of texts) for (const j of judges){ const c=B.cells[key(t.id,r.id,j.id)]; if (c) o.push({t,j,c}); } return o; };
  const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : null;
  // strip plot: dots jittered in y, mean tick, min..max axis
  const strip = (x,y,w,label,vals,lo,hi,d,fmt) => {
    let o = A(d, T(x-8, y, label, {anchor:'end', size:11}) + `<line x1="${x}" y1="${y}" x2="${x+w}" y2="${y}" stroke="${LINE}"/>` + T(x, y+14, fmt?fmt(lo):lo, {fill:MUTED, size:9, anchor:'middle'}) + T(x+w, y+14, fmt?fmt(hi):hi, {fill:MUTED, size:9, anchor:'middle'}));
    vals.forEach((v,i)=>{ const px = x + w*(v.v-lo)/(hi-lo||1), jy = ((i*7)%9-4)*1.6; o += A(d+0.15+i*0.05, `<circle cx="${px}" cy="${y+jy}" r="4.5" fill="${v.color}" stroke="#fff" stroke-width="1.2"><title>${esc(v.title)}: ${v.v}</title></circle>`, 'pop'); });
    const m = mean(vals.map(v=>v.v)); if (m!=null){ const mx = x + w*(m-lo)/(hi-lo||1); o += A(d+0.3+vals.length*0.05, `<line x1="${mx}" y1="${y-11}" x2="${mx}" y2="${y+11}" stroke="${INK}" stroke-width="2"/>` + T(mx, y-18, `mean ${fmt?fmt(m):m.toFixed(1)}`, {anchor:'middle', size:9, fill:MUTED})); }
    return o;
  };
  s += A(0, T(20, 20, 'Zoom 4 · Results: how the numbers spread across every cell', {weight:600, size:14}) + T(20, 40, `One dot per run. Hue = rubric variant within the family; black tick = mean. ${B.n_done} runs in total.`, {fill:MUTED}));
  let y = 80;
  // Downs & Black
  const db = B.families.find(f=>f.id==='downs_black');
  if (db){
    const r = B.dims.rubric.find(x=>x.id===db.rubrics[0]), cs = cellsOf(r);
    s += A(0.6, T(20, y, db.label, {weight:600, size:13}) + T(20, y+16, `${cs.length} runs x ${r.criteria.length} items`, {fill:MUTED, size:10}));
    s += strip(300, y+10, 380, 'overall (0–100)', cs.map(x=>({v:Math.round((x.c.overall||0)*100), color:PAL[0], title:`${x.t.label} · ${x.j.label}`})), 0, 100, 0.9);
    // answer split across all boolean items
    const tally = {yes:0, unclear:0, no:0}; cs.forEach(x=> r.criteria.forEach(cr=>{ const res=x.c.results[cr.id]; if(!res) return; const a = cr.kind==='boolean' ? (res.answer||'unclear') : (res.normalized===0?'no':res.normalized>=0.5?'yes':'unclear'); tally[a]=(tally[a]||0)+1; }));
    const tot = tally.yes+tally.unclear+tally.no, bx = 760, bw = 420; let acc = 0;
    s += A(1.2, T(bx, y-6, 'all item answers', {fill:MUTED, size:10}));
    [['yes',PAL[0]],['unclear',PAL[1]],['no',LINE]].forEach(([k,col],i)=>{ const w = bw*tally[k]/tot; s += A(1.4+i*0.3, `<rect x="${bx+acc}" y="${y+2}" width="${Math.max(w-2,0)}" height="16" rx="3" fill="${col}"><title>${k}: ${tally[k]} of ${tot}</title></rect>` + (w>40 ? T(bx+acc+w/2, y+10, `${k} ${Math.round(100*tally[k]/tot)}%`, {anchor:'middle', size:10, fill: k==='no'?INK:'#fff', weight:600}) : '')); acc += w; });
    s += A(2.3, T(bx, y+30, `yes ${Math.round(100*tally.yes/tot)}% · unclear ${Math.round(100*tally.unclear/tot)}% · no ${Math.round(100*tally.no/tot)}% of ${tot} answers`, {fill:MUTED, size:10}) + T(bx, y+44, 'A checklist for intervention trials applied to a modelling essay: almost everything is "no / not applicable".', {fill:MUTED, size:10}));
    y += 90;
  }
  // Claim audit
  const ca = B.families.find(f=>f.id==='claim_audit');
  if (ca){
    const rubs = ca.rubrics.map(id=>B.dims.rubric.find(x=>x.id===id));
    const all = rubs.flatMap((r,ri)=>cellsOf(r).map(x=>({...x, ri})));
    s += A(2.8, T(20, y, ca.label, {weight:600, size:13}) + T(20, y+16, `${all.length} runs across ${rubs.length} variants`, {fill:MUTED, size:10}));
    s += A(3.0, rubs.map((r,i)=>`<rect x="20" y="${y+30+i*15}" width="10" height="10" rx="2" fill="${PAL[i]}"/>` + T(36, y+35+i*15, r.variant, {size:10, fill:MUTED})).join(''));
    const maxN = Math.max(...all.map(x=>(x.c.results.problems.items||[]).length), 1);
    s += strip(300, y+10, 380, 'findings per run', all.map(x=>({v:(x.c.results.problems.items||[]).length, color:PAL[x.ri], title:`${x.t.label} · ${rubs[x.ri].variant} · ${x.j.label}`})), 0, maxN, 3.2, v=>Number(v).toFixed(0));
    s += strip(300, y+60, 380, 'headline survives', all.map(x=>({v:Math.round(x.c.results.headline_survives.score), color:PAL[x.ri], title:`${x.t.label} · ${rubs[x.ri].variant} · ${x.j.label}`})), 0, 100, 5.2, v=>Number(v).toFixed(0));
    s += strip(300, y+110, 380, 'replicability', all.map(x=>({v:Math.round(x.c.results.replicability.score), color:PAL[x.ri], title:`${x.t.label} · ${rubs[x.ri].variant} · ${x.j.label}`})), 0, 100, 7.2, v=>Number(v).toFixed(0));
    // severity mix and confidence histogram
    const items = all.flatMap(x=>(x.c.results.problems.items||[])); const sev = {major:0,moderate:0,minor:0}; items.forEach(it=>sev[it.severity]=(sev[it.severity]||0)+1);
    const bx = 760, bw = 420; let acc=0;
    s += A(3.4, T(bx, y-6, `severity of all ${items.length} findings`, {fill:MUTED, size:10}));
    [['major','#8a2a1c'],['moderate',PAL[1]],['minor',LINE]].forEach(([k,col],i)=>{ const w = bw*sev[k]/items.length; s += A(3.6+i*0.3, `<rect x="${bx+acc}" y="${y+2}" width="${Math.max(w-2,0)}" height="16" rx="3" fill="${col}"><title>${k}: ${sev[k]}</title></rect>` + (w>50 ? T(bx+acc+w/2, y+10, `${k} ${sev[k]}`, {anchor:'middle', size:10, fill:k==='minor'?INK:'#fff', weight:600}) : '')); acc += w; });
    const bins = [0,0,0,0,0]; items.forEach(it=>bins[Math.min(4, Math.floor(Number(it.confidence)*5))]++); const bmax = Math.max(...bins,1);
    s += A(5.4, T(bx, y+44, 'confidence of findings (0–1)', {fill:MUTED, size:10}));
    bins.forEach((n,i)=>{ const h = 60*n/bmax; s += A(5.6+i*0.2, `<rect x="${bx+i*84}" y="${y+120-h}" width="76" height="${h}" rx="4" fill="${PAL[2]}"><title>${(i/5).toFixed(1)}–${((i+1)/5).toFixed(1)}: ${n}</title></rect>` + T(bx+i*84+38, y+130, `${(i/5).toFixed(1)}–${((i+1)/5).toFixed(1)}`, {anchor:'middle', size:9, fill:MUTED}) + (n ? T(bx+i*84+38, y+114-h, n, {anchor:'middle', size:9, fill:MUTED}) : '')); });
    y += 170;
  }
  // General quality
  const gq = B.families.find(f=>f.id==='general_quality');
  if (gq){
    const rubs = gq.rubrics.map(id=>B.dims.rubric.find(x=>x.id===id)), crits = rubs[0].criteria;
    const all = rubs.flatMap((r,ri)=>cellsOf(r).map(x=>({...x, ri})));
    s += A(8.2, T(20, y, gq.label, {weight:600, size:13}) + T(20, y+16, `${all.length} runs x ${crits.length} criteria; negative framing reverse-scored`, {fill:MUTED, size:10}));
    s += A(8.4, rubs.map((r,i)=>`<rect x="20" y="${y+30+i*15}" width="10" height="10" rx="2" fill="${PAL[i]}"/>` + T(36, y+35+i*15, r.variant, {size:10, fill:MUTED})).join(''));
    const cw = 7, colw = 118, x0 = 300;
    crits.forEach((cr,ci)=>{
      const x = x0 + ci*colw, d = 8.6 + ci*0.5;
      s += A(d, T(x+colw/2-8, y, cr.name.replace('Claims proportional to evidence','Claims vs evidence').replace('Appropriateness of design','Design').replace('Clarity of research question','Clarity').replace('Transparency and reproducibility','Transparency').replace('Honesty about limitations','Limitations').replace('Statistical rigor','Stats'), {anchor:'middle', size:10, weight:600}) + `<line x1="${x+colw/2-8}" y1="${y+14}" x2="${x+colw/2-8}" y2="${y+134}" stroke="${LINE}"/>` + T(x+colw/2+4, y+16, '100', {size:8, fill:MUTED}) + T(x+colw/2+4, y+134, '0', {size:8, fill:MUTED}));
      const vals = all.map(x=>({v:x.c.results[cr.id]?x.c.results[cr.id].score:null, ri:x.ri, title:`${x.t.label} · ${rubs[x.ri].variant} · ${x.j.label}`})).filter(v=>v.v!=null);
      vals.forEach((v,i)=>{ const py = y+134-120*v.v/100, jx = ((i*5)%11-5)*2.2; s += A(d+0.1+i*0.02, `<circle cx="${x+colw/2-8+jx}" cy="${py}" r="3.5" fill="${PAL[v.ri]}" stroke="#fff" stroke-width="1"><title>${esc(v.title)}: ${v.v}</title></circle>`, 'pop'); });
      rubs.forEach((r,ri)=>{ const m = mean(vals.filter(v=>v.ri===ri).map(v=>v.v)); if (m!=null) s += A(d+0.9, `<line x1="${x+colw/2-8-16}" y1="${y+134-120*m/100}" x2="${x+colw/2-8+16}" y2="${y+134-120*m/100}" stroke="${PAL[ri]}" stroke-width="2"/>`); });
    });
    s += A(12.4, T(300, y+156, 'Coloured ticks = mean per framing. The spread within a framing (judge x text) is usually wider than the gap between framings, except on claims, design and novelty.', {fill:MUTED, size:10}));
  }
  return s + '</svg>';
}

// Scene 0: the story. Acts on one canvas: pipeline, then flip text / rubric / judge with live A/B numbers, then a scoreboard.
// Elements carry data-d (show at) and data-e (hide at); a JS ticker drives opacity on the page, the exporter reads the same attributes.
function sceneStory(B){
  const W=1220, H=520, LOOPS=24; let s = open(W,H).replace('class="zoom"','class="zoom story"');
  const V = (d,e,inner) => `<g data-d="${d}" data-e="${e}" style="opacity:0">${inner}</g>`;
  const mean = a => a.length ? a.reduce((x,y)=>x+y,0)/a.length : null;
  const texts=B.dims.text, rubs=B.dims.rubric, judges=B.dims.judge;
  const big = (x,y,label,color,w) => { w = w || label.length*9+22; return `<rect x="${x}" y="${y-15}" width="${w}" height="30" rx="15" fill="${color}"/>${T(x+w/2, y, label, {fill:'#fff', weight:700, size:14, anchor:'middle'})}`; };
  const ca = B.families.find(f=>f.id==='claim_audit'), gq = B.families.find(f=>f.id==='general_quality'), db = B.families.find(f=>f.id==='downs_black');
  const caRubs = ca ? ca.rubrics.map(id=>rubs.find(r=>r.id===id)) : [], gqRubs = gq ? gq.rubrics.map(id=>rubs.find(r=>r.id===id)) : [];
  const cell = (t,r,j) => B.cells[key(t,r,j)];
  const opusHigh = judges.find(j=>j.model.includes('opus')&&j.thinking==='high') || judges[0];

  // ---- effect sizes, all from the blob ----
  // text: mean range of headline_survives across the 3 texts, over every (claim-audit variant, judge)
  const tA = texts.find(t=>t.id==='europepmc_jats') || texts[0], tB = texts.find(t=>t.id==='pymupdf') || texts[1] || texts[0];
  const textDiffs = []; caRubs.forEach(r=>judges.forEach(j=>{ const a=cell(tA.id,r.id,j.id), b=cell(tB.id,r.id,j.id); if (a&&b) textDiffs.push(b.results.headline_survives.score-a.results.headline_survives.score); }));
  const textEffect = mean(textDiffs);
  // sign: mean(negative reversed) - mean(neutral) across all 7 criteria x 12 cells; positive likewise
  const gqShift = ri => { const d=[]; if (!gqRubs.length) return 0; for (const c of gqRubs[0].criteria) for (const t of texts) for (const j of judges){ const a=cell(t.id,gqRubs[0].id,j.id), b=cell(t.id,gqRubs[ri].id,j.id); if (a&&b&&a.results[c.id]&&b.results[c.id]) d.push(b.results[c.id].score-a.results[c.id].score); } return mean(d); };
  const negEffect = gqShift(2), posEffect = gqShift(1);
  // judge: Sonnet - Opus on headline_survives over all claim-audit cells
  const hsBy = m => { const v=[]; caRubs.forEach(r=>texts.forEach(t=>judges.filter(j=>j.model.includes(m)).forEach(j=>{ const c=cell(t.id,r.id,j.id); if (c) v.push(c.results.headline_survives.score); }))); return mean(v); };
  const judgeEffect = hsBy('sonnet') - hsBy('opus');
  // thinking: high - low on headline_survives
  const hsByT = th => { const v=[]; caRubs.forEach(r=>texts.forEach(t=>judges.filter(j=>j.thinking===th).forEach(j=>{ const c=cell(t.id,r.id,j.id); if (c) v.push(c.results.headline_survives.score); }))); return mean(v); };
  const thinkEffect = hsByT('high') - hsByT('low');
  // checklist fit: share of Downs & Black answers that are "no"
  let dbNo=0, dbTot=0; if (db){ const r=rubs.find(x=>x.id===db.rubrics[0]); texts.forEach(t=>judges.forEach(j=>{ const c=cell(t.id,r.id,j.id); if(!c) return; r.criteria.forEach(cr=>{ const x=c.results[cr.id]; if(!x) return; dbTot++; if ((cr.kind==='boolean'&&x.answer==='no')||(cr.kind!=='boolean'&&x.normalized===0)) dbNo++; }); })); }

  // ---- compact pipeline (persists; one column lights up per act) ----
  const X=[30,250,470,720,960], bw=170, cy=110;
  const ys=(n,gap)=>Array.from({length:n},(_,i)=>cy+(i-(n-1)/2)*gap);
  const ty=ys(texts.length,34), ry=ys(rubs.length,22), jy=ys(judges.length,30);
  const famColor = Object.fromEntries(B.families.map((f,i)=>[f.id, PAL[i%3]]));
  const mini = (x,y,w,h,label,color,fill) => `<rect x="${x}" y="${y-h/2}" width="${w}" height="${h}" rx="5" fill="${fill||'#fff'}" stroke="${color}" stroke-width="1.5"/>${T(x+w/2, y, label, {anchor:'middle', size:10, weight:600, fill: fill?'#fff':INK})}`;
  const cv = (x1,y1,x2,y2,c,w) => { const mx=(x1+x2)/2; return `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="${c||LINE}" stroke-width="${w||1}"/>`; };
  let tree = '';
  texts.forEach((t,i)=> tree += cv(X[0]+bw, cy, X[1], ty[i]));
  texts.forEach((t,i)=> rubs.forEach((r,j)=> tree += cv(X[1]+bw, ty[i], X[2], ry[j])));
  rubs.forEach((r,j)=> judges.forEach((jj,k)=> tree += cv(X[2]+bw, ry[j], X[3], jy[k])));
  judges.forEach((jj,k)=> tree += cv(X[3]+bw, jy[k], X[4], cy));
  tree += mini(X[0], cy, bw, 34, 'Ioannidis 2005', INK);
  texts.forEach((t,i)=> tree += mini(X[1], ty[i], bw, 26, t.label, PAL[0]));
  rubs.forEach((r,j)=> tree += mini(X[2], ry[j], bw, 18, r.label.length>22?r.label.slice(0,21)+'…':r.label, famColor[r.family]));
  judges.forEach((jj,k)=> tree += mini(X[3], jy[k], bw, 26, jj.label, PAL[2]));
  tree += mini(X[4], cy, 200, 44, `${B.n_cells} runs`, INK, INK);
  const hdr = (x,label) => T(x+bw/2, 30, label, {anchor:'middle', fill:MUTED, size:11});
  // act timings
  const T1=[0,4], T2=[4,9.5], T3=[9.5,15.5], T4=[15.5,20], T5=[20,24];
  s += V(0, LOOPS, tree + hdr(X[0],'paper') + hdr(X[1],`${texts.length} text versions`) + hdr(X[2],`${rubs.length} rubric configs`) + hdr(X[3],`${judges.length} judges`) + T(X[4]+100, 30, `${texts.length} × ${rubs.length} × ${judges.length}`, {anchor:'middle', fill:MUTED, size:11}));
  const glow = (x,y0,y1,w) => `<rect x="${x-8}" y="${y0-22}" width="${w+16}" height="${y1-y0+44}" rx="12" fill="none" stroke="${PAL[1]}" stroke-width="3"/>`;
  s += V(T1[0], T1[1], T(W/2, 200, 'Same paper. One dimension flipped at a time. What moves the number?', {anchor:'middle', size:16, weight:600}));

  // ---- act 2: flip the text ----
  const r1 = caRubs[0] || rubs[0];
  s += V(T2[0], T2[1], glow(X[1], ty[0], ty[ty.length-1], bw) + T(30, 200, 'Flip the text', {size:18, weight:700}) + T(30, 222, `${r1.label} · ${opusHigh.label}`, {fill:MUTED, size:11}));
  texts.forEach((t,i)=>{
    const x = 30 + i*395, c = cell(t.id, r1.id, opusHigh.id), d = T2[0]+0.6+i*0.9;
    const snip = wrap((t.snippet||'').slice(0,150), 48).slice(0,3);
    const bad = /ﬁ |ﬂ |The Essay section/.test(t.snippet||'');
    s += V(d, T2[1], `<rect x="${x}" y="240" width="370" height="64" rx="8" fill="${BG}" stroke="${bad?PAL[1]:LINE}" stroke-width="${bad?2:1}"/>` + T(x+10, 252, t.label, {weight:600, size:11}) + lines(x+10, 270, snip, {size:9.5, mono:true, lh:13, fill: bad?'#5a3f00':INK}));
    if (c) s += V(d+0.5, T2[1], big(x, 340, `headline ${Math.round(c.results.headline_survives.score)}`, PAL[0]) + big(x+160, 340, `${(c.results.problems.items||[]).length} findings`, PAL[2]));
  });
  s += V(T2[0]+3.6, T2[1], T(30, 400, `broken ligatures, spliced sidebar → ${textEffect>=0?'+':''}${textEffect!=null?textEffect.toFixed(0):'?'} pts (${tB.label} vs ${tA.label}, all claim-audit cells)`, {size:14, weight:600, fill:PAL[1]}));

  // ---- act 3: flip the rubric ----
  s += V(T3[0], T3[1], glow(X[2], ry[0], ry[ry.length-1], bw) + T(30, 200, 'Flip the rubric', {size:18, weight:700}) + T(30, 222, `${texts[0].label} · ${opusHigh.label}`, {fill:MUTED, size:11}));
  // left: claim audit one-line rule → findings / low-confidence
  caRubs.forEach((r,i)=>{
    const c = cell(texts[0].id, r.id, opusHigh.id), d = T3[0]+0.5+i*0.8, y = 250+i*58;
    const extra = r.rules.replace(caRubs[0].rules,'').trim() || 'as shipped';
    s += V(d, T3[1], `<rect x="30" y="${y-14}" width="430" height="48" rx="8" fill="${BG}" stroke="${PAL[i]}" stroke-width="1.5"/>` + T(40, y, r.variant, {weight:600, size:11, fill:PAL[i]}) + lines(40, y+15, [extra.length>66?extra.slice(0,65)+'…':extra], {size:9.5, mono:true}));
    if (c){ const items=c.results.problems.items||[], low=items.filter(it=>Number(it.confidence)<=0.3).length; s += V(d+0.4, T3[1], big(472, y+4, `${items.length} found · ${low} low-conf`, low?PAL[1]:MUTED, 150)); }
  });
  s += V(T3[0]+3.2, T3[1], T(30, 440, 'how cautious the hunter is → same count, confidence tags move', {size:13, weight:600, fill:MUTED}));
  // right: the framing slope chart, three lines, no axis clutter
  if (gqRubs.length){
    const crits = gqRubs[0].criteria, gx=650, gw=520, gy=250, gh=170;
    const px = i => gx + gw*i/(crits.length-1), py = v => gy + gh*(1-v/100);
    s += V(T3[0]+0.3, T3[1], T(gx, 232, 'same 7 questions, asked three ways (mean of 12 runs)', {fill:MUTED, size:11}) + crits.map((c,i)=>T(px(i), gy+gh+12, c.name.split(' ')[0], {anchor:'middle', fill:MUTED, size:10})).join(''));
    gqRubs.forEach((r,ri)=>{
      const pts = crits.map(c=>{ const v=[]; texts.forEach(t=>judges.forEach(j=>{ const x=cell(t.id,r.id,j.id); if (x&&x.results[c.id]&&x.results[c.id].score!=null) v.push(x.results[c.id].score); })); return mean(v); });
      s += V(T3[0]+1.2+ri*1.0, T3[1], `<path d="${pts.map((v,i)=>`${i?'L':'M'}${px(i)},${py(v)}`).join(' ')}" fill="none" stroke="${PAL[ri]}" stroke-width="2.5"/>` + pts.map((v,i)=>`<circle cx="${px(i)}" cy="${py(v)}" r="4" fill="${PAL[ri]}" stroke="#fff" stroke-width="1.5"/>`).join('') + T(gx+gw+8, py(pts[pts.length-1]) + (ri===1?-8:ri===2?8:0), r.variant.replace(/^v\d /,''), {fill:PAL[ri], weight:600, size:11}));
    });
    s += V(T3[0]+4.4, T3[1], T(gx, 460, `ask "how weak" instead of "how good" → ${negEffect.toFixed(0)} pts`, {size:14, weight:600, fill:PAL[2]}));
  }

  // ---- act 4: flip the judge ----
  s += V(T4[0], T4[1], glow(X[3], jy[0], jy[jy.length-1], bw) + T(30, 200, 'Flip the judge', {size:18, weight:700}) + T(30, 222, `${texts[0].label} · ${r1.label}`, {fill:MUTED, size:11}));
  judges.forEach((j,i)=>{
    const c = cell(texts[0].id, r1.id, j.id), x = 30 + i*295, d = T4[0]+0.5+i*0.6, color = j.model.includes('opus')?PAL[0]:PAL[1];
    s += V(d, T4[1], `<rect x="${x}" y="240" width="270" height="110" rx="8" fill="#fff" stroke="${color}" stroke-width="1.5"/>` + T(x+12, 258, j.label, {weight:600, size:12}));
    if (c) s += V(d+0.3, T4[1], big(x+12, 300, `headline ${Math.round(c.results.headline_survives.score)}`, color) + T(x+12, 332, `${(c.results.problems.items||[]).length} findings · replicability ${Math.round(c.results.replicability.score)}`, {size:10.5, fill:MUTED}));
  });
  s += V(T4[0]+3, T4[1], T(30, 400, `Sonnet vs Opus → ${judgeEffect>=0?'+':''}${judgeEffect.toFixed(0)} pts   ·   high vs low thinking → ${thinkEffect>=0?'+':''}${thinkEffect.toFixed(0)} pts`, {size:14, weight:600, fill:PAL[1]}));

  // ---- act 5: scoreboard ----
  const bars = [
    {label:'text version', v: textEffect||0, color: PAL[0], note:`${tB.label} − ${tA.label}`},
    {label:'thinking depth', v: thinkEffect||0, color: PAL[2], note:'high − low'},
    {label:'question sign', v: negEffect||0, color: PAL[2], note:'"how weak" − neutral'},
    {label:'judge model', v: judgeEffect||0, color: PAL[1], note:'Sonnet − Opus'},
  ];
  const sx=330, sw=560, sy0=212, sh=40, mx=Math.max(20, ...bars.map(b=>Math.abs(b.v)));
  s += V(T5[0], LOOPS, T(30, 200, 'What moves the number (points on 0–100)', {size:18, weight:700}));
  bars.forEach((b,i)=>{ const y=sy0+i*sh+20, w=sw/2*Math.abs(b.v)/mx, x0=sx+sw/2, x=b.v<0?x0-w:x0;
    s += V(T5[0]+0.4+i*0.5, LOOPS, T(sx-12, y, b.label, {anchor:'end', size:12, weight:600}) + `<rect x="${x}" y="${y-13}" width="${Math.max(w,2)}" height="26" rx="5" fill="${b.color}"/>` + T(b.v<0?x-8:x+w+8, y, `${b.v>=0?'+':''}${b.v.toFixed(0)}`, {anchor:b.v<0?'end':'start', size:13, weight:700}) + T(sx+sw+70, y, b.note, {size:10, fill:MUTED})); });
  s += V(T5[0], LOOPS, `<line x1="${sx+sw/2}" y1="${sy0}" x2="${sx+sw/2}" y2="${sy0+bars.length*sh+6}" stroke="${INK}"/>`);
  if (dbTot) s += V(T5[0]+2.6, LOOPS, T(30, sy0+bars.length*sh+34, `and a checklist for the wrong study type: ${Math.round(100*dbNo/dbTot)}% of Downs & Black answers are "no"`, {size:13, weight:600, fill:MUTED}));
  const ranked = bars.slice().sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
  s += V(T5[0]+3.2, LOOPS, T(30, H-24, `biggest lever: ${ranked[0].label} (${ranked[0].v>=0?'+':''}${ranked[0].v.toFixed(0)}) · smallest: ${ranked[ranked.length-1].label} (${ranked[ranked.length-1].v>=0?'+':''}${ranked[ranked.length-1].v.toFixed(0)})`, {size:15, weight:700}));
  return s + '</svg>';
}

// ---------- Tour: one canvas, a camera that zooms through the pipeline ----------
// The timeline lives in one plan (built with the scene) and one pure function tourState(t); the page ticker and the
// exporter both call it. Elements carry data-id; the root <g class="cam"> gets the camera transform.
const TW = 1220, TH = 620;
let TOUR = null;   // {loop, kf:[[t, cam]], tilt:[[t, p]], els:[{id,d,e,v,fi,fo}], toks:[{id,segs,d,dur}]}
// fake 3D turn of the tree card about its vertical axis: scaleX(cos θ), a small skewY, uniform shrink and a shift, all scaled by progress p in 0..1
const TILT = {deg:55, pivot:[610,230], u:0.64, shift:[-95,128], skew:0.12};
function tiltMatrix(p){
  const th = TILT.deg*Math.PI/180*p, c = Math.cos(th), k = TILT.skew*Math.tan(th), u = 1-(1-TILT.u)*p, [px,py] = TILT.pivot, sx = TILT.shift[0]*p, sy = TILT.shift[1]*p;
  const a = u*c, b = u*k*c, d = u;
  return `matrix(${a.toFixed(4)} ${b.toFixed(4)} 0 ${d.toFixed(4)} ${(px+sx-a*px).toFixed(2)} ${(py+sy-d*py-b*px).toFixed(2)})`;
}
function camFor(r, pad=0){ const s = Math.min(TW/r.w, TH/r.h)*(1-pad); return {x: r.x+r.w/2, y: r.y+r.h/2, scale: s}; }
const camTransform = c => `translate(${(TW/2-c.x*c.scale).toFixed(2)},${(TH/2-c.y*c.scale).toFixed(2)}) scale(${c.scale.toFixed(4)})`;
const ease = u => (1-Math.cos(Math.PI*Math.max(0,Math.min(1,u))))/2;
const bez = ([x1,y1,x2,y2], u) => { const mx=(x1+x2)/2, v=1-u; return [v*v*v*x1+3*v*v*u*mx+3*v*u*u*mx+u*u*u*x2, v*v*v*y1+3*v*v*u*y1+3*v*u*u*y2+u*u*u*y2]; };
function tourState(t){
  const P = TOUR; t = ((t % P.loop) + P.loop) % P.loop;
  // camera: keyframes [time, cam]; ease-in-out between, scale interpolated geometrically
  let cam = P.kf[P.kf.length-1][1];
  for (let i=0; i<P.kf.length-1; i++){ const [t0,a] = P.kf[i], [t1,b] = P.kf[i+1]; if (t>=t0 && t<t1){ const u = ease((t-t0)/(t1-t0)); cam = {x: a.x+(b.x-a.x)*u, y: a.y+(b.y-a.y)*u, scale: a.scale*Math.pow(b.scale/a.scale, u)}; break; } }
  let tp = 0;
  for (let i=0; i<P.tilt.length-1; i++){ const [t0,a] = P.tilt[i], [t1,b] = P.tilt[i+1]; if (t>=t0 && t<t1){ tp = a+(b-a)*ease((t-t0)/(t1-t0)); break; } }
  const op = {}, at = {};
  for (const e of P.els){ if (t<e.d || t>=e.e) continue; const a = e.fi ? Math.min(1,(t-e.d)/e.fi) : 1, z = e.fo ? Math.min(1,(e.e-t)/e.fo) : 1; op[e.id] = Math.max(op[e.id]||0, e.v*Math.min(a,z)); }
  for (const k of P.toks){ if (t<k.d || t>=k.d+k.dur) continue; let u = (t-k.d)/k.dur*k.segs.length; const i = Math.min(k.segs.length-1, Math.floor(u)); at[k.id] = bez(k.segs[i], ease(u-i)); op[k.id] = 1; }
  return {cam, transform: camTransform(cam), tilt: tp, tiltTransform: tiltMatrix(tp), op, at, show: new Set(Object.keys(op).filter(k=>op[k]>0.001))};
}
window.playTourState = tourState;

function sceneTour(B){
  const texts=B.dims.text, rubs=B.dims.rubric, judges=B.dims.judge;
  const L = window.playProcessLayout(B), {bw, rw, bh, X, cy, ty, ry, jy, famColor} = L;
  const LOOP_T = 48, els = [], toks = [];
  const V = (id, d, e, inner, o={}) => { els.push({id, d, e, v: o.v==null?1:o.v, fi: o.fi==null?.25:o.fi, fo: o.fo==null?.25:o.fo}); return `<g data-id="${id}" style="opacity:0">${inner}</g>`; };
  const tok = (id, segs, d, dur, inner) => { toks.push({id, segs, d, dur}); return `<g data-id="${id}" style="opacity:0">${inner}</g>`; };
  const cell = (t,r,j) => B.cells[key(t,r,j)];
  const opusHigh = judges.find(j=>j.model.includes('opus')&&j.thinking==='high') || judges[0];
  const si = Math.max(0, texts.findIndex(t=>t.id==='europepmc_jats')), sel = texts[si];
  const qi = Math.max(0, rubs.findIndex(r=>r.id==='general_quality_v1_neutral')), qr = rubs[qi];
  const gq = B.families.find(f=>f.id==='general_quality'), gqIdx = gq ? gq.rubrics.map(id=>rubs.findIndex(r=>r.id===id)).filter(i=>i>=0) : [];
  const docTok = `<g transform="scale(1.5)"><rect x="-4" y="-5" width="8" height="10" rx="1.2" fill="${PAL[0]}"/><line x1="-2.2" y1="-2" x2="2.2" y2="-2" stroke="#fff" stroke-width=".8"/><line x1="-2.2" y1="0.3" x2="2.2" y2="0.3" stroke="#fff" stroke-width=".8"/><line x1="-2.2" y1="2.6" x2="1" y2="2.6" stroke="#fff" stroke-width=".8"/></g>`;
  const headingsOf = t => Array.isArray(t.headings) ? t.headings : [...String(t.headings||'').matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].map(m=>m[1]!=null?m[1]:m[2]);
  const clip = (s,n) => s.length>n ? s.slice(0,n-1)+'…' : s;
  const scorePill = (x,y,label,color,h=9,size=5.5) => { const w = label.length*size*0.62+h; return `<rect x="${x}" y="${y-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="${color}"/>${T(x+w/2, y, label, {fill:'#fff', weight:700, size, anchor:'middle'})}`; };

  // camera targets
  // the tree is drawn OY lower than its own layout so the overview sits balanced above the chart thumbnail (bottom right)
  const OY = 40, sh = r => ({...r, y: r.y+OY});
  const R = {
    paper: {x:8, y:192, w:180, h:232},
    text:  {x:170, y:122, w:420, h:216},
    trans: {x:160, y:70, w:600, h:310},
    rub:   {x:380, y:84, w:560, h:296},
    det:   {x:664, y:ry[qi]-20, w:304, h:154},
  };
  const C = Object.fromEntries(Object.entries(R).map(([k,r])=>[k, camFor(sh(r), k==='det'?0.01:0.03)]));
  C.ov = camFor({x:0, y:0, w:TW, h:TH}); C.chart = camFor({x:802, y:466, w:408, h:156}, 0.02);
  const kf = [[0,C.ov],[4,C.ov],[5,C.paper],[7,C.paper],[7.8,C.ov],[8,C.ov],[9,C.text],[13.2,C.text],[14.3,C.trans],[14.7,C.trans],[15.5,C.rub],[18,C.rub],[19,C.det],[29,C.det],[30,C.ov],[36,C.ov],[37,C.chart],[41,C.chart],[41.8,C.ov],[LOOP_T,C.ov]];
  // step 8: tilt the card (41.8–43), stack one copy per paper behind it (43.1–45.9), hold, untilt in the last 0.5 s
  const tilt = [[0,0],[41.8,0],[43,1],[LOOP_T-0.5,1],[LOOP_T,0]];

  let s = `<svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${TW} ${TH}" width="100%" style="max-width:${TW}px;display:block;font:12px -apple-system,system-ui,sans-serif;background:#fff" role="img" class="zoom tour"><g class="cam">`;
  s += `<defs><g id="tourTree">${window.playProcessTree(B, L, (k, inner) => inner)}</g></defs>`;
  s += `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#fff"/><g transform="translate(0,${OY})"><g class="tilt">`;
  // 8. the stack: one copy of the tree per paper, receding up and to the right; opaque cards so each one hides the next
  const NCOPY = 24, cdx = 22, cdy = -18, card = {x:4, y:-10, w:1212, h:450}, TS = 1/Math.cos(TILT.deg*Math.PI/180);
  const titles = [B.paper.title, ...(B.other_papers||[]).map(p=>p.title)];
  const paperLabel = k => clip(String(titles[k] || `paper ${k+1}`), 30);
  const tStack = 43.1, tGap = 0.12;
  const cardLabel = (k, sk) => `<text transform="translate(${card.x+8},${card.y+8}) scale(${TS},1)" font-size="${(9/(sk*TILT.u)).toFixed(2)}" fill="${INK}" font-weight="600" dominant-baseline="middle">${esc(paperLabel(k))}</text>`;
  for (let k=NCOPY-1; k>=1; k--){
    const sk = Math.pow(0.955, k), ax = card.x+card.w, ay = card.y;   // shrink about the card's top-right corner so every top strip stays visible
    s += V(`cp${k}`, tStack+(k-1)*tGap, LOOP_T-0.3, `<g transform="translate(${(cdx*k+ax*(1-sk)).toFixed(2)},${(cdy*k+ay*(1-sk)).toFixed(2)}) scale(${sk.toFixed(4)})"><rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="10" fill="#fff" stroke="${MUTED}" stroke-width="${(1.2/sk).toFixed(2)}"/><use href="#tourTree" xlink:href="#tourTree"/>${cardLabel(k, sk)}</g>`, {v: 0.85-0.70*(k-1)/(NCOPY-2), fo:.3});   // copies are gone before the untilt gets far, so the cut stays clean
  }
  s += V('card0', 42.2, LOOP_T, `<rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="10" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`, {fo:.5}) + V('lab0', 42.9, LOOP_T-0.3, cardLabel(0, 1), {fo:.3});   // label once the turn is done (its counter-scale assumes the full turn)
  // 1. overview: the process tree, stages appearing left to right; everything but the paper fades during the final zoom-out
  const stageT = {s1:-1, s2:.6, s3:1.2, s4:1.8, s5:2.4, cnt:2.8};
  s += window.playProcessTree(B, L, (k, inner) => V(k, stageT[k], k==='s1' ? LOOP_T+1 : LOOP_T, inner, {fi:.4, fo:.5}));

  // 2. the paper as a mock PDF page
  const px=38, py=268, pw=114, ph=148, c1=px+8, cw=(pw-20)/2, c2=c1+cw+4;
  s += V('pdf0', 5.0, 7.5, `<rect x="${px+2}" y="${py+2}" width="${pw}" height="${ph}" fill="${LINE}"/><rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#fff" stroke="${INK}" stroke-width=".8"/><path d="M${px+pw/2-6},${py-8} L${px+pw/2},${py-2} L${px+pw/2+6},${py-8}" fill="none" stroke="${MUTED}" stroke-width="1"/>`);
  s += V('pdf1', 5.3, 7.5, `<rect x="${c1}" y="${py+8}" width="${pw-16}" height="6" rx="1" fill="${INK}"/><rect x="${c1}" y="${py+17}" width="${(pw-16)*0.55}" height="2.5" rx="1" fill="${MUTED}"/>`);
  let ln = '';
  for (let y=py+26; y<py+ph-8; y+=4.2){ if (!(y>py+66 && y<py+96)) ln += `<rect x="${c1}" y="${y}" width="${cw}" height="1.5" fill="#c9c9c4"/>`; if (!(y>py+36 && y<py+70)) ln += `<rect x="${c2}" y="${y}" width="${y>py+ph-14?cw*0.6:cw}" height="1.5" fill="#c9c9c4"/>`; }
  s += V('pdf2', 5.6, 7.5, ln);
  let tb = `<rect x="${c1}" y="${py+68}" width="${cw}" height="26" fill="#fff" stroke="${MUTED}" stroke-width=".5"/><rect x="${c1}" y="${py+68}" width="${cw}" height="6.5" fill="${LINE}"/>`;
  for (let k=1;k<4;k++) tb += `<line x1="${c1}" y1="${py+68+k*6.5}" x2="${c1+cw}" y2="${py+68+k*6.5}" stroke="${MUTED}" stroke-width=".4"/>`;
  for (let k=1;k<3;k++) tb += `<line x1="${c1+k*cw/3}" y1="${py+68}" x2="${c1+k*cw/3}" y2="${py+94}" stroke="${MUTED}" stroke-width=".4"/>`;
  s += V('pdf3', 6.0, 7.5, tb);
  const gx=c2+3, gy=py+64, gw=cw-6;
  s += V('pdf4', 6.3, 7.5, `<line x1="${gx}" y1="${py+40}" x2="${gx}" y2="${gy}" stroke="${INK}" stroke-width=".6"/><line x1="${gx}" y1="${gy}" x2="${gx+gw}" y2="${gy}" stroke="${INK}" stroke-width=".6"/>` + [9,15,11,19,6].map((h,k)=>`<rect x="${gx+3+k*7.5}" y="${gy-h}" width="5" height="${h}" fill="${PAL[0]}"/>`).join('') + `<path d="M${gx+2},${gy-6} L${gx+14},${gy-14} L${gx+26},${gy-10} L${gx+40},${gy-22}" fill="none" stroke="${PAL[1]}" stroke-width="1.2"/>`);

  // 3. three text versions: PDF → Document, headings typing in, the shared passage
  const cx0 = 176, cwid = 410;
  const pdfGlyph = (x,y) => `<rect x="${x}" y="${y}" width="13" height="17" fill="#fff" stroke="${INK}" stroke-width=".7"/><rect x="${x+2}" y="${y+2.5}" width="9" height="2" fill="${INK}"/>` + [7,9.5,12,14.5].map(d=>`<rect x="${x+2}" y="${y+d}" width="4" height=".9" fill="#bbb"/><rect x="${x+7}" y="${y+d}" width="4" height=".9" fill="#bbb"/>`).join('') + T(x+6.5, y+21, 'PDF', {anchor:'middle', size:3.6, fill:MUTED});
  const docGlyph = (x,y) => `<rect x="${x}" y="${y}" width="13" height="17" rx="1.5" fill="${PAL[0]}"/>` + [4,8,12].map(d=>`<rect x="${x+2.5}" y="${y+d-1}" width="2" height="2" fill="#fff"/><rect x="${x+5.5}" y="${y+d-.5}" width="5" height="1" fill="#fff"/>`).join('') + T(x+6.5, y+21, 'Document', {anchor:'middle', size:3.6, fill:MUTED});
  texts.forEach((t,i)=>{
    const y = ty[i], x = cx0, d = 9.0 + i*0.3, end = 13.45;
    s += V(`tc${i}`, d, end, `<rect x="${x}" y="${y-31}" width="${cwid}" height="62" rx="5" fill="#fff" stroke="${PAL[0]}" stroke-width="1"/>` + T(x+6, y-23, t.label, {weight:700, size:7}) + pdfGlyph(x+6, y-15) + `<path d="M${x+22},${y-6.5} L${x+31},${y-6.5} M${x+28.5},${y-9} L${x+31.5},${y-6.5} L${x+28.5},${y-4}" fill="none" stroke="${MUTED}" stroke-width=".9"/>` + docGlyph(x+34, y-15));
    headingsOf(t).slice(0,6).forEach((h,k)=> s += V(`th${i}_${k}`, 9.4+k*0.3+i*0.1, end, T(x+56, y-22+k*8.4, '§ '+clip(h,42), {size:6})));
    const sn = String(t.snippet||''), from = Math.max(0, sn.indexOf('A research'));
    const sl = wrap(sn.slice(from).replace(/\s+/g,' '), 47).slice(0,2);
    s += V(`ts${i}`, 11.5+i*0.2, end, `<rect x="${x+232}" y="${y-13}" width="${cwid-238}" height="24" rx="3" fill="${BG}" stroke="${LINE}" stroke-width=".6"/>` + lines(x+236, y-5.5, sl, {size:5.6, mono:true, lh:9}));
  });
  // select the publisher XML: thick outline, the others dim (white veil at 65% = 35% visible)
  s += V('selc', 12.4, 13.45, `<rect x="${cx0-1.5}" y="${ty[si]-32.5}" width="${cwid+3}" height="65" rx="6" fill="none" stroke="${PAL[0]}" stroke-width="3"/>`);
  texts.forEach((t,i)=>{ if (i===si) return;
    s += V(`dimc${i}`, 12.4, 13.45, `<rect x="${cx0-1}" y="${ty[i]-32}" width="${cwid+2}" height="64" fill="#fff"/>`, {v:.65});
    s += V(`dimb${i}`, 13.2, 29.6, `<rect x="${X[1]-2}" y="${ty[i]-bh/2-2}" width="${bw+4}" height="${bh+4}" fill="#fff"/>`, {v:.65, fo:.4});
  });
  s += V('selb', 13.2, 29.6, `<rect x="${X[1]-2.5}" y="${ty[si]-bh/2-2.5}" width="${bw+5}" height="${bh+5}" rx="7" fill="none" stroke="${PAL[0]}" stroke-width="3"/>`, {fo:.4});
  const hub = [X[2]-26, cy];
  s += tok('tok0', [[X[1]+bw, ty[si], hub[0], hub[1]]], 13.6, 1.6, docTok);
  s += V('hub', 15.2, 16.4, `<g transform="translate(${hub[0]},${hub[1]})">${docTok}</g>`, {fi:0});

  // 4. all rubrics run at once: token in, box pulses, a structured-output card pops out
  const outX = X[2]+rw+8, ow = 48, oh = 26;
  const valOf = (cr, x) => { if (!x) return 0; if (cr.kind==='list') return Math.min(1, (x.items||[]).length/10); if (x.normalized!=null) return x.normalized; return x.answer ? 1 : 0; };
  rubs.forEach((r,j)=>{
    const col = famColor[r.family];
    s += tok(`tr${j}`, [[hub[0], hub[1], X[2]+12, ry[j]+2]], 15.4, 0.9, docTok);
    s += V(`pa${j}`, 16.3, 16.6, `<rect x="${X[2]-1}" y="${ry[j]-bh/2+1}" width="${rw+2}" height="${bh-2}" rx="7" fill="none" stroke="${col}" stroke-width="3.5"/>`, {fi:.1, fo:.1});
    s += V(`pb${j}`, 16.7, 17.0, `<rect x="${X[2]-1}" y="${ry[j]-bh/2+1}" width="${rw+2}" height="${bh-2}" rx="7" fill="none" stroke="${col}" stroke-width="3.5"/>`, {fi:.1, fo:.1});
    const c = cell(sel.id, r.id, opusHigh.id), crs = r.criteria.slice(0,4);
    let card = `<line x1="${X[2]+rw}" y1="${ry[j]+2}" x2="${outX}" y2="${ry[j]+2}" stroke="${col}" stroke-width="1.2"/><rect x="${outX}" y="${ry[j]+2-oh/2}" width="${ow}" height="${oh}" rx="3" fill="#fff" stroke="${col}" stroke-width="1.2"/>`;
    crs.forEach((cr,k)=>{ const v = c ? valOf(cr, c.results[cr.id]) : 0, h = Math.max(1, 18*v); card += `<rect x="${outX+5+k*10.5}" y="${ry[j]+2+oh/2-4-h}" width="7" height="${h}" rx="1" fill="${col}"/>`; });
    s += V(`out${j}`, 17.0+j*0.12, 29.4, card, {fo:.4});
  });

  // 4b. inside the neutral quality output: seven criteria with their scores, one line of rationale
  const D = R.det, qc = cell(sel.id, qr.id, opusHigh.id), dx = D.x+6, dy = D.y+4;
  s += V('det', 18.6, 29.4, `<rect x="${D.x}" y="${D.y}" width="${D.w}" height="${D.h}" rx="5" fill="#fff" stroke="${famColor[qr.family]}" stroke-width="1.2"/>` + T(dx+4, dy+8, qr.label, {weight:700, size:6.5}) + T(dx+4, dy+17, `${sel.label} · ${opusHigh.label}`, {size:5, fill:MUTED}), {fo:.4});
  qr.criteria.forEach((cr,k)=>{
    const x = qc && qc.results[cr.id], yy = dy+30+k*13, hot = cr.id==='claims';
    s += V(`dc${k}`, 19.3+k*0.35, 29.4, T(dx+4, yy, cr.name, {size:5.8, weight: hot?700:400}) + (x && x.score!=null ? scorePill(dx+110, yy, String(Math.round(x.score)), PAL[0]) : T(dx+112, yy, '—', {size:5.8, fill:MUTED})), {fo:.4});
  });
  const cl = qc && qc.results.claims;
  if (cl) s += V('drat', 21.9, 29.4, T(dx+4, D.y+D.h-14, `claims: ${clip(String(cl.rationale||'').replace(/\s+/g,' '), 118)}`, {size:4.4, fill:MUTED}), {fo:.4});

  // 5. this (text, rubric) pair fans out into four judges, each with its claims score
  const ky = dy+30+3*13, jx = D.x+164;
  judges.forEach((j,k)=>{
    const yy = dy+30+k*26, c = cell(sel.id, qr.id, j.id), sc = c && c.results.claims;
    s += V(`jf${k}`, 24.3+k*0.5, 29.4, `<path d="M${dx+140},${ky} C${jx-10},${ky} ${jx-14},${yy} ${jx},${yy}" fill="none" stroke="${PAL[2]}" stroke-width="1"/><rect x="${jx}" y="${yy-10}" width="132" height="20" rx="4" fill="#fff" stroke="${PAL[2]}" stroke-width="1"/>` + T(jx+5, yy, j.label, {size:5.6, weight:600}), {fo:.4});
    if (sc && sc.score!=null) s += V(`jp${k}`, 24.6+k*0.5, 29.4, scorePill(jx+86, yy, `claims ${Math.round(sc.score)}`, PAL[2], 10, 5), {fo:.4});
  });

  // 6. back out: the quality family runs end to end, a counter ticks up
  if (gqIdx.length){
    const y0 = Math.min(...gqIdx.map(i=>ry[i]))-bh/2-4, y1 = Math.max(...gqIdx.map(i=>ry[i]))+bh/2;
    s += V('qhi', 30.2, 41.2, `<rect x="${X[2]-8}" y="${y0}" width="${rw+16}" height="${y1-y0+2}" rx="10" fill="none" stroke="${famColor.general_quality}" stroke-width="3"/>`, {fo:.4});
    const combos = []; judges.forEach((j,k)=> gqIdx.forEach(r=> texts.forEach((t,i)=> combos.push([i,r,k]))));   // text varies fastest so all three columns stream at once
    const n = combos.length, stagger = Math.min(0.12, 3.4/n), dur = 1.4;
    combos.forEach(([i,r,k],m)=>{ const d = 30.6 + m*stagger;
      s += tok(`tq${m}`, [[X[1]+bw, ty[i], X[2], ry[r]+2], [X[2], ry[r]+2, X[2]+rw, ry[r]+2], [X[2]+rw, ry[r]+2, X[3], jy[k]]], d, dur, `<circle r="3.2" fill="${PAL[0]}" stroke="#fff" stroke-width=".8"/>`); });
    const bx = X[4]+4, by = cy-bh/2-6, bwid = bw+52, bht = bh+12;
    const arrive = m => 30.6 + m*stagger + dur;
    for (let m=0; m<=n; m++) s += V(`cn${m}`, m ? arrive(m-1) : 30.4, m<n ? arrive(m) : 41.2, `<rect x="${bx}" y="${by}" width="${bwid}" height="${bht}" rx="4" fill="#fff"/>` + T(bx+bwid/2, by+bht/2-6, `${m} / ${n}`, {anchor:'middle', size:16, weight:700, fill: m===n?famColor.general_quality:INK}) + T(bx+bwid/2, by+bht/2+12, 'quality runs', {anchor:'middle', size:10, fill:MUTED}), {fi: m?0:.25, fo: m<n?0:.4});
  }

  // 7. the chart: the quality slope chart, nested and zoomed to fill the frame
  const fq = window.playFigQuality ? window.playFigQuality(B) : '';
  s += '</g></g>';   // end of the tilt group and the OY-shifted tree
  for (let n=1; n<=NCOPY; n++) s += V(`np${n}`, n===1 ? 42.6 : tStack+(n-2)*tGap, n<NCOPY ? tStack+(n-1)*tGap : LOOP_T, T(TW-30, TH-34, `${n} papers`, {anchor:'end', size:22, weight:700, fill: n===NCOPY?PAL[0]:INK}), {fi: n===1?.25:0, fo: n<NCOPY?0:.4});
  if (fq) s += V('chart', 35.6, 41.6, `<g transform="translate(806,470) scale(0.408)">${fq.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')}</g>`, {fo:.4});

  TOUR = {loop: LOOP_T, kf, tilt, els, toks};
  return s + '</g></svg>';
}

const SCENES = [{id:'tour', label:'Tour', fn:sceneTour, timed:true, camera:true, loop:48}, {id:'story', label:'Story', fn:sceneStory, timed:true, loop:24}, {id:'text', label:'Text version', fn:sceneText}, {id:'rubric', label:'Rubric config', fn:sceneRubric}, {id:'judge', label:'Judge', fn:sceneJudge}, {id:'results', label:'Results', fn:sceneResults}];
let ticker = null;
let cur = 'tour';
let raf = null;
window.renderZoomScenes = function(B, el){
  const sc = SCENES.find(x=>x.id===cur) || SCENES[0];
  const tabs = SCENES.map(x=>`<button class="small ${x.id===cur?'primary':''}" data-scene="${x.id}">${esc(x.label)}</button>`).join(' ');
  el.innerHTML = `<div class="row" style="justify-content:space-between"><h2 style="margin:0">Zoom in: one dimension at a time</h2><div class="row">${tabs}</div></div><div class="fig">${sc.fn(B)}</div><p class="small muted">Real cells from the grid, animated in a ${sc.loop||LOOP}-second loop. Pick a tab for the other views.</p>`;
  el.querySelectorAll('[data-scene]').forEach(b => b.onclick = () => { cur = b.dataset.scene; window.renderZoomScenes(B, el); });
  if (ticker) { clearInterval(ticker); ticker = null; }
  if (raf) { cancelAnimationFrame(raf); raf = null; }
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sc.camera){
    // camera scene: tourState(t) gives the .cam transform, per-id opacity and token positions; reduced motion shows the final overview
    const cam = el.querySelector('.cam'), tiltG = el.querySelector('.tilt'), byId = {};
    el.querySelectorAll('[data-id]').forEach(g=>{ (byId[g.dataset.id] = byId[g.dataset.id] || []).push(g); });
    const apply = t => { const st = window.playTourState(t); cam.setAttribute('transform', st.transform); if (tiltG) tiltG.setAttribute('transform', st.tiltTransform);
      for (const id in byId){ const o = st.op[id] || 0, p = st.at[id]; byId[id].forEach(g=>{ g.style.opacity = o; if (p) g.setAttribute('transform', `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})`); }); } };
    if (reducedMotion){ apply(35.95); return; }
    const start = performance.now();
    const frame = () => { apply(((performance.now()-start)/1000) % sc.loop); raf = requestAnimationFrame(frame); };
    frame();
  } else if (sc.timed){
    // JS-driven timeline for scenes whose elements carry data-d / data-e (show / hide seconds); honours reduced motion
    const els = [...el.querySelectorAll('[data-d]')].map(g=>({g, d:+g.dataset.d, e: g.dataset.e!=null ? +g.dataset.e : sc.loop}));
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    els.forEach(x=>{ x.g.style.transition = 'opacity .35s'; });
    const start = Date.now();
    const tick = () => { const t = reduced ? sc.loop-0.01 : ((Date.now()-start)/1000) % sc.loop; els.forEach(x=>{ x.g.style.opacity = (t>=x.d && t<x.e) ? 1 : 0; }); };
    tick(); ticker = setInterval(tick, 120);
  }
};
window.playZoomScenes = SCENES;   // exposed for the GIF exporter
window.playZoomLoop = LOOP;
})();

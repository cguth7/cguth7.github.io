
(function(){
  const D = JSON.parse(document.getElementById('qdata').textContent);
  const people = D.people.slice().sort((a,b)=>a.name.localeCompare(b.name));
  const nameOf = s => (people.find(p=>p.slug===s)||{}).name || s;
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g,'');
  const el = id => document.getElementById(id);
  const guess=el('guess'), suggest=el('qsuggest'), feedback=el('qfeedback'),
        nextBtn=el('qnext'), skipBtn=el('qskip'), progress=el('qprogress'),
        scoreEl=el('qscore'), barfill=el('qbarfill'), promptEl=el('qprompt'),
        subEl=el('qsub'), quizEl=el('quiz');

  function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  let order=shuffle(D.questions.map((_,i)=>i)), idx=0, score=0, answered=false, hi=-1, matches=[];
  let map=null, marker=null, found=new Set();
  const total=D.questions.length;
  const maxScore = D.kind==='map' ? D.questions.reduce((a,x)=>a+x.answers.length,0) : total;

  if(D.kind==='map'){
    map=L.map('map',{zoomControl:true,scrollWheelZoom:false});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {attribution:'© OpenStreetMap, © CARTO',subdomains:'abcd',maxZoom:18}).addTo(map);
    map.setView([25,0],2);
  }
  const q=()=>D.questions[order[idx]];
  const isCorrect=slug=>{const c=q();return c.answers?c.answers.includes(slug):c.slug===slug;};
  const answerText=()=>{const c=q();return c.answers?c.answers.map(nameOf).join(', '):nameOf(c.slug);};

  function render(){
    answered=false; hi=-1; matches=[]; found=new Set();
    guess.value=''; guess.disabled=false; suggest.innerHTML='';
    feedback.textContent=''; feedback.className='qfeedback';
    nextBtn.style.visibility='hidden';
    progress.textContent=(idx+1)+' / '+total;
    scoreEl.textContent='Score '+score;
    barfill.style.width=(100*idx/total)+'%';
    const c=q();
    if(D.kind==='map'){
      promptEl.innerHTML=mapPrompt();
      if(marker) marker.remove();
      const pin=L.divIcon({className:'qpin',html:'📍',iconSize:[30,30],iconAnchor:[15,28]});
      marker=L.marker(c.coords,{icon:pin}).addTo(map);
      map.flyTo(c.coords,4,{duration:0.6});
    } else if(D.kind==='needs'){
      promptEl.innerHTML='<b>'+c.prompt+'</b>';
    } else {
      promptEl.innerHTML='“'+c.prompt+'”';
    }
    if(subEl) subEl.textContent=D.subtitle||'';
    guess.focus();
  }

  function renderSuggest(){
    const term=norm(guess.value);
    if(!term){ suggest.innerHTML=''; matches=[]; return; }
    matches=people.filter(p=>norm(p.name).includes(term) && !found.has(p.slug)).slice(0,8);
    suggest.innerHTML=matches.map((p,i)=>'<div class="'+(i===hi?'hi':'')+'" data-slug="'+p.slug+'">'+p.name+'</div>').join('');
    suggest.querySelectorAll('div').forEach(d=>{ d.onclick=()=>submit(d.dataset.slug); });
  }

  function clearInput(){ guess.value=''; matches=[]; suggest.innerHTML=''; hi=-1; }
  function showNamed(){
    const c=q();
    subEl.innerHTML = found.size
      ? 'Named: '+[...found].map(nameOf).join(', ')
      : (D.subtitle||'');
  }

  // ---- map: name EVERY fellow based at the pinned city ----
  function submitMap(slug){
    if(answered) return;
    const c=q();
    if(found.has(slug)){ feedback.textContent='Already named '+nameOf(slug); feedback.className='qfeedback'; return; }
    if(c.answers.includes(slug)){
      found.add(slug); score++; scoreEl.textContent='Score '+score;
      promptEl.innerHTML=mapPrompt(); showNamed(); clearInput();
      if(found.size===c.answers.length){
        feedback.textContent='✓ All '+c.answers.length+' named!'; feedback.className='qfeedback good';
        lock();
      } else {
        feedback.textContent='✓ '+nameOf(slug); feedback.className='qfeedback good'; guess.focus();
      }
    } else {
      feedback.textContent='✗ '+nameOf(slug)+' isn’t in '+c.label; feedback.className='qfeedback bad';
      clearInput(); guess.focus();
    }
  }
  function skipMap(){
    if(answered) return;
    const missed=q().answers.filter(s=>!found.has(s));
    showNamed();
    feedback.textContent=missed.length ? 'Missed: '+missed.map(nameOf).join(', ') : 'All named!';
    feedback.className='qfeedback bad'; lock();
  }
  const mapPrompt=()=>{ const c=q(); return "Who's based in <b>"+c.label+"</b>? <span class='qcount'>"+found.size+" / "+c.answers.length+"</span>"; };

  // ---- text quizzes: single answer ----
  function reveal(good, saidSlug){
    if(answered) return;
    if(good){ score++; feedback.textContent='✓ '+nameOf(saidSlug); feedback.className='qfeedback good'; }
    else if(saidSlug){ feedback.textContent='✗ You said '+nameOf(saidSlug)+' — it’s '+answerText(); feedback.className='qfeedback bad'; }
    else { feedback.textContent='Answer: '+answerText(); feedback.className='qfeedback bad'; }
    scoreEl.textContent='Score '+score; lock();
  }

  function lock(){ answered=true; guess.disabled=true; suggest.innerHTML=''; nextBtn.style.visibility='visible'; }
  function submit(slug){ D.kind==='map' ? submitMap(slug) : reveal(isCorrect(slug), slug); }
  function skip(){ D.kind==='map' ? skipMap() : reveal(false, null); }
  function next(){ idx++; if(idx>=total){ end(); } else { render(); } }

  function end(){
    const pct=Math.round(100*score/maxScore);
    const msg=pct===100?'Flawless. You are the PDKU oracle.':pct>=75?'Excellent — you know this class.':pct>=50?'Not bad. Keep studying the cards.':pct>=25?'Room to grow — flip some cards.':'Time to actually read the intros!';
    quizEl.innerHTML='<div class="qend"><div class="qsub">'+D.title+'</div>'+
      '<div class="qbig">'+score+' / '+maxScore+'</div><div class="qmsg">'+msg+'</div>'+
      '<button class="qbtn" id="qagain">Play again</button>'+
      '<a class="qbtn ghost" href="../index.html">Back to cards</a></div>';
    el('qagain').onclick=()=>location.reload();
  }

  guess.addEventListener('input',()=>{ hi=-1; renderSuggest(); });
  guess.addEventListener('keydown',e=>{
    if(answered) return;
    if(e.key==='ArrowDown'){ e.preventDefault(); if(matches.length){ hi=(hi+1)%matches.length; renderSuggest(); } }
    else if(e.key==='ArrowUp'){ e.preventDefault(); if(matches.length){ hi=(hi-1+matches.length)%matches.length; renderSuggest(); } }
    else if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); const pick=matches[hi>=0?hi:0]; if(pick) submit(pick.slug); }
  });
  nextBtn.addEventListener('click',next);
  skipBtn.addEventListener('click',skip);
  document.addEventListener('keydown',e=>{ if(answered && e.key==='Enter'){ e.preventDefault(); next(); }});

  render();
})();

// Site-wide library bookmark. One line per page:
//   <script defer src="/assets/site-nav.js"></script>
// Reads /library/catalog.js (single source of truth) and draws a small
// fixed catalog tab in the lower-left corner: call number in the section's
// hue, expanding to an index card with prev/next-in-section, library, home.
// Layout-neutral on purpose — pages here range from 100vh Leaflet apps to
// centered-body essays, so nothing is inserted into the document flow.
(function () {
    'use strict';

    // <script data-pos="br"> moves the tab to the lower-right corner,
    // clear of Leaflet attribution — for pages whose lower-left is busy.
    const pos = (document.currentScript && document.currentScript.dataset.pos) || 'bl';

    function normalize(path) {
        return path.replace(/index\.html$/, '').replace(/\/$/, '') || '/';
    }

    function boot() {
        const { SECTIONS, ENTRIES } = window.LIBRARY;
        const here = normalize(location.pathname);
        const idx = ENTRIES.findIndex(e => normalize(e[1]) === here);
        const entry = idx >= 0 ? ENTRIES[idx] : null;
        const sec = entry ? SECTIONS[entry[0]] : null;
        const shelf = entry ? ENTRIES.filter(e => e[0] === entry[0]) : [];
        const at = entry ? shelf.indexOf(entry) : -1;
        const call = entry ? entry[0] + '.' + String(at + 1).padStart(2, '0') : '?';
        const hue = sec ? sec.hue : '#4a3826';
        const prev = at >= 0 ? shelf[(at - 1 + shelf.length) % shelf.length] : null;
        const next = at >= 0 ? shelf[(at + 1) % shelf.length] : null;

        const corner = pos === 'br'
            ? 'right: 14px; bottom: 30px;'
            : 'left: 14px; bottom: 14px;';
        const cardSide = pos === 'br' ? 'right: 0;' : 'left: 0;';
        const css = `
            #site-nav { position: fixed; ${corner} z-index: 1200;
                font-family: 'Courier New', monospace; }
            #site-nav * { box-sizing: border-box; margin: 0; }
            #site-nav .sn-tab { display: flex; align-items: center; gap: 7px;
                background: #241b12; color: #caa963; border: 1px solid #16100a;
                border-left: 4px solid ${hue}; border-radius: 2px; cursor: pointer;
                padding: 4px 9px 4px 7px; font: 11px 'Courier New', monospace;
                letter-spacing: 1.5px; box-shadow: 1px 2px 6px rgba(0,0,0,0.4);
                opacity: 0.82; transition: opacity 0.15s; }
            #site-nav .sn-tab:hover, #site-nav .sn-tab:focus-visible,
            #site-nav.open .sn-tab { opacity: 1; }
            #site-nav .sn-card { display: none; position: absolute; ${cardSide} bottom: 34px;
                width: 252px; padding: 24px 13px 10px; border: 1px solid #c9bfa4;
                border-radius: 2px; color: #332a1e; box-shadow: 3px 5px 14px rgba(0,0,0,0.45);
                background: repeating-linear-gradient(#fffdf4 0 22px, #dce7ef 22px 23px);
                background-color: #fffdf4; }
            #site-nav.open .sn-card { display: block; }
            #site-nav .sn-card::before { content: ''; position: absolute;
                left: 0; right: 0; top: 18px; border-top: 1.5px solid #c76b5b; }
            #site-nav .sn-call { position: absolute; top: 3px; left: 13px;
                font-size: 10px; letter-spacing: 1px; color: #8a6d3b; }
            #site-nav .sn-sec { position: absolute; top: 3px; right: 13px;
                font-size: 10px; letter-spacing: 1px; color: ${hue}; }
            #site-nav .sn-title { font-family: Georgia, serif; font-size: 13px;
                color: #1f3d5c; margin-bottom: 2px; }
            #site-nav .sn-card a { display: block; font-size: 11px; line-height: 22px;
                letter-spacing: 0.5px; color: #55492f; text-decoration: none;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            #site-nav .sn-card a:hover, #site-nav .sn-card a:focus-visible { color: #1f3d5c; }
            #site-nav .sn-card a span { color: #8a6d3b; }
            @media print { #site-nav { display: none; } }
        `;

        const root = document.createElement('div');
        root.id = 'site-nav';
        const style = document.createElement('style');
        style.textContent = css;

        const tab = document.createElement('button');
        tab.className = 'sn-tab';
        tab.type = 'button';
        tab.setAttribute('aria-expanded', 'false');
        tab.setAttribute('aria-label', 'library catalog card');
        tab.textContent = '❧ ' + call;

        const card = document.createElement('div');
        card.className = 'sn-card';
        const link = (href, label, glyph) => {
            const a = document.createElement('a');
            a.href = href;
            const s = document.createElement('span');
            s.textContent = glyph + ' ';
            a.appendChild(s);
            a.appendChild(document.createTextNode(label));
            return a;
        };
        if (entry) {
            const callEl = document.createElement('div');
            callEl.className = 'sn-call';
            callEl.textContent = call + ' · GUTHMANN COLLECTION';
            const secEl = document.createElement('div');
            secEl.className = 'sn-sec';
            secEl.textContent = sec.name.toUpperCase();
            const title = document.createElement('div');
            title.className = 'sn-title';
            title.textContent = entry[2];
            card.append(callEl, secEl, title);
            if (shelf.length > 1) {
                card.append(
                    link(prev[1], prev[2], '‹'),
                    link(next[1], next[2], '›')
                );
            }
        } else {
            const title = document.createElement('div');
            title.className = 'sn-title';
            title.textContent = 'Guthmann Collection';
            card.append(title);
        }
        card.append(
            link('/library/', 'the library', '▤'),
            link('/', 'home', '⌂')
        );

        tab.addEventListener('click', () => {
            const open = root.classList.toggle('open');
            tab.setAttribute('aria-expanded', String(open));
        });
        document.addEventListener('click', ev => {
            if (!root.contains(ev.target)) {
                root.classList.remove('open');
                tab.setAttribute('aria-expanded', 'false');
            }
        });
        document.addEventListener('keydown', ev => {
            if (ev.key === 'Escape') {
                root.classList.remove('open');
                tab.setAttribute('aria-expanded', 'false');
            }
        });
        root.append(style, card, tab);
        document.body.appendChild(root);
    }

    function start() {
        if (window.LIBRARY) { boot(); return; }
        const s = document.createElement('script');
        s.src = '/library/catalog.js';
        s.onload = boot;
        document.head.appendChild(s);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();

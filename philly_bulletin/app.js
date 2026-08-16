/* The Philly Bulletin — shared runtime for index.html and map.html.
   Reads data.json per CONTRACT.md (contract v1). No framework, no build step.
   Every field is treated as nullable; a partial export is a normal state. */
(function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────── */

  // A limited run is not a habit. ↻ means "you can join this".
  var JOINABLE = { weekly: 1, biweekly: 1, monthly: 1 };

  // Display only — JOINABLE above is the logic. Anything unlisted prints as-is.
  var CADENCE = { weekly: 'Every week', biweekly: 'Every other week', monthly: 'Every month' };

  // Used only if the bundle omits weights; order = display order.
  var DIM_FALLBACK = ['social_quality', 'serendipity', 'solo_friendliness',
    'community_building', 'uniqueness', 'value_for_price'];

  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  /* ── state ─────────────────────────────────────────────────────────── */

  var DB = null;              // the bundle
  var HOODS = null;           // geojson FeatureCollection, or null if it failed
  var venueById = {};
  var seriesById = {};
  var hoodOfVenue = {};       // venue_id -> hood name, derived once at load

  var F = { free: false, solo: false, join: false, minq: 0, win: 7,
    day: '', hood: 'Rittenhouse', hoodChosen: false, query: '' };
  var WIN = { start: '0000-01-01', end: '9999-12-31', label: '', note: '' };
  var zone = 'Rittenhouse';   // focused neighborhood on the map; "all" means Philly

  /* ── small helpers ─────────────────────────────────────────────────── */

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Some bundle fields are plain YYYY-MM-DD (events[].date) and some are full
  // ISO datetimes (generated, series[].first_date/last_date — kept that way for
  // byte-compatibility with Chicago's export). Everything is reduced to a day
  // key here so callers never have to care which they were handed.
  function dayOf(v) {
    return v == null ? null : String(v).slice(0, 10);
  }

  // Dates are compared as YYYY-MM-DD strings everywhere; lexicographic order is
  // chronological order. Date objects only appear where a weekday is needed.
  function dateObj(iso) {
    var p = dayOf(iso).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function shiftISO(iso, days) {
    var d = dateObj(iso);
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function fmtDayHead(iso) {
    var d = dateObj(iso);
    return DOW[d.getDay()] + ' · ' + MON[d.getMonth()] + ' ' + d.getDate();
  }
  function fmtShort(iso) {
    if (!iso) return '';
    var d = dateObj(iso);
    if (isNaN(d.getTime())) return '';
    return MON[d.getMonth()] + ' ' + d.getDate();
  }
  var DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function longName(d) {
    return DOWL[d.getDay()] + ', ' + MONL[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }
  function fmtTime(e) {
    if (e.all_day) return 'All day';
    if (!e.time) return '';
    var p = e.time.split(':'), h = +p[0], m = p[1] || '00';
    var ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + m + ' ' + ap;
  }
  function dayChoiceLabel(iso) {
    var delta = Math.round((dateObj(iso) - dateObj(todayISO())) / 86400000);
    if (delta === 0) return 'Today';
    if (delta === 1) return 'Tomorrow';
    var d = dateObj(iso);
    return DOWL[d.getDay()] + ' · ' + MON[d.getMonth()] + ' ' + d.getDate();
  }

  /* ── contract-level accessors (all null-safe) ──────────────────────── */

  function seriesOf(e) {
    return (e && e.series_id && seriesById[e.series_id]) || null;
  }
  function isJoinable(e) {
    var s = seriesOf(e);
    return !!(s && JOINABLE[s.cadence]);
  }
  // is_free is tri-state; null means unknown, not free. Fall back to the
  // published cost string only when the boolean has no opinion.
  function isFree(e) {
    if (e.is_free === true) return true;
    if (e.is_free === false) return false;
    return typeof e.cost === 'string' && /^\s*free\b/i.test(e.cost);
  }
  function costLabel(e) {
    if (e.cost) return e.cost;
    if (e.is_free === true) return 'Free';
    return '';
  }
  function dimScore(e, dim) {
    var s = e.scores && e.scores[dim];
    return s && typeof s.score === 'number' ? s.score : null;
  }
  function hoodOf(e) {
    return (e.venue_id && hoodOfVenue[e.venue_id]) || null;
  }

  /* ── point in polygon (handles interior rings) ─────────────────────── */

  function inRings(lat, lng, rings) {
    var inside = false;
    for (var r = 0; r < rings.length; r++) {
      var ring = rings[r];
      for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
        if ((yi > lat) !== (yj > lat) &&
            lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
      }
    }
    return inside;
  }
  function inFeature(lat, lng, f) {
    var bb = f._bb;
    if (bb && (lat < bb[0] || lat > bb[2] || lng < bb[1] || lng > bb[3])) return false;
    var g = f.geometry;
    if (!g) return false;
    if (g.type === 'Polygon') return inRings(lat, lng, g.coordinates);
    if (g.type === 'MultiPolygon') {
      for (var i = 0; i < g.coordinates.length; i++) {
        if (inRings(lat, lng, g.coordinates[i])) return true;
      }
    }
    return false;
  }
  function bboxOf(f) {
    var lo = [90, 180], hi = [-90, -180];
    var polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    polys.forEach(function (p) {
      p.forEach(function (ring) {
        ring.forEach(function (c) {
          if (c[1] < lo[0]) lo[0] = c[1]; if (c[1] > hi[0]) hi[0] = c[1];
          if (c[0] < lo[1]) lo[1] = c[0]; if (c[0] > hi[1]) hi[1] = c[0];
        });
      });
    });
    return [lo[0], lo[1], hi[0], hi[1]];
  }

  // One pass at load: every venue gets its neighborhood. The map never
  // re-tests geometry after this.
  function deriveHoods() {
    if (!HOODS) return;
    HOODS.features.forEach(function (f) { f._bb = bboxOf(f); });
    DB.venues.forEach(function (v) {
      if (v.lat == null || v.lng == null) return;
      for (var i = 0; i < HOODS.features.length; i++) {
        if (inFeature(v.lat, v.lng, HOODS.features[i])) {
          hoodOfVenue[v.id] = HOODS.features[i].properties.name;
          return;
        }
      }
    });
  }

  /* ── the window (default: next 7 days, degrading quietly) ──────────── */

  function resolveWindow() {
    var dates = [];
    DB.events.forEach(function (e) { if (e.date) dates.push(e.date); });
    dates.sort();
    if (!dates.length) {
      WIN = { start: '0000-01-01', end: '9999-12-31', label: 'No listings', note: '' };
      return;
    }
    var first = dates[0], last = dates[dates.length - 1], today = todayISO();
    var hasFuture = last >= today;

    if (!F.win) {                                    // "all"
      WIN = hasFuture
        ? { start: today, end: last, label: 'Everything upcoming', note: '' }
        : { start: first, end: last, label: 'The archive',
            note: 'Every listing here has already happened. Nothing new has come in since ' +
                  fmtShort(last) + '.' };
      return;
    }

    var span = F.win, start = today, end = shiftISO(today, span - 1);
    var hit = dates.some(function (d) { return d >= start && d <= end; });
    if (hit) {
      WIN = { start: start, end: end, label: 'Next ' + span + ' days', note: '' };
      return;
    }
    var nextUp = null;
    for (var i = 0; i < dates.length; i++) { if (dates[i] >= today) { nextUp = dates[i]; break; } }
    if (nextUp) {
      WIN = { start: nextUp, end: shiftISO(nextUp, span - 1),
        label: fmtShort(nextUp) + ' – ' + fmtShort(shiftISO(nextUp, span - 1)),
        note: 'Nothing falls in the next ' + span + ' days. This is the next stretch that ' +
              'has something, starting ' + fmtShort(nextUp) + '.' };
    } else {
      WIN = { start: shiftISO(last, -(span - 1)), end: last,
        label: 'The last ' + span + ' days on record',
        note: 'Every listing here has already happened. This is the most recent stretch ' +
              'on record — nothing new has come in since ' + fmtShort(last) + '.' };
    }
  }

  /* ── the one filter every surface reads ────────────────────────────── */

  function filteredEvents() {
    var isList = !!$('bulletin');
    var q = String(F.query || '').trim().toLowerCase();
    return DB.events.filter(function (e) {
      if (!e.date || e.date < WIN.start || e.date > WIN.end) return false;
      // Day and place are shared wayfinding, not page-specific filters. This
      // keeps the map in the same place and moment as the ranked list.
      if (F.day && e.date !== F.day) return false;
      if (F.hood !== 'all' && hoodOf(e) !== F.hood) return false;
      if (isList && q) {
        var hay = [e.name, e.venue, hoodOf(e), e.group, e.category,
          Array.isArray(e.tags) ? e.tags.join(' ') : e.tags].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (F.free && !isFree(e)) return false;
      if (F.solo) { var s = dimScore(e, 'solo_friendliness'); if (s == null || s < 7) return false; }
      if (F.join && !isJoinable(e)) return false;
      if (F.minq && !(typeof e.quality === 'number' && e.quality >= F.minq)) return false;
      return true;
    });
  }

  // Ranked: best first, unscored last, then earliest, then alphabetical.
  function rank(a, b) {
    var qa = typeof a.quality === 'number' ? a.quality : -1;
    var qb = typeof b.quality === 'number' ? b.quality : -1;
    if (qa !== qb) return qb - qa;
    var ta = a.time || '99:99', tb = b.time || '99:99';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return String(a.name).localeCompare(String(b.name));
  }
  function chrono(a, b) {
    var da = (a.date || '9999') + (a.time || '99:99');
    var db = (b.date || '9999') + (b.time || '99:99');
    return da < db ? -1 : da > db ? 1 : 0;
  }

  /* ── filter bar (rendered from JS so both pages are identical) ─────── */

  var FLAGS = [
    { k: 'free', label: 'Free' },
    { k: 'solo', label: 'Solo-friendly' },
    { k: 'join', label: 'Joinable', glyph: '↻' }
  ];
  var MINQ = [[0, 'Any'], [5, '5+'], [6, '6+'], [7, '7+'], [8, '8+']];

  function advancedHTML() {
    var active = (F.free ? 1 : 0) + (F.solo ? 1 : 0) + (F.join ? 1 : 0) + (F.minq ? 1 : 0);
    var h = '<details class="advanced"' + (active ? ' open' : '') + '><summary>Advanced settings' +
      (active ? '<span class="advanced-count">' + active + ' on</span>' : '') + '</summary>' +
      '<div class="advanced-in"><div class="advanced-flags">';
    FLAGS.forEach(function (f) {
      h += '<button class="pillbtn toggle" type="button" data-flag="' + f.k + '" aria-pressed="' +
        (F[f.k] ? 'true' : 'false') + '">' +
        (f.glyph ? '<span class="gl">' + f.glyph + '</span>' : '') + esc(f.label) + '</button>';
    });
    h += '</div><div class="advanced-score"><span class="filter-label">Minimum quality</span>' +
      '<span class="seg-set" role="group" aria-label="Minimum score">';
    MINQ.forEach(function (m) {
      h += '<button type="button" data-minq="' + m[0] + '" aria-pressed="' +
        (F.minq === m[0] ? 'true' : 'false') + '">' + esc(m[1]) + '</button>';
    });
    h += '</span></div><button class="advanced-reset linkish" type="button" data-reset-advanced="1">Reset advanced</button></div></details>';
    return h;
  }

  function listFinderHTML() {
    var dates = {}, hoods = {};
    DB.events.forEach(function (e) {
      if (e.date) dates[e.date] = 1;
      var hood = hoodOf(e); if (hood) hoods[hood] = 1;
    });
    var h = '<div class="finder">' +
      '<label class="find-field find-search"><span>Search</span><input id="event-search" type="search" value="' +
      esc(F.query) + '" placeholder="Events or venues" autocomplete="off"></label>' +
      '<label class="find-field"><span>I’m in</span><select id="hood-select"><option value="all">Philly</option>';
    Object.keys(hoods).sort().forEach(function (hood) {
      h += '<option value="' + esc(hood) + '"' + (F.hood === hood ? ' selected' : '') + '>' +
        esc(hood) + '</option>';
    });
    h += '</select></label><label class="find-field"><span>The day is</span><select id="day-select">';
    Object.keys(dates).sort().forEach(function (day) {
      h += '<option value="' + day + '"' + (F.day === day ? ' selected' : '') + '>' +
        esc(dayChoiceLabel(day)) + '</option>';
    });
    h += '</select></label></div>' + advancedHTML() + '<div class="filter-tally ml" id="tally"></div>';
    return h;
  }

  function mapFinderHTML() {
    var dates = {};
    DB.events.forEach(function (e) { if (e.date) dates[e.date] = 1; });
    var h = '<div class="finder map-finder">' +
      '<label class="find-field"><span>It is</span><select id="day-select">';
    Object.keys(dates).sort().forEach(function (day) {
      h += '<option value="' + day + '"' + (F.day === day ? ' selected' : '') + '>' +
        esc(dayChoiceLabel(day)) + '</option>';
    });
    h += '</select></label>' +
      '<label class="find-field hood-field"><span>I’m in</span>' +
      '<input id="map-hood-search" type="search" value="' +
      esc(F.hood === 'all' ? 'Philly' : F.hood) +
      '" placeholder="Search neighborhoods" autocomplete="off" aria-label="Neighborhood"' +
      ' role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="hood-suggest">' +
      '<div class="suggest" id="hood-suggest" role="listbox" aria-label="Neighborhoods" hidden></div>' +
      '</label></div>' + advancedHTML() +
      '<div class="filter-tally ml" id="tally"></div>';
    return h;
  }

  function hoodChoices() {
    var names = ['Philly'];
    if (HOODS) {
      HOODS.features.map(function (f) { return f.properties.name; }).sort().forEach(function (name) {
        names.push(name);
      });
    }
    return names;
  }

  // The native <datalist> popup can't be styled and renders near-invisible on
  // some platforms, so the neighborhood search draws its own suggestion list.
  function wireHoodSuggest(host) {
    var open = false, cursor = -1, shown = [];

    function input() { return document.getElementById('map-hood-search'); }
    function box() { return document.getElementById('hood-suggest'); }

    function close() {
      var b = box(), inp = input();
      open = false; cursor = -1; shown = [];
      if (b) { b.hidden = true; b.innerHTML = ''; }
      if (inp) inp.setAttribute('aria-expanded', 'false');
    }

    function paint() {
      var b = box();
      if (!b) return;
      b.innerHTML = shown.map(function (name, i) {
        return '<div class="suggest-opt' + (i === cursor ? ' active' : '') +
          '" role="option" id="hood-opt-' + i + '" aria-selected="' + (i === cursor) +
          '" data-suggest="' + esc(name) + '">' + esc(name) + '</div>';
      }).join('');
      b.hidden = !shown.length;
      var inp = input();
      if (inp) {
        inp.setAttribute('aria-expanded', shown.length ? 'true' : 'false');
        if (cursor >= 0) inp.setAttribute('aria-activedescendant', 'hood-opt-' + cursor);
        else inp.removeAttribute('aria-activedescendant');
      }
      open = !!shown.length;
    }

    function show(query) {
      var q = String(query || '').trim().toLowerCase();
      shown = hoodChoices().filter(function (name) {
        return !q || name.toLowerCase().indexOf(q) !== -1;
      });
      cursor = -1;
      paint();
    }

    function choose(name) {
      close();
      var hood = matchHood(name);
      if (hood != null) setZone(hood);
    }

    host.addEventListener('input', function (ev) {
      if (ev.target.id === 'map-hood-search') show(ev.target.value);
    });
    host.addEventListener('focusin', function (ev) {
      if (ev.target.id === 'map-hood-search') { ev.target.select(); show(''); }
    });
    host.addEventListener('keydown', function (ev) {
      if (ev.target.id !== 'map-hood-search') return;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (!open) { show(ev.target.value); return; }
        cursor = ev.key === 'ArrowDown'
          ? (cursor + 1) % shown.length
          : (cursor - 1 + shown.length) % shown.length;
        paint();
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        if (open && cursor >= 0) choose(shown[cursor]);
        else choose(ev.target.value);
      } else if (ev.key === 'Escape') {
        close();
      }
    });
    // mousedown, not click: the input's blur would close the list first.
    host.addEventListener('mousedown', function (ev) {
      var opt = ev.target.closest('.suggest-opt');
      if (opt) { ev.preventDefault(); choose(opt.dataset.suggest); }
    });
    host.addEventListener('focusout', function (ev) {
      if (ev.target.id !== 'map-hood-search') return;
      setTimeout(function () {
        var inp = input();
        if (inp && document.activeElement !== inp) {
          close();
          inp.value = F.hood === 'all' ? 'Philly' : F.hood;
        }
      }, 120);
    });
  }

  function renderFilters() {
    var host = $('filters');
    if (!host) return;
    host.innerHTML = $('bulletin') ? listFinderHTML() : mapFinderHTML();
  }

  function matchHood(value) {
    var wanted = String(value || '').trim().toLowerCase();
    if (wanted === 'philly' || wanted === 'all philadelphia' || wanted === 'philadelphia') return 'all';
    if (!HOODS) return null;
    var names = HOODS.features.map(function (f) { return f.properties.name; });
    for (var i = 0; i < names.length; i++) {
      if (names[i].toLowerCase() === wanted) return names[i];
    }
    var starts = names.filter(function (name) { return name.toLowerCase().indexOf(wanted) === 0; });
    return starts.length === 1 ? starts[0] : null;
  }

  function saveFilters() {
    try { sessionStorage.setItem('pb.f2', JSON.stringify(F)); } catch (err) { /* private mode */ }
  }
  function loadFilters() {
    try {
      var raw = sessionStorage.getItem('pb.f2');
      if (raw) {
        var o = JSON.parse(raw);
        Object.keys(F).forEach(function (k) { if (k in o) F[k] = o[k]; });
      }
    } catch (err) { /* ignore */ }
  }

  function wireFilters(onChange) {
    var host = $('filters');
    if (!host) return;
    host.addEventListener('input', function (ev) {
      if (ev.target.id !== 'event-search') return;
      F.query = ev.target.value;
      saveFilters(); onChange();
    });
    host.addEventListener('change', function (ev) {
      if (ev.target.id === 'hood-select') { F.hood = ev.target.value; F.hoodChosen = true; }
      else if (ev.target.id === 'day-select') F.day = ev.target.value;
      else return;
      saveFilters(); onChange();
    });
    if (!$('bulletin')) wireHoodSuggest(host);
    host.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.flag) { F[b.dataset.flag] = !F[b.dataset.flag]; }
      else if (b.dataset.minq != null) { F.minq = +b.dataset.minq; }
      else if (b.dataset.resetAdvanced) { F.free = F.solo = F.join = false; F.minq = 0; }
      else return;
      saveFilters();
      renderFilters();
      onChange();
    });
  }

  function setTally(n) {
    var t = $('tally');
    if (t) t.textContent = n + (n === 1 ? ' listing' : ' listings') +
      (F.day ? ' · ' + dayChoiceLabel(F.day) : ' · ' + WIN.label);
  }

  function updateMapCopy(n) {
    var context = $('map-context');
    var place = F.hood === 'all' ? 'Philly' : F.hood;
    if (context) context.textContent = (F.day ? dayChoiceLabel(F.day) : WIN.label) + ' · ' + place;
    var nav = $('nav-count');
    if (nav) nav.textContent = n + (n === 1 ? ' listing · ' : ' listings · ') + place;
  }

  /* ── the bulletin ──────────────────────────────────────────────────── */

  function scoreCell(e) {
    return typeof e.quality === 'number'
      ? '<div class="entry-score"><b>' + e.quality.toFixed(1) + '</b><span> quality</span></div>'
      : '<div class="entry-score none" title="Not scored yet">—</div>';
  }

  function metaLine(e) {
    var bits = [];
    if (e.venue) bits.push(esc(e.venue));
    var h = hoodOf(e);
    if (h) bits.push(esc(h));
    return bits.join('<span class="dot">·</span>');
  }

  function updateListCopy(evs) {
    var label = F.day ? dayChoiceLabel(F.day) : 'Today';
    var nav = $('nav-count'); if (nav) nav.textContent = evs.length + (evs.length === 1 ? ' listing · ' : ' listings · ') + label.toLowerCase();
    var lab = $('list-label');
    if (lab) lab.textContent = 'Ranked · ' + label + (F.hood !== 'all' ? ' · ' + F.hood : '');
  }

  function renderBulletin() {
    var host = $('bulletin');
    if (!host) return;
    var evs = filteredEvents();
    setTally(evs.length);
    updateListCopy(evs);

    var h = '';
    if (WIN.note) h += '<p class="note">' + esc(WIN.note) + '</p>';

    if (!evs.length) {
      h += '<p class="note empty">Nothing matches. ' +
        '<button class="linkish" type="button" data-clear="1">Clear the filters</button> ' +
        'or try another neighborhood or day.</p>';
      host.innerHTML = h;
      return;
    }

    var byDay = {};
    evs.forEach(function (e) { (byDay[e.date] = byDay[e.date] || []).push(e); });
    Object.keys(byDay).sort().forEach(function (day) {
      var list = byDay[day].slice().sort(rank);
      h += '<section class="daygroup"><div class="dayhead"><span class="d">' + esc(fmtDayHead(day)) + '</span>' +
        '<span class="ml n">' + list.length + (list.length === 1 ? ' listing' : ' listings') +
        ' · best first</span></div>';
      list.forEach(function (e, dayRank) {
        h += '<article class="entry" role="button" tabindex="0" data-ev="' + e.id + '">' +
          '<div class="entry-rank">' + (dayRank + 1) + '</div>' +
          '<div class="entry-time">' + esc(fmtTime(e)) + '</div>' +
          '<div class="entry-body"><h3 class="entry-name">' + esc(e.name) + '</h3>' +
          (isJoinable(e) ? '<span class="gl-series" title="Happens regularly — you can join it">↻</span>' : '') +
          '<div class="entry-meta">' + metaLine(e) + '</div></div>' +
          '<div class="entry-cost">' + (isFree(e) ? '<span class="free">Free</span>' : esc(costLabel(e))) + '</div>' +
          scoreCell(e) + '</article>';
      });
      h += '</section>';
    });
    h += '<div class="board-foot">' + evs.length + (evs.length === 1 ? ' listing' : ' listings') +
      ' · ranked by community-weighted quality · open a row for all six reasons</div>';
    host.innerHTML = h;
  }

  /* ── detail overlay: the reasons are the point ─────────────────────── */

  function orderedDims() {
    var w = DB.weights;
    if (!w) return DIM_FALLBACK;
    var ks = Object.keys(w);
    if (!ks.length) return DIM_FALLBACK;
    return ks.sort(function (a, b) { return w[b] - w[a]; });
  }

  var lastFocus = null;

  // one dimension list, shared by the sheet and the event permalink page
  function dimsHTML(e) {
    var h = '';
    orderedDims().forEach(function (d) {
      var s = e.scores[d];
      if (!s || typeof s.score !== 'number') return;
      h += '<div class="dim">' +
        '<div class="dim-top"><span class="ml">' + esc(d.replace(/_/g, ' ')) + '</span>' +
        '<span class="v">' + s.score + '/10</span></div>' +
        '<div class="dim-track"><div class="dim-fill" style="width:' +
        Math.max(0, Math.min(100, s.score * 10)) + '%"></div></div>' +
        (s.reason ? '<p class="dim-reason">' + esc(s.reason) + '</p>' : '') +
        '</div>';
    });
    return h;
  }

  function openSheet(id) {
    var e = null;
    for (var i = 0; i < DB.events.length; i++) { if (DB.events[i].id === id) { e = DB.events[i]; break; } }
    if (!e) return;
    var body = $('sheet-body');
    if (!body) return;

    var sr = seriesOf(e);
    var when = [];
    if (e.date) when.push('<span>' + esc(longName(dateObj(e.date))) + '</span>');
    var t = fmtTime(e);
    if (t) when.push('<span>' + esc(t) + '</span>');
    if (sr && JOINABLE[sr.cadence]) {
      var last = dayOf(sr.last_date);
      when.push('<span class="cad">↻ ' + esc(CADENCE[sr.cadence] || sr.cadence) +
        (sr.n_dates ? ' · ' + sr.n_dates + ' dates' : '') +
        (last ? ' · through ' + esc(fmtShort(last)) : '') + '</span>');
    }

    var where = [];
    if (e.venue) where.push(esc(e.venue));
    var hd = hoodOf(e);
    if (hd) where.push(esc(hd));
    var c = costLabel(e);
    if (c) where.push(esc(c));

    var h = '<div class="sheet-when ml">' + when.join('') + '</div>' +
      '<h2>' + esc(e.name) + '</h2>' +
      (where.length ? '<div class="sheet-where">' + where.join('<span class="dot">·</span>') + '</div>' : '');

    if (e.description) h += '<p class="sheet-desc">' + esc(e.description) + '</p>';

    if (e.scores) {
      h += '<div class="why-head"><span class="ml ml-ink">Why it scores</span>' +
        (typeof e.quality === 'number' ? '<span class="q">' + e.quality.toFixed(1) + ' / 10</span>' : '') +
        '</div>' + dimsHTML(e);
    } else {
      h += '<p class="unscored">Not scored yet. This one has not been read against the ' +
        'six questions — it still shows up, it just has no score.</p>';
    }

    if (e.url) {
      h += '<a class="sheet-go" href="' + esc(e.url) + '" target="_blank" rel="noopener">' +
        'Go to the listing ↗</a>';
    }
    h += '<a class="sheet-perma" href="event.html?id=' + e.id + '">Open as page →</a>';

    body.innerHTML = h;
    lastFocus = document.activeElement;
    $('scrim').classList.add('open');
    $('sheet').classList.add('open');
    $('sheet').scrollTop = 0;
    document.body.style.overflow = 'hidden';
    var cl = $('sheet-close'); if (cl) cl.focus();
  }

  function closeSheet() {
    var s = $('sheet');
    if (!s || !s.classList.contains('open')) return;
    s.classList.remove('open');
    $('scrim').classList.remove('open');
    if (!document.body.classList.contains('mappage')) document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ── map ───────────────────────────────────────────────────────────── */

  // generous cover for the spotlight mask, [lat,lng]
  var MASK_OUTER = [[39.3, -76.3], [39.3, -74.3], [40.7, -74.3], [40.7, -76.3]];

  var map = null, hoodLayer = null, maskLayer = null, pinLayer = null, fitZone = null;

  // Hairlines have to survive a very light basemap — anything fainter than
  // this simply disappears on Positron.
  function hoodStyle(f) {
    var focused = zone !== 'all' && f.properties.name === zone;
    var hidden = zone !== 'all' && !focused;
    return {
      color: hidden ? 'transparent' : (focused ? '#0c6b2c' : '#a9aaa4'),
      weight: focused ? 2 : 1,
      fill: true, fillColor: focused ? '#0c6b2c' : '#cbe0b8',
      fillOpacity: hidden ? 0 : (focused ? 0.13 : 0.08),
      dashArray: null
    };
  }

  function outerRings(f) {
    var g = f.geometry;
    if (g.type === 'Polygon') return [g.coordinates[0]];
    if (g.type === 'MultiPolygon') return g.coordinates.map(function (p) { return p[0]; });
    return [];
  }
  function flip(ring) { return ring.map(function (c) { return [c[1], c[0]]; }); }

  function featureFor(name) {
    if (!HOODS) return null;
    for (var i = 0; i < HOODS.features.length; i++) {
      if (HOODS.features[i].properties.name === name) return HOODS.features[i];
    }
    return null;
  }

  function initMap() {
    // zoomSnap 0.25: whole-number snapping put the city one step too far out
    // on a laptop-height window — half the fit was New Jersey.
    map = L.map('map', {
      zoomControl: true, scrollWheelZoom: true, minZoom: 10, zoomSnap: 0.25
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    pinLayer = L.layerGroup().addTo(map);

    var key = L.control({ position: 'bottomleft' });
    key.onAdd = function () {
      var el = L.DomUtil.create('div', 'legend');
      el.innerHTML = '<b>Reading the map</b>' +
        'Bigger pin = higher score<br>' +
        'Number = listings at that address<br>' +
        'Dashed = not scored yet';
      L.DomEvent.disableClickPropagation(el);
      return el;
    };
    key.addTo(map);

    if (HOODS) {
      hoodLayer = L.geoJSON(HOODS, {
        style: hoodStyle,
        interactive: false
      }).addTo(map);
      hoodLayer.bringToBack();
    }

    buildPins();
    applyZone(true);
  }

  function setZone(name) {
    zone = name;
    F.hood = name;
    F.hoodChosen = true;
    saveFilters();
    renderFilters();
    if (hoodLayer) hoodLayer.setStyle(hoodStyle);
    buildPins();
    applyZone(true);
  }

  // fit only when the focus actually changed — a filter toggle must never
  // throw away the reader's pan and zoom.
  function applyZone(mayFit) {
    if (!map) return;
    if (maskLayer) { map.removeLayer(maskLayer); maskLayer = null; }
    var feat = zone !== 'all' ? featureFor(zone) : null;
    if (feat) {
      maskLayer = L.polygon([MASK_OUTER].concat(outerRings(feat).map(flip)), {
        stroke: false, fillColor: '#f7f6f2', fillOpacity: 0.76, interactive: false
      }).addTo(map);
      maskLayer.bringToBack();
      if (hoodLayer) hoodLayer.bringToFront();
    }
    if (mayFit && fitZone !== zone && hoodLayer) {
      var b = L.latLngBounds([]);
      hoodLayer.eachLayer(function (l) {
        if (!feat || l.feature.properties.name === zone) b.extend(l.getBounds());
      });
      if (b.isValid()) {
        var narrow = window.matchMedia('(max-width:620px)').matches;
        map.fitBounds(b, feat
          ? { paddingTopLeft: [24, 24], paddingBottomRight: narrow ? [24, 24] : [364, 24] }
          : { padding: [22, 22] });
      }
      fitZone = zone;
    }
    renderPanel();
  }

  function buildPins() {
    if (!map) return;
    var evs = filteredEvents();
    setTally(evs.length);
    updateMapCopy(evs.length);

    var byVenue = {};
    evs.forEach(function (e) {
      if (!e.venue_id) return;
      var v = venueById[e.venue_id];
      if (!v || v.lat == null || v.lng == null) return;
      (byVenue[e.venue_id] = byVenue[e.venue_id] || []).push(e);
    });

    // Size ramp normalised against the current filtered spread, so the pins
    // stay legible when quality only spans a narrow band.
    var tops = [];
    Object.keys(byVenue).forEach(function (vid) {
      var qs = byVenue[vid].map(function (e) { return e.quality; })
        .filter(function (q) { return typeof q === 'number'; });
      if (qs.length) tops.push(Math.max.apply(null, qs));
    });
    tops.sort(function (a, b) { return a - b; });
    var lo = tops.length ? tops[Math.floor(tops.length * 0.10)] : 0;
    var hi = tops.length ? tops[Math.floor(tops.length * 0.90)] : 10;
    var norm = function (q) {
      if (hi <= lo) return 0.5;
      return Math.max(0, Math.min(1, (q - lo) / (hi - lo)));
    };

    pinLayer.clearLayers();
    Object.keys(byVenue).forEach(function (vid) {
      var v = venueById[vid], list = byVenue[vid].slice().sort(rank);
      var qs = list.map(function (e) { return e.quality; })
        .filter(function (q) { return typeof q === 'number'; });
      var top = qs.length ? Math.max.apply(null, qs) : null;
      var n = top == null ? 0 : norm(top);
      var d = top == null ? 14 : Math.round(18 + n * 20);
      var fill = top == null
        ? 'rgba(137,135,129,.14)'
        : 'rgba(12,107,44,' + (0.18 + n * 0.48).toFixed(2) + ')';
      var border = top == null ? '1px dashed rgba(82,81,78,.55)' : '1px solid rgba(10,92,38,.62)';

      var icon = L.divIcon({
        className: 'pin', iconSize: [d, d], iconAnchor: [d / 2, d / 2],
        html: '<i style="background:' + fill + ';border:' + border + '">' +
          (list.length > 1 ? list.length : '') + '</i>'
      });

      var rows = list.slice(0, 6).map(function (e) {
        return '<span class="pop-ev" role="button" tabindex="0" data-ev="' + e.id + '">' +
          esc(e.name) + (isJoinable(e) ? ' <span class="gl-series">↻</span>' : '') +
          '<br><span class="w">' + esc(fmtShort(e.date)) +
          (typeof e.quality === 'number' ? ' · ' + e.quality.toFixed(1) : '') + '</span></span>';
      }).join('');
      var more = list.length > 6
        ? '<div class="ml pop-more">+' + (list.length - 6) + ' more</div>' : '';

      L.marker([v.lat, v.lng], { icon: icon, title: v.name })
        .bindPopup('<div class="pop-t">' + esc(v.name) + '</div>' +
          '<div class="ml">' + list.length + (list.length === 1 ? ' listing' : ' listings') +
          (top != null ? ' · top ' + top.toFixed(1) : '') + '</div>' + rows + more)
        .addTo(pinLayer);
    });
  }

  function renderPanel() {
    var el = $('panel');
    if (!el) return;
    if (zone === 'all') { el.classList.remove('show'); return; }
    var evs = filteredEvents().filter(function (e) { return hoodOf(e) === zone; }).sort(chrono);
    var rows = evs.length ? evs.map(function (e) {
      return '<div class="pev" role="button" tabindex="0" data-ev="' + e.id + '">' +
        '<span class="pev-name">' + esc(e.name) + '</span>' +
        (isJoinable(e) ? '<span class="gl-series">↻</span>' : '') +
        '<div class="pev-meta">' + esc(fmtDayHead(e.date)) +
        (fmtTime(e) ? ' · ' + esc(fmtTime(e)) : '') +
        (e.venue ? ' · ' + esc(e.venue) : '') +
        (typeof e.quality === 'number' ? ' · <span class="q">' + e.quality.toFixed(1) + '</span>' : '') +
        '</div></div>';
    }).join('') : '<p class="panel-empty">Nothing here in these dates. Try fewer filters — ' +
      'or the Bulletin has not found this neighborhood\'s calendars yet.</p>';

    el.innerHTML = '<div class="panel-head"><h2>' + esc(zone) + '</h2>' +
      '<span class="ml">' + evs.length + (evs.length === 1 ? ' listing' : ' listings') +
      ' · ' + esc(F.day ? dayChoiceLabel(F.day) : WIN.label) + '</span>' +
      '<button class="panel-x" type="button" data-hood="all" title="Show all of Philly" aria-label="Show all of Philly">✕</button>' +
      '</div><div class="panel-list">' + rows + '</div>';
    el.classList.add('show');
  }

  var refreshTimer = null;
  function mapRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { buildPins(); renderPanel(); }, 90);
  }

  /* ── source board + source pages (current facts only) ─────────────── */

  var sourceQuery = '', sourceStatus = 'all', sourceAdapter = 'all';

  function sourceKindText(kind) {
    if (!kind) return 'public calendar';
    return String(kind).replace(/_/g, ' ').replace(/\bwp\b/i, 'WordPress');
  }

  function hostOf(url) {
    if (!url) return '';
    var m = String(url).match(/^https?:\/\/(?:www\.)?([^/]+)/i);
    return m ? m[1] : '';
  }

  // one-off adapter kinds collapse to "custom" so the filter row stays short
  function adapterFamily(s, counts) {
    return counts[s.kind] >= 2 ? s.kind : 'custom';
  }

  function adapterCounts() {
    var counts = {};
    (DB.sources || []).forEach(function (s) { counts[s.kind] = (counts[s.kind] || 0) + 1; });
    return counts;
  }

  function sourceGlyph(s) {
    if (s.scraper_status === 'built') {
      return (s.event_count || 0) > 0
        ? '<span class="st-ok">● built</span> · ' + s.event_count + ' event' + (s.event_count === 1 ? '' : 's') + ' this week'
        : '<span class="st-warn">▲ built</span> · 0 in window';
    }
    if (s.scraper_status === 'planned') return '<span class="st-plan">○ planned</span> · no pipeline yet';
    return '<span class="st-plan">○ known</span> · not planned yet';
  }

  function sourceCardHTML(s) {
    var domain = hostOf(s.website);
    return '<a class="scard" href="source.html?id=' + encodeURIComponent(s.id) + '">' +
      '<span class="n">' + esc(s.name) + '</span>' +
      '<div class="d">' + esc(domain ? domain + ' · ' : '') + esc(sourceKindText(s.kind)) + '</div>' +
      '<div class="st">' + sourceGlyph(s) + '</div></a>';
  }

  function renderSourceFilterRow(key, label, options, current) {
    var h = '<div class="frow" data-sfilter="' + key + '"><span class="flabel">' + label + '</span>';
    options.forEach(function (o) {
      h += '<button class="pillbtn" type="button" data-val="' + esc(o.val) + '" aria-pressed="' +
        (current === o.val ? 'true' : 'false') + '">' + esc(o.label) +
        '<span class="n">' + o.count + '</span></button>';
    });
    return h + '</div>';
  }

  function renderSourceFilters() {
    var host = $('source-filters');
    if (!host) return;
    var all = DB.sources || [];
    var counts = adapterCounts();
    var statusOpts = [{ val: 'all', label: 'all', count: all.length }];
    [['built', 'built'], ['planned', 'planned'], ['none', 'known']].forEach(function (p) {
      var n = all.filter(function (s) { return s.scraper_status === p[0]; }).length;
      if (n) statusOpts.push({ val: p[0], label: p[1], count: n });
    });
    var famCounts = {};
    all.forEach(function (s) {
      var f = adapterFamily(s, counts);
      famCounts[f] = (famCounts[f] || 0) + 1;
    });
    var adapterOpts = [{ val: 'all', label: 'all', count: all.length }];
    Object.keys(famCounts).sort(function (a, b) { return famCounts[b] - famCounts[a]; }).forEach(function (f) {
      adapterOpts.push({ val: f, label: sourceKindText(f), count: famCounts[f] });
    });
    host.innerHTML =
      '<div class="frow"><span class="flabel">Search</span>' +
      '<input id="source-search" type="search" placeholder="Source name or site" autocomplete="off" value="' +
      esc(sourceQuery) + '" aria-label="Search sources"></div>' +
      renderSourceFilterRow('status', 'Status', statusOpts, sourceStatus) +
      renderSourceFilterRow('adapter', 'Adapter', adapterOpts, sourceAdapter);
  }

  function renderSources() {
    var host = $('source-board');
    if (!host) return;
    var counts = adapterCounts();
    var q = sourceQuery.trim().toLowerCase();
    var all = DB.sources || [];
    var sources = all.filter(function (s) {
      if (sourceStatus !== 'all' && s.scraper_status !== sourceStatus) return false;
      if (sourceAdapter !== 'all' && adapterFamily(s, counts) !== sourceAdapter) return false;
      if (!q) return true;
      return [s.name, s.kind, s.website, s.scraper_status].join(' ').toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) {
      var ab = a.scraper_status === 'built' ? 1 : 0, bb = b.scraper_status === 'built' ? 1 : 0;
      if (ab !== bb) return bb - ab;
      if ((a.event_count || 0) !== (b.event_count || 0)) return (b.event_count || 0) - (a.event_count || 0);
      return String(a.name).localeCompare(String(b.name));
    });
    host.innerHTML = sources.map(sourceCardHTML).join('');
    var empty = $('board-empty'); if (empty) empty.classList.toggle('show', !sources.length);
    var gc = $('grid-count'); if (gc) gc.textContent = sources.length + ' / ' + all.length;
    var tally = $('source-tally'); if (tally) tally.textContent = sources.length + ' of ' + all.length + ' sources';
  }

  function stampBoard() {
    var st = $('board-stamp');
    if (st && DB.generated) st.textContent = 'stamped by export · ' + fmtShort(DB.generated.slice(0, 10));
    var code = $('board-code');
    if (code) {
      var m = DB.meta || {};
      code.innerHTML = '$ engine export\n' +
        'sources    <span class="g">' + (m.sources || 0) + ' known · ' + (m.scrapers_built || 0) + ' built</span>\n' +
        'events     <span class="g">' + (m.events || 0) + ' in window · ' + (m.scored || 0) + ' scored</span>\n' +
        'venues     <span class="g">' + (m.venues || 0) + ' known · ' + (m.venues_with_feeds || 0) + ' with feeds</span>\n' +
        'window     <span class="g">[today, today + 7d)</span>';
    }
  }

  function wireSourceFilters() {
    var host = $('source-filters');
    if (!host) return;
    host.addEventListener('input', function (ev) {
      if (ev.target.id === 'source-search') { sourceQuery = ev.target.value; renderSources(); }
    });
    host.addEventListener('click', function (ev) {
      var b = ev.target.closest('.pillbtn');
      if (!b) return;
      var row = b.closest('[data-sfilter]');
      if (!row) return;
      if (row.dataset.sfilter === 'status') sourceStatus = b.dataset.val;
      else sourceAdapter = b.dataset.val;
      row.querySelectorAll('.pillbtn').forEach(function (p) {
        p.setAttribute('aria-pressed', p === b ? 'true' : 'false');
      });
      renderSources();
    });
  }

  /* ── source detail page ────────────────────────────────────────────── */

  function sourceInitials(name) {
    var words = String(name).split(/\s+/).filter(Boolean);
    return words.length > 1
      ? (words[0][0] + words[1][0]).toUpperCase()
      : String(name).slice(0, 2).replace(/^\w/, function (c) { return c.toUpperCase(); });
  }

  // venues linked to this source: through the week's events and through
  // venue feed links (which also carry usefulness + notes from the ledger)
  function sourceCoverage(src, evs) {
    var byVenue = {};
    evs.forEach(function (e) {
      if (!e.venue_id) return;
      if (!byVenue[e.venue_id]) byVenue[e.venue_id] = { id: e.venue_id, name: e.venue, count: 0, feed: null };
      byVenue[e.venue_id].count++;
    });
    (DB.venues || []).forEach(function (v) {
      (v.feeds || []).forEach(function (f) {
        if (f.source_id !== src.id) return;
        if (!byVenue[v.id]) byVenue[v.id] = { id: v.id, name: v.name, count: 0, feed: null };
        byVenue[v.id].feed = f;
      });
    });
    Object.keys(byVenue).forEach(function (id) {
      var v = venueById[id];
      if (v) byVenue[id].hood = v.neighborhood;
    });
    return Object.keys(byVenue).map(function (id) { return byVenue[id]; })
      .sort(function (a, b) { return b.count - a.count || String(a.name).localeCompare(String(b.name)); });
  }

  function sourceLede(src, evs, coverage) {
    var kind = sourceKindText(src.kind);
    if (src.scraper_status !== 'built') {
      return esc(src.name) + ' is in the registry but has no pipeline yet' +
        (src.scraper_status === 'planned' ? ' — it has been scouted and is planned for a build.' :
          ' — it is known, not yet planned.') + ' Nothing on the bulletin comes from here so far.';
    }
    var base = src.is_aggregator
      ? 'A city-wide aggregator: one pipeline fans out to <code>' + coverage.length +
        ' venues</code>, resolving venue and neighborhood per event.'
      : 'A dedicated calendar: this pipeline reads ' + esc(src.name) + '’s own listings.';
    return base + ' The adapter speaks <code>' + esc(kind) + '</code>' +
      (src.has_api ? ' against a real API' : '') +
      ', and every event it lands is normalized into the same shape as every other source.';
  }

  function evrowHTML(e) {
    return '<div class="evrow" data-ev="' + e.id + '" role="button" tabindex="0">' +
      '<span class="when">' + esc(fmtShort(e.date)) + ' · ' + esc(fmtTime(e)) + '</span>' +
      '<span class="name">' + esc(e.name) +
      ' <span class="at">— ' + esc(e.venue || 'Venue TBA') + (hoodOf(e) ? ' · ' + esc(hoodOf(e)) : '') + '</span></span>' +
      '<span>' + (isFree(e) ? '<span class="free">free</span>' : '') + '</span>' +
      '<span class="q">' + (typeof e.quality === 'number' ? '<b>' + e.quality.toFixed(1) + '</b> quality' : '—') + '</span></div>';
  }

  function renderSourceDetail() {
    var host = $('source-detail');
    if (!host) return;
    var id = new URLSearchParams(location.search).get('id');
    var src = (DB.sources || []).filter(function (s) { return s.id === id; })[0];
    if (!src) {
      host.innerHTML = '<p class="note">No source called <b>' + esc(id || '(none)') +
        '</b> in the ledger. <a href="sources.html">Back to the source board.</a></p>';
      return;
    }
    document.title = src.name + ' — Sources — The Philly Bulletin';
    var crumb = $('crumb-name'); if (crumb) crumb.textContent = src.name;

    var evs = DB.events.filter(function (e) { return e.source_id === src.id; }).sort(chrono);
    var coverage = sourceCoverage(src, evs);
    var feedLinks = coverage.filter(function (c) { return c.feed; }).length;
    var built = src.scraper_status === 'built';
    var domain = hostOf(src.website);
    var checked = src.last_scraped ? fmtShort(src.last_scraped) : null;

    var h = '<header class="dhero">' +
      '<div>' +
      (built ? '<span class="live">Live</span>' :
        '<span class="live plan">' + (src.scraper_status === 'planned' ? 'Planned' : 'Known') + '</span>') +
      '<div class="titleline"><div class="logo" aria-hidden="true">' + esc(sourceInitials(src.name)) + '</div>' +
      '<h1>' + esc(src.name) + '</h1>' +
      (domain ? '<a class="domainchip" href="' + esc(src.website) + '" target="_blank" rel="noopener">' + esc(domain) + ' ↗</a>' : '') +
      '</div>' +
      '<p class="lede">' + sourceLede(src, evs, coverage) + '</p>' +
      '<div class="tags">' +
      '<span class="tag">' + (src.is_aggregator ? 'aggregator' : 'venue calendar') + '</span>' +
      '<span class="tag plain">' + esc(sourceKindText(src.kind)) + '</span>' +
      (src.has_api ? '<span class="tag plain">api</span>' : '') +
      '</div>' +
      '<div class="herostats">' +
      '<div><div class="l">Events this week</div><div class="v">' + evs.length + '</div></div>' +
      '<div><div class="l">Venues fed</div><div class="v">' + coverage.length + '</div></div>' +
      '<div><div class="l">Last checked</div><div class="v">' + (checked ? esc(checked) : '—') + '</div></div>' +
      '<div><div class="l">Adapter</div><div class="v">' + esc(sourceKindText(src.kind)) + '</div></div>' +
      '</div></div>' +
      '<aside class="factcard"><div class="hd"><span class="t">Source facts</span>' +
      (checked ? '<span class="r">checked <b>' + esc(checked) + '</b></span>' : '<span class="r">not checked yet</span>') + '</div>' +
      '<div class="fact"><span>status</span><span class="v">' + esc(src.scraper_status === 'none' ? 'known' : src.scraper_status) + '</span></div>' +
      '<div class="fact"><span>adapter</span><span class="v">' + esc(sourceKindText(src.kind)) + '</span></div>' +
      '<div class="fact"><span>public API</span><span class="v">' + (src.has_api ? 'yes' : 'no') + '</span></div>' +
      '<div class="fact"><span>events in window</span><span class="v">' + evs.length + '</span></div>' +
      '<div class="fact"><span>venues fed</span><span class="v">' + coverage.length + '</span></div>' +
      '<div class="fact"><span>venue feed links</span><span class="v">' + feedLinks + '</span></div>' +
      '<div class="ft"><span>' + (built ? '<b>built</b> — earned by a live probe' : '<b>not built</b> — no pipeline yet') +
      '</span><span class="sh">re-checked on every export</span></div></aside>' +
      '</header>';

    h += '<div class="dmain"><nav class="toc"><div class="t">On this page</div>' +
      '<a href="#about">About this source</a>' +
      (evs.length ? '<a href="#week">This week</a>' : '') +
      (coverage.length ? '<a href="#coverage">Coverage</a>' : '') +
      '<a href="#flow">How it flows</a>' +
      '<a href="#more">More sources</a></nav><div class="dcontent">';

    h += '<section id="about"><h2>What is this source?</h2><p class="prose-note">' +
      sourceLede(src, evs, coverage) +
      (built ? ' Events it lands are scored on six dimensions; the reasons ride along to the listing sheet.' : '') +
      '</p></section>';

    if (evs.length) {
      var shown = evs.slice(0, 12);
      h += '<section id="week"><div class="seclabel"><span>Live output — what this source landed</span>' +
        '<span>quality scored on six dimensions</span></div><h2>This week from ' + esc(src.name) + '</h2>' +
        '<div class="week">' + shown.map(evrowHTML).join('') +
        '<div class="ft">' + evs.length + ' event' + (evs.length === 1 ? '' : 's') +
        ' this week from this source · every one carries venue, time, cost, and its scores · tap a row for the reasons</div>' +
        '</div></section>';
    } else if (built) {
      h += '<section id="week"><h2>This week from ' + esc(src.name) + '</h2>' +
        '<p class="note empty">The pipeline is built and checked, but nothing from here landed in the current window.</p></section>';
    }

    if (coverage.length) {
      var covShown = coverage.slice(0, 12);
      h += '<section id="coverage"><div class="seclabel"><span>Venues this source feeds · ' + coverage.length +
        ' total</span></div><h2>Coverage</h2><div class="cov">';
      covShown.forEach(function (c) {
        var note = !c.feed ? '' : c.feed.primary ? 'primary feed' :
          (c.feed.usefulness && c.feed.usefulness !== 'unknown') ? c.feed.usefulness + ' usefulness' : '';
        h += '<div class="covrow"><div class="covhead"><span class="pill">VENUE</span>' +
          '<span class="vname"><a href="venue.html?id=' + encodeURIComponent(c.id) + '">' +
          esc(c.name || c.id) + '</a>' +
          (c.hood ? ' <span class="hood">· ' + esc(c.hood) + '</span>' : '') + '</span>' +
          '<span class="yield">' + (c.count ? c.count + ' this week' : 'no yield yet') + '</span>' +
          '<span class="covnote">' + esc(note) + '</span></div></div>';
      });
      if (coverage.length > covShown.length) {
        h += '<div class="ask">+ ' + (coverage.length - covShown.length) +
          ' more venues · a venue joins this list the first time this source lands an event there</div>';
      }
      h += '</div></section>';
    }

    h += '<section id="flow"><div class="band"><div class="cols"><div>' +
      '<div class="seclabel" style="color:var(--green-ink)"><span>Pipeline · how one feed becomes ranked events</span></div>' +
      '<h2>Scraped, resolved, scored</h2>' +
      '<p class="sub">Every source — aggregator or single venue — flows through the same contract, ' +
      'so the city stays coherent no matter where an event came from.</p>' +
      '<ul class="ticks">' +
      '<li>One normalized event shape, shared by every adapter</li>' +
      '<li>Venues resolved against the ledger, never duplicated</li>' +
      '<li>Recurring series detected, so weekly nights don’t drown the board</li>' +
      '<li>Quality scored on six dimensions · reasons kept, not just numbers</li></ul></div>' +
      '<pre class="code">$ engine ingest --source ' + esc(src.id) + '\n' +
      'status     <span class="g">' + esc(src.scraper_status === 'none' ? 'known' : src.scraper_status) + '</span>\n' +
      'checked    <span class="g">' + (checked ? esc(checked) : 'never') + '</span>\n' +
      'events     <span class="g">' + evs.length + ' in window</span>\n' +
      'resolve    <span class="g">' + coverage.length + ' venue' + (coverage.length === 1 ? '' : 's') + '</span></pre>' +
      '</div></div></section>';

    var others = (DB.sources || []).filter(function (s) { return s.id !== src.id; })
      .sort(function (a, b) { return (b.event_count || 0) - (a.event_count || 0); }).slice(0, 4);
    h += '<section id="more"><div class="seclabel"><span>From the source board</span>' +
      '<span><a href="sources.html">browse all ' + (DB.sources || []).length + ' →</a></span></div>' +
      '<h2>More sources</h2><div class="strip">' + others.map(sourceCardHTML).join('') + '</div></section>';

    h += '</div></div>';
    host.innerHTML = h;
  }

  /* ── venue + event pages (permalinks off the map and the sheet) ────── */

  function venueKindText(kind) {
    if (!kind || kind === 'other') return 'venue';
    return String(kind).replace(/_/g, ' ');
  }

  // derived hood first — the exported neighborhood field is null for most venues
  function venueHood(v) {
    return hoodOfVenue[v.id] || v.neighborhood || null;
  }

  function weekCountByVenue() {
    var counts = {};
    DB.events.forEach(function (e) {
      if (e.venue_id) counts[e.venue_id] = (counts[e.venue_id] || 0) + 1;
    });
    return counts;
  }

  function venueCardHTML(v, n) {
    var hood = venueHood(v);
    return '<a class="scard" href="venue.html?id=' + encodeURIComponent(v.id) + '">' +
      '<span class="n">' + esc(v.name) + '</span>' +
      '<div class="d">' + esc(venueKindText(v.kind)) + (hood ? ' · ' + esc(hood) : '') + '</div>' +
      '<div class="st">' + (v.pipeline === 'built' ? '<span class="st-ok">● live</span> · ' : '') +
      n + ' event' + (n === 1 ? '' : 's') + ' this week</div></a>';
  }

  function venueLede(v, hood) {
    var feeds = v.feeds || [];
    var kind = venueKindText(v.kind);
    var h = (/^[aeiou]/i.test(kind) ? 'An ' : 'A ') + esc(kind) +
      (hood ? ' in ' + esc(hood) : '') +
      (v.address ? ', at ' + esc(String(v.address).replace(/\.\s*$/, '')) : '') + '.';
    if (v.hosts_events === 'regular') h += ' It hosts events regularly.';
    else if (v.hosts_events === 'occasional') h += ' It hosts events now and then.';
    if (v.pipeline === 'built') {
      h += ' ' + (feeds.length > 1
        ? '<code>' + feeds.length + ' pipelines</code> watch its listings'
        : 'A pipeline reads its listings') +
        ', and everything they land is scored like the rest of the bulletin.';
    } else if (feeds.length) {
      h += ' Feeds are linked, but no pipeline has landed events from here yet.';
    } else {
      h += ' The bulletin knows this venue, but no pipeline reads its calendar yet.';
    }
    return h;
  }

  function renderVenueDetail() {
    var host = $('venue-detail');
    if (!host) return;
    var id = new URLSearchParams(location.search).get('id');
    var v = id ? venueById[id] : null;
    if (!v) {
      host.innerHTML = '<p class="note">No venue called <b>' + esc(id || '(none)') +
        '</b> in the ledger. <a href="map.html">Back to the map.</a></p>';
      return;
    }
    document.title = v.name + ' — The Philly Bulletin';
    var crumb = $('crumb-name'); if (crumb) crumb.textContent = v.name;

    var evs = DB.events.filter(function (e) { return e.venue_id === v.id; }).sort(chrono);
    var feeds = v.feeds || [];
    var hood = venueHood(v);
    var built = v.pipeline === 'built';
    var domain = hostOf(v.website);
    var bySrc = {};
    evs.forEach(function (e) {
      if (e.source_id) bySrc[e.source_id] = (bySrc[e.source_id] || 0) + 1;
    });

    var h = '<header class="dhero"><div>' +
      (built ? '<span class="live">Live</span>' : '<span class="live plan">Known</span>') +
      '<div class="titleline"><div class="logo" aria-hidden="true">' + esc(sourceInitials(v.name)) + '</div>' +
      '<h1>' + esc(v.name) + '</h1>' +
      (domain ? '<a class="domainchip" href="' + esc(v.website) + '" target="_blank" rel="noopener">' + esc(domain) + ' ↗</a>' : '') +
      '</div>' +
      '<p class="lede">' + venueLede(v, hood) + '</p>' +
      '<div class="tags">' +
      '<span class="tag">' + esc(venueKindText(v.kind)) + '</span>' +
      (hood ? '<span class="tag plain">' + esc(hood) + '</span>' : '') +
      '<span class="tag plain">' + (built ? 'pipeline built' : 'no pipeline yet') + '</span>' +
      '</div>' +
      '<div class="herostats">' +
      '<div><div class="l">Events this week</div><div class="v">' + evs.length + '</div></div>' +
      '<div><div class="l">Feeds</div><div class="v">' + feeds.length + '</div></div>' +
      (hood ? '<div><div class="l">Neighborhood</div><div class="v">' + esc(hood) + '</div></div>' : '') +
      (v.verified_by ? '<div><div class="l">Verified by</div><div class="v">' + esc(v.verified_by) + '</div></div>' : '') +
      '</div></div>' +
      '<aside class="factcard"><div class="hd"><span class="t">Venue facts</span>' +
      '<span class="r"><b>' + evs.length + '</b> this week</span></div>' +
      (v.address ? '<div class="fact"><span>address</span><span class="v">' + esc(v.address) + '</span></div>' : '') +
      (hood ? '<div class="fact"><span>neighborhood</span><span class="v">' + esc(hood) + '</span></div>' : '') +
      '<div class="fact"><span>kind</span><span class="v">' + esc(venueKindText(v.kind)) + '</span></div>' +
      '<div class="fact"><span>pipeline</span><span class="v">' + esc(v.pipeline || 'none') + '</span></div>' +
      (v.hosts_events && v.hosts_events !== 'unknown'
        ? '<div class="fact"><span>hosts events</span><span class="v">' + esc(v.hosts_events) + '</span></div>' : '') +
      '<div class="fact"><span>feeds</span><span class="v">' + feeds.length + '</span></div>' +
      '<div class="ft"><span>' + (built ? '<b>built</b> — a live probe landed events here'
        : '<b>no pipeline</b> — nothing lands here yet') +
      '</span><span class="sh">re-checked on every export</span></div></aside></header>';

    h += '<div class="dmain"><nav class="toc"><div class="t">On this page</div>' +
      '<a href="#week">This week</a>' +
      (feeds.length ? '<a href="#feeds">Feeds</a>' : '') +
      '<a href="#more">More venues</a></nav><div class="dcontent">';

    if (evs.length) {
      var shown = evs.slice(0, 12);
      h += '<section id="week"><div class="seclabel"><span>What the pipelines landed here</span>' +
        '<span>tap a row for the six reasons</span></div>' +
        '<h2>This week at ' + esc(v.name) + '</h2>' +
        '<div class="week">' + shown.map(evrowHTML).join('') +
        '<div class="ft">' + evs.length + ' event' + (evs.length === 1 ? '' : 's') +
        ' this week at this venue · every row carries time, cost, and its scores</div></div></section>';
    } else {
      h += '<section id="week"><h2>This week at ' + esc(v.name) + '</h2>' +
        '<p class="note empty">Nothing from this venue landed in the current window.</p></section>';
    }

    if (feeds.length) {
      h += '<section id="feeds"><div class="seclabel"><span>' + feeds.length +
        (feeds.length === 1 ? ' pipeline watches' : ' pipelines watch') + ' this venue</span></div>' +
        '<h2>Feeds</h2><div class="cov">';
      feeds.forEach(function (f) {
        var n = bySrc[f.source_id] || 0;
        var glyph = f.scraper_status === 'built'
          ? (n ? '<span class="st-ok">● built</span>' : '<span class="st-warn">▲ built</span>')
          : f.scraper_status === 'planned' ? '<span class="st-plan">○ planned</span>'
            : '<span class="st-plan">○ known</span>';
        h += '<div class="covrow"><div class="covhead"><span class="pill">SOURCE</span>' +
          '<span class="vname"><a href="source.html?id=' + encodeURIComponent(f.source_id) + '">' +
          esc(f.name || f.source_id) + '</a>' +
          ' <span class="hood">· ' + esc(sourceKindText(f.kind)) + (f.primary ? ' · primary' : '') + '</span></span>' +
          '<span class="yield">' + (n ? n + ' this week' : 'no yield this week') + '</span>' +
          '<span class="covnote">' + glyph + '</span></div></div>';
      });
      h += '</div></section>';
    }

    var counts = weekCountByVenue();
    var others = DB.venues.filter(function (o) { return o.id !== v.id && counts[o.id]; })
      .sort(function (a, b) {
        return counts[b.id] - counts[a.id] || String(a.name).localeCompare(String(b.name));
      }).slice(0, 4);
    if (others.length) {
      h += '<section id="more"><div class="seclabel"><span>Also on the bulletin this week</span>' +
        '<span><a href="map.html">the map →</a></span></div>' +
        '<h2>More venues</h2><div class="strip">' +
        others.map(function (o) { return venueCardHTML(o, counts[o.id]); }).join('') +
        '</div></section>';
    }

    h += '</div></div>';
    host.innerHTML = h;
  }

  function renderEventDetail() {
    var host = $('event-detail');
    if (!host) return;
    var raw = new URLSearchParams(location.search).get('id');
    var e = null;
    if (raw != null && raw !== '') {
      for (var i = 0; i < DB.events.length; i++) {
        if (DB.events[i].id === +raw) { e = DB.events[i]; break; }
      }
    }
    if (!e) {
      host.innerHTML = '<p class="note">No listing with id <b>' + esc(raw || '(none)') +
        '</b> in this week’s bundle — permalinks only last as long as the export they came from. ' +
        '<a href="index.html">Back to the bulletin.</a></p>';
      return;
    }
    document.title = e.name + ' — The Philly Bulletin';
    var crumb = $('crumb-name'); if (crumb) crumb.textContent = e.name;

    var sr = seriesOf(e);
    var hood = hoodOf(e);
    var t = fmtTime(e);
    var c = costLabel(e);
    var v = e.venue_id ? venueById[e.venue_id] : null;

    var meta = [];
    if (v) meta.push('<a href="venue.html?id=' + encodeURIComponent(v.id) + '">' + esc(v.name) + '</a>');
    else if (e.venue) meta.push(esc(e.venue));
    if (hood) meta.push(esc(hood));
    if (e.date) meta.push(esc(longName(dateObj(e.date))));
    if (t) meta.push(esc(t));
    if (isFree(e)) meta.push('<span class="free">Free</span>');
    else if (c) meta.push(esc(c));

    var tagbits = '';
    if (isFree(e)) tagbits += '<span class="tag">free</span>';
    if (sr && JOINABLE[sr.cadence]) {
      tagbits += '<span class="tag plain">↻ ' + esc((CADENCE[sr.cadence] || sr.cadence).toLowerCase()) + '</span>';
    }
    if (e.all_day) tagbits += '<span class="tag plain">all day</span>';

    var h = '<header class="dhero"><div>' +
      (e.date ? '<span class="live' + (e.date < todayISO() ? ' plan' : '') + '">' +
        esc(dayChoiceLabel(e.date)) + '</span>' : '') +
      '<div class="titleline"><h1>' + esc(e.name) + '</h1></div>' +
      (meta.length ? '<div class="metaline">' + meta.join('<span class="dot">·</span>') + '</div>' : '') +
      (e.description ? '<p class="lede">' + esc(e.description) + '</p>' : '') +
      (tagbits ? '<div class="tags">' + tagbits + '</div>' : '') +
      '<div class="herostats">' +
      (e.date ? '<div><div class="l">When</div><div class="v">' + esc(fmtShort(e.date)) +
        (t ? ' · ' + esc(t) : '') + '</div></div>' : '') +
      '<div><div class="l">Cost</div><div class="v">' + (isFree(e) ? 'Free' : (c ? esc(c) : '—')) + '</div></div>' +
      '<div><div class="l">Quality</div><div class="v">' +
      (typeof e.quality === 'number' ? e.quality.toFixed(1) : '—') + '</div></div>' +
      '<div><div class="l">Series</div><div class="v">' +
      (sr ? esc(CADENCE[sr.cadence] || sr.cadence) : 'One-off') + '</div></div>' +
      '</div></div>' +
      '<aside class="factcard"><div class="hd"><span class="t">Listing facts</span>' +
      (typeof e.quality === 'number'
        ? '<span class="r"><b>' + e.quality.toFixed(1) + '</b> / 10</span>'
        : '<span class="r">not scored yet</span>') + '</div>' +
      (e.date ? '<div class="fact"><span>date</span><span class="v">' + esc(fmtDayHead(e.date)) + '</span></div>' : '') +
      (t ? '<div class="fact"><span>time</span><span class="v">' + esc(t) + '</span></div>' : '') +
      (v ? '<div class="fact"><span>venue</span><span class="v"><a href="venue.html?id=' +
        encodeURIComponent(v.id) + '">' + esc(v.name) + '</a></span></div>'
        : e.venue ? '<div class="fact"><span>venue</span><span class="v">' + esc(e.venue) + '</span></div>' : '') +
      (hood ? '<div class="fact"><span>neighborhood</span><span class="v">' + esc(hood) + '</span></div>' : '') +
      (isFree(e) ? '<div class="fact"><span>cost</span><span class="v">Free</span></div>'
        : c ? '<div class="fact"><span>cost</span><span class="v">' + esc(c) + '</span></div>' : '') +
      (sr ? '<div class="fact"><span>recurs</span><span class="v">' + esc(CADENCE[sr.cadence] || sr.cadence) + '</span></div>' : '') +
      '<div class="ft"><span>' + (e.url ? 'listing at <b>' + esc(hostOf(e.url)) + '</b>' : 'no listing link') +
      '</span><span class="sh">from this week’s export</span></div></aside></header>';

    h += '<div class="dmain one"><div class="dcontent"><section id="why">';
    if (e.scores) {
      h += '<div class="seclabel"><span>Quality — six dimensions, weighted</span>' +
        (typeof e.quality === 'number' ? '<span>' + e.quality.toFixed(1) + ' / 10 overall</span>' : '') +
        '</div><h2>Why it scores</h2>' + dimsHTML(e);
    } else {
      h += '<h2>Why it scores</h2>' +
        '<p class="unscored">Not scored yet. This one has not been read against the ' +
        'six questions — it still shows up, it just has no score.</p>';
    }
    if (e.url) {
      h += '<a class="sheet-go" href="' + esc(e.url) + '" target="_blank" rel="noopener">See the listing ↗</a>';
    }
    h += '</section>';

    var others = DB.events.filter(function (o) { return o.id !== e.id; }).sort(rank).slice(0, 6);
    if (others.length) {
      h += '<section id="more"><div class="seclabel"><span>From the same week · best first</span>' +
        '<span><a href="index.html">the full bulletin →</a></span></div>' +
        '<h2>More this week</h2><div class="week">' + others.map(evrowHTML).join('') +
        '<div class="ft">ranked by community-weighted quality · tap a row for its six reasons</div></div></section>';
    }

    h += '</div></div>';
    host.innerHTML = h;
  }

  /* ── boot ──────────────────────────────────────────────────────────── */

  // The reader gets a plain sentence; the technical detail goes to the console,
  // where the only person who needs it will be looking.
  function fail(msg) {
    if (window.console && console.error) console.error('The Philly Bulletin: ' + msg);
    var host = $('bulletin') || $('map') || $('source-board') || $('source-detail') ||
      $('venue-detail') || $('event-detail');
    if (host) {
      host.innerHTML = '<p class="note">The listings did not load. Refresh the page, ' +
        'or try again in a minute.</p>';
    }
  }

  // The dateline is composed here rather than in markup so it never flashes
  // half-empty separators while data.json is in flight.
  function stamp() {
    var dl = $('dateline');
    if (dl) {
      var parts = [];
      if (dl.dataset.today === '1') parts.push(longName(new Date()));
      if (dl.dataset.lead) parts.push(dl.dataset.lead);
      parts.push(DB.events.length + (DB.events.length === 1 ? ' listing' : ' listings'));
      if (DB.generated) parts.push('Updated ' + fmtShort(DB.generated.slice(0, 10)));
      dl.textContent = parts.join('  ·  ');
    }

    var count = DB.events.length;
    var nav = $('nav-count');
    if (nav) nav.textContent = count + (count === 1 ? ' listing this week' : ' listings this week');
    var su = $('stat-updated'); if (su) su.textContent = DB.generated ? fmtShort(DB.generated) : '—';
    var sk = $('source-known'); if (sk) sk.textContent = DB.meta && DB.meta.sources != null ? DB.meta.sources : (DB.sources || []).length;
    var sb = $('source-built'); if (sb) sb.textContent = DB.meta && DB.meta.scrapers_built != null ? DB.meta.scrapers_built : '—';
    var sp = $('source-todo'); if (sp) sp.textContent = DB.meta && DB.meta.scrapers_todo != null ? DB.meta.scrapers_todo : '—';
    var sf = $('source-links'); if (sf) sf.textContent = DB.meta && DB.meta.feed_links != null ? DB.meta.feed_links : '—';
  }

  function boot() {
    var isMap = !!$('map');
    var isSources = !!$('source-board');
    var isSourceDetail = !!$('source-detail');
    var isVenue = !!$('venue-detail');
    var isEvent = !!$('event-detail');

    // A page with none of the surfaces (about.html) needs no 2 MB bundle.
    if (!isMap && !$('bulletin') && !isSources && !isSourceDetail && !isVenue && !isEvent) return;

    Promise.all([
      fetch('data.json', { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('data.json ' + r.status);
        return r.json();
      }),
      fetch('philly_hoods.geojson')
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
    ]).then(function (res) {
      DB = res[0];
      HOODS = res[1];
      DB.events = DB.events || [];
      DB.venues = DB.venues || [];
      DB.series = DB.series || [];          // absent in pre-v1 exports
      DB.venues.forEach(function (v) { venueById[v.id] = v; });
      DB.series.forEach(function (s) { seriesById[s.id] = s; });
      deriveHoods();

      loadFilters();
      // The public bundle is one week. Ignore older session state from the
      // former 14/90-day UI so the label and filters stay honest.
      F.win = 7;
      var availableDays = {};
      DB.events.forEach(function (e) { if (e.date) availableDays[e.date] = 1; });
      if (!F.day || !availableDays[F.day]) {
        F.day = availableDays[todayISO()] ? todayISO() : Object.keys(availableDays).sort()[0] || '';
      }
      var availableHoods = {};
      DB.events.forEach(function (e) { var h = hoodOf(e); if (h) availableHoods[h] = 1; });
      // Older saved state used the whole city as an implicit default. Treat it
      // as Rittenhouse until someone deliberately chooses Philly.
      if (F.hood === 'all' && !F.hoodChosen && availableHoods.Rittenhouse) F.hood = 'Rittenhouse';
      if (F.hood !== 'all' && !availableHoods[F.hood]) F.hood = 'all';
      zone = F.hood;
      resolveWindow();
      renderFilters();
      stamp();

      if (isSources) {
        renderSourceFilters(); renderSources(); stampBoard(); wireSourceFilters();
      } else if (isSourceDetail) {
        renderSourceDetail();
      } else if (isVenue) {
        renderVenueDetail();
      } else if (isEvent) {
        renderEventDetail();
      } else if (isMap) {
        wireFilters(mapRefresh);
        initMap();
      } else {
        wireFilters(renderBulletin);
        renderBulletin();
      }
    }).catch(function (err) {
      fail(err && err.message ? err.message : String(err));
    });

    // one delegated handler covers listings, panel rows and map popups
    document.addEventListener('click', function (ev) {
      var hb = ev.target.closest('[data-hood]');
      if (hb) { if (map) { map.closePopup(); } setZone(hb.dataset.hood); return; }
      var clear = ev.target.closest('[data-clear]');
      if (clear) {
        F.free = F.solo = F.join = false; F.minq = 0; F.query = ''; F.hood = 'all'; F.hoodChosen = true;
        saveFilters(); renderFilters(); renderBulletin(); return;
      }
      var t = ev.target.closest('[data-ev]');
      if (t) { if (map) map.closePopup(); openSheet(+t.dataset.ev); }
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { closeSheet(); return; }
      if (ev.key === 'Enter' || ev.key === ' ') {
        var t = ev.target && ev.target.closest && ev.target.closest('[data-ev]');
        if (t) { ev.preventDefault(); openSheet(+t.dataset.ev); }
      }
    });

    var scrim = $('scrim'); if (scrim) scrim.addEventListener('click', closeSheet);
    var cl = $('sheet-close'); if (cl) cl.addEventListener('click', closeSheet);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();

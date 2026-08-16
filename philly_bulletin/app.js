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
      '<label class="find-field"><span>I’m in</span>' +
      '<input id="map-hood-search" type="search" list="map-hood-options" value="' +
      esc(F.hood === 'all' ? 'Philly' : F.hood) +
      '" placeholder="Search neighborhoods" autocomplete="off" aria-label="Neighborhood">' +
      '<datalist id="map-hood-options"><option value="Philly"></option>';
    if (HOODS) {
      HOODS.features.map(function (f) { return f.properties.name; }).sort().forEach(function (name) {
        h += '<option value="' + esc(name) + '"></option>';
      });
    }
    h += '</datalist></label></div>' + advancedHTML() +
      '<div class="filter-tally ml" id="tally"></div>';
    return h;
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
      else if (ev.target.id === 'map-hood-search') {
        var hood = matchHood(ev.target.value);
        if (hood == null) {
          ev.target.value = F.hood === 'all' ? 'Philly' : F.hood;
          return;
        }
        setZone(hood);
        return;
      }
      else return;
      saveFilters(); onChange();
    });
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
        '</div>';
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
    } else {
      h += '<p class="unscored">Not scored yet. This one has not been read against the ' +
        'six questions — it still shows up, it just has no score.</p>';
    }

    if (e.url) {
      h += '<a class="sheet-go" href="' + esc(e.url) + '" target="_blank" rel="noopener">' +
        'Go to the listing ↗</a>';
    }

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

  /* ── source board (current facts only; no illustrative history) ───── */

  var sourceQuery = '', sourceStatus = 'all';

  function sourceStatusText(s) {
    if (s.scraper_status === 'built') return '<span class="st-ok">● built</span>';
    if (s.scraper_status === 'broken') return '<span class="st-fix">■ needs repair</span>';
    if (s.scraper_status === 'planned') return '<span class="st-plan">○ planned</span>';
    return '<span class="st-plan">○ known</span>';
  }

  function sourceKindText(kind) {
    if (!kind) return 'public calendar';
    return String(kind).replace(/_/g, ' ').replace(/\bwp\b/i, 'WordPress');
  }

  function renderSources() {
    var host = $('source-board');
    if (!host) return;
    var q = sourceQuery.trim().toLowerCase();
    var sources = (DB.sources || []).filter(function (s) {
      if (sourceStatus !== 'all' && s.scraper_status !== sourceStatus) return false;
      if (!q) return true;
      return [s.name, s.kind, s.website, s.scraper_status].join(' ').toLowerCase().indexOf(q) !== -1;
    }).sort(function (a, b) {
      var ab = a.scraper_status === 'built' ? 1 : 0, bb = b.scraper_status === 'built' ? 1 : 0;
      if (ab !== bb) return bb - ab;
      if ((a.event_count || 0) !== (b.event_count || 0)) return (b.event_count || 0) - (a.event_count || 0);
      return String(a.name).localeCompare(String(b.name));
    });
    var h = '<div class="source-grid">';
    sources.forEach(function (s) {
      h += '<article class="source-card"><div class="source-card-top"><span class="source-adapter">' +
        esc(sourceKindText(s.kind)) + '</span>' + sourceStatusText(s) + '</div><h2>' + esc(s.name) + '</h2>' +
        '<div class="source-stats"><span><b>' + (s.event_count || 0) + '</b> events this week</span>' +
        '<span>' + (s.is_aggregator ? 'city-wide aggregator' : 'dedicated calendar') + '</span></div>' +
        '<div class="source-foot"><span>' + (s.last_scraped ? 'checked ' + esc(fmtShort(s.last_scraped)) : 'not checked yet') + '</span>' +
        (s.website ? '<a href="' + esc(s.website) + '" target="_blank" rel="noopener">Visit source ↗</a>' : '<span>No public link</span>') +
        '</div></article>';
    });
    h += '</div>';
    if (!sources.length) h = '<p class="note empty">No sources match that search.</p>';
    host.innerHTML = h;
    var tally = $('source-tally'); if (tally) tally.textContent = sources.length + ' of ' + (DB.sources || []).length + ' sources';
  }

  function wireSourceFilters() {
    var q = $('source-search'), st = $('source-status');
    if (q) q.addEventListener('input', function () { sourceQuery = q.value; renderSources(); });
    if (st) st.addEventListener('change', function () { sourceStatus = st.value; renderSources(); });
  }

  /* ── boot ──────────────────────────────────────────────────────────── */

  // The reader gets a plain sentence; the technical detail goes to the console,
  // where the only person who needs it will be looking.
  function fail(msg) {
    if (window.console && console.error) console.error('The Philly Bulletin: ' + msg);
    var host = $('bulletin') || $('map') || $('source-board');
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

    // A page with neither surface (about.html) needs no 2 MB bundle.
    if (!isMap && !$('bulletin') && !isSources) return;

    Promise.all([
      fetch('data.json').then(function (r) {
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
        renderSources(); wireSourceFilters();
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

/* Shared logic: saved progress, unlocking, the starry sky, small helpers.
   Nothing here needs editing for content changes. */
(function () {
  'use strict';

  var KEY = 'ridBirthday.v1';
  var ORDER = ['music', 'quest', 'letters', 'gallery', 'words', 'final'];
  var state = null;

  function load() {
    if (state) return state;
    try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { state = {}; }
    if (!state || typeof state !== 'object') state = {};
    if (!state.done) state.done = {};
    if (!state.seen) state.seen = {};
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: progress lasts for this page only */ }
  }

  // URL switches:  ?dev=1 dev mode on, ?dev=0 off, ?reset=1 clears progress
  (function readSwitches() {
    var p = new URLSearchParams(location.search), s = load(), changed = false;
    if (p.get('reset') === '1') { state = { done: {}, seen: {}, dev: s.dev }; s = state; changed = true; }
    if (p.has('dev')) { s.dev = p.get('dev') === '1'; changed = true; }
    if (changed) save();
  })();

  var Site = {
    content: window.CONTENT || {},
    order: ORDER,

    isDev: function () { return !!load().dev; },
    entered: function () { return !!load().entered; },
    setEntered: function () { load().entered = true; save(); },
    isDone: function (id) { return !!load().done[id]; },
    complete: function (id) {
      var s = load();
      if (s.done[id]) return false;
      s.done[id] = true; save();
      return true;
    },
    seen: function (room) { return (load().seen[room] || []).slice(); },
    mark: function (room, id) {
      var s = load(), a = s.seen[room] || (s.seen[room] = []);
      if (a.indexOf(id) < 0) { a.push(id); save(); }
      return a.length;
    },
    // small saved extras for a room (like the quest hearts). Cleared by ?reset=1 with the rest.
    extra: function (k, v) {
      var s = load(); if (!s.extra) s.extra = {};
      if (arguments.length > 1) { s.extra[k] = v; save(); }
      return s.extra[k];
    },
    secretFound: function () { return !!load().secret; },
    unlockSecret: function () {
      var s = load(), first = !s.secret;
      s.secret = true; save();
      return first;
    },

    // A room is open once the one before it is done (the first opens after the candle).
    isUnlocked: function (id) {
      if (Site.isDev()) return true;
      if (id === 'secret') return Site.secretFound();
      if (!Site.entered()) return false;
      var i = ORDER.indexOf(id);
      if (i < 0) return false;
      return i === 0 || Site.isDone(ORDER[i - 1]);
    },
    guard: function (id) {
      if (Site.isUnlocked(id)) return true;
      location.replace(Site.entered() ? 'hub.html' : 'index.html');
      return false;
    },

    // Tiny element builder. Text always goes in as text, never as HTML.
    h: function (tag, props, kids) {
      var el = document.createElement(tag), k, v;
      for (k in (props || {})) {
        v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else el.setAttribute(k, v === true ? '' : v);
      }
      (kids || []).forEach(function (c) {
        if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
      return el;
    },

    toast: function (msg) {
      var t = document.getElementById('toast');
      if (!t) {
        t = Site.h('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' });
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(Site._tt);
      Site._tt = setTimeout(function () { t.classList.remove('show'); }, 2800);
    },

    // Static star field. The seed is 1111 so the sky looks the same on every page.
    sky: function () {
      var c = document.getElementById('sky');
      if (!c || !c.getContext) return;
      var ctx = c.getContext('2d'), lastW = 0;
      function rng(seed) {
        return function () {
          seed |= 0; seed = seed + 0x6D2B79F5 | 0;
          var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
      }
      function draw() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2), w = window.innerWidth, h = window.innerHeight;
        lastW = w;
        c.width = w * dpr; c.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        var r = rng(1111), n = Math.round(w * h / 9000), i, s, size;
        for (i = 0; i < n; i++) {
          var x = r() * w, y = r() * h;
          s = r();
          size = s > 0.96 ? 1.8 : s > 0.8 ? 1.2 : 0.7;
          ctx.globalAlpha = 0.25 + r() * 0.6;
          ctx.fillStyle = s > 0.93 ? '#ffd58a' : '#ece8f7';
          ctx.beginPath(); ctx.arc(x, y, size, 0, 6.2832); ctx.fill();
        }
      }
      draw();
      var t;
      window.addEventListener('resize', function () {
        clearTimeout(t);
        t = setTimeout(function () { if (window.innerWidth !== lastW) draw(); }, 150);
      });
    },

    devBanner: function () {
      if (!Site.isDev()) return;
      var todo = JSON.stringify(Site.content).indexOf('TODO') >= 0;
      document.body.appendChild(Site.h('div', { class: 'devbar' }, [
        'dev mode', todo ? ' · content still has TODO placeholders' : ' · content looks filled in', ' · ',
        Site.h('a', { href: '?dev=0', text: 'leave dev' }), ' · ',
        Site.h('a', { href: '?reset=1', text: 'reset progress' })
      ]));
    }
  };

  window.Site = Site;
  Site.sky();
  Site.devBanner();
})();

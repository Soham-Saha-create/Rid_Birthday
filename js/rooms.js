/* All the rooms. Each page sets <body data-room="..."> and this file builds the matching room.
   A room counts as "done" (and lights its star on the map) when everything in it has been seen. */
(function () {
  'use strict';

  var S = Site, h = S.h, C = S.content;
  var room = document.body.getAttribute('data-room');
  if (!S.guard(room)) return;

  var root = document.getElementById('room');
  var backBottom = document.getElementById('back-bottom');
  var R = {};

  function head(title, lede) {
    root.appendChild(h('h1', { text: title }));
    if (lede) root.appendChild(h('p', { class: 'lede', text: lede }));
  }
  function paras(list, cls) {
    return (list || []).map(function (t) { return h('p', { class: cls || null, text: t }); });
  }
  function finish(msg) {
    var first = S.complete(room);
    if (first && msg !== false) S.toast(msg || 'A star lit up on the map.');
    backBottom.hidden = false;
  }
  // Calls fn once when the element scrolls into view.
  function whenReached(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); fn(); }
    }, { threshold: 0.1 });
    io.observe(el);
  }

  /* ---------- Music room: a mixtape. Play every song to light the star ---------- */
  R.music = function () {
    var M = C.music, parts = [], total = 0, n = 0;
    M.sides.forEach(function (sd) { total += sd.tracks.length; });
    var seen = S.seen('music');

    // --- the stage: title, record, hint ---
    var stage = h('section', { class: 'stage' });
    stage.appendChild(h('div', { class: 'eyebrow', text: M.eyebrow }));
    stage.appendChild(h('h1', { class: 'title' }, [M.titlePre + ' ', h('em', { text: M.name }), M.titlePost ? ' ' + M.titlePost : '']));
    stage.appendChild(h('p', { class: 'subtitle', text: M.subtitle }));

    var vinyl = h('div', { class: 'vinyl' }, [
      h('div', { class: 'label' }, [
        h('div', { class: 'spindle' }),
        h('span', { text: M.labelLines[0] }),
        h('span', { text: M.labelLines[1] || '' })
      ])
    ]);
    var wrap = h('div', { class: 'record-wrap', role: 'button', tabindex: '0', 'aria-label': 'Spin the record' }, [
      vinyl, h('div', { class: 'sleeve-hint', text: M.hint })
    ]);
    function setSpin(on) { vinyl.classList.toggle('spinning', on); }
    wrap.addEventListener('click', function () { setSpin(!vinyl.classList.contains('spinning')); });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSpin(!vinyl.classList.contains('spinning')); }
    });
    stage.appendChild(wrap);

    if (M.blend) {
      stage.appendChild(h('p', { class: 'stamp' }, [h('b', { text: M.blend.percent + '%' }), ' ' + M.blend.label]));
      if (M.blend.note) stage.appendChild(h('p', { class: 'stamp-note', text: M.blend.note }));
    }
    stage.appendChild(h('div', { class: 'scroll-cue', text: '\u2193 ' + M.cue + ' \u2193' }));
    root.appendChild(stage);

    // --- the tracklist ---
    var section = h('section', { class: 'tracklist-section' });
    var count = h('p', { class: 'count' });
    section.appendChild(count);
    function updateCount() {
      count.textContent = (M.progress || '{n} of {total} played')
        .replace('{n}', S.seen('music').length).replace('{total}', total);
    }
    updateCount();

    function closeTrack(i) {
      var t = parts[i];
      t.holder.hidden = true;
      t.holder.textContent = '';              // removing the player stops the audio
      t.btn.textContent = M.playLabel;
      t.btn.setAttribute('aria-expanded', 'false');
      t.el.classList.remove('is-open');
    }
    function openTrack(i) {
      parts.forEach(function (_, k) { if (k !== i) closeTrack(k); });
      var t = parts[i];
      t.btn.textContent = M.closeLabel;
      t.btn.setAttribute('aria-expanded', 'true');
      t.el.classList.add('is-open', 'is-seen');
      if (t.data.spotifyId) {
        t.holder.hidden = false;
        t.holder.appendChild(h('iframe', {
          class: 'embed', src: 'https://open.spotify.com/embed/track/' + t.data.spotifyId,
          loading: 'lazy', allow: 'encrypted-media', title: t.data.title, height: '152'
        }));
      }
      setSpin(true);
    }

    M.sides.forEach(function (sd, si) {
      var block = h('div', { class: 'side-block ' + (si % 2 ? 'side-deep' : 'side-warm') }, [
        h('div', { class: 'side-label', text: sd.label }),
        h('div', { class: 'side-desc', text: sd.desc })
      ]);
      sd.tracks.forEach(function (t) {
        var i = n++;
        var btn = h('button', { class: 'play-btn', type: 'button', 'aria-expanded': 'false', text: M.playLabel });
        var holder = h('div', { class: 'embed-holder', hidden: true });
        var el = h('div', { class: 'track' + (seen.indexOf(i) >= 0 ? ' is-seen' : '') }, [
          h('div', { class: 'track-num', text: (i < 9 ? '0' : '') + (i + 1) }),
          h('div', { class: 'track-info' }, [
            h('h3', { text: t.title }),
            h('div', { class: 'artist', text: t.artist }),
            h('p', { text: t.why }),
            btn, holder
          ])
        ]);
        parts.push({ el: el, btn: btn, holder: holder, data: t });
        btn.addEventListener('click', function () {
          if (el.classList.contains('is-open')) {
            closeTrack(i); setSpin(false);
          } else {
            openTrack(i);
            var m = S.mark('music', i);
            updateCount();
            if (m >= total) finish();
          }
        });
        block.appendChild(el);
      });
      section.appendChild(block);
    });
    root.appendChild(section);

    if (M.closing) {
      root.appendChild(h('section', { class: 'closing' }, [
        h('div', { class: 'mark', text: M.closing.mark }),
        h('p', { text: M.closing.text }),
        M.closing.sign ? h('div', { class: 'sign', text: M.closing.sign }) : null
      ]));
    }

    // tracks fade in as they scroll into view
    var els = parts.map(function (t) { return t.el; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e, k) {
          if (e.isIntersecting) { setTimeout(function () { e.target.classList.add('revealed'); }, k * 80); io.unobserve(e.target); }
        });
      }, { threshold: 0.15 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('revealed'); });
    }
  };

  /* ---------- Quest: trivia, each right answer opens a hidden message ---------- */
  R.quest = function () {
    var Q = C.quest, qs = Q.questions;
    head(Q.title, Q.intro);
    var stage = h('div', { class: 'stage' });
    var rewards = h('section', { class: 'rewards', hidden: true });
    root.appendChild(stage);
    root.appendChild(rewards);

    function renderRewards() {
      var n = S.seen('quest').length;
      rewards.textContent = '';
      if (!n) { rewards.hidden = true; return; }
      rewards.hidden = false;
      rewards.appendChild(h('h2', { text: Q.collectedTitle }));
      for (var i = 0; i < n && i < qs.length; i++) rewards.appendChild(h('p', { class: 'reward', text: qs[i].reward }));
    }

    function show(i) {
      stage.textContent = '';
      if (i >= qs.length) {
        stage.appendChild(h('p', { class: 'lede', text: Q.doneLine }));
        renderRewards();
        finish();
        return;
      }
      var q = qs[i], wrong = 0;
      var msg = h('p', { class: 'quest-msg', 'aria-live': 'polite' });
      var opts = h('div', { class: 'options' });
      stage.appendChild(h('p', { class: 'quest-count', text: 'Question ' + (i + 1) + ' of ' + qs.length }));
      stage.appendChild(h('h2', { class: 'question', text: q.q }));
      stage.appendChild(opts);
      stage.appendChild(msg);

      q.options.forEach(function (label, k) {
        var b = h('button', { class: 'option', type: 'button', text: label });
        b.addEventListener('click', function () {
          if (k === q.answer) {
            b.classList.add('is-right');
            S.mark('quest', i);
            Array.prototype.forEach.call(opts.querySelectorAll('button'), function (x) { x.disabled = true; });
            msg.textContent = '';
            stage.appendChild(h('div', { class: 'unlock' }, [
              h('p', { class: 'unlock-label', text: Q.unlockLabel }),
              h('p', { text: q.reward })
            ]));
            var next = h('button', { class: 'btn', type: 'button', text: i + 1 < qs.length ? Q.next : Q.finish });
            next.addEventListener('click', function () { show(i + 1); });
            stage.appendChild(next);
            renderRewards();
            next.focus();
          } else {
            wrong += 1;
            b.disabled = true;
            b.classList.add('is-wrong');
            msg.textContent = (wrong >= 2 && q.hint) ? Q.hintPrefix + q.hint : Q.tryAgain;
          }
        });
        opts.appendChild(b);
      });
    }
    show(Math.min(S.seen('quest').length, qs.length));
  };

  /* ---------- Letters: open all seven. Each letter is typed out, with a skip button ---------- */
  R.letters = function () {
    var L = C.letters, seen = S.seen('letters'), token = 0;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    head(L.title, L.intro);

    var grid = h('ul', { class: 'envelopes' });
    root.appendChild(grid);
    var dlg = h('dialog', { class: 'letter', 'aria-label': 'Letter' });
    document.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) { if (e.target === dlg && dlg.close) dlg.close(); });
    dlg.addEventListener('close', function () { token++; });   // stop typing when the letter is closed

    // Types each target's text out one character at a time. The full text is already in the
    // page (hidden), so the paper never changes size while it types. Returns a skip function.
    function typewrite(targets, onDone) {
      var my = ++token, ti = 0, ci = 0, timer = null;
      var caret = h('span', { class: 'caret', 'aria-hidden': 'true' });
      targets.forEach(function (t) {
        t.typed = document.createTextNode('');
        t.rest = h('span', { class: 'untyped', text: t.text });
        t.el.appendChild(t.typed);
        t.el.appendChild(t.rest);
      });
      function finishAll() {
        clearTimeout(timer);
        targets.forEach(function (t) { t.typed.nodeValue = t.text; t.rest.textContent = ''; });
        if (caret.parentNode) caret.parentNode.removeChild(caret);
        onDone();
      }
      function step() {
        if (my !== token) return;
        if (ti >= targets.length) { finishAll(); return; }
        var t = targets[ti];
        if (ci === 0) t.el.insertBefore(caret, t.rest);
        if (ci >= t.text.length) { ti++; ci = 0; timer = setTimeout(step, 380); return; }
        var ch = t.text.charAt(ci++);
        t.typed.nodeValue = t.text.slice(0, ci);
        t.rest.textContent = t.text.slice(ci);
        if (ci % 24 === 0 && caret.scrollIntoView) caret.scrollIntoView({ block: 'nearest' });
        var wait = 20 + Math.random() * 22;
        if (ch === '.' || ch === '!' || ch === '?') wait = 300;
        else if (ch === ',' || ch === ';' || ch === ':') wait = 150;
        timer = setTimeout(step, wait);
      }
      if (reduce) { finishAll(); return function () {}; }
      timer = setTimeout(step, 450);
      return function skip() { if (my === token) { token++; finishAll(); } };
    }

    L.items.forEach(function (it, i) {
      var state = h('span', { class: 'env-state', text: seen.indexOf(i) >= 0 ? L.read : L.sealed });
      var b = h('button', { class: 'envelope' + (seen.indexOf(i) >= 0 ? ' is-read' : ''), type: 'button' }, [
        h('span', { class: 'env-name', text: it.name }), state
      ]);
      b.addEventListener('click', function () {
        dlg.textContent = '';
        var targets = [];
        var meaning = h('p', { class: 'letter-meaning' });
        targets.push({ el: meaning, text: it.meaning || '' });
        var bodyEls = (it.body || []).map(function (txt) {
          var p = h('p', { class: 'letter-body' });
          targets.push({ el: p, text: txt });
          return p;
        });
        var skip = h('button', { class: 'btn btn-quiet letter-skip', type: 'button', text: L.skip || 'Skip' });
        var close = h('button', { class: 'btn btn-quiet letter-close', type: 'button', text: L.close });
        close.addEventListener('click', function () { token++; if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); });
        var inner = h('div', { class: 'letter-inner', 'aria-busy': 'true' },
          [h('h2', { text: it.name }), meaning].concat(bodyEls, [h('div', { class: 'letter-actions' }, [skip, close])]));
        dlg.appendChild(inner);
        if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
        var stop = typewrite(targets, function () { skip.hidden = true; inner.removeAttribute('aria-busy'); });
        skip.addEventListener('click', stop);
        b.classList.add('is-read');
        state.textContent = L.read;
        if (S.mark('letters', i) >= L.items.length) finish();
      });
      grid.appendChild(h('li', null, [b]));
    });
  };

  /* ---------- Gallery: scroll all the way down ---------- */
  R.gallery = function () {
    var G = C.gallery, count = G.count | 0;
    head(G.title, G.intro);
    var feed = h('ol', { class: 'feed' });
    root.appendChild(feed);

    function pad(n) { var s = String(n); while (s.length < (G.pad || 3)) s = '0' + s; return s; }

    for (var i = 1; i <= count; i++) {
      (function (n) {
        var caption = (G.captions && G.captions[n]) || '';
        var wrap = h('div', { class: 'shot is-loading' });
        var img = h('img', {
          src: G.folder + pad(n) + '.' + G.ext, alt: caption || ('Photo ' + n),
          loading: 'lazy', decoding: 'async'
        });
        img.addEventListener('load', function () { wrap.classList.remove('is-loading'); });
        img.addEventListener('error', function () {
          wrap.classList.remove('is-loading');
          wrap.classList.add('is-missing');
          wrap.textContent = G.missing.replace('{n}', pad(n));
        });
        wrap.appendChild(img);
        feed.appendChild(h('li', { class: 'frame', 'data-i': n }, [wrap, caption ? h('p', { class: 'cap', text: caption }) : null]));
      })(i);
    }

    var counter = h('p', { class: 'counter', 'aria-hidden': 'true', text: '1 / ' + count });
    document.body.appendChild(counter);
    var end = h('div', { class: 'feed-end' });
    root.appendChild(end);

    if ('IntersectionObserver' in window) {
      var cur = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) counter.textContent = e.target.getAttribute('data-i') + ' / ' + count;
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      Array.prototype.forEach.call(feed.querySelectorAll('.frame'), function (f) { cur.observe(f); });
    }
    whenReached(end, function () { finish(); });
  };

  /* ---------- Words: nothing fancy, just the page ---------- */
  R.words = function () {
    var W = C.words;
    root.appendChild(h('h1', { text: W.title }));
    paras(W.lines).forEach(function (p) { root.appendChild(p); });
    if (W.signoff) root.appendChild(h('p', { class: 'signoff', text: W.signoff }));
    var end = h('div', { class: 'feed-end' });
    root.appendChild(end);
    whenReached(end, function () { finish(W.toast); });
  };

  /* ---------- The last star ---------- */
  R.final = function () {
    var F = C.final;
    var lockAt = F.unlockAt ? Date.parse(F.unlockAt) : 0;

    if (lockAt && Date.now() < lockAt && !S.isDev()) {
      root.appendChild(h('h1', { text: F.lockedTitle }));
      root.appendChild(h('p', { class: 'lede', text: F.lockedLine }));
      var cd = h('p', { class: 'countdown' });
      root.appendChild(cd);
      var tick = function () {
        var ms = lockAt - Date.now();
        if (ms <= 0) { location.reload(); return; }
        var d = Math.floor(ms / 864e5), hr = Math.floor(ms % 864e5 / 36e5), mi = Math.floor(ms % 36e5 / 6e4);
        cd.textContent = d + (d === 1 ? ' day, ' : ' days, ') + hr + (hr === 1 ? ' hour, ' : ' hours, ') + mi + (mi === 1 ? ' minute' : ' minutes');
      };
      tick();
      setInterval(tick, 30000);
      backBottom.hidden = false;
      return;
    }

    root.appendChild(h('h1', { text: F.title }));
    paras(F.lines).forEach(function (p) { root.appendChild(p); });
    finish(false);

    // The easter egg: a barely-there star in the corner that opens the secret page.
    var egg = h('button', { class: 'egg' + (S.secretFound() ? ' is-lit' : ''), type: 'button', 'aria-label': F.egg.label, text: '✦' });
    var secretLink = h('a', { class: 'btn btn-quiet', href: 'secret.html', text: F.egg.linkText, hidden: !S.secretFound() });
    egg.addEventListener('click', function () {
      egg.classList.remove('is-lit');
      void egg.offsetWidth;
      egg.classList.add('is-lit');
      if (S.unlockSecret()) S.toast(F.egg.toast);
      secretLink.hidden = false;
    });
    document.querySelector('main').appendChild(egg);
    document.querySelector('.end').insertBefore(secretLink, backBottom);
  };

  /* ---------- Secret page ---------- */
  R.secret = function () {
    var X = C.secret;
    document.body.classList.add('is-secret');
    root.appendChild(h('h1', { text: X.title }));
    paras(X.lines).forEach(function (p) { root.appendChild(p); });
  };

  if (R[room]) R[room]();
  if (S.isDone(room) || room === 'secret') backBottom.hidden = false;
})();

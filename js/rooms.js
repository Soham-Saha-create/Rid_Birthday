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

  /* ---------- Music room: open every song ---------- */
  R.music = function () {
    var M = C.music, seen = S.seen('music');
    head(M.title, M.intro);

    if (M.blend) {
      root.appendChild(h('div', { class: 'blend' }, [
        h('p', { class: 'blend-num', text: M.blend.percent + '%' }),
        h('p', { class: 'blend-label', text: M.blend.label }),
        M.blend.note ? h('p', { class: 'blend-note', text: M.blend.note }) : null
      ]));
    }

    var list = h('ul', { class: 'tracks' });
    root.appendChild(list);
    M.tracks.forEach(function (t, i) {
      var panelId = 'track-' + i;
      var panel = h('div', { class: 'track-panel', id: panelId, hidden: true }, [h('p', { text: t.why })]);
      if (t.spotifyId) {
        panel.appendChild(h('iframe', {
          class: 'embed', src: 'https://open.spotify.com/embed/track/' + t.spotifyId,
          loading: 'lazy', allow: 'encrypted-media', title: t.title, height: '152'
        }));
      }
      var btn = h('button', { class: 'track-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId }, [
        h('span', { class: 'track-title', text: t.title }),
        h('span', { class: 'track-artist', text: t.artist })
      ]);
      var li = h('li', { class: 'track' + (seen.indexOf(i) >= 0 ? ' is-seen' : '') }, [btn, panel]);
      btn.addEventListener('click', function () {
        var opening = panel.hidden;
        panel.hidden = !opening;
        btn.setAttribute('aria-expanded', String(opening));
        if (opening) {
          li.classList.add('is-seen');
          if (S.mark('music', i) >= M.tracks.length) finish();
        }
      });
      list.appendChild(li);
    });
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

  /* ---------- Letters: open all seven ---------- */
  R.letters = function () {
    var L = C.letters, seen = S.seen('letters');
    head(L.title, L.intro);

    var grid = h('ul', { class: 'envelopes' });
    root.appendChild(grid);
    var dlg = h('dialog', { class: 'letter', 'aria-label': 'Letter' });
    document.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) { if (e.target === dlg && dlg.close) dlg.close(); });

    L.items.forEach(function (it, i) {
      var state = h('span', { class: 'env-state', text: seen.indexOf(i) >= 0 ? L.read : L.sealed });
      var b = h('button', { class: 'envelope' + (seen.indexOf(i) >= 0 ? ' is-read' : ''), type: 'button' }, [
        h('span', { class: 'env-name', text: it.name }), state
      ]);
      b.addEventListener('click', function () {
        dlg.textContent = '';
        var close = h('button', { class: 'btn btn-quiet letter-close', type: 'button', text: L.close });
        close.addEventListener('click', function () { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); });
        dlg.appendChild(h('div', { class: 'letter-inner' },
          [h('h2', { text: it.name }), h('p', { class: 'letter-meaning', text: it.meaning })]
            .concat(paras(it.body, 'letter-body'), [close])));
        if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
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

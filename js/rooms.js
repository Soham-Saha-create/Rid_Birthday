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

  /* ---------- Quest: a game show with lifelines and sound effects ---------- */
  R.quest = function () {
    // Anything missing from content.js falls back to these.
    var Q = Object.assign({
      hearts: 3, checkpoints: [0, 2], heartsLabel: 'Hearts',
      bonusTease: 'Finish with zero wrong answers and a secret bonus opens.',
      bonusLabel: 'Perfect run bonus', bonus: 'TODO: bonus message',
      bonusMissed: 'No bonus this time. A flawless run opens one more message.',
      replay: 'Play again for the bonus',
      gameOverTitle: 'Out of hearts', gameOverText: 'Back to question {n}. Your hearts are full again.',
      tryAgain: 'Try again', hostGameOver: 'Oh no, that was all three hearts. Shake it off.'
    }, C.quest);
    var qs = Q.questions, LET = ['A', 'B', 'C', 'D'];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    head(Q.title, Q.intro);

    // ---- sound effects, made in the browser (no audio files needed) ----
    var AC = null, muted = false;
    try { muted = localStorage.getItem('ridQuestMuted') === '1'; } catch (e) {}
    function ctx() {
      if (!AC) { var A = window.AudioContext || window.webkitAudioContext; if (A) AC = new A(); }
      if (AC && AC.state === 'suspended') AC.resume();
      return AC;
    }
    function tone(freq, t0, dur, type, vol, slideTo) {
      var c = ctx(); if (!c || muted) return;
      var now = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, now);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(c.destination);
      o.start(now); o.stop(now + dur + 0.05);
    }
    var sfx = {
      pick:  function () { tone(520, 0, 0.08, 'triangle', 0.12); },
      right: function () { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, i * 0.09, 0.3, 'triangle', 0.2); tone(f * 2, i * 0.09, 0.18, 'sine', 0.05); }); },
      wrong: function () { tone(150, 0, 0.55, 'sawtooth', 0.22, 90); tone(158, 0, 0.55, 'square', 0.1, 95); },
      life:  function () { tone(400, 0, 0.12, 'sine', 0.15, 800); tone(800, 0.12, 0.16, 'sine', 0.12, 1250); },
      over:  function () { [392, 349.23, 311.13, 261.63].forEach(function (f, i) { tone(f, i * 0.22, 0.4, 'sawtooth', 0.14); }); },
      win:   function () { [523.25, 523.25, 523.25, 659.25, 783.99, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, i * 0.14, 0.3, 'square', 0.1); }); }
    };
    function pick(list) { return Array.isArray(list) ? list[Math.floor(Math.random() * list.length)] : list; }

    // ---- the set ----
    var ladder = h('div', { class: 'gs-ladder', 'aria-label': 'Progress' });
    qs.forEach(function (_, i) { ladder.appendChild(h('span', { class: 'gs-step', text: String(i + 1) })); });
    var mute = h('button', { class: 'gs-mute', type: 'button' });
    function paintMute() { mute.textContent = muted ? Q.soundOff : Q.soundOn; mute.setAttribute('aria-pressed', muted ? 'true' : 'false'); }
    mute.addEventListener('click', function () {
      muted = !muted; paintMute();
      try { localStorage.setItem('ridQuestMuted', muted ? '1' : '0'); } catch (e) {}
      if (!muted) sfx.pick();
    });
    paintMute();
    root.appendChild(h('div', { class: 'gs-top' }, [ladder, mute]));

    var bubbleText = h('span', { class: 'gs-say', 'aria-live': 'polite' });
    var bubble = h('div', { class: 'gs-bubble' }, [bubbleText]);
    root.appendChild(h('div', { class: 'gs-host' }, [
      h('div', { class: 'gs-avatar', 'aria-hidden': 'true', text: (Q.host || 'S').charAt(0) }),
      bubble
    ]));
    function say(t) {
      bubbleText.textContent = t;
      bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    }

    // hearts and wrong-answer count survive a refresh, so reloading is not an escape
    function ld(k, d) {
      var v;
      if (S.extra) v = S.extra(k);
      else { try { v = JSON.parse(localStorage.getItem('ridQuest.' + k)); } catch (e) {} }
      return typeof v === 'number' ? v : d;
    }
    function sv(k, v) {
      if (S.extra) S.extra(k, v);
      else { try { localStorage.setItem('ridQuest.' + k, JSON.stringify(v)); } catch (e) {} }
    }
    var MAXH = Q.hearts;
    if (ld('hearts', null) === null) { sv('hearts', MAXH); sv('wrongs', 0); }
    var hearts = ld('hearts', MAXH), wrongs = ld('wrongs', 0);
    if (hearts <= 0) hearts = MAXH;
    var heartEls = [];
    var heartRow = h('div', { class: 'gs-hearts', role: 'img' });
    for (var hi = 0; hi < MAXH; hi++) { var he = h('span', { class: 'gs-heart', text: '\u2665' }); heartEls.push(he); heartRow.appendChild(he); }
    function paintHearts() {
      heartEls.forEach(function (el, k) { el.classList.toggle('is-lost', k >= hearts); });
      heartRow.setAttribute('aria-label', Q.heartsLabel + ': ' + hearts + ' of ' + MAXH);
    }
    paintHearts();
    root.appendChild(h('div', { class: 'gs-stakes' }, [heartRow, h('p', { class: 'gs-tease', text: Q.bonusTease })]));

    var used = { fifty: false, phone: false, audience: false };
    var lifeBtns = {};
    var lifeRow = h('div', { class: 'gs-lifelines' });
    [['fifty', Q.fifty], ['phone', Q.phone], ['audience', Q.audience]].forEach(function (l) {
      var b = h('button', { class: 'gs-life', type: 'button', text: l[1] });
      lifeBtns[l[0]] = b; lifeRow.appendChild(b);
    });
    root.appendChild(lifeRow);

    var panel = h('div', { class: 'gs-panel' });
    var rewards = h('section', { class: 'gs-rewards', hidden: true });
    root.appendChild(panel);
    root.appendChild(rewards);

    function setLadder(i) {
      Array.prototype.forEach.call(ladder.children, function (el, k) {
        el.classList.toggle('is-done', k < i);
        el.classList.toggle('is-now', k === i);
      });
    }
    function renderRewards(withBonus) {
      var n = S.seen('quest').length;
      rewards.textContent = '';
      if (!n) { rewards.hidden = true; return; }
      rewards.hidden = false;
      rewards.appendChild(h('h2', { text: Q.collectedTitle }));
      for (var i = 0; i < n && i < qs.length; i++) rewards.appendChild(h('p', { class: 'gs-reward-line', text: qs[i].reward }));
      if (withBonus && n >= qs.length) rewards.appendChild(h('p', { class: 'gs-reward-line', text: Q.bonus }));
    }
    function confetti() {
      if (reduce) return;
      var box = h('div', { class: 'gs-confetti', 'aria-hidden': 'true' });
      var cols = ['#ffd23f', '#ffffff', '#ff7aa8', '#4dd6ff', '#2fd07a'];
      for (var k = 0; k < 40; k++) {
        var s = h('span');
        s.style.left = Math.random() * 100 + '%';
        s.style.background = cols[k % cols.length];
        s.style.animationDelay = (Math.random() * 0.8) + 's';
        s.style.animationDuration = (2 + Math.random() * 1.8) + 's';
        box.appendChild(s);
      }
      document.body.appendChild(box);
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 5200);
    }

    // ---- out of hearts: back to the last checkpoint ----
    function gameOver(i) {
      var back = 0;
      (Q.checkpoints || [0]).forEach(function (c) { if (c <= i && c > back) back = c; });
      lifeRow.hidden = true;
      panel.textContent = '';
      var retry = h('button', { class: 'btn gs-next', type: 'button', text: Q.tryAgain });
      retry.addEventListener('click', function () {
        hearts = MAXH; sv('hearts', hearts); paintHearts(); sfx.pick(); show(back, false);
      });
      panel.appendChild(h('div', { class: 'gs-over' }, [
        h('h2', { text: Q.gameOverTitle }),
        h('p', { text: Q.gameOverText.replace('{n}', String(back + 1)) }),
        retry
      ]));
      retry.focus();
    }

    // ---- one question ----
    function show(i, fresh) {
      panel.textContent = '';
      setLadder(i);
      if (i >= qs.length) {
        lifeRow.hidden = true;
        panel.appendChild(h('div', { class: 'gs-qbox' }, [h('p', { class: 'gs-q', text: Q.doneLine })]));
        say(Q.hostFinal);
        renderRewards(wrongs === 0);
        if (wrongs === 0) {
          panel.appendChild(h('div', { class: 'gs-reward' }, [
            h('p', { class: 'gs-reward-label', text: Q.bonusLabel }),
            h('p', { class: 'gs-reward-text', text: Q.bonus })
          ]));
        } else {
          panel.appendChild(h('p', { class: 'gs-msg', text: Q.bonusMissed }));
          var again = h('button', { class: 'btn gs-next', type: 'button', text: Q.replay });
          again.addEventListener('click', function () {
            wrongs = 0; hearts = MAXH; sv('wrongs', 0); sv('hearts', MAXH);
            paintHearts(); sfx.pick(); show(0, false);
          });
          panel.appendChild(again);
        }
        if (fresh) { sfx.win(); confetti(); }
        finish();
        return;
      }
      lifeRow.hidden = false;
      var q = qs[i], wrong = 0, locked = false, gone = {}, optBtns = [];
      say(i === 0 && !S.seen('quest').length ? Q.hostIntro : pick(Q.hostNext));

      var extra = h('div', { class: 'gs-extra' });
      var msg = h('p', { class: 'gs-msg' });
      var opts = h('div', { class: 'gs-options' });
      panel.appendChild(h('p', { class: 'gs-count', text: 'Question ' + (i + 1) + ' of ' + qs.length }));
      panel.appendChild(h('div', { class: 'gs-qbox' }, [h('h2', { class: 'gs-q', text: q.q })]));
      panel.appendChild(opts);
      panel.appendChild(extra);
      panel.appendChild(msg);

      function refreshLife() {
        Object.keys(lifeBtns).forEach(function (k) {
          lifeBtns[k].disabled = used[k] || locked;
          lifeBtns[k].classList.toggle('is-used', used[k]);
          lifeBtns[k].setAttribute('aria-label', lifeBtns[k].textContent + (used[k] ? ' (' + Q.usedLabel + ')' : ''));
        });
      }
      refreshLife();

      function visible() { return optBtns.map(function (_, k) { return k; }).filter(function (k) { return !gone[k]; }); }
      lifeBtns.fifty.onclick = function () {
        if (used.fifty || locked) return;
        used.fifty = true; sfx.life(); say(Q.fiftyLine);
        var wrongOnes = visible().filter(function (k) { return k !== q.answer && !optBtns[k].disabled; });
        wrongOnes.sort(function () { return Math.random() - 0.5; });
        wrongOnes.slice(0, 2).forEach(function (k) { gone[k] = true; optBtns[k].classList.add('is-gone'); optBtns[k].disabled = true; });
        refreshLife();
      };
      lifeBtns.phone.onclick = function () {
        if (used.phone || locked) return;
        used.phone = true; sfx.life(); say(Q.hostLifeline);
        var txt = q.phone || Q.phoneLine.replace('{a}', LET[q.answer] + ' (' + q.options[q.answer] + ')');
        extra.textContent = '';
        extra.appendChild(h('div', { class: 'gs-info' }, [h('p', { class: 'gs-info-title', text: Q.host + ':' }), h('p', { text: txt })]));
        refreshLife();
      };
      lifeBtns.audience.onclick = function () {
        if (used.audience || locked) return;
        used.audience = true; sfx.life(); say(Q.hostLifeline);
        var vis = visible(), pct = {}, right = 45 + Math.floor(Math.random() * 25), left = 100 - right;
        var others = vis.filter(function (k) { return k !== q.answer; });
        pct[q.answer] = right;
        others.forEach(function (k, n) {
          var share = n === others.length - 1 ? left : Math.floor(Math.random() * (left + 1));
          pct[k] = share; left -= share;
        });
        extra.textContent = '';
        var box = h('div', { class: 'gs-info' }, [h('p', { class: 'gs-info-title', text: Q.audienceTitle })]);
        optBtns.forEach(function (_, k) {
          var v = gone[k] ? 0 : (pct[k] || 0);
          var fill = h('span', { class: 'gs-bar-fill' });
          box.appendChild(h('div', { class: 'gs-bar' }, [
            h('span', { class: 'gs-bar-l', text: LET[k] }),
            h('span', { class: 'gs-bar-track' }, [fill]),
            h('span', { class: 'gs-bar-v', text: v + '%' })
          ]));
          setTimeout(function () { fill.style.width = v + '%'; }, 60);
        });
        extra.appendChild(box);
        refreshLife();
      };

      q.options.forEach(function (label, k) {
        var b = h('button', { class: 'gs-option', type: 'button' }, [
          h('span', { class: 'gs-letter', text: LET[k] + ':' }), h('span', { class: 'gs-opt-text', text: label })
        ]);
        optBtns.push(b);
        b.addEventListener('click', function () {
          if (locked) return;
          if (k === q.answer) {
            locked = true;
            b.classList.add('is-right'); sfx.right(); say(pick(Q.hostRight));
            S.mark('quest', i);
            optBtns.forEach(function (x) { x.disabled = true; });
            refreshLife(); extra.textContent = ''; msg.textContent = '';
            setLadder(i + 1);
            panel.appendChild(h('div', { class: 'gs-reward' }, [
              h('p', { class: 'gs-reward-label', text: Q.unlockLabel }),
              h('p', { class: 'gs-reward-text', text: q.reward })
            ]));
            var next = h('button', { class: 'btn gs-next', type: 'button', text: i + 1 < qs.length ? Q.next : Q.finish });
            next.addEventListener('click', function () { sfx.pick(); show(i + 1, true); });
            panel.appendChild(next);
            renderRewards();
            next.focus();
          } else {
            wrong += 1; wrongs += 1; hearts -= 1;
            sv('wrongs', wrongs); sv('hearts', hearts);
            b.disabled = true; b.classList.add('is-wrong');
            paintHearts();
            panel.classList.remove('gs-shake'); void panel.offsetWidth; panel.classList.add('gs-shake');
            if (hearts <= 0) {
              locked = true; refreshLife();
              optBtns.forEach(function (x) { x.disabled = true; });
              sfx.over(); say(Q.hostGameOver);
              setTimeout(function () { gameOver(i); }, 1300);
              return;
            }
            sfx.wrong(); say(pick(Q.hostWrong));
            msg.textContent = (wrong >= 2 && q.hint) ? Q.hintPrefix + q.hint : '';
          }
        });
        opts.appendChild(b);
      });
    }
    show(Math.min(S.seen('quest').length, qs.length), false);
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

  /* ---------- Gallery: a museum. Wings of photos, a placard for each, and she picks a favourite ---------- */
  R.gallery = function () {
    // Anything missing from content.js falls back to these.
    var G = Object.assign({
      perWing: 10, defaultMedium: 'Photograph', untitled: 'Untitled No. {n}',
      wingWord: 'Wing', heartLabel: 'Favourite', heartedLabel: 'Hearted',
      finale: {
        label: 'The last room',
        title: 'Pick your favourite',
        text: 'Of everything on these walls, which one is yours? Tap it.',
        none: 'You have not hearted anything yet. Scroll back up and heart a few, then come back here.',
        done: 'Locked in. Good taste.',
        pickedLabel: 'Your pick'
      }
    }, C.gallery);
    G.finale = Object.assign({}, { label: 'The last room', title: 'Pick your favourite', text: 'Of everything on these walls, which one is yours? Tap it.', none: 'You have not hearted anything yet. Scroll back up and heart a few, then come back here.', done: 'Locked in. Good taste.', pickedLabel: 'Your pick' }, C.gallery && C.gallery.finale);
    var count = G.count | 0, per = Math.max(1, G.perWing | 0);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    head(G.title, G.intro);

    function pad(n) { var s = String(n); while (s.length < (G.pad || 3)) s = '0' + s; return s; }
    function srcOf(n) { return G.folder + pad(n) + '.' + G.ext; }
    function store(k, v) {
      if (!S.extra) return v === undefined ? null : v;
      return v === undefined ? S.extra(k) : S.extra(k, v);
    }
    var hearted = store('gallHearts'); if (!Array.isArray(hearted)) hearted = [];
    var fav = store('gallFav'); if (typeof fav !== 'number') fav = null;
    function saveHearts() { store('gallHearts', hearted.slice()); }

    var feed = h('div', { class: 'gl-feed' });
    root.appendChild(feed);
    var frames = [];

    function wingOf(n) { return Math.floor((n - 1) / per); }
    function wingTitle(w) {
      var cfg = (G.wings && G.wings[w]) || {};
      return cfg;
    }

    for (var i = 1; i <= count; i++) {
      (function (n) {
        var w = wingOf(n);
        if ((n - 1) % per === 0) {
          var cfg = wingTitle(w);
          feed.appendChild(h('section', { class: 'gl-wing', 'data-wing': w + 1 }, [
            h('p', { class: 'gl-wing-no', text: G.wingWord + ' ' + (w + 1) }),
            h('h2', { class: 'gl-wing-title', text: cfg.title || '' }),
            cfg.sub ? h('p', { class: 'gl-wing-sub', text: cfg.sub }) : null
          ]));
        }
        var cap = G.captions && G.captions[n];
        var t, m = G.defaultMedium, note = '';
        if (cap && typeof cap === 'object') { t = cap.t || ''; m = cap.m || m; note = cap.n || ''; }
        else { t = cap || ''; }
        if (!t) t = G.untitled.replace('{n}', n);

        var wrap = h('div', { class: 'gl-shot is-loading' });
        var img = h('img', { src: srcOf(n), alt: t, loading: 'lazy', decoding: 'async' });
        img.addEventListener('load', function () { wrap.classList.remove('is-loading'); });
        img.addEventListener('error', function () {
          wrap.classList.remove('is-loading'); wrap.classList.add('is-missing');
          wrap.textContent = G.missing.replace('{n}', pad(n));
        });
        wrap.appendChild(img);

        var heart = h('button', { class: 'gl-heart', type: 'button', 'aria-pressed': 'false', 'aria-label': G.heartLabel + ': ' + t }, [
          h('span', { class: 'gl-heart-i', text: '\u2665' }), h('span', { class: 'gl-heart-t', text: G.heartLabel })
        ]);
        function paintHeart() {
          var on = hearted.indexOf(n) >= 0;
          heart.setAttribute('aria-pressed', on ? 'true' : 'false');
          heart.querySelector('.gl-heart-t').textContent = on ? G.heartedLabel : G.heartLabel;
        }
        paintHeart();
        heart.addEventListener('click', function () {
          var k = hearted.indexOf(n);
          if (k >= 0) hearted.splice(k, 1); else hearted.push(n);
          saveHearts(); paintHeart();
        });

        var plaque = h('figcaption', { class: 'gl-plaque' }, [
          h('p', { class: 'gl-t', text: t }),
          h('p', { class: 'gl-m', text: m }),
          note ? h('p', { class: 'gl-n', text: note }) : null,
          heart
        ]);
        var fig = h('figure', { class: 'gl-frame', 'data-i': n, 'data-wing': w + 1 }, [h('div', { class: 'gl-mat' }, [wrap]), plaque]);
        frames.push(fig);
        feed.appendChild(fig);
      })(i);
    }

    // ---- the last room: pick a favourite ----
    var F = G.finale;
    var picker = h('div', { class: 'gl-pick-grid' });
    var pickMsg = h('p', { class: 'gl-pick-msg' });
    var finale = h('section', { class: 'gl-finale' }, [
      h('p', { class: 'gl-wing-no', text: F.label }),
      h('h2', { class: 'gl-wing-title', text: F.title }),
      h('p', { class: 'gl-wing-sub', text: F.text }),
      picker, pickMsg
    ]);
    root.appendChild(finale);
    function renderPicker() {
      picker.textContent = '';
      var list = hearted.slice().sort(function (a, b) { return a - b; });
      if (fav !== null && list.indexOf(fav) < 0) list.push(fav);
      if (!list.length) { pickMsg.textContent = F.none; return; }
      pickMsg.textContent = fav !== null ? F.done : '';
      list.forEach(function (n) {
        var b = h('button', { class: 'gl-pick' + (n === fav ? ' is-fav' : ''), type: 'button', 'aria-pressed': n === fav ? 'true' : 'false', 'aria-label': 'Photo ' + n }, [
          h('img', { src: srcOf(n), alt: '' }),
          n === fav ? h('span', { class: 'gl-pick-tag', text: F.pickedLabel }) : null
        ]);
        b.addEventListener('click', function () {
          fav = n; store('gallFav', n);
          renderPicker();
          finish();
        });
        picker.appendChild(b);
      });
    }
    renderPicker();
    if (fav !== null) finish(false);

    // ---- the floating counter ----
    var counter = h('p', { class: 'gl-counter', 'aria-hidden': 'true', text: '1 / ' + count });
    document.body.appendChild(counter);

    // ---- photos "develop" as they come into view; counter follows along ----
    if ('IntersectionObserver' in window) {
      var dev = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-developed'); dev.unobserve(e.target); }
        });
      }, { threshold: 0.3 });
      var cur = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) counter.textContent = e.target.getAttribute('data-i') + ' / ' + count + '  \u00b7  ' + G.wingWord + ' ' + e.target.getAttribute('data-wing');
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      frames.forEach(function (f) { if (reduce) f.classList.add('is-developed'); else dev.observe(f); cur.observe(f); });
      var shown = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) renderPicker(); });
        counter.classList.toggle('is-hidden', entries.some(function (e) { return e.isIntersecting; }));
      }, { threshold: 0.05 });
      shown.observe(finale);
    } else {
      frames.forEach(function (f) { f.classList.add('is-developed'); });
    }
  };

  /* ---------- Words: quiet on purpose. The page warms as she reads, and each line is uncovered slowly ---------- */
  R.words = function () {
    var W = C.words;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.appendChild(h('div', { class: 'wd-heart', 'aria-hidden': 'true', text: '\u2665' }));
    root.appendChild(h('h1', { text: W.title }));
    var lines = paras(W.lines, 'wd-line');
    lines.forEach(function (p) { root.appendChild(p); });
    if (W.signoff) {
      var sign = h('p', { class: 'wd-line wd-sign', text: W.signoff });
      lines.push(sign);
      root.appendChild(sign);
    }
    root.appendChild(h('div', { class: 'wd-star', 'aria-hidden': 'true', text: '\u2726' }));
    var end = h('div', { class: 'feed-end' });
    root.appendChild(end);

    // each line sharpens as it reaches the middle of the screen
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-seen'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -22% 0px', threshold: 0.2 });
      lines.forEach(function (p) { io.observe(p); });
    } else {
      lines.forEach(function (p) { p.classList.add('is-seen'); });
    }

    // the page warms from paper white to blush as she scrolls down
    var ticking = false;
    function warm() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var t = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
      document.body.style.setProperty('--warm', (t * t * (3 - 2 * t)).toFixed(3));
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(warm); } }, { passive: true });
    window.addEventListener('resize', warm);
    warm();

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

    // ---- the sunrise page: message, her favourite photo, a wish, a recap of her run ----
    var D = Object.assign({
      eyebrow: 'for Rid',
      photoLabel: 'Your favourite',
      wishTitle: 'Make a wish',
      wishHint: 'Tap the candle when you are ready.',
      wishDone: 'Wish made. It stays with you.',
      recapTitle: 'Your run',
      recapLetters: 'Letters read',
      recapSongs: 'Songs played',
      recapPhotos: 'Photos you loved',
      recapQuest: 'The Hot Seat',
      questPerfect: 'Flawless',
      questCleared: 'Cleared',
      noReply: 'No reply needed. This is just for you.',
      signoff: 'from Soham'
    }, F);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function extra(k) { return S.extra ? S.extra(k) : undefined; }
    function padN(n) { var g = C.gallery || {}, str = String(n); while (str.length < (g.pad || 3)) str = '0' + str; return str; }

    root.appendChild(h('div', { class: 'fn-sun', 'aria-hidden': 'true' }));
    root.appendChild(h('p', { class: 'fn-eyebrow', text: D.eyebrow }));
    root.appendChild(h('h1', { class: 'fn-title', text: F.title }));
    paras(F.lines, 'fn-line').forEach(function (p, i) { p.style.animationDelay = (0.9 + i * 0.9) + 's'; root.appendChild(p); });

    // her favourite photo from the gallery
    var fav = extra('gallFav');
    if (typeof fav === 'number' && C.gallery) {
      var pol = h('figure', { class: 'fn-polaroid' }, [
        h('img', { src: C.gallery.folder + padN(fav) + '.' + C.gallery.ext, alt: D.photoLabel }),
        h('figcaption', { text: D.photoLabel })
      ]);
      pol.querySelector('img').addEventListener('error', function () { if (pol.parentNode) pol.parentNode.removeChild(pol); });
      root.appendChild(pol);
    }

    // a wish: tap the candle to blow it out. Nothing is saved or sent anywhere.
    var wishMsg = h('p', { class: 'fn-wish-msg', text: D.wishHint, 'aria-live': 'polite' });
    var candle = h('button', { class: 'fn-candle', type: 'button', 'aria-label': D.wishTitle }, [
      h('span', { class: 'fn-flame' }), h('span', { class: 'fn-wick' }), h('span', { class: 'fn-wax' })
    ]);
    candle.addEventListener('click', function () {
      if (candle.classList.contains('is-out')) return;
      candle.classList.add('is-out');
      wishMsg.textContent = D.wishDone;
      wishMsg.classList.add('is-done');
      if (reduce) return;
      var box = h('div', { class: 'fn-confetti', 'aria-hidden': 'true' });
      var cols = ['#ffd23f', '#ff7a59', '#ffffff', '#ff9ec0', '#ffb36b'];
      for (var k = 0; k < 46; k++) {
        var sp = h('span');
        sp.style.left = Math.random() * 100 + '%';
        sp.style.background = cols[k % cols.length];
        sp.style.animationDelay = (Math.random() * 0.7) + 's';
        sp.style.animationDuration = (2.2 + Math.random() * 1.8) + 's';
        box.appendChild(sp);
      }
      document.body.appendChild(box);
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 5200);
    });
    root.appendChild(h('section', { class: 'fn-wish' }, [h('h2', { text: D.wishTitle }), candle, wishMsg]));

    // a game-ending style recap of her run
    var musicTotal = 0;
    (C.music && C.music.sides || []).forEach(function (sd) { musicTotal += sd.tracks.length; });
    var lettersTotal = (C.letters && C.letters.items || []).length;
    var wrongs = extra('wrongs');
    var hearted = extra('gallHearts');
    var rows = [
      [D.recapLetters, S.seen('letters').length + ' / ' + lettersTotal],
      [D.recapSongs, S.seen('music').length + ' / ' + musicTotal],
      [D.recapPhotos, String(Array.isArray(hearted) ? hearted.length : 0)]
    ];
    if (S.isDone('quest')) rows.push([D.recapQuest, wrongs === 0 ? D.questPerfect : D.questCleared]);
    var recap = h('section', { class: 'fn-recap' }, [h('h2', { text: D.recapTitle })]);
    rows.forEach(function (r) {
      recap.appendChild(h('div', { class: 'fn-row' }, [h('span', { class: 'fn-k', text: r[0] }), h('span', { class: 'fn-v', text: r[1] })]));
    });
    root.appendChild(recap);

    root.appendChild(h('p', { class: 'fn-noreply', text: D.noReply }));
    if (D.signoff) root.appendChild(h('p', { class: 'fn-sign', text: D.signoff }));
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

/* The magic candle. Hold the button to blow. Each full breath makes the
   flame bigger until the last one finally puts it out. */
(function () {
  'use strict';

  var C = Site.content.entrance;
  var TOTAL = Math.max(1, (C.tries | 0) || 4);
  var HOLD = C.holdMs || 1400;
  var $ = function (id) { return document.getElementById(id); };

  var btn = $('blow'), bar = $('breath'), statusEl = $('status'), candle = $('candle');
  var after = $('after'), openLink = $('open'), skip = $('skip'), wrap = $('wrap');

  $('title').textContent = C.title;
  $('lead').textContent = C.lead;
  btn.textContent = C.holdLabel;
  openLink.textContent = C.enter;
  skip.textContent = C.skip;
  if (Site.entered()) skip.hidden = false;

  var tries = 0, start = 0, raf = 0, spent = false, over = false;

  function say(msg) { statusEl.textContent = msg || ''; }
  function setProgress(p) { bar.style.setProperty('--p', p); }

  function tick() {
    var p = Math.min(1, (performance.now() - start) / HOLD);
    setProgress(p);
    if (p >= 1) { raf = 0; completeBreath(); return; }
    raf = requestAnimationFrame(tick);
  }

  function begin() {
    if (over || spent || start) return;
    start = performance.now();
    candle.classList.add('is-blowing');
    raf = requestAnimationFrame(tick);
  }

  function end() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    var wasHolding = start !== 0;
    start = 0;
    spent = false;
    setProgress(0);
    candle.classList.remove('is-blowing');
    if (wasHolding && !over) say(C.tooShort);
  }

  function completeBreath() {
    start = 0;
    spent = true;           // ignore the rest of this press until the finger lifts
    setProgress(0);
    candle.classList.remove('is-blowing');
    tries += 1;
    if (tries >= TOTAL) { blowOut(); return; }
    candle.style.setProperty('--s', 1 + 0.5 * tries);
    candle.style.setProperty('--g', 1 + 0.3 * tries);
    candle.classList.remove('swell');
    void candle.offsetWidth;   // restart the swell animation
    candle.classList.add('swell');
    say((C.grew && C.grew[tries - 1]) || '');
  }

  function blowOut() {
    over = true;
    candle.classList.add('is-out');
    document.body.classList.add('wished');
    say(C.out);
    Site.setEntered();
    wrap.hidden = true;
    skip.hidden = true;
    setTimeout(function () {
      after.hidden = false;
      void after.offsetWidth;
      after.classList.add('show');
      openLink.focus({ preventScroll: true });
    }, 1100);
  }

  btn.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    try { btn.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    begin();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { btn.addEventListener(t, end); });
  btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  btn.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); begin(); }
  });
  btn.addEventListener('keyup', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); end(); }
  });
  btn.addEventListener('blur', end);
})();

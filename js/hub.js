/* The map: a winding trail of stars. A star opens after the one before it is done. */
(function () {
  'use strict';

  var S = Site, H = S.content.hub, F = S.content.final;
  if (!S.entered() && !S.isDev()) { location.replace('index.html'); return; }

  document.getElementById('title').textContent = H.title;
  document.getElementById('intro').textContent = H.intro;

  var map = document.getElementById('map'), trail = document.getElementById('trail');
  var SVGNS = 'http://www.w3.org/2000/svg';
  var XS = [30, 68, 34, 66, 36, 62, 50];   // horizontal positions, in percent, zig-zagging down the map
  var GAP = 132, TOP = 56;

  var rooms = S.order.slice();
  if (S.secretFound()) rooms.push('secret');

  function finalLocked() {
    return !!(F.unlockAt && Date.now() < Date.parse(F.unlockAt) && !S.isDev());
  }
  function colorOf(id) {
    return (H.rooms[id] && H.rooms[id].color) || '#ffb13b';
  }
  function unlocked(id) {
    if (id === 'final' && finalLocked()) return false;
    return S.isUnlocked(id);
  }

  var lit = S.order.filter(function (id) { return S.isDone(id); }).length;
  document.getElementById('progress').textContent = lit + ' of ' + S.order.length + ' stars lit';

  function render() {
    var w = map.clientWidth, n = rooms.length, hgt = TOP + (n - 1) * GAP + 96;
    map.style.height = hgt + 'px';
    trail.setAttribute('width', w);
    trail.setAttribute('height', hgt);
    trail.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
    while (trail.firstChild) trail.removeChild(trail.firstChild);
    Array.prototype.slice.call(map.querySelectorAll('.star')).forEach(function (el) { el.remove(); });

    var pts = rooms.map(function (id, i) {
      return { id: id, x: Math.round(w * XS[i % XS.length] / 100), y: TOP + i * GAP };
    });

    // the room the trail is waiting on
    var next = null;
    S.order.forEach(function (id) { if (next === null && unlocked(id) && !S.isDone(id)) next = id; });

    // lines between stars: lit once the star behind them is done.
    // The line fades from that room's colour into the colour of the room it leads to.
    var defs = document.createElementNS(SVGNS, 'defs');
    trail.appendChild(defs);
    pts.forEach(function (p, i) {
      if (i === pts.length - 1) return;
      var q = pts[i + 1], my = (p.y + q.y) / 2, lit = S.isDone(p.id);
      var path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', 'M' + p.x + ' ' + p.y + ' C ' + p.x + ' ' + my + ', ' + q.x + ' ' + my + ', ' + q.x + ' ' + q.y);
      path.setAttribute('class', lit ? 'seg-lit' : 'seg-dim');
      if (lit) {
        var g = document.createElementNS(SVGNS, 'linearGradient');
        g.setAttribute('id', 'seg' + i);
        g.setAttribute('gradientUnits', 'userSpaceOnUse');
        g.setAttribute('x1', p.x); g.setAttribute('y1', p.y);
        g.setAttribute('x2', q.x); g.setAttribute('y2', q.y);
        [[0, colorOf(p.id)], [1, colorOf(q.id)]].forEach(function (st) {
          var stop = document.createElementNS(SVGNS, 'stop');
          stop.setAttribute('offset', st[0]); stop.setAttribute('stop-color', st[1]);
          g.appendChild(stop);
        });
        defs.appendChild(g);
        path.style.stroke = 'url(#seg' + i + ')';
      }
      trail.appendChild(path);
    });

    // the stars
    pts.forEach(function (p) {
      var done = S.isDone(p.id), open = unlocked(p.id), meta = H.rooms[p.id] || { name: p.id };
      var cls = 'star' + (done ? ' is-done' : open ? ' is-open' : ' is-locked') +
        (p.id === next ? ' is-next' : '') + (p.id === 'secret' ? ' is-secret' : '') +
        (p.x * 2 <= w ? ' side-r' : ' side-l');   // label goes on the side away from the middle
      var text = [S.h('span', { class: 'star-name', text: meta.name })];
      if (!open) {
        text.push(S.h('span', { class: 'star-hint', text: (p.id === 'final' && finalLocked()) ? H.dateHint : H.lockedHint }));
      }
      var kids = [S.h('span', { class: 'star-dot' }), S.h('span', { class: 'star-text' }, text)];
      var el = open
        ? S.h('a', { class: cls, href: p.id + '.html' }, kids)
        : S.h('div', { class: cls, 'aria-disabled': 'true' }, kids);
      el.style.setProperty('--star', colorOf(p.id));
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
      map.appendChild(el);
    });
  }

  render();
  var lastW = map.clientWidth;
  window.addEventListener('resize', function () {
    if (map.clientWidth !== lastW) { lastW = map.clientWidth; render(); }
  });
})();

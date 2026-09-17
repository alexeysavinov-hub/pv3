/* PCM v3 — карусель главного экрана (#promo): счётчик, полоски-индикаторы, стрелки, автопрокрутка, свайп. */
(function () {
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function init() {
    var box = document.getElementById('promo');
    if (!box || box.dataset.ready) return;
    box.dataset.ready = '1';
    var n = box.children.length;
    var bars = document.getElementById('promo-dots');
    var barList = bars ? bars.children : [];
    var curEl = document.getElementById('promo-cur');
    var nextEl = document.getElementById('promo-next');
    var titles = [];
    for (var i = 0; i < n; i++) {
      var h = box.children[i].querySelector('h2');
      titles.push(h ? h.textContent.trim() : '');
    }
    var cur = 0, timer = null, lock = 0;

    function paint() {
      for (var k = 0; k < barList.length; k++) {
        if (k === cur) barList[k].setAttribute('aria-current', 'true');
        else barList[k].removeAttribute('aria-current');
      }
      if (curEl) curEl.textContent = pad(cur + 1);
      if (nextEl) nextEl.textContent = titles[(cur + 1) % n] || '';
    }
    function go(i) {
      cur = ((i % n) + n) % n;
      lock = Date.now() + 700;
      box.scrollLeft = box.clientWidth * cur;
      paint();
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); if (n > 1) timer = setInterval(function () { go(cur + 1); }, 7000); }

    for (var k = 0; k < barList.length; k++) {
      (function (idx) { barList[idx].addEventListener('click', function () { go(idx); start(); }); })(k);
    }
    var prev = document.querySelector('[data-promo-prev]');
    var next = document.querySelector('[data-promo-next]');
    if (prev) prev.addEventListener('click', function () { go(cur - 1); start(); });
    if (next) next.addEventListener('click', function () { go(cur + 1); start(); });
    box.addEventListener('mouseenter', stop);
    box.addEventListener('mouseleave', start);

    // ручной свайп: только синхронизируем индикаторы
    var st = null;
    box.addEventListener('scroll', function () {
      if (Date.now() < lock) return;
      clearTimeout(st);
      st = setTimeout(function () {
        var i = Math.round(box.scrollLeft / box.clientWidth);
        if (i >= 0 && i < n && i !== cur) { cur = i; paint(); }
      }, 120);
    }, { passive: true });

    // Android: инерция флика пролетает несколько снап-точек — ограничиваем одним слайдом
    if (/Android/i.test(navigator.userAgent)) {
      var tx = null, ty = null, tCur = 0;
      box.addEventListener('touchstart', function (e) {
        tx = e.touches[0].clientX; ty = e.touches[0].clientY;
        tCur = Math.round(box.scrollLeft / box.clientWidth);
        stop();
      }, { passive: true });
      box.addEventListener('touchend', function (e) {
        if (tx === null) return;
        var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
        tx = ty = null;
        if (Math.abs(dx) < Math.abs(dy)) { start(); return; }
        var t = tCur;
        if (Math.abs(dx) > 30) t = tCur + (dx < 0 ? 1 : -1);
        t = Math.max(0, Math.min(n - 1, t));
        cur = t; lock = Date.now() + 700;
        requestAnimationFrame(function () { box.scrollLeft = box.clientWidth * t; paint(); });
        start();
      }, { passive: true });
    }

    window.addEventListener('resize', function () { lock = Date.now() + 300; box.scrollLeft = box.clientWidth * cur; });
    paint();
    start();
  }

  var tries = 0;
  (function wait() {
    if (document.getElementById('promo')) return init();
    if (++tries < 200) setTimeout(wait, 50);
  })();
})();

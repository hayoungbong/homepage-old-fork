/* Page behaviour. Each feature is isolated so a failure in one never breaks the others,
   and the page stays fully readable with JavaScript turned off. */
(function () {
  'use strict';
  var root = document.documentElement;

  function feature(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn('[site] ' + name + ' disabled:', e); }
  }
  function store(kind, k, v) { try { window[kind].setItem(k, v); } catch (e) {} }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  feature('language switch', function () {
    var btns = document.querySelectorAll('.lang button');
    function setLang(l, remember) {
      if (l !== 'ko' && l !== 'en') l = 'en';
      root.setAttribute('data-lang', l);
      root.setAttribute('lang', l);
      each(btns, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === l ? 'true' : 'false'); });
      if (remember) store('localStorage', 'lang', l);
    }
    setLang(root.getAttribute('data-lang'), false);
    each(btns, function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); }); });
  });

  feature('theme switch', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') ||
        (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store('sessionStorage', 'theme', next);   // holds for this visit; next visit follows the sun again
    });
  });

  feature('publication filter', function () {
    var chips = document.querySelectorAll('.chip'), groups = document.querySelectorAll('.pub-year');
    each(chips, function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        each(chips, function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        each(groups, function (g) { g.hidden = !(f === 'all' || f === g.getAttribute('data-status')); });
      });
    });
  });

  feature('active menu item', function () {
    if (!('IntersectionObserver' in window)) return;
    var nav = document.querySelector('.site-nav');
    var links = document.querySelectorAll('.site-nav a');
    var io = new IntersectionObserver(function (entries) {
      each(entries, function (en) {
        if (!en.isIntersecting) return;
        each(links, function (a) {
          var on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
          // keep the active item visible in the horizontally scrolling phone menu
          if (on && nav && nav.scrollWidth > nav.clientWidth) {
            var left = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
            if (nav.scrollTo) nav.scrollTo({ left: Math.max(0, left), behavior: 'smooth' }); else nav.scrollLeft = Math.max(0, left);
          }
        });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    each(document.querySelectorAll('main section[id], #contact'), function (s) { io.observe(s); });
  });

  feature('back to top', function () {
    var toTop = document.getElementById('to-top');
    if (!toTop) return;
    var ticking = false;
    function update() { toTop.hidden = window.pageYOffset < 700; ticking = false; }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; (window.requestAnimationFrame || setTimeout)(update); }
    }, { passive: true });
    update();
  });
})();

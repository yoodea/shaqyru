/* shaqyru — анимации: GSAP ScrollTrigger + Lenis (как на adovasio.it) */
(function () {
  gsap.registerPlugin(ScrollTrigger);

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else if (typeof target === 'string') {
      var el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // якорные ссылки через Lenis
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        scrollToTarget(id);
      }
    });
  });

  /* ---------- letter-roll для ссылок (.roll) ---------- */
  document.querySelectorAll('.roll').forEach(function (el) {
    if (el.querySelector('.ch')) return;
    var txt = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', txt);
    Array.prototype.forEach.call(txt, function (c, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('data-ch', c);
      s.setAttribute('aria-hidden', 'true');
      s.style.transitionDelay = (i * 14) + 'ms';
      s.innerHTML = c === ' ' ? '&nbsp;' : c;
      el.appendChild(s);
    });
  });

  /* ---------- pill-кнопки: дублируем подпись для переката ---------- */
  document.querySelectorAll('.pill').forEach(function (b) {
    var lbl = b.querySelector('.lbl');
    if (!lbl) return;
    lbl.setAttribute('data-txt', lbl.textContent);
    var mask = document.createElement('span');
    mask.className = 'lbl-mask';
    lbl.parentNode.insertBefore(mask, lbl);
    mask.appendChild(lbl);
  });

  /* ---------- прелоадер: колонки цифр 0 → 100 ---------- */
  var pre = document.getElementById('preloader');
  var introDelay = 0;
  if (pre && !reduced && !sessionStorage.getItem('shq-seen')) {
    sessionStorage.setItem('shq-seen', '1');
    introDelay = 2.15;
    document.documentElement.style.overflow = 'hidden';

    var cols = pre.querySelectorAll('.ldr-col .stack');
    // каждая колонка прокручивается к своей финальной цифре с каскадом
    cols.forEach(function (stack, i) {
      var steps = stack.children.length - 1;
      gsap.to(stack, {
        yPercent: -100 * steps / stack.children.length,
        duration: 1.5 + i * 0.22,
        ease: 'power3.inOut',
        delay: 0.15
      });
    });
    gsap.to(pre, {
      yPercent: -100,
      duration: 0.9,
      ease: 'power4.inOut',
      delay: introDelay - 0.25,
      onComplete: function () {
        pre.remove();
        document.documentElement.style.overflow = '';
      }
    });
  } else if (pre) {
    pre.remove();
  }

  /* ---------- hero: строки поднимаются, фигуры-фото раскрываются ---------- */
  var heroLines = document.querySelectorAll('.hero-title .line > .inner');
  if (heroLines.length) {
    gsap.set(heroLines, { yPercent: 118 });
    gsap.to(heroLines, {
      yPercent: 0,
      duration: 1.3,
      ease: 'power4.out',
      stagger: 0.12,
      delay: introDelay + 0.1
    });
    gsap.to('.hero-fig', {
      scale: 1,
      duration: 1.1,
      ease: 'elastic.out(1, 0.75)',
      stagger: 0.15,
      delay: introDelay + 0.75
    });
    gsap.from('.hero-kicker, .hero-foot', {
      opacity: 0,
      y: 24,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.1,
      delay: introDelay + 0.6
    });
  }

  /* ---------- навбар: фон после скролла ---------- */
  var nav = document.querySelector('header.nav');
  if (nav) {
    ScrollTrigger.create({
      start: 60,
      onUpdate: function (self) {
        nav.classList.toggle('scrolled', self.scroll() > 60);
      }
    });
    nav.classList.toggle('scrolled', window.scrollY > 60);
    if (!reduced) {
      gsap.from(nav, { opacity: 0, duration: 0.8, delay: introDelay + 0.4 });
    }
  }

  /* ---------- заголовки секций: пословный подъём ---------- */
  document.querySelectorAll('.sec-title').forEach(function (el) {
    if (el.querySelector('.w')) return;
    splitWords(el);
    var spans = el.querySelectorAll('.w > span');
    gsap.set(spans, { yPercent: 115 });
    gsap.to(spans, {
      yPercent: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var o = document.createElement('span');
      o.className = 'w';
      var s = document.createElement('span');
      s.textContent = w;
      o.appendChild(s);
      el.appendChild(o);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  /* ---------- reveal-блоки ---------- */
  gsap.utils.toArray('.rv').forEach(function (el) {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'power3.out',
      delay: (parseInt(el.dataset.d, 10) || 0) / 1000,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  /* ---------- изображения: clip-reveal снизу + лёгкий зум ---------- */
  gsap.utils.toArray('.rv-img').forEach(function (el) {
    var img = el.querySelector('img');
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 86%' } })
      .to(el, { clipPath: 'inset(0% 0 0% 0)', duration: 1.25, ease: 'power4.inOut' })
      .from(img, { scale: 1.25, duration: 1.25, ease: 'power4.inOut' }, 0);
  });

  /* ---------- параллакс внутри масок (.par) ---------- */
  if (!reduced) {
    gsap.utils.toArray('.par').forEach(function (el) {
      gsap.fromTo(el, { yPercent: -7 }, {
        yPercent: 7,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  /* ---------- бегущая строка ---------- */
  var track = document.querySelector('.marquee .track');
  if (track && !reduced) {
    gsap.to(track, { xPercent: -50, ease: 'none', duration: 26, repeat: -1 });
  }

  /* ---------- счётчики: прокрутка цифр ---------- */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: function () { el.textContent = String(Math.round(obj.v)); }
    });
  });

  /* ---------- портфолио: превью следует за курсором ---------- */
  var fprev = document.getElementById('fprev');
  if (fprev && matchMedia('(pointer: fine)').matches) {
    var panes = fprev.querySelectorAll('.pane');
    var xTo = gsap.quickTo(fprev, 'x', { duration: 0.55, ease: 'power3' });
    var yTo = gsap.quickTo(fprev, 'y', { duration: 0.55, ease: 'power3' });
    var rTo = gsap.quickTo(fprev, 'rotation', { duration: 0.7, ease: 'power3' });
    var lastX = 0;
    window.addEventListener('mousemove', function (e) {
      xTo(e.clientX + 28);
      yTo(e.clientY - fprev.offsetHeight / 2);
      rTo(gsap.utils.clamp(-7, 7, (e.clientX - lastX) * 0.35));
      lastX = e.clientX;
    });
    document.querySelectorAll('.folio-row').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        panes.forEach(function (p) { p.classList.toggle('on', p.dataset.pane === row.dataset.row); });
        gsap.to(fprev, { opacity: 1, duration: 0.3 });
      });
      row.addEventListener('mouseleave', function () {
        gsap.to(fprev, { opacity: 0, duration: 0.3 });
      });
    });
  }

  /* ---------- i18n ---------- */
  var I18N = window.SHQ_I18N || {};
  var nodes = document.querySelectorAll('[data-i18n]');
  var ru = {};
  nodes.forEach(function (n) {
    if (!(n.dataset.i18n in ru)) ru[n.dataset.i18n] = n.textContent;
  });
  I18N.ru = ru;
  var lang = localStorage.getItem('shq-lang') || 'ru';

  window.setLang = function (l) {
    if (!I18N[l]) l = 'ru';
    lang = l;
    localStorage.setItem('shq-lang', l);
    nodes.forEach(function (n) {
      var v = I18N[l][n.dataset.i18n];
      if (v == null) v = ru[n.dataset.i18n];
      if (v == null) return;
      if (n.classList.contains('roll')) {
        n.textContent = v;
        rebuildRoll(n);
      } else if (n.classList.contains('sec-title')) {
        n.textContent = v;
        splitWords(n);
        gsap.set(n.querySelectorAll('.w > span'), { yPercent: 0 });
      } else if (n.classList.contains('lbl')) {
        n.textContent = v;
        n.setAttribute('data-txt', v);
      } else {
        n.textContent = v;
      }
    });
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.lang === l);
    });
    document.documentElement.lang = l === 'kk' ? 'kk' : l;
  };

  function rebuildRoll(el) {
    var txt = el.textContent;
    el.textContent = '';
    Array.prototype.forEach.call(txt, function (c, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('data-ch', c);
      s.setAttribute('aria-hidden', 'true');
      s.style.transitionDelay = (i * 14) + 'ms';
      s.innerHTML = c === ' ' ? '&nbsp;' : c;
      el.appendChild(s);
    });
  }

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { window.setLang(b.dataset.lang); });
  });
  if (lang !== 'ru') window.setLang(lang);
  else document.querySelectorAll('.lang button').forEach(function (b) {
    b.classList.toggle('on', b.dataset.lang === 'ru');
  });

  /* ---------- форма ---------- */
  var form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = {
        ru: 'Рахмет! Заявка получена — ответим в течение дня.',
        kk: 'Рахмет! Өтінім қабылданды — бір күн ішінде жауап береміз.',
        en: 'Thank you! We will get back to you within a day.'
      };
      form.style.display = 'none';
      var d = document.getElementById('formDone');
      if (d) { d.style.display = 'block'; d.textContent = msg[lang] || msg.ru; }
    });
  }

  ScrollTrigger.refresh();
})();

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // data/ 폴더의 JSON을 비동기로 불러온다 (AJAX)
  function getJSON(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error(path + ' ' + res.status);
      return res.json();
    });
  }


  /* ---------- 언어 (ko / en) ---------- */

  var STR = {
    ko: {
      skip: '본문 바로가기', top: '맨 위로', nav_works: '작품', nav_statement: '작가 노트', nav_cv: '약력', nav_contact: '연락',
      h_works_en: 'Works', h_statement_en: 'Statement', h_cv_en: 'CV', h_contact_en: 'Contact',
      view_works: '작품 보기', insta: '인스타그램', series_aria: '연작 선택', view_aria: '보기 방식',
      view_large: '크게 보기', view_grid: '모아 보기', loading: '불러오는 중…',
      contact_lead: '전시 제안, 작품 구매, 공모전 문의는 메일이나 인스타그램으로 연락 주세요.',
      inq_aria: '문의 종류', mail_send: '메일 보내기', mail_copy: '메일 주소 복사', pdf: '포트폴리오 PDF',
      footer: '© 2026 염지원. 모든 작품 이미지의 저작권은 작가에게 있습니다.',
      lb_aria: '작품 크게 보기', zoom: '확대', unzoom: '축소', close: '닫기', close_txt: '닫기 ×', prev: '이전 작품', next: '다음 작품',
      draft: '초안 미리보기 · 문구와 사진은 확인 전입니다', nav_aria: '섹션 이동', menu: '메뉴', menu_close: '닫기',
      all: '전체', big: ' 크게 보기', pending: '사진을 준비하고 있습니다', pending_s: '사진 준비 중', story: '작품 이야기',
      todo: '추가 예정', copied: '메일 주소를 복사했습니다', insta_at: '인스타그램 @',
      err: '내용을 불러오지 못했습니다. 파일을 더블클릭해서 연 경우 데이터가 막힐 수 있습니다. GitHub Pages 주소로 보거나, 이 폴더에서 <code>python -m http.server</code> 실행 후 <code>http://localhost:8000</code>으로 열어 주세요.',
      desc: '염지원의 포트폴리오. 건칠 함 작업으로 고통의 기억을 담아 봉안하고 희망으로 승화시키는 옻칠 작가.',
      other: 'EN', otherHref: '?lang=en', otherLang: 'en'
    },
    en: {
      skip: 'Skip to content', top: 'Back to top', nav_works: 'Works', nav_statement: 'Statement', nav_cv: 'CV', nav_contact: 'Contact',
      h_works_en: '', h_statement_en: '', h_cv_en: '', h_contact_en: '',
      view_works: 'View works', insta: 'Instagram', series_aria: 'Choose a series', view_aria: 'View mode',
      view_large: 'Large', view_grid: 'Grid', loading: 'Loading…',
      contact_lead: 'For exhibition proposals, purchases and open calls, please contact me by email or Instagram.',
      inq_aria: 'Inquiry types', mail_send: 'Send email', mail_copy: 'Copy email address', pdf: 'Portfolio PDF',
      footer: '© 2026 Yeom Jiwon. All rights to the images of the works belong to the artist.',
      lb_aria: 'Work viewer', zoom: 'Zoom in', unzoom: 'Zoom out', close: 'Close', close_txt: 'Close ×', prev: 'Previous work', next: 'Next work',
      draft: 'Draft preview · text and photos are not yet confirmed', nav_aria: 'Sections', menu: 'Menu', menu_close: 'Close',
      all: 'All', big: ' (view larger)', pending: 'Photo coming soon', pending_s: 'Photo coming soon', story: 'About this work',
      todo: 'To be added', copied: 'Email address copied', insta_at: 'Instagram @',
      err: 'Could not load the content. If you opened the file by double-clicking, the data may be blocked. Please view it on GitHub Pages, or run <code>python -m http.server</code> in this folder and open <code>http://localhost:8000</code>.',
      desc: 'Portfolio of Yeom Jiwon, a lacquer artist who enshrines the memory of pain in dry-lacquer vessels and lets it rise into hope.',
      other: '한국어', otherHref: '?lang=ko', otherLang: 'ko'
    }
  };

  var LANG = 'ko';
  try {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'ko') { LANG = q; localStorage.setItem('lang', q); }
    else { LANG = localStorage.getItem('lang') === 'en' ? 'en' : 'ko'; }
  } catch (e) {
    var m0 = /[?&]lang=(en|ko)/.exec(location.search);
    if (m0) LANG = m0[1];
  }
  var T = STR[LANG];
  var DATA = LANG === 'en' ? 'data/en/' : 'data/';

  function applyStatic() {
    document.documentElement.lang = LANG;
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      el.textContent = T[el.getAttribute('data-i18n')];
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (el) {
      el.setAttribute('aria-label', T[el.getAttribute('data-i18n-aria')]);
    });
    var m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute('content', T.desc);
    $('menuBtn').textContent = T.menu;
    var b = $('langBtn');
    b.textContent = T.other; b.setAttribute('href', T.otherHref); b.setAttribute('lang', T.otherLang); b.setAttribute('hreflang', T.otherLang);
    Array.prototype.forEach.call(document.querySelectorAll('.en'), function (el) { el.hidden = !el.textContent; });
  }

  var toastTimer;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2800);
  }

  var state = { profile: null, series: [], works: [], filter: 'all', view: 'large', flat: [] };

  /* ---------- 공통 ---------- */

  function imgTag(im, opts) {
    opts = opts || {};
    return '<img src="' + esc(opts.thumb ? (im.thumb || im.src) : im.src) + '"' +
      ' width="' + (im.w || '') + '" height="' + (im.h || '') + '"' +
      ' alt="' + esc(im.alt || '') + '"' +
      (im.cutout ? ' class="cutout"' : '') +
      (opts.eager ? ' fetchpriority="high"' : ' loading="lazy"') +
      ' decoding="async">';
  }

  function workById(id) {
    for (var i = 0; i < state.works.length; i++) if (state.works[i].id === id) return state.works[i];
    return null;
  }

  function seriesById(id) {
    for (var i = 0; i < state.series.length; i++) if (state.series[i].id === id) return state.series[i];
    return null;
  }

  function visibleWorks() {
    return state.works.filter(function (w) { return state.filter === 'all' || w.series === state.filter; });
  }

  /* ---------- 히어로 · 연락 ---------- */

  function renderProfile(p) {
    state.profile = p;
    var nm0 = LANG === 'en' ? (p.nameEn || p.name) : p.name;
    document.title = nm0 + ' | ' + p.role;
    var nm = LANG === 'en' ? (p.nameEn || p.name) : p.name;
    $('brand').textContent = nm;
    $('heroEyebrow').textContent = p.roleEn;
    $('heroName').textContent = nm;
    $('heroTagline').textContent = p.tagline;
    $('draftTag').hidden = !p.draft;
    if (p.inquiries && $('inquiryList')) {
      $('inquiryList').innerHTML = p.inquiries.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    }

    var insta = $('heroInsta'), instaBtn = $('instaBtn');
    if (p.instagram && p.instagram.url) {
      insta.href = p.instagram.url;
      instaBtn.href = p.instagram.url;
      instaBtn.textContent = T.insta_at + p.instagram.handle;
    } else {
      insta.hidden = true; instaBtn.hidden = true;
    }

    var mail = 'mailto:' + p.email;
    $('mailLink').href = mail;
    $('mailLink').textContent = p.email;
    $('mailBtn').href = mail;
    $('copyBtn').addEventListener('click', function () {
      var done = function () { toast(T.copied); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(p.email).then(done, function () { toast(p.email); });
      } else { toast(p.email); }
    });

    if (p.portfolioPdf) {
      var pdf = $('pdfBtn');
      pdf.href = p.portfolioPdf;
      pdf.hidden = false;
    }
  }

  function renderHero() {
    var hi = state.profile.heroImage;
    var im = hi;
    if (!im) {
      var w = workById(state.profile.hero) || state.works[0];
      if (!w || !w.images.length) return;
      im = w.images[0];
    }
    $('heroMedia').innerHTML = imgTag(im, { eager: true });
  }

  /* ---------- 작품 ---------- */

  function renderChips() {
    var counts = { all: state.works.length };
    state.works.forEach(function (w) { counts[w.series] = (counts[w.series] || 0) + 1; });
    var html = '<button type="button" class="chip active" data-series="all">' + T.all + ' ' + counts.all + '</button>' +
      state.series.map(function (s) {
        return '<button type="button" class="chip" data-series="' + esc(s.id) + '">' + esc(s.title) + ' ' + (counts[s.id] || 0) + '</button>';
      }).join('');
    $('seriesChips').innerHTML = html;
  }

  function renderSeriesText() {
    var s = seriesById(state.filter);
    $('seriesText').textContent = s ? (s.years + ' · ' + s.text) : '';
  }

  function buildFlat(list) {
    var flat = [];
    list.forEach(function (w) {
      w.images.forEach(function (im, i) {
        flat.push({ work: w, im: im, key: w.id + ':' + i });
      });
    });
    return flat;
  }

  function flatIndex(workId, imgIdx) {
    for (var i = 0; i < state.flat.length; i++) {
      if (state.flat[i].key === workId + ':' + imgIdx) return i;
    }
    return 0;
  }

  function metaLines(w) {
    return [w.year, w.materials, w.size].filter(Boolean).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
  }

  function renderWorks() {
    var list = visibleWorks();
    state.flat = buildFlat(list);
    renderSeriesText();

    var firstImgDone = false;
    $('worksLarge').innerHTML = list.map(function (w) {
      var media;
      if (w.images.length) {
        media = w.images.map(function (im, i) {
          var eager = !firstImgDone; firstImgDone = true;
          return '<figure>' +
            '<button type="button" class="zoom-btn" data-work="' + esc(w.id) + '" data-i="' + i + '" aria-label="' + esc(w.title) + T.big + '">' +
            imgTag(im, { eager: eager }) + '</button>' +
            (im.caption ? '<figcaption class="img-cap">' + esc(im.caption) + '</figcaption>' : '') +
          '</figure>';
        }).join('');
      } else {
        media = '<div class="pending">' + (LANG === 'ko' ? '〈' + esc(w.title) + '〉 ' : esc(w.title) + ': ') + T.pending + '</div>';
      }
      var s = seriesById(w.series);
      return '<article class="work" id="work-' + esc(w.id) + '">' +
        '<div class="work-media">' + media + '</div>' +
        '<div class="work-info">' +
          '<div>' +
            (s ? '<p class="eyebrow">' + esc(s.title) + '</p>' : '') +
            '<h3 class="work-title">' + esc(w.title) + '</h3>' +
            '<div class="work-meta">' + metaLines(w) + '</div>' +
          '</div>' +
          '<div>' +
            '<p class="work-summary">' + esc(w.summary) + '</p>' +
            (w.story ? '<details class="more"><summary>' + T.story + '</summary><p>' + esc(w.story) + '</p></details>' : '') +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    $('worksGrid').innerHTML = list.map(function (w) {
      var inner, cls = 'tile';
      if (w.images.length) {
        inner = '<span class="tile-img">' + imgTag(w.images[0], { thumb: true }) + '</span>';
      } else {
        inner = '<span class="tile-img"><span class="pending">' + T.pending_s + '</span></span>';
      }
      var label = '<span class="tile-title">' + esc(w.title) + '</span><span class="tile-meta">' + esc(w.year) + (w.size ? ' · ' + esc(w.size) : '') + '</span>';
      if (!w.images.length) return '<div class="' + cls + '" style="cursor:default">' + inner + label + '</div>';
      return '<button type="button" class="' + cls + '" data-work="' + esc(w.id) + '" data-i="0" aria-label="' + esc(w.title) + T.big + '">' + inner + label + '</button>';
    }).join('');
  }

  function setView(v) {
    state.view = v;
    $('worksLarge').hidden = v !== 'large';
    $('worksGrid').hidden = v !== 'grid';
    Array.prototype.forEach.call(document.querySelectorAll('.vt'), function (b) {
      var on = b.getAttribute('data-view') === v;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function setupWorksEvents() {
    $('seriesChips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      state.filter = b.getAttribute('data-series');
      Array.prototype.forEach.call($('seriesChips').querySelectorAll('.chip'), function (c) {
        c.classList.toggle('active', c === b);
      });
      renderWorks();
    });
    document.querySelector('.view-toggle').addEventListener('click', function (e) {
      var b = e.target.closest('.vt');
      if (b) setView(b.getAttribute('data-view'));
    });
    function openFrom(e) {
      var t = e.target.closest('[data-work]');
      if (!t || t.className.indexOf('chip') > -1) return;
      openLightbox(flatIndex(t.getAttribute('data-work'), parseInt(t.getAttribute('data-i'), 10) || 0), t);
    }
    $('worksLarge').addEventListener('click', openFrom);
    $('worksGrid').addEventListener('click', openFrom);
  }

  /* ---------- 라이트박스 ---------- */

  var lb = { i: 0, opener: null };

  function showLb(i) {
    var n = state.flat.length;
    if (!n) return;
    lb.i = (i + n) % n;
    var it = state.flat[lb.i], w = it.work, im = it.im;
    var img = $('lbImg');
    img.className = im.cutout ? 'cutout' : '';
    img.src = im.src;
    img.alt = im.alt || w.title;
    $('lbTitle').textContent = w.title;
    $('lbCount').textContent = (lb.i + 1) + ' / ' + n;
    $('lbCap').innerHTML = '<strong>' + esc(w.title) + '</strong>' +
      (im.caption ? ' · ' + esc(im.caption) : '') +
      '<br>' + esc([w.year, w.materials, w.size].filter(Boolean).join(' · '));
    $('lightbox').classList.remove('zoomed');
    $('lbZoom').textContent = T.zoom;
    $('lbStage').scrollTo(0, 0);
    [lb.i + 1, lb.i - 1].forEach(function (k) {
      var nx = state.flat[(k + n) % n];
      if (nx) { var p = new Image(); p.src = nx.im.src; }
    });
  }

  function openLightbox(i, opener) {
    lb.opener = opener || null;
    $('lightbox').hidden = false;
    document.body.classList.add('lb-open');
    showLb(i);
    $('lbClose').focus();
  }

  function closeLightbox() {
    $('lightbox').hidden = true;
    document.body.classList.remove('lb-open');
    if (lb.opener && lb.opener.focus) lb.opener.focus();
  }

  function toggleZoom() {
    var box = $('lightbox');
    var on = box.classList.toggle('zoomed');
    $('lbZoom').textContent = on ? T.unzoom : T.zoom;
    var st = $('lbStage');
    if (on) {
      requestAnimationFrame(function () {
        st.scrollLeft = (st.scrollWidth - st.clientWidth) / 2;
        st.scrollTop = (st.scrollHeight - st.clientHeight) / 2;
      });
    }
  }

  function setupLightbox() {
    $('lbClose').addEventListener('click', closeLightbox);
    $('lbPrev').addEventListener('click', function () { showLb(lb.i - 1); });
    $('lbNext').addEventListener('click', function () { showLb(lb.i + 1); });
    $('lbZoom').addEventListener('click', toggleZoom);
    $('lbImg').addEventListener('click', toggleZoom);

    document.addEventListener('keydown', function (e) {
      if ($('lightbox').hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showLb(lb.i - 1);
      else if (e.key === 'ArrowRight') showLb(lb.i + 1);
      else if (e.key === 'Tab') {
        var f = Array.prototype.filter.call($('lightbox').querySelectorAll('button'), function (b) { return !b.hidden; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // 좌우로 밀어서 다음·이전 작품
    var sx = null, sy = null;
    var stage = $('lbStage');
    stage.addEventListener('touchstart', function (e) {
      if ($('lightbox').classList.contains('zoomed') || e.touches.length > 1) { sx = null; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) showLb(lb.i + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- 작가 노트 · 약력 ---------- */

  function renderStatement(s) {
    $('quote').textContent = s.quote;
    $('statementBody').innerHTML = s.paragraphs.map(function (p) {
      return '<div><h3>' + esc(p.heading) + '</h3><p>' + esc(p.text) + '</p></div>';
    }).join('');
  }

  function renderCV(cv) {
    var draft = state.profile && state.profile.draft;
    $('cvBody').innerHTML = cv.groups.map(function (g) {
      if (!g.items.length && !draft) return '';
      var items = g.items.length
        ? '<ul>' + g.items.map(function (it) {
            return '<li><span class="yr">' + esc(it.year) + '</span><span>' + esc(it.text) + '</span></li>';
          }).join('') + '</ul>'
        : '<p class="todo">' + T.todo + '</p>';
      return '<div><h3>' + esc(g.title) + '</h3>' + items + '</div>';
    }).join('');
  }

  /* ---------- 메뉴 · 현재 위치 ---------- */

  function setupNav() {
    var btn = $('menuBtn'), nav = $('nav');
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? T.menu_close : T.menu;
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = T.menu;
      }
    });

    var links = {};
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) { links[a.getAttribute('data-target')] = a; });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
        if (links[en.target.id]) links[en.target.id].classList.add('active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(links).forEach(function (id) { var s = $(id); if (s) io.observe(s); });
  }

  /* ---------- 시작 ---------- */

  function loadError() {
    $('worksLarge').innerHTML = '<p class="empty wrap">' + T.err + '</p>';
  }

  applyStatic();
  setupNav();
  setupWorksEvents();
  setupLightbox();

  function load(dir) {
    return Promise.all([
      getJSON(dir + 'profile.json'),
      getJSON(dir + 'works.json'),
      getJSON(dir + 'statement.json'),
      getJSON(dir + 'cv.json')
    ]);
  }

  function show(r) {
    state.series = r[1].series;
    state.works = r[1].works;
    renderProfile(r[0]);
    renderHero();
    renderChips();
    renderWorks();
    renderStatement(r[2]);
    renderCV(r[3]);
  }

  load(DATA).then(show).catch(function (err) {
    console.error(err);
    if (LANG === 'en') {
      // 영어 데이터(data/en 폴더)가 없으면 한국어 내용으로 대신 보여 주고 안내한다
      load('data/').then(function (r) {
        show(r);
        toast('English files (data/en) were not found, so Korean content is shown.');
      }).catch(loadError);
    } else {
      loadError();
    }
  });
})();

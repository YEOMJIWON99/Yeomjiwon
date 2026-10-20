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
    document.title = p.name + ' | ' + p.role;
    $('heroEyebrow').textContent = p.roleEn;
    $('heroName').textContent = p.name;
    $('heroTagline').textContent = p.tagline;
    $('draftTag').hidden = !p.draft;
    if (p.inquiries && $('inquiryList')) {
      $('inquiryList').innerHTML = p.inquiries.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    }

    var insta = $('heroInsta'), instaBtn = $('instaBtn');
    if (p.instagram && p.instagram.url) {
      insta.href = p.instagram.url;
      instaBtn.href = p.instagram.url;
      instaBtn.textContent = '인스타그램 @' + p.instagram.handle;
    } else {
      insta.hidden = true; instaBtn.hidden = true;
    }

    var mail = 'mailto:' + p.email;
    $('mailLink').href = mail;
    $('mailLink').textContent = p.email;
    $('mailBtn').href = mail;
    $('copyBtn').addEventListener('click', function () {
      var done = function () { toast('메일 주소를 복사했습니다'); };
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
    var html = '<button type="button" class="chip active" data-series="all">전체 ' + counts.all + '</button>' +
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
            '<button type="button" class="zoom-btn" data-work="' + esc(w.id) + '" data-i="' + i + '" aria-label="' + esc(w.title) + ' 크게 보기">' +
            imgTag(im, { eager: eager }) + '</button>' +
            (im.caption ? '<figcaption class="img-cap">' + esc(im.caption) + '</figcaption>' : '') +
          '</figure>';
        }).join('');
      } else {
        media = '<div class="pending">〈' + esc(w.title) + '〉 사진을 준비하고 있습니다</div>';
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
            (w.story ? '<details class="more"><summary>작품 이야기</summary><p>' + esc(w.story) + '</p></details>' : '') +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    $('worksGrid').innerHTML = list.map(function (w) {
      var inner, cls = 'tile';
      if (w.images.length) {
        inner = '<span class="tile-img">' + imgTag(w.images[0], { thumb: true }) + '</span>';
      } else {
        inner = '<span class="tile-img"><span class="pending">사진 준비 중</span></span>';
      }
      var label = '<span class="tile-title">' + esc(w.title) + '</span><span class="tile-meta">' + esc(w.year) + (w.size ? ' · ' + esc(w.size) : '') + '</span>';
      if (!w.images.length) return '<div class="' + cls + '" style="cursor:default">' + inner + label + '</div>';
      return '<button type="button" class="' + cls + '" data-work="' + esc(w.id) + '" data-i="0" aria-label="' + esc(w.title) + ' 크게 보기">' + inner + label + '</button>';
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
    $('lbZoom').textContent = '확대';
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
    $('lbZoom').textContent = on ? '축소' : '확대';
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
        : '<p class="todo">추가 예정</p>';
      return '<div><h3>' + esc(g.title) + '</h3>' + items + '</div>';
    }).join('');
  }

  /* ---------- 메뉴 · 현재 위치 ---------- */

  function setupNav() {
    var btn = $('menuBtn'), nav = $('nav');
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? '닫기' : '메뉴';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '메뉴';
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
    $('worksLarge').innerHTML = '<p class="empty wrap">내용을 불러오지 못했습니다. 파일을 더블클릭해서 연 경우 데이터가 막힐 수 있습니다. ' +
      'GitHub Pages 주소로 보거나, 이 폴더에서 <code>python -m http.server</code> 실행 후 <code>http://localhost:8000</code>으로 열어 주세요.</p>';
  }

  setupNav();
  setupWorksEvents();
  setupLightbox();

  Promise.all([
    getJSON('data/profile.json'),
    getJSON('data/works.json'),
    getJSON('data/statement.json'),
    getJSON('data/cv.json')
  ]).then(function (r) {
    state.series = r[1].series;
    state.works = r[1].works;
    renderProfile(r[0]);
    renderHero();
    renderChips();
    renderWorks();
    renderStatement(r[2]);
    renderCV(r[3]);
  }).catch(function (err) {
    console.error(err);
    loadError();
  });
})();

'use strict';
// Beranda "Satu tahun anggaran": periode bulan ini, kartu Bulan ini, garis kemajuan,
// peta persil yang tergambar, parallax hero, dan kemunculan bagian saat digulir.
(() => {
  const root = document.documentElement;
  const list = document.querySelector('.cycle-list');
  if (!list) return;
  const periods = [...list.querySelectorAll('.period')];
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const motion = () => root.classList.contains('motion-ok');

  // Tombol jeda/jalankan animasi di samping tombol tema. Pilihan disimpan di perangkat ini.
  const motionButton = document.getElementById('motion-toggle');
  function syncMotionButton() {
    const on = motion();
    const label = on ? 'Jeda animasi' : 'Jalankan animasi';
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
    motionButton.setAttribute('aria-pressed', String(!on));
  }
  if (motionButton) {
    motionButton.addEventListener('click', () => {
      const on = !motion();
      root.classList.toggle('motion-ok', on);
      try { localStorage.setItem('siperi-motion', on ? 'on' : 'off'); } catch {}
      syncMotionButton();
      dispatchEvent(new Event('siperi-motion'));
    });
    syncMotionButton();
  }

  document.querySelectorAll('[data-year]').forEach(node => {
    node.textContent = String(year + Number(node.dataset.year || 0));
  });
  // Label jalur di ponsel ikut menyebut tahunnya.
  for (const [lane, offset] of [['lane-now', 0], ['lane-next', 1]]) {
    list.querySelectorAll(`.${lane} .lane-tag`).forEach(tag => { tag.textContent += ` ${year + offset}`; });
  }

  // Periode yang memuat bulan ini ditandai dan diringkas di kartu hero.
  const current = periods.find(period => period.dataset.months.split(' ').map(Number).includes(month));
  if (current) {
    current.classList.add('is-now');
    const badge = document.createElement('span');
    badge.className = 'now-badge';
    badge.textContent = 'Bulan ini';
    current.querySelector('.period-month').append(' ', badge);
    const card = document.getElementById('now-card');
    const work = lane => current.querySelector(`.${lane} .lane-work`)?.textContent || '';
    if (card) {
      document.getElementById('now-title').textContent = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now);
      document.getElementById('now-current').textContent = work('lane-now');
      document.getElementById('now-next').textContent = work('lane-next');
      card.hidden = false;
    }
  }

  // Peta dimuat sebagai SVG inline agar garis persil dapat digambar saat halaman dibuka.
  // Bila gagal, lapisan kembali memakai gambar latar biasa.
  const layers = [...document.querySelectorAll('.map-layer')];
  for (const layer of layers) {
    const source = layer.classList.contains('map-far') ? 'peta-kontur.svg' : 'peta-persil.svg';
    if (!window.fetch) { layer.classList.add('is-static'); continue; }
    const fallback = setTimeout(() => layer.classList.add('is-static'), 2500);
    fetch(source).then(response => response.ok ? response.text() : Promise.reject())
      .then(text => {
        if (layer.classList.contains('is-static')) return;
        clearTimeout(fallback);
        const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
        if (svg.nodeName !== 'svg') throw new Error('bukan SVG');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        layer.append(document.importNode(svg, true));
        layer.classList.add('is-inline');
      })
      .catch(() => { clearTimeout(fallback); layer.classList.add('is-static'); });
  }

  // Bagian muncul sekali saat pertama kali terlihat.
  const entering = [...document.querySelectorAll('.cycle-head, .period, .app-showcase')];
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        reveal.unobserve(entry.target);
      }
    }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
    entering.forEach(element => reveal.observe(element));
  } else {
    entering.forEach(element => element.classList.add('is-in'));
  }

  // Mask penyingkap judul hanya dipakai selama animasinya; setelah selesai dilepas agar judul tidak
  // menjadi lapisan bermask yang harus disusun ulang setiap kali digulir.
  for (const title of document.querySelectorAll('.is-home .intro h1, .cycle-head h2')) {
    const done = event => { if (event.animationName === 'siperi-reveal') title.classList.add('is-revealed'); };
    title.addEventListener('animationend', done);
    title.addEventListener('animationcancel', done);
  }

  const hero = document.querySelector('.intro');
  const rail = document.createElement('li');
  rail.className = 'cycle-rail';
  rail.setAttribute('aria-hidden', 'true');
  list.prepend(rail);
  // Lapisan parallax dan kecepatannya (bagian dari tinggi layar per satu layar gulir).
  const drift = [
    ...[...document.querySelectorAll('.map-far')].map(node => ({ node, speed: .16, prop: 'transform' })),
    ...[...document.querySelectorAll('.map-near')].map(node => ({ node, speed: .38, prop: 'transform' })),
    ...[...document.querySelectorAll('.is-home .intro h1, .is-home .intro > p:not(.eyebrow)')].map(node => ({ node, speed: -.07, prop: 'translate' })),
    ...(document.getElementById('now-card') ? [{ node: document.getElementById('now-card'), speed: -.03, prop: 'translate' }] : [])
  ];
  let frame = 0;
  let listVisible = false;
  let heroVisible = true;
  let viewHeight = innerHeight;
  let lastRail = -1;
  let lastHero = -1;

  function render() {
    frame = 0;
    const middle = viewHeight * .45;
    if (listVisible) {
      const box = list.getBoundingClientRect();
      const progress = Math.round(Math.max(0, Math.min(1, (middle - box.top) / box.height)) * 1000) / 1000;
      if (progress !== lastRail) { rail.style.transform = `scaleY(${progress})`; lastRail = progress; }
      let active = null;
      for (const period of periods) if (period.getBoundingClientRect().top <= middle) active = period;
      for (const period of periods) if (period.classList.contains('is-active') !== (period === active)) period.classList.toggle('is-active', period === active);
    }
    // Kemajuan gulir di hero (0 di atas, 1 setelah satu layar) menggeser lapisan parallax secara langsung.
    if (hero && heroVisible) {
      const on = motion();
      const progress = on ? Math.max(0, Math.min(1, scrollY / Math.max(1, hero.offsetTop + hero.offsetHeight))) : 0;
      const shift = Math.round(progress * viewHeight * 10) / 10;
      if (shift !== lastHero) {
        lastHero = shift;
        for (const { node, speed, prop } of drift) {
          const y = (shift * speed).toFixed(1);
          if (!on) node.style[prop] = '';
          else if (prop === 'transform') node.style.transform = `translate3d(0, ${y}px, 0)`;
          else node.style.translate = `0 ${y}px`;
        }
      }
    }
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { listVisible = entry.isIntersecting; schedule(); }, { rootMargin: '20% 0px' }).observe(list);
    if (hero) new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; schedule(); }).observe(hero);
  } else {
    listVisible = true;
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('siperi-motion', () => { lastHero = -1; schedule(); });
  addEventListener('resize', () => { viewHeight = innerHeight; lastHero = -1; schedule(); }, { passive: true });
  addEventListener('hashchange', schedule);
  schedule();
})();

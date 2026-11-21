'use strict';
// Beranda "Satu tahun anggaran": periode bulan ini, kartu Bulan ini, garis kemajuan, dan parallax peta.
(() => {
  const list = document.querySelector('.cycle-list');
  if (!list) return;
  const periods = [...list.querySelectorAll('.period')];
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

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
    const heading = current.querySelector('.period-month');
    const badge = document.createElement('span');
    badge.className = 'now-badge';
    badge.textContent = 'Bulan ini';
    heading.append(' ', badge);
    const card = document.getElementById('now-card');
    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now);
    const work = lane => current.querySelector(`.${lane} .lane-work`)?.textContent || '';
    if (card) {
      document.getElementById('now-title').textContent = monthName;
      document.getElementById('now-current').textContent = work('lane-now');
      document.getElementById('now-next').textContent = work('lane-next');
      card.hidden = false;
    }
  }

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const cssTimeline = window.CSS?.supports?.('animation-timeline: scroll()');
  const hero = document.querySelector('.intro');
  const layers = [...document.querySelectorAll('.map-layer')];
  let frame = 0;
  let listVisible = false;
  let heroVisible = true;

  function render() {
    frame = 0;
    const middle = innerHeight * .45;
    if (listVisible) {
      const box = list.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (middle - box.top) / box.height));
      list.style.setProperty('--cycle-progress', progress.toFixed(4));
      let active = null;
      for (const period of periods) if (period.getBoundingClientRect().top <= middle) active = period;
      for (const period of periods) period.classList.toggle('is-active', period === active);
    }
    // Parallax cadangan untuk browser tanpa animation-timeline; CSS menangani sisanya.
    if (heroVisible && !cssTimeline && !reduce?.matches && document.querySelector('main.is-home')) {
      const y = Math.max(0, scrollY);
      for (const layer of layers) layer.style.translate = `0 ${(y * Number(layer.dataset.depth || 0)).toFixed(1)}px`;
    }
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === list) listVisible = entry.isIntersecting;
        if (entry.target === hero) heroVisible = entry.isIntersecting;
      }
      schedule();
    }, { rootMargin: '20% 0px' }).observe(list);
    if (hero) new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; }).observe(hero);
  } else {
    listVisible = true;
  }
  layers.forEach((layer, index) => { layer.dataset.depth = index === 0 ? '.12' : '.3'; });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('hashchange', schedule);
  schedule();
})();

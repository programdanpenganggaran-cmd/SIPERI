'use strict';
(() => {
  const group = document.getElementById('home-services');
  if (!group) return;
  const cards = [...group.querySelectorAll(':scope > a')];
  const panels = [...document.querySelectorAll('.app-showcase')];
  const stack = document.getElementById('application-stack');
  const progressState = new WeakMap();
  let frame = 0, lastTime = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  function render(time) {
    frame = 0;
    if (document.hidden) { lastTime = 0; return; }
    const delta = lastTime ? Math.min(64, time - lastTime) : 1000 / 60;
    lastTime = time;
    let unsettled = false;
    function follow(element, target, immediate = false) {
      const current = progressState.get(element) ?? target;
      const next = immediate ? target : current + (target - current) * (1 - Math.exp(-delta / 115));
      const value = Math.abs(target - next) < .0003 ? target : next;
      if (value !== target) unsettled = true;
      progressState.set(element, value);
      return value;
    }
    const enabled = document.body.hasAttribute('data-motion-enabled') && !document.hidden;
    stack?.classList.toggle('stack-active', enabled && !stack.hidden);
    const groupTop = group.getBoundingClientRect().top;
    const groupOffset = group.offsetTop;
    const cardTops = cards.map(card => groupTop + card.offsetTop - groupOffset);
    const panelMetrics = panels.map(panel => ({ top: panel.getBoundingClientRect().top, height: panel.offsetHeight }));
    cards.forEach((card, index) => {
      if (!enabled || group.hidden) {
        for (const property of ['transform', 'opacity', 'pointer-events']) card.style.removeProperty(property);
        progressState.delete(card); return;
      }
      const focused = card.matches(':focus-within');
      const target = focused ? 1 : clamp((innerHeight * .96 - cardTops[index]) / (innerHeight * .19) - index * .04);
      const progress = follow(card, target, focused);
      const remaining = 1 - progress;
      card.style.transform = `translate3d(${remaining * Math.min(innerWidth * .12, 110)}px,0,0)`;
      card.style.opacity = String(progress);
      card.style.pointerEvents = progress > .1 ? 'auto' : 'none';
    });
    panels.forEach((panel, index) => {
      if (!enabled || panel.hidden) {
        panel.style.removeProperty('transform'); panel.style.removeProperty('opacity'); progressState.delete(panel); return;
      }
      const top = Math.min(100, innerHeight - panelMetrics[index].height - 24);
      panel.style.setProperty('--stack-top', `${top}px`);
      if (index === panels.length - 1 || panel.matches(':focus-within')) {
        progressState.set(panel, 0); panel.style.transform = 'scale(1)'; panel.style.opacity = '1'; return;
      }
      const nextTop = panelMetrics[index + 1].top;
      const progress = clamp((top + panelMetrics[index].height - nextTop) / Math.max(1, panelMetrics[index].height - 36));
      const target = Math.pow(1 - Math.pow(1 - progress, 3), 1 / 2.2);
      const eased = follow(panel, target);
      panel.style.transform = `scale(${1 - .42 * eased})`;
      panel.style.opacity = String(1 - .9 * clamp((eased - .4) / .6));
    });
    if (unsettled && enabled) frame = requestAnimationFrame(render);
    else lastTime = 0;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(render); }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('hashchange', schedule);
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', schedule);
  document.addEventListener('visibilitychange', schedule);
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['data-motion-enabled', 'data-motion-paused'] });
  schedule();
})();

'use strict';
(() => {
  function syncMotion() {
    document.body.toggleAttribute('data-motion-enabled', document.documentElement.classList.contains('motion-ok'));
    document.body.toggleAttribute('data-motion-paused', document.hidden);
  }
  if (document.body?.toggleAttribute) {
    document.addEventListener('visibilitychange', syncMotion);
    addEventListener('siperi-motion', syncMotion);
    syncMotion();
  }
  const directory = document.getElementById('nav-directory');
  if (directory) {
    directory.addEventListener('click', event => {
      const link = event.target.closest?.('a');
      if (link && directory.contains(link)) {
        directory.open = false;
        directory.querySelector('summary')?.focus();
      }
    });
    directory.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !directory.open) return;
      event.preventDefault();
      directory.open = false;
      directory.querySelector('summary')?.focus();
    });
  }

  if (typeof window.IntersectionObserver !== 'function') return;
  const waiting = new Set([...document.querySelectorAll('[data-reveal]')].filter(element =>
    typeof element.animate === 'function' && !element.closest('#results, .result, #bot-dialog, #bot-launcher')));
  const activeAnimations = new Set();
  const observer = new window.IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || !waiting.has(entry.target)) continue;
      waiting.delete(entry.target);
      observer.unobserve(entry.target);
      if (!document.documentElement.classList.contains('motion-ok')) continue;
      try {
        // Tidak mengubah gaya dasar: konten tetap terlihat bila animasi dibatalkan.
        const animation = entry.target.animate([
          { opacity: 0, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 420, iterations: 1, easing: 'cubic-bezier(.2,.65,.3,1)' });
        activeAnimations.add(animation);
        const forget = () => activeAnimations.delete(animation);
        animation.addEventListener('finish', forget, { once: true });
        animation.addEventListener('cancel', forget, { once: true });
      } catch {}
    }
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

  function updateMotionPreference() {
    observer.disconnect();
    for (const element of waiting) observer.observe(element);
  }
  updateMotionPreference();
})();

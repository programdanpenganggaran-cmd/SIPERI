'use strict';
(() => {
  const directory = document.getElementById('nav-directory');
  if (directory) {
    directory.addEventListener('click', event => {
      const link = event.target.closest?.('a');
      if (link && directory.contains(link)) directory.open = false;
    });
    directory.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !directory.open) return;
      event.preventDefault();
      directory.open = false;
      directory.querySelector('summary')?.focus();
    });
  }

  if (typeof window.IntersectionObserver !== 'function') return;
  const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const waiting = new Set([...document.querySelectorAll('[data-reveal]')].filter(element =>
    typeof element.animate === 'function' && !element.closest('#results, .result, #bot-dialog, #bot-launcher')));
  const activeAnimations = new Set();
  const observer = new window.IntersectionObserver(entries => {
    if (motionPreference?.matches) return;
    for (const entry of entries) {
      if (!entry.isIntersecting || !waiting.has(entry.target)) continue;
      waiting.delete(entry.target);
      observer.unobserve(entry.target);
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
    if (motionPreference?.matches) {
      for (const animation of activeAnimations) animation.cancel();
      activeAnimations.clear();
      return;
    }
    for (const element of waiting) observer.observe(element);
  }
  if (motionPreference?.addEventListener) motionPreference.addEventListener('change', updateMotionPreference);
  else motionPreference?.addListener?.(updateMotionPreference);
  updateMotionPreference();
})();

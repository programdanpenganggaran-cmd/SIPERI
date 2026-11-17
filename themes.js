'use strict';
(() => {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  function syncTheme() {
    const dark = root.dataset.theme === 'dark';
    const label = dark ? 'Gunakan tema terang' : 'Gunakan tema gelap';
    button.setAttribute('aria-label', label); button.title = label;
    button.setAttribute('aria-pressed', String(dark));
    document.querySelector('.brief-tag').textContent = 'SiPERI / Akses cepat';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#102238' : '#f5f9ff';
  }
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('siperi-theme', root.dataset.theme); } catch {}
    syncTheme();
  });
  syncTheme();
})();

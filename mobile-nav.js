'use strict';
// Tab bar bawah untuk ponsel: tombol Menu membuka daftar layanan lengkap sebagai lembar dari bawah.
(() => {
  const directory = document.getElementById('nav-directory');
  const tab = document.getElementById('tab-menu');
  if (!directory || !tab) return;
  const root = document.documentElement;
  const tabVisible = () => tab.getClientRects().length > 0;

  function sync() {
    tab.setAttribute('aria-expanded', String(directory.open));
    root.classList.toggle('menu-sheet-open', directory.open && tabVisible());
  }

  tab.addEventListener('click', () => {
    directory.open = !directory.open;
    if (directory.open) {
      requestAnimationFrame(() => {
        const target = directory.querySelector('nav a.current') || directory.querySelector('nav a');
        target?.focus({ preventScroll: true });
      });
    }
  });

  directory.addEventListener('toggle', () => {
    sync();
    if (directory.open || !tabVisible()) return;
    // Ringkasan menu atas tersembunyi di ponsel, jadi fokus kembali ke tombol Menu di bawah.
    const active = document.activeElement;
    if (!active || active === document.body || directory.contains(active)) tab.focus({ preventScroll: true });
  });

  // Ketukan pada latar gelap di luar lembar menutup menu.
  directory.addEventListener('click', event => {
    if (event.target === directory && directory.open && tabVisible()) directory.open = false;
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && directory.open && tabVisible()) {
      directory.open = false;
      tab.focus({ preventScroll: true });
    }
  });

  addEventListener('resize', sync, { passive: true });
  sync();
})();

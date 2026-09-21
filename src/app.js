const params = new URLSearchParams(window.location.search);
const requestedScreen = params.get('screen') || 'search';
const screens = new Set(['search', 'tracking', 'exception', 'seller']);
const activeScreen = screens.has(requestedScreen) ? requestedScreen : 'search';

document.querySelectorAll('[data-screen]').forEach((screen) => {
  screen.hidden = screen.dataset.screen !== activeScreen;
});

document.querySelectorAll('.nav-link').forEach((link) => {
  const href = link.getAttribute('href') || '';
  const target = href.startsWith('?') ? new URL(link.href, window.location.href).searchParams.get('screen') : null;
  link.classList.toggle('active', target === activeScreen || (activeScreen === 'tracking' && target === 'search') || (activeScreen === 'exception' && target === 'search'));
});

const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  mobileNav.hidden = open;
});

document.querySelector('#awb-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const awb = new FormData(event.currentTarget).get('awb')?.toString().trim().toUpperCase();
  window.location.href = awb === 'ANT-100015' ? '?screen=exception' : '?screen=tracking';
});

document.querySelector('#resolution-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const toast = document.querySelector('.toast');
  toast.hidden = false;
  window.setTimeout(() => { toast.hidden = true; }, 3200);
});

const landmark = document.querySelector('#landmark');
const counter = document.querySelector('.char-count');
landmark?.addEventListener('input', () => {
  counter.textContent = `${landmark.value.length}/150`;
});

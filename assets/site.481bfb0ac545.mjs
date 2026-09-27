import { initializeForm } from './forms.faf301652361.mjs';
import { initializeMotion } from './motion.29f0f8d04f21.mjs';

const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const menu = document.getElementById('site-nav');
const smallScreen = window.matchMedia('(max-width: 700px)');
function closeMenu(returnFocus = false) {
  if (!menuButton || !menu) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menu.classList.remove('is-open');
  if (returnFocus) menuButton.focus();
}
if (menuButton && menu && header) {
  menuButton.hidden = false;
  header.classList.add('nav-ready');
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  });
  menu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !header.contains(event.target)) closeMenu();
  });
  document.addEventListener('focusin', (event) => {
    if (event.target instanceof Node && !header.contains(event.target)) closeMenu();
  });
  smallScreen.addEventListener('change', () => closeMenu());
}
initializeForm();
initializeMotion();

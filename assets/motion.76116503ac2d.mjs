/**
 * Native scrolling only: no intercepted wheel events, scroll locking, or hidden copy.
 * Two shallow hero layers and the approach marker share one event-driven RAF.
 * Nothing runs continuously when the page is idle.
 */
export function initializeMotion() {
  const hero = document.querySelector('[data-hero]');
  const portrait = document.querySelector('[data-portrait]');
  const header = document.querySelector('[data-header]');
  const steps = [...document.querySelectorAll('[data-step]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 700px)');
  let queued = false;
  let currentStep = -1;
  function update() {
    queued = false;
    if (document.hidden) return;
    const scrollY = window.scrollY;
    header?.classList.toggle('is-scrolled', scrollY > 10);
    if (hero && portrait) {
      if (reduced.matches || mobile.matches) {
        hero.style.removeProperty('--rear-shift');
        portrait.style.removeProperty('--portrait-shift');
        portrait.style.removeProperty('--portrait-scale');
      } else {
        const bounds = hero.getBoundingClientRect();
        if (bounds.bottom > -80 && bounds.top < window.innerHeight) {
          const progress = Math.min(1, Math.max(0, scrollY / hero.offsetHeight));
          hero.style.setProperty('--rear-shift', `${(progress * 9).toFixed(2)}px`);
          portrait.style.setProperty('--portrait-shift', `${(-progress * 26).toFixed(2)}px`);
          portrait.style.setProperty('--portrait-scale', (1.012 + progress * .025).toFixed(4));
        }
      }
    }
    if (steps.length) {
      let next = 0;
      if (!reduced.matches) {
        const focusLine = window.innerHeight * .43;
        let bestDistance = Infinity;
        steps.forEach((step, i) => {
          const rect = step.getBoundingClientRect();
          const distance = Math.abs(rect.top + Math.min(rect.height / 2, 80) - focusLine);
          if (distance < bestDistance) { bestDistance = distance; next = i; }
        });
      }
      if (next !== currentStep) {
        currentStep = next;
        steps.forEach((step, i) => step.classList.toggle('is-current', i === next));
      }
    }
  }
  function requestUpdate() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('pageshow', requestUpdate);
  document.addEventListener('visibilitychange', requestUpdate);
  reduced.addEventListener('change', requestUpdate);
  mobile.addEventListener('change', requestUpdate);
  document.fonts?.ready.then(requestUpdate);
  requestUpdate();
}

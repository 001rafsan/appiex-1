/* Appiex homepage CTA measurement.
 * Reuses the existing site GA4 install. Sends only static CTA identifiers.
 * Honors Do Not Track and Google Analytics opt-out, and never sends form data.
 */
(() => {
  'use strict';
  if (navigator.doNotTrack === '1' || window['ga-disable-G-DF198MPZGT']) return;
  const targets = [...document.querySelectorAll('[data-home-cta]')];
  if (!targets.length) return;
  const send = (name, node) => {
    if (typeof window.gtag !== 'function') return;
    const id = node.dataset.homeCta || '';
    if (!/^[a-z0-9-]{1,50}$/.test(id)) return;
    window.gtag('event', name, { cta_id: id, cta_placement: 'home-hero' });
  };
  document.addEventListener('click', event => {
    const link = event.target?.closest?.('[data-home-cta]');
    if (link) send('home_cta_click', link);
  }, { passive: true });
  if (!('IntersectionObserver' in window)) return;
  const seen = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < .5) continue;
      const node = entry.target;
      if (!seen.has(node.dataset.homeCta)) {
        seen.add(node.dataset.homeCta);
        send('home_cta_view', node);
      }
      observer.unobserve(node);
    }
  }, { threshold: .5 });
  targets.forEach(node => observer.observe(node));
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();

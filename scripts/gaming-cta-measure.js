/* Appiex / Gaming
 * Anonymous on-page CTA impressions and clicks for GA4 experimentation.
 * No personal details, form values, session IDs, cookies or outbound requests
 * originate from this script; events use the site's existing gtag integration.
 */
(() => {
  'use strict';
  const nodes = [...document.querySelectorAll('[data-gx-cta]')];
  if (!nodes.length) return;
  if (navigator.doNotTrack === '1' || window['ga-disable-G-DF198MPZGT']) return;

  const send = (eventName, node) => {
    if (typeof window.gtag !== 'function') return;
    const id = node.dataset.gxCta;
    const place = node.dataset.gxPlace || 'other';
    if (!id || !/^[a-z0-9-]{1,50}$/.test(id) || !/^[a-z0-9-]{1,50}$/.test(place)) return;
    window.gtag('event', eventName, {
      cta_id: id,
      cta_placement: place
    });
  };
  document.addEventListener('click', event => {
    const link = event.target?.closest?.('[data-gx-cta]');
    if (link) send('gaming_cta_click', link);
  }, { passive: true });

  // A view is an actual >=50% intersection, not every page-load impression.
  if (!('IntersectionObserver' in window)) return;
  const seen = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < .5) continue;
      const element = entry.target;
      const key = element.dataset.gxCta + ':' + (element.dataset.gxPlace || 'other');
      if (!seen.has(key)) {
        seen.add(key);
        send('gaming_cta_view', element);
      }
      observer.unobserve(element);
    }
  }, { threshold: .5 });
  nodes.forEach(node => observer.observe(node));
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
})();

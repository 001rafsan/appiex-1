/* Gaming smooth scroll in the existing Next.js-served HTML page.
 * Lenis is bundled from the installed npm package and served from this site.
 * Native touch scrolling and reduced-motion accessibility remain intact.
 */
(() => {
  'use strict';

  if (!document.body?.classList.contains('gaming-page')) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactView = window.matchMedia('(max-width: 650px)');
  let instance = null;

  function mount() {
    if (instance || reduceMotion.matches || typeof window.Lenis !== 'function') return;

    instance = new window.Lenis({
      autoRaf: true,
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      syncTouch: false,
      respectReducedMotion: true,
      stopInertiaOnNavigate: true,
      anchors: {
        // The sticky site header and chapter menu should not cover headings.
        offset: compactView.matches ? -120 : -145
      },
      prevent: (node) => Boolean(node.closest('[data-lenis-prevent]'))
    });
  }

  function unmount() {
    if (!instance) return;
    instance.destroy();
    instance = null;
  }

  function onMotionChange() {
    unmount();
    mount();
  }

  reduceMotion.addEventListener('change', onMotionChange);
  mount();

  window.addEventListener('pagehide', () => {
    reduceMotion.removeEventListener('change', onMotionChange);
    unmount();
  }, { once: true });
})();

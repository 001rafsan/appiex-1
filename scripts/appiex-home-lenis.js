/* Appiex Smooth Scroll Engine (Home & Core Pages)
 * Replicates the buttery-smooth, fluid feel of the gaming page (/gaming).
 * Uses native display refresh rate autoRaf, quartic ease-out glide,
 * and preserves native touch scrolling and reduced-motion accessibility.
 */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactView = window.matchMedia('(max-width: 650px)');
  let instance = null;

  function mount() {
    if (instance || reduceMotion.matches || typeof window.Lenis !== 'function') return instance;

    document.documentElement.classList.add('lenis', 'lenis-smooth');

    instance = new window.Lenis({
      autoRaf: true,
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      syncTouch: false,
      respectReducedMotion: true,
      stopInertiaOnNavigate: true,
      anchors: {
        offset: compactView.matches ? -70 : -85
      },
      prevent: (node) => Boolean(
        node && node.closest && (
          node.closest('[data-lenis-prevent]') ||
          node.closest('#rafsan-mobile-drawer') ||
          node.closest('.rafsan-mobile-drawer') ||
          node.closest('#product-details-modal') ||
          node.closest('dialog')
        )
      )
    });

    window.lenis = instance;

    // Keep GSAP ScrollTrigger synchronized without hijacking Lenis's RAF loop
    if (typeof window.ScrollTrigger !== 'undefined') {
      instance.on('scroll', window.ScrollTrigger.update);
    }

    return instance;
  }

  function unmount() {
    if (!instance) return;
    try {
      instance.destroy();
    } catch (_) {}
    instance = null;
    window.lenis = null;
    document.documentElement.classList.remove('lenis', 'lenis-smooth');
  }

  function onMotionChange() {
    unmount();
    if (!reduceMotion.matches) mount();
  }

  reduceMotion.addEventListener('change', onMotionChange);

  // Global initializers for external callers (instant-nav, modals, SPA switches)
  window.initHomeLenis = function() {
    if (instance) return instance;
    if (typeof window.Lenis === 'undefined') {
      setTimeout(window.initHomeLenis, 30);
      return null;
    }
    return mount();
  };
  window.initLenis = window.initHomeLenis;

  // Mount immediately if document is ready, or on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.addEventListener('pagehide', () => {
    reduceMotion.removeEventListener('change', onMotionChange);
    unmount();
  }, { once: true });
})();

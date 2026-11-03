/**
 * APPIEX BUTTERY-SMOOTH 60FPS PAGE TRANSITION & CAPSULE NAVBAR ENGINE
 * Seamless Cross-Page Fade-Out -> Instant Prefetched Navigation -> Buttery Dissolve Reveal
 */
(function() {
  'use strict';
    
      window.__closeMobileDrawer = function(e) {
        if (e) {
          try { e.preventDefault(); e.stopPropagation(); } catch(err) {}
        }
        const curDrawer = document.getElementById('rafsan-mobile-drawer');
        if (curDrawer) {
          curDrawer.classList.remove('open');
          document.body.classList.remove('menu-open');
          document.querySelectorAll('#rafsan-menu-toggle, .rafsan-mobile-toggle').forEach(t => {
            t.classList.remove('is-active');
            t.setAttribute('aria-expanded', 'false');
          });
          if (window.lenis) window.lenis.start();
        }
        return false;
      };

      window.__toggleMobileServices = function(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    }
    const btn = document.getElementById('rafsan-mobile-services-toggle');
    const sub = document.getElementById('rafsan-mobile-services-sub');
    if (!sub) return false;

    const isOpen = sub.classList.toggle('open');
    if (btn) {
      btn.classList.toggle('expanded', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
    return false;
  };


  // 1. Ensure Curtain DOM & Buttery GPU Styles Exist on Every Page
  function ensureCurtainAndStyles() {
    if (!document.getElementById('appiex-cuberto-curtain-style')) {
      const style = document.createElement('style');
      style.id = 'appiex-cuberto-curtain-style';
      style.textContent = `
        @view-transition {
          navigation: auto;
        }
        ::view-transition-old(root) {
          animation: appiexVtFadeOut 0.26s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        ::view-transition-new(root) {
          animation: appiexVtFadeIn 0.48s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes appiexVtFadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.992); }
        }
        @keyframes appiexVtFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        #appiex-cuberto-curtain {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 99999999 !important;
          background: #030408 !important;
          background-image: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255, 42, 77, 0.28) 0%, rgba(185, 28, 28, 0.12) 42%, rgba(3, 4, 8, 0.98) 75%, #030408 100%) !important;
          pointer-events: none !important;
          display: block !important;
          opacity: 0;
          visibility: hidden;
          transform: translate3d(0, 0, 0);
          will-change: opacity, visibility;
          transition: opacity 0.52s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s linear 0.52s;
        }
        .appiex-curtain-ambient {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(1);
          width: min(90vw, 76rem);
          height: 36rem;
          background: radial-gradient(ellipse 65% 55% at 50% 50%, rgba(255, 42, 77, 0.34) 0%, rgba(185, 28, 28, 0.15) 42%, transparent 75%);
          filter: blur(55px);
          pointer-events: none;
          opacity: 0.9;
          transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
        }
        /* Instant hold before paint when arriving from a link click */
        html.appiex-page-entering #appiex-cuberto-curtain,
        #appiex-cuberto-curtain.is-holding {
          opacity: 1 !important;
          visibility: visible !important;
          transition: none !important;
        }
        /* Outgoing fade-out when leaving current page */
        #appiex-cuberto-curtain.is-active {
          opacity: 1 !important;
          visibility: visible !important;
          transition: opacity 0.24s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s !important;
        }
        #appiex-cuberto-curtain.is-active .appiex-curtain-ambient {
          transform: translate(-50%, -50%) scale(1.06);
        }
        /* Incoming buttery fade-out reveal on new page */
        #appiex-cuberto-curtain.is-fading {
          opacity: 0 !important;
          visibility: hidden !important;
          transition: opacity 0.54s cubic-bezier(0.16, 1, 0.3, 1), visibility 0s linear 0.54s !important;
        }
        /* Subtle page body motion during transition */
        body.appiex-body-leaving > main,
        body.appiex-body-leaving > section,
        body.appiex-body-leaving > article {
          opacity: 0.25 !important;
          transform: translate3d(0, -6px, 0) scale(0.994) !important;
          transition: opacity 0.24s cubic-bezier(0.22, 1, 0.36, 1), transform 0.24s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        body.appiex-body-entering > main,
        body.appiex-body-entering > section,
        body.appiex-body-entering > article {
          animation: appiexMainReveal 0.56s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes appiexMainReveal {
          0% { opacity: 0.01; transform: translate3d(0, 10px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
      `;
      document.head.appendChild(style);
    }

    let curtain = document.getElementById('appiex-cuberto-curtain');
    if (!curtain && document.body) {
      curtain = document.createElement('div');
      curtain.id = 'appiex-cuberto-curtain';
      curtain.setAttribute('aria-hidden', 'true');
      curtain.innerHTML = '<div class="appiex-curtain-ambient"></div>';
      document.body.prepend(curtain);
    }
    return curtain;
  }

  // 2. Trigger Buttery Smooth Reveal on Page Arrival
  function revealArrivingPage() {
    const curtain = ensureCurtainAndStyles();
    const holdStyle = document.getElementById('curtain-initial-hold');

    if (
      sessionStorage.getItem('appiex_curtain_active') === '1' ||
      window.__appiexFadeCurtain ||
      document.documentElement.classList.contains('appiex-page-entering')
    ) {
      sessionStorage.removeItem('appiex_curtain_active');
      window.__appiexFadeCurtain = false;

      if (curtain) {
        curtain.classList.add('is-holding');
        // Force synchronous browser layout reflow so opacity: 1 is committed before transitioning to 0
        void curtain.offsetHeight;
      }

      if (document.body) {
        document.body.classList.remove('appiex-body-leaving');
        document.body.classList.add('appiex-body-entering');
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (holdStyle && holdStyle.parentNode) {
            holdStyle.parentNode.removeChild(holdStyle);
          }
          document.documentElement.classList.remove('appiex-page-entering');
          if (curtain) {
            curtain.classList.remove('is-holding', 'is-active');
            curtain.classList.add('is-fading');
          }
          setTimeout(() => {
            if (curtain) curtain.classList.remove('is-fading');
            if (document.body) document.body.classList.remove('appiex-body-entering');
          }, 580);
        });
      });
    } else {
      if (holdStyle && holdStyle.parentNode) holdStyle.parentNode.removeChild(holdStyle);
      document.documentElement.classList.remove('appiex-page-entering');
      if (curtain) {
        curtain.classList.remove('is-holding', 'is-active', 'is-fading');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      revealArrivingPage();
      ensureMobileNavigation();
    });
  } else {
    revealArrivingPage();
    ensureMobileNavigation();
  }

  // Failsafe so curtain never blocks view even if a third-party script stalls
  setTimeout(() => {
    const holdStyle = document.getElementById('curtain-initial-hold');
    if (holdStyle && holdStyle.parentNode) holdStyle.parentNode.removeChild(holdStyle);
    document.documentElement.classList.remove('appiex-page-entering');
    const c = document.getElementById('appiex-cuberto-curtain');
    if (c) c.classList.remove('is-holding', 'is-active');
  }, 850);

  
  // 3.1 Universal Mobile Navigation & Clean Viewport CSS Injection
  function injectUniversalMobileStyles() {
    if (!document.getElementById('appiex-universal-mobile-css')) {
      const s = document.createElement('style');
      s.id = 'appiex-universal-mobile-css';
      s.textContent = `
/* ========================================================
   APPIEX CYBER RED & 2-LINE MORPHING TOGGLE (PICTURE 1 & 2)
   ======================================================== */
@media (max-width: 1024px) {
  .rafsan-navbar-shell {
    pointer-events: auto !important;
    z-index: 1000000001 !important;
    width: 100% !important;
    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
  }
  .rafsan-nav-container {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-direction: row !important;
    width: 100% !important;
    padding: 0.75rem 1rem !important;
    box-sizing: border-box !important;
  }
  .rafsan-nav-actions {
    display: none !important;
  }
  
  .rafsan-blog-btn,
  .rafsan-resume-btn,
  .rafsan-btn-blog {
    padding: 6px 16px !important;
    border-radius: 9999px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    color: #ffffff !important;
    text-decoration: none !important;
    background: rgba(255, 255, 255, 0.06) !important;
    transition: all 0.25s ease !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .rafsan-blog-btn:hover,
  .rafsan-resume-btn:hover,
  .rafsan-btn-blog:hover {
    border-color: #ffffff !important;
    background: rgba(255, 255, 255, 0.14) !important;
    transform: translateY(-1px) !important;
  }
  .rafsan-hire-btn,
  .rafsan-btn-login,
  #nav-login-btn,
  #mobile-wrap-login-btn,
  .rafsan-mobile-wrap .rafsan-hire-btn,
  .rafsan-mobile-wrap .rafsan-btn-login {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 6px 18px !important;
    border-radius: 9999px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    background: linear-gradient(135deg, #FF2A4D 0%, #DC2626 100%) !important;
    box-shadow: 0 4px 16px rgba(255, 42, 77, 0.45) !important;
    border: none !important;
    text-decoration: none !important;
    transition: all 0.25s ease !important;
  }

  .rafsan-mobile-wrap {
    display: flex !important;
    align-items: center !important;
    gap: 0.75rem !important;
    margin-left: auto !important;
    flex-shrink: 0 !important;
    pointer-events: auto !important;
    z-index: 1000000005 !important;
  }
  .rafsan-capsule-nav {
    display: none !important;
  }

  /* 2-Line Minimal Futuristic Hamburger Button */
  .rafsan-mobile-toggle {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: transparent !important;
    border: none !important;
    color: #ffffff !important;
    padding: 0 !important;
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    min-height: 44px !important;
    cursor: pointer !important;
    touch-action: manipulation !important;
    -webkit-tap-highlight-color: transparent !important;
    pointer-events: auto !important;
    position: relative !important;
    z-index: 1000000010 !important;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease !important;
  }
  .rafsan-mobile-toggle svg {
    display: none !important;
  }

  .hamburger-box {
    width: 22px !important;
    height: 12px !important;
    position: relative !important;
    display: block !important;
    pointer-events: none !important;
  }

  .hamburger-line {
    position: absolute !important;
    left: 0 !important;
    width: 22px !important;
    height: 2px !important;
    background-color: #ffffff !important;
    border-radius: 2px !important;
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease !important;
    transform-origin: center center !important;
  }

  /* Default state: 2 parallel lines (1st pic) */
  .hamburger-line.line-top {
    top: 0px !important;
    transform: translateY(0px) rotate(0deg) !important;
  }
  .hamburger-line.line-bottom {
    top: 10px !important;
    transform: translateY(0px) rotate(0deg) !important;
  }

  /* When Menu is OPEN: Morph smoothly into an X (1st pic button) */
  .rafsan-mobile-toggle.is-active .hamburger-line.line-top,
  .rafsan-mobile-toggle[aria-expanded="true"] .hamburger-line.line-top {
    transform: translateY(5px) rotate(45deg) !important;
    background-color: #ffffff !important;
  }

  .rafsan-mobile-toggle.is-active .hamburger-line.line-bottom,
  .rafsan-mobile-toggle[aria-expanded="true"] .hamburger-line.line-bottom {
    transform: translateY(-5px) rotate(-45deg) !important;
    background-color: #ffffff !important;
  }

  /* Drawer Top-Right Close Button (Circled in 2nd pic) */
  .cyber-bar-close {
    width: 48px !important;
    height: 48px !important;
    background: #FF2A4D !important; /* Brand Red */
    border: none !important;
    color: #ffffff !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    padding: 0 !important;
    margin: 0 !important;
    transition: background-color 0.2s ease, transform 0.2s ease !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  .cyber-bar-close:hover,
  .cyber-bar-close:active {
    background: #dc2626 !important;
  }
  .cyber-bar-close .hamburger-box {
    width: 20px !important;
    height: 12px !important;
  }
  .cyber-bar-close .hamburger-line {
    width: 20px !important;
  }
  /* Close Button in Cyber Bar: Crossed into an X */
  .cyber-bar-close .hamburger-line.line-top {
    transform: translateY(5px) rotate(45deg) !important;
    background-color: #ffffff !important;
  }
  .cyber-bar-close .hamburger-line.line-bottom {
    transform: translateY(-5px) rotate(-45deg) !important;
    background-color: #ffffff !important;
  }


  /* Hide the login button in header when drawer is open */
  body.menu-open #mobile-wrap-login-btn {
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* ========================================================
     CYBER RED GAMING MOBILE MENU DRAWER
     Opens smoothly from the RIGHT SIDE with 60fps spring animation
     Brand Color: RED (#FF2A4D)
     ======================================================== */
  .rafsan-mobile-drawer {
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    left: auto !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    background: #000000 !important;
    z-index: 999999999 !important;
    display: flex !important;
    flex-direction: row !important;
    box-sizing: border-box !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    overflow: hidden !important;
    transform: translate3d(100%, 0, 0) !important; /* Slide from RIGHT */
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, visibility 0.4s !important;
    will-change: transform, opacity;
  }

  .rafsan-mobile-drawer.open {
    transform: translate3d(0, 0, 0) !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
  }

  /* Left Content Pane (Scrollable) */
  .cyber-main-pane {
    flex: 1 1 auto !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    padding: 1.25rem 1.25rem 1.5rem 1.4rem !important;
    border-right: 1px solid rgba(255, 255, 255, 0.14) !important;
    position: relative !important;
    box-sizing: border-box !important;
    background: #000000 !important;
  }

  /* Top Discover Header Bar */
  .cyber-top-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding-bottom: 1.25rem !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
    font-family: 'Space Mono', 'IBM Plex Mono', monospace, -apple-system, sans-serif !important;
    font-size: 10px !important;
    letter-spacing: 0.12em !important;
    text-transform: uppercase !important;
    color: rgba(255, 255, 255, 0.65) !important;
  }
  .cyber-top-header .discover-tag {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    color: rgba(255, 255, 255, 0.8) !important;
  }
  .cyber-top-header .discover-tag .square-dot {
    width: 5px !important;
    height: 5px !important;
    background: #ffffff !important;
    display: inline-block !important;
  }
  .cyber-top-header .brand-wordmark {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    font-size: 19px !important;
    font-weight: 800 !important;
    letter-spacing: -0.04em !important;
    color: #ffffff !important;
  }
  .cyber-top-header .page-tag {
    color: #FF2A4D !important; /* RED */
    font-weight: 700 !important;
    line-height: 1.1 !important;
    text-align: right !important;
  }
  .cyber-top-header .page-tag span {
    display: block !important;
    font-size: 8px !important;
    color: rgba(255, 255, 255, 0.5) !important;
  }

  /* Primary Big Editorial Navigation Links */
  .cyber-nav-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.35rem !important;
    padding: 1.4rem 0 1.25rem 0 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
  }
  .cyber-nav-item {
    display: inline-flex !important;
    align-items: baseline !important;
    text-decoration: none !important;
    color: #ffffff !important;
    font-size: clamp(2.2rem, 9.2vw, 3.1rem) !important;
    font-weight: 850 !important;
    letter-spacing: -0.05em !important;
    line-height: 0.96 !important;
    text-transform: uppercase !important;
    position: relative !important;
    width: fit-content !important;
    padding: 0.18rem 0.55rem !important;
    border-radius: 4px !important;
    background: transparent !important;
    border: none !important;
    outline: none !important;
    cursor: pointer !important;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    -webkit-tap-highlight-color: transparent !important;
  }
  .cyber-nav-item:hover,
  .cyber-nav-item.active {
    background: #FF2A4D !important; /* RED */
    color: #ffffff !important;
  }
  .cyber-nav-item .badge-page {
    position: absolute !important;
    left: 100% !important;
    top: 0 !important;
    margin-left: 8px !important;
    font-family: 'Space Mono', 'IBM Plex Mono', monospace !important;
    font-size: 9px !important;
    font-weight: 700 !important;
    line-height: 1 !important;
    letter-spacing: -0.02em !important;
    color: #FF2A4D !important; /* RED */
    white-space: pre !important;
  }
  .cyber-nav-item.active .badge-page,
  .cyber-nav-item:hover .badge-page {
    color: #FF2A4D !important;
  }

  /* Services Accordion in Cyber Red */
  .cyber-services-wrap {
    display: flex !important;
    flex-direction: column !important;
  }
  .cyber-services-toggle {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: fit-content !important;
    cursor: pointer !important;
  }
  .cyber-services-toggle svg.cyber-caret-icon {
    width: 18px !important;
    height: 18px !important;
    margin-left: 10px !important;
    stroke: currentColor !important;
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .cyber-services-toggle.expanded svg.cyber-caret-icon {
    transform: rotate(180deg) !important;
  }
  .cyber-services-sub {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    display: flex !important;
    flex-direction: column !important;
    gap: 0.35rem !important;
    padding: 0 0.75rem !important;
    margin: 0 !important;
    background: rgba(255, 42, 77, 0.05) !important;
    border-left: 2px solid #FF2A4D !important; /* RED */
    transition: max-height 0.36s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, margin 0.3s ease, padding 0.3s ease !important;
  }
  .cyber-services-sub.open {
    max-height: 480px !important;
    opacity: 1 !important;
    padding: 0.6rem 0.75rem !important;
    margin: 0.4rem 0 0.8rem 0 !important;
  }
  .cyber-services-sub a.cyber-sub-item {
    color: rgba(255, 255, 255, 0.88) !important;
    font-family: 'Space Mono', 'IBM Plex Mono', monospace, -apple-system, sans-serif !important;
    font-size: 11px !important;
    letter-spacing: 0.05em !important;
    text-transform: uppercase !important;
    text-decoration: none !important;
    padding: 0.35rem 0 !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    transition: color 0.2s ease, padding-left 0.2s ease !important;
    background: transparent !important;
    border: none !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04) !important;
  }
  .cyber-services-sub a.cyber-sub-item:last-child {
    border-bottom: none !important;
  }
  .cyber-services-sub a.cyber-sub-item:hover,
  .cyber-services-sub a.cyber-sub-item:active {
    color: #FF2A4D !important; /* RED */
    padding-left: 4px !important;
  }
  .cyber-services-sub a.cyber-sub-item .sub-dot {
    width: 4px !important;
    height: 4px !important;
    background: #FF2A4D !important; /* RED */
    box-shadow: 0 0 6px #FF2A4D !important;
    display: inline-block !important;
    flex-shrink: 0 !important;
  }
  .cyber-services-sub a.cyber-sub-explore {
    color: #FF2A4D !important; /* RED */
    font-weight: 700 !important;
    margin-top: 0.25rem !important;
  }

  /* Section: Connect & Actions */
  .cyber-meta-section {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    padding: 1rem 0 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
    font-family: 'Space Mono', 'IBM Plex Mono', monospace, sans-serif !important;
    font-size: 11px !important;
    letter-spacing: 0.06em !important;
  }
  .cyber-meta-label {
    width: 6.5rem !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    color: rgba(255, 255, 255, 0.55) !important;
    text-transform: uppercase !important;
    font-size: 10px !important;
    flex-shrink: 0 !important;
  }
  .cyber-meta-label .square-dot {
    width: 4px !important;
    height: 4px !important;
    background: #ffffff !important;
    opacity: 0.7 !important;
  }
  .cyber-meta-content {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0.5rem !important;
  }
  .cyber-meta-content a {
    color: #ffffff !important;
    text-decoration: none !important;
    text-transform: uppercase !important;
    font-weight: 500 !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    transition: color 0.2s ease !important;
    background: transparent !important;
    border: none !important;
  }
  .cyber-meta-content a:hover,
  .cyber-meta-content a:active {
    color: #FF2A4D !important; /* RED */
  }

  /* Bottom Misc Bar */
  .cyber-bottom-misc {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding-top: 1.25rem !important;
    font-family: 'Space Mono', 'IBM Plex Mono', monospace, sans-serif !important;
    font-size: 10px !important;
    color: rgba(255, 255, 255, 0.45) !important;
    letter-spacing: 0.06em !important;
    text-transform: uppercase !important;
    margin-top: auto !important;
  }

  /* Right Dedicated Cyber Bar Strip */
  .cyber-right-bar {
    width: 48px !important;
    height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: space-between !important;
    position: relative !important;
    background: #000000 !important;
    padding: 0 !important;
    flex-shrink: 0 !important;
    box-sizing: border-box !important;
  }

  /* Bottom Equalizer Audio Bars in Red */
  .cyber-bar-bottom {
    padding-bottom: 1.2rem !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .cyber-audio-equalizer {
    display: flex !important;
    align-items: flex-end !important;
    gap: 2.5px !important;
    height: 14px !important;
  }
  .cyber-audio-equalizer span {
    width: 2px !important;
    background: #FF2A4D !important; /* RED audio bars */
    border-radius: 1px !important;
    opacity: 0.85 !important;
    animation: audioPulse 1.2s ease-in-out infinite alternate !important;
  }
  .cyber-audio-equalizer span:nth-child(1) { height: 6px !important; animation-delay: 0s !important; }
  .cyber-audio-equalizer span:nth-child(2) { height: 12px !important; animation-delay: 0.2s !important; }
  .cyber-audio-equalizer span:nth-child(3) { height: 9px !important; animation-delay: 0.4s !important; }
  .cyber-audio-equalizer span:nth-child(4) { height: 14px !important; animation-delay: 0.15s !important; }
  .cyber-audio-equalizer span:nth-child(5) { height: 7px !important; animation-delay: 0.35s !important; }

  @keyframes audioPulse {
    0% { transform: scaleY(0.4); opacity: 0.5; }
    100% { transform: scaleY(1); opacity: 1; }
  }
}

/* Desktop Navigation (>= 1025px) - STRICTLY HIDDEN */
@media (min-width: 1025px) {
  .rafsan-capsule-nav {
    position: absolute !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    display: flex !important;
  }
  .rafsan-mobile-wrap {
    display: none !important;
  }
  .rafsan-mobile-drawer {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
    .rafsan-nav-actions {
    display: flex !important;
    align-items: center !important;
    gap: 0.85rem !important;
  }
  .rafsan-blog-btn,
  .rafsan-resume-btn,
  .rafsan-btn-blog {
    padding: 6px 16px !important;
    border-radius: 9999px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    color: #ffffff !important;
    text-decoration: none !important;
    background: rgba(255, 255, 255, 0.06) !important;
    transition: all 0.25s ease !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .rafsan-blog-btn:hover,
  .rafsan-resume-btn:hover,
  .rafsan-btn-blog:hover {
    border-color: #ffffff !important;
    background: rgba(255, 255, 255, 0.14) !important;
    transform: translateY(-1px) !important;
  }
  .rafsan-hire-btn,
  .rafsan-btn-login,
  #nav-login-btn {
    padding: 7px 18px !important;
    border-radius: 9999px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    background: linear-gradient(135deg, #FF2A4D 0%, #DC2626 100%) !important;
    color: #ffffff !important;
    border: none !important;
    text-decoration: none !important;
    box-shadow: 0 4px 16px rgba(255, 42, 77, 0.45) !important;
    transition: all 0.25s ease !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .rafsan-hire-btn:hover,
  .rafsan-btn-login:hover,
  #nav-login-btn:hover {
    background: linear-gradient(135deg, #ff4767 0%, #ef4444 100%) !important;
    box-shadow: 0 6px 22px rgba(255, 42, 77, 0.65) !important;
    transform: translateY(-1px) !important;
  }
}
`;
      document.head.appendChild(s);
    }
  }

  function ensureMobileNavigation() {
    injectUniversalMobileStyles();

    const navbar = document.querySelector('.rafsan-navbar-shell');
    const navContainer = document.querySelector('.rafsan-nav-container');
    if (!navbar || !navContainer) return;

    // Check if mobile wrap exists
    let mobileWrap = navContainer.querySelector('.rafsan-mobile-wrap');
    if (!mobileWrap) {
      mobileWrap = document.createElement('div');
      mobileWrap.className = 'rafsan-mobile-wrap';
      mobileWrap.innerHTML = `
        <a href="/login.html" class="rafsan-hire-btn" id="mobile-wrap-login-btn">Login</a>
        <button type="button" class="rafsan-mobile-toggle" id="rafsan-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
          <span class="hamburger-box">
            <span class="hamburger-line line-top"></span>
            <span class="hamburger-line line-bottom"></span>
          </span>
        </button>
      `;
      navContainer.appendChild(mobileWrap);
    } else {
      // Ensure toggle button has 2-line structure
      const toggle = mobileWrap.querySelector('#rafsan-menu-toggle');
      if (toggle && !toggle.querySelector('.hamburger-box')) {
        toggle.innerHTML = `
          <span class="hamburger-box">
            <span class="hamburger-line line-top"></span>
            <span class="hamburger-line line-bottom"></span>
          </span>
        `;
      }
    }

    // Check if mobile drawer exists
    let drawer = document.getElementById('rafsan-mobile-drawer');
    const cyberContent = `
<div class="cyber-main-pane">
      <div class="cyber-top-header">
        <div class="discover-tag">
          <span class="square-dot"></span>
          <span>DISCOVER</span>
        </div>
        <div class="brand-wordmark">appiex</div>
        <div class="page-tag">
          <span>PAGE</span>
          001
        </div>
      </div>

      <nav class="cyber-nav-list">
        <a href="/index.html" class="cyber-nav-item active" data-section="home">
          HOME
          <span class="badge-page">PAGE&#10;001</span>
        </a>

        <!-- Services Accordion with 6 Core Disciplines -->
        <div class="cyber-services-wrap">
          <button type="button" class="cyber-nav-item cyber-services-toggle" id="rafsan-mobile-services-toggle" aria-expanded="false" onclick="return window.__toggleMobileServices(event);">
            <span>SERVICES</span>
            <svg class="cyber-caret-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="cyber-services-sub" id="rafsan-mobile-services-sub">
            <a href="/digital-strategy" class="cyber-sub-item"><span class="sub-dot"></span> DIGITAL STRATEGY</a>
            <a href="/web-development" class="cyber-sub-item"><span class="sub-dot"></span> WEB DEVELOPMENT (FULL-STACK)</a>
            <a href="/ui-ux-3d-design" class="cyber-sub-item"><span class="sub-dot"></span> UI/UX &amp; 3D DESIGN</a>
            <a href="/ai-automation" class="cyber-sub-item"><span class="sub-dot"></span> AI AUTOMATION</a>
            <a href="/seo-marketing" class="cyber-sub-item"><span class="sub-dot"></span> SEO &amp; MARKETING</a>
            <a href="/gaming" class="cyber-sub-item"><span class="sub-dot"></span> GAMING &amp; 3D WORLDS</a>
            <a href="/services" class="cyber-sub-item cyber-sub-explore"><span class="sub-dot"></span> EXPLORE ALL SERVICES &rarr;</a>
          </div>
        </div>

        <a href="/refer.html" class="cyber-nav-item" data-section="refer">REFER</a>
        <a href="/partners.html" class="cyber-nav-item" data-section="partners">PARTNERSHIP</a>
        <a href="/projects.html" class="cyber-nav-item" data-section="projects">PROJECTS</a>
        <a href="/index.html#contact" class="cyber-nav-item" data-section="contact">CONTACT</a>
        <a href="/team.html" class="cyber-nav-item">ABOUT</a>
      </nav>

      <div class="cyber-meta-section">
        <div class="cyber-meta-label">
          <span class="square-dot"></span>
          <span>CONNECT</span>
        </div>
        <div class="cyber-meta-content">
          <a href="https://twitter.com/AppiexOfficial" target="_blank" rel="noopener">TWITTER</a>
          <a href="https://discord.gg/appiex" target="_blank" rel="noopener">DISCORD</a>
          <a href="https://wa.me/8801979493902" target="_blank" rel="noopener">WHATSAPP</a>
        </div>
      </div>

      <div class="cyber-meta-section">
        <div class="cyber-meta-label">
          <span class="square-dot"></span>
          <span>ACTIONS</span>
        </div>
        <div class="cyber-meta-content">
          <a href="/login.html">LOGIN</a>
          <a href="/index.html#contact">BOOK A MEETING</a>
        </div>
      </div>

      <div class="cyber-bottom-misc">
        <div>US-EN &#x2304;</div>
        <div>&copy; 2026 APPIEX</div>
      </div>
    </div>

    <div class="cyber-right-bar">
      <button type="button" class="cyber-bar-close" id="cyber-menu-close" aria-label="Close menu">
        <span class="hamburger-box">
          <span class="hamburger-line line-top" style="transform: translateY(5px) rotate(45deg); background-color: #ffffff;"></span>
          <span class="hamburger-line line-bottom" style="transform: translateY(-5px) rotate(-45deg); background-color: #ffffff;"></span>
        </span>
      </button>

      <div class="cyber-bar-bottom">
        <div class="cyber-audio-equalizer">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    </div>
    </div>
`;

    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'rafsan-mobile-drawer';
      drawer.className = 'rafsan-mobile-drawer appiex-cyber-drawer';
      drawer.setAttribute('data-lenis-prevent', 'true');
      drawer.innerHTML = cyberContent;
      document.body.appendChild(drawer);
    } else {
      drawer.className = 'rafsan-mobile-drawer appiex-cyber-drawer';
      drawer.setAttribute('data-lenis-prevent', 'true');
      drawer.innerHTML = cyberContent;
      if (drawer.parentElement !== document.body) {
        document.body.appendChild(drawer);
      }
    }

    // Highlight active link based on current path
    try {
      const curPath = window.location.pathname.toLowerCase();
      const navLinks = drawer.querySelectorAll('.cyber-nav-list .cyber-nav-item');
      navLinks.forEach(link => {
        link.classList.remove('active');
        const badge = link.querySelector('.badge-page');
        if (badge) badge.remove();
      });

      let activeItem = null;
      if (curPath.includes('refer')) {
        activeItem = drawer.querySelector('[data-section="refer"]');
      } else if (curPath.includes('partner')) {
        activeItem = drawer.querySelector('[data-section="partners"]');
      } else if (curPath.includes('project')) {
        activeItem = drawer.querySelector('[data-section="projects"]');
      } else if (curPath.includes('team') || curPath.includes('about')) {
        activeItem = drawer.querySelector('a[href*="team"]');
      } else if (curPath === '/' || curPath.endsWith('/index.html') || curPath === '') {
        activeItem = drawer.querySelector('[data-section="home"]');
      }

      if (activeItem) {
        activeItem.classList.add('active');
        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'badge-page';
        badgeSpan.innerHTML = 'PAGE<br>001';
        activeItem.appendChild(badgeSpan);
      }
    } catch (e) {}

    // Attach robust toggle event using capture phase
    if (!window.__appiexUniversalToggleBound) {
      window.__appiexUniversalToggleBound = true;

      document.addEventListener('click', function(e) {
        const toggleBtn = e.target.closest('#rafsan-menu-toggle, .rafsan-mobile-toggle, #cyber-menu-close, .cyber-bar-close');
        const curDrawer = document.getElementById('rafsan-mobile-drawer');
        if (!curDrawer) return;

        if (toggleBtn) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const isOpen = curDrawer.classList.toggle('open');
          document.body.classList.toggle('menu-open', isOpen);

          if (window.lenis) {
            if (isOpen) window.lenis.stop();
            else window.lenis.start();
          }

          document.querySelectorAll('#rafsan-menu-toggle, .rafsan-mobile-toggle').forEach(t => {
            t.classList.toggle('is-active', isOpen);
            t.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          });
          return;
        }

        // Handle Direct Navigation for Mobile Drawer Links
        const drawerLink = e.target.closest('#rafsan-mobile-drawer a');
        if (drawerLink && drawerLink.href) {
          const href = drawerLink.getAttribute('href');
          if (href && !href.startsWith('javascript:')) {
            curDrawer.classList.remove('open');
            document.body.classList.remove('menu-open');
            document.querySelectorAll('#rafsan-menu-toggle, .rafsan-mobile-toggle').forEach(t => {
              t.classList.remove('is-active');
              t.setAttribute('aria-expanded', 'false');
            });
            if (window.lenis) window.lenis.start();

            try {
              const targetUrl = new URL(drawerLink.href, location.href);
              const isSamePage = (targetUrl.origin === location.origin && (targetUrl.pathname === location.pathname || targetUrl.pathname.replace(/\/index\.html$/, '') === location.pathname.replace(/\/index\.html$/, '')));
              if (isSamePage && targetUrl.hash) {
                const targetEl = document.querySelector(targetUrl.hash);
                if (targetEl) {
                  if (window.lenis) window.lenis.scrollTo(targetEl, { offset: -60, duration: 0.85 });
                  else targetEl.scrollIntoView({ behavior: 'smooth' });
                }
                return;
              }
            } catch(err) {}

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            window.location.href = drawerLink.href;
            return;
          }
        }

        // Handle Services Submenu Accordion Toggle
        const servicesToggleBtn = e.target.closest('#rafsan-mobile-services-toggle');
        if (servicesToggleBtn) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const sub = document.getElementById('rafsan-mobile-services-sub');
          if (sub) {
            const isSubOpen = sub.classList.toggle('open');
            servicesToggleBtn.classList.toggle('expanded', isSubOpen);
            servicesToggleBtn.setAttribute('aria-expanded', isSubOpen ? 'true' : 'false');
          }
          return;
        }
      }, true);

      // Global window helper for inline onclick fallback
      window.__toggleMobileServices = function(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const sub = document.getElementById('rafsan-mobile-services-sub');
        const btn = document.getElementById('rafsan-mobile-services-toggle');
        if (sub && btn) {
          const isSubOpen = sub.classList.toggle('open');
          btn.classList.toggle('expanded', isSubOpen);
          btn.setAttribute('aria-expanded', isSubOpen ? 'true' : 'false');
        }
        return false;
      };
    }
  }

  // ========================================================
  // 4. ZION-MIZ STYLE ULTRA-FAST SPA ROUTER & 60FPS ENGINE
  // ========================================================
  const pageCache = new Map();
  const prefetchedUrls = new Set();

  // Inject 60FPS GPU & SPA Transition Styles
  function injectSpaStyles() {
    if (document.getElementById('appiex-spa-style')) return;
    const style = document.createElement('style');
    style.id = 'appiex-spa-style';
    style.textContent = `
      /* ZION-MIZ 60FPS HARDWARE ACCELERATION & BENTO TRANSITIONS */
      .shadow-box,
      .bento-card,
      .home-logo-card,
      .appiex-service-card,
      .cyber-nav-item,
      .rafsan-capsule-nav,
      .CtaButton,
      .project-item {
        transform: translate3d(0, 0, 0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        will-change: transform, opacity;
      }

      .shadow-box,
      .bento-card {
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .shadow-box:hover,
      .bento-card:hover {
        transform: translate3d(0, -4px, 0) !important;
      }

      /* SPA PAGE TRANSITION (0ms Instant Swap with Buttery 60fps Reveal) */
      main.appiex-spa-leaving {
        opacity: 0.15 !important;
        transform: translate3d(0, -6px, 0) scale(0.996) !important;
        transition: opacity 0.14s cubic-bezier(0.22, 1, 0.36, 1), transform 0.14s cubic-bezier(0.22, 1, 0.36, 1) !important;
      }
      main.appiex-spa-entering {
        opacity: 0.01 !important;
        transform: translate3d(0, 8px, 0) scale(0.996) !important;
        transition: none !important;
      }
      main.appiex-spa-revealed {
        opacity: 1 !important;
        transform: translate3d(0, 0, 0) scale(1) !important;
        transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
    `;
    document.head.appendChild(style);
  }
  injectSpaStyles();

  // High-Priority Prefetch Engine (fetches into memory in background)
  function prefetch(url) {
    if (!url) return;
    try {
      const u = new URL(url, location.href);
      if (u.origin !== location.origin || u.pathname.includes('/admin')) return;
      const clean = u.pathname + u.search;
      if (prefetchedUrls.has(clean)) return;
      prefetchedUrls.add(clean);

      // 1. Browser link rel prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = clean;
      link.as = 'document';
      document.head.appendChild(link);

      // 2. In-Memory SPA Cache
      fetch(clean, { priority: 'high', cache: 'force-cache' })
        .then(res => {
          if (res.ok) return res.text();
          throw new Error('Prefetch error');
        })
        .then(html => {
          pageCache.set(clean, html);
          pageCache.set(u.href, html);
        })
        .catch(() => {});
    } catch (e) {}
  }

  // Pre-cache current page in memory
  if (typeof document !== 'undefined') {
    const curPath = location.pathname + location.search;
    pageCache.set(curPath, document.documentElement.outerHTML);
    pageCache.set(location.href, document.documentElement.outerHTML);
  }

  // Idle Prefetch Top Pages (instantly available before click)
  if (typeof window !== 'undefined') {
    const idlePrefetch = () => {
      const topPages = [
        '/',
        '/index.html',
        '/services.html',
        '/projects.html',
        '/refer.html',
        '/partners.html',
        '/team.html',
        '/blog.html',
        '/best-software-agency.html'
      ];
      topPages.forEach((p, idx) => {
        setTimeout(() => prefetch(p), idx * 120);
      });
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(idlePrefetch, { timeout: 1500 });
    } else {
      setTimeout(idlePrefetch, 800);
    }
  }

  // Hover & Touch Prefetch Triggers
  const onHover = (e) => {
    const a = e.target.closest('a');
    if (a && a.href && a.origin === location.origin) {
      prefetch(a.href);
    }
  };
  document.addEventListener('mouseover', onHover, { passive: true });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchPrefetchTimer = null;
  document.addEventListener('touchstart', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const a = e.target.closest('a');
    if (!a || !a.href || a.origin !== location.origin) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    clearTimeout(touchPrefetchTimer);
    touchPrefetchTimer = setTimeout(() => {
      prefetch(a.href);
    }, 80);
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dx > 8 || dy > 8) {
      clearTimeout(touchPrefetchTimer);
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    clearTimeout(touchPrefetchTimer);
  }, { passive: true });

  // Re-run interactive page features after instant SPA swap
  function reinitPage(container) {
    if (!container) return;

    // 1. Re-initialize mobile nav toggles & drawer
    if (typeof ensureMobileNavigation === 'function') {
      ensureMobileNavigation();
    }

    // 2. Execute any embedded scripts in the newly swapped container
    container.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });

    // 3. Autoplay active videos
    container.querySelectorAll('video[autoplay]').forEach(v => {
      try { v.play().catch(() => {}); } catch(err) {}
    });

    // 4. Smooth Lenis scroll recalculation
    if (window.lenis) {
      try {
        window.lenis.resize();
        window.lenis.scrollTo(0, { immediate: true });
      } catch (err) {}
    }

    // 5. Update Navbar Active States to match new route
    const currentPath = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '') || '/';
    document.querySelectorAll('.rafsan-nav-item, .cyber-nav-item').forEach(el => {
      const href = el.getAttribute('href');
      if (!href) return;
      const targetPath = href.replace(/\/index\.html$/, '/').replace(/\.html$/, '') || '/';
      if (targetPath === currentPath || (currentPath === '/' && (href === '/' || href === 'index.html' || href === '#home'))) {
        el.classList.add('active');
      } else if (!href.startsWith('#')) {
        el.classList.remove('active');
      }
    });
  }

  // 5. True Zero-Reload SPA Route Navigation (zion-miz style)
  let isNavigating = false;
  let navTimer = null;
  async function navigateSPA(targetUrl, isPopState = false) {
    if (isNavigating && !isPopState) return;
    isNavigating = true;
    clearTimeout(navTimer);
    navTimer = setTimeout(() => { isNavigating = false; }, 650);

    // Close mobile drawer immediately if open
    if (window.__closeMobileDrawer) {
      try { window.__closeMobileDrawer(); } catch(e) {}
    }

    const currentMain = document.querySelector('main');
    const cleanUrl = targetUrl.pathname + targetUrl.search;

    // Start 60fps GPU exit animation
    if (currentMain) {
      currentMain.classList.add('appiex-spa-leaving');
    }

    // Retrieve from memory or fetch immediately
    let html = pageCache.get(cleanUrl) || pageCache.get(targetUrl.href);
    if (!html) {
      try {
        const resp = await fetch(targetUrl.href, { priority: 'high' });
        if (!resp.ok) throw new Error('Fetch failed');
        html = await resp.text();
        pageCache.set(cleanUrl, html);
        pageCache.set(targetUrl.href, html);
      } catch (err) {
        isNavigating = false;
        if (!isPopState) window.location.href = targetUrl.href;
        return;
      }
    }

    // Wait 120ms for buttery exit
    await new Promise(r => setTimeout(r, 120));

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newMain = doc.querySelector('main');

      if (!newMain || !currentMain) {
        // Fallback for standalone pages without <main> (e.g. /gaming)
        isNavigating = false;
        if (!isPopState) window.location.href = targetUrl.href;
        return;
      }

      // Update Document Title
      if (doc.title) {
        document.title = doc.title;
      }

      // Push history state
      if (!isPopState) {
        history.pushState({ url: targetUrl.href }, '', targetUrl.href);
      }

      // Swap Main Content & Classes
      currentMain.className = newMain.className;
      currentMain.id = newMain.id;
      currentMain.innerHTML = newMain.innerHTML;

      // Scroll to Top Instantly
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      // Trigger 60fps GPU Enter Reveal via requestAnimationFrame (zion-miz pattern)
      currentMain.classList.remove('appiex-spa-leaving');
      currentMain.classList.add('appiex-spa-entering');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          currentMain.classList.remove('appiex-spa-entering');
          currentMain.classList.add('appiex-spa-revealed');
          setTimeout(() => {
            currentMain.classList.remove('appiex-spa-revealed');
            isNavigating = false;
          }, 320);
        });
      });

      // Re-initialize dynamic page components
      reinitPage(currentMain);

    } catch (err) {
      isNavigating = false;
      if (!isPopState) window.location.href = targetUrl.href;
    }
  }

  // Handle Browser Back / Forward buttons (SPA Popstate)
  window.addEventListener('popstate', () => {
    try {
      const url = new URL(location.href);
      navigateSPA(url, true);
    } catch(e) {}
  });

  // Global Intercept on Internal Links
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest('a');
    if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;

    const href = a.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('https://wa.me') || href === '#') return;

    try {
      const targetUrl = new URL(a.href, location.href);
      if (targetUrl.origin !== location.origin) return;

      // Allow /admin and /gaming to use native loading
      if (targetUrl.pathname.includes('/admin') || targetUrl.pathname.includes('/gaming')) {
        return;
      }

      // Normalize paths to compare same-page anchor links
      const normCurrent = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '') || '/';
      const normTarget = targetUrl.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '') || '/';

      if (normCurrent === normTarget && targetUrl.hash) {
        const targetEl = document.querySelector(targetUrl.hash);
        if (targetEl) {
          e.preventDefault();
          if (window.lenis) {
            window.lenis.scrollTo(targetEl, { offset: -60, duration: 0.85 });
          } else {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
          history.pushState(null, '', targetUrl.hash);
        }
        return;
      }

      if (normCurrent === normTarget && !targetUrl.hash && targetUrl.search === location.search) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Trigger Instant Buttery SPA Navigation!
      e.preventDefault();
      navigateSPA(targetUrl);

    } catch (err) {}
  });

  // 6. Back / Forward Cache (bfcache) Restore Cleanup
  window.addEventListener('pageshow', (e) => {
    isNavigating = false;
    const holdStyle = document.getElementById('curtain-initial-hold');
    if (holdStyle && holdStyle.parentNode) holdStyle.parentNode.removeChild(holdStyle);
    document.documentElement.classList.remove('appiex-page-entering');
    if (document.body) document.body.classList.remove('appiex-body-leaving', 'appiex-body-entering');
  });
})();

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('#rafsan-mobile-services-toggle');
    if (btn) {
      window.__toggleMobileServices(e);
    }
  }, true);

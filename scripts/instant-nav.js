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


  // 1. Ensure 0.001s Instant View Transitions & Zero-Blocking Curtain Styles
  function ensureCurtainAndStyles() {
    if (!document.getElementById('appiex-cuberto-curtain-style')) {
      const style = document.createElement('style');
      style.id = 'appiex-cuberto-curtain-style';
      style.textContent = `
        @view-transition {
          navigation: auto;
        }
        ::view-transition-old(root) {
          animation: appiexVtFadeOut 0.04s ease-out both !important;
        }
        ::view-transition-new(root) {
          animation: appiexVtFadeIn 0.06s ease-out both !important;
        }
        @keyframes appiexVtFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes appiexVtFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        #appiex-cuberto-curtain,
        html.appiex-page-entering #appiex-cuberto-curtain,
        #appiex-cuberto-curtain.is-holding,
        #appiex-cuberto-curtain.is-active,
        #appiex-cuberto-curtain.is-fading {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transition: none !important;
        }
        body.appiex-body-leaving > main,
        body.appiex-body-leaving > section,
        body.appiex-body-leaving > article,
        body.appiex-body-entering > main,
        body.appiex-body-entering > section,
        body.appiex-body-entering > article {
          opacity: 1 !important;
          transform: none !important;
          animation: none !important;
          transition: none !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      const existing = document.getElementById('appiex-cuberto-curtain-style');
      existing.textContent = `
        @view-transition { navigation: auto; }
        ::view-transition-old(root) { animation: none !important; }
        ::view-transition-new(root) { animation: none !important; }
        #appiex-cuberto-curtain,
        html.appiex-page-entering #appiex-cuberto-curtain,
        #appiex-cuberto-curtain.is-holding,
        #appiex-cuberto-curtain.is-active,
        #appiex-cuberto-curtain.is-fading {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          transition: none !important;
        }
      `;
    }
    try { sessionStorage.removeItem('appiex_curtain_active'); } catch(e) {}
    document.documentElement.classList.remove('appiex-page-entering');
    return null;
  }

  // 2. Instant 0.001s Page Reveal (Zero Curtain Blocking)
  function revealArrivingPage() {
    ensureCurtainAndStyles();
    const holdStyle = document.getElementById('curtain-initial-hold');
    if (holdStyle && holdStyle.parentNode) holdStyle.parentNode.removeChild(holdStyle);
    document.documentElement.classList.remove('appiex-page-entering');
    if (document.body) {
      document.body.classList.remove('appiex-body-leaving', 'appiex-body-entering');
    }
    const curtain = document.getElementById('appiex-cuberto-curtain');
    if (curtain) {
      curtain.classList.remove('is-holding', 'is-active', 'is-fading');
      curtain.style.setProperty('display', 'none', 'important');
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
        <a href="/login" class="rafsan-hire-btn" id="mobile-wrap-login-btn">Login</a>
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
        <a href="/" class="cyber-nav-item active" data-section="home">
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

        <a href="/refer" class="cyber-nav-item" data-section="refer">REFER</a>
        <a href="/partners" class="cyber-nav-item" data-section="partners">PARTNERSHIP</a>
        <a href="/projects" class="cyber-nav-item" data-section="projects">PROJECTS</a>
        <a href="/#contact" class="cyber-nav-item" data-section="contact">CONTACT</a>
        <a href="/team" class="cyber-nav-item">ABOUT</a>
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
          <a href="/login">LOGIN</a>
          <a href="/#contact">BOOK A MEETING</a>
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
            try {
              const tUrl = new URL(drawerLink.href, location.href);
              if (tUrl.origin !== location.origin || drawerLink.target === '_blank') {
                window.open(drawerLink.href, drawerLink.target || '_self');
                return;
              }
              navigateInstant(toCleanPath(tUrl.pathname) + tUrl.search + tUrl.hash, true);
            } catch (err) {
              window.location.href = drawerLink.href;
            }
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
  // 4. 0.001s INSTANT MEMORY SPA & PRERENDER NAVIGATION ENGINE
  //    (100% Preserves Every Page's <head> CSS, Tailwind Config,
  //     3D WebGL Shaders, and Scripts with Clean Next.js URLs)
  // ========================================================
  const prefetchedUrls = new Set();
  const htmlMemoryCache = new Map(); // cleanPath -> htmlString
  const pendingFetches = new Map();  // cleanPath -> Promise<string>

  // Ensure Tailwind JIT Runtime is Available Globally for Instant SPA Swaps
  function ensureTailwindRuntime() {
    if (typeof window.tailwind !== 'undefined') return;
    if (document.querySelector('script[src*="cdn.tailwindcss.com"]')) return;
    const twScript = document.createElement('script');
    twScript.src = 'https://cdn.tailwindcss.com';
    twScript.async = true;
    twScript.onload = () => {
      try {
        window.tailwind.config = {
          theme: {
            extend: {
              colors: {
                appiexRed: '#FF2A4D',
                appiexRedDark: '#DC2626',
                appiexDark: '#030408',
                appiexCard: '#080910'
              },
              fontFamily: {
                sans: ['Google Sans', 'Suisse Intl', 'system-ui', 'sans-serif'],
                montserrat: ['Montserrat', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
                anton: ['Anton', 'sans-serif'],
                oswald: ['Oswald', 'sans-serif']
              }
            }
          }
        };
      } catch (e) {}
    };
    document.head.appendChild(twScript);
  }

  // Inject 120FPS / 60FPS GPU Acceleration & Anti-Lag Styles
  function injectGpuStyles() {
    if (document.getElementById('appiex-gpu-style')) return;
    const style = document.createElement('style');
    style.id = 'appiex-gpu-style';
    style.textContent = `
      .shadow-box,
      .bento-card,
      .home-logo-card,
      .appiex-service-card,
      .cyber-nav-item,
      .rafsan-capsule-nav,
      .CtaButton,
      .project-item,
      .project-card-wrapper,
      .feedback-card {
        transform: translate3d(0, 0, 0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
      /* Mobile 120Hz Anti-Lag GPU Optimizations */
      @media (max-width: 1024px) {
        html, body {
          scroll-behavior: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        /* Cap expensive backdrop-filter blur radius on mobile GPUs */
        .backdrop-blur-xl, .backdrop-blur-2xl, .backdrop-blur-3xl {
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  injectGpuStyles();

  // Inject Clean Speculation Rules (Prerender Clean Extensionless Next.js Routes)
  function injectCleanSpeculationRules() {
    if (document.getElementById('appiex-clean-speculation-rules')) return;
    if (!HTMLScriptElement.supports || !HTMLScriptElement.supports('speculationrules')) return;
    try {
      const spec = document.createElement('script');
      spec.type = 'speculationrules';
      spec.id = 'appiex-clean-speculation-rules';
      spec.textContent = JSON.stringify({
        prerender: [
          {
            source: 'list',
            urls: [
              '/',
              '/services',
              '/projects',
              '/refer',
              '/partners',
              '/digital-strategy',
              '/web-development',
              '/ui-ux-3d-design',
              '/ai-automation',
              '/seo-marketing',
              '/blog',
              '/login',
              '/team',
              '/case-studies'
            ],
            eagerness: 'immediate'
          },
          {
            source: 'document',
            where: {
              and: [
                { href_matches: '/*' },
                { not: { href_matches: '/admin*' } },
                { not: { href_matches: '/gaming*' } }
              ]
            },
            eagerness: 'moderate'
          }
        ]
      });
      document.head.appendChild(spec);
    } catch (e) {}
  }

  // Normalize any path to clean extensionless Next.js route
  function toCleanPath(pathname) {
    if (!pathname) return '/';
    let p = pathname.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    if (p === '/home') return '/';
    return p || '/';
  }

  // Strip .html from browser address bar immediately on initial load if present
  try {
    if (location.pathname.endsWith('.html') || location.pathname === '/home') {
      const cleanInitial = toCleanPath(location.pathname) + location.search + location.hash;
      history.replaceState({ path: cleanInitial }, '', cleanInitial);
    }
  } catch (e) {}

  // Disable Lenis on mobile/touch devices immediately if present to eliminate mobile scroll lag
  function optimizeScrollingPerformance() {
    const isTouch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window) || window.innerWidth <= 1024;
    if (isTouch && window.lenis) {
      try {
        window.lenis.destroy();
        window.lenis = null;
        document.documentElement.classList.remove('lenis', 'lenis-smooth');
      } catch (e) {}
    }
    initUniversalLazyVideos();
  }

  let universalVideoObserver = null;
  function initUniversalLazyVideos() {
    try {
      if (!('IntersectionObserver' in window)) return;
      if (universalVideoObserver) {
        universalVideoObserver.disconnect();
      }
      universalVideoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const v = entry.target;
          if (entry.isIntersecting) {
            v.dataset.inView = 'true';
            if (v.preload === 'none') {
              v.preload = 'metadata';
            }
            const p = v.play();
            if (p !== undefined) p.catch(() => {});
          } else {
            v.dataset.inView = 'false';
            try { v.pause(); } catch (e) {}
          }
        });
      }, { rootMargin: '200px 0px', threshold: 0.05 });

      document.querySelectorAll('video').forEach((v) => {
        universalVideoObserver.observe(v);
      });
    } catch (e) {}
  }
  optimizeScrollingPerformance();
  window.addEventListener('DOMContentLoaded', () => {
    optimizeScrollingPerformance();
    ensureTailwindRuntime();
    injectCleanSpeculationRules();
    // Cache current initial page in memory
    try {
      const curClean = toCleanPath(location.pathname);
      if (!htmlMemoryCache.has(curClean)) {
        htmlMemoryCache.set(curClean, document.documentElement.outerHTML);
      }
    } catch (e) {}
  });

  // High-Priority Prefetch & In-Memory HTML Cache Engine
  function prefetch(url) {
    if (!url) return Promise.resolve(null);
    try {
      const u = new URL(url, location.href);
      if (u.origin !== location.origin || u.pathname.includes('/admin') || u.pathname.includes('/gaming')) {
        return Promise.resolve(null);
      }
      const cleanPath = toCleanPath(u.pathname);
      if (htmlMemoryCache.has(cleanPath)) {
        return Promise.resolve(htmlMemoryCache.get(cleanPath));
      }
      if (pendingFetches.has(cleanPath)) {
        return pendingFetches.get(cleanPath);
      }

      if (!prefetchedUrls.has(cleanPath)) {
        prefetchedUrls.add(cleanPath);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = cleanPath;
        link.as = 'document';
        document.head.appendChild(link);
      }

      const fetchPromise = fetch(cleanPath, { priority: 'high', credentials: 'same-origin' })
        .then(res => {
          if (!res.ok) throw new Error('Fetch failed');
          return res.text();
        })
        .then(html => {
          if (html && html.includes('<body')) {
            htmlMemoryCache.set(cleanPath, html);
          }
          pendingFetches.delete(cleanPath);
          return html;
        })
        .catch(() => {
          pendingFetches.delete(cleanPath);
          return null;
        });

      pendingFetches.set(cleanPath, fetchPromise);
      return fetchPromise;
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  // Idle Prefetch Top Pages into Memory Cache
  if (typeof window !== 'undefined') {
    const idlePrefetch = () => {
      ensureTailwindRuntime();
      injectCleanSpeculationRules();
      const topPages = [
        '/',
        '/services',
        '/projects',
        '/refer',
        '/partners',
        '/digital-strategy',
        '/web-development',
        '/ui-ux-3d-design',
        '/ai-automation',
        '/seo-marketing',
        '/blog',
        '/login',
        '/team',
        '/case-studies'
      ];
      topPages.forEach((p, idx) => {
        setTimeout(() => prefetch(p), idx * 55);
      });
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(idlePrefetch, { timeout: 600 });
    } else {
      setTimeout(idlePrefetch, 250);
    }
  }

  // Hover, Pointerdown & Touch Prefetch Triggers
  const onHoverOrDown = (e) => {
    const a = e.target.closest('a');
    if (a && a.href && a.origin === location.origin) {
      prefetch(a.href);
    }
  };
  document.addEventListener('mouseover', onHoverOrDown, { passive: true });
  document.addEventListener('pointerdown', onHoverOrDown, { passive: true });
  document.addEventListener('touchstart', onHoverOrDown, { passive: true });

  // ========================================================
  // 5. 0.001s FULL-DOCUMENT (<head> + <body>) INSTANT SWAP
  // ========================================================
  let isNavigating = false;

  // Tag initial page-specific <head> styles so they can be cleanly swapped
  function markInitialHeadStyles() {
    document.head.querySelectorAll('style').forEach(s => {
      if (
        s.id === 'appiex-universal-mobile-css' ||
        s.id === 'appiex-gpu-style' ||
        s.id === 'appiex-cuberto-curtain-style' ||
        (s.textContent && s.textContent.includes('tailwindcss'))
      ) {
        return;
      }
      if (!s.hasAttribute('data-spa-page-style')) {
        s.setAttribute('data-spa-page-style', 'true');
      }
    });
  }
  markInitialHeadStyles();

  function swapPageFromHtml(htmlString, targetUrlStr, pushHistory = true) {
    try {
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(htmlString, 'text/html');
      if (!newDoc || !newDoc.body) return false;

      // 1. Cleanup current page resources (videos, Lenis, ScrollTrigger)
      document.querySelectorAll('video').forEach(v => {
        try { v.pause(); } catch (e) {}
      });
      if (window.lenis) {
        try { window.lenis.destroy(); } catch (e) {}
        window.lenis = null;
      }
      if (typeof ScrollTrigger !== 'undefined') {
        try { ScrollTrigger.getAll().forEach(t => t.kill()); } catch (e) {}
      }

      // 2. Update Document Title & Canonical
      if (newDoc.title) {
        document.title = newDoc.title;
      }

      // 3. Sync <head> Stylesheets (<link rel="stylesheet">)
      const existingLinks = new Set(
        Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href'))
      );
      newDoc.head.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !existingLinks.has(href)) {
          const clonedLink = link.cloneNode(true);
          document.head.appendChild(clonedLink);
        }
      });

      // 4. Sync <head> Page-Specific <style> Blocks (100% Preserves Exact Page Design)
      markInitialHeadStyles();
      const oldPageStyles = Array.from(document.head.querySelectorAll('style[data-spa-page-style="true"]'));
      newDoc.head.querySelectorAll('style').forEach(styleEl => {
        if (styleEl.id === 'appiex-cuberto-curtain-style' || styleEl.id === 'appiex-universal-mobile-css' || styleEl.id === 'appiex-gpu-style') {
          return;
        }
        const newStyle = document.createElement('style');
        if (styleEl.id) newStyle.id = styleEl.id;
        newStyle.setAttribute('data-spa-page-style', 'true');
        newStyle.textContent = styleEl.textContent;
        document.head.appendChild(newStyle);
      });
      oldPageStyles.forEach(s => {
        if (s.parentNode) s.parentNode.removeChild(s);
      });

      // 5. Execute any <head> pre-hydration scripts (like refer.html CMS hydration)
      newDoc.head.querySelectorAll('script:not([src]):not([type="application/ld+json"]):not([type="speculationrules"])').forEach(scr => {
        if (scr.id === 'appiex-prepaint-curtain-script') return;
        if (scr.textContent && scr.textContent.includes('tailwind.config')) {
          try { (0, eval)(scr.textContent); } catch (e) {}
        }
      });

      // 6. Swap <body> Class & InnerHTML in 0.001s
      document.body.className = newDoc.body.className || 'font-sans antialiased';
      document.body.classList.remove('menu-open', 'appiex-body-leaving', 'appiex-body-entering');
      document.body.innerHTML = newDoc.body.innerHTML;

      // Hide any legacy curtain inside swapped body
      const swappedCurtain = document.getElementById('appiex-cuberto-curtain');
      if (swappedCurtain) {
        swappedCurtain.style.setProperty('display', 'none', 'important');
      }

      // 7. Update Browser URL & Scroll Position Instantly (0ms)
      const parsedTarget = new URL(targetUrlStr, location.origin);
      const cleanHref = toCleanPath(parsedTarget.pathname) + parsedTarget.search + parsedTarget.hash;
      if (pushHistory) {
        history.pushState({ path: cleanHref }, '', cleanHref);
      }

      if (parsedTarget.hash) {
        const hashEl = document.querySelector(parsedTarget.hash);
        if (hashEl) hashEl.scrollIntoView();
        else window.scrollTo(0, 0);
      } else {
        window.scrollTo(0, 0);
      }

      // 8. Re-initialize Universal Mobile Navigation & Re-Execute Body Inline Scripts
      ensureMobileNavigation();

      const bodyScripts = Array.from(document.body.querySelectorAll('script'));
      const externalPromises = [];

      bodyScripts.forEach(oldScript => {
        const src = oldScript.getAttribute('src');
        if (src) {
          // Skip already loaded global libraries to avoid re-downloading
          if (
            src.includes('instant-nav.js') ||
            src.includes('gsap.min.js') ||
            src.includes('ScrollTrigger.min.js') ||
            src.includes('lenis.min.js') ||
            src.includes('visitor-tracker.js') ||
            src.includes('seo-conversion-tracker.js')
          ) {
            return;
          }
          // Load page-specific external script (e.g. swiper, firebase-config, video-storage-engine) if not already loaded
          const cleanSrc = src.replace(/^\.\//, '/');
          const alreadyLoaded = Array.from(document.scripts).some(s => s !== oldScript && s.src && s.src.includes(cleanSrc.split('?')[0]));
          if (!alreadyLoaded) {
            const p = new Promise(resolve => {
              const s = document.createElement('script');
              s.src = src;
              s.onload = resolve;
              s.onerror = resolve;
              document.body.appendChild(s);
            });
            externalPromises.push(p);
          }
        }
      });

      const runInlineScripts = () => {
        bodyScripts.forEach(oldScript => {
          if (oldScript.getAttribute('src')) return;
          const type = oldScript.getAttribute('type');
          if (type && type !== 'text/javascript' && type !== 'module') return;
          const code = oldScript.textContent;
          if (!code || !code.trim()) return;

          try {
            // Transform DOMContentLoaded listeners inside inline scripts so they run immediately on SPA swap
            const transformedCode = code.replace(
              /document\.addEventListener\s*\(\s*['"]DOMContentLoaded['"]\s*,\s*/g,
              '(function(fn){ try { fn(); } catch(e){ console.warn(e); } })('
            );
            const newScript = document.createElement('script');
            newScript.textContent = transformedCode;
            oldScript.parentNode.replaceChild(newScript, oldScript);
          } catch (err) {
            console.warn('SPA script exec warning:', err);
          }
        });

        optimizeScrollingPerformance();
        if (typeof ScrollTrigger !== 'undefined') {
          setTimeout(() => {
            try { ScrollTrigger.refresh(); } catch (e) {}
          }, 60);
        }
      };

      if (externalPromises.length > 0) {
        Promise.all(externalPromises).then(runInlineScripts);
      } else {
        runInlineScripts();
      }

      return true;
    } catch (err) {
      console.warn('SPA swap fallback:', err);
      return false;
    }
  }

  // Navigate to URL in 0.001s (Uses Memory Cache if ready, otherwise Native Instant Navigation)
  function navigateInstant(rawHref, pushHistory = true) {
    if (isNavigating) return;
    try {
      const targetUrl = new URL(rawHref, location.href);
      const normTarget = toCleanPath(targetUrl.pathname);
      const cleanTargetHref = normTarget + targetUrl.search + targetUrl.hash;

      // Close mobile drawer if open
      const curDrawer = document.getElementById('rafsan-mobile-drawer');
      if (curDrawer && curDrawer.classList.contains('open')) {
        curDrawer.classList.remove('open');
        document.body.classList.remove('menu-open');
      }

      // Exclude 3D gaming / admin pages from SPA swap so their full WebGL canvas boots natively
      if (normTarget === '/gaming' || normTarget.startsWith('/admin')) {
        window.location.href = cleanTargetHref;
        return;
      }

      const cachedHtml = htmlMemoryCache.get(normTarget);
      if (cachedHtml) {
        isNavigating = true;
        const ok = swapPageFromHtml(cachedHtml, cleanTargetHref, pushHistory);
        isNavigating = false;
        if (ok) return;
      }

      // If fetch is currently in flight, wait up to 80ms; otherwise navigate immediately with zero curtain delay
      if (pendingFetches.has(normTarget)) {
        isNavigating = true;
        pendingFetches.get(normTarget).then(html => {
          if (html) {
            const ok = swapPageFromHtml(html, cleanTargetHref, pushHistory);
            isNavigating = false;
            if (ok) return;
          }
          isNavigating = false;
          window.location.href = cleanTargetHref;
        });
        return;
      }

      // Direct 0ms native navigation (often served in 0.001s by Chromium Speculation Rules prerender!)
      window.location.href = cleanTargetHref;
    } catch (e) {
      window.location.href = rawHref;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest('a');
    if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;

    const href = a.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('https://wa.me') || href === '#') return;

    try {
      const targetUrl = new URL(a.href, location.href);
      if (targetUrl.origin !== location.origin) return;

      const normCurrent = toCleanPath(location.pathname);
      const normTarget = toCleanPath(targetUrl.pathname);

      // Same-page hash scroll
      if (normCurrent === normTarget && targetUrl.hash) {
        const targetEl = document.querySelector(targetUrl.hash);
        if (targetEl) {
          e.preventDefault();
          if (window.lenis) {
            window.lenis.scrollTo(targetEl, { offset: -60, duration: 0.65 });
          } else {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
          history.pushState({ path: normCurrent + targetUrl.hash }, '', normCurrent + targetUrl.hash);
        }
        return;
      }

      if (normCurrent === normTarget && !targetUrl.hash && targetUrl.search === location.search) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Cross-page navigation in 0.001s
      e.preventDefault();
      const cleanTargetHref = normTarget + targetUrl.search + targetUrl.hash;
      navigateInstant(cleanTargetHref, true);

    } catch (err) {}
  });

  // Handle Browser Back / Forward Buttons in 0.001s
  window.addEventListener('popstate', () => {
    const cleanTarget = toCleanPath(location.pathname) + location.search + location.hash;
    const normTarget = toCleanPath(location.pathname);
    if (htmlMemoryCache.has(normTarget)) {
      swapPageFromHtml(htmlMemoryCache.get(normTarget), cleanTarget, false);
    } else {
      window.location.reload();
    }
  });

  // 6. Back / Forward Cache (bfcache) Restore Cleanup
  window.addEventListener('pageshow', () => {
    isNavigating = false;
    revealArrivingPage();
  });
})();

  document.addEventListener('click', function(e) {
    const btn = e.target.closest('#rafsan-mobile-services-toggle');
    if (btn) {
      window.__toggleMobileServices(e);
    }
  }, true);

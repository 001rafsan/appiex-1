import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="rafsan-navbar-shell" id="rafsan-navbar">
      <div className="rafsan-nav-container">
        
        {/* 1. Brand Logo */}
        <Link to="/" className="rafsan-brand" aria-label="Appiex">
          <img src="/images/appiex-logo.png" alt="APPIEX" className="brand-logo-img" />
          <span className="rafsan-brand-bold">Appiex</span>
        </Link>

        {/* 2. Floating Capsule Navbar */}
        <nav className="rafsan-capsule-nav" aria-label="Main Navigation">
          <Link to="/" className={`rafsan-nav-item ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>

          {/* Services with Caret & 6-Option Popup */}
          <div
            className={`services-nav-wrap ${servicesOpen ? 'is-open' : ''}`}
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <Link
              to="/services"
              className={`rafsan-nav-item ${isActive('/services') ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              Services
              <span className="services-caret" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </span>
            </Link>

            {/* Mega Menu Popup (Pic 1 Design) */}
            <div className="services-popup-menu" role="menu">
              {/* Left Banner Area (Pic 1) */}
              <div className="services-mega-left">
                <div>
                  <span className="services-mega-badge">EXCLUSIVE</span>
                  <h4 className="services-mega-title">EXPLORE OUR SERVICES CURATIONS</h4>
                </div>
                <Link to="/services" className="services-mega-btn">SEE OVERVIEW</Link>
              </div>
              {/* Right Categories Area (Pic 1) */}
              <div className="services-mega-right">
                <span className="services-mega-subtitle">HONEY VARIETIES</span>
                <div className="services-mega-grid">
                  <Link to="/services#strategy" className="services-mega-item active">DIGITAL STRATEGY</Link>
                  <Link to="/services#web-dev" className="services-mega-item">WEB DEVELOPMENT (FULL -STACK)</Link>
                  <Link to="/services#design" className="services-mega-item">UI/UX &amp; 3D DESIGN</Link>
                  <Link to="/services#ai" className="services-mega-item">AI AUTOMATION</Link>
                  <Link to="/services#branding" className="services-mega-item">BRANDING &amp; CREATIVE</Link>
                  <Link to="/services#seo" className="services-mega-item">SEO &amp; MARKETIN</Link>
                </div>
              </div>
            </div>
          </div>

          <Link to="/refer" className={`rafsan-nav-item ${isActive('/refer') ? 'active' : ''}`}>
            Refer
          </Link>
          <Link to="/case-studies" className={`rafsan-nav-item ${isActive('/case-studies') ? 'active' : ''}`}>
            Case Studies
          </Link>
          <Link to="/projects" className={`rafsan-nav-item ${isActive('/projects') ? 'active' : ''}`}>
            Projects
          </Link>
          <a href="/#contact" className="rafsan-nav-item">
            Contact
          </a>
        </nav>

        {/* 3. Action Buttons */}
        <div className="rafsan-nav-actions">
          <a href="https://github.com/monacogo001-ops" target="_blank" rel="noopener noreferrer" className="rafsan-github-btn" aria-label="GitHub Profile">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
            </svg>
          </a>
          <a href="/resume.html" target="_blank" rel="noopener noreferrer" className="rafsan-resume-btn">
            Resume
          </a>
          <a href="/#contact" className="rafsan-hire-btn">
            Hire Us
          </a>
        </div>

        {/* 4. Mobile Hamburger */}
        <div className="rafsan-mobile-wrap">
          <a href="/#contact" className="rafsan-hire-btn" style={{ padding: '5px 14px', fontSize: 11 }}>
            Hire Us
          </a>
          <button
            type="button"
            className="rafsan-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 24, height: 24 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

      </div>

      {/* 5. Mobile Drawer Menu */}
      <div className={`rafsan-mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Link to="/" className="rafsan-mobile-link" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/services" className="rafsan-mobile-link" onClick={() => setMobileOpen(false)}>Services</Link>
          <Link to="/refer" className="rafsan-mobile-link" onClick={() => setMobileOpen(false)}>Refer</Link>
          <Link to="/case-studies" className="rafsan-mobile-link" onClick={() => setMobileOpen(false)}>Case Studies</Link>
          <Link to="/projects" className="rafsan-mobile-link" onClick={() => setMobileOpen(false)}>Projects</Link>
          <a href="/#contact" className="rafsan-mobile-link" onClick={() => setMobileOpen(false)}>Contact</a>
          <div className="rafsan-mobile-drawer-actions">
            <a href="https://github.com/monacogo001-ops" target="_blank" rel="noopener noreferrer" className="rafsan-resume-btn" style={{ flex: 1, textAlign: 'center' }}>
              GitHub
            </a>
            <a href="/resume.html" target="_blank" className="rafsan-resume-btn" style={{ flex: 1, textAlign: 'center' }}>
              Resume
            </a>
            <a href="/#contact" className="rafsan-hire-btn" style={{ flex: 1, textAlign: 'center' }}>
              Hire Us
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

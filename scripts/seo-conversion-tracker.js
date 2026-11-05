/**
 * Appiex SEO & Lead Conversion Analytics Tracker (GA4 / GTM DataLayer)
 * Tracks engagement and WhatsApp handoff without collecting personal data.
 * Events: form_start, form_submit, contact_form_prepared,
 * click_email, click_whatsapp, contact_cta_click, view_case_study.
 * generate_lead requires a confirmed server-side/CRM receipt and is
 * intentionally not emitted from this client-only WhatsApp flow.
 */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];
  
  // Google Analytics 4 - Appiex
  var ga4Id = 'G-DF198MPZGT';

  var excludedPage =
    /^\/(?:admin|login|profile|gaming|collections|resume|rafsan_page|scratch_cuberto_live)(?:\/|\.html$|$)/i
      .test(window.location.pathname);

  // Homepage already initializes GA4.
  if (!excludedPage && typeof window.gtag !== 'function') {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', ga4Id);

    var ga4Script = document.createElement('script');
    ga4Script.async = true;
    ga4Script.src =
      'https://www.googletagmanager.com/gtag/js?id=' + ga4Id;

    document.head.appendChild(ga4Script);
  }

  

  function trackConversionEvent(eventName, params) {
    var safeParams = Object.assign(
      {
        page_path: window.location.pathname || '/',
        page_title: document.title || 'Appiex'
      },
      params || {}
    );

    
try {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, safeParams);
  } else {
    window.dataLayer.push(
      Object.assign({ event: eventName }, safeParams)
    );
  }
} catch (e) {
  // Do not interrupt the website if tracking fails.
}
  }

  function initConversionTracking() {
    var startedForms = new WeakSet();

    // 1. form_start (fires once per form when user focuses an input/textarea/select)
    document.addEventListener(
      'focusin',
      function (e) {
        var target = e.target;
        if (!target || !target.form) return;
        var form = target.form;
        if (!startedForms.has(form)) {
          startedForms.add(form);
          trackConversionEvent('form_start', {
            form_id: form.id || form.getAttribute('name') || 'project_inquiry_form'
          });
        }
      },
      { passive: true }
    );

    // 2. Form submission is an attempt, not a confirmed lead.
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form || form.tagName !== 'FORM') return;
      var id = form.id || form.getAttribute('name') || 'project_inquiry_form';
      if (/login|search|filter/i.test(id + ' ' + (form.action || ''))) return;
      trackConversionEvent('form_submit', { form_id: id });
    }, { passive: true });

    window.addEventListener('appiex:contact_prepared', function () {
      trackConversionEvent('contact_form_prepared', { channel: 'whatsapp' });
    });
    window.addEventListener('appiex:whatsapp_handoff', function () {
      trackConversionEvent('click_whatsapp', { cta_location: '/#contact', interaction_type: 'window_open' });
    });

    // 3. Delegated click tracking for email, WhatsApp, consultation CTAs, and case studies
    document.addEventListener(
      'click',
      function (e) {
        var link = e.target && e.target.closest ? e.target.closest('a, button') : null;
        if (!link) return;

        var href = (link.getAttribute('href') || '').trim();
        var text = (link.textContent || '').trim().slice(0, 60);
        var id = link.id || '';

        // click_email
     
if (href.indexOf('mailto:') === 0) {
  trackConversionEvent('click_email', {
    link_type: 'email',
    cta_text: text || 'Email Link'
  });
  return;
}

        // click_whatsapp
        if (
          href.indexOf('wa.me') !== -1 ||
          href.indexOf('whatsapp.com') !== -1 ||
          id.indexOf('whatsapp') !== -1 ||
          link.hasAttribute('data-whatsapp')
        ) {
          trackConversionEvent('click_whatsapp', {
            cta_location: window.location.pathname || '/',
            cta_text: text || 'WhatsApp Chat'
          });
          return;
        }

        // view_case_study
        if (
          href.indexOf('case-studies') !== -1 ||
          href.indexOf('/projects') !== -1 ||
          href.indexOf('projects.html') !== -1 ||
          /case study|live project demo|view work/i.test(text)
        ) {
          trackConversionEvent('view_case_study', {
            destination_url: href || 'projects',
            cta_text: text || 'View Case Study'
          });
          return;
        }

        // CTA click indicates interest, not a confirmed consultation
        if (
          href.indexOf('#contact') !== -1 ||
          href.indexOf('/contact') !== -1 ||
          /book|consult|start a project|discuss|get a quote|strategy call|inquire/i.test(text)
        ) {
          trackConversionEvent('contact_cta_click', {
            destination_url: href || '#contact',
            cta_text: text || 'Book Consultation'
          });
        }
      },
      { passive: true }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConversionTracking);
  } else {
    initConversionTracking();
  }
})();

// Shared Appiex HTML enhancements: deterministic, server-rendered and testable.
const BLOG_HUBS = new Set([
  'blog/ai-automation', 'blog/web-development', 'blog/seo-marketing',
  'blog/digital-strategy', 'blog/ui-ux-3d-design',
  'blog/gaming-3d-worlds', 'blog/view'
]);

function appendBodyClass(html, className) {
  return html.replace(/<body\b([^>]*)>/i, (tag, attrs) => {
    if (tag.includes(className)) return tag;
    if (/\bclass\s*=/i.test(attrs)) {
      return tag.replace(/\bclass\s*=\s*(["'])(.*?)\1/i, (_match, quote, classes) =>
        'class=' + quote + classes + ' ' + className + quote);
    }
    return '<body class="' + className + '"' + attrs + '>';
  });
}

function stripMarkup(value) {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function escapeText(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function improveHtml(html, slug) {
  const route = slug.join('/').replace(/\.html$/i, '');
  const isHomepage = route === '' || route === 'index';
  const isBlog = route === 'blog' || route.startsWith('blog/');
  if (!isHomepage && !isBlog) return html;
  // Source-level buyer-guide redesign: these pages are already complete,
  // and must not be rewrapped in the old three-column presentation.
  if (/\bappiex-blog-v2\b/.test(html.match(/<body\b[^>]*>/i)?.[0] || '')) return html;

  // This shared stylesheet is copied into public/styles by sync-nextjs-public.mjs.
  if (!html.includes('appiex-editorial-polish.css')) {
    html = html.replace(/<\/head>/i,
      '  <link rel="stylesheet" href="/styles/appiex-editorial-polish.css?v=20261106">\n</head>');
  }

  if (isHomepage) {
    html = appendBodyClass(html, 'appiex-home-polished');
    // Remove duplicate heading and unsupported rating language while retaining real project content.
    html = html.replace('★ 4.9 / 5.0 VERIFIED RATING', 'PROJECT STORIES &amp; CLIENT FEEDBACK');
    html = html.replace('50+ GLOBAL SHIPMENTS', 'SELECTED DELIVERY EXAMPLES');
    html = html.replace('50+ Global Shipments', 'Selected Delivery Examples');
    html = html.replace('Dhaka &amp; Global Benchmark 2026', 'Delivery Model Overview');
    html = html.replace('Explore Dedicated Solutions &amp; Pricing Guides',
      'Web Development, AI Automation &amp; Cost Guides');
    const secondFaqStart = html.indexOf('<section id="faq-knowledge-hub"');
    if (secondFaqStart >= 0) {
      html = html.slice(0, secondFaqStart) + html.slice(secondFaqStart)
        .replace('Frequently Asked Questions', 'More About Working With Appiex');
    }
    return html;
  }

  const isArticle = route.startsWith('blog/') &&
    !BLOG_HUBS.has(route) && !route.endsWith('/index');
  if (!isArticle) return appendBodyClass(html, 'appiex-blog-hub');

  const legacy = /id="cms-article-body"/i.test(html);
  html = appendBodyClass(html, 'appiex-editorial-page ' +
    (legacy ? 'appiex-legacy-article' : 'appiex-modern-article'));

  // Legacy generated layouts reused the same unrelated visible H1 on many
  // URLs. Align the single visible heading with each page's existing title.
  if (legacy) {
    const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1]
        .replace(/\s*\|\s*Appiex(?: Engineering Blog| Blog)?\s*$/i, '').trim();
      if (title) {
        html = html.replace(/(<h1\b[^>]*\bid="cms-article-h1"[^>]*>)[\s\S]*?(<\/h1>)/i,
          (_match, opening, closing) => opening + title + closing);
      }
    }
  } else if (/<article(?:\s|>)/i.test(html) && !/appiex-article-toc/.test(html)) {
    const sections = [...html.matchAll(/<section\b[^>]*\bid="([a-zA-Z0-9_-]+)"[^>]*>[\s\S]{0,500}?<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
      .map(match => ({ id: match[1], title: stripMarkup(match[2]) }))
      .filter(section => section.title.length > 3 && section.title.length < 110)
      .slice(0, 12);
    if (sections.length >= 3) {
      const links = sections.map(section =>
        '<a href="#' + section.id + '">' + escapeText(section.title) + '</a>').join('');
      const toc = '<details class="appiex-article-toc"><summary>On this page · Jump to a section</summary>' +
        '<nav aria-label="Article table of contents">' + links + '</nav></details>';
      // The same TOC is available as a compact mobile disclosure and as a
      // desktop sticky navigation, with a restrained service CTA on the right.
      const articleEndsBeforeMain = /<\/article>\s*<\/main>/i.test(html);
      if (articleEndsBeforeMain) {
        const left = '<aside class="appiex-modern-side appiex-modern-side-left" aria-label="Article navigation">' +
          '<div class="appiex-modern-side-inner"><strong>IN THIS GUIDE</strong><nav aria-label="Sections">' +
          links + '</nav></div></aside>';
        const right = '<aside class="appiex-modern-side appiex-modern-side-right">' +
          '<div class="appiex-modern-side-inner"><span>BUILD WITH APPIEX</span>' +
          '<h2>Turn ideas into a better product.</h2>' +
          '<p>Need help planning a website, software product, or AI workflow?</p>' +
          '<a href="/#contact">Discuss your project →</a></div></aside>';
        html = html.replace(/<article(?:\s|>)/i,
          match => toc + '\n<div class="appiex-modern-grid">' + left + match);
        html = html.replace(/<\/article>(?=\s*<\/main>)/i,
          '</article>' + right + '</div>');
      } else {
        html = html.replace(/<article(?:\s|>)/i, match => toc + '\n' + match);
      }
    }
  }

  // The meter is present in the HTML but performs no tracking or requests.
  if (!html.includes('class="appiex-reading-meter"')) {
    html = html.replace(/<body\b[^>]*>/i, match => match +
      '\n<div class="appiex-reading-meter" aria-hidden="true"><span></span></div>');
  }
  if (!html.includes('appiex-reading-progress.js')) {
    html = html.replace(/<\/body>/i,
      '  <script src="/scripts/appiex-reading-progress.js" defer></script>\n</body>');
  }
  return html;
}


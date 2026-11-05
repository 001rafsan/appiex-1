import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const blogDir = path.join(root, 'blog');
const prioritySlugs = new Set([
  'how-much-does-a-custom-website-cost-in-2026',
  'ai-automation-for-small-businesses',
  'custom-software-vs-saas-which-is-better',
  'shopify-vs-custom-ecommerce-development',
  'technical-seo-checklist-for-business-websites',
  'how-to-choose-a-software-development-agency',
  'how-to-automate-customer-support-with-ai',
  'complete-guide-to-custom-software-development',
  'website-development-cost-bangladesh',
  'how-much-does-ai-automation-cost',
  'how-long-does-it-take-to-build-a-saas-product',
  'website-redesign-process',
  'ai-agents-vs-n8n-automation-for-business'
]);

const authorByUrl = {
  'https://appiex.com/authors/adil-alim': 'Adil Alim',
  'https://appiex.com/authors/md-rafsan': 'Md. Rafsan',
  'https://appiex.com/authors/tanvir-rahman': 'Tanvir Rahman'
};

const authorBio = {
  'Adil Alim': 'Founder and solutions architect covering software architecture, web engineering and product delivery.',
  'Md. Rafsan': 'AI automation and workflow engineering lead covering integrations, approvals, reliability and operating risk.',
  'Tanvir Rahman': 'Technical SEO and conversion research lead covering crawlability, structured data and measurement.'
};

const priorityDescriptions = {
  'how-much-does-a-custom-website-cost-in-2026': 'A practical 2026 website cost guide covering scope, architecture, content, integrations, delivery risk and the questions buyers should ask before requesting a quote.',
  'ai-automation-for-small-businesses': 'A practical guide to choosing small-business AI automations, mapping workflows, keeping human approvals and measuring operating value without inflated promises.',
  'custom-software-vs-saas-which-is-better': 'Compare custom software and SaaS by ownership, implementation time, integration limits, security responsibilities and long-term operating cost.',
  'shopify-vs-custom-ecommerce-development': 'A buyer-focused comparison of Shopify and custom commerce across launch speed, extensibility, operations, checkout constraints and total cost.',
  'technical-seo-checklist-for-business-websites': 'Check indexing, canonical URLs, sitemap validity, JavaScript rendering, internal links and Core Web Vitals with a practical technical SEO checklist for 2026.',
  'how-to-choose-a-software-development-agency': 'A due-diligence framework for evaluating a software agency, validating evidence, defining ownership and comparing proposals on equal terms.',
  'how-to-automate-customer-support-with-ai': 'Plan AI customer-support automation with source grounding, escalation rules, privacy controls, quality review and measurable service targets.',
  'complete-guide-to-custom-software-development': 'A practical guide to custom software discovery, architecture, delivery, testing, ownership, maintenance and supplier evaluation.',
  'how-much-does-ai-automation-cost': 'Plan setup, API usage, hosting, integration and human review costs using a worked AI automation budget example.',
  'how-long-does-it-take-to-build-a-saas-product': 'A practical SaaS MVP timeline with discovery, permissions, billing integration, testing and launch milestones.',
  'website-redesign-process': 'Plan an SEO-safe redesign with a page inventory, permanent redirects, mobile testing, analytics and post-launch checks.',
  'website-development-cost-bangladesh': 'Compare indicative website development costs in Bangladesh and prepare a clear project quotation.',
  'ai-agents-vs-n8n-automation-for-business': 'Compare AI agents, n8n workflows and hybrid automation for CRM, leads and customer support, including costs and controls.'
};

const excluded = new Set([
  'view.html', 'ai-automation.html', 'digital-strategy.html', 'seo-marketing.html',
  'ui-ux-3d-design.html', 'web-development.html', 'gaming-3d-worlds.html'
]);

const files = fs.readdirSync(blogDir)
  .filter((name) => name.endsWith('.html') && !excluded.has(name));

let indexed = 0;
let held = 0;

for (const name of files) {
  const slug = name.slice(0, -5);
  const file = path.join(blogDir, name);
  let html = fs.readFileSync(file, 'utf8');
  const shouldIndex = prioritySlugs.has(slug);

  if (slug === 'ai-automation-for-small-businesses') {
    html = html.replaceAll('AI Automation for Small Businesses: High-ROI Workflows That Save 20+ Hours/Week', 'AI Automation for Small Businesses: A Practical Workflow Guide');
  }

  html = html.replace(
    /<meta name="robots" content="[^"]*">/i,
    `<meta name="robots" content="${shouldIndex ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' : 'noindex, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}">`
  );

  if (shouldIndex) {
    const description = priorityDescriptions[slug];
    html = html.replace(/<meta name="description" id="cms-meta-desc" content="[^"]*">/i, `<meta name="description" id="cms-meta-desc" content="${description}">`);
    html = html.replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${description}">`);
    html = html.replace(/<meta name="twitter:description" content="[^"]*">/i, `<meta name="twitter:description" content="${description}">`);
    html = html.replace(/("@type":"BlogPosting"[\s\S]*?"description":)"[^"]*"/, `$1${JSON.stringify(description)}`);
    html = html.replace(/(<p id="cms-article-brief"[^>]*>)[\s\S]*?(<\/p>)/, `$1\n                ${description}\n              $2`);
    html = html.replace(/âœ“ People-First â€¢ Verified Production Data|✓ People-First • Verified Production Data/g, 'People-First • Reviewed Planning Guidance');
  }

  html = html.replace(/<meta property="article:author" content="[^"]*">/i, (tag) => {
    const urlMatch = html.match(/"author"\s*:\s*\{[\s\S]*?"url"\s*:\s*"(https:\/\/appiex\.com\/authors\/[^"]+)"/);
    const author = urlMatch ? authorByUrl[urlMatch[1]] : null;
    return author ? `<meta property="article:author" content="${author}">` : tag;
  });

  html = html.replace(
    /"(author|reviewedBy)":\{"@type":"Person","name":\s*"Appiex Team",([\s\S]*?)"url":"(https:\/\/appiex\.com\/authors\/[^"]+)"\}/g,
    (full, field, middle, url) => `"${field}":{"@type":"Person","name":"${authorByUrl[url] || 'Appiex Editorial Team'}",${middle}"url":"${url}"}`
  );

  html = html
    .replace(/At <strong>Appiex<\/strong>, we have audited and engineered dozens of production systems across [^.]+\./g, 'This guide separates planning assumptions from facts that should be validated against your own scope, users and operating constraints.')
    .replace(/we follow a battle-tested 4-phase engineering sprint so there are zero surprises between discovery and launch:/g, 'we use a four-phase planning framework that is adjusted after discovery:')
    .replace(/Every commit is benchmarked against Lighthouse and WebPageTest mobile profiles\./g, 'Performance is checked during delivery with repeatable lab tests and, after launch, real-user field data where available.')
    .replace(/<strong>[^<]*1\.6s LCP \/[^<]*95ms INP \(Verified Good\)<\/strong>/g, '<strong>Targets defined per project; verify with field data</strong>')
    .replace(/Across dozens of technical audits, we repeatedly see four preventable mistakes that drain budgets and stall organic growth:/g, 'Four common implementation risks are worth checking before launch:')
    .replace(/Heavy unoptimized animations that tank mobile LCP above 4 seconds cost up to 50% of mobile conversions\./g, 'Heavy, unoptimized animation can delay meaningful content and make mobile interactions harder to use.')
    .replace(/Yes\. Unlike proprietary SaaS builders that lock you into monthly tiers, Appiex delivers 100% intellectual property and repository ownership upon project completion\./g, 'Ownership depends on the written contract. Appiex proposals identify repository access, third-party licences, handover materials and any continuing service fees before work begins.')
    .replace(/Deep-dive engineering guide, 2026 cost &amp; architecture benchmarks, Core Web Vitals checklist, and real project insights by Appiex\./g, 'Practical implementation guidance with transparent assumptions and review criteria by Appiex.');

  if (shouldIndex) {
    const urlMatch = html.match(/"author"\s*:\s*\{[\s\S]*?"url"\s*:\s*"(https:\/\/appiex\.com\/authors\/[^"]+)"/);
    const authorUrl = urlMatch?.[1];
    const authorName = authorByUrl[authorUrl] || 'Appiex Editorial Team';
    html = html.replace(/<img src="\/images\/appiex-logo\.png" alt="Appiex Team"([^>]*)>/, `<img src="/images/appiex-logo.png" alt="${authorName}"$1>`);
    html = html.replace(/<div style="font-size: 19px; font-weight: 800; color: #fff; margin-top: 3px;">By Team â€” Appiex Engineering &amp; Digital Strategy Team<\/div>/, `<div style="font-size: 19px; font-weight: 800; color: #fff; margin-top: 3px;"><a href="${authorUrl}" style="color:#fff;">${authorName}</a> â€” Appiex</div>`);
    html = html.replace(/Leading full-stack web engineering, 3D WebGL interactive systems, and autonomous AI workflow deployments for high-growth startups and enterprises worldwide\./, authorBio[authorName] || 'Responsible for technical review and editorial accuracy.');
  }

  html = html.replace(
    /\s*<!-- APPIEX FIRST-HAND ENGINEERING INSIGHT -->[\s\S]*?<!-- Main Article Content Sections -->/,
    `\n            <!-- Editorial note -->\n            <aside style="margin-bottom:3.2rem;padding:1.8rem 2rem;border-radius:1.4rem;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.25);color:#cbd5e1;line-height:1.65;">\n              <strong style="color:#34d399;">Editorial standard:</strong> Pricing, timelines and performance figures in this guide are planning ranges, not guarantees. Validate them against your scope, analytics and written proposal before making a purchase decision.\n              <a href="/editorial-policy.html" style="color:#fff;">Read our editorial and corrections policy.</a>\n            </aside>\n\n            <!-- Main Article Content Sections -->`
  );

  html = html.replace(
    /<h2 id="real-project-evidence">[\s\S]*?<h2 id="common-pitfalls-to-avoid">/,
    `<h2 id="real-project-evidence">5. How to Validate Evidence Before You Buy</h2>\n<p>Ask every shortlisted provider for evidence that can be checked: a live URL or private walkthrough, the exact scope delivered, the measurement window, the data source, and permission to attribute the result. A screenshot without a date, baseline, methodology, or client context is not enough to support a performance claim.</p>\n<ul>\n<li><strong>Performance:</strong> compare the same URL, device class, network profile and reporting window.</li>\n<li><strong>SEO:</strong> separate branded from non-branded queries and report qualified leads, not only impressions.</li>\n<li><strong>Automation:</strong> document the previous manual process, exception rate, human approvals and operating cost.</li>\n<li><strong>Commercial results:</strong> identify other changes made during the period before attributing an outcome to one intervention.</li>\n</ul>\n<p>Appiex publishes client names, quotations and numeric outcomes only when supporting evidence and publication permission are available. Otherwise, examples are explicitly presented as planning scenarios.</p>\n\n<h2 id="common-pitfalls-to-avoid">`
  );

  fs.writeFileSync(file, html, 'utf8');
  if (shouldIndex) indexed += 1; else held += 1;
}

for (const authorFile of fs.readdirSync(path.join(root, 'authors')).filter((n) => n.endsWith('.html'))) {
  const file = path.join(root, 'authors', authorFile);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/,"https:\/\/www\.linkedin\.com\/"/g, '');
  fs.writeFileSync(file, html, 'utf8');
}

const blogIndexFile = path.join(root, 'blog.html');
let blogIndex = fs.readFileSync(blogIndexFile, 'utf8');
blogIndex = blogIndex.replaceAll('AI Automation for Small Businesses: High-ROI Workflows That Save 20+ Hours/Week', 'AI Automation for Small Businesses: A Practical Workflow Guide');
blogIndex = blogIndex.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (full, jsonText) => {
  try {
    const graph = JSON.parse(jsonText);
    const blog = Array.isArray(graph) ? graph.find((item) => item['@type'] === 'Blog') : null;
    if (!blog) return full;
    blog.blogPost = [...prioritySlugs].map((slug) => {
      const articleHtml = fs.readFileSync(path.join(blogDir, `${slug}.html`), 'utf8');
      const articleJson = articleHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
      const parsed = articleJson ? JSON.parse(articleJson) : [];
      const article = Array.isArray(parsed) ? parsed.find((item) => item['@type'] === 'BlogPosting') : null;
      return {
        '@type': 'BlogPosting',
        headline: article?.headline,
        url: `https://appiex.com/blog/${slug}`,
        datePublished: article?.datePublished,
        dateModified: article?.dateModified,
        author: article?.author
      };
    });
    return `<script type="application/ld+json">${JSON.stringify(graph)}</script>`;
  } catch {
    return full;
  }
});
fs.writeFileSync(blogIndexFile, blogIndex, 'utf8');

const sitemapFile = path.join(root, 'sitemap.xml');
let sitemap = fs.readFileSync(sitemapFile, 'utf8');
sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
  const match = block.match(/<loc>https:\/\/appiex\.com\/blog\/([^<]+)<\/loc>/);
  if (!match) return block;
  const slug = match[1];
  const category = ['ai-automation', 'digital-strategy', 'seo-marketing', 'ui-ux-3d-design', 'web-development', 'gaming-3d-worlds'].includes(slug);
  return category || prioritySlugs.has(slug) ? block : '';
});
fs.writeFileSync(sitemapFile, sitemap, 'utf8');

console.log(JSON.stringify({ audited: files.length, indexablePriorityArticles: indexed, heldForEditorialReview: held }, null, 2));

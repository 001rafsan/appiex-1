/**
 * Rebuilds the legacy Appiex blog template as semantic, accessible editorial HTML.
 * Preserves the author-written CMS body, interactive forms, tracked leads, meta,
 * canonical URLs, structured data and indexing status. Safe to re-run.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const check = process.argv.includes('--check');
const legacySignature = /<main class="View">[\s\S]{0,220}<article class="ArticleSection"/i;
const ignored = new Set(['view', 'ai-automation', 'web-development', 'seo-marketing',
  'digital-strategy', 'ui-ux-3d-design', 'gaming-3d-worlds',
  'website-development-cost-bangladesh', 'ai-agents-vs-n8n-automation-for-business']);

const decode = s => String(s || '').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp|ndash|mdash|rsquo|lsquo);/gi,
  (_m, entity) => {
    const map = {amp:'&', quot:'"', apos:"'", lt:'<', gt:'>', nbsp:' ', ndash:'–', mdash:'—', rsquo:'’', lsquo:'‘'};
    if (entity[0] === '#') {
      const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2),16) : parseInt(entity.slice(1),10);
      return Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
    }
    return map[entity.toLowerCase()] || '';
  });
const text = s => decode(String(s || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
  .replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());
const safe = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const attr = (tag,name) => {
  const r = new RegExp('\\b'+name+'\\s*=\\s*(["\x27])([\\s\\S]*?)\\1','i');
  return tag.match(r)?.[2] || '';
};
function balancedDivContent(html, marker) {
  const initial = new RegExp('<div\\b(?=[^>]*\\bid=["\x27]'+marker+'["\x27])[^>]*>', 'i').exec(html);
  if (!initial) throw Error('Missing #' + marker);
  const start = initial.index + initial[0].length;
  const token = /<\/?div\b[^>]*>/gi;
  token.lastIndex = start;
  let depth = 1;
  let match;
  while ((match = token.exec(html))) {
    depth += /^<\/div/i.test(match[0]) ? -1 : 1;
    if (depth === 0) return html.slice(start, match.index);
  }
  throw Error('Unclosed div #' + marker);
}
function articleHead(original, slug, pageName) {
  let head = original.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  if (!head) throw Error('Missing head');
  // Remove obsolete Cuberto styles, animation hooks and conflicting CSS;
  // retain original SEO metadata, OG tags, JSON-LD and analytics scripts.
  head = head.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  head = head.replace(/<link\b[^>]*rel=["\x27]stylesheet["\x27][^>]*>/gi, '');
  head = head.replace(/<link\b[^>]*href=["\x27][^"\x27]+["\x27][^>]*rel=["\x27]stylesheet["\x27][^>]*>/gi, '');
  head = head.replace(/<script\b[^>]*src=["\x27][^"\x27]*instant-nav[^"\x27]*["\x27][^>]*><\/script>/gi, '');
  if (!/name=["\x27]theme-color["\x27]/i.test(head)) head += '\n<meta name="theme-color" content="#08070a">';
  if (!/rel=["\x27]canonical["\x27]/i.test(head)) throw Error('Missing canonical');
  if (!/name=["\x27]description["\x27]/i.test(head)) throw Error('Missing description');
  // A breadcrumb is added only when the existing article did not have one.
  if (!/["\x27]@type["\x27]\s*:\s*["\x27]BreadcrumbList["\x27]/i.test(head)) {
    const url = 'https://appiex.com/blog/' + slug;
    const json = {
      '@context':'https://schema.org', '@type':'BreadcrumbList',
      itemListElement:[
        {'@type':'ListItem',position:1,name:'Home',item:'https://appiex.com/'},
        {'@type':'ListItem',position:2,name:'Blog',item:'https://appiex.com/blog'},
        {'@type':'ListItem',position:3,name:pageName,item:url}
      ]
    };
    head += '\n<script type="application/ld+json">' + JSON.stringify(json).replace(/</g,'\\u003c') + '</script>';
  }
  head += '\n<link rel="preconnect" href="https://fonts.googleapis.com">';
  head += '\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
  head += '\n<link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">';
  head += '\n<link rel="stylesheet" href="/styles/appiex-blog-v2.css?v=20261106">';
  return head;
}
function headings(body) {
  const ids = new Set();
  const list = [];
  const updated = body.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (all, attrs, inner) => {
    const label = text(inner);
    if (!label || label.length > 240) return all;
    let id = attrs.match(/\bid=["\x27]([^"\x27]+)["\x27]/i)?.[1];
    if (!id) {
      id = label.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim().replace(/\s+/g,'-').slice(0,58);
      if (!id) id = 'section-' + (list.length + 1);
      const base = id;
      let n = 2;
      while (ids.has(id)) id = base + '-' + n++;
      attrs += ' id="' + id + '"';
    }
    if (!ids.has(id)) {
      ids.add(id);
      list.push({id,label:label.replace(/^\d+[.)]\s*/,'')});
    }
    return '<h2' + attrs + '>' + inner + '</h2>';
  });
  return {body:updated, headings:list.slice(0,18)};
}
function relatedLinks(original,slug) {
  const right = original.slice(original.indexOf('<!-- RIGHT COLUMN'));
  if (!right || right.length > original.length) return [];
  const a = /<a\b[^>]*href=["\x27](\/blog\/[a-z0-9/-]+)["\x27][^>]*>[\s\S]*?<\/a>/gi;
  const seen = new Set();
  const results = [];
  let hit;
  while ((hit=a.exec(right))) {
    const url=hit[1].replace(/\/$/,'');
    if (url === '/blog/'+slug || seen.has(url)) continue;
    seen.add(url);
    const label = hit[0].match(/<img\b[^>]*alt=["\x27]([^"\x27]+)["\x27]/i)?.[1]
      || hit[0].match(/<h[234]\b[^>]*>([\s\S]*?)<\/h[234]>/i)?.[1]
      || url.split('/').at(-1).replace(/-/g,' ');
    const name = text(label).slice(0,105);
    if (name) results.push({url,name});
    if(results.length === 4) break;
  }
  return results;
}
function captureTrailingScripts(original) {
  const close = original.lastIndexOf('</main>');
  const tail = close >= 0 ? original.slice(close+7) : original.slice(original.lastIndexOf('</article>')+10);
  const scripts = [...tail.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m =>
    !/appiex-reading-progress\.js|instant-nav\.js|cdn\.tailwindcss\.com/i.test(m[0]));
  return scripts.map(m=>m[0]).join('\n');
}
function rebuild(original,slug) {
  if (!legacySignature.test(original)) return null;
  const canonical = 'https://appiex.com/blog/' + slug;
  if (!original.includes(canonical)) throw Error('Canonical does not match slug');
  const h1 = original.match(/<h1\b[^>]*id=["\x27]cms-article-h1["\x27][^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const title = text(original.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s*\|\s*Appiex(?: Engineering Blog| Blog)?\s*$/i,'') || h1);
  if (!title) throw Error('No article headline');
  const description = text(original.match(/<meta\b[^>]*name=["\x27]description["\x27][^>]*>/i)?.[0]?.match(/content=["\x27]([^"\x27]+)["\x27]/i)?.[1]);
  if (description.length < 35) throw Error('No usable description');
  const category = text(original.match(/<meta\b[^>]*property=["\x27]article:section["\x27][^>]*>/i)?.[0]?.match(/content=["\x27]([^"\x27]+)["\x27]/i)?.[1] || 'Digital Engineering').slice(0,65);
  const author = text(original.match(/<meta\b[^>]*property=["\x27]article:author["\x27][^>]*>/i)?.[0]?.match(/content=["\x27]([^"\x27]+)["\x27]/i)?.[1] || 'Appiex Editorial Team').slice(0,90);
  const published = original.match(/<meta\b[^>]*property=["\x27]article:published_time["\x27][^>]*>/i)?.[0]?.match(/content=["\x27]([^"\x27]+)["\x27]/i)?.[1] || '';
  const date = /^\d{4}-\d{2}-\d{2}/.test(published) ? published.slice(0,10) : '';
  const imgTag = original.match(/<img\b[^>]*\bid=["\x27]cms-article-img["\x27][^>]*>/i)?.[0];
  const src = imgTag ? attr(imgTag,'src') : '';
  const imgAlt = imgTag ? text(attr(imgTag,'alt')) : title;
  // Only preserve the primary article material and interactive widgets.
  // The old unrelated right-rail and architecture filler are not imported.
  const rawBody = balancedDivContent(original,'cms-article-body');
  const {body,headings:toc}=headings(rawBody);
  if (toc.length < 2) throw Error('Article lacks enough useful section headings');
  const summaryText = text(original.match(/<p\b[^>]*id=["\x27]cms-article-brief["\x27][^>]*>([\s\S]*?)<\/p>/i)?.[1]);
  const shortSummary = summaryText.length > 700 ? summaryText.slice(0,697).replace(/\s+\S*$/,'')+'…' : summaryText;
  const related=relatedLinks(original,slug);
  const navItems = toc.map(v=>'<a href="#'+safe(v.id)+'">'+safe(v.label)+'</a>').join('');
  const relatedItems=related.map(v=>'<a href="'+safe(v.url)+'">'+safe(v.name)+'<span aria-hidden="true"> ↗</span></a>').join('');
  const metaHead=articleHead(original,slug,title);
  const scripts=captureTrailingScripts(original);
  // Preserve the lead-form ID, calculator IDs and CMS editable content.
  return [
    '<!doctype html>','<html lang="en">','<head>',metaHead,'</head>',
    '<body class="appiex-editorial-page appiex-modern-article appiex-blog-v2">',
    '<a class="appiex-skip" href="#article-content">Skip to article</a>',
    '<div class="appiex-blog-ambient" aria-hidden="true"></div>',
    '<div class="appiex-reading-meter" aria-hidden="true"><span></span></div>',
    '<header class="appiex-blog-navbar">',
    ' <a class="appiex-blog-brand" href="/" aria-label="Appiex home"><img src="/images/appiex-wordmark-white.png" alt="Appiex" width="116" height="32"></a>',
    ' <nav class="appiex-blog-navigation" aria-label="Main navigation"><a href="/">Home</a><a href="/services">Services</a><a href="/refer">Refer</a><a href="/partners">Partnership</a><a href="/projects">Projects</a><a href="/#contact">Contact</a><a href="/blog" aria-current="location">Blog</a></nav>',
    ' <a class="appiex-blog-navcta" href="/#contact">Start a project <span aria-hidden="true">↗</span></a>',
    '</header>',
    '<main class="appiex-blog-page">',
    ' <nav class="appiex-blog-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog">Blog</a><span aria-hidden="true">/</span><span aria-current="page">'+safe(title)+'</span></nav>',
    ' <header class="appiex-blog-hero">',
    '  <p class="appiex-blog-eyebrow">'+safe(category)+' <span aria-hidden="true">·</span> Appiex Insights</p>',
    '  <h1 id="cms-article-h1">'+safe(title)+'</h1>',
    '  <p class="appiex-blog-lead">'+safe(description)+'</p>',
    '  <div class="appiex-blog-byline"><span>By '+safe(author)+'</span>'+(date?' <span aria-hidden="true">·</span> <time datetime="'+date+'">'+date+'</time>':'')+' <span aria-hidden="true">·</span> <a href="/editorial-policy">Editorial standards</a></div>',
    '  <div class="appiex-blog-actions"><a class="appiex-blog-primary" href="/#contact">Discuss your project <span aria-hidden="true">↗</span></a><a class="appiex-blog-secondary" href="/blog">Explore more guides</a></div>',
    ' </header>',
    (src?'<figure class="appiex-blog-cover"><img id="cms-article-img" src="'+safe(src)+'" alt="'+safe(imgAlt)+'" width="1600" height="900" decoding="async" fetchpriority="high"><figcaption>'+safe(category)+' — Appiex resource</figcaption></figure>':''),
    ' <div class="appiex-blog-grid">',
    '  <aside class="appiex-blog-sidebar appiex-blog-toc" aria-label="Article navigation"><div class="appiex-blog-sidebar-inner"><p class="appiex-blog-sidebar-label">IN THIS GUIDE</p><nav aria-label="Jump to a section">'+navItems+'</nav><a class="appiex-blog-back" href="/blog">← All articles</a></div></aside>',
    '  <article class="appiex-blog-article" id="article-content">',
    '   <details class="appiex-blog-mobile-toc"><summary>Contents of this guide</summary><nav aria-label="Article sections">'+navItems+'</nav></details>',
    (shortSummary?'<section class="appiex-blog-summary" aria-label="Summary"><p class="appiex-blog-summary-label">THE SHORT ANSWER</p><p id="cms-article-brief">'+safe(shortSummary)+'</p></section>':''),
    '   <div class="appiex-blog-prose" id="cms-article-body">'+body+'</div>',
    '  </article>',
    '  <aside class="appiex-blog-sidebar appiex-blog-related" aria-label="Related guides and project contact"><div class="appiex-blog-sidebar-inner"><p class="appiex-blog-sidebar-label">BUILD WITH APPIEX</p><h2>Make your next project count.</h2><p>From modern websites to AI workflows, start with a clear technical scope and measurable goals.</p><a class="appiex-blog-sidebar-cta" href="/#contact">Talk to our team ↗</a></div>'+(related.length?'<div class="appiex-blog-sidebar-inner"><p class="appiex-blog-sidebar-label">RELATED READING</p><nav aria-label="Related articles">'+relatedItems+'</nav></div>':'')+'</aside>',
    ' </div>',
    ' <aside class="appiex-blog-bottom-cta"><p class="appiex-blog-eyebrow">START WITH A CLEAR PLAN</p><h2>Have something worth building?</h2><p>Describe your goals and we’ll help outline the most useful next step.</p><a href="/#contact">Discuss your project ↗</a></aside>',
    '</main>',
    '<footer class="appiex-blog-footer"><div>© 2026 Appiex Technologies. Dhaka, Bangladesh &amp; worldwide delivery.</div><nav aria-label="Footer"><a href="/services">Services</a><a href="/case-studies">Case Studies</a><a href="/partners">Partners</a><a href="/refer">Refer</a><a href="/privacy-policy">Privacy</a></nav></footer>',
    scripts,
    '<script src="/scripts/appiex-reading-progress.js" defer></script>',
    '</body>','</html>',''
  ].join('\n');
}

let changed = 0;
let inspected=0;
const problems=[];
for (const file of fs.readdirSync(path.join(root,'blog')).filter(s=>s.endsWith('.html'))) {
  const slug=file.slice(0,-5);
  if(ignored.has(slug))continue;
  const filename=path.join(root,'blog',file);
  const old=fs.readFileSync(filename,'utf8');
  if (!legacySignature.test(old))continue;
  inspected++;
  try {
    const updated = rebuild(old,slug);
    if (!updated) continue;
    const oldRobots = old.match(/<meta\b[^>]*name=["\x27]robots["\x27][^>]*>/i)?.[0];
    const newRobots = updated.match(/<meta\b[^>]*name=["\x27]robots["\x27][^>]*>/i)?.[0];
    const oldCanonical = old.match(/<link\b[^>]*rel=["\x27]canonical["\x27][^>]*>/i)?.[0];
    const newCanonical = updated.match(/<link\b[^>]*rel=["\x27]canonical["\x27][^>]*>/i)?.[0];
    if(oldRobots!==newRobots) throw Error('robots directive changed');
    if(oldCanonical!==newCanonical) throw Error('canonical changed');
    if((updated.match(/<h1\b/gi)||[]).length!==1)throw Error('H1 count != 1');
    if((updated.match(/id="cms-article-body"/g)||[]).length!==1)throw Error('CMS body absent or repeated');
    if(!/appiex-blog-v2\.css/.test(updated))throw Error('Design CSS absent');
    if (old!==updated) {
      changed++;
      if (!check) fs.writeFileSync(filename,updated);
    }
  } catch(e){problems.push(slug+': '+e.message);}
}
console.log('Blog v2 conversion: '+inspected+' old articles checked; '+changed+
  (check?' still need conversion':' rewritten')+'; '+problems.length+' errors.');
if(problems.length){problems.forEach(p=>console.error(p));process.exitCode=1;}
if(check&&changed) process.exitCode=1;

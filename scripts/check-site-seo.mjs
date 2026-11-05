import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const root = process.cwd();
const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
assert(urls.length >= 44, 'Expected indexable site URLs in sitemap');
assert.equal(new Set(urls).size, urls.length, 'Sitemap has duplicate URLs');
assert(urls.every((url) => url.startsWith('https://appiex.com/')), 'Unexpected sitemap host');

const priority = new Set([
  '/', '/web-development', '/ai-automation', '/seo-marketing',
  '/services', '/best-software-agency',
  '/blog/technical-seo-checklist-for-business-websites',
  '/blog/ai-agents-vs-n8n-automation-for-business'
]);
let validated = 0;
const errors = [];
for (const url of urls) {
  const relative = url.slice('https://appiex.com/'.length);
  const local = path.join(root, (relative || 'index') + '.html');
  if (!fs.existsSync(local)) {
    errors.push('Sitemap URL has no HTML source: ' + url);
    continue;
  }
  const html = fs.readFileSync(local, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const canon = [...head.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/gi)].map((m) => m[1]);
  if (canon.length !== 1 || canon[0] !== url) errors.push('Canonical mismatch: ' + url);
  if (priority.has('/' + relative)) {
    const title = head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '';
    const description = head.match(/<meta name="description"[^>]*content="([^"]*)"/i)?.[1] || '';
    const robots = head.match(/<meta name="robots"[^>]*content="([^"]*)"/i)?.[1] || '';
    const h1Count = [...html.matchAll(/<h1\b/gi)].length;
    if (title.length < 24 || title.length > 85) errors.push('Unhelpful title: ' + url);
    if (description.length < 65 || description.length > 190) errors.push('Unhelpful description: ' + url);
    if (/noindex/i.test(robots)) errors.push('Priority page is noindex: ' + url);
    if (h1Count !== 1) errors.push('H1 count is ' + h1Count + ': ' + url);
    for (const match of head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
      try { JSON.parse(match[1]); } catch { errors.push('Invalid JSON-LD: ' + url); }
    }
    validated++;
  }
}
for (const pathName of priority) {
  assert(urls.includes('https://appiex.com' + pathName), 'Priority URL absent: ' + pathName);
}
const seoService = fs.readFileSync('seo-marketing.html', 'utf8');
assert(seoService.includes('href="/blog/technical-seo-checklist-for-business-websites"'), 'Service guide not linked');
const guide = fs.readFileSync('blog/technical-seo-checklist-for-business-websites.html', 'utf8');
assert(guide.includes('id="nextjs-live-deployment-seo"'), 'Deployment guide missing');
if (errors.length) {
  errors.forEach((error) => console.error(error));
  process.exitCode = 1;
} else {
  console.log('Site SEO validated:', urls.length, 'sitemap URLs,', validated, 'priority metadata/markup checks');
}

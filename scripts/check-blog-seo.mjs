import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const priority = [
  "how-much-does-a-custom-website-cost-in-2026",
  "ai-automation-for-small-businesses",
  "custom-software-vs-saas-which-is-better",
  "shopify-vs-custom-ecommerce-development",
  "technical-seo-checklist-for-business-websites",
  "how-to-choose-a-software-development-agency",
  "how-to-automate-customer-support-with-ai",
  "complete-guide-to-custom-software-development",
  "website-development-cost-bangladesh",
  "how-much-does-ai-automation-cost",
  "how-long-does-it-take-to-build-a-saas-product",
  "website-redesign-process"
];
const problems = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const sitemap = read('sitemap.xml');
const landing = read('blog.html');
const robots = read('robots.txt');
const domain = 'https://appiex.com';
if (!robots.includes('Sitemap: https://appiex.com/sitemap.xml')) problems.push('robots.txt sitemap line missing');
if (!/rel="canonical" href="https:\/\/appiex.com\/blog"/.test(landing)) problems.push('blog index canonical missing');
const siteURLs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
if (siteURLs.length !== new Set(siteURLs).size) problems.push('Duplicate URLs in sitemap');
let indexed = 0;
for (const slug of priority) {
  const file = 'blog/' + slug + '.html';
  if (!fs.existsSync(path.join(root, file))) { problems.push(file + ' missing'); continue; }
  const html = read(file);
  const preferred = domain + '/blog/' + slug;
  if (!html.includes('href="' + preferred + '"')) problems.push(slug + ': no canonical');
  if (!/<meta name="robots" content="index, follow/i.test(html)) problems.push(slug + ': not indexable');
  if (!siteURLs.includes(preferred)) problems.push(slug + ': missing from sitemap');
  if (!landing.includes('href="/blog/' + slug + '"')) problems.push(slug + ': missing from blog landing');
  if ((html.match(/<h1\b/gi) || []).length !== 1) problems.push(slug + ': expected one H1');
  if (!/<title[^>]*>[^<]{15,}<\/title>/.test(html)) problems.push(slug + ': title missing');
  if (!/<meta name="description"[^>]*content="[^"]{50,}"/.test(html)) problems.push(slug + ': meta description missing');
  if (!/application\/ld\+json/.test(html)) problems.push(slug + ': JSON-LD missing');
  if (!/<h2\b/i.test(html)) problems.push(slug + ': no useful sections');
  if (slug !== 'website-development-cost-bangladesh' && !/id="faq-section"/.test(html)) problems.push(slug + ': FAQ missing');
  indexed++;
}
// Other draft pages should not be made indexable by mistake.
const excluded = new Set([...priority, 'view', 'web-development', 'ai-automation', 'digital-strategy', 'seo-marketing', 'ui-ux-3d-design', 'gaming-3d-worlds']);
const files = fs.readdirSync(path.join(root, 'blog')).filter((f) => f.endsWith('.html'));
for (const file of files) {
  const slug = file.slice(0, -5);
  if (excluded.has(slug)) continue;
  const html = read('blog/' + file);
  if (/<meta name="robots" content="index, follow/i.test(html)) problems.push(slug + ': unreviewed page unexpectedly indexable');
  if (siteURLs.includes(domain + '/blog/' + slug)) problems.push(slug + ': unreviewed page in sitemap');
}
if (problems.length) {
  console.error('SEO validation failed:\n- ' + problems.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('SEO validation passed: ' + indexed + ' priority articles, unique sitemap URLs, draft protection maintained.');
}

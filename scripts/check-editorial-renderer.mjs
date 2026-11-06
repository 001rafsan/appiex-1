import fs from 'node:fs';
import path from 'node:path';
import { improveHtml } from '../src/lib/appiex-html-polish.mjs';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const hubs = new Set([
  'view', 'ai-automation', 'web-development', 'digital-strategy',
  'seo-marketing', 'ui-ux-3d-design', 'gaming-3d-worlds'
]);
const articleFiles = fs.readdirSync(path.join(root, 'blog'))
  .filter(file => file.endsWith('.html') && !hubs.has(file.replace(/\.html$/, '')));
let total = 0, noindex = 0, indexable = 0, legacy = 0, modern = 0;
for (const file of articleFiles) {
  const slug = file.replace(/\.html$/, '');
  const original = read('blog/' + file);
  const html = improveHtml(original, ['blog', slug]);
  const title = (original.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  // The source HTML must be polished too; production may serve it without the Next.js renderer.
  const converted = /\bappiex-blog-v2\b/.test(original.match(/<body\b[^>]*>/i)?.[0] || '');
  const styleName = converted ? 'appiex-blog-v2.css' : 'appiex-editorial-polish.css';
  if (!original.includes(styleName)) errors.push(slug + ': raw HTML lacks appropriate design CSS');
  if (!original.includes('appiex-editorial-page')) errors.push(slug + ': raw HTML lacks editorial styling class');
  if (!original.includes('appiex-reading-meter')) errors.push(slug + ': raw HTML lacks reading progress');
  const sourceRobots = (original.match(/<meta\s+name="robots"\s+content="([^"]+)"/i) || [])[1] || '';
  const resultingRobots = (html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i) || [])[1] || '';
  const sourceCanonical = (original.match(/<link\s+rel="canonical"[^>]*>/i) || [])[0] || '';
  const resultingCanonical = (html.match(/<link\s+rel="canonical"[^>]*>/i) || [])[0] || '';
  const headings = [...html.matchAll(/<h1\b/gi)];
  const stylesheet = html.split('/styles/' + styleName).length - 1;
  if (headings.length !== 1) errors.push(slug + ': expected one H1, got ' + headings.length);
  if (!title) errors.push(slug + ': title missing');
  if (sourceRobots !== resultingRobots) errors.push(slug + ': robots directive was changed');
  if (sourceCanonical !== resultingCanonical) errors.push(slug + ': canonical changed');
  if (stylesheet !== 1) errors.push(slug + ': stylesheet missing or repeated');
  if (!html.includes('appiex-editorial-page')) errors.push(slug + ': editorial class missing');
  if (!html.includes('appiex-reading-meter')) errors.push(slug + ': reading progress missing');
  if (html.includes('id="cms-article-body"')) {
    legacy++;
    const visible = (html.match(/<h1\b[^>]*id="cms-article-h1"[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '';
    const expected = title.replace(/\s*\|\s*Appiex(?: Engineering Blog| Blog)?\s*$/i, '').trim();
    const normalized = input => input.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g,' ').trim().toLowerCase();
    if (!normalized(visible).startsWith(normalized(expected).slice(0, Math.min(25, expected.length)))) errors.push(slug + ': visible article heading differs from title');
  } else {
    modern++;
  }
  if (/\bnoindex\b/i.test(sourceRobots)) noindex++;
  else indexable++;
  total++;
}
const homeOriginal = read('index.html');
if (!homeOriginal.includes('appiex-home-polished')) errors.push('Static homepage is missing design styling class');
if (!homeOriginal.includes('appiex-editorial-polish.css')) errors.push('Static homepage is missing design stylesheet');
if (!homeOriginal.includes('Web Development, AI Automation &amp; Cost Guides'))
  errors.push('Static homepage does not contain polished service heading');
const home = improveHtml(homeOriginal, []);
if (!home.includes('appiex-home-polished')) errors.push('Homepage polish class missing');
if (!home.includes('Web Development, AI Automation &amp; Cost Guides')) errors.push('Homepage service hub heading unchanged');
if (!home.includes('More About Working With Appiex')) errors.push('Duplicate homepage FAQ heading was not differentiated');
if (!fs.existsSync(path.join(root, 'styles/appiex-editorial-polish.css'))) errors.push('Shared stylesheet missing');
if (!fs.existsSync(path.join(root, 'scripts/appiex-reading-progress.js'))) errors.push('Reading meter script missing');
if (errors.length) {
  console.error('Editorial regression checks failed:\n- ' + errors.join('\n- '));
  process.exitCode = 1;
} else {
  console.log('All ' + total + ' article HTML files rendered consistently (' +
    legacy + ' editable articles, ' + modern + ' reference articles; ' +
    indexable + ' indexable, ' + noindex + ' held for editorial review).');
}

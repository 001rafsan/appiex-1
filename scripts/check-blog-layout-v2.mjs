import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const exclude=new Set(['view','ai-automation','web-development','seo-marketing',
  'digital-strategy','ui-ux-3d-design','gaming-3d-worlds']);
const references=new Set(['website-development-cost-bangladesh','ai-agents-vs-n8n-automation-for-business']);
const failures=[];
let modern=0,converted=0,indexable=0,held=0;
const files=fs.readdirSync(path.join(root,'blog')).filter(f=>f.endsWith('.html'));
for (const filename of files) {
  const slug=filename.replace(/\.html$/,'');
  if (exclude.has(slug)) continue;
  modern++;
  const html=fs.readFileSync(path.join(root,'blog',filename),'utf8');
  const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const title=html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  const desc=head.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0] || '';
  const robots=head.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)?.[0] || '';
  const canon=head.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0] || '';
  const expected='https://appiex.com/blog/'+slug;
  if (!title || title.length<18) failures.push(slug+': short/missing title');
  if (!desc || !/content=["'][^"']{40,}/i.test(desc)) failures.push(slug+': description missing/short');
  if (!canon.includes(expected)) failures.push(slug+': canonical mismatch');
  if (!robots) failures.push(slug+': robots directive missing');
  if ((html.match(/<h1\b/gi)||[]).length!==1) failures.push(slug+': expected one H1');
  if ((html.match(/<h2\b/gi)||[]).length<2) failures.push(slug+': insufficient H2 structure');
  if (/noindex/i.test(robots)) held++; else indexable++;
  for(const match of head.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch(e) {failures.push(slug+': JSON-LD invalid');}
  }
  if (references.has(slug)) {
    if(!html.includes('appiex-modern-article')) failures.push(slug+': reference visual template removed');
    continue;
  }
  converted++;
  if (!/class=["'][^"']*\bappiex-blog-v2\b/.test(html)) failures.push(slug+': new body class absent');
  if (!html.includes('/styles/appiex-blog-v2.css')) failures.push(slug+': new design stylesheet absent');
  if (html.includes('<main class="View">')) failures.push(slug+': old template still active');
  if (!html.includes('id="cms-article-body"')) failures.push(slug+': CMS article body missing');
  if (!html.includes('id="cms-article-h1"')) failures.push(slug+': editable article H1 missing');
  if (!html.includes('aria-label="Breadcrumb"')) failures.push(slug+': breadcrumb missing');
  if (!html.includes('appiex-blog-mobile-toc')) failures.push(slug+': mobile section navigation missing');
  if (!html.includes('appiex-blog-sidebar-cta')) failures.push(slug+': project action missing');
  if (!html.includes('appiex-reading-progress.js')) failures.push(slug+': progress missing');
  if (!html.includes('seo-conversion-tracker.js')) failures.push(slug+': lead tracking missing');
  if (html.includes('id="cost-calculator"') && !html.includes('function updateArticleEstimate')) failures.push(slug+': calculator script lost');
  if (html.includes('id="free-audit-cta"') && !html.includes('function submitBlogLeadForm')) failures.push(slug+': lead form script lost');
  const sections=new Set([...html.matchAll(/\bid=["']([a-z0-9_-]+)["']/gi)].map(m=>m[1]));
  for (const link of html.matchAll(/<a\b[^>]*href=["']#([a-z0-9_-]+)["']/gi)) {
    if (!sections.has(link[1])) failures.push(slug+': broken in-page anchor #'+link[1]);
  }
}
if(converted!==65) failures.push('Expected 65 converted articles; saw '+converted);
if(modern!==67) failures.push('Expected 67 articles; saw '+modern);
if(indexable!==13 || held!==54) failures.push('Indexability drift: '+indexable+' indexable, '+held+' noindex (expected 13,54)');
if(failures.length){console.error('Blog template regression failures:\n- '+failures.join('\n- '));process.exitCode=1;}
else console.log('Blog v2 validated: '+modern+' articles ('+converted+' new layout + 2 reference articles), '+indexable+' indexable, '+held+' held for editorial review.');

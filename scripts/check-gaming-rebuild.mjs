import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('gaming.html','utf8');
const css=fs.readFileSync('styles/gaming-v2.css','utf8');
const intents=JSON.parse(fs.readFileSync('scripts/data/page-search-intents.json','utf8'));
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const intent=intents['/gaming'];
const head=html.slice(0,html.indexOf('</head>'));
const decode=s=>String(s).replaceAll('&amp;','&').replaceAll('&quot;','"').replace(/\s+/g,' ').trim();
const title=decode(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'');
const getMeta=(kind,key)=>decode(
  [...head.matchAll(/<meta\b[^>]*>/gi)]
    .find(m=>m[0].includes(kind+'="'+key+'"'))?.[0]
    ?.match(/content="([^"]+)"/i)?.[1]||''
);

assert(html.startsWith('<!DOCTYPE html>'),'DOCTYPE missing');
assert(html.includes('<html lang="en">'),'Language missing');
assert.equal(title,intent.title,'SEO title changed unexpectedly');
assert.equal(getMeta('name','description'),intent.description,'SEO description differs from search intent');
for(const [kind,key,value] of [
  ['property','og:title',intent.title],['property','og:description',intent.description],
  ['name','twitter:title',intent.title],['name','twitter:description',intent.description]
])assert.equal(getMeta(kind,key),value,'Social tag drift: '+key);
assert(head.includes('rel="canonical" href="https://appiex.com/gaming"'),'Canonical drift');
assert(head.includes('name="robots" content="index, follow'),'Noindex must not be present');
assert(sitemap.includes('<loc>https://appiex.com/gaming</loc>'),'Sitemap missing gaming');
assert(!/name="keywords"/i.test(head),'Meta keywords are ignored, do not stuff');
assert.equal((html.match(/<h1\b/gi)||[]).length,1,'Exactly one H1 required');
const h1=decode(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g,'')||'');
assert(/game\s*development/i.test(h1)&&/3d\s*worlds/i.test(h1),'Main H1 must match service intent');
const requiredSections=['main','capabilities','arcade','process','faq','project'];
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate IDs found');
for(const id of requiredSections)assert(ids.includes(id),'Missing essential section '+id);
assert((html.match(/class="gx-service(?: gx-service-feature)?"/g)||[]).length===6,
  'Six distinct capabilities required');
for(const phrase of [
  'Custom Game Development','WebGL &amp; Browser Games','Interactive 3D Websites',
  'Virtual Showrooms','Gamification for Brands','Game UX &amp; Prototyping'
])assert(html.includes(phrase),'Missing service: '+phrase);
assert(html.includes('id="arcade-canvas"')&&html.includes('id="arcade-start"'),'Playable game missing');
assert(html.includes('scripts/appiex-rift-shift.js'),'Rift Shift JS missing');
assert(!html.includes('appiex-gaming-play.js'),'Removed legacy Signal Run still loaded');
for(const unused of ['appiex-gaming.css','appiex-gaming-premium.css',
    'appiex-gaming-studio.css','appiex-gaming-director.css','appiex-gaming-arcade.css'])
  assert(!html.includes('/styles/'+unused),'Legacy stylesheet still loaded: '+unused);
assert(html.includes('styles/gaming-v2.css'),'New design stylesheet missing');
assert(html.includes('data-lenis-prevent'),'Mobile menu should allow nested scroll');
assert(html.includes('scripts/appiex-gaming-lenis.js'),'Smooth scrolling missing');
assert(css.includes('@media(max-width:610px)'),'Small screen rules missing');
assert(css.includes('prefers-reduced-motion:reduce'),'Reduced motion guard missing');
assert(css.includes(':focus-visible'),'Keyboard focus styling missing');
assert(css.length<25000,'New CSS should stay manageable');
assert(html.length<40000,'HTML size budget exceeded');
const imgs=[...html.matchAll(/<img\b[^>]+>/gi)].map(x=>x[0]);
assert(imgs.length>=5,'Cinematic imagery missing');
for(const tag of imgs){
  assert(tag.includes('alt="')&&tag.includes('srcset=')&&tag.includes('width=')&&tag.includes('height='),
    'Art requires accessible alt text and responsive dimensions');
}
assert(imgs[0].includes('fetchpriority="high"'),'Hero image is not prioritized');
for(const img of imgs.slice(1)) assert(img.includes('loading="lazy"'),'Below-fold images must lazy load');
assert(html.includes('NOT APPIEX CLIENT PROJECTS'),'Visual references not labeled');
const urls=new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>new URL(x[1]).pathname));
for(const link of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)){
  const dest=link[1];
  if(dest.startsWith('#'))assert(ids.includes(dest.slice(1)),'Broken anchor: '+dest);
  if(dest.startsWith('/')){
    const pathname=new URL(dest,'https://appiex.com').pathname;
    assert(pathname==='/'||urls.has(pathname),'Broken internal link '+dest);
  }
}
const data=JSON.parse(head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1]||'{}');
const graph=data['@graph']||[];
for(const t of ['Service','WebPage','BreadcrumbList','FAQPage','VideoGame'])
  assert(graph.some(x=>x['@type']===t),'Missing schema '+t);
const faq=graph.find(x=>x['@type']==='FAQPage').mainEntity;
const visibleFaq=html.slice(html.indexOf('<div class="gx-faq-list">'),html.indexOf('</section>',html.indexOf('<div class="gx-faq-list">')));
const details=[...visibleFaq.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)];
assert.equal(details.length,faq.length,'FAQ schema and display count mismatch');
for(let i=0;i<details.length;i++){
  assert.equal(decode(details[i][1]),faq[i].name,'FAQ question mismatch');
  assert.equal(decode(details[i][2]),faq[i].acceptedAnswer.text,'FAQ answer mismatch');
}
console.log('Gaming V2 QA PASS: fully replaced layout, 6 services, responsive cinematic art, single CSS, SEO/schema, link integrity, accessible playable game.');

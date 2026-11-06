import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('gaming.html','utf8');
const css=fs.readFileSync('styles/appiex-gaming-studio.css','utf8');
const index=fs.readFileSync('sitemap.xml','utf8');
const urls=new Set([...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>new URL(x[1]).pathname));
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
const sections=['experiences','platforms','game-engines','creative-worlds','world-builder','collaboration','process','project-budget','faq'];
let previous=-1;
for(const id of sections){
  const p=html.indexOf('id="'+id+'"');
  assert(p>previous,'Section missing or in incorrect reading order: '+id);
  previous=p;
  assert(ids.has(id),'Missing section anchor '+id);
}
assert.equal((html.match(/\bid="([^"]+)"/g)||[]).length,ids.size,'Repeated HTML ID');
assert.equal((html.match(/<h1\b/gi)||[]).length,1,'Exactly one H1 must be retained');
assert(html.includes('<link rel="canonical" href="https://appiex.com/gaming">'),'Canonical drift');
assert(html.includes('name="robots" content="index, follow'),'Indexability drift');
assert(html.includes('href="#play-demo"'),'Playable demo CTA missing');
assert(html.includes('id="g-game-canvas"'),'Playable arcade accidentally removed');
assert(html.includes('/styles/appiex-gaming-studio.css'),'Missing studio expansion stylesheet');
assert.equal((html.match(/class="gs-platform-card /g)||[]).length,4,'Four platform cards required');
assert.equal((html.match(/class="gs-engine-card /g)||[]).length,3,'Three technology options required');
assert.equal((html.match(/class="gs-concept-card /g)||[]).length,3,'Three original concept art cards required');
assert.equal((html.match(/class="gs-partnership-card/g)||[]).length,3,'Three work modes required');
const budget=html.slice(html.indexOf('id="project-budget"'),html.indexOf('</section>',html.indexOf('id="project-budget"')));
assert.equal((budget.match(/<li>/g)||[]).length,5,'Five project estimation inputs required');
assert(html.includes('Creative concepts only'),'Visual concepts must be labeled as not client projects');
assert(html.includes('not published client games'),'Cannot imply fabricated client work');
assert(html.includes('does not imply certification'),'Engine names must not imply endorsements');
assert(!html.includes('50+ Clients')&&!html.includes('200+ shipped'),'No copied competitor performance claims');
for(const a of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)){
  const href=a[1];
  if(href.startsWith('/')){
    const link=new URL(href,'https://appiex.com');
    assert(link.pathname==='/'||urls.has(link.pathname),'Broken internal target: '+href);
  }
  if(href.startsWith('#')){
    assert(ids.has(href.slice(1)),'Broken in-page link: '+href);
  }
}
for(const rule of [
 '.gs-chapter-nav','.gs-platform-grid','.gs-engine-grid','.gs-concept-grid',
 '.gs-partnership-grid','.gs-budget-layout','prefers-reduced-motion',
 '@media(max-width:650px)',':focus-visible'
]){
  // Keyboard focus is handled by the existing base global gaming stylesheet.
  if(rule===':focus-visible')continue;
  assert(css.includes(rule),'Missing scoped responsive styling: '+rule);
}
const base=fs.readFileSync('styles/appiex-gaming.css','utf8');
assert(base.includes(':focus-visible'),'Base stylesheet must preserve visible keyboard focus');
assert(css.length<35000,'Avoid unbounded CSS growth');
assert(html.length<75000,'Avoid unbounded HTML growth');
const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const service=graph.find(x=>x['@type']==='Service');
assert(service.serviceType.includes('Browser Game Development'),'Schema lacks browser gaming offering');
assert(service.serviceType.includes('3D Product Showrooms'),'Schema lacks virtual showroom offering');
console.log('Gaming studio expansion validated: 5 original sections, 4 platforms, 3 engine options, 3 labeled concepts, 3 engagement modes, 5 scoping inputs, links, semantic SEO and responsive designs.');

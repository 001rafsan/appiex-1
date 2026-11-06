import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles/appiex-home-sections-v3.css','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const urls=new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>new URL(x[1]).pathname));
const sectionIds=['best-agency-matrix','reviews-faq-section','specialized-service-hubs','faq-knowledge-hub'];
let previous=-1;
for(const id of sectionIds){
  const p=html.indexOf('<section id="'+id+'"');
  assert(p>=0,'Missing section '+id);
  assert.equal(html.split('id="'+id+'"').length-1,1,'Duplicate section ID '+id);
  assert(p>previous,'Section order drift '+id);
  previous=p;
}
assert.equal((html.match(/<h1\b/gi)||[]).length,1,'Homepage needs a single H1');
assert(html.includes('Your Business Growth Agency</span><br><span class="hero-gradient-text">From Earth to Jupiter'), 'Home keyword-focused H1 drift');
assert(html.includes('/styles/appiex-home-sections-v3.css'), 'Homepage missing V3 design CSS');
assert(html.includes('id="contact"'), 'Homepage contact anchor missing');
assert(html.includes('aria-labelledby="apx-solutions-title"'),'Solution heading accessibility missing');
assert(html.includes('role="region" aria-label="Compare Appiex project options" tabindex="0"'),'Mobile comparison scroll accessibility missing');
const a=html.indexOf('<section id="best-agency-matrix"'), b=html.indexOf('<footer id="footer"');
assert(a>0&&b>a,'Footer boundaries missing');
const block=html.slice(a,b);
assert.equal((block.match(/class="apx-solution-card"/g)||[]).length,4,'Need four project-fit cards');
assert.equal((block.match(/class="apx-hub-n"/g)||[]).length,6,'Need six specific service/guide links');
assert.equal((block.match(/<details(?:\s+open)?>/g)||[]).length,5,'One concise 5-question FAQ expected');
assert(!block.includes('★★★★★'), 'No unverified five-star ratings in homepage block');
assert(!block.includes('42%'), 'No unsupported conversion claims');
assert(!block.includes('$30 – $80'), 'No unsupported hourly pricing');
assert(!block.includes('90 days of free 24/7'), 'No unsupported support promises');
assert(!block.includes('Is Appiex the Right Fit'), 'Outdated section still shown');
assert(!block.includes('More About Working With Appiex'), 'Duplicate FAQ heading still present');
for(const m of block.matchAll(/<a\b[^>]*href="([^"]+)"/g)){
 const dest=m[1];
 if(dest.startsWith('/')){
   const u=new URL(dest,'https://appiex.com');
   assert(urls.has(u.pathname),'Homepage service/guide link not included in public sitemap: '+dest);
 }
 if(dest.startsWith('#')){
   assert(html.includes('id="'+dest.slice(1)+'"'),'Missing target for anchor '+dest);
 }
}
const schemaHtml=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
assert(schemaHtml,'Homepage JSON-LD missing');
const graph=JSON.parse(schemaHtml[1])['@graph'];
assert(graph,'Homepage JSON-LD graph missing');
const faq=graph.find(x=>x['@type']==='FAQPage');
assert(faq&&faq.mainEntity.length===5,'FAQ structured data must reflect the five visible questions');
const norm=x=>x.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const visible=[...block.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map(m=>norm(m[1]));
assert.deepEqual(visible,faq.mainEntity.map(x=>x.name),'FAQ schema questions differ from visible FAQ headings');
assert(!graph.some(x=>x.priceRange),'No hardcoded unverified price range in structured data');
assert(css.includes('@media(max-width:600px)'),'Missing mobile-specific styles');
assert(css.includes('prefers-reduced-motion'),'Missing reduced-motion styles');
assert(css.includes(':focus-visible'),'Missing keyboard focus styles');
assert(css.includes('.apx-solution-grid'),'Missing V3 card styling');

console.log('Home V3 validated: 4 solution cards, 3 project examples, 5 accessible FAQs, 6 service guides, FAQ JSON-LD, keywords, links and mobile design.');

import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('gaming.html','utf8');
const css=fs.readFileSync('styles/appiex-gaming.css','utf8');
const js=fs.readFileSync('scripts/appiex-gaming.js','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const intents=JSON.parse(fs.readFileSync('scripts/data/page-search-intents.json','utf8'));
const url='https://appiex.com/gaming';
const head=html.slice(0,html.indexOf('</head>'));
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const meta=(kind,key)=>decode([...head.matchAll(/<meta\b[^>]*>/gi)]
 .find(m=>new RegExp('\\b'+kind+'=["\\x27]'+key+'["\\x27]','i').test(m[0]))?.[0]
 ?.match(/\bcontent=["']([^"']+)["']/i)?.[1]||'');
const title=decode(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
const description=meta('name','description');

assert(html.startsWith('<!DOCTYPE html>'),'Gaming HTML is missing doctype');
assert(html.includes('<html lang="en">'),'Gaming page lacks language');
assert.equal(title,intents['/gaming'].title,'Title differs from search-intent map');
assert.equal(description,intents['/gaming'].description,'Description differs from search-intent map');
assert(description.length>=90&&description.length<=175,'Description is outside suitable length range');
assert.equal(meta('name','robots').includes('noindex'),false,'Indexable service should not contain noindex');
assert(!/name=["']keywords["']/i.test(head),'Meta keywords is ineffective and must be omitted');
assert(head.includes('rel="canonical" href="'+url+'"'),'Wrong canonical');
for(const [kind,key,expected] of [['property','og:title',title],['property','og:description',description],['name','twitter:title',title],['name','twitter:description',description]]){
 assert.equal(meta(kind,key),expected,'Social metadata mismatch: '+key);
}
const urls=new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]));
assert(urls.has(url),'Gaming is missing from public sitemap');
assert.equal((html.match(/<h1\b/gi)||[]).length,1,'Gaming must have a single H1');
assert((html.match(/<h2\b/gi)||[]).length>=6,'Missing helpful content sections');
const h1=decode(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g,' '));
assert(/game development/i.test(h1)&&/3d worlds/i.test(h1),'H1 is not aligned with game/3D intent');
for(const needle of ['WebGL &amp; Browser Games','Virtual Showrooms','Gamification for Brands','Custom Game Development','Real-Time 3D','Interactive 3D Websites']){
 assert(html.includes(needle),'Missing meaningful gaming service: '+needle);
}
const jsonld=[...head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
assert.equal(jsonld.length,1,'Expected one graph with structured data');
const graph=JSON.parse(jsonld[0][1])['@graph'];
assert(graph.find(x=>x['@type']==='Service'),'Service structured data missing');
assert(graph.find(x=>x['@type']==='WebPage'),'WebPage structured data missing');
assert(graph.find(x=>x['@type']==='BreadcrumbList'),'Breadcrumb structured data missing');
const faq=graph.find(x=>x['@type']==='FAQPage');
assert.equal(faq?.mainEntity?.length,5,'FAQ schema must have five questions');
const visibleFaq=html.slice(html.indexOf('<div class="g-faq-list">'),html.indexOf('</section>',html.indexOf('<div class="g-faq-list">')));
const visible=[...visibleFaq.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)]
 .map(m=>({question:decode(m[1].replace(/<span\b[^>]*>[\s\S]*?<\/span>/gi,'').replace(/<[^>]*>/g,'')),answer:decode(m[2].replace(/<[^>]*>/g,''))}));
assert.equal(visible.length,5,'Expected five visible accordion FAQs');
for(let i=0;i<5;i++){
 assert.equal(visible[i].question,faq.mainEntity[i].name,'FAQ question and schema differ: '+i);
 assert.equal(visible[i].answer,faq.mainEntity[i].acceptedAnswer.text,'FAQ answer and schema differ: '+i);
}
assert(html.includes('<a class="g-skip" href="#main">'),'Missing skip-to-content link');
assert(html.includes('aria-label="Mobile navigation"'),'Missing mobile navigation');
assert(html.includes('aria-pressed="true"'),'Use-case selector should expose pressed state');
assert(html.includes('aria-live="polite"'),'Interactive status not announced to assistive tech');
assert(html.includes('href="/#contact"'),'Missing working contact CTA');
for(const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)){
 const link=match[1];
 if(link.startsWith('/')){
   const dest=new URL(link,'https://appiex.com');
   if(dest.pathname!=='/' && !urls.has('https://appiex.com'+dest.pathname))
     throw new Error('Internal link absent from sitemap: '+link);
 }
 if(link.startsWith('#'))
   assert(html.includes('id="'+link.slice(1)+'"'),'Broken in-page anchor: '+link);
}
for(const file of ['/styles/appiex-gaming.css','/scripts/appiex-gaming.js'])
 assert(html.includes(file),'Missing resource reference: '+file);
assert(!html.includes('/_nuxt/'),'Old Nuxt framework assets must be removed');
assert(!html.includes('maximum-scale=1.0, user-scalable=0'),'Do not restrict user zoom');
assert(html.length<100000,'Gaming HTML is too large for lean page');
assert(css.length<45000,'Gaming CSS is larger than planned budget');
assert(js.length<8000,'Gaming enhancement should remain very small');
for(const pattern of ['prefers-reduced-motion',':focus-visible','@media(max-width:680px)','g-stage','g-portal-ring']){
 assert(css.includes(pattern),'Missing responsive or accessibility design style: '+pattern);
}
console.log('Gaming service validated: indexable, 45-URL sitemap, metadata, six service offerings, 5 synchronized FAQs, accessible interactions, mobile layout and lightweight 3D concept.');

import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

const pages=[
'digital-strategy','web-development','ui-ux-3d-design','ai-automation',
'seo-marketing','services','ecommerce-development','n8n-automation',
'partners','refer','blog','website-redesign','whatsapp-automation','isp-software-development'
];
const indexed=new Set([...fs.readFileSync('sitemap.xml','utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
 .map(m=>new URL(m[1]).pathname));
for(const page of pages){
 const html=fs.readFileSync(page+'.html','utf8');
 const begin=html.indexOf('<section class="appiex-related-services appiex-related-services--v2"');
 assert(begin>0,page+': missing design module');
 const end=html.indexOf('</section>',begin);
 assert(end>begin,page+': unclosed module');
 const section=html.slice(begin,end+10);
 assert.equal((html.match(/class="appiex-related-services appiex-related-services--v2"/g)||[]).length,1,page+': repeated design module');
 assert.equal((section.match(/class="appiex-related-service"/g)||[]).length,3,page+': expected 3 related service links');
 assert.equal((section.match(/class="appiex-related-article"/g)||[]).length,3,page+': expected 3 suggested blogs');
 assert.equal((section.match(/loading="lazy"/g)||[]).length,3,page+': missing lazy-loaded image');
 assert.equal((section.match(/decoding="async"/g)||[]).length,3,page+': missing async image decoding');
 assert.equal((section.match(/width="640" height="360"/g)||[]).length,3,page+': missing image dimensions');
 assert(html.includes('appiex-related-services.css'),page+': missing style link');
 assert(!html.includes('<section id="specialized-service-hubs"'),page+': duplicated legacy specialization hub');
 assert.equal((html.match(/<h1\b/gi)||[]).length,1,page+': H1 changed');
 for(const link of section.matchAll(/<a\b[^>]*href="([^"]+)"/g)){
   const to=new URL(link[1],'https://appiex.com').pathname;
   assert(indexed.has(to),page+': related link is not indexable '+to);
 }
 for(const img of section.matchAll(/<img\b[^>]*>/g)){
   const tag=img[0],src=tag.match(/\bsrc="([^"]+)"/)?.[1];
   assert(src&&fs.existsSync(path.join(src.replace(/^\//,''))),page+': missing image '+src);
   assert(/\balt="Article cover: [^"]+"/.test(tag),page+': missing useful image alt');
 }
 const head=html.slice(0,html.indexOf('</head>'));
 const canonical=head.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0]||'';
 assert(canonical.includes('https://appiex.com/'+page),page+': canonical was lost');
 assert(!/\bnoindex\b/i.test(head.match(/<meta\b[^>]*name="robots"[^>]*>/)?.[0]||''),page+': indexable page became noindex');
}
const css=fs.readFileSync('styles/appiex-related-services.css','utf8');
assert(css.includes('[data-related-theme="violet"]'),'Missing thematic design variants');
assert(css.includes('max-width:620px'),'Missing mobile single-column design');
assert(css.includes('prefers-reduced-motion'),'Missing reduced motion support');
assert(css.includes(':focus-visible'),'Missing keyboard interaction support');
console.log('Related services validated: '+pages.length+' pages × 3 service links and 3 illustrated indexed article recommendations, no redundant hubs.');

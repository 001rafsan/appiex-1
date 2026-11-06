import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('gaming.html','utf8');
const css=fs.readFileSync('styles/appiex-gaming-director.css','utf8');
const config=fs.readFileSync('next.config.mjs','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const intent=JSON.parse(fs.readFileSync('scripts/data/page-search-intents.json','utf8'))['/gaming'];
const head=html.slice(0,html.indexOf('</head>'));
const indexable=head.includes('name="robots" content="index, follow');
assert(indexable,'Gaming meta robots should permit indexing');
assert(head.includes('href="https://appiex.com/gaming"'),'Gaming canonical URL missing');
assert(sitemap.includes('<loc>https://appiex.com/gaming</loc>'),'Sitemap missing gaming');
assert(!/admin\|login\|profile\|gaming\|/.test(config),'X-Robots-Tag Next.js header still noindexes gaming');
const restricted=config.match(/source:\s*'\/:page\(([^)]+)\)'/);
assert(restricted,'Restricted noindex pages rule disappeared');
assert(!restricted[1].split('|').includes('gaming'),'Gaming listed in restricted-page robots rule');
assert(restricted[1].split('|').includes('admin'),'Admin must remain restricted');
const title=(head.match(/<title>([\s\S]*?)<\/title>/i)||[])[1];
assert(title?.replaceAll('&amp;','&')===intent.title,'SEO page title changed unexpectedly');
assert(head.includes(intent.description),'SEO page description changed unexpectedly');
assert.equal((html.match(/<h1\b/gi)||[]).length,1,'Exactly one main H1 required');
assert(html.includes('appiex-gaming-director.css'),'Director art direction CSS not loaded');
assert(html.includes('id="g-game-canvas"'),'Playable prototype inadvertently removed');
assert(html.includes('href="#play-demo"'),'User needs access to playable prototype');
assert(html.indexOf('id="play-demo"')>html.indexOf('id="experiences"'),'Playable prototype should not dominate above services');
const imgs=[...html.matchAll(/<img\b[^>]+>/gi)].map(m=>m[0]);
assert(imgs.length>=9,'Expected cinematic photography across hero, platforms, concepts and selector');
const ids=new Set();
for(const tag of imgs){
 const src=(tag.match(/\bsrc="([^"]+)"/)||[])[1];
 const alt=(tag.match(/\balt="([^"]*)"/)||[])[1];
 assert(src?.startsWith('https://images.unsplash.com/photo-'),'Visual reference should use licensed Unsplash media');
 assert(alt?.trim().length>=25,'All reference images need descriptive alt text');
 assert(tag.includes('decoding="async"'),'All images should decode asynchronously');
 assert(tag.includes('width=')&&tag.includes('height='),'Image intrinsic dimensions missing');
 assert(tag.includes('srcset='),'Responsive image source set missing');
 ids.add(src.split('?')[0]);
}
assert(ids.size>=5,'Avoid repetitive images: at least five distinct cinematic artworks');
assert(imgs[0].includes('fetchpriority="high"'),'Hero image should load with high priority');
for(const tag of imgs.slice(1))assert(tag.includes('loading="lazy"'),'Below-fold art should load lazily');
const credits=['Portal · itsiken','Reactor · itsiken','Architecture · Chamfjord','Environment · itsiken','3D Render · Sam Roy'];
for(const credit of credits)assert(html.includes(credit),'Missing artist credit: '+credit);
assert(html.includes('not published client games'),'Reference images must not be misrepresented as client work');
assert(!html.includes('gs-phone-device'),'Cartoon CSS-built mobile phone must be removed from markup');
assert(!html.includes('gs-scene-cube'),'Cartoon CSS-built concept object must be removed from markup');
assert(!html.includes('g-world-island'),'Cartoon hero island must be removed from markup');
const sections=['experiences','platforms','game-engines','creative-worlds','collaboration','process','project-budget','play-demo','faq'];
for(const id of sections)assert(html.includes('id="'+id+'"'),'Service content missing: '+id);
for(const rule of [
 'gd-hero-frame','gd-photo-art','gd-capabilities-band','gd-image-credits',
 'g-service-card','gs-platform-card','gs-concept-card','gs-chapter-nav',
 '@media(max-width:650px)','prefers-reduced-motion'
])assert(css.includes(rule),'Director CSS missing: '+rule);
assert(css.length<28000,'Limit additional CSS size to avoid degradation');
assert(html.length<65000,'Limit HTML size to avoid performance regression');
console.log('Gaming cinematic editorial QA passed: SEO header conflict fixed, nine responsive images, five credited artists, editorial visual direction, all service sections and playable prototype.');

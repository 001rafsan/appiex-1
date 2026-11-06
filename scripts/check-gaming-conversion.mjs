import fs from 'node:fs';
import assert from 'node:assert/strict';

const gaming=fs.readFileSync('gaming.html','utf8');
const home=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles/gaming-v2.css','utf8');
const js=fs.readFileSync('scripts/gaming-cta-measure.js','utf8');
const homeJs=fs.readFileSync('scripts/home-cta-measure.js','utf8');
const intents=JSON.parse(fs.readFileSync('scripts/data/page-search-intents.json','utf8'));
const gm=intents['/gaming'],hm=intents['/'];
const escape=s=>s.replaceAll('&','&amp;');

for(const [page,info] of [[gaming,gm],[home,hm]]){
  const head=page.slice(0,page.indexOf('</head>'));
  const title=head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  assert.equal(title,escape(info.title),'Search intent title must match');
  assert(head.includes('name="description" content="'+escape(info.description)+'"'),
    'Search intent description must match');
  for(const tag of ['og:description','twitter:description']) {
    assert(head.includes(tag+'" content="'+escape(info.description)+'"'),
      'Social preview description must match '+tag);
  }
  assert(!/meta[^>]*name="keywords"/i.test(head),'Do not use ignored meta keywords');
}
assert(gaming.includes('id="find-your-fit"'),'Goal navigation must be visible');
for(const id of ['game-build','showroom-build','brand-build','working-together','arcade']){
  assert(gaming.includes('id="'+id+'"'),'Missing buyer path '+id);
}
for(const label of [
  'I want people to play a game.',
  'I want customers to explore a product.',
  'I want my brand to feel memorable.',
  'What happens after you reach out',
  'See selected Appiex projects'
])assert(gaming.toLowerCase().includes(label.toLowerCase()),'Missing choice/clarity content '+label);
assert(gaming.includes('data-gx-cta="hero-project"'),'Primary CTA needs a measurement id');
assert(gaming.includes('data-gx-cta="footer-project"'),'Closing CTA needs a measurement id');
assert(gaming.includes('data-gx-cta="demo-start"'),'Game start should be measurable');
assert(gaming.includes('/scripts/gaming-cta-measure.js'),'Measurement script missing');
assert(gaming.includes('G-DF198MPZGT'),'Use the existing Appiex analytics ID');
assert(js.includes('gaming_cta_click')&&js.includes('gaming_cta_view'),
  'Measure real clicks and actual visible CTA impressions');
assert(js.includes('doNotTrack')&&js.includes('ga-disable-'),
  'Allow opt-out of custom event tracking');
assert(!/fetch\s*\(|XMLHttpRequest|WebSocket/.test(js),
  'Custom measurement layer should rely on existing GA4; no outbound data API');
assert(css.includes('.gx-path-grid')&&css.includes('.gx-clarity-grid'),
  'Goal selector and clarity section must be styled');
assert(css.includes('max-width:610px'),'Responsive mobile fallback missing');
assert(css.includes('prefers-reduced-motion:reduce'),'Reduced motion safety missing');
assert(css.length<25000,'Avoid unbounded page CSS');
assert(gaming.length<40000,'Avoid heavyweight HTML');
assert(home.includes('data-text="Discuss Your Project"')&&home.includes('See Selected Projects'),
  'Homepage above-fold CTAs must state clear next steps');
assert(home.includes('data-home-cta="discuss-project"')&&home.includes('data-home-cta="see-projects"'),
  'Track the main homepage hero offers consistently');
assert(home.includes('/scripts/home-cta-measure.js'),
  'Homepage CTA measurement script should load');
assert(homeJs.includes('home_cta_click')&&homeJs.includes('home_cta_view'),
  'Homepage must measure CTA visibility and actual clicks');
assert(homeJs.includes('doNotTrack')&&homeJs.includes('ga-disable-'),
  'Homepage measurement must respect privacy opt-outs');
assert(home.includes('Your Business Growth Agency'),'Retain existing brand positioning');
const schema=JSON.parse(gaming.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1]||'{}')['@graph'];
assert(schema.some(n=>n['@type']==='Service'&&n.serviceType.includes('3D Product Configurators')),
  'Structured service keywords must match real content');
const wp=schema.find(n=>n['@type']==='WebPage');
assert.equal(wp.name,gm.title);
assert.equal(wp.description,gm.description);
const ids=[...gaming.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'No duplicated IDs on conversion path');
for(const target of gaming.matchAll(/<a\b[^>]*href="#([^"]+)"/g)){
  assert(ids.includes(target[1]),'Broken destination #'+target[1]);
}
console.log('Conversion and SEO QA PASS: relevant search snippets, 3 buyer paths, honest trust/clarity, homepage CTAs, measurable gaming interactions and mobile layout.');

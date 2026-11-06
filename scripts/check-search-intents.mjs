import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Editorially curated search intents. This is a coverage test, not a
// fabricated keyword-volume, rankings, or Search Console measurement.
const intents=JSON.parse(fs.readFileSync('scripts/data/page-search-intents.json','utf8'));
const urls=[...fs.readFileSync('sitemap.xml','utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const paths=urls.map(x=>new URL(x).pathname);
const normalize=x=>String(x||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const getContent=tag=>normalize(tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1]||'');
const readMeta=(head,kind,key)=>getContent([...head.matchAll(/<meta\b[^>]*>/gi)].find(m=>new RegExp('\\b'+kind+'=["\\x27]'+key+'["\\x27]','i').test(m[0]))?.[0]);
const errors=[];
if(paths.length!==44)errors.push('Expected 44 curated indexable URLs; got '+paths.length);
if(new Set(paths).size!==paths.length)errors.push('Duplicate sitemap URL');
if(Object.keys(intents).length!==paths.length)errors.push('Search intent map count differs from sitemap');
const primarySeen=new Map();
for(const p of paths){
 const intent=intents[p];
 if(!intent){errors.push('Missing search intent: '+p);continue;}
 if(!intent.primary||!Array.isArray(intent.supporting)||intent.supporting.length!==2)
   errors.push('Missing focus/supporting topics '+p);
 const primary=intent.primary.toLowerCase();
 if(primarySeen.has(primary))errors.push('Duplicated primary intent: '+p+' and '+primarySeen.get(primary));
 primarySeen.set(primary,p);
 if(intent.description?.length<65||intent.description?.length>190)
   errors.push('Description length out of editorial range: '+p);
 const file=path.join(process.cwd(),(p==='/'?'index':p.slice(1))+'.html');
 if(!fs.existsSync(file)){errors.push('Missing page '+file);continue;}
 const html=fs.readFileSync(file,'utf8');
 const head=html.slice(0,html.indexOf('</head>'));
 const title=normalize(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
 const description=readMeta(head,'name','description');
 const ogTitle=readMeta(head,'property','og:title');
 const ogDesc=readMeta(head,'property','og:description');
 const twitterTitle=readMeta(head,'name','twitter:title');
 const twitterDesc=readMeta(head,'name','twitter:description');
 if(title.length<20||title.length>90)errors.push('Bad title length: '+p);
 if(intent.title&&title!==intent.title)errors.push('Mapped title not applied: '+p);
 if(description!==intent.description)errors.push('Mapped description not applied: '+p);
 if(ogTitle!==title||twitterTitle!==title)errors.push('Social titles out of sync: '+p);
 if(ogDesc!==description||twitterDesc!==description)errors.push('Social descriptions out of sync: '+p);
 const bodyHead=normalize(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g,' '));
 if(!bodyHead)errors.push('Missing H1: '+p);
 const text=(title+' '+description+' '+bodyHead).toLowerCase().replace(/[^a-z0-9 ]+/g,' ');
 const focusWords=primary.replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(w=>w.length>=4&&
  !new Set(['with','from','about','guides','services','company','and','blog']).has(w));
 const hits=focusWords.filter(w=>text.includes(w));
 if(!hits.length)errors.push('Page metadata does not match its focus topic: '+p+' '+intent.primary);
 const canonical=head.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)/i)?.[1]||'';
 if(canonical!==urls[paths.indexOf(p)])errors.push('Canonical mismatch: '+p);
 const robots=readMeta(head,'name','robots');
 if(/noindex/i.test(robots))errors.push('Indexable sitemap URL became noindex: '+p);
 for(const match of head.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{JSON.parse(match[1])}catch{errors.push('Invalid JSON-LD: '+p)}
 }
 if(p.startsWith('/authors/')&&!head.includes('"BreadcrumbList"'))
   errors.push('Author profile breadcrumb missing: '+p);
}
for(const p of Object.keys(intents))if(!paths.includes(p))errors.push('Mapped URL not in sitemap: '+p);
if(errors.length){for(const err of errors)console.error('SEO intent: '+err);process.exitCode=1;}
else console.log('Page-specific search intent verified: 44 URLs, 44 distinct focus topics, 88 supporting queries, page descriptions, social metadata, canonicals, author breadcrumbs and indexability.');

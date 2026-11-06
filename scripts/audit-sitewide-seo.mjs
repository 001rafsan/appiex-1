import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const site='https://appiex.com';
const xml=fs.readFileSync('sitemap.xml','utf8');
const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
const pages=[];
const seenTitle=new Map(),seenDescription=new Map();
const issues=[];
const strip=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
for(const url of urls){
 const p=new URL(url).pathname;
 const f=path.join(root,(p==='/'?'index':p.slice(1))+'.html');
 if(!fs.existsSync(f)){issues.push({url,type:'missing-file'});continue;}
 const html=fs.readFileSync(f,'utf8');
 const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';
 const title=strip(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
 const desc=head.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0]?.match(/content=["']([^"']+)["']/i)?.[1]||'';
 const canonical=head.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)["']/i)?.[1]||'';
 const robots=head.match(/<meta\b[^>]*name=["']robots["'][^>]*>/i)?.[0]?.match(/content=["']([^"']+)["']/i)?.[1]||'';
 const h1s=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>strip(m[1]));
 const og=head.match(/<meta\b[^>]*property=["']og:title["'][^>]*>/i)?.[0]||'';
 const twitter=head.match(/<meta\b[^>]*name=["']twitter:card["'][^>]*>/i)?.[0]||'';
 const jsonld=[...head.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
 let invalid=0;for(const j of jsonld){try{JSON.parse(j[1])}catch{invalid++;}}
 const missingAlt=[...html.matchAll(/<img\b[^>]*>/gi)].filter(x=>!/\balt=["'][^"']*["']/i.test(x[0]));
 const score=[];
 if(title.length<24||title.length>90)score.push('title-length');
 if(desc.length<65||desc.length>200)score.push('description-length');
 if(h1s.length!==1)score.push('h1-count');
 if(!og)score.push('missing-og-title');
 if(!twitter)score.push('missing-twitter-card');
 if(!jsonld.length)score.push('missing-structured-data');
 if(invalid)score.push('bad-structured-data');
 if(canonical!==url)score.push('canonical-mismatch');
 if(/noindex/i.test(robots))score.push('sitemap-includes-noindex');
 if(missingAlt.length)score.push('missing-image-alt:'+missingAlt.length);
 if(seenTitle.has(title))score.push('duplicate-title:'+seenTitle.get(title));
 else seenTitle.set(title,p);
 if(seenDescription.has(desc))score.push('duplicate-description:'+seenDescription.get(desc));
 else seenDescription.set(desc,p);
 pages.push({path:p,title,descriptionLength:desc.length,h1:h1s[0]?.slice(0,90),h1Count:h1s.length,structuredData:jsonld.length,issue:score});
}
console.log('Indexable URLs audited: '+pages.length+' / '+urls.length);
console.log('Pages with warnings: '+pages.filter(p=>p.issue.length).length);
for(const p of pages.filter(p=>p.issue.length)) console.log(JSON.stringify({path:p.path,title:p.title,h1:p.h1,flags:p.issue}));
console.log('Missing files:',issues.length);
if(issues.length)console.log(JSON.stringify(issues));

if(process.argv.includes('--strict') && (issues.length || pages.some(page=>page.issue.length))) {
  console.error('Sitewide SEO audit strict mode found outstanding metadata or accessibility warnings');
  process.exitCode=1;
}

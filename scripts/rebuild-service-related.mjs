/**
 * Appiex related services + recommended reading, source-level HTML generator.
 * Uses only existing, indexed articles and their verified local OG thumbnails.
 * Repeatable / safe to run on already-updated pages. No indexation changes.
 */
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const check=process.argv.includes('--check');
const xml=fs.readFileSync('sitemap.xml','utf8');
const sitemap=new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]).pathname));
const configs={
  'digital-strategy':{
    theme:'blue',label:'DIGITAL STRATEGY',
    description:'Explore related digital strategy services and practical guides about software planning, technology decisions and delivery.',
    posts:['custom-software-vs-saas-which-is-better','how-to-choose-a-software-development-agency','how-long-does-it-take-to-build-a-saas-product']
  },
  'web-development':{
    theme:'red',label:'WEB DEVELOPMENT',
    description:'Compare website development services and expert guides to plan the right scope, technology and budget.',
    posts:['how-much-does-a-custom-website-cost-in-2026','complete-guide-to-custom-software-development','how-long-does-it-take-to-build-a-saas-product']
  },
  'ui-ux-3d-design':{
    theme:'amber',label:'UI/UX & 3D WEB DESIGN',
    description:'Explore product design, website redesign and digital experience guides to inform your next interface.',
    posts:['website-redesign-process','how-to-choose-a-software-development-agency','shopify-vs-custom-ecommerce-development']
  },
  'ai-automation':{
    theme:'violet',label:'AI AUTOMATION',
    description:'Plan practical AI agents and workflow automation with guides to cost, customer support and small-business operations.',
    posts:['ai-automation-for-small-businesses','how-much-does-ai-automation-cost','how-to-automate-customer-support-with-ai']
  },
  'seo-marketing':{
    theme:'green',label:'SEO & GROWTH',
    description:'Explore technical SEO, redesign migration and development resources designed to support sustainable organic visibility.',
    posts:['technical-seo-checklist-for-business-websites','website-redesign-process','how-to-choose-a-software-development-agency']
  },
  'services':{
    theme:'red',label:'EXPLORE APPIEX SERVICES',
    description:'See how our development, automation and growth services connect, then read practical guides before scoping a project.',
    posts:['complete-guide-to-custom-software-development','ai-automation-for-small-businesses','technical-seo-checklist-for-business-websites']
  },
  'ecommerce-development':{
    theme:'red',label:'ECOMMERCE DEVELOPMENT',
    description:'Compare ecommerce technology, planning and redesign topics to prepare a stronger online store.',
    posts:['shopify-vs-custom-ecommerce-development','how-much-does-a-custom-website-cost-in-2026','website-redesign-process']
  },
  'n8n-automation':{
    theme:'violet',label:'WORKFLOW AUTOMATION',
    description:'Learn how AI and workflow integrations support business processes, operating budgets and customer support.',
    posts:['ai-automation-for-small-businesses','how-much-does-ai-automation-cost','how-to-automate-customer-support-with-ai']
  },
  'partners':{
    theme:'red',label:'FOR AGENCY PARTNERS',
    description:'Explore our engineering services and buyer guides to plan white-label software delivery and client collaboration.',
    posts:['how-to-choose-a-software-development-agency','complete-guide-to-custom-software-development','custom-software-vs-saas-which-is-better']
  },
  'refer':{
    theme:'red',label:'REFERRAL RESOURCES',
    description:'Learn about the business problems Appiex solves and the services you can introduce to potential clients.',
    posts:['how-much-does-a-custom-website-cost-in-2026','ai-automation-for-small-businesses','shopify-vs-custom-ecommerce-development']
  },
  'blog':{
    theme:'red',label:'EDITOR’S PICKS',
    description:'A short reading list covering software planning, AI workflows and technical search visibility.',
    posts:['complete-guide-to-custom-software-development','ai-automation-for-small-businesses','technical-seo-checklist-for-business-websites']
  },
  'website-redesign':{
    theme:'red',label:'REDESIGN RESOURCES',
    services:[['/web-development','Custom Web Development','Modern websites and applications'],['/seo-marketing','Technical SEO','Migration plans and search measurement'],['/ui-ux-3d-design','UI/UX Design','User journeys and visual systems']],
    posts:['website-redesign-process','technical-seo-checklist-for-business-websites','how-to-choose-a-software-development-agency']
  },
  'whatsapp-automation':{
    theme:'violet',label:'BUSINESS MESSAGING',
    services:[['/ai-automation','AI Automation','Intelligent workflows with review'],['/n8n-automation','n8n Integrations','Connect APIs and messaging events'],['/services','All Appiex Services','Explore additional digital solutions']],
    posts:['how-to-automate-customer-support-with-ai','ai-automation-for-small-businesses','how-much-does-ai-automation-cost']
  },
  'isp-software-development':{
    theme:'blue',label:'BUSINESS SOFTWARE',
    services:[['/web-development','Custom Software','Design secure web applications'],['/ai-automation','AI Workflow Automation','Connect repetitive business operations'],['/services','All Appiex Services','Browse software and digital capabilities']],
    posts:['complete-guide-to-custom-software-development','custom-software-vs-saas-which-is-better','how-to-choose-a-software-development-agency']
  }
};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const plain=s=>String(s).replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
const meta=(head,type,key)=>[...head.matchAll(/<meta\b[^>]*>/gi)].find(m=>new RegExp('\\b'+type+'=["\\x27]'+key+'["\\x27]','i').test(m[0]))?.[0].match(/\bcontent=["']([^"']+)/i)?.[1]||'';
const availableImage=src=>{
  if(!src||!src.startsWith('/images/blog/'))return false;
  const file=path.join(root,src.slice(1));
  return fs.existsSync(file);
};
function article(slug){
  const url='/blog/'+slug;
  if(!sitemap.has(url))throw Error('Recommendation not indexable: '+url);
  const file=path.join(root,'blog',slug+'.html');
  const content=fs.readFileSync(file,'utf8');
  const head=content.slice(0,content.indexOf('</head>'));
  const robots=meta(head,'name','robots');
  if(/noindex/i.test(robots))throw Error('Article is noindex: '+slug);
  const image=meta(head,'property','og:image').replace('https://appiex.com','');
  if(!availableImage(image))throw Error('Article missing valid local thumbnail: '+slug+' image='+image);
  const title=plain(content.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'')
    .replace(/\s*\|\s*Appiex(?:\s.*)?$/i,'').trim();
  const desc=plain(meta(head,'name','description'));
  if(!title||desc.length<40)throw Error('Missing article metadata: '+slug);
  return {url,title,image,description:desc};
}
function legacyServices(html,page){
 const index=html.indexOf('<section class="appiex-related-services"');
 if(index<0)return configs[page].services||[];
 const end=html.indexOf('</section>',index);
 if(end<0)throw Error('Bad old related section '+page);
 const nav=html.slice(index,end);
 const links=[...nav.matchAll(/<a href="([^"]+)"[^>]*><strong>([\s\S]*?)<\/strong><span>([\s\S]*?)<\/span><\/a>/g)]
 .map(m=>({url:m[1],title:plain(m[2]),caption:plain(m[3])}));
 if(links.length!==3)throw Error('Expected three old service links on '+page+' got '+links.length);
 return links.map(item=>[item.url,item.title,item.caption]);
}
function removeLegacySpecial(html,page){
 const key='<section id="specialized-service-hubs"';
 const start=html.indexOf(key);
 if(start<0)return html;
 const stop=html.indexOf('</section>',start);
 if(stop<start)throw Error('Unclosed legacy specialized section '+page);
 const content=html.slice(start,stop);
 if((content.match(/<section\b/gi)||[]).length!==1)throw Error('Nested specialized section '+page);
 return html.slice(0,start)+html.slice(stop+10);
}
function card(post){
  return '<a class="appiex-related-article" href="'+esc(post.url)+'" aria-label="Read '+esc(post.title)+'">'+
    '<span class="appiex-related-article__image"><img src="'+esc(post.image)+'" alt="Article cover: '+esc(post.title)+'" width="640" height="360" loading="lazy" decoding="async"></span>'+
    '<span class="appiex-related-article__text"><span class="appiex-related-article__tag">READ THE GUIDE <span aria-hidden="true">↗</span></span>'+
    '<strong>'+esc(post.title)+'</strong><span class="appiex-related-article__desc">'+esc(post.description.length>127?post.description.slice(0,124).replace(/\s+\S*$/,'')+'…':post.description)+'</span></span></a>';
}
function render(page,cfg,services){
 const posts=cfg.posts.map(article);
 for(const [url] of services)if(!sitemap.has(url))throw Error('Recommended service absent in sitemap: '+page+' '+url);
 const mini=services.map(([url,title,caption],i)=>'<a href="'+esc(url)+'" class="appiex-related-service" aria-label="'+esc(title)+'">'+
   '<span class="appiex-related-service__number">0'+(i+1)+'</span><span class="appiex-related-service__content"><strong>'+esc(title)+'</strong><small>'+esc(caption)+'</small></span><span class="appiex-related-service__arrow" aria-hidden="true">↗</span></a>').join('');
 return '<section class="appiex-related-services appiex-related-services--v2" data-related-theme="'+cfg.theme+'" aria-labelledby="appiex-related-heading-'+page+'">'+
   '<div class="appiex-related-services__header"><div><p class="appiex-related-services__eyebrow">'+esc(cfg.label)+'</p>'+
   '<h2 id="appiex-related-heading-'+page+'">Explore related solutions &amp; insights</h2>'+
   '<p class="appiex-related-services__intro">'+esc(cfg.description||'More useful services and technical guides from Appiex for planning a successful project.')+'</p></div>'+
   '<a class="appiex-related-services__all" href="/blog">Explore the blog <span aria-hidden="true">↗</span></a></div>'+
   '<nav class="appiex-related-services__grid" aria-label="Related services">'+mini+'</nav>'+
   '<div class="appiex-related-services__reading-heading"><div><p class="appiex-related-services__eyebrow">SELECTED READING</p><h3>Recommended articles for your next decision</h3></div>'+
   '<a href="/blog">All articles <span aria-hidden="true">↗</span></a></div>'+
   '<nav class="appiex-related-services__articles" aria-label="Recommended blog posts">'+posts.map(card).join('')+'</nav>'+
   '</section>';
}
let changed=0,removedSpecial=0;
for(const [page,cfg] of Object.entries(configs)){
 const file=path.join(root,page+'.html');
 if(!fs.existsSync(file))throw Error('Missing target page '+page);
 const original=fs.readFileSync(file,'utf8');
 // A completed V2 module already has the final source structure.
 // Idempotence matters for CI, deployment and subsequent changes.
 if(original.includes('appiex-related-services--v2'))continue;
 const legacy=legacyServices(original,page);
 if(legacy.length!==3)throw Error('No valid related services on '+page);
 let html=removeLegacySpecial(original,page);
 if(html!==original)removedSpecial++;
 const start=html.indexOf('<section class="appiex-related-services"');
 const replacement=render(page,cfg,legacy);
 if(start>=0){
   const end=html.indexOf('</section>',start);
   if(end<start)throw Error('Old recommendation unclosed '+page);
   html=html.slice(0,start)+replacement+html.slice(end+10);
 }else{
   const footer=/<footer\b/i.exec(html);
   if(!footer)throw Error('Missing footer on '+page);
   html=html.slice(0,footer.index)+replacement+'\n'+html.slice(footer.index);
 }
 if(!html.includes('appiex-related-services.css')){
   html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/styles/appiex-related-services.css?v=20261106">\n</head>');
 }
 if(html!==original){changed++;if(!check)fs.writeFileSync(file,html,'utf8');}
}
console.log('Service related reading: '+Object.keys(configs).length+' pages; '+changed+(check?' awaiting changes':' updated')+'; '+removedSpecial+' duplicated old sections removed.');
if(check&&changed)process.exitCode=1;

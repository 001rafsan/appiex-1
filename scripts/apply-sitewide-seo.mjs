/**
 * Apply targeted SEO fixes to public sitemap pages, without blanket keywords,
 * speculative ranking claims or making draft blog articles indexable.
 */
import fs from 'node:fs';
import path from 'node:path';

const check=process.argv.includes('--check');
const origin='https://appiex.com';
const urls=[...fs.readFileSync('sitemap.xml','utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const allowed=new Set(urls.map(u=>new URL(u).pathname));
const updates={
  '/authors/tanvir-rahman':{title:'Tanvir Rahman | Technical SEO & Growth Author | Appiex'},
  '/blog/ai-automation':{title:'AI Automation & AI Agent Guides | Appiex'},
  '/blog/digital-strategy':{description:'Explore practical digital strategy guides covering product discovery, software roadmaps, SaaS planning, technology selection and scalable business operations.'},
  '/blog/gaming-3d-worlds':{title:'Game Development & Interactive 3D Guides | Appiex'},
  '/blog/seo-marketing':{title:'Technical SEO & AI Search Guides | Appiex'},
  '/blog/ui-ux-3d-design':{title:'UI/UX, 3D Web Design & Redesign Guides | Appiex'},
  '/privacy-policy':{title:'Appiex Privacy Policy | Data Use & Your Choices'}
};
const related={
  '/services':[
    ['/web-development','Web & Software Development','Plan websites, SaaS apps and integrated portals.'],
    ['/ai-automation','Custom AI Automation','Connect tools, approvals and workflows.'],
    ['/seo-marketing','Technical SEO & Search Visibility','Improve crawlability, linking and conversion measurement.']
  ],
  '/web-development':[
    ['/ecommerce-development','Ecommerce Web Development','Design online stores, catalogs and payment flows.'],
    ['/website-redesign','Website Redesign & SEO Migration','Modernize a website while protecting search traffic.'],
    ['/blog/website-development-cost-bangladesh','Website Cost in Bangladesh','Compare scope and pricing considerations.']
  ],
  '/ai-automation':[
    ['/n8n-automation','n8n Automation Services','Build approval-based workflows and integrations.'],
    ['/whatsapp-automation','WhatsApp Automation','Explore chatbots and business messaging flows.'],
    ['/blog/ai-agents-vs-n8n-automation-for-business','AI Agents vs n8n Guide','Choose between AI agents and reliable workflows.']
  ],
  '/seo-marketing':[
    ['/blog/technical-seo-checklist-for-business-websites','Technical SEO Checklist','Review indexing, canonicals, structured data and speed.'],
    ['/website-redesign','SEO-Safe Website Redesign','Plan redirects and search performance checks.'],
    ['/web-development','SEO-Friendly Website Development','Build fast, crawlable websites from the start.']
  ],
  '/ecommerce-development':[
    ['/blog/shopify-vs-custom-ecommerce-development','Shopify vs Custom Ecommerce','Compare platforms and operational trade-offs.'],
    ['/blog/website-development-cost-bangladesh','Ecommerce Website Pricing','Understand local website cost factors.'],
    ['/web-development','Custom Web Applications','Explore integrations and full-stack development.']
  ],
  '/n8n-automation':[
    ['/ai-automation','AI Automation Services','Connect AI agents and workflow orchestration.'],
    ['/blog/ai-agents-vs-n8n-automation-for-business','AI Agents or n8n?','Compare reliability, costs and approval needs.'],
    ['/whatsapp-automation','WhatsApp Workflow Automation','Automate structured customer support handoffs.']
  ],
  '/digital-strategy':[
    ['/services','Digital & Software Services','Explore product engineering and digital solutions.'],
    ['/blog/website-development-cost-bangladesh','Website Development Cost Guide','Plan scope, delivery and budgets.'],
    ['/seo-marketing','Organic Search & SEO','Learn technical foundations for search visibility.']
  ],
  '/ui-ux-3d-design':[
    ['/web-development','Web Development','Pair product design with reliable engineering.'],
    ['/website-redesign','Website Redesign','Improve information architecture and usability.'],
    ['/services','UI/UX, Software & AI Services','Explore Appiex digital capabilities.']
  ],
  '/partners':[
    ['/web-development','White-Label Web Development','Add custom engineering capacity to client projects.'],
    ['/ai-automation','White-Label AI Automation','Plan workflow integrations with human review.'],
    ['/services','Explore All Services','Find a delivery fit for agency clients.']
  ],
  '/refer':[
    ['/services','Services Eligible for Referrals','Review our development, SEO, design and AI capabilities.'],
    ['/web-development','Website Development','Refer clients needing websites or portals.'],
    ['/ai-automation','AI Automation','Refer businesses seeking workflow automation.']
  ],
  '/blog':[
    ['/blog/website-development-cost-bangladesh','Website Development Costs','Understand scope and local market pricing.'],
    ['/blog/ai-agents-vs-n8n-automation-for-business','AI Agents vs n8n','Choose an automation architecture.'],
    ['/blog/technical-seo-checklist-for-business-websites','Technical SEO Checklist','Review practical code-level SEO foundations.']
  ]
};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const dec=s=>String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const metaContent=t=>t.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i)?.[2]||'';
function setMeta(html,keyType,key,value){
  let exists=false;
  html=html.replace(/<meta\b[^>]*>/gi,function(tag){
    const m=tag.match(new RegExp('\\b'+keyType+'\\s*=\\s*(["\\x27])([^"\\x27]+)\\1','i'));
    if(!m||m[2].toLowerCase()!==key.toLowerCase())return tag;
    exists=true;
    return /\bcontent\s*=/i.test(tag)
      ?tag.replace(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i,'content="'+esc(value)+'"')
      :tag.replace(/\/?>$/,' content="'+esc(value)+'">');
  });
  return exists?html:html.replace(/<\/head>/i,'<meta '+keyType+'="'+key+'" content="'+esc(value)+'">\n</head>');
}
function relativeFile(u){
  const p=new URL(u).pathname;
  return (p==='/'?'index':p.slice(1))+'.html';
}
let changed=0,metadata=0,linked=0;
for(const url of urls){
  const page=new URL(url).pathname;
  const file=relativeFile(url);
  if(!fs.existsSync(file))throw Error('Missing page '+file);
  const original=fs.readFileSync(file,'utf8');
  let html=original;
  const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';
  const canonical=head.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0]||'';
  if(!canonical.includes('href="'+url+'"'))throw Error('Canonical mismatch '+page);
  if(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(head))
    throw Error('Sitemap contains noindex page '+page);
  if(updates[page]?.title){
    const t=updates[page].title;
    html=html.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/i,function(_all,open,close){return open+esc(t)+close});
  }
  let title=dec(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').trim();
  if(!title)throw Error('Missing title '+page);
  const descTag=html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i)?.[0];
  if(!descTag)throw Error('Missing meta description '+page);
  const desc=updates[page]?.description||dec(metaContent(descTag));
  if(desc.length<45)throw Error('Too-short description '+page);
  if(updates[page]?.description)html=setMeta(html,'name','description',desc);
  html=setMeta(html,'property','og:title',title);
  html=setMeta(html,'property','og:description',desc);
  html=setMeta(html,'name','twitter:title',title);
  html=setMeta(html,'name','twitter:description',desc);
  if(!/\bname=["']twitter:card["']/i.test(html)){
    const imageTag=html.match(/<meta\b[^>]*property=["']og:image["'][^>]*>/i)?.[0];
    html=setMeta(html,'name','twitter:card',imageTag?'summary_large_image':'summary');
    if(imageTag)html=setMeta(html,'name','twitter:image',dec(metaContent(imageTag)));
  }
  if(html!==original)metadata++;
  if(related[page]&&!html.includes('appiex-related-services__grid')){
    for(const [to] of related[page])if(!allowed.has(to))throw Error('Link target not indexable: '+to);
    const cards=related[page].map(function(item){
      return '<a href="'+item[0]+'"><strong>'+esc(item[1])+' <span aria-hidden="true">↗</span></strong><span>'+esc(item[2])+'</span></a>';
    }).join('');
    const nav='<section class="appiex-related-services" aria-label="Related Appiex services and guides"><p class="appiex-related-services__eyebrow">KEEP EXPLORING</p><h2>Related services &amp; practical guides</h2><p class="appiex-related-services__intro">Plan your next step with useful, closely related resources from Appiex.</p><nav class="appiex-related-services__grid" aria-label="Related resources">'+cards+'</nav></section>\n';
    const footer=/<footer\b/i.exec(html);
    if(!footer)throw Error('Missing footer for related links '+page);
    html=html.slice(0,footer.index)+nav+html.slice(footer.index);
    html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/styles/appiex-related-services.css?v=20261106">\n</head>');
    linked++;
  }
  if(html!==original){changed++;if(!check)fs.writeFileSync(file,html,'utf8');}
}
console.log('Sitewide SEO: '+urls.length+' public URLs; '+changed+
  (check?' pending changes':' pages refined')+'; '+metadata+' meta improvements; '+
  linked+' related-resource sections.');
if(check&&changed)process.exitCode=1;

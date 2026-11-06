import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('gaming.html','utf8');
const game = fs.readFileSync('scripts/appiex-rift-shift.js','utf8');
const css = fs.readFileSync('styles/gaming-v2.css','utf8');
const intents = JSON.parse(fs.readFileSync('scripts/data/page-search-intents.json','utf8'));
const metadata = intents['/gaming'];

assert(html.includes('id="arcade"'), 'Arcade section missing');
assert(html.includes('id="arcade-canvas"'), 'Game canvas missing');
assert(html.includes('href="#arcade"'), 'No visible navigation to playable game');
assert(html.includes('styles/gaming-v2.css'), 'Cinematic background stylesheet missing');
assert(html.includes('scripts/appiex-rift-shift.js'), 'Game JS missing');
assert(html.includes('href="https://appiex.com/gaming"'), 'Canonical must be preserved');
assert.equal((html.match(/<h1\b/gi) || []).length,1,'One H1 only');
assert(html.includes('<title>'+metadata.title.replaceAll('&','&amp;')+'</title>'), 'Title not aligned to search intent');
assert(html.includes('name="description" content="'+metadata.description+'"'), 'Description not aligned to search intent');
assert(!/meta[^>]*name="keywords"/i.test(html),'Avoid unused meta keywords');
assert(css.includes('max-width:610px')&&css.includes('prefers-reduced-motion:reduce'),'Mobile and motion styles missing');
assert(game.includes('localStorage.setItem'),'Local personal best missing');
assert(game.includes('visibilitychange'),'Pause when tab is hidden');
assert(game.includes('pointerup')&&game.includes('keydown'),'Touch and keyboard controls missing');
assert(!/fetch\s*\(|XMLHttpRequest|WebSocket|setInterval\s*\(/.test(game),'Game must not send data or run background timers');
assert(game.length < 17000, 'Game bundle exceeds source budget');
assert(css.length < 25000, 'Full gaming design CSS exceeds source budget');
const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const entry=graph.find(node=>node['@type']==='VideoGame');
assert(entry?.url==='https://appiex.com/gaming#arcade','VideoGame structured data missing');

function element(id) {
  const events=new Map();
  return {id,hidden:false,disabled:false,textContent:'',dataset:{},innerHTML:'',
    addEventListener(type,callback){events.set(type,callback);},
    emit(type,arg={}){const f=events.get(type);if(f)f(arg);},
    focus(){},getBoundingClientRect(){return {top:0,left:0,width:960,height:500};}};
}
const gameIds=['arcade-canvas','arcade-splash','arcade-result','arcade-result-title',
'arcade-result-text','arcade-start','arcade-again','arcade-score','arcade-best',
'arcade-level','arcade-pause','arcade-shield','arcade-message','arcade-share'];
const elements=new Map(gameIds.map(id=>[id,element(id)]));
const gradient={addColorStop(){}};
const ctx={createLinearGradient(){return gradient;},createRadialGradient(){return gradient;}};
for(const key of ['fillRect','strokeRect','save','restore','beginPath','moveTo','lineTo',
'closePath','fill','stroke','translate','rotate','arc','setLineDash','fillText'])ctx[key]=()=>{};
const canvas=elements.get('arcade-canvas');
canvas.getContext=()=>ctx;
const up=element('up'),down=element('down');
up.dataset.arcadeMove='-1';down.dataset.arcadeMove='1';
const documentEvents=new Map();
const doc={
 getElementById(id){return elements.get(id)||null;},
 querySelectorAll(s){return s==='[data-arcade-move]'?[up,down]:[];},
 addEventListener(type,callback){documentEvents.set(type,callback);},
 hidden:false
};
let id=0,now=1000;
const pending=new Map();
const requestAnimationFrame=cb=>{const next=++id;pending.set(next,cb);return next;};
const cancelAnimationFrame=rid=>pending.delete(rid);
const stored=new Map();
const localStorage={getItem(key){return stored.get(key)||null;},setItem(key,value){stored.set(key,String(value));}};
const runtime={document:doc,window:{matchMedia(){return {matches:false};},addEventListener(){}},
  performance:{now:()=>now},requestAnimationFrame,cancelAnimationFrame,localStorage,
  navigator:{},location:{href:'https://appiex.com/gaming'},URL,Math,Set,Map,Number,Array,
  console};
vm.runInNewContext(game,runtime,{filename:'appiex-rift-shift.js',timeout:2000});
assert.equal(elements.get('arcade-best').textContent,'00000','Initial best score');
elements.get('arcade-start').emit('click');
assert(elements.get('arcade-splash').hidden,'Start must hide intro overlay');
assert(!elements.get('arcade-pause').disabled,'Pause should enable');
assert(pending.size>0,'Gameplay animation loop must start');
canvas.emit('keydown',{key:'ArrowUp',preventDefault(){}});
canvas.emit('keydown',{key:' ',preventDefault(){}});
assert(elements.get('arcade-shield').textContent.includes('SHIELD'),'Shield not rendered');
up.emit('click');
for(let n=0;n<10;n++){
  const p=pending.entries().next();
  if(p.done) throw Error('Game loop ended unexpectedly');
  const [key,cb]=p.value;pending.delete(key);now+=16;cb(now);
}
assert(Number(elements.get('arcade-score').textContent)>0,'Endless run should accrue points');
elements.get('arcade-pause').emit('click');
assert.equal(elements.get('arcade-pause').textContent,'RESUME','Pause state');
assert.equal(pending.size,0,'Paused game must stop rendering');
elements.get('arcade-pause').emit('click');
assert.equal(elements.get('arcade-pause').textContent,'PAUSE','Resume state');
assert(pending.size>0,'Game must resume frames');
doc.hidden=true;documentEvents.get('visibilitychange')();
assert.equal(pending.size,0,'Hidden tab must stop game updates');
assert.equal(elements.get('arcade-pause').textContent,'RESUME','Hidden tab should pause');
console.log('Rift Shift QA passed: SEO, metadata, gameplay boot, keyboard, controls, shield, animation loop, pause/resume, hidden-tab and no outbound requests.');

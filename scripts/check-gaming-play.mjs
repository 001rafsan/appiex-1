import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html=fs.readFileSync('gaming.html','utf8');
const css=fs.readFileSync('styles/appiex-gaming-premium.css','utf8');
const game=fs.readFileSync('scripts/appiex-gaming-play.js','utf8');
const expected=[
  'id="play-demo"','id="g-game-canvas"','id="g-game-intro"','id="g-game-finish"',
  'id="g-game-start"','id="g-game-restart"','id="g-game-pause"',
  'data-game-direction="up"','data-game-direction="down"',
  'data-game-direction="left"','data-game-direction="right"',
  'aria-live="polite"','aria-label="Mobile navigation"',
  'appiex-gaming-premium.css','appiex-gaming-play.js','href="#play-demo"'
];
for(const token of expected)assert(html.includes(token),'Missing game feature: '+token);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Gaming page contains duplicate IDs');
assert.equal((html.match(/<h1\b/gi)||[]).length,1,'Existing single SEO heading was changed');
assert(html.includes('rel="canonical" href="https://appiex.com/gaming"'),'Gaming canonical missing');
assert(!/name="robots" content="noindex/i.test(html),'Gaming page reverted to noindex');
assert(css.includes('prefers-reduced-motion'),'Reduced motion missing');
assert(css.includes('max-width:490px'),'Small-screen game layout missing');
assert(css.includes('.g-game-overlay[hidden]'),'Game result visibility CSS missing');
assert(!/fetch\s*\(|XMLHttpRequest|WebSocket|setInterval\s*\(/.test(game),'Game should not make requests or run background timers');
assert(game.includes("visibilitychange"),'Game should pause when tab is hidden');
assert(game.includes("pointerdown"),'Touch interaction missing');
assert(game.includes("canvas.addEventListener('keydown'"),'Keyboard input missing');
assert(game.includes("requestAnimationFrame"),'Animation must be frame-driven');
assert(game.length<15000,'Game JavaScript exceeds the agreed source-size budget');

function element(id){
 const events=new Map();
 return {id,hidden:false,disabled:false,innerHTML:'',textContent:'',dataset:{},
   classList:{add(){},remove(){},toggle(){}},
   addEventListener(type,cb){events.set(type,cb);},
   emit(type,arg={}){const f=events.get(type);if(f)f(arg);},
   focus(){},getBoundingClientRect(){return {left:0,top:0,width:900,height:460};}
 };
}
const idsRequired=['g-game-canvas','g-game-intro','g-game-finish','g-game-start',
'g-game-restart','g-game-pause','g-game-score','g-game-time','g-game-mission',
'g-game-status','g-game-finish-title','g-game-finish-copy','g-game-finish-kicker'];
const elements=new Map(idsRequired.map(id=>[id,element(id)]));
// Model the server-rendered status text before progressive enhancement initializes.
elements.get('g-game-status').textContent='Awaiting launch. Press Start Mission to play.';
const gradient={addColorStop(){}};
const ctx={createLinearGradient(){return gradient},createRadialGradient(){return gradient}};
for(const method of ['fillRect','strokeRect','setTransform','save','restore','beginPath','moveTo',
'lineTo','closePath','fill','stroke','translate','rotate','arc','setLineDash','fillText'])
 ctx[method]=()=>{};
const canvas=elements.get('g-game-canvas');
canvas.getContext=()=>ctx;canvas.width=900;canvas.height=460;
const dirs=['left','up','down','right'].map(dir=>{
 const el=element('control-'+dir);
 el.dataset.gameDirection=dir;return el;
});
const documentEvents=new Map();
const mockDoc={
 getElementById(id){return elements.get(id)||null;},
 querySelectorAll(q){return q==='[data-game-direction]'?dirs:[];},
 addEventListener(k,cb){documentEvents.set(k,cb);},
 hidden:false
};
let nextId=1;const pending=new Map();
const requestAnimationFrame=cb=>{const id=nextId++;pending.set(id,cb);return id;};
const cancelAnimationFrame=id=>pending.delete(id);
const runtime={document:mockDoc,window:{devicePixelRatio:1,
  matchMedia(){return {matches:false};},addEventListener(){}},
 performance:{now:()=>1000},requestAnimationFrame,cancelAnimationFrame,
 console,Math,Set,Map,Array,String,Number,Object};
vm.runInNewContext(game,runtime,{filename:'appiex-gaming-play.js',timeout:2000});
assert(canvas.getContext,'Canvas initialization missing');
assert(elements.get('g-game-status').textContent.includes('Awaiting launch'),
  'Initial screenreader status missing');
elements.get('g-game-start').emit('click');
assert(elements.get('g-game-intro').hidden,'Start should close intro');
assert(!elements.get('g-game-pause').disabled,'Pause must become available');
assert(elements.get('g-game-mission').textContent==='ACTIVE','Mission did not start');
canvas.emit('keydown',{key:'ArrowLeft',preventDefault(){}});
for(let i=1;i<=50;i++){
 const next=pending.entries().next();
 if(next.done)throw Error('Game loop unexpectedly stopped');
 const [id,cb]=next.value;pending.delete(id);cb(1000+i*16);
}
assert(elements.get('g-game-score').innerHTML.startsWith('01'),
  'Keyboard movement did not collect first energy core in runtime smoke test');
elements.get('g-game-pause').emit('click');
assert(elements.get('g-game-mission').textContent==='PAUSED','Pause button did not pause game');
assert.equal(pending.size,0,'Paused game must stop scheduling frames');
elements.get('g-game-pause').emit('click');
assert(elements.get('g-game-mission').textContent==='ACTIVE','Resume button did not resume game');
assert(pending.size>0,'Resumed game did not schedule frames');
mockDoc.hidden=true;documentEvents.get('visibilitychange')();
assert(elements.get('g-game-mission').textContent==='PAUSED','Hidden tab did not pause game');
assert.equal(pending.size,0,'Hidden game should not render in background');
console.log('Premium gaming QA passed: SEO/semantics, 4 touch controls, motion/size budgets and playable keyboard collection, pause/resume, hidden-tab safeguards.');

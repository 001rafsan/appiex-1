/* RIFT SHIFT — original Appiex endless lane-dodger.
 * No account, telemetry, network calls, external game engine or copyrighted assets.
 * 3 lanes, adaptive hazards, collectibles, a rechargeable shield and local personal best.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('arcade-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const el = {
    splash: $('arcade-splash'), result: $('arcade-result'), resultTitle: $('arcade-result-title'),
    resultText: $('arcade-result-text'), start: $('arcade-start'), again: $('arcade-again'),
    score: $('arcade-score'), best: $('arcade-best'), level: $('arcade-level'),
    pause: $('arcade-pause'), shield: $('arcade-shield'), message: $('arcade-message'),
    share: $('arcade-share')
  };
  if (!ctx || Object.values(el).some(value => !value)) return;

  const W = 960, H = 500, playerX = 178, lanes = [174, 270, 366];
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const rand = (a,b) => Math.random() * (b-a) + a;
  const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
  let best = 0;
  try { best = Math.max(0,Math.floor(Number(localStorage.getItem('appiex-rift-shift-best-v1')) || 0)); } catch {}
  let raf = 0, last = 0, active = false, paused = false, frameTime = 0, startPoint = null;
  let time = 0, points = 0, gems = 0, combo = 0, level = 1;
  let lane = 1, shipY = lanes[1], spawnIn = 1, cooldown = 0, invulnerable = 0;
  let hazards = [], pickups = [], sparks = [], flashes = [], waves = 0;
  let resultScore = 0;

  function say(message) { el.message.textContent = message; }
  function saveBest() {
    if (points <= best) return false;
    best = points;
    try { localStorage.setItem('appiex-rift-shift-best-v1', String(best)); } catch {}
    return true;
  }
  function updateHud() {
    el.score.textContent = String(points).padStart(5, '0');
    el.best.textContent = String(best).padStart(5, '0');
    el.level.textContent = String(level).padStart(2, '0');
    el.shield.disabled = !active || paused || cooldown > 0;
    el.shield.textContent = cooldown > 0 ? 'SHIELD ' + Math.ceil(cooldown) + 's' : 'SHIELD / SPACE';
  }
  function burst(x, y, color, n=12) {
    if (reduced) return;
    for (let i=0; i<n && sparks.length<100; i++) {
      const angle=rand(0,Math.PI*2), speed=rand(40,170);
      sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:rand(.25,.7),max:.7,color});
    }
  }
  function nextLane(direction) {
    if (!active || paused) return;
    const next = clamp(lane+direction,0,2);
    if (next !== lane) {
      lane = next;
      burst(playerX-18,shipY,'#d6c6cf',4);
    }
  }
  function shield() {
    if (!active || paused || cooldown > 0) return;
    invulnerable = .85;
    cooldown = 8;
    burst(playerX,shipY,'#fff0f3',26);
    say('Pulse shield activated. You are protected briefly.');
    updateHud();
  }
  function spawnWave() {
    waves++;
    const safe = Math.floor(rand(0,3));
    const count = time > 20 && Math.random() > .48 ? 2 : 1;
    const blocked = [0,1,2].filter(n=>n!==safe);
    if (count === 1) blocked.splice(Math.floor(rand(0,2)),1);
    for(const at of blocked) hazards.push({x:W+65, lane:at, phase:rand(0,7), passed:false});
    // The reward always appears in an open lane; a two-hazard wave has one route.
    if (Math.random() > .23) pickups.push({x:W+65+rand(6,55), lane:safe, phase:rand(0,7)});
    spawnIn = clamp(1.18 - time*.005, .66, 1.18);
  }
  function reset() {
    cancelAnimationFrame(raf);
    active=true; paused=false; frameTime=0; time=0; points=0; gems=0; combo=0;
    level=1; lane=1; shipY=lanes[1]; spawnIn=1.35; cooldown=0; invulnerable=0;
    waves=0; hazards=[]; pickups=[]; sparks=[]; flashes=[];
    el.splash.hidden=true;el.result.hidden=true;el.pause.disabled=false;el.pause.textContent='PAUSE';
    say('Rift Shift running. Switch lanes to dodge hazards and collect energy.');
    updateHud(); canvas.focus({preventScroll:true});
    last=performance.now();draw(0);raf=requestAnimationFrame(loop);
  }
  function pause(force=false) {
    if(!active) return;
    paused=force?true:!paused;
    el.pause.textContent=paused?'RESUME':'PAUSE';
    if(paused) {
      cancelAnimationFrame(raf);
      say('Paused. Press Resume or P to continue.');
      draw(time);
    } else {
      say('Rift Shift resumed. Stay sharp.');
      last=performance.now();
      raf=requestAnimationFrame(loop);
    }
    updateHud();
  }
  function end() {
    active=false;paused=false;cancelAnimationFrame(raf);
    const record=saveBest();
    resultScore=points;
    el.pause.disabled=true;
    el.resultTitle.textContent=record?'NEW PERSONAL BEST':'RUN COMPLETE';
    el.resultText.textContent='Score '+points.toLocaleString()+' · '+gems+' energy collected · '+Math.floor(time)+'s survived. '+(record?'Your record is saved on this device.':'Can you beat your record?');
    el.result.hidden=false;
    say('Game over. Scored '+points+'. '+(record?'New best score.':'Try again to beat '+best+'.'));
    updateHud();
    el.again.focus({preventScroll:true});
  }
  function tick(dt) {
    time+=dt;
    level=1+Math.floor(time/16);
    const speed=clamp(300+time*9,300,690);
    shipY+=(lanes[lane]-shipY)*Math.min(1,dt*18);
    points+=Math.floor(20*dt+1.1);
    cooldown=Math.max(0,cooldown-dt);
    invulnerable=Math.max(0,invulnerable-dt);
    spawnIn-=dt;
    if(spawnIn<=0)spawnWave();
    for(const a of hazards) {
      a.x-=speed*dt;
      if(!a.passed&&a.x<playerX-35){a.passed=true;points+=12;}
      if(Math.abs(a.x-playerX)<35&&Math.abs(lanes[a.lane]-shipY)<34) {
        if(invulnerable>0) {
          a.x=-100;points+=40;burst(playerX,shipY,'#ffccd3',22);
        } else {
          burst(playerX,shipY,'#ff3654',30);
          end();return;
        }
      }
    }
    for(const g of pickups) {
      g.x-=speed*dt;
      if(Math.abs(g.x-playerX)<35&&Math.abs(lanes[g.lane]-shipY)<35) {
        g.x=-200;gems++;combo=Math.min(combo+1,5);
        points+=90*combo;
        burst(playerX,shipY,'#f5d5ba',20);
        if(gems%4===0)say(gems+' energy collected. Combo ×'+combo+'.');
      } else if(g.x<playerX-40&&g.x>0) combo=0;
    }
    hazards=hazards.filter(x=>x.x>-90);
    pickups=pickups.filter(x=>x.x>-90);
    for(const s of sparks) {s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;}
    sparks=sparks.filter(s=>s.life>0);
    updateHud();
  }
  function line(x1,y1,x2,y2,color,width=1) {
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  function glow(x,y,r,color) {
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color);g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function draw(t) {
    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#07080d');bg.addColorStop(.55,'#100c12');bg.addColorStop(1,'#07080c');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    glow(W*.7,210,420,'rgba(172,22,54,.10)');
    glow(170,380,300,'rgba(89,65,87,.09)');
    // Minimal architectural tunnel with a shallow perspective vanishing point.
    ctx.save();
    ctx.globalAlpha=.65;
    for(let i=0;i<18;i++){
      const x=((i*94-(t*135)%94)+W+94)%(W+94)-44;
      line(x,96,x+125,H-54,'rgba(255,87,112,.09)',1);
    }
    ctx.restore();
    for(const y of [128,222,316,410]) {
      line(0,y,W,y,'rgba(255,255,255,.11)');
    }
    for(const y of lanes) {
      ctx.setLineDash([18,26]);ctx.lineDashOffset=-(t*170)%44;
      line(44,y+42,W-34,y+42,'rgba(255,113,137,.12)');
      ctx.setLineDash([]);
    }
    line(48,96,W-48,96,'rgba(255,255,255,.15)');
    line(48,410,W-48,410,'rgba(255,255,255,.15)');
    ctx.fillStyle='#c5acb4';ctx.font='600 12px Arial';ctx.letterSpacing='1px';
    ctx.fillText('RIFT / 03-LANE SECTOR',48,58);
    ctx.textAlign='right';ctx.fillStyle='#f36d83';
    ctx.fillText('APPIEX   //   ARCADE 001',W-48,58);
    ctx.textAlign='left';
    for(let i=0;i<3;i++){
      ctx.fillStyle='rgba(255,255,255,.27)';ctx.font='11px monospace';
      ctx.fillText('0'+(i+1),57,lanes[i]-31);
    }
    for(const g of pickups) {
      const x=g.x,y=lanes[g.lane],r=15+Math.sin(t*4+g.phase)*2;
      glow(x,y,55,'rgba(251,217,177,.2)');
      ctx.save();ctx.translate(x,y);ctx.rotate(t*1.9+g.phase);
      ctx.fillStyle='#ffe4b8';ctx.shadowColor='#ffbf75';ctx.shadowBlur=21;
      ctx.fillRect(-r*.5,-r*.5,r,r);ctx.restore();
    }
    for(const h of hazards) {
      const x=h.x,y=lanes[h.lane];
      glow(x,y,60,'rgba(255,30,66,.24)');
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);
      ctx.shadowBlur=20;ctx.shadowColor='#fb274b';
      ctx.fillStyle='#f52b4b';ctx.fillRect(-24,-24,48,48);
      ctx.shadowBlur=0;ctx.fillStyle='#651221';ctx.fillRect(-14,-14,28,28);
      ctx.strokeStyle='#ff9aad';ctx.lineWidth=2;ctx.strokeRect(-24,-24,48,48);
      ctx.restore();
    }
    // Ship: sharp, high-contrast silhouette, not CSS illustration.
    glow(playerX,shipY,72,'rgba(255,236,236,.12)');
    if(invulnerable>0) {
      ctx.strokeStyle='rgba(255,219,224,.75)';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(playerX,shipY,38+Math.sin(t*17)*4,0,Math.PI*2);ctx.stroke();
    }
    ctx.save();ctx.translate(playerX,shipY);
    ctx.shadowBlur=16;ctx.shadowColor='#ff6176';
    ctx.fillStyle='#f7e5ea';ctx.beginPath();
    ctx.moveTo(30,0);ctx.lineTo(-23,-20);ctx.lineTo(-13,0);ctx.lineTo(-23,20);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#d82f4c';ctx.fillRect(-20,-5,14,10);
    ctx.fillStyle='#fff';ctx.fillRect(5,-3,10,6);
    if(active&&!paused){
      ctx.fillStyle='#f04b67';ctx.beginPath();ctx.moveTo(-19,-9);ctx.lineTo(-36-rand(0,14),0);ctx.lineTo(-19,9);ctx.fill();
    }
    ctx.restore();
    for(const s of sparks){
      ctx.globalAlpha=clamp(s.life/s.max,0,1);ctx.fillStyle=s.color;
      ctx.fillRect(s.x,s.y,3,3);
    }
    ctx.globalAlpha=1;
    if(paused){
      ctx.fillStyle='rgba(6,6,10,.55)';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff';ctx.font='600 48px Arial';ctx.textAlign='center';
      ctx.fillText('PAUSED',W/2,H/2);ctx.textAlign='left';
    }
    // Surface a meaningful HUD in-canvas for fullscreen-style views.
    ctx.fillStyle='rgba(255,255,255,.58)';ctx.font='600 12px Arial';
    ctx.fillText('MOVE ↑ ↓ / SWIPE',48,H-40);
    ctx.textAlign='right';ctx.fillText('SPACE = SHIELD',W-48,H-40);ctx.textAlign='left';
  }
  function loop(now) {
    if(!active||paused)return;
    const dt=clamp((now-last)/1000,0,.04);last=now;
    tick(dt);draw(time);
    if(active&&!paused)raf=requestAnimationFrame(loop);
  }
  function share() {
    const url=new URL('#arcade',location.href).href;
    const challenge='I scored '+resultScore+' on RIFT SHIFT. Can you beat me? '+url;
    if(navigator.share) {
      navigator.share({title:'RIFT SHIFT — Appiex',text:'I scored '+resultScore+' in RIFT SHIFT. Beat my score!',url}).catch(()=>{});
    } else if(navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(challenge).then(()=>say('Challenge link copied. Invite a friend!')).catch(()=>say('Share this page to challenge a friend.'));
    } else say('Share '+url+' to challenge a friend.');
  }
  el.start.addEventListener('click',reset);
  el.again.addEventListener('click',reset);
  el.pause.addEventListener('click',()=>pause());
  el.shield.addEventListener('click',shield);
  el.share.addEventListener('click',share);
  document.querySelectorAll('[data-arcade-move]').forEach(button=>{
    button.addEventListener('click',()=>{nextLane(Number(button.dataset.arcadeMove));canvas.focus({preventScroll:true});});
  });
  canvas.addEventListener('keydown',e=>{
    const key=e.key.toLowerCase();
    if(['arrowup','arrowleft','w','a'].includes(key)){e.preventDefault();nextLane(-1);}
    if(['arrowdown','arrowright','s','d'].includes(key)){e.preventDefault();nextLane(1);}
    if(key===' '){e.preventDefault();shield();}
    if(key==='p'){e.preventDefault();pause();}
  });
  canvas.addEventListener('pointerdown',e=>{
    if(!active||paused)return;
    startPoint={x:e.clientX,y:e.clientY};
    if(e.pointerType==='touch')e.preventDefault();
  },{passive:false});
  canvas.addEventListener('pointerup',e=>{
    if(!startPoint||!active||paused)return;
    const box=canvas.getBoundingClientRect();
    const dy=e.clientY-startPoint.y;
    const dir=Math.abs(dy)>18 ? Math.sign(dy) : (e.clientX-box.left<box.width/2?-1:1);
    startPoint=null;nextLane(dir);
    if(e.pointerType==='touch')e.preventDefault();
  },{passive:false});
  canvas.addEventListener('pointercancel',()=>{startPoint=null;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!paused)pause(true);});
  window.addEventListener('blur',()=>{if(active&&!paused)pause(true);});
  if('IntersectionObserver' in window){
    const watcher=new IntersectionObserver(entries=>{
      if(entries[0]&&!entries[0].isIntersecting&&active&&!paused)pause(true);
    },{threshold:0});
    watcher.observe(canvas);
  }
  el.best.textContent=String(best).padStart(5,'0');
  updateHud();draw(0);
})();

/* Signal Run — original, dependency-free Appiex arcade microgame.
   Keyboard (WASD/arrows), touch and pointer navigation. No network calls,
   third-party media, sound, analytics, or background work. */
(() => {
  'use strict';
  const get=id=>document.getElementById(id);
  const canvas=get('g-game-canvas'), intro=get('g-game-intro'), finish=get('g-game-finish');
  const start=get('g-game-start'), restart=get('g-game-restart'), pauseBtn=get('g-game-pause');
  const scoreEl=get('g-game-score'), timeEl=get('g-game-time'), missionEl=get('g-game-mission');
  const status=get('g-game-status'), finishTitle=get('g-game-finish-title');
  const finishCopy=get('g-game-finish-copy'), finishKicker=get('g-game-finish-kicker');
  if(!canvas||!intro||!finish||!start||!restart||!pauseBtn||!status)return;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx){status.textContent='Canvas unavailable. Explore the services below.';start.disabled=true;return;}
  const W=900,H=460,GOAL=5,LIMIT=60;
  const cores=[{x:230,y:205},{x:680,y:175},{x:700,y:354},{x:292,y:355},{x:470,y:102}];
  const stars=Array.from({length:60},(_,i)=>({x:(i*137.71+31)%W,y:(i*79.23+47)%H,size:i%5?1:1.8,phase:i*.73}));
  const movement={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'up',w:'up',arrowdown:'down',s:'down'};
  const held=new Set(),buttons=[...document.querySelectorAll('[data-game-direction]')];
  const player={x:W/2,y:H/2};
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
  let active=false,paused=false,score=0,remaining=LIMIT,last=0,raf=0,target=null,sparks=[];
  const announce=text=>{status.textContent=text;};
  const hud=()=>{
    scoreEl.innerHTML=String(score).padStart(2,'0')+' <small>/ 05</small>';
    timeEl.innerHTML=String(Math.max(0,Math.ceil(remaining))).padStart(2,'0')+' <small>SEC</small>';
  };
  function glow(x,y,r,color){
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  function paint(t){
    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#08111e');bg.addColorStop(.55,'#101d31');bg.addColorStop(1,'#110e29');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    glow(460,178,290,'rgba(88,101,200,.24)');
    glow(110,375,220,'rgba(31,147,126,.12)');
    glow(850,120,220,'rgba(126,78,211,.13)');
    ctx.save();ctx.strokeStyle='rgba(133,188,239,.16)';ctx.lineWidth=1;
    for(let i=-15;i<=15;i++){
      ctx.beginPath();ctx.moveTo(450+i*12,145);ctx.lineTo(450+i*108,H);ctx.stroke();
    }
    for(let i=1;i<=11;i++){
      const y=145+Math.pow(i/11,1.7)*(H-145);
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    }
    ctx.restore();
    for(const star of stars){
      ctx.globalAlpha=reduced?.55:(.32+.28*Math.sin(t*.9+star.phase));
      ctx.fillStyle='#c6defb';ctx.fillRect(star.x,star.y,star.size,star.size);
    }
    ctx.globalAlpha=1;
    ctx.save();ctx.textBaseline='top';ctx.font='700 12px monospace';
    ctx.fillStyle='rgba(170,216,225,.77)';ctx.fillText('SECTOR 07 // SIGNAL FIELD',27,25);
    ctx.fillStyle='rgba(201,251,153,.75)';ctx.textAlign='right';
    ctx.fillText('MISSION / 001',W-27,25);ctx.restore();
    if(score<GOAL){
      const core=cores[score],angle=reduced?.22:t*1.9;
      glow(core.x,core.y,73,'rgba(190,255,139,.25)');
      ctx.save();ctx.translate(core.x,core.y);ctx.rotate(angle);
      ctx.shadowColor='#c8ff83';ctx.shadowBlur=27;ctx.fillStyle='#d7ffb1';
      ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(16,0);ctx.lineTo(0,22);ctx.lineTo(-16,0);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;ctx.strokeStyle='#fffced';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='rgba(49,103,85,.4)';ctx.beginPath();
      ctx.moveTo(0,-12);ctx.lineTo(7,0);ctx.lineTo(0,12);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();
      ctx.restore();
      ctx.save();ctx.strokeStyle='rgba(219,255,177,.31)';ctx.setLineDash([5,8]);
      ctx.beginPath();ctx.arc(core.x,core.y,31,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    glow(player.x,player.y+13,82,'rgba(103,226,237,.21)');
    ctx.save();ctx.translate(player.x,player.y);
    ctx.shadowBlur=20;ctx.shadowColor='rgba(134,251,246,.8)';
    ctx.fillStyle='#d5faff';ctx.strokeStyle='#a3eff5';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,-26);ctx.lineTo(17,17);ctx.lineTo(0,9);
    ctx.lineTo(-17,17);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.fillStyle='#3b74ab';
    ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(6,4);ctx.lineTo(0,1);ctx.lineTo(-6,4);ctx.closePath();ctx.fill();
    ctx.fillStyle='#b3ff95';ctx.fillRect(-10,12,5,9);ctx.fillRect(5,12,5,9);ctx.restore();
    for(const p of sparks){
      ctx.globalAlpha=Math.max(0,p.life/.55);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3.4,3.4);
    }
    ctx.globalAlpha=1;
    ctx.save();ctx.textAlign='right';ctx.textBaseline='bottom';ctx.font='700 11px monospace';
    ctx.fillStyle='rgba(154,194,213,.78)';
    ctx.fillText('APPIEX INTERACTIVE LAB // ORIGINAL MICROGAME',W-24,H-18);ctx.restore();
    if(paused){
      ctx.fillStyle='rgba(6,10,24,.65)';ctx.fillRect(0,0,W,H);
      ctx.textAlign='center';ctx.fillStyle='#e4ffab';ctx.font='800 42px sans-serif';
      ctx.fillText('PAUSED',W/2,H/2);
      ctx.font='14px monospace';ctx.fillStyle='#dce6fb';
      ctx.fillText('SELECT RESUME TO CONTINUE',W/2,H/2+29);
    }
  }
  function fit(){
    const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.round(W*dpr),h=Math.round(H*dpr);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!active||paused)paint(performance.now()/1000);
  }
  function burst(x,y){
    if(reduced)return;
    sparks=Array.from({length:18},(_,i)=>({
      x,y,vx:Math.cos(i*2.399)*(2+i%5)*38,
      vy:Math.sin(i*2.399)*(2+i%5)*38,
      life:.55,color:i%2?'#cfff91':'#97f6f3'
    }));
  }
  function complete(won){
    active=false;paused=false;cancelAnimationFrame(raf);held.clear();target=null;
    pauseBtn.disabled=true;pauseBtn.textContent='PAUSE';
    finish.hidden=false;intro.hidden=true;
    missionEl.textContent=won?'CLEARED':'TIME UP';
    finishKicker.textContent=won?'MISSION COMPLETE / 005':'MISSION ENDED / RETRY';
    finishTitle.innerHTML=won?'WORLD <span>UNLOCKED.</span>':'READY FOR <span>ROUND TWO?</span>';
    finishCopy.textContent=won?'Five cores collected. Ready to build something bigger?':
      'You collected '+score+' of 5 energy cores. Every world begins with another attempt.';
    announce(won?'Mission complete! Five energy cores collected.':'Time is up. You collected '+score+' cores.');
    paint(performance.now()/1000);
    restart.focus({preventScroll:true});
  }
  function loop(now){
    if(!active||paused)return;
    const dt=Math.min(.045,Math.max(0,(now-last)/1000));last=now;remaining=Math.max(0,remaining-dt);
    let dx=Number(held.has('right'))-Number(held.has('left'));
    let dy=Number(held.has('down'))-Number(held.has('up'));
    if(target){
      const tx=target.x-player.x,ty=target.y-player.y,d=Math.hypot(tx,ty);
      if(d>9){dx+=tx/d;dy+=ty/d;}else target=null;
    }
    const magnitude=Math.hypot(dx,dy);
    if(magnitude){
      player.x=Math.max(25,Math.min(W-25,player.x+dx/magnitude*320*dt));
      player.y=Math.max(49,Math.min(H-26,player.y+dy/magnitude*320*dt));
    }
    if(score<GOAL&&Math.hypot(player.x-cores[score].x,player.y-cores[score].y)<38){
      burst(cores[score].x,cores[score].y);score++;
      announce(score===GOAL?'All five cores collected!':'Energy core '+score+' of 5 collected. Keep exploring.');
      if(score===GOAL){hud();complete(true);return;}
    }
    for(const p of sparks){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
    sparks=sparks.filter(p=>p.life>0);
    hud();
    if(remaining<=0){complete(false);return;}
    paint(now/1000);raf=requestAnimationFrame(loop);
  }
  function play(){
    cancelAnimationFrame(raf);
    score=0;remaining=LIMIT;last=performance.now();active=true;paused=false;
    player.x=W/2;player.y=H/2;target=null;sparks=[];held.clear();
    buttons.forEach(b=>b.classList.remove('is-held'));
    intro.hidden=true;finish.hidden=true;missionEl.textContent='ACTIVE';
    pauseBtn.disabled=false;pauseBtn.textContent='PAUSE';hud();
    announce('Mission started. Collect five energy cores before time runs out.');
    canvas.focus({preventScroll:true});paint(last/1000);
    raf=requestAnimationFrame(loop);
  }
  function togglePause(forcePause=false){
    if(!active)return;
    paused=forcePause?true:!paused;held.clear();target=null;
    pauseBtn.textContent=paused?'RESUME':'PAUSE';missionEl.textContent=paused?'PAUSED':'ACTIVE';
    announce(paused?'Mission paused. Use Resume to continue.':'Mission resumed.');
    if(paused){cancelAnimationFrame(raf);paint(performance.now()/1000);}
    else{last=performance.now();canvas.focus({preventScroll:true});raf=requestAnimationFrame(loop);}
  }
  function nudge(dir){
    const n=36;
    if(dir==='left')player.x-=n;if(dir==='right')player.x+=n;
    if(dir==='up')player.y-=n;if(dir==='down')player.y+=n;
    player.x=Math.max(25,Math.min(W-25,player.x));
    player.y=Math.max(49,Math.min(H-26,player.y));
  }
  start.addEventListener('click',play);restart.addEventListener('click',play);
  pauseBtn.addEventListener('click',()=>togglePause());
  canvas.addEventListener('keydown',e=>{
    const key=e.key.toLowerCase();
    if(key===' '||key==='p'){e.preventDefault();if(!e.repeat)togglePause();return;}
    const dir=movement[key];
    if(dir){e.preventDefault();if(active&&!paused)held.add(dir);}
  });
  canvas.addEventListener('keyup',e=>{
    const dir=movement[e.key.toLowerCase()];
    if(dir){e.preventDefault();held.delete(dir);}
  });
  canvas.addEventListener('blur',()=>held.clear());
  function point(e){
    const r=canvas.getBoundingClientRect();
    return {x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};
  }
  canvas.addEventListener('pointerdown',e=>{
    if(!active||paused)return;
    target=point(e);canvas.focus({preventScroll:true});
    if(e.pointerType==='touch')e.preventDefault();
  });
  canvas.addEventListener('pointermove',e=>{if(active&&!paused&&e.buttons)target=point(e);});
  for(const button of buttons){
    const dir=button.dataset.gameDirection;
    const clear=()=>{held.delete(dir);button.classList.remove('is-held');};
    button.addEventListener('pointerdown',e=>{
      if(!active||paused)return;
      held.add(dir);target=null;button.classList.add('is-held');
      if(e.pointerType==='touch')e.preventDefault();
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture','pointerleave'])
      button.addEventListener(type,clear);
    button.addEventListener('click',e=>{
      if(!active||paused)return;
      if(e.detail===0)nudge(dir);
      canvas.focus({preventScroll:true});
    });
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!paused)togglePause(true);});
  window.addEventListener('blur',()=>{if(active&&!paused)togglePause(true);});
  window.addEventListener('resize',fit,{passive:true});
  fit();hud();paint(0);
})();

// BORDERLAND — complete single-match tactical survival loop in a genuine 3D WebGL2 world.
(function(){'use strict';
const $=id=>document.getElementById(id),R=window.BorderRender,W=window.BorderWorld,C=R.C;
const canvas=$('world'),hud=$('overlayCanvas'),ctx=hud.getContext('2d');let renderer;
// High-quality original eight-direction human artwork composited over real 3D terrain:
// a classic pre-rendered 2.5D technique; physics and cover remain world-space 3D.
const operativeSprites=Array.from({length:8},(_,i)=>{const im=new Image();im.decoding='async';im.src='assets/operative_'+i+'.webp';return im;});
const humanSpritesReady=()=>operativeSprites.every(im=>im.complete&&im.naturalWidth>0);
function actorSpriteFrame(u){
 let fx=-Math.sin(u.yaw),fz=-Math.cos(u.yaw),vx=Math.cos(renderer.viewAngle),vz=Math.sin(renderer.viewAngle);
 const dot=fx*vx+fz*vz,cross=fz*vx-fx*vz,angle=Math.atan2(cross,dot);
 return (Math.round(angle/(Math.PI/4))+8)%8;
}

try{renderer=new R.Renderer(canvas);}catch(e){$('errorPanel').style.display='flex';$('errorText').textContent=e.message;return;}
const level=W.industrialWorld();level.mesh.upload(renderer.gl);renderer.staticMesh=level.mesh;const map=W.colliders,roofLayers=level.roofs||[];renderer.artLamps=level.lamps;renderer.artCovers=level.covers;
const col=W.col;const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),rand=W.rand,rng=W.rng;
const lerp=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const objectives=[{x:6,z:-26,name:'破译仓库终端',subtitle:'WAREHOUSE RELAY',done:false,kind:'terminal'},
 {x:20,z:28,name:'回收走私清单',subtitle:'CONTAINER YARD',done:false,kind:'intel'},
 {x:-43,z:14,name:'取得警戒密钥',subtitle:'WEST CHECKPOINT',done:false,kind:'key'}];
const escape={x:-47,z:-17,name:'西侧撤离站'};
const wp=[
 [[-38,12],[-30,17],[-21,18],[-30,17]],
 [[25,7],[18,10],[18,19],[28,22]],
 [[9,-30],[17,-28],[20,-20],[7,-22]],
 [[-27,-7],[-28,5],[-23,10],[-26,-10]],
 [[40,-20],[43,-15],[25,-15],[26,-24]],
 [[-9,27],[-20,27],[-18,37],[-8,36]],
 [[-38,-20],[-32,-18],[-32,-26],[-38,-27]]
];
let state='menu',elapsed=0,frameTime=0,last=0,lastUI=0,menuOrbit=0,deathTime=0,hitScreen=0,shake=0,noticeTimer=0;
let soundEvents=[],footstepSoundCooldown=0;
let player=null,enemies=[],shots=[],particles=[],drops=[],grenades=[],floating=[],smokes=[],traps=[],cameraTarget={x:5,z:18},cameraAngle=Math.PI/2,camTargetAngle=Math.PI/2;
let zoom=29,aim={x:0,z:0},mouse={x:innerWidth*.58,y:innerHeight*.48,down:false,inside:false};
const keys=new Set();let path=[],moveTarget=null,gameStats={shots:0,hits:0,kills:0,damage:0,looted:0,seconds:0,grade:''};
let objectiveDone=0,extraction=false,zone={x:0,z:0,r:74,active:false,countdown:155};let hazardPulse=0;let alarmLevel=0,reinforcementCount=0,hitMarker=0,footprintTimer=0;
let difficulty='normal',soundEnabled=true,musicEnabled=false,quality='high',actorVisual='model';let audio=null;
const mobile={joyPointer:null,joyX:0,joyY:0,shootPointer:null,shoot:false,dragPointer:null},isTouch='ontouchstart'in window||navigator.maxTouchPoints>0;
const arsenal=[{name:'R07 苍鹭突击步枪',sub:'5.56 × 45mm',clip:30,reserve:180,damage:22,interval:.115,spread:.038,range:39,mag:30,shots:1},
 {name:'S12 岸防霰弹枪',sub:'12 GAUGE',clip:6,reserve:36,damage:12,interval:.80,spread:.22,range:17,mag:6,shots:7},
 {name:'M01 防卫手枪',sub:'9 × 19 mm',clip:15,reserve:105,damage:18,interval:.22,spread:.072,range:24,mag:15,shots:1}];
let activeGun=0,gunState=[];
function personData(x,z,enemy=false,i=0){return {x,z,vx:0,vz:0,yaw:0,step:0,run:0,hp:enemy?68:100,maxHp:enemy?68:100,dead:false,enemy,id:i,
 ammo:24,mag:24,cd:0,reload:0,hurt:0,aim:0,alert:0,alertPos:null,patrol:0,decision:0,vision:0,path:[],pathAt:0,shooting:false,suspicion:0,fireGlow:0,
 sprint:100,stamina:100,roll:0,rollCd:0,heals:enemy?0:3,grenades:enemy?0:2,smokes:enemy?0:2,traps:enemy?0:3,stun:0,armor:enemy?0:55,crouching:false,face:0,animPhase:rng(0,TAU),lastSeen:0,cover:false,suppression:0,dying:0,enemyMag:enemy?6:0,enemyReload:0,enemyReloadCount:0,reloadCoverMoves:0};}
function format(sec){sec=Math.max(0,sec);return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(Math.floor(sec%60)).padStart(2,'0')}
function toast(text,type=''){const o=$('toast');o.textContent=text;o.className='toast show '+type;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>o.classList.remove('show'),3000);}
function audioCtx(){if(!soundEnabled)return null;try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio;}catch{return null;}}
function sfx(type){let ac=audioCtx();if(!ac)return;const n=ac.currentTime,o=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();o.connect(f).connect(g).connect(ac.destination);let pitch=160,peak=.045,d=.12;
 if(type==='shot'){pitch=96+rng(0,20);peak=.09;d=.14;o.type='sawtooth';f.frequency.value=490;}
 else if(type==='hit'){pitch=510;peak=.032;d=.07;o.type='triangle';f.frequency.value=2300;}
 else if(type==='click'){pitch=690;peak=.027;d=.045;o.type='sine';f.frequency.value=3500;}
 else if(type==='reload'){pitch=290;peak=.027;d=.17;o.type='square';f.frequency.value=1200;}
 else if(type==='pickup'){pitch=620;peak=.036;d=.19;o.type='sine';f.frequency.value=2700;}
 else if(type==='hurt'){pitch=105;peak=.065;d=.29;o.type='sawtooth';f.frequency.value=340;}
 else if(type==='boom'){pitch=68;peak=.16;d=.60;o.type='sawtooth';f.frequency.value=260;}
 else if(type==='win'){pitch=690;peak=.05;d=.42;o.type='sine';f.frequency.value=2600;}
 f.type='lowpass';o.frequency.setValueAtTime(pitch,n);o.frequency.exponentialRampToValueAtTime(Math.max(30,pitch*(type==='pickup'?1.65:.45)),n+d);g.gain.setValueAtTime(peak,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.start(n);o.stop(n+d+.025);}
function reset(){player=personData(10,13);enemies=[[-38,17],[25,9],[12,-30],[-30,-7],[41,-19],[-13,28],[-35,-19]].map((p,i)=>personData(p[0],p[1],true,i));
 for(let b of enemies){b.hp=difficulty==='hard'?87:65;b.maxHp=b.hp;b.alert=0;b.route=0;}
 soundEvents=[];footstepSoundCooldown=0;gunState=arsenal.map(a=>({mag:a.clip,res:a.reserve,reload:0}));shots=[];particles=[];drops=[];grenades=[];floating=[];smokes=[];traps=[];path=[];moveTarget=null;
 for(const obj of objectives)obj.done=false;
 objectiveDone=0;extraction=false;elapsed=0;frameTime=0;deathTime=0;hitScreen=0;alarmLevel=0;reinforcementCount=0;hitMarker=0;footprintTimer=0;zone={x:-6,z:4,r:75,active:false,countdown:155};gameStats={shots:0,hits:0,kills:0,damage:0,looted:0,seconds:0,grade:''};
 cameraTarget={x:player.x,z:player.z};cameraAngle=Math.PI/2;camTargetAngle=Math.PI/2;zoom=isTouch?31:27.5;mouse.down=false;mobile.shoot=false;state='playing';
 $('startScreen').classList.add('hidden');$('resultScreen').classList.add('hidden');$('pauseScreen').classList.add('hidden');$('missionPanel').classList.remove('hidden');$('gameUI').classList.remove('hidden');document.body.classList.remove('show-mission','cinema-hud');
 $('missionTitle').textContent='潜入 · 取证 · 撤离';$('objectiveBrief').textContent='找到并回收三份关键情报';toast('行动开始：优先绕开巡逻，合理利用掩体','ok');updateUI(true);audioCtx();}
function enterMenu(){state='menu';$('startScreen').classList.remove('hidden');$('resultScreen').classList.add('hidden');$('pauseScreen').classList.add('hidden');$('gameUI').classList.add('hidden');$('missionPanel').classList.add('hidden');mouse.down=false;}
function pause(){if(state==='playing'){state='paused';$('pauseScreen').classList.remove('hidden');mouse.down=false;mobile.shoot=false;}else if(state==='paused'){state='playing';$('pauseScreen').classList.add('hidden');}}
function conclude(win,reason){if(state!=='playing')return;state=win?'won':'lost';gameStats.seconds=elapsed;gameStats.grade=win?(gameStats.kills>=5?'S':(gameStats.kills>=3?'A':'B')):'—';
 $('resultScreen').classList.remove('hidden');$('resultKicker').textContent=win?'MISSION ACCOMPLISHED':'OPERATION FAILED';$('resultTitle').textContent=win?'撤离成功':'行动失败';
 $('resultTitle').className=win?'':'failed';$('resultDescription').textContent=win?'已成功回收情报并脱离封锁区。战术行动完成。':reason;
 $('statTime').textContent=format(elapsed);$('statKills').textContent=gameStats.kills;$('statIntel').textContent=objectiveDone+'/3';$('statGrade').textContent=gameStats.grade;
 $('statShots').textContent=gameStats.shots?Math.round(gameStats.hits/gameStats.shots*100)+'%':'—';$('statDamage').textContent=gameStats.damage;
 if(win){sfx('win');try{const data=JSON.parse(localStorage.getItem('borderland_v12_best')||'null');if(!data||gameStats.kills>data.kills||gameStats.kills===data.kills&&elapsed<data.seconds){localStorage.setItem('borderland_v12_best',JSON.stringify({kills:gameStats.kills,seconds:Math.round(elapsed),grade:gameStats.grade}));}}catch(e){}}
 mouse.down=false;mobile.shoot=false;}
function collides(x,z,r=.46){if(x< -53||x>53||z< -50||z>50)return true;for(const b of map){if(Math.abs(x-b.x)<b.w/2+r &&Math.abs(z-b.z)<b.d/2+r)return true;}return false;}
function tryMove(a,dx,dz){let ox=a.x,oz=a.z;if(!collides(a.x+dx,a.z,.48))a.x+=dx;if(!collides(a.x,a.z+dz,.48))a.z+=dz;return Math.hypot(a.x-ox,a.z-oz);}
function intersectRect(x1,z1,x2,z2,box){let lo=0,hi=1,dx=x2-x1,dz=z2-z1;for(const [p,q0,q1] of [[dx,box.x-box.w/2-x1,box.x+box.w/2-x1],[dz,box.z-box.d/2-z1,box.z+box.d/2-z1]]){
 if(Math.abs(p)<1e-7){if(q0>0||q1<0)return null;}else{let aa=q0/p,bb=q1/p;if(aa>bb)[aa,bb]=[bb,aa];lo=Math.max(lo,aa);hi=Math.min(hi,bb);if(lo>hi)return null;}}
 return lo>=0&&lo<=1?lo:null;}
function lineHit(ax,az,bx,bz,minH=1.2){let best=1,bestB=null;for(let b of map){if(b.h<minH)continue;const hit=intersectRect(ax,az,bx,bz,b);if(hit!==null&&hit<best){best=hit;bestB=b;}}return {t:best,block:bestB};}
function smokeOccludes(a,b){
 for(const s of smokes){if(s.life<=0)continue;
  const dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz;
  const u=l2>0?clamp(((s.x-a.x)*dx+(s.z-a.z)*dz)/l2,0,1):0;
  const distTo=Math.hypot(a.x+dx*u-s.x,a.z+dz*u-s.z);
  if(distTo<s.radius*.78)return true;
 }return false;
}
function visible(a,b,maxDist=34){let d=dist(a,b);if(d>maxDist)return false;if(smokeOccludes(a,b))return false;return lineHit(a.x,a.z,b.x,b.z,b.crouching?.80:1.37).t>.985;}
function nearestFree(x,z){if(!collides(x,z,.45))return{x,z};for(let i=1;i<14;i++)for(let j=0;j<12;j++){let a=j/12*TAU,xx=x+Math.cos(a)*i,zz=z+Math.sin(a)*i;if(!collides(xx,zz,.45))return{x:xx,z:zz};}return{x:player.x,z:player.z};}
// Grid A* for click-to-move and guarded AI navigation
const step=2.4,GW=45,GH=43;let grid=[];
function cellToPos(cx,cz){return{x:-52+cx*step,z:-50+cz*step};}
function validCell(cx,cz){return cx>=0&&cz>=0&&cx<GW&&cz<GH&&grid[cz]?.[cx];}
function closestCell(x,z){let cx=clamp(Math.round((x+52)/step),0,GW-1),cz=clamp(Math.round((z+50)/step),0,GH-1);if(validCell(cx,cz))return{cx,cz};
 for(let rad=1;rad<13;rad++)for(let i=-rad;i<=rad;i++)for(let j=-rad;j<=rad;j++){if(validCell(cx+i,cz+j))return{cx:cx+i,cz:cz+j};}return{cx,cz};}
function initNav(){grid=[];for(let z=0;z<GH;z++){let row=[];for(let x=0;x<GW;x++){let p=cellToPos(x,z);row.push(!collides(p.x,p.z,.69));}grid.push(row);}}
function searchPath(from,to){let a=closestCell(from.x,from.z),b=closestCell(to.x,to.z),id=(x,z)=>x+z*GW,S=id(a.cx,a.cz),T=id(b.cx,b.cz);
 if(S===T)return[{x:to.x,z:to.z}];let opened=[{i:S,x:a.cx,z:a.cz,g:0,f:0}],prev=new Int32Array(GW*GH).fill(-1),scores=new Float32Array(GW*GH).fill(99999),visited=new Uint8Array(GW*GH);scores[S]=0;let count=0;
 while(opened.length&&count++<4500){let idx=0;for(let i=1;i<opened.length;i++)if(opened[i].f<opened[idx].f)idx=i;let cur=opened.splice(idx,1)[0];if(visited[cur.i])continue;visited[cur.i]=1;
 if(cur.i===T){let out=[],p=T;while(p!==-1&&out.length<500){out.push(cellToPos(p%GW,Math.floor(p/GW)));p=prev[p];}out.reverse();out.push(nearestFree(to.x,to.z));return out;}
 for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){if(!dx&&!dz)continue;let x=cur.x+dx,z=cur.z+dz;if(!validCell(x,z)||visited[id(x,z)])continue;
 if(dx&&dz&&(!validCell(cur.x+dx,cur.z)||!validCell(cur.x,cur.z+dz)))continue;
 let ni=id(x,z),g=cur.g+(dx&&dz?1.414:1);if(g>=scores[ni])continue;scores[ni]=g;prev[ni]=cur.i;opened.push({i:ni,x,z,g,f:g+Math.hypot(x-b.cx,z-b.cz)});
 }}return [];}
initNav();
function stepPath(a,dt,speed){if(!a.path?.length)return false;while(a.path.length&&dist(a,a.path[0])<.9)a.path.shift();if(!a.path.length)return false;
 let p=a.path[0],dx=p.x-a.x,dz=p.z-a.z,d=Math.hypot(dx,dz)||1,sp=Math.min(d,speed*dt);
 a.yaw=Math.atan2(-dx,-dz);let moved=tryMove(a,dx/d*sp,dz/d*sp);a.run=moved>0?Math.min(1,speed/6):0;a.step+=moved*3.25;return moved>0;}
function stepPlayer(dt){let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+mobile.joyX;
 let z=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+mobile.joyY;let d=Math.hypot(x,z);
 if(d>.12){path=[];moveTarget=null;let sprint=!player.crouching&&(keys.has('ShiftLeft')||keys.has('ShiftRight'));let sp=(player.crouching?2.4:(sprint&&player.stamina>0?8.1:5.15))*(player.roll>0?1.6:1);
 x/=d;z/=d;if(sprint&&player.stamina>0)player.stamina=Math.max(0,player.stamina-dt*20);else player.stamina=Math.min(100,player.stamina+dt*15);
 let moved=tryMove(player,x*dt*sp,z*dt*sp);player.step+=moved*3.5;
 footstepSoundCooldown-=dt;if(moved>.015&&footstepSoundCooldown<=0){emitNoise(player.x,player.z,sprint?15:(player.crouching?3.4:7.5),'footstep');footstepSoundCooldown=sprint?.27:(player.crouching?.75:.43);}player.run=lerp(player.run,sp/8.1,dt*11);
 }else{player.stamina=Math.min(100,player.stamina+dt*15);if(path.length){stepPath(player,dt,5.0);}else player.run=lerp(player.run,0,dt*8);}
 player.roll=Math.max(0,player.roll-dt);player.rollCd=Math.max(0,player.rollCd-dt);player.hurt=Math.max(0,player.hurt-dt);player.cd=Math.max(0,player.cd-dt);player.fireGlow=Math.max(0,player.fireGlow-dt);
 for(let i=0;i<gunState.length;i++)if(gunState[i].reload>0){gunState[i].reload=Math.max(0,gunState[i].reload-dt);if(gunState[i].reload===0){let gun=gunState[i],def=arsenal[i],amount=Math.min(def.clip-gun.mag,gun.res);gun.mag+=amount;gun.res-=amount;sfx('reload');toast('换弹完成','ok');}}
 aim=renderer.screenToFloor(mouse.x,mouse.y);if(!mouse.inside||mobile.shoot){let enemy=enemies.filter(b=>!b.dead&&dist(b,player)<25&&visible(b,player)).sort((a,b)=>dist(a,player)-dist(b,player))[0];
 aim=enemy?{x:enemy.x,z:enemy.z}:{x:player.x+Math.sin(-player.yaw)*9,z:player.z+Math.cos(-player.yaw)*9};}
 if(Math.hypot(aim.x-player.x,aim.z-player.z)>.1)player.yaw=Math.atan2(-(aim.x-player.x),-(aim.z-player.z));
 if((mouse.down||mobile.shoot||keys.has('Space'))&&state==='playing')fire(player,aim);
 player.reload = gunState[activeGun].reload;
 for(let i=0;i<objectives.length;i++){let o=objectives[i];if(!o.done&&dist(player,o)<2.3){if(keys.has('KeyE')||mobile.interact){activateObjective(o);mobile.interact=false;}break;}}
 if(objectiveDone===3&&dist(player,escape)<3.3&&(keys.has('KeyE')||mobile.interact)){conclude(true);mobile.interact=false;}
 if(!player.dead&&player.hp<=0){player.dead=true;conclude(false,'遭遇敌方火力压制，行动员失去战斗能力。');}
 if(zone.active&&Math.hypot(player.x-zone.x,player.z-zone.z)>zone.r){player.hp=Math.max(0,player.hp-dt*3.5);hazardPulse=.5;}
}
function activateObjective(o){if(o.done)return;o.done=true;objectiveDone++;gameStats.looted++;alarmLevel=Math.min(100,alarmLevel+24);sfx('pickup');toast('获得关键情报 · '+o.name,'ok');floating.push({x:o.x,z:o.z,life:1.5,text:'已回收 +1',color:'#d4f7b0'});
 if(objectiveDone===3){extraction=true;toast('三份情报齐全！前往西侧撤离点','ok');$('objectiveBrief').textContent='前往西侧绿色撤离信标';}
 spawnReinforcements(objectiveDone===3?1:2);
}
function spawnReinforcements(amount){
 const candidates=[[-46,-38],[46,42],[48,-42],[-46,38],[15,45],[48,12],[-9,-40]];
 let created=0;for(let k=0;k<candidates.length&&created<amount;k++){
  let pt=candidates[(reinforcementCount+k*2)%candidates.length];if(Math.hypot(player.x-pt[0],player.z-pt[1])<21)continue;
  const safe=nearestFree(pt[0],pt[1]);let id=enemies.length,b=personData(safe.x,safe.z,true,id);b.hp=difficulty==='hard'?92:62;b.maxHp=b.hp;b.alert=3.4;b.alertPos={x:player.x,z:player.z};b.suspicion=1;b.decision=.1;b.patrol=0;enemies.push(b);created++;
 }
 reinforcementCount+=created;
 if(created){toast('⚠ 警戒升级 · 敌方增援 '+created+' 人','danger');sfx('hurt');}
}

// Enemy fire discipline: finite magazines and an interruptible, visible reload window.
function advanceEnemyWeapon(bot,dt){
 if(!bot.enemy||bot.dead)return;
 if(bot.enemyReload>0){
  bot.enemyReload=Math.max(0,bot.enemyReload-dt);
  if(bot.enemyReload===0)bot.enemyMag=6;
 }
}
function fire(who,at){if(who.dead||who.cd>0)return;
 if(who.enemy){
  if(who.enemyReload>0)return;
  if(who.enemyMag<=0){who.enemyReload=1.85;who.enemyReloadCount++;who.cd=.12;return;}
  who.enemyMag--;
 }
 const isEnemy=who.enemy,idx=isEnemy?0:activeGun,def=arsenal[idx];if(!isEnemy){let gun=gunState[idx];if(gun.reload>0)return;if(gun.mag<=0){reload();return;}gun.mag--;}who.cd=(isEnemy?rng(.59,1.1):def.interval);who.shooting=true;who.fireGlow=.14;
 const muzzlePos=!isEnemy?window.BorderlandWeapon?.muzzle?.(who,idx):null;const muzzleDist=isEnemy?1.05:(idx===2?.85:1.4);
 const fx=muzzlePos?.x??who.x-Math.sin(who.yaw)*muzzleDist, fz=muzzlePos?.z??who.z-Math.cos(who.yaw)*muzzleDist, fy=muzzlePos?.y??1.42;
 for(let m=0;m<(isEnemy?3:(idx===1?7:5));m++)spawnParticle(fx,fz,fy,'muzzle',{vx:rng(-.9,.9),vy:rng(-.1,1.2),vz:rng(-.9,.9),life:rng(.05,.14),max:.14,size:idx===1?1.22:.95});
 if(!isEnemy)emitNoise(who.x,who.z,activeGun===1?41:(activeGun===2?24:34),'gunshot');
 if(!isEnemy){gameStats.shots++;shake=Math.max(shake,.09);sfx('shot');}else{if(dist(player,who)<27)sfx('shot');}
 let dx=at.x-who.x,dz=at.z-who.z,d=Math.hypot(dx,dz)||1,base=Math.atan2(dz,dx),count=isEnemy?1:def.shots,anyHit=false;
 for(let j=0;j<count;j++){
  let spread=isEnemy?((difficulty==='hard'?.12:.22)+(who.suppression||0)*.22):(def.spread*(1+(who.run||0)*.55)*(who.crouching?.70:1)),angle=base+rng(-spread,spread),range=isEnemy?31:def.range;
  let ex=who.x+Math.cos(angle)*range,ez=who.z+Math.sin(angle)*range;
  // Low-stance targets can be protected by waist-high hard cover.
  // Projectiles still collide with world geometry before damage resolution.
  let hit=lineHit(who.x,who.z,ex,ez,isEnemy&&player.crouching?.80:1.30),len=range*hit.t,hurt=null;
  const targets=isEnemy?[player]:enemies;
  for(let target of targets){if(target.dead||target===who)continue;
   let vx=target.x-who.x,vz=target.z-who.z,dot=vx*Math.cos(angle)+vz*Math.sin(angle);if(dot<0||dot>len)continue;
   let perp=Math.abs(vx*Math.sin(angle)-vz*Math.cos(angle));if(perp<.55&&dot<len){len=dot;hurt=target;}else if(perp<2.1&&dot<len+1&&target.enemy&&!isEnemy){target.suppression=Math.min(1.5,(target.suppression||0)+.24);}
  }
  ex=who.x+Math.cos(angle)*len;ez=who.z+Math.sin(angle)*len;
  shots.push({ax:fx,az:fz,bx:ex,bz:ez,life:.11,max:.11,enemy:isEnemy});
  if(hurt){let dmg=isEnemy?(difficulty==='hard'?15:9):(def.damage*(.88+rng(0,.25)));damage(hurt,dmg,who);if(!isEnemy){anyHit=true;hitMarker=.23;}}
  else if(len<range-1){for(let k=0;k<4;k++)spawnParticle(ex,ez,1.2,hit.block&&['building','warehouse','cover'].includes(hit.block.kind)?'dust':hit.block&&hit.block.kind==='crate'?'splinter':'spark',{vx:rng(-2.2,2.2),vy:rng(.5,2.1),vz:rng(-2.2,2.2),life:rng(.18,.46),size:hit.block&&['building','warehouse','cover'].includes(hit.block.kind)?1.25:.95});if(hit.block&&isEnemy&&Math.random()<.16)spawnParticle(ex,ez,1,'spark');}
 }
 if(!isEnemy&&anyHit)gameStats.hits++;
 if(isEnemy){who.alert=3.5;who.lastSeen=elapsed;}else{alarmLevel=Math.min(100,alarmLevel+.55);for(let b of enemies){if(b.dead)continue;if(dist(b,player)<30){b.alert=Math.max(b.alert,5);b.alertPos={x:player.x,z:player.z};}}}
}
function damage(target,damage,source){if(target.dead)return;let received=damage;if(!target.enemy&&target.armor>0){let soaked=Math.min(target.armor,damage*.52);target.armor-=soaked;received=damage-soaked*.54;}
 target.hp-=received;target.hurt=.22;for(let j=0;j<7;j++)spawnParticle(target.x,target.z,1,'hit',{vx:rng(-1.5,1.5),vy:rng(.7,2.4),vz:rng(-1.5,1.5),life:rng(.18,.42),size:1.0});floating.push({x:target.x+rng(-.3,.3),z:target.z+rng(-.3,.3),y:2.7,life:.85,text:String(Math.ceil(received)),color:target.enemy?'#ffe5b6':'#ff7c74'});
 if(!target.enemy){hitScreen=Math.min(.65,hitScreen+.22);sfx('hurt');}else if(!source.enemy){gameStats.damage+=Math.round(received);sfx('hit');}
 if(target.hp<=0){target.hp=0;target.dead=true;target.dying=1.4;if(target.enemy){gameStats.kills++;drops.push({x:target.x,z:target.z,type:rand()<.58?'ammo':'med',taken:false});toast('敌方单位已被清除  +1','ok');}else conclude(false,'行动员阵亡，未能安全撤离。');}
}
function heal(){if(state!=='playing'||player.heals<=0||player.hp>=100||player.dead)return;player.hp=clamp(player.hp+49,0,100);player.heals--;sfx('pickup');toast('使用急救包，恢复 49 生命值','ok');}
function reload(){if(state!=='playing')return;let g=gunState[activeGun],def=arsenal[activeGun];if(g.reload>0||g.mag===def.clip||g.res===0)return;g.reload=activeGun===0?1.65:(activeGun===1?2.6:1.25);sfx('click');toast('正在更换弹匣…');}
function grenade(){if(state!=='playing'||player.grenades<1)return;player.grenades--;let at=renderer.screenToFloor(mouse.x,mouse.y);let dx=at.x-player.x,dz=at.z-player.z,d=Math.hypot(dx,dz)||1,amount=Math.min(d,12);
 grenades.push({x:player.x,z:player.z,dx:dx/d*amount,dz:dz/d*amount,life:1.15,age:0,targetX:player.x+dx/d*amount,targetZ:player.z+dz/d*amount});sfx('click');toast('破片手雷投出');}
function layTrap(){
 if(state!=='playing'||player.traps<=0||player.dead)return;
 let tx=player.x-Math.sin(player.yaw)*1.35,tz=player.z-Math.cos(player.yaw)*1.35;
 if(collides(tx,tz,.30)){tx=player.x;tz=player.z;}
 player.traps--;traps.push({x:tx,z:tz,arm:.9,life:75,phase:Math.random()*TAU});
 sfx('click');toast('捕兽夹已布设 · 敌人靠近自动触发','ok');
}
function throwSmoke(){
 if(state!=='playing'||player.smokes<=0||player.dead)return;
 const at=renderer.screenToFloor(mouse.x,mouse.y);let dx=at.x-player.x,dz=at.z-player.z,d=Math.hypot(dx,dz)||1;
 const reach=Math.min(11,d);let x=player.x+dx/d*reach,z=player.z+dz/d*reach;
 player.smokes--;smokes.push({x,z,life:11,age:0,radius:5.6});sfx('boom');toast('烟幕展开：遮挡敌人视线约 11 秒','ok');
}
function roll(){if(player.rollCd>0||player.stamina<20)return;player.stamina-=20;player.roll=.38;player.rollCd=2.4;toast('战术翻滚 · 短时快速移动');}
function spawnParticle(x,z,y,kind,opts={}){particles.push({x,y,z,vx:opts.vx??rng(-4,4),vy:opts.vy??rng(.8,4.2),vz:opts.vz??rng(-4,4),life:opts.life??rng(.12,.55),max:opts.max??.55,kind,size:opts.size??1});}
// V1.5: under fire, enemies search for a nearby hard-cover position rather than
// blindly advancing. Candidate is offset to the far side of the obstacle from
// the player; line-of-sight and path feasibility are checked in world space.
function findDefensiveCover(bot){
 if(!player||!W.covers||!W.covers.length)return null;
 let best=null,bestScore=Infinity;
 for(const cover of W.covers){
  const near=Math.hypot(bot.x-cover.x,bot.z-cover.z);
  if(near>13||near<1.0)continue;
  const dx=cover.x-player.x,dz=cover.z-player.z,d=Math.hypot(dx,dz)||1;
  const candidate=nearestFree(cover.x+dx/d*1.55,cover.z+dz/d*1.55);
  if(Math.hypot(candidate.x-bot.x,candidate.z-bot.z)>15)continue;
  if(visible(player,candidate,36))continue;
  const score=near+Math.hypot(candidate.x-bot.x,candidate.z-bot.z)*.4;
  if(score<bestScore){best=candidate;bestScore=score;}
 }
 return best;
}
// Acoustic investigation: loud gunshots and sprinting reveal an approximate location,
// but never grant a perfect lock-on or permit shooting through solid cover.
function emitNoise(x,z,radius,kind){soundEvents.push({x,z,radius,kind,ttl:kind==='gunshot'?1.5:.55});if(soundEvents.length>32)soundEvents.shift();}
function hearNoise(bot,ev){const d=Math.hypot(bot.x-ev.x,bot.z-ev.z);if(d>ev.radius)return false;
 // Hard cover attenuates sound, rather than acting as an absolute sound barrier.
 const blocked=lineHit(bot.x,bot.z,ev.x,ev.z,1.25).t<.98;
 return d<=ev.radius*(blocked?.56:1);
}
function processHearing(bot){if(bot.dead||bot.stun>0)return false;
 let best=null;for(const ev of soundEvents){if(hearNoise(bot,ev)&&(!best||ev.radius>best.radius))best=ev;}
 if(!best)return false;
 bot.alert=Math.max(bot.alert,best.kind==='gunshot'?4.2:2.2);
 // Investigation targets the last sound location, not the player's live position.
 bot.alertPos={x:best.x,z:best.z};bot.decision=Math.min(bot.decision,.12);
 bot.heardKind=best.kind;return true;
}
function updateBots(dt){for(const ev of soundEvents)ev.ttl-=dt;soundEvents=soundEvents.filter(ev=>ev.ttl>0);
 for(const b of enemies){advanceEnemyWeapon(b,dt);b.suppression=Math.max(0,(b.suppression||0)-dt*.23);
 if(!b.dead){
  b.stun=Math.max(0,(b.stun||0)-dt);
  for(let i=traps.length-1;i>=0;i--){const trap=traps[i];if(trap.arm>0)continue;
   if(dist(b,trap)<1.04){damage(b,35,player);b.stun=2.25;spawnParticle(b.x,b.z,.8,'spark');traps.splice(i,1);toast('捕兽夹触发 · 敌人陷入僵直','ok');sfx('hit');break;}}
  if(b.stun>0){b.run=lerp(b.run,0,dt*8);continue;}
 }
if(b.dead){b.dying=Math.max(0,b.dying-dt);continue;}b.cd=Math.max(0,b.cd-dt);b.hurt=Math.max(0,b.hurt-dt);b.fireGlow=Math.max(0,b.fireGlow-dt);b.alert=Math.max(0,b.alert-dt);
 processHearing(b);
 let d=dist(b,player),dxp=player.x-b.x,dzp=player.z-b.z;
 const facing=(-Math.sin(b.yaw)*dxp-Math.cos(b.yaw)*dzp)/Math.max(1,d);
 const watching=facing>.27;
 const see=!player.dead && visible(b,player,player.crouching?20:28) && (d<(player.crouching?4.5:7.5)||watching||b.alert>0);
 // Actual detection time: guarded angles, stance and distance produce tactical stealth windows.
 if(see){const stealth=player.crouching?.53:player.run>.85?1.25:1;b.suspicion=Math.min(1,b.suspicion+dt*(d<8?2.0:1.05)*stealth);}
 else b.suspicion=Math.max(0,b.suspicion-dt*.43);
 if(see&&b.suspicion>.80){b.lastSeen=elapsed;b.alert=Math.max(b.alert,5);b.alertPos={x:player.x,z:player.z};}

 const alerted=b.alert>0;
 b.decision-=dt;
 if(b.decision<=0){b.decision=alerted?(b.enemyReload>0?.18:.50):1.65;
  let dst;
  if(alerted&&b.alertPos){if(see){let avoid=d<9?5:(d>19?-3:0),dx=(b.x-player.x)/Math.max(1,d),dz=(b.z-player.z)/Math.max(1,d);
    dst={x:player.x+dx*(d+avoid),z:player.z+dz*(d+avoid)};
  }else dst=b.alertPos;
  }else{let patrol=wp[b.id%wp.length],p=patrol[b.patrol%patrol.length];if(Math.hypot(p[0]-b.x,p[1]-b.z)<2.2)b.patrol=(b.patrol+1)%patrol.length;
  p=patrol[b.patrol];dst={x:p[0],z:p[1]};}
  if(alerted&&(b.suppression>.42||b.enemyReload>0)){
   const coverPoint=findDefensiveCover(b);
   if(coverPoint){dst=coverPoint;b.coverSeeking=true;if(b.enemyReload>0)b.reloadCoverMoves++;}
   else b.coverSeeking=false;
  }else b.coverSeeking=false;
  b.path=searchPath(b,dst);
 }
 if(alerted&&see){b.yaw=Math.atan2(-(player.x-b.x),-(player.z-b.z));if(d<27&&b.cd===0)fire(b,player);
  if((b.coverSeeking||d>13)&&b.path.length)stepPath(b,dt,(b.enemyReload>0?3.35:2.7)*(1-Math.min(.35,b.suppression*.3)));else{b.run=lerp(b.run,0,dt*7);b.step+=dt*.35;}
 }else if(b.path.length){stepPath(b,dt,alerted?3.7:2.5);}else b.run=lerp(b.run,0,dt*5);
 }}
function updateGrenades(dt){for(let i=grenades.length-1;i>=0;i--){let g=grenades[i];g.age+=dt;let f=clamp(g.age/.62,0,1);g.x=lerp(g.x,g.targetX,f);g.z=lerp(g.z,g.targetZ,f);g.life-=dt;if(g.life>0)continue;
 sfx('boom');shake=.5;for(let k=0;k<85;k++)spawnParticle(g.x+rng(-1.8,1.8),g.z+rng(-1.8,1.8),rng(.2,2.0),'blast');
 for(let b of enemies){if(b.dead)continue;let d=Math.hypot(b.x-g.x,b.z-g.z);if(d<5.0)damage(b,Math.max(14,85-d*16),player);}if(Math.hypot(player.x-g.x,player.z-g.z)<4.0)damage(player,19,player);
 grenades.splice(i,1);}}
function updateEffects(dt){
 for(let i=smokes.length-1;i>=0;i--){smokes[i].life-=dt;smokes[i].age+=dt;if(smokes[i].life<=0)smokes.splice(i,1);}
 for(let i=traps.length-1;i>=0;i--){traps[i].life-=dt;traps[i].arm=Math.max(0,traps[i].arm-dt);if(traps[i].life<=0)traps.splice(i,1);}
 for(let i=shots.length-1;i>=0;i--){shots[i].life-=dt;if(shots[i].life<=0)shots.splice(i,1);}
 for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=dt*8;if(p.life<=0)particles.splice(i,1);}
 for(let i=floating.length-1;i>=0;i--){let f=floating[i];f.life-=dt;f.y=(f.y||2.7)+dt*.9;if(f.life<=0)floating.splice(i,1);}
 for(let d of drops){if(d.taken||dist(player,d)>1.9)continue;if(d.type==='med'){player.heals=Math.min(5,player.heals+1);toast('拾取医疗补给','ok');}else{gunState[0].res=Math.min(260,gunState[0].res+35);toast('拾取 5.56 弹药 +35','ok');}sfx('pickup');d.taken=true;}
 hitScreen=Math.max(0,hitScreen-dt*.75);shake*=Math.max(0,1-dt*12);hazardPulse=Math.max(0,hazardPulse-dt);hitMarker=Math.max(0,hitMarker-dt);alarmLevel=Math.max(objectiveDone*15,alarmLevel-dt*.48);
 if(elapsed>zone.countdown){zone.active=true;zone.r=Math.max(14,74-(elapsed-zone.countdown)*.28);}
}
function update(dt){if(state!=='playing')return;elapsed+=dt;stepPlayer(dt);updateBots(dt);updateGrenades(dt);updateEffects(dt);
 cameraTarget.x=lerp(cameraTarget.x,player.x,Math.min(1,dt*3.5));cameraTarget.z=lerp(cameraTarget.z,player.z,Math.min(1,dt*3.5));
 if(lastUI+0.09<elapsed){lastUI=elapsed;updateUI();}}
// V1.10: deterministic articulated locomotion pose. No external character assets or license ambiguity.
// Values are in local character-space meters and can be inspected by automated tests.
function characterPose(u,time){
 const speed=Math.max(0,Math.min(1,Number(u.run)||0));
 const phase=Number(u.step)||0;
 const crouch=!!u.crouching;
 const breath=Math.sin(time*2.35+(u.enemy?1.3:0))*.014;
 const stride=Math.sin(phase)*.34*speed*(crouch?.52:1);
 const lift=Math.max(0,Math.cos(phase))*.14*speed;
 const liftOpp=Math.max(0,-Math.cos(phase))*.14*speed;
 const recoil=Math.max(0,Math.min(1,(Number(u.fireGlow)||0)*3));
 return {speed,crouch,breath,stride,lift,liftOpp,recoil,
   torsoLean:Math.min(.12,speed*.085)+(crouch?.10:0),
   shoulderKick:recoil*.12,headDrop:crouch?.32:0};
}
function unit(mesh,u,time,enemy=false){let x=u.x,z=u.z,yaw=u.yaw,bodyScale=u.crouching?1.05:1.34;let pose=characterPose(u,time),s=Math.sin(u.step),moving=u.run;let c=Math.cos(yaw),sn=Math.sin(yaw);
 let local=(lx,ly,lz)=>[x+(lx*c-lz*sn)*bodyScale,(ly+(u.dead?0:Math.sin(u.step*2)*.018*Math.min(u.run,1)))*bodyScale,z+(lx*sn+lz*c)*bodyScale];const B=(lx,ly,lz,w,h,d,color,mat=9,rot=0)=>{let p=local(lx,ly,lz);mesh.box(p[0],p[1],p[2],w*bodyScale,h*bodyScale,d*bodyScale,color,mat,yaw+rot);};
 const S=(lx,ly,lz,rx,ry,rz,color,mat=9)=>{let p=local(lx,ly,lz);mesh.sphere(p[0],p[1],p[2],rx*bodyScale,ry*bodyScale,rz*bodyScale,color,mat,10,7);};
 const beam=(a,b,width,color,mat=9)=>{let p=local(...a),q=local(...b);mesh.beam(...p,...q,width*bodyScale,color,mat);};
 let cloth=enemy?C.uniformDark:C.uniform,vest=enemy?C.enemy:C.armor,boot=C.black,skin=C.skin;
 if(u.dead){ // Fallen body geometry, lying at ground level
  B(0,.24,0,.86,.28,1.57,cloth,9);B(0,.25,.88,.5,.32,.48,enemy?C.enemy:skin,8);B(-.28,.2,-.75,.3,.27,.65,cloth,9);B(.28,.2,-.75,.3,.27,.65,cloth,9);
  if(enemy)S(.02,.17,0,.50,.08,.70,C.enemy,9);return;}
 let walk=pose.speed,l1=pose.stride,l2=-pose.stride;
 // legs are jointed, animated geometry — real 3D, not billboard dots
 for(const [side,off] of [[-1,l1],[1,l2]]){
  let sx=side*.22,up=side<0?pose.lift:pose.liftOpp,knee=[sx,.68+up*.40,off*.62],foot=[sx,.20+up,-off*.61+.05];
  beam([sx,1.11,0],knee,.32,cloth,9);S(...knee,.165,.13,.175,col(cloth,1.11),9);
  beam(knee,foot,.28,col(cloth,.86),9);B(sx,.12+up,foot[2]+.17,.33,.23,.54,boot,9);
  B(sx,.92,off*.13,.33,.25,.3,col(cloth,1.10),9);
 }
 // torso armored vest, shoulders, backpack, magazine pouches
 S(0,1.61+pose.breath,-.01+pose.torsoLean,.43,.53,.30,cloth,9);B(0,1.60,.16,.74,.70,.30,vest,9);B(0,1.80,.33,.43,.24,.06,col(vest,1.1),3);
 B(0,1.15,-.02,.74,.24,.44,C.uniformDark,9);B(0,1.33,.31,.72,.16,.12,C.black,9);
 for(let i=-1;i<=1;i++){B(i*.22,1.32,.35,.17,.24,.13,col(C.sand,enemy?.77:.94),13);}
 B(0,1.55,-.36,.65,.67,.38,enemy?C.rust:C.uniformDark,9);B(0,1.95,-.34,.43,.20,.41,C.armor,9);
 // shoulders + elbows, hands gripping rifle
 for(let side of [-1,1]){
  S(side*.49,1.84,0,.22,.23,.20,cloth,9);
  beam([side*.47,1.77,.01],[side*.53,1.50,.35],.25,cloth,9);
  S(side*.52,1.48,.36,.16,.17,.16,cloth,9);
  beam([side*.52,1.48,.36],[side*.23,1.46,.61],.18,cloth,9);
  S(side*.23,1.45,.62,.13,.125,.13,C.black,9);
 }
 // Human facial and equipment silhouette: sculpted neck, cheeks, ears, hair, helmet.
 S(0,2.10,.01,.15,.16,.15,skin,8);
 S(0,2.23-pose.headDrop+pose.breath,.015+pose.torsoLean*.35,.225,.30,.218,enemy?col(skin,.81):skin,8);
 S(-.224,2.22,.025,.075,.095,.07,skin,8);S(.224,2.22,.025,.075,.095,.07,skin,8);
 S(0,2.19,.233,.057,.08,.098,col(skin,.91),8);
 S(0,2.085,.222,.085,.028,.043,[.44,.244,.22],8);
 if(!enemy){
  S(0,2.34,-.17,.26,.23,.18,[.15,.127,.12],9);
  S(-.20,2.27,-.11,.07,.13,.10,[.18,.15,.14],9);
  S(-.23,2.11,-.21,.14,.18,.14,[.20,.155,.134],9);
  beam([-.24,2.07,-.22],[-.40,1.79,-.36],.12,[.19,.15,.14],9);
 }

 S(0,2.44,-.035,.29,.18,.29,enemy?C.black:C.armor,9);
 B(0,2.43,.235,.52,.09,.30,enemy?C.black:C.armor,9);
 B(0,2.53,.012,.46,.05,.40,enemy?C.steel:C.uniformDark,3);
 S(0,2.22,.202,.19,.12,.065,enemy?C.black:col(skin,.78),9);
 B(-.25,2.26,0,.11,.16,.19,C.black,9);B(.25,2.26,0,.11,.16,.19,C.black,9);
 // expressive facial detail and radio antenna
 S(-.081,2.225,.235,.037,.022,.018,C.black,9,6,4);S(.081,2.225,.235,.037,.022,.018,C.black,9,6,4);
 S(0,2.14,.266,.052,.020,.022,col(skin,.68),8,8,4);
 // goggles and radio antenna
 B(0,2.28,.24,.36,.09,.07,C.glass,10);
 B(-.37,2.01,-.15,.10,.42,.10,C.black,9);
 // rifle: stock, receiver, magazine, handguard, barrel & muzzle
 B(0,1.49+pose.shoulderKick,.64-pose.recoil*.10,.17,.15,.97,C.gun,3);
 B(0,1.52+pose.shoulderKick,1.20-pose.recoil*.10,.11,.11,.43,C.steel,3);
 B(0,1.49+pose.shoulderKick,1.51-pose.recoil*.10,.065,.065,.38,C.black,3);
 B(.03,1.35,.45,.14,.32,.16,C.gun,3);
 B(0,1.64,.55,.25,.07,.38,C.black,3);
 B(0,1.52,-.02,.18,.17,.45,C.gun,3);
 // Vest webbing, straps, shoulder insignia and separate plate carrier.
 for(let side of [-1,1]){B(side*.27,1.60,.319,.067,.62,.07,C.black,3);B(side*.16,1.89,.31,.13,.12,.085,C.steel,3);}
 for(let j=0;j<3;j++)B(0,1.40+j*.14,.336,.54,.026,.045,C.steel,3);
 if(enemy)B(.46,1.81,.02,.13,.15,.12,C.enemy,7);
 else{B(.4,1.84,.03,.12,.16,.15,C.gold,4);B(-.33,1.37,-.39,.17,.20,.23,C.sand,13);}
 // kit details: rolled pad, elbow plate, small hand grenades
 B(.49,1.48,.36,.23,.17,.20,C.armor,3);B(-.48,1.48,.36,.23,.17,.20,C.armor,3);
 if(!enemy)S(.33,1.36,-.39,.13,.13,.13,C.gold,4);
 if(u.hurt>0)S(0,1.45,.00,.53,.86,.49,C.enemy,7,6,5);
 if(u.fireGlow>0){let p=local(0,1.53,1.75);mesh.sphere(p[0],p[1],p[2],.32,.32,.32,C.light,7,7,5);}
}
function dynamicMeshes(t){const m=renderer.dynamicMesh;m.a.length=0;
 // occluding roofs are drawn separately and auto-hidden when the player enters the covered footprint.
 for(const r of roofLayers){if(player&&Math.abs(player.x-r.hideX)<r.hideW/2&&Math.abs(player.z-r.hideZ)<r.hideD/2)continue;m.box(r.x,r.y,r.z,r.w,r.h,r.d,r.color,r.mat,r.yaw);}
 renderer.artActors=[player,...enemies];
 // player shadow, role ring and actual 3D body
 if(player){m.cylinder(player.x,.081,player.z,.40,.014,[.14,.30,.38],9,16);if(actorVisual==='model'||!humanSpritesReady()){if(!window.BorderlandGLB?.draw(m,player,t,false))unit(m,player,t);if(window.BorderlandWeapon?.ready){window.BorderlandWeapon.draw(m,player,activeGun);}}}
 for(const b of enemies){m.cylinder(b.x,.081,b.z,.43,.014,[.13,.27,.34],9,16);if(actorVisual==='model'||!humanSpritesReady()){if(!window.BorderlandGLB?.draw(m,b,t,true))unit(m,b,t,true);}}
 for(let o of objectives){if(o.done)continue;let pulse=1+.08*Math.sin(t*2.4);m.cylinder(o.x,.12,o.z,.48*pulse,.10,C.gold,7,16);m.cylinder(o.x,.23,o.z,.32,.36,C.black,3,10);m.box(o.x,.54,o.z,.25,.22,.25,C.gold,7);}
 if(objectiveDone===3){m.cylinder(escape.x,.1,escape.z,1.52,.065,C.grass,7,22);for(let i=0;i<9;i++){let a=i/9*TAU,x=escape.x+Math.sin(a)*1.55,z=escape.z+Math.cos(a)*1.55;m.box(x,.14,z,.19,.14,.22,C.gold,7,a);}}
 for(const trap of traps){
  m.cylinder(trap.x,.13,trap.z,.49,.065,C.black,3,12);
  for(let k=0;k<8;k++){let a=k/8*TAU;let xx=trap.x+Math.sin(a)*.34,zz=trap.z+Math.cos(a)*.34;m.box(xx,.22,zz,.10,.20,.21,trap.arm>0?C.steel:C.gold,3,a);}
 }
 for(const sh of shots){m.beam(sh.ax,1.42,sh.az,sh.bx,1.22,sh.bz,.029,sh.enemy?C.enemy:C.light,7);}
 for(let p of particles){let k=clamp(p.life/p.max,0,1),r=(p.kind==='blast'?.1:(p.kind==='muzzle'?.11:(p.kind==='dust'?.08:.055)))*(p.size||1),color=C.light;
  if(p.kind==='hit')color=C.enemy;else if(p.kind==='dust')color=[.62,.62,.58];else if(p.kind==='spark')color=[1.0,.78,.46];else if(p.kind==='splinter')color=[.69,.52,.33];
  m.box(p.x,Math.max(.17,p.y),p.z,r*k,r*k,r*k,color,7);}

 for(let d of drops){if(d.taken)continue;m.box(d.x,.31,d.z,.48,.56,.48,d.type==='med'?C.white:C.gold,7);}
 for(let g of grenades){let y=.12+Math.sin(clamp(g.age/.62,0,1)*Math.PI)*2.7;m.sphere(g.x,y,g.z,.17,.17,.17,C.uniformDark,9,8,5);}
 m.upload(renderer.gl);
}
function renderOverlays(t){let ww=innerWidth,hh=innerHeight,dpr=Math.min(devicePixelRatio||1,2);if(hud.width!==Math.round(ww*dpr)||hud.height!==Math.round(hh*dpr)){hud.width=Math.round(ww*dpr);hud.height=Math.round(hh*dpr);hud.style.width=ww+'px';hud.style.height=hh+'px';}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,ww,hh);
 // Fine rain haze / motes: environmental layer drawn in actual game, not UI artwork.
 if(state==='playing'){
  ctx.save();ctx.lineWidth=.65;for(let k=0;k<75;k++){
   let xx=((k*149.7+t*(85+k%9*12))%(ww+180))-90,yy=((k*193.9+t*(170+k%13*12))%(hh+120))-60;
   ctx.strokeStyle=`rgba(173,203,211,${.023+(k%7)*.006})`;
   ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-4.0,yy+15+k%5*2);ctx.stroke();
  }ctx.restore();
 }
 if(!player)return;let pos=renderer.worldToScreen(player.x,3.6,player.z);
 // Layered fog-of-war smoke with world-space radius and depth-aware soft edges.
 for(const smoke of smokes){
  const p=renderer.worldToScreen(smoke.x,.2,smoke.z),edge=renderer.worldToScreen(smoke.x+smoke.radius,.2,smoke.z);
  const rad=Math.max(38,Math.hypot(edge.x-p.x,edge.y-p.y));
  const rise=Math.min(1,smoke.age*1.7),fade=Math.min(1,smoke.life/2);
  const grad=ctx.createRadialGradient(p.x,p.y,rad*.10,p.x,p.y,rad);
  grad.addColorStop(0,`rgba(125,146,149,${.51*rise*fade})`);
  grad.addColorStop(.56,`rgba(92,112,116,${.34*rise*fade})`);
  grad.addColorStop(1,'rgba(90,114,124,0)');
  ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(p.x,p.y,rad,rad*.51,-.23,0,TAU);ctx.fill();
 }

 if(state==='playing'){
  // Directional visibility cones provide readable stealth decisions in a real 3D level.
  for(const b of enemies){if(b.dead||dist(b,player)>28)continue;
   const center=renderer.worldToScreen(b.x,.18,b.z);let a=b.yaw;
   let left=renderer.worldToScreen(b.x-Math.sin(a-.52)*12,.17,b.z-Math.cos(a-.52)*12),right=renderer.worldToScreen(b.x-Math.sin(a+.52)*12,.17,b.z-Math.cos(a+.52)*12);
   ctx.beginPath();ctx.moveTo(center.x,center.y);ctx.lineTo(left.x,left.y);ctx.lineTo(right.x,right.y);ctx.closePath();ctx.fillStyle=b.alert?'rgba(255,77,58,.070)':'rgba(224,180,100,.034)';ctx.fill();
   if(b.suspicion>.08&&!b.alert){ctx.fillStyle='#ffda8c';ctx.fillRect(center.x-15,center.y-18,30*b.suspicion,2);}
  }
  // Thin red hostile laser shows genuine enemy line-of-sight only when alerted.
  for(const b of enemies){if(b.dead||b.alert<1||dist(b,player)>31||!visible(b,player))continue;
   const p0=renderer.worldToScreen(b.x,1.74,b.z),p1=renderer.worldToScreen(player.x,.22,player.z);
   ctx.save();ctx.strokeStyle='rgba(240,81,77,.43)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();ctx.restore();
  }
  // Tactical aim guide, indicator and impact feedback
  const ret=renderer.worldToScreen(aim.x,.2,aim.z),origin=renderer.worldToScreen(player.x,2.1,player.z);
  ctx.save();ctx.strokeStyle='rgba(185,214,229,.25)';ctx.lineWidth=1.1;ctx.setLineDash([5,8]);ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(ret.x,ret.y);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle='rgba(226,232,225,.70)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ret.x,ret.y,9,0,TAU);ctx.moveTo(ret.x-15,ret.y);ctx.lineTo(ret.x-6,ret.y);ctx.moveTo(ret.x+6,ret.y);ctx.lineTo(ret.x+15,ret.y);ctx.moveTo(ret.x,ret.y-15);ctx.lineTo(ret.x,ret.y-6);ctx.moveTo(ret.x,ret.y+6);ctx.lineTo(ret.x,ret.y+15);ctx.stroke();
  if(hitMarker>0){ctx.strokeStyle=`rgba(255,221,133,${hitMarker/.23})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(ret.x-8,ret.y-8);ctx.lineTo(ret.x-3,ret.y-3);ctx.moveTo(ret.x+8,ret.y-8);ctx.lineTo(ret.x+3,ret.y-3);ctx.moveTo(ret.x-8,ret.y+8);ctx.lineTo(ret.x-3,ret.y+3);ctx.moveTo(ret.x+8,ret.y+8);ctx.lineTo(ret.x+3,ret.y+3);ctx.stroke();}
  ctx.restore();
 }
 function label(x,y,text,color='#fff',size=12){ctx.font='700 '+size+'px system-ui, sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(3,8,12,.80)';ctx.fillText(text,x+1,y+1);ctx.fillStyle=color;ctx.fillText(text,x,y);}
 // Pre-rendered human sprite rig: eight directional poses + stride bob + cover fading.
 if(state!=='menu'&&humanSpritesReady()&&actorVisual==='sprite'){
  const drawActor=(u,enemy=false)=>{
   const frame=actorSpriteFrame(u),img=operativeSprites[frame];
   if(!img||!img.naturalWidth)return;
   const feet=renderer.worldToScreen(u.x,.14,u.z),head=renderer.worldToScreen(u.x,3.45,u.z);
   const height=Math.max(enemy?61:74,Math.abs(feet.y-head.y)*1.56)*(u.crouching?.78:1),width=height*.635;
   if(feet.x < -height||feet.x>ww+height||feet.y < -height||feet.y>hh+height)return;
   const bob=u.dead?-height*.70:Math.sin(u.step)*Math.min(1,u.run)*1.6-(u.fireGlow>0?1.5:0);
   // Actor remains subtly visible through solid high cover instead of popping/disappearing.
   let alpha=1;const dx=Math.cos(renderer.viewAngle),dz=Math.sin(renderer.viewAngle);
   for(const o of map){if(o.h<3.5||o.kind==='fence')continue;
    if(Math.abs(o.x-u.x)>13+o.w/2||Math.abs(o.z-u.z)>13+o.d/2)continue;
    const ti=intersectRect(u.x,u.z,u.x+dx*10,u.z+dz*10,o);
    if(ti!==null&&ti<.98){alpha=.27;break;}
   }
   ctx.save();ctx.globalAlpha=u.dead?.40:alpha;
   if(enemy)ctx.filter='brightness(.65) saturate(.70) sepia(.14)';
   if(u.dead){ctx.translate(feet.x,feet.y-height*.20);ctx.rotate(.9);ctx.drawImage(img,-height*.20,-width*.45,height*.6,width);}
   else if(u.roll>0){
    ctx.translate(feet.x,feet.y-height*.20);ctx.rotate(.72*Math.sin((1-u.roll/.38)*Math.PI));
    ctx.drawImage(img,-width*.5,-height*.80+bob,width,height);
   }else{
    // Articulated two-leg gait, not a static sliding portrait.
    const split=Math.floor(img.naturalHeight*.62),half=Math.floor(img.naturalWidth*.5);
    const stride=Math.sin(u.step)*Math.min(1,u.run)*3.3;
    const x0=feet.x-width*.5,y0=feet.y-height+bob;
    ctx.drawImage(img,0,0,img.naturalWidth,split,x0,y0,width,height*.62);
    ctx.drawImage(img,0,split,half,img.naturalHeight-split,x0+stride,y0+height*.62,width*.5,height*.38);
    ctx.drawImage(img,half,split,img.naturalWidth-half,img.naturalHeight-split,x0+width*.5-stride,y0+height*.62,width*.5,height*.38);
   }
   ctx.restore();
  };
  const order=[...enemies.filter(b=>dist(player,b)<42),player].sort((a,b)=>a.z-b.z);
  for(const u of order)drawActor(u,u.enemy);
 }
 if(state!=='menu'){
  let p=renderer.worldToScreen(player.x,3.65,player.z);if(p.x>=-150&&p.x<ww+150){label(p.x,p.y-4,'◆', '#f3e6bd',10);
   ctx.fillStyle='rgba(5,17,20,.68)';ctx.fillRect(p.x-28,p.y+3,56,5);ctx.fillStyle='#6bdba6';ctx.fillRect(p.x-28,p.y+3,56*player.hp/100,5);}
  for(const b of enemies){if(b.dead)continue;let p=renderer.worldToScreen(b.x,3.7,b.z);if(p.x<0||p.x>ww||p.y<0||p.y>hh)continue;
   if(dist(player,b)>35&&!b.alert)continue;label(p.x,p.y-13,b.enemyReload>0?'换弹中 · 可突进':(b.alert?'!  巡逻守卫':'巡逻守卫'),b.enemyReload>0?'#a6e8dc':(b.alert?'#f3a09a':'#c3c9c6'),11);
   ctx.fillStyle='#10191b';ctx.fillRect(p.x-23,p.y-6,46,4);ctx.fillStyle=b.alert?'#e6675c':'#b98c78';ctx.fillRect(p.x-23,p.y-6,46*b.hp/b.maxHp,4);
  }
  for(const o of objectives){if(o.done)continue;let p=renderer.worldToScreen(o.x,2.9+Math.sin(t*2)*.18,o.z);if(p.x<0||p.x>ww||p.y<0||p.y>hh)continue;
   label(p.x,p.y-12,'⌖  '+o.name,'#ffdfa0',12);label(p.x,p.y+4,Math.round(dist(player,o))+' m','#cbd4cb',10);}
  if(objectiveDone===3){let p=renderer.worldToScreen(escape.x,3.2,escape.z);label(p.x,p.y-3,'⬟  撤离区域','#a5f1b4',15);}
  for(const f of floating){let p=renderer.worldToScreen(f.x,f.y||2.9,f.z);ctx.globalAlpha=Math.min(1,Math.max(0,f.life*1.9));label(p.x,p.y,f.text,f.color,15);ctx.globalAlpha=1;}
 }
 // Hit direction vignette and hazard
 if(hitScreen>0||hazardPulse>0){let a=Math.min(.3,hitScreen*.35+hazardPulse*.28);ctx.fillStyle=`rgba(208,44,30,${a})`;ctx.fillRect(0,0,ww,hh);}
}
function minimap(){const c=$('minimap'),mc=c.getContext('2d'),w=c.width=194,h=c.height=194;mc.clearRect(0,0,w,h);mc.fillStyle='#0f1a1a';mc.fillRect(0,0,w,h);
 mc.fillStyle='#354047';mc.fillRect(0,0,w,h);const P=(x,z)=>({x:(x+57)/114*w,y:(z+53)/106*h});
 mc.fillStyle='#55605e';for(let b of map){if(b.kind==='crate'||b.kind==='cover')continue;let p=P(b.x-b.w/2,b.z-b.d/2),q=P(b.x+b.w/2,b.z+b.d/2);mc.fillRect(p.x,p.y,q.x-p.x,q.y-p.y);}
 mc.strokeStyle='rgba(214,180,124,.42)';mc.lineWidth=5;for(let [x1,z1,x2,z2] of [[-54,-19,53,-19],[-50,16,52,16],[13,-50,13,50],[-28,-50,-28,47]]){let a=P(x1,z1),b=P(x2,z2);mc.beginPath();mc.moveTo(a.x,a.y);mc.lineTo(b.x,b.y);mc.stroke();}
 if(zone.active){mc.strokeStyle='rgba(223,226,159,.85)';mc.lineWidth=1.5;let p=P(zone.x,zone.z);mc.beginPath();mc.arc(p.x,p.y,zone.r*w/114,0,TAU);mc.stroke();}
 for(const o of objectives){if(o.done)continue;let p=P(o.x,o.z);mc.fillStyle='#efbe65';mc.fillRect(p.x-3,p.y-3,6,6);}
 if(objectiveDone===3){let p=P(escape.x,escape.z);mc.fillStyle='#64f0ae';mc.beginPath();mc.arc(p.x,p.y,4,0,TAU);mc.fill();}
 for(const b of enemies){if(b.dead)continue;let p=P(b.x,b.z);mc.fillStyle=b.alert?'#ec685c':'#b66a5d';mc.fillRect(p.x-2,p.y-2,4,4);}
 if(player){let p=P(player.x,player.z);mc.fillStyle='#ffffff';mc.beginPath();mc.arc(p.x,p.y,4,0,TAU);mc.fill();mc.strokeStyle='#f5cb75';mc.beginPath();mc.arc(p.x,p.y,7,0,TAU);mc.stroke();}
}
function updateUI(force=false){if(!player)return;const gun=gunState[activeGun],def=arsenal[activeGun];
 $('lifeValue').textContent=Math.ceil(player.hp);$('lifeBar').style.width=(player.hp)+'%';$('armorBar').style.width=(player.armor/55*100)+'%';$('staminaBar').style.width=(player.stamina)+'%';
 $('weaponName').textContent=def.name;$('weaponSub').textContent=def.sub;$('ammoValue').textContent=gun.reload>0?'••':gun.mag;$('reserveValue').textContent=gun.res;$('tacticalStatus').textContent=alarmLevel>45?'◇ 交火':objectiveDone===3?'◇ 撤离中':player.crouching?'◇ 潜行':'◇ 暴露';
 $('healthItem').textContent=player.heals;$('grenadeItem').textContent=player.grenades;$('smokeItem').textContent=player.smokes;$('trapItem').textContent=player.traps;$('killsValue').textContent=gameStats.kills;$('aliveValue').textContent=enemies.filter(e=>!e.dead).length+1;
 $('timeValue').textContent=format(elapsed);$('intelValue').textContent=objectiveDone+'/3';$('zoneClock').textContent=zone.active?'毒区推进  '+Math.round(zone.r)+'m':'毒区启动  '+format(zone.countdown-elapsed);
 $('zoneClock').className=zone.active?'zone-on':'';
 const tactical=$('tacticalStatus');if(tactical){const nearby=map.some(b=>b.kind==='cover'&&Math.hypot(Math.max(0,Math.abs(player.x-b.x)-b.w/2),Math.max(0,Math.abs(player.z-b.z)-b.d/2))<1.7);tactical.textContent=nearby?'◆ 掩体附近':player.crouching?'◌ 低姿态':'◇ 暴露';tactical.dataset.cover=nearby?'yes':'no';}
 const alert=$('alertValue');if(alert){alert.textContent=alarmLevel>70?'最高警戒':alarmLevel>40?'高度警戒':alarmLevel>15?'受到关注':'隐蔽';alert.style.color=alarmLevel>40?'#ef947c':'#9ed3b1';}
 const reloadbar=$('reloadBar');if(reloadbar)reloadbar.style.width=gun.reload>0?((1-gun.reload/(activeGun===0?1.65:(activeGun===1?2.6:1.25)))*100)+'%':'0%';
 $('interactPrompt').classList.add('hidden');let text='';for(const o of objectives){if(!o.done&&dist(player,o)<3){text='拾取情报 · '+o.name;break;}}
 if(objectiveDone===3&&dist(player,escape)<4)text='安全撤离 · 完成行动';
 if(text){$('interactPrompt').classList.remove('hidden');$('interactDescription').textContent=text;}
 objectives.forEach((o,i)=>{$('obj'+i).classList.toggle('checked',o.done);$('obj'+i+'status').textContent=o.done?'已回收':'待完成';});
 $('currentZone').textContent=player.x<-24?'西侧检查站':player.x>23?'集装箱码头':player.z<-19?'北方工业区':player.z>23?'南部营地':'中央仓储区';
 if(force||Math.floor(elapsed*5)%2===0)minimap();}
function frame(ts){let t=ts/1000,dt=last?clamp(t-last,0,.050):0;last=t;frameTime+=dt;
 if(state==='menu'){menuOrbit+=dt*.055;cameraTarget.x=lerp(cameraTarget.x,1,dt*.8);cameraTarget.z=lerp(cameraTarget.z,7,dt*.8);renderer.camera([0,0,4],Math.PI/2,0.9425,34);
  renderer.dynamicMesh.a.length=0;let mesh=renderer.dynamicMesh;for(const r of roofLayers){mesh.box(r.x,r.y,r.z,r.w,r.h,r.d,r.color,r.mat,r.yaw);}unit(mesh,personData(7,17),t);mesh.upload(renderer.gl);
 }else{
  update(dt);cameraAngle=lerp(cameraAngle,camTargetAngle,Math.min(1,dt*3.6));renderer.camera([cameraTarget.x+.55+(Math.random()-.5)*shake,0,cameraTarget.z-2.9+(Math.random()-.5)*shake],cameraAngle,0.9425,zoom);
  dynamicMeshes(t);
 }
 renderer.draw(t);renderOverlays(t);requestAnimationFrame(frame);
}
// Input layer: mouse, keyboard, mobile joystick, pinchless zoom and context-menu pathfinding
window.addEventListener('resize',()=>{renderer.resize();});
window.addEventListener('blur',()=>{keys.clear();mouse.down=false;if(state==='playing')pause();});
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);
 if(e.repeat)return;
 if(e.code==='Tab'){e.preventDefault();document.body.classList.toggle('show-mission');return;}if(e.code==='Escape'){if(state==='playing'||state==='paused')pause();return;}
 if(state!=='playing')return;
 if(e.code==='KeyP')toggleVisual();if(e.code==='KeyR')reload();if(e.code==='KeyF')heal();if(e.code==='KeyH')document.body.classList.toggle('cinema-hud');if(e.code==='KeyG')grenade();if(e.code==='KeyQ')throwSmoke();if(e.code==='KeyT')layTrap();
 if(['Digit1','Digit2','Digit3'].includes(e.code)){activeGun=Number(e.code.slice(-1))-1;sfx('click');toast(arsenal[activeGun].name);updateUI(true);}
 if(e.code==='KeyC')roll();if(e.code==='KeyX'){player.crouching=!player.crouching;toast(player.crouching?'低姿态移动：降低被发现的概率':'恢复站姿');}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;mouse.x=e.clientX;mouse.y=e.clientY;mouse.inside=true;});
canvas.addEventListener('pointerenter',()=>mouse.inside=true);canvas.addEventListener('pointerleave',()=>{mouse.inside=false;mouse.down=false;});
canvas.addEventListener('pointerdown',e=>{if(state!=='playing')return;if(e.button===0){mouse.down=true;mouse.inside=true;mouse.x=e.clientX;mouse.y=e.clientY;audioCtx();}else if(e.button===2){let p=renderer.screenToFloor(e.clientX,e.clientY);moveTarget=nearestFree(p.x,p.z);path=searchPath(player,moveTarget);toast('自动前往标记位置');}});
window.addEventListener('pointerup',e=>{if(e.button===0)mouse.down=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{if(state!=='playing')return;e.preventDefault();zoom=clamp(zoom+(e.deltaY>0?1.2:-1.2),24,33);},{passive:false});
function toggleVisual(){actorVisual=actorVisual==='sprite'?'model':'sprite';$('visualBtn').textContent=actorVisual==='sprite'?'3D':'2.5D';toast(actorVisual==='model'?'显示实时三维人物':'显示8方向预渲染角色');}
const bind=(id,fn)=>{let el=$(id);if(el)el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn();});};
bind('visualBtn',toggleVisual);bind('playBtn',reset);bind('retryBtn',reset);bind('quitBtn',enterMenu);bind('pauseBtn',pause);bind('resumeBtn',pause);bind('pauseRestart',reset);bind('pauseQuit',enterMenu);bind('helpBtn',()=>{$('helpScreen').classList.remove('hidden');if(state==='playing')pause();});bind('closeHelp',()=>{$('helpScreen').classList.add('hidden');});bind('medBtn',heal);bind('grenadeBtn',grenade);bind('smokeBtn',throwSmoke);bind('trapBtn',layTrap);bind('reloadBtn',reload);bind('interactBtn',()=>{mobile.interact=true;});bind('weaponBtn',()=>{activeGun=(activeGun+1)%3;sfx('click');updateUI(true);});
bind('sfxBtn',()=>{soundEnabled=!soundEnabled;$('sfxBtn').textContent=soundEnabled?'音效：开':'音效：关';});
bind('easyBtn',()=>{difficulty='normal';$('easyBtn').classList.add('selected');$('hardBtn').classList.remove('selected');});bind('hardBtn',()=>{difficulty='hard';$('hardBtn').classList.add('selected');$('easyBtn').classList.remove('selected');});
const joy=$('joystick'),nub=$('joystickNub'),fireBtn=$('shootBtn');
function joyUpdate(e){const bb=joy.getBoundingClientRect(),x=e.clientX-(bb.left+bb.width/2),y=e.clientY-(bb.top+bb.height/2),d=Math.hypot(x,y)||1,rad=33,fac=Math.min(1,rad/d);mobile.joyX=x/d*fac;mobile.joyY=y/d*fac;nub.style.transform=`translate(${mobile.joyX*rad}px,${mobile.joyY*rad}px)`;}
joy.addEventListener('pointerdown',e=>{e.preventDefault();joy.setPointerCapture(e.pointerId);mobile.joyPointer=e.pointerId;joyUpdate(e);});
joy.addEventListener('pointermove',e=>{if(mobile.joyPointer===e.pointerId)joyUpdate(e);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(event,e=>{if(mobile.joyPointer===e.pointerId){mobile.joyPointer=null;mobile.joyX=mobile.joyY=0;nub.style.transform='translate(0,0)';}});
fireBtn.addEventListener('pointerdown',e=>{e.preventDefault();fireBtn.setPointerCapture(e.pointerId);mobile.shootPointer=e.pointerId;mobile.shoot=true;audioCtx();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])fireBtn.addEventListener(event,e=>{if(mobile.shootPointer===e.pointerId){mobile.shoot=false;mobile.shootPointer=null;}});
// Preserve deterministic end-game overlay on restart. WebGL context lost handled by page reload.
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state='paused';toast('图形上下文中断，请刷新页面重新启动','danger');});
// E2E-only hooks; unavailable in ordinary game sessions.
if((location.search.includes('e2e=1')||window.__ALLOW_TEST__))window.__BORDERLAND_TEST__={state:()=>({state,elapsed,player:{x:player?.x,z:player?.z,hp:player?.hp},intel:objectiveDone,kills:gameStats.kills,ammo:gunState[activeGun]?.mag,alarm:alarmLevel,enemies:enemies.length,alive:enemies.filter(b=>!b.dead).length,reinforcements:reinforcementCount,selectedWeapon:activeGun,weaponName:arsenal[activeGun].name,cameraElevation:renderer.elevation,cameraFov:renderer.fov*180/Math.PI,cameraZoom:zoom,renderer:renderer.software?'software-perspective-approx':'webgl2-perspective'}),characterPoseProbe:()=>({idle:characterPose({run:0,step:0,crouching:false,fireGlow:0},0),walking:characterPose({run:1,step:Math.PI/2,crouching:false,fireGlow:0},1),crouched:characterPose({run:1,step:Math.PI/2,crouching:true,fireGlow:0},1),firing:characterPose({run:0,step:0,crouching:false,fireGlow:.3},1)}),hearingProbe:()=>{const b=enemies.find(e=>!e.dead);if(!b)return null;const saved={x:b.x,z:b.z,alert:b.alert,alertPos:b.alertPos,decision:b.decision,stun:b.stun};const oldEvents=soundEvents;const near={x:b.x+2,z:b.z,radius:34,kind:'gunshot',ttl:1};soundEvents=[near];b.alert=0;b.alertPos=null;b.decision=1;b.stun=0;const heard=processHearing(b);const target=b.alertPos&&Math.hypot(b.alertPos.x-near.x,b.alertPos.z-near.z)<.01;const far={x:b.x+100,z:b.z,radius:4,kind:'footstep',ttl:1};soundEvents=[far];b.alert=0;b.alertPos=null;const silent=!processHearing(b);Object.assign(b,saved);soundEvents=oldEvents;return {heard,target,silent};},enemyWeaponProbe:()=>{const bot={enemy:true,dead:false,enemyMag:0,enemyReload:0,enemyReloadCount:0,cd:0};const old=bot.enemyMag; // Pure deterministic state-transition probe, no world side effects.
 if(bot.enemyMag<=0){bot.enemyReload=1.85;bot.enemyReloadCount++;}
 advanceEnemyWeapon(bot,1);const mid={mag:bot.enemyMag,reload:bot.enemyReload};advanceEnemyWeapon(bot,.9);
 return {initialMag:old,mid,finalMag:bot.enemyMag,finalReload:bot.enemyReload,reloadCount:bot.enemyReloadCount};},enemyWeaponStates:()=>enemies.map(b=>({id:b.id,mag:b.enemyMag,reload:b.enemyReload,reloads:b.enemyReloadCount,coverMoves:b.reloadCoverMoves,coverSeeking:!!b.coverSeeking})),reloadCoverProbe:()=>{const bot=enemies.find(b=>!b.dead);if(!bot)return null;const old={reload:bot.enemyReload,alert:bot.alert,decision:bot.decision,suppression:bot.suppression,alertPos:bot.alertPos};bot.enemyReload=1.85;bot.alert=5;bot.decision=0;bot.suppression=0;bot.alertPos={x:player.x,z:player.z};const point=findDefensiveCover(bot);const before=bot.reloadCoverMoves;updateBots(.02);const moved=bot.reloadCoverMoves>before;Object.assign(bot,{enemyReload:old.reload,alert:old.alert,decision:old.decision,suppression:old.suppression,alertPos:old.alertPos});return {candidate:point,coverCount:W.covers.length,selectedCover:!!bot.coverSeeking,movedTowardCover:moved};},stanceProbe:(a,b)=>({standing:lineHit(a.x,a.z,b.x,b.z,1.37).t,crouched:lineHit(a.x,a.z,b.x,b.z,.80).t}),coverProbe:()=>({coverCount:W.covers.length,candidates:enemies.filter(b=>!b.dead).map(b=>({id:b.id,point:findDefensiveCover(b)}))}),sampleProbe:()=>({roofPieces:roofLayers.length,hiddenRoofs:roofLayers.filter(r=>player&&Math.abs(player.x-r.hideX)<r.hideW/2&&Math.abs(player.z-r.hideZ)<r.hideD/2).length,doorFree:![[-0.0,18.7],[0,17.7]].some(([dx,dz])=>collides(22.2+dx,dz,.30)),walls:map.filter(b=>b.kind==='building'&&b.x>17&&b.x<28).length}),teleport:(x,z)=>{player.x=x;player.z=z;cameraTarget={x,z};},killAll:()=>{for(let b of enemies){b.dead=true;b.hp=0;}},end:(ok)=>conclude(ok,'测试结束')};
player=personData(10,13);renderer.camera([0,0,4],Math.PI/2,.9425,33.2);renderer.dynamicMesh.upload(renderer.gl);requestAnimationFrame(frame);
})();

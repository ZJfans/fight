from pathlib import Path
import base64
ROOT=Path(__file__).resolve().parent.parent
base=base64.b64encode((ROOT/'assets/characters/operative.glb').read_bytes()).decode('ascii')
html=r'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"><title>暮色边境 V2.4 | 角色资产交互预览</title>
<style>
:root{--bg:#0a1119;--txt:#e7edf0;--muted:#90a2ae;--a:#e2ab55}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:var(--bg);font-family:Inter,'Microsoft YaHei',system-ui,sans-serif;color:var(--txt)}canvas{width:100%;height:100%;display:block;touch-action:none}#ui{position:absolute;top:0;left:0;right:0;padding:22px 26px;pointer-events:none;background:linear-gradient(180deg,rgba(4,11,16,.90),rgba(4,11,16,0));}h1{font-weight:700;letter-spacing:3px;font-size:23px;margin:0 0 6px}.eyebrow{font-size:11px;letter-spacing:3px;color:var(--a);font-weight:700;margin-bottom:8px}.sub{color:#a1b1bb;font-size:13px;max-width:580px;line-height:1.8}.stats{display:flex;gap:11px;margin-top:16px;flex-wrap:wrap}.stat{border:1px solid rgba(210,230,235,.17);background:rgba(9,17,25,.6);padding:8px 13px;border-radius:7px;min-width:112px}.stat strong{display:block;font-size:18px;color:#dcebf1}.stat small{font-size:10px;color:#879aa6;letter-spacing:.8px}.right{position:absolute;right:25px;top:28px;text-align:right;font-size:11px;color:#b7c5cb;letter-spacing:.6px}.right strong{color:#e5b96e}.bottom{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(5,13,21,.87);border:1px solid rgba(187,201,208,.18);border-radius:12px;display:flex;gap:6px;padding:8px;pointer-events:auto;box-shadow:0 10px 30px #0008}.bottom button,.mobile button{cursor:pointer;color:#cfdee4;background:#1d303d;border:1px solid #38505c;border-radius:7px;padding:10px 15px;font-weight:650;white-space:nowrap}.bottom button:hover,.bottom button.active{background:#ac8247;color:#09121c;border-color:#e8b86d}.footer{position:absolute;bottom:92px;left:24px;color:#8195a2;font-size:11px;pointer-events:none;text-shadow:0 2px 3px #000}.hint{position:absolute;bottom:92px;right:24px;text-align:right;color:#b2c1c9;font-size:12px;line-height:1.8;text-shadow:0 2px 3px #000}.mobile{display:none}.badge{border:1px solid #725f37;color:#d8ac61;background:#2b2a25aa;border-radius:4px;padding:5px 9px;font-size:11px;display:inline-block;margin-top:8px}#error{position:absolute;top:44%;left:10%;right:10%;text-align:center;color:#ff9b82;display:none}@media(max-width:750px){#ui{padding:14px}h1{font-size:19px}.sub{font-size:11px;max-width:92%}.right{display:none}.stats{margin-top:8px}.stat{min-width:79px;padding:6px 9px}.stat strong{font-size:14px}.stat small{font-size:9px}.footer{bottom:138px}.hint{display:none}.bottom{bottom:8px;width:calc(100% - 16px);justify-content:space-between;flex-wrap:wrap;gap:4px}.bottom button{padding:7px 8px;font-size:11px;flex:1}.mobile{display:flex;position:absolute;bottom:97px;right:12px;gap:8px}.mobile button{padding:12px;font-size:13px}}
</style></head><body><canvas id="view"></canvas><div id="ui"><div class="eyebrow">DUSK FRONTIER / ASSET INTEGRATION V2.4</div><h1>暮色边境 <span style="font-weight:400;color:#9daeb9">· 战术人物</span></h1><div class="sub">原创 glTF 2.0 骨骼人物｜相同 GLB 已放入 Godot 工程。此页面用 Canvas 2D 软件渲染骨骼与网格，<b>不是 Godot Web 导出，也不是最终游戏画质</b>。</div><div class="stats"><div class="stat"><strong id="bones">—</strong><small>JOINTS / 骨骼</small></div><div class="stat"><strong id="clips">—</strong><small>ANIMATION CLIPS</small></div><div class="stat"><strong id="triangles">—</strong><small>MODEL TRIANGLES</small></div><div class="stat"><strong id="current">Idle</strong><small>当前动作</small></div></div><div class="badge" id="status">读取本地 GLB 数据中</div></div><div class="right">TACTICAL OPERATIVE / <strong>ORIGINAL</strong><br/>MECHANICAL RIG TEST · OFFLINE</div><div id="error"></div><div class="footer">A1 原创模型 · 纯离线运行 · 可交互骨骼预览</div><div class="hint">WASD 移动 · Shift 冲刺 · C 蹲伏<br/>鼠标移动：转向 · 左键：射击 · R 换弹</div><div class="bottom" id="clipbar"><button data-clip="Idle" class="active">待机</button><button data-clip="Walk">行走</button><button data-clip="Run">奔跑</button><button data-clip="Crouch">蹲伏</button><button data-clip="Shoot">射击</button><button data-clip="Reload">换弹</button></div><div class="mobile"><button id="orbitL">旋转 ↶</button><button id="orbitR">旋转 ↷</button><button id="shootM">开火</button></div><script id="asset" type="application/octet-stream">__ASSET__</script>
<script>
'use strict';
const $=x=>document.getElementById(x), canvas=$('view'),ctx=canvas.getContext('2d',{alpha:false});
let GLB=null,meshes=[],mat=[],nodes=[],boneRest=[],parents=[],anims={},actor={x:0,z:0,yaw:0},viewYaw=2.7, viewElev=.62;
let state='Idle',t0=performance.now(),manualUntil=0,specialUntil=0,keys={},pointer={x:0,y:0},last=performance.now(),frame=0;
const light=norm([-0.45,0.84,0.35]);
function norm(v){let d=Math.hypot(...v)||1;return v.map(x=>x/d)}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function add(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function mul(a,k){return [a[0]*k,a[1]*k,a[2]*k]}
function qmul(a,b){return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0]-a[0]*b[1],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]}
function qrot(q,p){let v=q.slice(0,3),t=mul(cross(v,p),2);return add(p,add(mul(t,q[3]),cross(v,t)))}
function qn(q){let d=Math.hypot(...q)||1;return q.map(n=>n/d)}
function decode(){const binary=atob($('asset').textContent.trim()),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)),dv=new DataView(bytes.buffer);
  if(dv.getUint32(0,true)!==0x46546c67)throw Error('GLB signature invalid');const len=dv.getUint32(12,true);const doc=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+len)));const base=20+len+8;
  function access(id){const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],dt={5126:[Float32Array,4],5123:[Uint16Array,2],5125:[Uint32Array,4],5121:[Uint8Array,1]}[a.componentType];return new dt[0](bytes.buffer,base+(v.byteOffset||0)+(a.byteOffset||0),a.count*n);}
  nodes=doc.nodes;mat=doc.materials.map(m=>m.pbrMetallicRoughness.baseColorFactor.slice(0,3));
  parents=nodes.map(()=>-1);nodes.forEach((n,i)=>(n.children||[]).forEach(j=>parents[j]=i));
  boneRest=[];for(let i=0;i<doc.skins[0].joints.length;i++){let p=parents[i],v=nodes[i].translation||[0,0,0];boneRest[i]=p<0?v:add(boneRest[p],v)}
  meshes=doc.meshes.flatMap(m=>m.primitives.map(p=>({pos:access(p.attributes.POSITION),normal:access(p.attributes.NORMAL),joint:access(p.attributes.JOINTS_0),weights:access(p.attributes.WEIGHTS_0),indices:access(p.indices),color:mat[p.material]})));
  for(const a of doc.animations){let channels=a.channels.map(c=>{let s=a.samplers[c.sampler];return{node:c.target.node,path:c.target.path,times:access(s.input),values:access(s.output),stride:c.target.path==='rotation'?4:3}});anims[a.name]={channels,duration:Math.max(...channels.map(c=>c.times[c.times.length-1]))};}
  $('bones').textContent=doc.skins[0].joints.length;$('clips').textContent=doc.animations.length;
  $('triangles').textContent=meshes.reduce((a,m)=>a+m.indices.length/3,0).toLocaleString();$('status').textContent='已从 GLB 读取原始蒙皮/动画数据';
  window.assetDiagnostic={loaded:true,bones:doc.skins[0].joints.length,animations:Object.keys(anims),triangles:meshes.reduce((a,m)=>a+m.indices.length/3,0),skinnedPrimitives:meshes.length,renderFrames:0};
}
function interpolate(ch,time){let a=ch.times,n=a.length,at=0;for(;at<n-2&&a[at+1]<time;at++);let next=Math.min(at+1,n-1),f=a[next]===a[at]?0:Math.max(0,Math.min(1,(time-a[at])/(a[next]-a[at]))),out=[];
 for(let i=0;i<ch.stride;i++)out.push(ch.values[at*ch.stride+i]*(1-f)+ch.values[next*ch.stride+i]*f);
 if(ch.path==='rotation')out=qn(out);return out}
function getPose(clipName,clock){let anim=anims[clipName]||anims.Idle,t=clock%anim.duration;
 let tr=nodes.map(n=>(n.translation||[0,0,0]).slice()),rot=nodes.map(n=>(n.rotation||[0,0,0,1]).slice());
 for(const ch of anim.channels){let value=interpolate(ch,t);if(ch.path==='translation')tr[ch.node]=value;else if(ch.path==='rotation')rot[ch.node]=value}
 let pos=[],qr=[];for(let i=0;i<boneRest.length;i++){let p=parents[i];if(p<0){pos[i]=tr[i];qr[i]=rot[i]}else{pos[i]=add(pos[p],qrot(qr[p],tr[i]));qr[i]=qn(qmul(qr[p],rot[i]))}}return{pos,qr}}
function resize(){const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(300,canvas.clientWidth),h=Math.max(200,canvas.clientHeight);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);return[w,h]}
let W=800,H=600;
function project(v){let dx=v[0]-actor.x,dy=v[1]-.90,dz=v[2]-actor.z;
 let eye=[Math.sin(viewYaw)*Math.cos(viewElev),Math.sin(viewElev),Math.cos(viewYaw)*Math.cos(viewElev)];
 let forward=mul(eye,-1), right=norm(cross(forward,[0,1,0])),up=norm(cross(right,forward));
 let s=W<700?Math.max(W/5.8,H/5.0):Math.min(W/7.2,H/3.0);
 return [W*.54+dot([dx,dy,dz],right)*s,H*.51-dot([dx,dy,dz],up)*s,dot([dx,dy,dz],eye)]}
const polys=[];
function poly(points,color){const pp=points.map(project),center=points.reduce((s,p)=>add(s,p),[0,0,0]).map(x=>x/points.length),n=norm(cross(sub(points[1],points[0]),sub(points[2],points[0]))),diff=.36+.64*Math.max(0,dot(n,light));polys.push({points:pp,color:color.map(v=>Math.max(0,Math.min(255,Math.round(v*255*diff)))),depth:project(center)[2]})}
function box(x,y,z,w,h,d,color){let a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,g=z+d/2;let p=[[a,c,f],[b,c,f],[b,e,f],[a,e,f],[a,c,g],[b,c,g],[b,e,g],[a,e,g]];for(let face of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[1,5,6,2],[0,3,7,4]])poly(face.map(i=>p[i]),color)}
function scene(){polys.length=0;
 poly([[-12,-.18,-9],[-12,-.18,10],[12,-.18,10],[12,-.18,-9]],[.17,.22,.26]);
 for(let i=-12;i<12;i+=2){poly([[i,-.175,-9],[i,-.175,10],[i+.035,-.175,10],[i+.035,-.175,-9]],[.25,.31,.33]);}
 for(let i=-9;i<10;i+=2){poly([[-12,-.174,i],[-12,-.174,i+.035],[12,-.174,i+.035],[12,-.174,i]],[.23,.27,.31]);}
 for(let z=-3;z<6;z+=2){poly([[-.09,-.162,z],[.09,-.162,z],[.09,-.162,z+.8],[-.09,-.162,z+.8]],[.75,.57,.24])}
 box(-3.5,.56,-2.4,3,1.15,1.2,[.36,.44,.48]); box(4.3,1.2,-2.5,3.8,2.4,2.3,[.31,.39,.43]);
 box(-4.2,.74,2.7,2.5,1.45,1.2,[.41,.42,.36]);box(3.5,.6,3.2,2.2,1.18,1.3,[.32,.37,.4]);
 box(-2.1,.25,-.7,1.1,.5,.4,[.47,.49,.45]);box(2,.20,.75,1.2,.4,.45,[.46,.47,.43]);
 box(0,-.08,0,2.35,.10,2.35,[.34,.36,.34]);
 for(let k=-1;k<2;k++)box(-3.6,.6,-2.4+k*.32,3.01,.025,.018,[.19,.25,.30]);
}
function drawModel(clip,clock){const pose=getPose(clip,clock);const sy=Math.sin(actor.yaw),cy=Math.cos(actor.yaw);
 for(let m of meshes){let transformed=[];for(let i=0;i<m.pos.length;i+=3){let b=m.joint[(i/3)*4],v=[m.pos[i],m.pos[i+1],m.pos[i+2]],local=sub(v,boneRest[b]),p=add(pose.pos[b],qrot(pose.qr[b],local));transformed.push([actor.x+p[0]*cy+p[2]*sy,p[1],actor.z-p[0]*sy+p[2]*cy]);}
 for(let i=0;i<m.indices.length;i+=3){let a=m.indices[i],b=m.indices[i+1],c=m.indices[i+2];poly([transformed[a],transformed[b],transformed[c]],m.color.map(v=>Math.min(1,v*1.45)))}
 }
}
function paint(){if(!GLB)return;const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0e202d');bg.addColorStop(.55,'#192b32');bg.addColorStop(1,'#111820');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 scene();drawModel(state,(performance.now()-t0)/1000);
 polys.sort((a,b)=>a.depth-b.depth);
 for(let p of polys){let path=p.points;ctx.beginPath();ctx.moveTo(path[0][0],path[0][1]);for(let i=1;i<path.length;i++)ctx.lineTo(path[i][0],path[i][1]);ctx.closePath();ctx.fillStyle=`rgb(${p.color.join(',')})`;ctx.fill()}
 // Atmospheric overlay and technical reticle
 let vignette=ctx.createRadialGradient(W/2,H/2,H*.12,W/2,H/2,Math.max(W,H)*.68);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#0009');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
 let cx=W*.54,cy=H*.53;ctx.strokeStyle='#ecd1a177';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,Math.min(W,H)*.37,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='#e9bb70b5';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-12,cy);ctx.lineTo(cx-4,cy);ctx.moveTo(cx+4,cy);ctx.lineTo(cx+12,cy);ctx.moveTo(cx,cy-12);ctx.lineTo(cx,cy-4);ctx.moveTo(cx,cy+4);ctx.lineTo(cx,cy+12);ctx.stroke();
 window.assetDiagnostic.renderFrames++;}
function choose(c,duration=3){state=c;t0=performance.now();manualUntil=performance.now()+duration*1000;if(c==='Shoot')specialUntil=performance.now()+Math.min(duration,0.30)*1000;$('current').textContent=c;document.querySelectorAll('[data-clip]').forEach(b=>b.classList.toggle('active',b.dataset.clip===c));}
function tick(now){let delta=Math.min(.05,(now-last)/1000);last=now;let dx=(keys.KeyD?1:0)-(keys.KeyA?1:0),dz=(keys.KeyS?1:0)-(keys.KeyW?1:0),moving=dx!==0||dz!==0;
 let forced=performance.now()<manualUntil;
 if(moving){let len=Math.hypot(dx,dz),speed=keys.ShiftLeft?2.1:1.2;actor.x+=dx/len*speed*delta;actor.z+=dz/len*speed*delta;if(!forced){let want=keys.ShiftLeft?'Run':'Walk';if(state!==want)choose(want,.20);}}
 else if(!forced&&state!=='Idle')choose('Idle',.20);
 if(now>specialUntil&&state==='Shoot')choose('Idle',.2);
 paint();requestAnimationFrame(tick)}
for(let b of document.querySelectorAll('[data-clip]'))b.onclick=()=>choose(b.dataset.clip,b.dataset.clip==='Shoot'?.35:b.dataset.clip==='Reload'?1.6:7);
window.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','KeyC','KeyR','Space'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyC')choose('Crouch',2);if(e.code==='KeyR')choose('Reload',1.6)});
window.addEventListener('keyup',e=>keys[e.code]=false);
canvas.addEventListener('mousemove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;let dx=e.clientX-W*.54;actor.yaw=Math.atan2(dx,Math.max(100,W*.70-dx*.15));});
canvas.addEventListener('mousedown',e=>{if(e.button===0){choose('Shoot',.28);specialUntil=performance.now()+260;}});
$('shootM').onclick=()=>{choose('Shoot',.30);specialUntil=performance.now()+250};$('orbitL').onclick=()=>viewYaw-=.22;$('orbitR').onclick=()=>viewYaw+=.22;
window.addEventListener('resize',()=>{[W,H]=resize()});
try{decode();GLB=true;[W,H]=resize();requestAnimationFrame(tick)}catch(err){$('error').style.display='block';$('error').textContent='资源解析失败：'+String(err);window.assetDiagnostic={loaded:false,error:String(err)};console.error(err)}
</script></body></html>'''
html=html.replace('__ASSET__',base)
out=ROOT/'暮色边境_V2.4_骨骼角色预览.html'
out.write_text(html,encoding='utf-8')
print(out,len(html))

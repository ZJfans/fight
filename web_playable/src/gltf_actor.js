// DUSK FRONTIER V2.5 — player GLB skinned character in the playable WebGL2 battle.
// Game logic is from the preserved V1.11 HTML branch. This renderer animates the
// actual 18-joint, 6-clip V2.4 GLB, and does not pretend to be a Godot Web export.
(function(){'use strict';
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
// Correct quaternion product (x,y,z,w)
function quatMul(a,b){return[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0]-a[0]*b[3],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];}
function qrot(q,p){const x=q[0],y=q[1],z=q[2],w=q[3],tx=2*(y*p[2]-z*p[1]),ty=2*(z*p[0]-x*p[2]),tz=2*(x*p[1]-y*p[0]);return[p[0]+w*tx+y*tz-z*ty,p[1]+w*ty+z*tx-x*tz,p[2]+w*tz+x*ty-y*tx];}
function qnorm(q){const l=Math.hypot(...q)||1;return q.map(v=>v/l)}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function parse(buffer){const d=new DataView(buffer);if(d.getUint32(0,true)!==0x46546c67)throw Error('Invalid GLB');let off=12,doc=null,bin=null;while(off<buffer.byteLength){const n=d.getUint32(off,true),t=d.getUint32(off+4,true);off+=8;if(t===0x4e4f534a)doc=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,off,n)));if(t===0x004e4942)bin=buffer.slice(off,off+n);off+=n;}if(!doc||!bin||!doc.skins?.length)throw Error('Skinned GLB required');return{doc,bin};}
function createRig(buffer){const {doc,bin}=parse(buffer),dv=new DataView(bin),componentSize={5121:1,5123:2,5125:4,5126:4},num={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
  function read(id){const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],n=num[a.type],step=componentSize[a.componentType],stride=v.byteStride||n*step,o=(v.byteOffset||0)+(a.byteOffset||0),result=[];for(let i=0;i<a.count;i++){const row=[];for(let j=0;j<n;j++){const k=o+i*stride+j*step;row.push(a.componentType===5126?dv.getFloat32(k,true):a.componentType===5125?dv.getUint32(k,true):a.componentType===5123?dv.getUint16(k,true):dv.getUint8(k));}result.push(row);}return result;}
  const nodes=doc.nodes,skin=doc.skins[0],parents=nodes.map(()=>-1),jointNodeIndices=skin.joints;
  nodes.forEach((n,i)=>(n.children||[]).forEach(j=>parents[j]=i));
  const worldRest=nodes.map(()=>[0,0,0]);for(let i=0;i<nodes.length;i++){let tr=nodes[i].translation||[0,0,0],p=parents[i];worldRest[i]=p<0?tr.slice():add(worldRest[p],tr);}
  const meshParts=doc.meshes.flatMap(x=>x.primitives.map(p=>({pos:read(p.attributes.POSITION),idx:read(p.indices).map(a=>a[0]),joints:read(p.attributes.JOINTS_0),weights:read(p.attributes.WEIGHTS_0),color:(doc.materials[p.material]?.pbrMetallicRoughness?.baseColorFactor||[.4,.5,.44]).slice(0,3)})));
  const weaponSocketNode=nodes.findIndex(n=>n.name==='Weapon');let latestSocket=null;
  const clips={};for(const anim of doc.animations||[]){const ch=anim.channels.map(c=>{const s=anim.samplers[c.sampler];return{node:c.target.node,path:c.target.path,times:read(s.input).map(x=>x[0]),values:read(s.output)}});clips[anim.name]={channels:ch,duration:Math.max(...ch.map(c=>c.times[c.times.length-1]))};}
  const stats={bones:jointNodeIndices.length,clips:Object.keys(clips),triangles:meshParts.reduce((n,m)=>n+m.idx.length/3,0),rigged:true,renderedFrames:0,lastClip:"",clipHistory:[]};
  function interp(c,t){let i=0;while(i<c.times.length-2&&c.times[i+1]<t)i++;let j=Math.min(i+1,c.times.length-1),f=c.times[i]===c.times[j]?0:Math.max(0,Math.min(1,(t-c.times[i])/(c.times[j]-c.times[i]))),a=c.values[i],b=c.values[j],out=a.map((v,k)=>v+(b[k]-v)*f);return c.path==='rotation'?qnorm(out):out;}
  function pose(name,time){const clip=clips[name]||clips.Idle;const t=((time%(clip.duration||1))+(clip.duration||1))%(clip.duration||1),tr=nodes.map(n=>(n.translation||[0,0,0]).slice()),rot=nodes.map(n=>(n.rotation||[0,0,0,1]).slice());for(const ch of clip.channels){const val=interp(ch,t);if(ch.path==='translation')tr[ch.node]=val;else if(ch.path==='rotation')rot[ch.node]=val;}
   // Upper-body aiming overlay retains locomotion in the lower-body tracks.
   if(['Walk','Run','Crouch'].includes(name)&&clips.Aim){
     const aim=clips.Aim,at=t%(aim.duration||1);
     for(const ch of aim.channels){if(ch.path!=='rotation')continue;
       const bone=(nodes[ch.node]?.name||'');
       if(['LeftUpperArm','RightUpperArm','LeftLowerArm','RightLowerArm','LeftHand','RightHand','Weapon'].includes(bone))rot[ch.node]=interp(ch,at);
     }
   }
   const p=[],q=[];for(let i=0;i<nodes.length;i++){const a=parents[i];if(a<0){p[i]=tr[i];q[i]=rot[i]}else{p[i]=add(p[a],qrot(q[a],tr[i]));q[i]=qnorm(quatMul(q[a],rot[i]));}}
   return{p,q};}
  // current GLB uses rigid skinning, but calculate four weights for portability.
  function render(mesh,u,t){const moving=(u.run||0)>.13,clip=u.fireGlow>.005?'Shoot':u.reload>0?'Reload':u.crouching?'Crouch':moving&&(u.run||0)>.75?'Run':moving?'Walk':'Aim',po=pose(clip,t),cos=Math.cos(u.yaw||0),sin=Math.sin(u.yaw||0),size=1.0;if(stats.lastClip!==clip){stats.clipHistory.push(clip);if(stats.clipHistory.length>20)stats.clipHistory.shift();}stats.lastClip=clip;stats.renderedFrames++;
    if(weaponSocketNode>=0)latestSocket={p:po.p[weaponSocketNode].slice(),q:po.q[weaponSocketNode].slice(),clip};
    for(const m of meshParts){const vv=new Array(m.pos.length);for(let i=0;i<m.pos.length;i++){const v=m.pos[i],weights=m.weights[i],joints=m.joints[i];let world=[0,0,0];for(let b=0;b<4;b++){if(!weights[b])continue;const id=jointNodeIndices[joints[b]],local=sub(v,worldRest[id]),p=add(po.p[id],qrot(po.q[id],local)),w=weights[b];world[0]+=p[0]*w;world[1]+=p[1]*w;world[2]+=p[2]*w;}vv[i]=[u.x+size*(world[0]*cos-world[2]*sin),.04+size*world[1],u.z+size*(world[0]*sin+world[2]*cos)];}
      for(let i=0;i<m.idx.length;i+=3){const a=vv[m.idx[i]],b=vv[m.idx[i+1]],c=vv[m.idx[i+2]],aa=sub(b,a),bb=sub(c,a),normal=cross(aa,bb),l=Math.hypot(...normal)||1;mesh.tri(a,b,c,normal.map(v=>v/l),m.color.map(v=>Math.min(.95,v*1.24)),9);}
    }
  }
  return{render,stats,getSocket:()=>latestSocket};}
let current=null,error=null;window.BorderlandGLB={get ready(){return !!current},get info(){return current?.stats||null},get error(){return error},get socket(){return current?.getSocket?.()||null},draw(mesh,u,t,enemy){if(!current||u.dead||enemy)return false;current.render(mesh,u,t);return true},load(bytes){try{current=createRig(bytes);error=null;window.__BORDERLAND_SKINNED=current.stats;return true;}catch(e){error=String(e);console.error('Rig GLB load:',e);return false;}}};
fetch('assets/operative_original.glb').then(r=>{if(!r.ok)throw Error('GLB HTTP '+r.status);return r.arrayBuffer()}).then(b=>window.BorderlandGLB.load(b)).catch(e=>{error=String(e);console.error('GLB download failed:',e)});
})();

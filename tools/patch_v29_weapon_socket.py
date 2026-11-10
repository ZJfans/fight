from pathlib import Path
root=Path('/mnt/data/borderland_v29/web_playable/src')
p=root/'gltf_actor.js';s=p.read_text()
s=s.replace("  const meshParts=doc.meshes.flatMap(x=>x.primitives.map(p=>({pos:read(p.attributes.POSITION),idx:read(p.indices).map(a=>a[0]),joints:read(p.attributes.JOINTS_0),weights:read(p.attributes.WEIGHTS_0),color:(doc.materials[p.material]?.pbrMetallicRoughness?.baseColorFactor||[.4,.5,.44]).slice(0,3)})));",
"  const meshParts=doc.meshes.flatMap(x=>x.primitives.map(p=>({pos:read(p.attributes.POSITION),idx:read(p.indices).map(a=>a[0]),joints:read(p.attributes.JOINTS_0),weights:read(p.attributes.WEIGHTS_0),color:(doc.materials[p.material]?.pbrMetallicRoughness?.baseColorFactor||[.4,.5,.44]).slice(0,3)})));\n  const weaponSocketNode=nodes.findIndex(n=>n.name==='Weapon');let latestSocket=null;")
s=s.replace("    for(const m of meshParts){const vv=new Array(m.pos.length);", "    if(weaponSocketNode>=0)latestSocket={p:po.p[weaponSocketNode].slice(),q:po.q[weaponSocketNode].slice(),clip};\n    for(const m of meshParts){const vv=new Array(m.pos.length);")
s=s.replace('  return{render,stats};}', '  return{render,stats,getSocket:()=>latestSocket};}')
s=s.replace('get error(){return error},draw(mesh,u,t,enemy)', 'get error(){return error},get socket(){return current?.getSocket?.()||null},draw(mesh,u,t,enemy)')
p.write_text(s)

p=root/'weapons.js';s=p.read_text()
s=s.replace('return{parts:doc.meshes.flatMap(m=>m.primitives.map(p=>({verts:read(p.attributes.POSITION),inds:read(p.indices).map(x=>x[0]),col:(doc.materials[p.material]?.pbrMetallicRoughness?.baseColorFactor||[.3,.3,.3]).slice(0,3)}))),nodes:doc.nodes};};',
"const mn=(doc.nodes||[]).find(n=>n.name==='Muzzle');const muzzle=(mn?.matrix?[mn.matrix[12],mn.matrix[13],mn.matrix[14]]:(mn?.translation||[0,0,-.65]));\n return{parts:doc.meshes.flatMap(m=>m.primitives.map(p=>({verts:read(p.attributes.POSITION),inds:read(p.indices).map(x=>x[0]),col:(doc.materials[p.material]?.pbrMetallicRoughness?.baseColorFactor||[.3,.3,.3]).slice(0,3)}))),nodes:doc.nodes,muzzle};};")
a=s.index(' function draw(mesh,actor,index)')
b=s.index(' window.BorderlandWeapon=',a)
s=s[:a]+''' function qrot(q,p){const x=q[0],y=q[1],z=q[2],w=q[3],tx=2*(y*p[2]-z*p[1]),ty=2*(z*p[0]-x*p[2]),tz=2*(x*p[1]-y*p[0]);return[p[0]+w*tx+y*tz-z*ty,p[1]+w*ty+z*tx-x*tz,p[2]+w*tz+x*ty-y*tx];}
 function transform(actor,position,recoil=0){
  const c=Math.cos(actor.yaw||0),s=Math.sin(actor.yaw||0),socket=window.BorderlandGLB?.socket;
  if(socket&&socket.p&&socket.q){
    const a=qrot(socket.q,[position[0],position[1]+.16,position[2]+.03+recoil]);
    const x=socket.p[0]+a[0],y=socket.p[1]+a[1],z=socket.p[2]+a[2];
    return[actor.x+x*c-z*s,.04+y,actor.z+x*s+z*c];
  }
  const x=position[0],y=position[1],z=position[2]-.24+recoil;
  return[actor.x+x*c-z*s,1.42+y,actor.z+x*s+z*c];
 }
 function muzzle(actor,index){const asset=assets[index];if(!asset)return null;const xyz=transform(actor,asset.muzzle);return{x:xyz[0],y:xyz[1],z:xyz[2]};}
 function draw(mesh,actor,index){let asset=assets[index];if(!asset||!actor||actor.dead)return;
  const recoil=actor.fireGlow>0?.08:0;
  for(const part of asset.parts){const vv=part.verts.map(v=>transform(actor,v,recoil));
   for(let i=0;i<part.inds.length;i+=3){let a=vv[part.inds[i]],b=vv[part.inds[i+1]],c0=vv[part.inds[i+2]],v=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],w=[c0[0]-a[0],c0[1]-a[1],c0[2]-a[2]],n=[v[1]*w[2]-v[2]*w[1],v[2]*w[0]-v[0]*w[2],v[0]*w[1]-v[1]*w[0]],d=Math.hypot(...n)||1;mesh.tri(a,b,c0,n.map(t=>t/d),part.col,3);}
  }
 }
''' + s[b:]
s=s.replace('window.BorderlandWeapon={draw,get ready()', 'window.BorderlandWeapon={draw,muzzle,get ready()')
s=s.replace('return{loaded:loaded,expected:3,names}', "return{loaded:loaded,expected:3,names,muzzleNodes:assets.map(a=>a?.muzzle||null)}")
p.write_text(s)

p=root/'game.js';s=p.read_text()
old=" for(let m=0;m<(isEnemy?3:(idx===1?7:5));m++)spawnParticle(who.x-Math.sin(who.yaw)*1.72,who.z-Math.cos(who.yaw)*1.72,1.55,'muzzle',{vx:rng(-.9,.9),vy:rng(-.1,1.2),vz:rng(-.9,.9),life:rng(.05,.14),max:.14,size:idx===1?1.22:.95});"
new=" const muzzlePos=!isEnemy?window.BorderlandWeapon?.muzzle?.(who,idx):null;const muzzleDist=isEnemy?1.05:(idx===2?.85:1.4);\n const fx=muzzlePos?.x??who.x-Math.sin(who.yaw)*muzzleDist, fz=muzzlePos?.z??who.z-Math.cos(who.yaw)*muzzleDist, fy=muzzlePos?.y??1.42;\n for(let m=0;m<(isEnemy?3:(idx===1?7:5));m++)spawnParticle(fx,fz,fy,'muzzle',{vx:rng(-.9,.9),vy:rng(-.1,1.2),vz:rng(-.9,.9),life:rng(.05,.14),max:.14,size:idx===1?1.22:.95});"
assert old in s
s=s.replace(old,new)
s=s.replace("shots.push({ax:who.x,az:who.z,bx:ex,bz:ez,life:.11,max:.11,enemy:isEnemy});","shots.push({ax:fx,az:fz,bx:ex,bz:ez,life:.11,max:.11,enemy:isEnemy});")
s=s.replace("for(const sh of shots){m.beam(sh.ax,2.0,sh.az,sh.bx,1.95,sh.bz,.038,sh.enemy?C.enemy:C.light,7);}","for(const sh of shots){m.beam(sh.ax,1.42,sh.az,sh.bx,1.22,sh.bz,.029,sh.enemy?C.enemy:C.light,7);}")
p.write_text(s)

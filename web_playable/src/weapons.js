// DUSK FRONTIER V2.7 — authentic standalone GLB weapons with named muzzle node.
(function(){'use strict';const loadGLB=async url=>{
 const b=await (await fetch(url)).arrayBuffer(),dv=new DataView(b);if(dv.getUint32(0,true)!==0x46546c67)throw Error('Weapon GLB invalid');
 let pos=12,doc,bin;while(pos<b.byteLength){let size=dv.getUint32(pos,true),type=dv.getUint32(pos+4,true);pos+=8;if(type===0x4e4f534a)doc=JSON.parse(new TextDecoder().decode(new Uint8Array(b,pos,size)));if(type===0x004e4942)bin=new DataView(b,pos,size);pos+=size;}
 const len={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},cs={5121:1,5123:2,5125:4,5126:4};
 const read=id=>{const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],num=len[a.type],stride=v.byteStride||num*cs[a.componentType],start=(v.byteOffset||0)+(a.byteOffset||0),values=[];
  for(let i=0;i<a.count;i++){let row=[];for(let j=0;j<num;j++){let o=start+i*stride+j*cs[a.componentType];row.push(a.componentType===5126?bin.getFloat32(o,true):a.componentType===5125?bin.getUint32(o,true):a.componentType===5123?bin.getUint16(o,true):bin.getUint8(o));}values.push(row);}return values;};
 const mn=(doc.nodes||[]).find(n=>n.name==='Muzzle');const muzzle=(mn?.matrix?[mn.matrix[12],mn.matrix[13],mn.matrix[14]]:(mn?.translation||[0,0,-.65]));
 return{parts:doc.meshes.flatMap(m=>m.primitives.map(p=>({verts:read(p.attributes.POSITION),inds:read(p.indices).map(x=>x[0]),col:(doc.materials[p.material]?.pbrMetallicRoughness?.baseColorFactor||[.3,.3,.3]).slice(0,3)}))),nodes:doc.nodes,muzzle};};
 const assets=[],names=['DF_WPN_R07_Rifle.glb','DF_WPN_S12_Shotgun.glb','DF_WPN_M01_Pistol.glb'];let loaded=0;
 Promise.all(names.map((n,i)=>loadGLB('assets/weapons/'+n).then(a=>{assets[i]=a;loaded++;}).catch(e=>console.warn('Weapon asset',n,e))));
 function qrot(q,p){const x=q[0],y=q[1],z=q[2],w=q[3],tx=2*(y*p[2]-z*p[1]),ty=2*(z*p[0]-x*p[2]),tz=2*(x*p[1]-y*p[0]);return[p[0]+w*tx+y*tz-z*ty,p[1]+w*ty+z*tx-x*tz,p[2]+w*tz+x*ty-y*tx];}
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
 window.BorderlandWeapon={draw,muzzle,get ready(){return loaded>0},get count(){return loaded},get names(){return names},get info(){return{loaded:loaded,expected:3,names,muzzleNodes:assets.map(a=>a?.muzzle||null)}}};
})();
from pathlib import Path
root=Path('/mnt/data/borderland_v29')
world=root/'web_playable/src/world.js'
s=world.read_text()
start=s.index('function modularShed(')
end=s.index('function sampleHarborBlock(', start)
new=r'''function modularShed(m,x,z,w=9.5,d=7.8,h=4.8,yaw=0){
 // V2.9: actual accessible interior, not one solid collision box.
 // Door at +Z faces the fixed camera; only wall strips are colliders.
 const wall=[.38,.46,.48],panel=[.48,.53,.54],frame=[.21,.28,.31],dark=[.10,.17,.19],glass=[.24,.38,.41],lamp=[.84,.68,.43];
 shadow(m,x,z,w,d,1.25);
 const wallT=.24,doorW=2.60,doorH=3.35,seg=(w-doorW)/2;
 box(m,x,h/2,z-d/2,w,h,wallT,wall,5);collider(x,z-d/2,w,wallT,h,'building');
 for(const side of [-1,1]){
  box(m,x+side*w/2,h/2,z,wallT,h,d,wall,5);collider(x+side*w/2,z,wallT,d,h,'building');
  // horizontal courses and vertical bracing on visible side walls
  for(let k=1;k<=3;k++)box(m,x+side*(w/2+.13),k*1.15,z,.045,.045,d-.48,frame,3);
  for(let k=-2;k<=2;k++)box(m,x+side*(w/2+.15),h*.56,z+k*(d-.6)/5,.08,h*.9,.10,col(frame,1.10),3);
 }
 for(const side of [-1,1]){
  const sx=x+side*(doorW+seg)/2;
  box(m,sx,h/2,z+d/2,seg,h,wallT,panel,5);collider(sx,z+d/2,seg,wallT,h,'building');
  const wx=sx+side*seg*.18;
  box(m,wx,2.75,z+d/2+.15,1.50,1.30,.12,frame,3);
  box(m,wx,2.75,z+d/2+.232,1.20,1.08,.045,glass,10);
  box(m,wx,2.75,z+d/2+.265,.09,1.26,.06,frame,3);
  box(m,wx,2.75,z+d/2+.266,1.5,.08,.06,frame,3);
  box(m,wx,1.12,z+d/2+.155,1.65,.11,.12,[.26,.33,.34],3);
  for(let t=0;t<4;t++)box(m,wx+(t-1.5)*.32,1.48,z+d/2+.145,.05,.28,.06,frame,3);
 }
 // clear opening in the centre, a real threshold, no collision in the door volume
 box(m,x,doorH+(h-doorH)/2,z+d/2,w, h-doorH,.23,wall,5); // lintel (collision only above head)
 box(m,x,doorH+.1,z+d/2+.18,doorW+.34,.22,.30,frame,3);
 for(const side of [-1,1])box(m,x+side*(doorW/2+.10),doorH*.5,z+d/2+.18,.17,doorH,.20,frame,3);
 box(m,x,.14,z+d/2+.16,doorW+.34,.07,.50,[.59,.58,.49],2);
 // service canopy with suspended lamp and actual supporting verticals
 box(m,x,3.48,z+d/2+1.25,doorW+1.40,.17,2.6,frame,3);
 for(const side of [-1,1])box(m,x+side*(doorW/2+.48),1.73,z+d/2+2.32,.18,3.46,.18,frame,3);
 box(m,x,3.24,z+d/2+1.22,1.35,.08,.38,lamp,7);
 // roof is a separate dynamically shown/hidden set; enter through door to hide it
 roofLayer(x,h+.18,z,w+.50,.28,d+.54,C.roof,0,x,z,w-0.18,d-0.18);
 for(let i=0;i<14;i++){
  const rx=x-w/2+.30+i*(w-.60)/13;
  roofLayer(rx,h+.38,z,.075,.12,d+.48,col(C.roof,i%3===0?1.25:.72),0,x,z,w-0.18,d-0.18);
 }
 for(let k=-2;k<=2;k++){
  const pz=z+k*1.25;
  roofLayer(x-w/2+.5,h+.32,pz,.45,.12,.13,C.steel,0,x,z,w-0.18,d-0.18);
 }
 // exterior conduit, vents and rainwater downpipe (no collision)
 box(m,x-w/2-.19,2.85,z-d*.12,.20,.20,d*.62,C.steel,3);
 box(m,x-w/2-.30,1.85,z+d*.35,.22,3.40,.22,C.steel,3);
 for(let k=0;k<5;k++)box(m,x+w/2+.17,2.85,z-d*.25+k*.31,.07,.36,.09,[.18,.27,.29],3);
}
'''
s=s[:start]+new+s[end:]
# remove the collision block under loading canopy, keep support posts only
s=s.replace(" collider(5.6,13.8,3.0,5.2,2.6,'cover');covers.push({x:5.6,z:13.8});",
" collider(4.4,13.8,.20,.20,2.6,'prop');collider(6.8,13.8,.20,.20,2.6,'prop');")
# More legible visible frontside details for original warehouse, don't add collision
s=s.replace(" // separate large roof tower for asymmetry\n", " // Bay signage, dock bumper and angled warehouse piping on camera-facing facade\n for(let j=0;j<7;j++){let xx=x-w/2+1.8+j*(w-3.6)/6;box(m,xx,3.1,z+d/2+.13,.08,4.5,.12,[.26,.33,.37],3);}\n box(m,x-5.1,5.4,z+d/2+.25,4.6,.45,.13,[.26,.34,.37],3);\n for(let j=0;j<3;j++)box(m,x-6.7+j*1.55,5.45,z+d/2+.34,1.10,.12,.075,col(C.gold,.65+j*.10),12);\n for(let j=0;j<5;j++)box(m,x-7+j*3.0,.32,z+d/2+.30,1.25,.22,.26,[.18,.25,.27],9);\n // separate large roof tower for asymmetry\n")
# additional small details around sample visible side
s=s.replace(" // warm practical lights\n", " // flange strips, corner protection and a broken service grate, all decoration\n for(let j=0;j<6;j++)box(m,19.2+j*.58,.11,20.2,.32,.035,.07, j%2?C.gold:C.black,12);\n for(let j=0;j<4;j++)box(m,20.0+j*.60,.11,22.3,.16,.016,.30,[.31,.42,.46],3);\n // warm practical lights\n")
world.write_text(s)

# add software only contact-shadow and warm practical light layer
p=root/'web_playable/src/render.js'
s=p.read_text()
needle=' // Rasterize dynamic 3D character, weapons and particles using the same projection and geometry.\n'
assert needle in s
extra=r''' // Deliberately lightweight art-directed floor contact shadows + practical lamp pools.
 // These are 2D fallback cues, not a substitute for a WebGL shadow map.
 const sc=w/r.w;
 function floorCircle(x,z,metres,opacity,kind){
  const p=r.worldToScreen(x,.12,z),q=r.worldToScreen(x+metres,.12,z),radius=Math.max(1.5,Math.abs(q.x-p.x)*sc);
  const X=p.x*sc,Y=p.y*sc;if(X<-radius*2||X>w+radius*2||Y<-radius*2||Y>h+radius*2)return;
  c.save();c.translate(X,Y);c.scale(1,.49);
  let col=kind==='light'?`rgba(244,175,95,${opacity})`:`rgba(6,14,19,${opacity})`;
  const g=c.createRadialGradient(0,0,1,0,0,radius);
  if(kind==='light'){g.addColorStop(0,col);g.addColorStop(.4,`rgba(238,166,77,${opacity*.47})`);g.addColorStop(1,'rgba(232,151,67,0)');}
  else{g.addColorStop(0,col);g.addColorStop(.5,`rgba(6,14,19,${opacity*.65})`);g.addColorStop(1,'rgba(6,14,19,0)');}
  c.fillStyle=g;c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.fill();c.restore();
 }
 if(r.artLamps){for(const lp of r.artLamps){let x=lp[0],z=lp[2];if(Math.hypot(x-r.target[0],z-r.target[2])<26)floorCircle(x,z,4.1,.07,'light');}}
 if(r.artCovers){for(const pt of r.artCovers){if(Math.hypot(pt.x-r.target[0],pt.z-r.target[2])<24)floorCircle(pt.x+.20,pt.z+.24,1.12,.11,'shadow');}}
 if(r.artActors){for(const person of r.artActors){if(person&& !person.dead)floorCircle(person.x+.18,person.z+.20,.71,.32,'shadow');}}
'''
s=s.replace(needle,extra+needle)
p.write_text(s)

# update game debug/test roof behavior & surface impacts, shadow sources
p=root/'web_playable/src/game.js'
s=p.read_text()
s=s.replace('const map=W.colliders,roofLayers=level.roofs||[];', 'const map=W.colliders,roofLayers=level.roofs||[];renderer.artLamps=level.lamps;renderer.artCovers=level.covers;')
s=s.replace(' // player shadow, role ring and actual 3D body', ' renderer.artActors=[player,...enemies];\n // player shadow, role ring and actual 3D body')
s=s.replace("hit.block&&hit.block.kind==='building'?'dust':'spark'", "hit.block&&['building','warehouse','cover'].includes(hit.block.kind)?'dust':hit.block&&hit.block.kind==='crate'?'splinter':'spark'")
s=s.replace("hit.block&&hit.block.kind==='building'?1.25:.95", "hit.block&&['building','warehouse','cover'].includes(hit.block.kind)?1.25:.95")
s=s.replace("else if(p.kind==='spark')color=[1.0,.78,.46];", "else if(p.kind==='spark')color=[1.0,.78,.46];else if(p.kind==='splinter')color=[.69,.52,.33];")
# expose non-mutating probing of collisions for roof pass-through verification
needle="player=personData(10,13);renderer.camera"
assert needle in s
s=s.replace("coverProbe:()=>({coverCount:W.covers.length,candidates:enemies.filter(b=>!b.dead).map(b=>({id:b.id,point:findDefensiveCover(b)}))}),teleport:(x,z)=>",
"coverProbe:()=>({coverCount:W.covers.length,candidates:enemies.filter(b=>!b.dead).map(b=>({id:b.id,point:findDefensiveCover(b)}))}),sampleProbe:()=>({roofPieces:roofLayers.length,hiddenRoofs:roofLayers.filter(r=>player&&Math.abs(player.x-r.hideX)<r.hideW/2&&Math.abs(player.z-r.hideZ)<r.hideD/2).length,doorFree:![[-0.0,18.7],[0,17.7]].some(([dx,dz])=>collides(22.2+dx,dz,.30)),walls:map.filter(b=>b.kind==='building'&&b.x>17&&b.x<28).length}),teleport:(x,z)=>")
p.write_text(s)

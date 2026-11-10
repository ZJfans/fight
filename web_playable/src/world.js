// BORDERLAND — 3D industrial compound. Every building/prop is actual geometry (not a flat painted map).
(function(){'use strict';const {Mesh,C}=window.BorderRender;
function col(c,f=1){return c.map(x=>Math.min(1,x*f));}
let SEED=0x6c0ffee;function rand(){SEED=(Math.imul(SEED,1664525)+1013904223)>>>0;return SEED/4294967296;}
const rng=(a,b)=>a+(b-a)*rand(),rint=(a,b)=>Math.floor(rng(a,b+1));
const colliders=[],covers=[],lamps=[],nests=[],decor={},roofLayers=[];
function collider(x,z,w,d,h,kind='wall'){colliders.push({x,z,w,d,h,kind});}
function box(m,x,y,z,w,h,d,color,mat=2,yaw=0){m.box(x,y,z,w,h,d,color,mat,yaw);}
// Baked contact shadows: actual world-space polygons, not a painted backdrop.
function shadow(m,x,z,w,d,strength=1){
 for(let k=3;k>=0;k--){let f=k*.45,offset=1.1+strength*(2.2+f);
  m.plane(x+offset*.48,.108+k*.0009,z-offset*.78,w+k*.48,d+k*.55,[.035+k*.009,.03,.03],14);
 }
}
function rebar(m,x,z,dir=0){let len=rng(.6,1.7);m.beam(x,.20,z,x+len*Math.cos(dir),.25,z+len*Math.sin(dir),.034,C.rust,4);}
function gratedDrain(m,x,z,w=2.2){box(m,x,.122,z,w,.027,.49,C.black,3);for(let i=0;i<9;i++)box(m,x-w/2+i*w/8,.147,z,.045,.027,.48,C.steel,3);}
function markings(m,x,z,text=''){for(let i=0;i<3;i++){box(m,x+i*.48,.123,z,.10,.008,.57,[.66,.59,.39],12);}}

function sign(m,x,y,z,w,h,color=C.white){box(m,x,y,z,w,h,.035,color,8)}
function container(m,x,z,rot=0,paint=C.containerRed){let w=3.6,d=8.4,h=3.0;let ya=rot*Math.PI/2;
 shadow(m,x,z,Math.abs(Math.cos(ya))*w+Math.abs(Math.sin(ya))*d,Math.abs(Math.sin(ya))*w+Math.abs(Math.cos(ya))*d,.55);
 box(m,x,h/2,z,w,h,d,paint,3,ya);box(m,x,h+.06,z,w,.13,d,C.roof,3,ya);
 // Metal end locks and roof edge ribbing
 for(let zz=-3.9;zz<=3.9;zz+=1.27){let X=x+Math.sin(ya)*zz,Z=z+Math.cos(ya)*zz;
  box(m,X,h/2,Z,.09,2.85,w+.07,col(paint,.67),3,ya+Math.PI/2);
 }
 for(let side of [-1,1]){let xx=x+Math.cos(ya)*side*(w/2+.035),zz=z-Math.sin(ya)*side*(w/2+.035);
  box(m,xx,h/2,zz,.07,2.8,d*.94,col(paint,.82),3,ya);
 }
 for(let side of [-1,1])for(let zz of [-d/2+.18,d/2-.18]){
 let X=x+Math.cos(ya)*side*(w/2-.13)+Math.sin(ya)*zz,Z=z-Math.sin(ya)*side*(w/2-.13)+Math.cos(ya)*zz;
 box(m,X,1.65,Z,.1,2.85,.12,C.steel,3,ya);
 }
 // Collision AABB
 collider(x,z,Math.abs(Math.cos(ya))*w+Math.abs(Math.sin(ya))*d,Math.abs(Math.sin(ya))*w+Math.abs(Math.cos(ya))*d,h,'container');
}
function shelter(m,x,z,w,d,h,paint=C.concrete){shadow(m,x,z,w,d,1.45);box(m,x,h/2,z,w,h,d,paint,5);box(m,x,h+.16,z,w+.95,.32,d+.8,C.roof,3);
 for(let side of [-1,1]){
 for(let j=-Math.floor(d/3);j<=Math.floor(d/3);j++){
 let zz=z+j*2.6;if(Math.abs(zz-z)>d/2-1.2)continue;
 box(m,x+side*(w/2+.045),h*.67,zz,.14,1.3,1.05,C.glass,10);
 box(m,x+side*(w/2+.10),h*.35,zz,.19,.09,1.13,C.steel,3);
 }
 }
 collider(x,z,w,d,h,'building');}
function warehouse(m,x,z,w=22,d=19,h=8){
 shadow(m,x,z,w,d,2.1);
 box(m,x,h*.50,z,w,h,d,C.concrete,5);
 // corrugated roof panels, raised skylights and roof drainage
 box(m,x,h+.24,z,w+1,.48,d+1,C.roof,3);
 for(let i=0;i<18;i++){
 let xx=x-w/2+.55+i*(w-1)/17;box(m,xx,h+.52,z,.08,.19,d+.3,col(C.roof,.65),3);
 }
 for(let z0 of [-5.5,0,5.4]){box(m,x-2.2,h+.59,z+z0,2.6,.1,.85,C.glass,10);}
 // door opening visual dark and ribbed roller shutter
 box(m,x+w/2+.03,2.35,z+3,.06,4.7,7.4,C.black,10);
 for(let j=0;j<13;j++)box(m,x+w/2+.11,.38+j*.32,z+3,.09,.045,7.4,C.steel,3);
 box(m,x+w/2+.15,4.75,z+3,.3,.23,8.0,C.rust,4);
 // external support pillars, vents, pipe runs
 for(let side of [-1,1])for(let j=-2;j<=2;j++)box(m,x+side*(w/2+.13),h*.55,z+j*(d/5),.30,h*1.06,.28,C.steel,3);
 for(let j=0;j<4;j++)box(m,x-w/2+2.0+j*3.8,h+1.1,z-3.4,1.5,1.65,1.3,C.steel,3);
 for(let j=0;j<3;j++){box(m,x-6.5+j*5,h*.7,z-d/2-.03,1.9,1.75,.14,C.glass,10);}
 // Bay signage, dock bumper and angled warehouse piping on camera-facing facade
 for(let j=0;j<7;j++){let xx=x-w/2+1.8+j*(w-3.6)/6;box(m,xx,3.1,z+d/2+.13,.08,4.5,.12,[.26,.33,.37],3);}
 box(m,x-5.1,5.4,z+d/2+.25,4.6,.45,.13,[.26,.34,.37],3);
 for(let j=0;j<3;j++)box(m,x-6.7+j*1.55,5.45,z+d/2+.34,1.10,.12,.075,col(C.gold,.65+j*.10),12);
 for(let j=0;j<5;j++)box(m,x-7+j*3.0,.32,z+d/2+.30,1.25,.22,.26,[.18,.25,.27],9);
 // separate large roof tower for asymmetry
 box(m,x-w*.29,h+1.35,z+d*.20,3,2.65,3.2,C.steel,3);box(m,x-w*.29,h+2.8,z+d*.20,3.5,.25,3.5,C.roof,3);
 collider(x,z,w,d,h,'warehouse');
}
function barrel(m,x,z,rad=.44){m.cylinder(x,.01,z,rad,1.25,C.rust,4,11);m.cylinder(x,1.26,z,rad+.025,.09,C.steel,3,11);m.cylinder(x,.18,z,rad+.026,.07,C.steel,3,11);}
function crate(m,x,z,s=1){box(m,x,s*.5,z,s,s,s,C.sand,13);for(let i of [-1,1]){box(m,x+i*s*.45,s*.5,z,s*.09,s,s*.12,C.rope,13);box(m,x,s*.5,z+i*s*.45,s*.12,s,s*.09,C.rope,13);}collider(x,z,s,s,s,'crate');}
function fence(m,x1,z1,x2,z2,height=2.6,collision=true){let len=Math.hypot(x2-x1,z2-z1),dx=(x2-x1)/len,dz=(z2-z1)/len;
 for(let t=0;t<=len;t+=3){let x=x1+dx*t,z=z1+dz*t;box(m,x,height/2,z,.18,height,.18,C.steel,3);box(m,x,height+.15,z,.36,.3,.36,C.black,3);}
 let steps=Math.ceil(len/1.5);for(let j=0;j<2;j++)for(let i=0;i<steps;i++){
 let t=i/steps*len,x=x1+dx*t,z=z1+dz*t;x+=rng(-.05,.05);z+=rng(-.05,.05);
 m.beam(x,.55+j*.85,z,x+dx*len/steps,.55+j*.85,z+dz*len/steps,.045,C.steel,3);
 }
 if(collision){let cx=(x1+x2)/2,cz=(z1+z2)/2;collider(cx,cz,Math.abs(x2-x1)+.25,Math.abs(z2-z1)+.25,height,'fence');}}
function concreteBarrier(m,x,z,angle=0,len=3.4){shadow(m,x,z,len,.8,.21);box(m,x,.73,z,len,1.46,.70,C.concrete,2,angle);box(m,x,.17,z,len+.23,.34,1.06,C.concrete,2,angle);box(m,x,1.25,z,len,.10,.18,C.rust,4,angle);let w=Math.abs(len*Math.cos(angle))+.8,d=Math.abs(len*Math.sin(angle))+.8;collider(x,z,w,d,1.47,'cover');covers.push({x,z});}
function sandbags(m,x,z,len=3.2,angle=0){for(let row=0;row<2;row++)for(let j=0;j<5;j++){let offset=(j-2)*(len/5),cx=x+Math.cos(angle)*offset,cz=z+Math.sin(angle)*offset;
 m.sphere(cx,.25+row*.38,cz,.39,.19,.26,col(C.sand,rng(.85,1.17)),9,9,5);
 }collider(x,z,Math.abs(len*Math.cos(angle))+.5,Math.abs(len*Math.sin(angle))+.5,1.0,'cover');covers.push({x,z});}
function tree(m,x,z,scale=1){let h=rng(4.5,7)*scale;m.cylinder(x,0,z,.19*scale,h*.72,C.rust,13,7,.14*scale);
 for(let j=0;j<7;j++){let ang=j*2.399,rad=rng(.5,1.6)*scale,y=h*.6+rng(-.7,.9)*scale;m.sphere(x+Math.cos(ang)*rad,y,z+Math.sin(ang)*rad,rng(.85,1.55)*scale,rng(.85,1.55)*scale,rng(.85,1.4)*scale,col(C.tree,rng(.65,1.3)),6,7,5);}
}
function bushes(m,x,z,scale=1){for(let j=0;j<5;j++){let aa=rng(-3.14,3.14),rr=rng(0,scale),sx=x+Math.cos(aa)*rr,sz=z+Math.sin(aa)*rr;
 m.sphere(sx,.22*scale,sz,rng(.28,.58)*scale,rng(.20,.44)*scale,rng(.28,.58)*scale,col(rand()>.5?C.leaf:C.grass,rng(.7,1.3)),6,6,4);
 }}
function road(m,x1,z1,x2,z2,width){let dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),yaw=-Math.atan2(dx,dz);
 for(let l=0;l<len;l+=3.2){let end=Math.min(len,l+3.2),mid=(l+end)*.5/len;box(m,x1+dx*mid,.048,z1+dz*mid,width,.07,end-l+.015,col(C.asphalt,rng(.977,1.032)),1,yaw);}
 let nx=dz/len,nz=-dx/len;
 for(let side of [-1,1]){let xx=(x1+x2)/2+nx*width*.48,zz=(z1+z2)/2+nz*width*.48;
 for(let l=0;l<len;l+=3.2){let end=Math.min(len,l+3.2),mid=(l+end)*.5/len;box(m,x1+dx*mid+nx*width*.48,.096,z1+dz*mid+nz*width*.48,.08,.011,end-l,col(C.white,.57),2,yaw);}
 }
 for(let l=3;l<len-1;l+=5){let x=x1+dx*l/len,z=z1+dz*l/len;
 box(m,x,.094,z,.11,.015,2.2,col(C.gold,.62),12,yaw);
 }
}
function lamppost(m,x,z,dir=1){let h=5.5;box(m,x,h/2,z,.26,h,.26,C.steel,3);box(m,x+dir*1.15,h,z,2.3,.12,.16,C.steel,3);
 box(m,x+dir*2.05,h-.10,z,1.2,.17,.7,C.black,3);box(m,x+dir*2.05,h-.22,z,.98,.05,.58,C.light,7);lamps.push([x+dir*2.05,h-.2,z]);}
function watchtower(m,x,z){shadow(m,x,z,4,4,2.3);let h=9.1;for(let dx of [-1.65,1.65])for(let dz of [-1.65,1.65]){
 m.beam(x+dx,0,z+dz,x+dx*.85,h,z+dz*.85,.3,C.steel,3);
 }
 for(let y of [2.5,5,7.5])for(let dz of [-1,1])m.beam(x-1.6*(1-y/h),y,z+dz*1.35,x+1.6*(1-y/h),y,z+dz*1.35,.08,C.rust,3);
 box(m,x,h-.8,z,4.3,.3,4.3,C.steel,3);box(m,x,h+.7,z,4.15,2.65,3.8,C.steel,5);box(m,x,h+2.14,z,5.0,.28,4.8,C.roof,3);
 for(let side of [-1,1]){
 box(m,x+side*2.1,h+.83,z,.06,1.3,2.5,C.glass,10);
 box(m,x,h+.83,z+side*1.91,2.5,1.3,.06,C.glass,10);
 }
 for(let j=0;j<4;j++)box(m,x+2.65,h-1.4+j*.76,z,.24,.12,3.0,C.steel,3);
 collider(x,z,2.5,2.5,10,'tower');}
function smokeFlare(m,x,z){box(m,x,.38,z,1.7,.7,1.7,C.containerRed,3);box(m,x,.8,z,2,.13,2,C.black,3);
 for(let i=0;i<9;i++){let y=1.1+i*.55,xx=x+Math.sin(i*3.4)*(.25+i*.11),zz=z+Math.cos(i*1.9)*(.2+i*.12);m.sphere(xx,y,zz,.7+i*.12,.55+i*.08,.7+i*.13,col(C.enemy,.75+(i%3)*.1),4,7,5);}
}
function pipe(m,x,z,len){m.beam(x,3.4,z,x+len,3.4,z,.45,C.rust,4);for(let p=x;p<=x+len;p+=3.4)box(m,p,2.3,z,.38,2.5,.4,C.steel,3);}
function puddle(m,x,z,w,d){m.plane(x,.115,z,w,d,C.water,11,rng(-.5,.5));}
function tiledGround(m,cx,cz,w,d,step,y,color,mat){for(let x=cx-w/2;x<cx+w/2;x+=step)for(let z=cz-d/2;z<cz+d/2;z+=step){let tw=Math.min(step,cx+w/2-x),td=Math.min(step,cz+d/2-z);let rr=rand(),factor=.966+rr*.070; m.plane(x+tw/2,y,z+td/2,tw+.014,td+.014,col(color,factor),mat);}}

// V2.6 Tidal Dock art kit: modeled industrial hardware, floor stencils and readable lanes.
// Entirely authored as world-space meshes; not a static reference-image backdrop.
const STENCIL_FONT={
 'S':['01110','10001','10000','01110','00001','10001','01110'],
 'K':['10001','10010','10100','11000','10100','10010','10001'],
 '2':['01110','10001','00001','00010','00100','01000','11111'],
 '3':['11110','00001','00001','01110','00001','00001','11110'],
 '4':['00110','01010','10010','11111','00010','00010','00010'],
 '0':['01110','10001','10011','10101','11001','10001','01110'],
 'B':['11110','10001','10001','11110','10001','10001','11110'],
 '-':['00000','00000','00000','11111','00000','00000','00000'],
 ' ':['00000','00000','00000','00000','00000','00000','00000']
};
function groundStencil(m,text,cx,cz,size=0.25,paint=[.34,.56,.65]){
 let characters=text.toUpperCase().split(''); const width=characters.length*6*size;
 for(let ci=0;ci<characters.length;ci++){
  const pattern=STENCIL_FONT[characters[ci]]||STENCIL_FONT[' '];
  for(let zi=0;zi<7;zi++)for(let xi=0;xi<5;xi++){
   if(pattern[zi][xi]==='1')box(m,cx-width/2+(ci*6+xi)*size,.139,cz+(zi-3)*size,size*.92,.007,size*.92,paint,8);
  }
 }
}
function cargoDrone(m,x,z,ang=.1){
 // Four-wheel robotic cargo trolley; equipment is an industrial prop, not a drivable vehicle.
 let a=ang,c=Math.cos(a),q=Math.sin(a),at=(dx,dz)=>[x+dx*c-dz*q,z+dx*q+dz*c];
 shadow(m,x,z,3.5,2.3,.35);
 box(m,x,.64,z,3.0,.78,1.92,[.38,.45,.47],3,a);
 box(m,x,1.18,z,2.45,.28,1.55,[.68,.68,.60],3,a);
 box(m,x,.99,z-.05,1.68,.16,1.3,[.24,.34,.41],10,a);
 for(let dx of [-1.12,1.12])for(let dz of [-.81,.81]){
  const p=at(dx,dz);m.cylinder(p[0],.03,p[1],.31,.53,C.black,9,8);m.cylinder(p[0],.55,p[1],.22,.10,C.steel,3,8);
 }
 for(let dx of [-1.22,1.22]){let p=at(dx,0);box(m,p[0],1.29,p[1],.31,.18,1.3,C.gold,7,a);}
 let p=at(.35,.0);box(m,p[0],1.59,p[1],.97,.63,.82,[.17,.23,.28],3,a);
 p=at(.42,.0);box(m,p[0],1.95,p[1],.75,.07,.69,[.88,.61,.22],12,a);
 collider(x,z,3.15,2.1,1.8,'vehicle');
}
function palletStack(m,x,z,yaw=0,n=3){
 let paint=[.76,.71,.61];for(let j=0;j<3;j++){box(m,x,.11+j*.105,z,2.35,.095,1.65,C.rust,13,yaw);}
 for(let i=0;i<n;i++){let xx=x+(i%2)*.73-.35,zz=z+(Math.floor(i/2))*.56-.2;box(m,xx,.55+(i%2)*.06,zz,.78,.61,.75,paint,13,yaw);box(m,xx,.89+(i%2)*.06,zz,.81,.02,.79,[.53,.50,.42],13,yaw);}
 collider(x,z,2.4,1.7,1.2,'crate');
}
function industrialStencilLane(m){
 // Painted zones, freight numbers, lane diamonds and worn diagonal loading stripes.
 groundStencil(m,'SK-23',18,20,.29,[.27,.54,.62]);
 groundStencil(m,'04',-12,21,.28,[.20,.52,.62]);
 for(let i=0;i<12;i++){
  const x=2.0+i*.96;
  box(m,x,.131,22.7,.21,.007,5.6,[.27,.56,.62],8,-.47);
 }
 for(let i=0;i<8;i++){
  box(m,-10.2+i*1.9,.13,27.5,1.04,.009,.12,[.80,.70,.43],12);
 }
 for(let i=0;i<3;i++){
  box(m,-16+.83*i,.14,11.0,.1,.018,3.0,[.83,.60,.24],12,.17);
 }
 for(let [x,z] of [[-14,10],[26,15],[30,31],[0,25]])gratedDrain(m,x,z,1.9);
}
function specialDockScene(m){
 industrialStencilLane(m);
 // The central lane is kept traversable, additional materials are predominantly visual.
 for(const [x,z] of [[-9,20],[-10,22]])barrel(m,x,z,.42);
 for(const [x,z] of [[-14,27],[8,31],[32,15]])palletStack(m,x,z,0,3);
 cargoDrone(m,21,-1,-.28);
 // Dock edge fencing with one large central opening to keep mission navigation feasible.
 fence(m,4,-8,11,-8,2.2,false);fence(m,18,-8,32,-8,2.2,false);
 for(let x of [3.3,10.8,18.0,26.5,32.8]){
  box(m,x,1.3,-8.0,.25,2.6,.25,[.18,.26,.31],3);
  box(m,x,2.62,-8.0,.45,.16,.55,[.52,.54,.50],3);
 }
 // Freight-loading stacks establish vertical texture readable at near-overhead camera angles.
 for(let i=0;i<3;i++){
  let x=32+i*1.8,z=17;box(m,x,1.1,z,1.6,2.2,1.6,[.63,.62,.52],13);
  box(m,x,2.23,z,1.64,.11,1.64,[.30,.40,.45],3);
 }
 for(let [x,z] of [[26,6],[28,9],[31,7]]){
  let a=rand()*6.28;box(m,x,.14,z,.48,.02,.24,[.38,.55,.61],8,a);
 }
}


function roofLayer(x,y,z,w,h,d,color=C.roof,yaw=0,hideX=x,hideZ=z,hideW=w,hideD=d){roofLayers.push({x,y,z,w,h,d,color,mat:3,yaw,hideX,hideZ,hideW,hideD});}
function curb(m,x,z,w,d){box(m,x,.135,z,w,.13,d,[.56,.60,.60],2);}
function bollard(m,x,z,color=C.gold){box(m,x,.44,z,.24,.88,.24,color,3);box(m,x,.92,z,.30,.08,.30,C.black,3);collider(x,z,.34,.34,.95,'prop');}
function modularShed(m,x,z,w=9.5,d=7.8,h=4.8,yaw=0){
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
function sampleHarborBlock(m){
 // Birth area visual benchmark: road, warehouse annex and combat cover, polished first.
 let cx=13,cz=14;
 // loading lane and curbs
 // Subtle cast-concrete panel joints, not a random chessboard of slabs.
 for(let sx=cx-10;sx<=cx+10;sx+=4.5)box(m,sx,.138,cz, .026,.012,12.6,[.105,.16,.19],2);
 for(let sz=cz-6;sz<=cz+6;sz+=4.1)box(m,cx,.138,sz,20.3,.012,.026,[.105,.16,.19],2);
 box(m,cx,.092,cz,21.0,.08,13.0,[.17,.26,.32],1);
 curb(m,cx,cz-6.58,21.0,.20);curb(m,cx,cz+6.58,21.0,.20);curb(m,cx-10.58,cz,.20,13.0);curb(m,cx+10.58,cz,.20,13.0);
 for(let z of [cz-4.0,cz,cz+4.0]){box(m,cx+4.8,.106,z,.12,.018,2.4,col(C.gold,.9),12);}
 box(m,cx-6.4,.104,cz+5.0,5.2,.018,2.8,col(C.white,.66),12);box(m,cx-6.4,.104,cz+5.0,4.6,.012,2.2,col(C.black,.35),1);
 groundStencil(m,'BK-03',cx+4.3,cz+5.15,.20,[.58,.69,.74]);groundStencil(m,'S2',cx-7.4,cz+5.1,.18,[.74,.70,.50]);
 // modular warehouse annex at east edge of sample area
 modularShed(m,22.2,15.0,9.6,7.8,5.0,0);
 // cover & clutter cluster
 concreteBarrier(m,8.4,18.1,.05,3.9);concreteBarrier(m,19.3,9.2,-.28,3.5);sandbags(m,16.9,18.8,3.1,.14);
 palletStack(m,24.7,19.8,0,3);crate(m,25.2,10.2,1.1);crate(m,21.7,10.4,.8);barrel(m,17.5,9.5,.36);barrel(m,18.2,10.0,.32);
 cargoDrone(m,17.6,13.2,.15);
 // fence gate & small props
 fence(m,26.4,8.7,26.4,20.3,2.2,false);bollard(m,26.1,11.2);bollard(m,26.1,17.7);
 for(let x of [6.8,10.6,14.5,18.2]){gratedDrain(m,x,21.1,1.5);} 
 for(let [x,z] of [[9.0,11.2],[12.2,10.7],[14.0,20.4],[20.8,20.2]]){let a=rand()*6.28;box(m,x,.14,z,.42,.018,.22,[.37,.51,.56],8,a);}
 // flange strips, corner protection and a broken service grate, all decoration
 for(let j=0;j<6;j++)box(m,19.2+j*.58,.11,20.2,.32,.035,.07, j%2?C.gold:C.black,12);
 for(let j=0;j<4;j++)box(m,20.0+j*.60,.11,22.3,.16,.016,.30,[.31,.42,.46],3);
 // warm practical lights
 for(let [x,z,dir] of [[24.8,12.1,-1],[24.8,18.1,-1],[7.0,20.0,1]])lamppost(m,x,z,dir);
 // a thin roofed loading frame with hide-when-underneath behaviour
 box(m,5.6,2.55,13.8,2.8,.18,5.6,C.steel,3);box(m,4.4,1.22,13.8,.20,2.35,.20,C.steel,3);box(m,6.8,1.22,13.8,.20,2.35,.20,C.steel,3);
 roofLayer(5.6,3.15,13.8,3.2,.30,6.0,[.26,.33,.37],0,5.6,13.8,4.4,6.8);
 collider(4.4,13.8,.20,.20,2.6,'prop');collider(6.8,13.8,.20,.20,2.6,'prop');
}

function industrialWorld(){SEED=0x31992;colliders.length=0;covers.length=0;lamps.length=0;roofLayers.length=0;const m=new Mesh();
 // Actual 3D terrain and road infrastructure
 tiledGround(m,0,0,150,139,4.5,-.12,C.ground,0);
 tiledGround(m,-2,0,108,105,4,-.045,C.concrete,2);
 tiledGround(m,0,0,90,75,3,-.036,C.asphalt,1);
 road(m,-54,-19,53,-19,7.5);road(m,-50,16,52,16,8);road(m,13,-50,13,50,8);road(m,-28,-50,-28,47,7);
 road(m,-54,42,52,42,5.5);road(m,-50,-42,46,-42,6);
 // Perimeter fortification and main checkpoints
 for(let x=-56;x<55;x+=3.6){if(x>-36&&x<-25)continue;box(m,x,1.4,-52.7,3.75,2.8,.7,C.concrete,5);box(m,x,2.9,-52.7,3.75,.24,.95,C.roof,3);}
 for(let x=-56;x<55;x+=3.6){if(x>-52&&x<-43)continue;box(m,x,1.3,52.8,3.74,2.6,.6,C.concrete,5);}
 for(let z=-52;z<53;z+=3.6){if(z>-25&&z<-10)continue;box(m,-56.2,1.3,z,.75,2.6,3.72,C.concrete,5);}
 fence(m,55,-52,55,50,2.4);
 // Large real volumetric buildings with roofs, windows, facades
 warehouse(m,-10,-4,23,19,8.1);
 shelter(m,-40,-33,18,16,5.1,C.concrete);
 shelter(m,31,-36,17,12,5.6,C.concrete);
 shelter(m,-41,30,16,15,4.4,C.concrete);
 shelter(m,31,35,16,13,4.3,C.concrete);
 // Factory smoke chimneys and tanks
 for(let i=0;i<4;i++){let xx=25+i*4;m.cylinder(xx,.12,-49,1.15,7+i%2*3,C.rust,4,16,1.05);m.cylinder(xx,7+i%2*3,-49,1.18,.37,C.steel,3,16);}
 for(let x of [-49,-44])for(let z of [-5,1]){m.cylinder(x,.08,z,1.22,3.8,C.rust,4,12);m.cylinder(x,3.88,z,1.24,.22,C.steel,3,12);}
 pipe(m,-52,-4,12);
 // stacked cargo village
 for(let [x,z,r,co] of [[28,-6,0,C.containerBlue],[34,-6,0,C.containerOlive],[41,-6,0,C.containerRed],
 [34,3,1,C.containerRed],[42,3,1,C.containerBlue],[30,26,0,C.containerOlive],[37,26,0,C.containerRed],
 [46,27,0,C.containerBlue],[45,36,1,C.containerRed],[37,-28,1,C.containerBlue],[44,-29,1,C.containerOlive]])container(m,x,z,r,co);
 // road barriers and low-cover combat lanes
 for(let [x,z,a,l] of [[-19,19,.1,4],[-16,24,-.35,4],[5,13,0,4],[21,13,.2,4],[18,-27,.4,4],[-26,-29,.1,3.7],[-34,9,0,4],[26,9,0,3.6],[12,32,.4,4],[-5,36,-.25,4]])concreteBarrier(m,x,z,a,l);
 for(let [x,z,a] of [[-9,14,0],[2,-31,.1],[-43,-12,.2],[18,34,0],[6,34,0],[-24,37,0],[24,-6,.3]])sandbags(m,x,z,3.1,a);
 // forklift and old vehicles (world-space 3D)
 for(let [x,z] of [[-36,15],[9,-34]]){
 box(m,x,.65,z,3.8,1.1,2.2,C.rust,4,.12);box(m,x+.4,1.42,z,1.4,1.1,2.0,C.glass,10,.12);
 for(let xx of [-1.3,1.3])for(let zz of [-.98,.98])m.cylinder(x+xx,.05,z+zz,.38,.5,C.black,9,9);
 box(m,x+1.65,.95,z,.2,1.6,2.1,C.steel,3);collider(x,z,4,2.3,2,'vehicle');}
 // Empty shipping pallets, barrels and scattered supplies
 for(let i=0;i<42;i++){
 let x=rng(-47,49),z=rng(-47,47);if(x>-25&&x<5&&z>-17&&z<13)continue;
 if(rand()<.47){barrel(m,x,z,.25+rng(0,.3));}else{crate(m,x,z,rng(.4,1.2));}
 }
 // Environment detail, vegetation, high quality site lighting
 for(let [x,z] of [[-20,17],[16,8],[19,-24],[-24,-25],[-40,-9],[37,14],[-9,31],[-36,39],[43,39],[-37,-41]])lamppost(m,x,z,rand()>.5?1:-1);
 watchtower(m,-49,4);watchtower(m,47,-43);
 for(let i=0;i<190;i++){
  let x=rng(-70,70),z=rng(-62,62);let beyond=Math.abs(x)>48||Math.abs(z)>46;
  if(beyond&&rand()<.26){tree(m,x,z,rng(.65,1.25));continue;}
  if(rand()<(beyond?.76:.17)){bushes(m,x,z,rng(.25,1.15));}
 }
 for(let i=0;i<38;i++){let x=rng(-53,53),z=rng(-48,48);puddle(m,x,z,rng(.3,1.9),rng(.18,.9));}
 for(let [x,z] of [[-24,3],[23,22],[-37,22],[5,-37]]){
 box(m,x,.12,z,3.2,.2,1.8,C.sand,13);for(let a of [-1,1])crate(m,x+a*.96,z,1.0);}
 // Hand-built industrial scene dressing and readable traversable lanes.
 for(let [x,z] of [[-17,7],[-10,15],[8,7],[22,20],[-38,18],[-30,-24],[6,-33],[36,-14]])gratedDrain(m,x,z,2.1);
 for(let [x,z] of [[7,9],[18,-16],[-18,35],[15,-38],[-46,21]])markings(m,x,z);
 // Cracked asphalt joints, collapsed fence steel, wind-blown foliage and rubble.
 for(let i=0;i<165;i++){
  let x=rng(-52,52),z=rng(-48,48);if(Math.abs(x)<8&&Math.abs(z)<8)continue;
  if(rand()<.47)rebar(m,x,z,rng(0,Math.PI*2));
  else{let size=rng(.06,.23);m.box(x,.09,z,size,rng(.07,.17),size*1.5,rand()<.45?C.concrete:C.rust,4,rng(-1.5,1.5));}
 }
 // Low flying cable loops, barracks access lighting, hazard-striped checkpoint.
 for(let [x,z] of [[-22,-21],[20,16],[44,16],[-38,41]]){
  box(m,x,1.85,z,3.5,.12,.17,C.steel,3);
  box(m,x,1.76,z,2.5,.065,.13,C.light,7);
 }
 for(let j=0;j<6;j++)box(m,-51+j*.55,.155,-18,.24,.025,1.7,j%2?C.gold:C.black,12,-.13);
 // Signal beacon/airdrop built from geometry
 smokeFlare(m,44,-13);
 specialDockScene(m);
 sampleHarborBlock(m);
 return {mesh:m,colliders,covers,lamps,roofs:roofLayers,zoneR:62,seed:SEED};
}
window.BorderWorld={industrialWorld,colliders,covers,lamps,rand,rng,col,crate,barrel,container,concreteBarrier,sandbags};
})();

// BORDERLAND — original, standalone WebGL2 isometric scene renderer (no runtime dependencies)
(function(){ 'use strict';
const VS=`#version 300 es
precision highp float;
in vec3 aPosition; in vec3 aNormal; in vec3 aColor; in vec2 aUv; in float aMaterial;
uniform mat4 uVP;
out vec3 vP,vN,vC; out vec2 vUv; flat out int vMat;
void main(){vP=aPosition;vN=aNormal;vC=aColor;vUv=aUv;vMat=int(aMaterial+.5);gl_Position=uVP*vec4(aPosition,1.);}`;
const FS=`#version 300 es
precision highp float;
in vec3 vP,vN,vC;in vec2 vUv;flat in int vMat;
uniform vec3 uEye;uniform float uTime;uniform vec3 uLight0,uLight1,uLight2,uLight3;
uniform sampler2D uAtlas,uShadow;uniform mat4 uLightVP;uniform float uEnableTextures,uEnableShadows;
out vec4 frag;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
void main(){
 if(vMat==14){frag=vec4(.015,.023,.028,clamp(vC.r,.015,.28));return;}
 vec3 N=normalize(vN); vec3 base=vC;float rough=.76;float emissive=0.;float specScale=.15;
 if(uEnableTextures>.5 && vMat!=7 && vMat!=14){
   float m=clamp(float(vMat),0.,15.);
   vec2 tile=vec2(mod(m,4.),floor(m/4.));
   vec2 localuv=fract(vUv*(vMat==9?.80:(vMat==3?.19:.28)));
   vec2 auv=(tile+mix(vec2(.006),vec2(.994),localuv))/4.;
   vec3 texel=texture(uAtlas,auv).rgb;
   base*=mix(vec3(1.),texel*1.33,.71);
   rough-=.05;
 }
 float grain=n(vP.xz*3.2)*.14+n(vP.xz*14.)*.055;
 if(vMat==0){float noise=n(vP.xz*.26),pebbles=n(vP.xz*5.);base*=.80+.31*noise+.12*pebbles; rough=.33;specScale=.38;}
 if(vMat==1){float cracks=smoothstep(.81,.91,n(vP.xz*.78+vec2(4.2,6.8)));base*=.83+.23*n(vP.xz*.75)-cracks*.30+grain*.4;rough=.29;specScale=.46;}
 if(vMat==2){base*=.81+.27*n(vP.xz*1.25)+.11*n(vP.xz*10.);rough=.66;}
 if(vMat==3){float bars=pow(abs(sin(vUv.x*3.141592*2.*12.)),10.);base*=.78+.25*bars+grain*.6;rough=.34;specScale=.52;}
 if(vMat==4){base*=.75+.32*n(vUv*9.)+.16*pow(n(vUv*34.),3.);rough=.65;}
 if(vMat==5){float line=step(.92,fract(vUv.y*5.));float mot=n(vUv*vec2(13.,6.));base*=.83+.20*mot-line*.27;rough=.76;}
 if(vMat==6){base*=.74+.37*n(vP.xz*2.)+.13*n(vP.xz*9.);rough=.89;}
 if(vMat==7){base*=1.22;emissive=.85;rough=.12;}
 if(vMat==8){base*=.93+.11*n(vUv*8.);rough=.73;}
 if(vMat==9){base*=.83+.23*n(vUv*21.);rough=.82;}
 if(vMat==10){base*=.70+.12*n(vUv*4.);specScale=.85;rough=.08;}
 if(vMat==11){base*=.80+.2*sin(vP.x*3.+uTime*.8)*sin(vP.z*4.-uTime);specScale=.76;rough=.16;}
 if(vMat==12){float st=step(.49,fract((vUv.x+vUv.y)*5.));base*=mix(.5,1.17,st);specScale=.18;}
 if(vMat==13){base*=.7+.3*n(vUv*19.);rough=.88;}
 vec3 L=normalize(vec3(-.55,.83,.38)),V=normalize(uEye-vP);
 float amb=.70;float direct=max(dot(N,L),0.)*.81;
 float visibility=1.;
 if(uEnableShadows>.5){
  vec4 clip=uLightVP*vec4(vP+N*.035,1.);
  vec3 proj=clip.xyz/clip.w*.5+.5;
  if(proj.x>0.&&proj.x<1.&&proj.y>0.&&proj.y<1.&&proj.z<1.){
   float bias=max(.00028,.0011*(1.-max(dot(N,L),0.)));
   float hits=0.;
   for(int oy=-1;oy<=1;oy++)for(int ox=-1;ox<=1;ox++){
    float depth=texture(uShadow,proj.xy+vec2(float(ox),float(oy))/1536.).r;
    hits+=proj.z-bias<depth?1.:0.;
   }
   visibility=.28+.72*hits/9.;
  }
 }
 direct*=visibility;
 vec3 light=vec3(.84,.95,1.03)*(amb+direct);
 vec3 to=vec3(0.);
 for(int i=0;i<4;i++){
   vec3 lp=i==0?uLight0:(i==1?uLight1:(i==2?uLight2:uLight3));
   vec3 ld=lp-vP;float dst=length(ld);ld/=max(dst,.001);
   float att=2.2/(1.+.045*dst*dst)*max(dot(N,ld),0.);
   vec3 tint=i==3?vec3(1.,.23,.12):vec3(1.,.69,.35);
   light+=tint*att;
   to+=tint*pow(max(dot(reflect(-ld,N),V),0.),20.)*att;
 }
 float diffuse=max(dot(N,L),0.);
 vec3 color=base*light;
 color+=pow(max(dot(reflect(-L,N),V),0.),mix(8.,80.,1.-rough))*specScale*(.2+direct)*vec3(.62,.72,.91);
 color+=to*specScale*.35;
 color+=base*emissive*1.25;
 float fog=clamp((distance(vP.xz,uEye.xz)-58.)/110.,0.,.38);
 color=mix(color,vec3(.11,.14,.18),fog);
 color=1.-exp(-color*1.35);color=pow(color,vec3(.91));
 frag=vec4(color,1.);
}`;
const SV=`#version 300 es
in vec3 aPosition;
uniform mat4 uLightVP;
void main(){gl_Position=uLightVP*vec4(aPosition,1.);}`;
const SF=`#version 300 es
precision highp float;
void main(){}`;
const mat4={
 mul(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;},
 ortho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);},
 perspective(fov,aspect,n,f){const k=1/Math.tan(fov/2);return new Float32Array([k/aspect,0,0,0,0,k,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0]);},
 look(eye,target){let z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
};
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}function norm(a){let d=Math.hypot(...a)||1;return a.map(v=>v/d);}
const C={ground:[.11,.17,.22],road:[.15,.25,.32],asphalt:[.18,.29,.36],concrete:[.50,.56,.59],roof:[.23,.28,.33],steel:[.34,.42,.46],rust:[.46,.30,.21],containerRed:[.47,.30,.25],containerBlue:[.24,.37,.45],containerOlive:[.36,.42,.37],grass:[.17,.26,.27],grass2:[.24,.31,.30],leaf:[.17,.30,.31],tree:[.15,.24,.27],light:[1.,.77,.49],gold:[.92,.70,.27],white:[.79,.84,.84],black:[.08,.12,.15],sand:[.60,.56,.46],skin:[.69,.50,.37],uniform:[.27,.35,.35],uniformDark:[.10,.15,.18],armor:[.31,.39,.39],enemy:[.50,.24,.18],gun:[.11,.14,.17],water:[.18,.30,.36],glass:[.24,.41,.47],rope:[.42,.39,.28]};
const clone=a=>a.slice();
class Mesh {
 constructor(){this.a=[];this.buffer=null;this.count=0;}
 tri(a,b,c,n,col,mat,uv){const v=uv||[[0,0],[1,0],[0,1]];for(let i=0;i<3;i++){let p=[a,b,c][i];this.a.push(p[0],p[1],p[2],n[0],n[1],n[2],col[0],col[1],col[2],v[i][0],v[i][1],mat);}}
 quad(a,b,c,d,normal,color,mat,uv){uv=uv||[[0,0],[1,0],[1,1],[0,1]];this.tri(a,b,c,normal,color,mat,[uv[0],uv[1],uv[2]]);this.tri(a,c,d,normal,color,mat,[uv[0],uv[2],uv[3]]);}
 box(x,y,z,w,h,d,color,mat=2,yaw=0,opts={}){
  let hw=w/2,hh=h/2,hd=d/2,cs=Math.cos(yaw),sn=Math.sin(yaw);
  let verts=[[-hw,-hh,-hd],[hw,-hh,-hd],[hw,-hh,hd],[-hw,-hh,hd],[-hw,hh,-hd],[hw,hh,-hd],[hw,hh,hd],[-hw,hh,hd]].map(v=>[x+v[0]*cs-v[2]*sn,y+v[1],z+v[0]*sn+v[2]*cs]);
  let faces=[[0,1,5,4,[0,0,-1]],[2,3,7,6,[0,0,1]],[3,0,4,7,[-1,0,0]],[1,2,6,5,[1,0,0]],[4,5,6,7,[0,1,0]],[3,2,1,0,[0,-1,0]]];
  let colors=opts.colors||[];
  for(let j=0;j<faces.length;j++){let f=faces[j],n=f[4],nr=[n[0]*cs-n[2]*sn,n[1],n[0]*sn+n[2]*cs];let clr=colors[j]||color;
   this.quad(verts[f[0]],verts[f[1]],verts[f[2]],verts[f[3]],nr,clr,mat,[[0,0],[j<2?w:d,0],[j<2?w:d,h],[0,h]]);}
 }
 plane(x,y,z,w,d,color,mat=0,ry=0){let c=Math.cos(ry),s=Math.sin(ry),p=[[ -w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(a=>[x+a[0]*c-a[1]*s,y,z+a[0]*s+a[1]*c]);this.quad(p[0],p[3],p[2],p[1],[0,1,0],color,mat,[[0,0],[0,d],[w,d],[w,0]]);}
 cylinder(x,y,z,rad,height,color,mat=2,segments=10,topRad=rad){let n=segments;for(let i=0;i<n;i++){
 let aa=i/n*Math.PI*2,bb=(i+1)/n*Math.PI*2,co=Math.cos(aa),si=Math.sin(aa),cb=Math.cos(bb),sb=Math.sin(bb);
 let A=[x+rad*co,y,z+rad*si],B=[x+rad*cb,y,z+rad*sb],D=[x+topRad*co,y+height,z+topRad*si],E=[x+topRad*cb,y+height,z+topRad*sb],N=norm([co+cb,0,si+sb]);
 this.quad(A,B,E,D,N,color,mat,[[i/n,0],[(i+1)/n,0],[(i+1)/n,height],[i/n,height]]);
 this.tri([x,y+height,z],D,E,[0,1,0],color,mat);this.tri([x,y,z],B,A,[0,-1,0],color,mat);
 }}
 sphere(x,y,z,rx,ry,rz,color,mat=9,slices=10,stacks=7){for(let i=0;i<stacks;i++){let th0=i/stacks*Math.PI,th1=(i+1)/stacks*Math.PI;for(let j=0;j<slices;j++){let a=j/slices*Math.PI*2,b=(j+1)/slices*Math.PI*2;
  const p=(th,ph)=>[x+Math.sin(th)*Math.cos(ph)*rx,y+Math.cos(th)*ry,z+Math.sin(th)*Math.sin(ph)*rz];
  let A=p(th0,a),B=p(th0,b),D=p(th1,a),E=p(th1,b),n=norm([(A[0]+B[0]+D[0]+E[0])/4-x,(A[1]+B[1]+D[1]+E[1])/4-y,(A[2]+B[2]+D[2]+E[2])/4-z]);
  this.tri(A,D,E,n,color,mat,[[j/slices,i/stacks],[j/slices,(i+1)/stacks],[(j+1)/slices,(i+1)/stacks]]);
  this.tri(A,E,B,n,color,mat);
 }}}
 beam(ax,ay,az,bx,by,bz,width,color,mat=3){let dx=bx-ax,dy=by-ay,dz=bz-az,len=Math.hypot(dx,dy,dz),up=[0,1,0],along=[dx/len,dy/len,dz/len],side=norm(cross(along,up));if(Math.hypot(...side)<.2)side=[1,0,0];let vert=norm(cross(side,along));
 let p=(point,s,v)=>[point[0]+side[0]*s+vert[0]*v,point[1]+side[1]*s+vert[1]*v,point[2]+side[2]*s+vert[2]*v];let A=[ax,ay,az],B=[bx,by,bz],r=width/2;
 let vs=[p(A,-r,-r),p(A,r,-r),p(A,r,r),p(A,-r,r),p(B,-r,-r),p(B,r,-r),p(B,r,r),p(B,-r,r)];let q=[[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];q.forEach(f=>this.quad(vs[f[0]],vs[f[1]],vs[f[2]],vs[f[3]],norm(cross(sub(vs[f[1]],vs[f[0]]),sub(vs[f[2]],vs[f[0]]))),color,mat));}
 upload(gl){this.verts=new Float32Array(this.a);this.count=this.a.length/12;if(gl){if(!this.buffer)this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,this.verts,gl.STATIC_DRAW);}this.a.length=0;}
}
class Renderer{
 constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:false,antialias:true,depth:true,stencil:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});if(!this.gl){this.software=true;this.ctx2=canvas.getContext('2d',{alpha:false});this.staticMesh=new Mesh();this.dynamicMesh=new Mesh();this.viewAngle=Math.PI/2;this.elevation=.9425;this.zoom=29;this.fov=40*Math.PI/180;this.softwarePerspective=.18;this.target=[0,0,0];this.eye=[0,25,35];this.vp=mat4.ortho(-1,1,-1,1,1,400);this.time=0;this.resolution=1;this.cacheAngle=null;this.cache=null;this.resize();return;}const gl=this.gl;
 const compile=(type,src)=>{let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,VS));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,FS));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
 this.locations={};['uVP','uEye','uTime','uLight0','uLight1','uLight2','uLight3','uAtlas','uShadow','uLightVP','uEnableTextures','uEnableShadows'].forEach(k=>this.locations[k]=gl.getUniformLocation(this.program,k));
 this.texturesOn=false;this.shadowsOn=false;
 this.atlas=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.atlas);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([190,190,190,255]));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 this.materialImage=new Image();this.materialImage.onload=()=>{gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.atlas);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.materialImage);gl.generateMipmap(gl.TEXTURE_2D);this.texturesOn=true;};
 this.materialImage.src='assets/industrial_material_atlas.webp';
 try{
  const SH=1536;this.shadowSize=SH;
  this.shadowProgram=gl.createProgram();gl.attachShader(this.shadowProgram,compile(gl.VERTEX_SHADER,SV));gl.attachShader(this.shadowProgram,compile(gl.FRAGMENT_SHADER,SF));gl.linkProgram(this.shadowProgram);
  if(!gl.getProgramParameter(this.shadowProgram,gl.LINK_STATUS))throw Error('Shadow shader unavailable');
  this.shadowAttr=gl.getAttribLocation(this.shadowProgram,'aPosition');this.shadowVP=gl.getUniformLocation(this.shadowProgram,'uLightVP');
  this.shadowTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.shadowTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,SH,SH,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.shadowFbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,this.shadowTex,0);
  gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
  this.shadowsOn=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }catch(e){console.warn('Shadow map unavailable:',e);this.shadowsOn=false;}
 this.attribs=[];for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aUv',2,9],['aMaterial',1,11]]){let l=gl.getAttribLocation(this.program,name);this.attribs.push([l,size,offset]);gl.enableVertexAttribArray(l);}
 this.staticMesh=new Mesh();this.dynamicMesh=new Mesh();this.viewAngle=Math.PI/2;this.elevation=.9425;this.zoom=29;this.fov=40*Math.PI/180;this.softwarePerspective=.18;this.target=[0,0,0];this.eye=[0,25,35];this.vp=mat4.ortho(-1,1,-1,1,1,400);this.time=0;this.resolution=1;this.lights=[[8,7,12],[-6,8,18],[23,7,14],[18,7,-4]];this.resize();gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.CULL_FACE);}
 resize(){let w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight),ratio=Math.min(window.devicePixelRatio||1,1.75)*this.resolution;let nw=Math.max(2,Math.floor(w*ratio)),nh=Math.max(2,Math.floor(h*ratio));if(this.canvas.width!==nw||this.canvas.height!==nh){this.canvas.width=nw;this.canvas.height=nh;if(this.gl)this.gl.viewport(0,0,nw,nh);}this.w=w;this.h=h;}
 camera(target,angle=this.viewAngle,elevation=this.elevation,zoom=this.zoom){
  this.target=[target[0],target[1]||0,target[2]];
  this.viewAngle=angle;this.elevation=elevation;this.zoom=zoom;
  const d=zoom/(2*Math.tan(this.fov/2)),ground=d*Math.cos(elevation);
  this.eye=[target[0]+Math.cos(angle)*ground,target[1]+Math.sin(elevation)*d,target[2]+Math.sin(angle)*ground];
  const a=this.w/this.h;
  this.vp=mat4.mul(mat4.perspective(this.fov,a,.12,360),mat4.look(this.eye,this.target));
 }
 screenToFloor(px,py){
  let nx=2*px/this.w-1,ny=1-2*py/this.h;
  if(this.software){const k=this.softwarePerspective,t=2*py/this.h-1,srcT=t/(1+k*t);nx=nx/(1+k*t);ny=-srcT;}
  const forward=norm(sub(this.target,this.eye)),right=norm(cross(forward,[0,1,0])),up=norm(cross(right,forward));
  const a=this.w/this.h,tan=Math.tan(this.fov/2);
  if(this.software){
    // Orthographic ray inverse of the warped software framebuffer.
    const ss=this.zoom;
    const base=[this.target[0]+right[0]*nx*ss/2*a+up[0]*ny*ss/2,this.target[1]+right[1]*nx*ss/2*a+up[1]*ny*ss/2,this.target[2]+right[2]*nx*ss/2*a+up[2]*ny*ss/2];
    const tt=-base[1]/forward[1];return{x:base[0]+forward[0]*tt,z:base[2]+forward[2]*tt};
  }
  const dir=norm([forward[0]+right[0]*nx*a*tan+up[0]*ny*tan,forward[1]+right[1]*nx*a*tan+up[1]*ny*tan,forward[2]+right[2]*nx*a*tan+up[2]*ny*tan]);
  const tt=(0-this.eye[1])/dir[1];return{x:this.eye[0]+dir[0]*tt,z:this.eye[2]+dir[2]*tt};
 }
 worldToScreen(x,y,z){
  if(this.software){
    const b=softwareBasis(this),q=[x-this.target[0],y-this.target[1],z-this.target[2]],scale=this.h/this.zoom;
    const xx=(q[0]*b.right[0]+q[1]*b.right[1]+q[2]*b.right[2])*scale;
    const yy=-(q[0]*b.up[0]+q[1]*b.up[1]+q[2]*b.up[2])*scale;
    const tt=yy/(this.h/2),dt=tt/(1-this.softwarePerspective*tt),mag=1+this.softwarePerspective*dt;
    return{x:this.w/2+xx*mag,y:this.h/2+dt*this.h/2};
  }
  const m=this.vp,v=[x,y,z,1],cx=m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12],cy=m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13],cw=m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15];
  return{x:(cx/cw*.5+.5)*this.w,y:(.5-cy/cw*.5)*this.h};
 }
 draw(t){this.time=t;this.resize();if(this.software){this.drawSoftware(t);return;}
 const gl=this.gl;
 const lightDirection=norm([-.55,.83,.38]);
 const focus=[this.target[0],0,this.target[2]],eye=focus.map((v,i)=>v+lightDirection[i]*105);
 const lvp=mat4.mul(mat4.ortho(-82,82,-82,82,1,260),mat4.look(eye,focus));
 if(this.shadowsOn){
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFbo);gl.viewport(0,0,this.shadowSize,this.shadowSize);gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.colorMask(false,false,false,false);gl.disable(gl.BLEND);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(2,3);
  gl.useProgram(this.shadowProgram);gl.uniformMatrix4fv(this.shadowVP,false,lvp);
  const a=this.shadowAttr;gl.enableVertexAttribArray(a);
  for(const mesh of [this.staticMesh,this.dynamicMesh]){if(mesh.count<3)continue;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.vertexAttribPointer(a,3,gl.FLOAT,false,48,0);gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
  gl.disable(gl.POLYGON_OFFSET_FILL);gl.colorMask(true,true,true,true);gl.enable(gl.BLEND);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.canvas.width,this.canvas.height);
 }
 gl.useProgram(this.program);gl.clearColor(.064,.086,.107,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.uniformMatrix4fv(this.locations.uVP,false,this.vp);gl.uniformMatrix4fv(this.locations.uLightVP,false,lvp);
 gl.uniform3fv(this.locations.uEye,this.eye);gl.uniform1f(this.locations.uTime,t);
 for(let i=0;i<4;i++)gl.uniform3fv(this.locations['uLight'+i],this.lights[i]);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.atlas);
 gl.uniform1i(this.locations.uAtlas,0);gl.uniform1f(this.locations.uEnableTextures,this.texturesOn?1:0);
 if(this.shadowsOn){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.shadowTex);}
 gl.uniform1i(this.locations.uShadow,1);gl.uniform1f(this.locations.uEnableShadows,this.shadowsOn?1:0);
 for(const mesh of [this.staticMesh,this.dynamicMesh]){if(mesh.count<3)continue;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);for(const [l,size,off] of this.attribs)gl.vertexAttribPointer(l,size,gl.FLOAT,false,48,off*4);gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
 }
 drawSoftware(t){softwareDraw(this,t);}
}

// 2.5D software renderer. Uses exactly the same real 3D geometry and camera as the WebGL renderer.
// This also ensures offline play works in browsers/headless environments where WebGL is disabled.
function softwareBasis(r){let a=r.viewAngle,e=r.elevation,c=Math.cos(a),s=Math.sin(a),te=Math.tan(e),q=1/Math.hypot(1,te),h=q*te;
 return {right:[s,0,-c],up:[-h*c,q,-h*s],front:[c*q,h,s*q]};}
function shade(color,normal,mat,pos){let sun=[-.55,.83,.38],l=Math.max(0,normal[0]*sun[0]+normal[1]*sun[1]+normal[2]*sun[2]);let v=.46+.63*l;
 if(mat===7)v=1.78;if(mat===10)v=1.0;if(mat===14)v=.82;
 if(mat===1)v*=.88;
 if(mat===2)v*=1.03;
 if(mat===3)v*=.98;
 if(mat===5)v*=1.05;
 if(mat===12)v*=1.10;
 let f=Math.sin(pos[0]*4.9+pos[2]*5.5)*.035+Math.sin(pos[0]*1.9-pos[2]*2.2)*.02;
 return 'rgb('+color.map((x,i)=>Math.min(255,Math.max(0,Math.round(255*x*(v+f)*(i===2?1.02:1.0))))).join(',')+')';}
function softwareCache(r){
 const started=performance.now(),basis=softwareBasis(r),scale=14.1,sz=3400;
 const cache=document.createElement('canvas');cache.width=sz;cache.height=sz;
 const c=cache.getContext('2d',{alpha:false,willReadFrequently:false});const id=c.createImageData(sz,sz);
 const pix=new Uint32Array(id.data.buffer),depth=new Float32Array(sz*sz);
 pix.fill(0xff18110c);depth.fill(-1e7);
 const src=r.staticMesh.verts;
 if(!src){r.cache=cache;return;}
 let draws=0,passes=0;
 const right=basis.right,up=basis.up,front=basis.front;
 for(let i=0;i<src.length;i+=36){
  if(Math.round(src[i+11])===14)continue; // translucent GPU shadows are intentionally omitted in software fallback
  const ax=src[i],ay=src[i+1],az=src[i+2];
  const bx=src[i+12],by=src[i+13],bz=src[i+14];
  const cx=src[i+24],cy=src[i+25],cz=src[i+26];
  const x0=sz/2+(ax*right[0]+ay*right[1]+az*right[2])*scale;
  const y0=sz/2-(ax*up[0]+ay*up[1]+az*up[2])*scale;
  const x1=sz/2+(bx*right[0]+by*right[1]+bz*right[2])*scale;
  const y1=sz/2-(bx*up[0]+by*up[1]+bz*up[2])*scale;
  const x2=sz/2+(cx*right[0]+cy*right[1]+cz*right[2])*scale;
  const y2=sz/2-(cx*up[0]+cy*up[1]+cz*up[2])*scale;
  const area=(x1-x0)*(y2-y0)-(y1-y0)*(x2-x0);if(Math.abs(area)<.3)continue;
  const loX=Math.max(0,Math.floor(Math.min(x0,x1,x2))),hiX=Math.min(sz-1,Math.ceil(Math.max(x0,x1,x2)));
  const loY=Math.max(0,Math.floor(Math.min(y0,y1,y2))),hiY=Math.min(sz-1,Math.ceil(Math.max(y0,y1,y2)));
  if(loX>hiX||loY>hiY)continue;
  const d0=ax*front[0]+ay*front[1]+az*front[2],d1=bx*front[0]+by*front[1]+bz*front[2],d2=cx*front[0]+cy*front[1]+cz*front[2];
  const ny=src[i+4],nx=src[i+3],nz=src[i+5],lit=.70+.59*Math.max(0,nx*(-.55)+ny*.83+nz*.38);
  const material=src[i+11],em=material===7?1.6:1.;
  let matBias=1.0;
  if(material===1)matBias=.84; else if(material===2)matBias=1.06; else if(material===3)matBias=.97; else if(material===5)matBias=1.08; else if(material===12)matBias=1.14;
  const v=(.93+Math.sin((ax+bx+cx)*1.74+(az+bz+cz)*1.15)*.04)*lit*em*matBias;
  const red=Math.min(255,Math.max(0,Math.round(src[i+6]*255*v)));
  const green=Math.min(255,Math.max(0,Math.round(src[i+7]*255*v)));
  const blue=Math.min(255,Math.max(0,Math.round(src[i+8]*255*v)));
  const packed=(255<<24)|(blue<<16)|(green<<8)|red;
  const inv=1/area;const A=y1-y2,B=x2-x1,Cx=x1*y2-x2*y1;
  const D=y2-y0,E=x0-x2,F=x2*y0-x0*y2;
  const zA=(d0-d2)*A*inv+(d1-d2)*D*inv;
  const zB=(d0-d2)*B*inv+(d1-d2)*E*inv;
  const zC=d2+(d0-d2)*Cx*inv+(d1-d2)*F*inv;
  const near=area>0;draws++;
  for(let iy=loY;iy<=hiY;iy++){
   let wA=(A*(loX+.5)+B*(iy+.5)+Cx)*inv;
   let wB=(D*(loX+.5)+E*(iy+.5)+F)*inv;
   let zz=zA*(loX+.5)+zB*(iy+.5)+zC;
   let k=iy*sz+loX;
   const dAx=A*inv,dBx=D*inv;
   for(let ix=loX;ix<=hiX;ix++,k++,wA+=dAx,wB+=dBx,zz+=zA){
    if(wA<-.0001||wB<-.0001||wA+wB>1.0001||zz<=depth[k])continue;
    depth[k]=zz;pix[k]=packed;passes++;
   }
  }
 }
 // Subtle film-grain texture makes ground/metal surfaces read as material instead of flat polygon fill.
 for(let y=0;y<sz;y++)for(let x=0;x<sz;x++){
  let k=y*sz+x;let v=pix[k];if(v===0xff211a12)continue;
  let noise=((Math.imul((x+19),374761393)^Math.imul((y+3),668265263))>>>27)-16;
  let rr=Math.max(0,Math.min(255,(v&255)+noise*.28));
  let gg=Math.max(0,Math.min(255,((v>>>8)&255)+noise*.32));
  let bb=Math.max(0,Math.min(255,((v>>>16)&255)+noise*.35));
  pix[k]=(255<<24)|((bb|0)<<16)|((gg|0)<<8)|(rr|0);
 }
 c.putImageData(id,0,0);
 r.cache=cache;r.cacheAngle=r.viewAngle;r.cacheElev=r.elevation;r.cacheDirty=false;r.cacheScale=scale;r.cacheSize=sz;r.cacheBasis=basis;
 window.__BORDERLAND_SOFTWARE_RENDER={triangles:draws,pixels:passes,ms:Math.round(performance.now()-started)};
}

function softwareDraw(r,t){const c=r.ctx2;let w=r.canvas.width,h=r.canvas.height;
 if(!r.cache||Math.abs(r.viewAngle-r.cacheAngle)>.03||Math.abs(r.elevation-r.cacheElev)>.01)softwareCache(r);
 const s=r.cacheScale,b=r.cacheBasis,windowScale=w/r.w,drawScale=r.h/r.zoom;
 let projX=r.target[0]*b.right[0]+r.target[1]*b.right[1]+r.target[2]*b.right[2];
 let projY=r.target[0]*b.up[0]+r.target[1]*b.up[1]+r.target[2]*b.up[2];
 let cx=r.cacheSize/2+projX*s,cy=r.cacheSize/2-projY*s;
 const fullSourceW=r.w*s/drawScale,fullSourceH=r.h*s/drawScale;
 c.setTransform(1,0,0,1,0,0);c.fillStyle='#101922';c.fillRect(0,0,w,h);
 // Perspective-like software fallback: independent depth-conserving warps per scanline.
 // This is NOT the WebGL2 perspective projection and cannot reproduce real PCF shadows/PBR.
 const strength=r.softwarePerspective;
 for(let dy=0;dy<h;dy+=4){let band=Math.min(4,h-dy),t0=(dy/h-.5)*2,t1=((dy+band)/h-.5)*2;
  const u0=t0/(1+strength*t0),u1=t1/(1+strength*t1),tc=(t0+t1)/2,mag=1+strength*tc;
  const sw=fullSourceW/mag,sh=Math.max(.15,(u1-u0)*fullSourceH/2);
  c.drawImage(r.cache,cx-sw/2,cy+u0*fullSourceH/2,sw,sh,0,dy,w,band+.5);
 }
 // Deliberately lightweight art-directed floor contact shadows + practical lamp pools.
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
 // Rasterize dynamic 3D character, weapons and particles using the same projection and geometry.
 let a=r.dynamicMesh.verts;if(!a)return;
 let polygons=[];
 for(let i=0;i<a.length;i+=36){let verts=[],depth=0;
 for(let j=0;j<3;j++){let k=i+j*12,p=[a[k],a[k+1],a[k+2]];const pr=r.worldToScreen(...p);verts.push([pr.x*windowScale,pr.y*windowScale]);depth+=p[0]*b.front[0]+p[1]*b.front[1]+p[2]*b.front[2];}
 let area=Math.abs((verts[1][0]-verts[0][0])*(verts[2][1]-verts[0][1])-(verts[2][0]-verts[0][0])*(verts[1][1]-verts[0][1]));
 if(area<1.2)continue;
 const p=[a[i],a[i+1],a[i+2]],n=[a[i+3],a[i+4],a[i+5]],col=[a[i+6],a[i+7],a[i+8]];
 polygons.push({verts,depth,fill:shade(col,n,a[i+11],p)});
 }
 polygons.sort((a,b)=>a.depth-b.depth);
 for(const p of polygons){let v=p.verts;c.fillStyle=p.fill;c.beginPath();c.moveTo(v[0][0],v[0][1]);c.lineTo(v[1][0],v[1][1]);c.lineTo(v[2][0],v[2][1]);c.closePath();c.fill();}
}

window.BorderRender={Renderer,Mesh,C};
})();

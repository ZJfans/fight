#!/usr/bin/env python3
"""Rebuild the V2.4 original rigged operative GLB. Requires numpy and trimesh."""
from __future__ import annotations
import json, struct, hashlib, math
from pathlib import Path
import numpy as np
import trimesh
ROOT = Path(__file__).resolve().parent.parent
class GLBWriter:
    def __init__(self):
        self.bin=bytearray()
        self.g={'asset':{'version':'2.0','generator':'Dusk Frontier V2.7 original T-pose tactical rig generator'},'scenes':[{'nodes':[]}],'scene':0,'nodes':[],'meshes':[],'skins':[],'materials':[],'animations':[],'buffers':[{'byteLength':0}],'bufferViews':[],'accessors':[]}
    def add_buffer(self,array,component_type=None,typecode=None,minmax=False, target=None):
        arr=np.ascontiguousarray(array)
        while len(self.bin)%4:self.bin.append(0)
        offs=len(self.bin);data=arr.tobytes();self.bin.extend(data)
        v={'buffer':0,'byteOffset':offs,'byteLength':len(data)}
        if target:v['target']=target
        vi=len(self.g['bufferViews']);self.g['bufferViews'].append(v)
        if arr.ndim==1: num=1
        else:num=arr.shape[1]
        tc=typecode or ({1:'SCALAR',2:'VEC2',3:'VEC3',4:'VEC4',16:'MAT4'}[num])
        ct=component_type or ({np.dtype('float32'):5126,np.dtype('uint8'):5121,np.dtype('uint16'):5123,np.dtype('uint32'):5125}[arr.dtype])
        a={'bufferView':vi,'componentType':ct,'count':len(arr),'type':tc}
        if minmax:
            arr2=arr.reshape(len(arr),-1)
            a['min']=arr2.min(axis=0).astype(float).tolist();a['max']=arr2.max(axis=0).astype(float).tolist()
        ai=len(self.g['accessors']);self.g['accessors'].append(a)
        return ai
    def write(self,outpath):
        while len(self.bin)%4: self.bin.append(0)
        self.g['buffers'][0]['byteLength']=len(self.bin)
        js=json.dumps(self.g,ensure_ascii=False,separators=(',',':')).encode('utf8')
        js+=b' ' * ((-len(js))%4)
        length=12+8+len(js)+8+len(self.bin)
        outpath.write_bytes(struct.pack('<III',0x46546c67,2,length)+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(self.bin),0x004e4942)+self.bin)

out=GLBWriter()
# Original palette: warm tactical textiles + dark molded armor, no trademark logos.
matdef=[
('sage_fabric',(0.19,0.24,0.21),0.0,.96),('carbon_shell',(.095,.12,.135),0.18,.6),
('plate_olive',(.30,.34,.28),.08,.78),('utility_tan',(.48,.39,.27),0,.86),
('metal_receiver',(.13,.16,.18),.72,.38),('rubber',(.06,.072,.071),0,.98),
('visor',(.045,.10,.14),.25,.12),('skin',(.51,.35,.25),0,.95),
('warning',(.81,.52,.17),0,.6),('soft_steel',(.26,.31,.34),.68,.44),
('red_tag',(.65,.15,.11),0,.68),('cloth_highlight',(.34,.36,.31),0,.88)]
for name,col,met,rough in matdef:
 out.g['materials'].append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':[col[0],col[1],col[2],1.0],'metallicFactor':met,'roughnessFactor':rough},'doubleSided':False})
mid={m[0]:i for i,m in enumerate(matdef)}
# Native glTF +Y up, -Z forward. Joints have stable anatomical local offsets.
rig=[
('Hips',None,[0,.87,0]),('Spine','Hips',[0,.19,0]),('Chest','Spine',[0,.25,0]),
('Neck','Chest',[0,.17,0]),('Head','Neck',[0,.15,0]),
('LeftUpperArm','Chest',[-.255,.12,0]),('LeftLowerArm','LeftUpperArm',[-.285,0,0]),('LeftHand','LeftLowerArm',[-.235,0,0]),
('RightUpperArm','Chest',[.255,.12,0]),('RightLowerArm','RightUpperArm',[.285,0,0]),('RightHand','RightLowerArm',[.235,0,0]),
('LeftUpperLeg','Hips',[-.135,-.06,0]),('LeftLowerLeg','LeftUpperLeg',[0,-.38,0]),('LeftFoot','LeftLowerLeg',[0,-.315,-.04]),
('RightUpperLeg','Hips',[.135,-.06,0]),('RightLowerLeg','RightUpperLeg',[0,-.38,0]),('RightFoot','RightLowerLeg',[0,-.315,-.04]),
('Weapon','Chest',[0,-.18,-.43])]
ids={name:i for i,(name,_,_) in enumerate(rig)}
rest={}
for name,parent,p in rig:
 pa=np.array(rest[parent]) if parent else np.zeros(3)
 rest[name]=(pa+np.array(p)).tolist()
 out.g['nodes'].append({'name':name,'translation':p,'rotation':[0,0,0,1]})
 if parent:out.g['nodes'][ids[parent]].setdefault('children',[]).append(ids[name])

# Individual armored parts are genuine skinned meshes: per vertex JOINTS_0/WEIGHTS_0.
# This rig uses rigid weighting per equipment part, avoiding artificial rubber deformations.
parts=[]
def add(mesh,joint,material):
 if isinstance(mesh,trimesh.Scene):raise TypeError('bad primitive')
 mesh.fix_normals()
 parts.append((mesh,ids[joint],mid[material]))
def box(name,center,size,joint,mat,angle=None):
 mesh=trimesh.creation.box(extents=size)
 if angle:
  ax,theta=angle
  T=trimesh.transformations.rotation_matrix(theta,ax);mesh.apply_transform(T)
 mesh.apply_translation(center)
 add(mesh,joint,mat)
def ell(center,radius,joint,mat,sub=1):
 mesh=trimesh.creation.icosphere(subdivisions=sub,radius=1)
 mesh.apply_scale(radius);mesh.apply_translation(center);add(mesh,joint,mat)
def capsule(a,b,r,joint,mat,sections=10):
 a=np.array(a);b=np.array(b);v=b-a
 mesh=trimesh.creation.cylinder(radius=r,height=float(np.linalg.norm(v)),sections=sections)
 T=trimesh.geometry.align_vectors([0,0,1],v)
 if T is not None: mesh.apply_transform(T)
 mesh.apply_translation((a+b)/2)
 add(mesh,joint,mat)
def cyl(center,radius,height,joint,mat,axis=(0,1,0),sections=12):
 mesh=trimesh.creation.cylinder(radius=radius,height=height,sections=sections)
 T=trimesh.geometry.align_vectors([0,0,1],axis)
 if T is not None:mesh.apply_transform(T)
 mesh.apply_translation(center); add(mesh,joint,mat)
# anatomical clothed shape / armor vest
ell([0,.91,0],[.20,.17,.125],'Hips','sage_fabric',2)
box('belt',[0,.90,0],[.42,.09,.26],'Hips','rubber')
for sx in [-1,1]:
 box('hip_pouch',[sx*.235,.86,.015],[.12,.17,.17],'Hips','utility_tan')
 box('belt_clasp',[sx*.07,.905,-.141],[.095,.07,.022],'Hips','metal_receiver')
ell([0,1.14,0],[.245,.245,.155],'Spine','sage_fabric',2)
box('carrier',[0,1.28,-.118],[.405,.30,.135],'Chest','carbon_shell')
box('plate',[0,1.29,-.20],[.34,.255,.043],'Chest','plate_olive')
box('rear_plate',[0,1.28,.128],[.355,.275,.065],'Chest','plate_olive')
for sx in [-1,1]:
 box('strap',[sx*.175,1.40,-.166],[.048,.32,.043],'Chest','utility_tan')
 box('pouch',[sx*.12,1.16,-.225],[.108,.125,.075],'Chest','utility_tan')
 box('pouch_flap',[sx*.12,1.20,-.267],[.105,.027,.018],'Chest','carbon_shell')
 box('shoulder',[sx*.256,1.42,0],[.17,.14,.22],'Chest','carbon_shell')
box('radio',[.235,1.34,-.13],[.08,.145,.09],'Chest','metal_receiver')
box('aerial',[.235,1.48,-.13],[.012,.18,.012],'Chest','rubber')
box('backpack',[0,1.265,.22],[.34,.38,.16],'Chest','utility_tan')
box('pack_lid',[0,1.47,.23],[.34,.06,.16],'Chest','carbon_shell')
for sx in [-1,1]:
 box('sling',[sx*.13,1.25,.313],[.045,.25,.025],'Chest','carbon_shell')
box('neckseal',[0,1.50,0],[.18,.12,.15],'Neck','rubber')
# Head, helmet shell / visor, mask, ear defenders
ell([0,1.65,-.005],[.147,.178,.132],'Head','skin',2)
ell([0,1.74,.0],[.182,.106,.164],'Head','carbon_shell',2)
box('helmet_brow',[0,1.715,-.145],[.32,.043,.095],'Head','carbon_shell')
box('visor',[0,1.653,-.14],[.265,.076,.032],'Head','visor')
box('mask',[0,1.576,-.148],[.186,.084,.036],'Head','rubber')
box('helmet_lamp',[0,1.815,-.162],[.075,.032,.065],'Head','metal_receiver')
box('visor_shine',[0,1.678,-.162],[.11,.012,.006],'Head','soft_steel')
for sx in [-1,1]:
 box('earcup',[sx*.155,1.665,-.002],[.065,.124,.128],'Head','carbon_shell')
 box('earmark',[sx*.187,1.663,-.043],[.013,.055,.035],'Head','warning')
# T-pose rest, arms extended along X (1.8m high rig; 18 joints).
for side in ('Left','Right'):
 s=-1 if side=='Left' else 1
 upper=side+'UpperArm'; lower=side+'LowerArm'; hand=side+'Hand'
 capsule([s*.275,1.43,0],[s*.545,1.43,0],.083,upper,'sage_fabric',12)
 ell([s*.545,1.43,0],[.095,.091,.092],upper,'carbon_shell',1)
 capsule([s*.55,1.43,0],[s*.785,1.43,0],.069,lower,'sage_fabric',12)
 box('forearm_guard',[s*.675,1.47,-.046],[.18,.11,.046],lower,'plate_olive')
 ell([s*.795,1.43,0],[.084,.072,.083],hand,'rubber',1)
 box('knuckles',[s*.81,1.47,-.03],[.14,.025,.09],hand,'carbon_shell')
# legs, articulated knee guard and boot sole
for side in ('Left','Right'):
 s=-1 if side=='Left' else 1
 thigh=side+'UpperLeg';shin=side+'LowerLeg';foot=side+'Foot'
 capsule([s*.135,.77,.0],[s*.135,.49,.01],.119,thigh,'sage_fabric',14)
 box('thigh_carrier',[s*.135,.67,-.112],[.182,.16,.044],thigh,'utility_tan')
 ell([s*.135,.47,-.025],[.115,.101,.119],shin,'sage_fabric',1)
 box('knee_shell',[s*.135,.475,-.142],[.175,.128,.04],shin,'plate_olive')
 capsule([s*.135,.435,.013],[s*.135,.17,.012],.086,shin,'sage_fabric',12)
 box('shin_guard',[s*.135,.29,-.105],[.155,.18,.044],shin,'carbon_shell')
 box('boot',[s*.135,.118,-.07],[.24,.16,.35],foot,'rubber')
 box('boot_toecap',[s*.135,.09,-.23],[.22,.10,.09],foot,'carbon_shell')
 box('sole',[s*.135,.042,-.081],[.245,.046,.362],foot,'carbon_shell')
 for j in range(3): box('boot_lace',[s*.135,.162,-.03-j*.05],[.15,.008,.009],foot,'soft_steel')
# Weapon remains a named skeleton bone / socket; weapon mesh is an independent GLB.
# non-trademark original emblem: shoulder danger marking and contrast panel
box('squad_mark',[-.265,1.413,-.12],[.105,.08,.015],'Chest','warning')
box('tag_bar',[-.265,1.403,-.131],[.057,.012,.006],'Chest','carbon_shell')

# build separate primitives by material. Each vertex has exact joint influence.
for material_idx in range(len(matdef)):
 p=[];n=[];j=[];w=[];ix=[]
 for mesh,bone,mat in parts:
  if mat!=material_idx:continue
  offset=len(p);vv=np.asarray(mesh.vertices,dtype=np.float32);nn=np.asarray(mesh.vertex_normals,dtype=np.float32)
  p.extend(vv);n.extend(nn)
  j.extend([[bone,0,0,0]]*len(vv));w.extend([[1.0,0,0,0]]*len(vv))
  ix.extend((np.asarray(mesh.faces,dtype=np.uint32).reshape(-1)+offset).tolist())
 if not p:continue
 pos=out.add_buffer(np.asarray(p,dtype=np.float32),minmax=True,target=34962)
 nor=out.add_buffer(np.asarray(n,dtype=np.float32),target=34962)
 joins=out.add_buffer(np.asarray(j,dtype=np.uint16),target=34962)
 weights=out.add_buffer(np.asarray(w,dtype=np.float32),target=34962)
 inds=out.add_buffer(np.asarray(ix,dtype=np.uint32),target=34963)
 out.g['meshes'].append({'name':'Operative_'+matdef[material_idx][0], 'primitives':[{'attributes':{'POSITION':pos,'NORMAL':nor,'JOINTS_0':joins,'WEIGHTS_0':weights},'indices':inds,'mode':4,'material':material_idx}]})
 # one mesh per material => one skinned node with identical rig & skin
 meshnode=len(out.g['nodes']);out.g['nodes'].append({'name':'Skinned_'+matdef[material_idx][0],'mesh':len(out.g['meshes'])-1,'skin':0})
 out.g['scenes'][0]['nodes'].append(meshnode)

# inverse bind matrices column-major; translation inverse of global rest joint position.
ibm=[]
for name,parent,t in rig:
 x,y,z=rest[name]
 m=np.eye(4,dtype=np.float32);m[:3,3]=[-x,-y,-z]
 ibm.append(m.T.reshape(16))  # flatten column-major
ibm_accessor=out.add_buffer(np.asarray(ibm,dtype=np.float32),typecode='MAT4')
out.g['skins'].append({'name':'OperativeRig','joints':list(range(len(rig))),'skeleton':ids['Hips'],'inverseBindMatrices':ibm_accessor})
out.g['scenes'][0]['nodes'].append(ids['Hips'])

# Keyframe-driven skeletal clips, no external animation dependency.
def quat(axis,a):
 v=np.array(axis,dtype=np.float32);v=v/np.linalg.norm(v);s=math.sin(a*.5);return [float(v[0]*s),float(v[1]*s),float(v[2]*s),float(math.cos(a*.5))]
def anim(name,duration,frames,rotation={},translation={}):
 times=np.linspace(0,duration,frames,dtype=np.float32)
 ts=out.add_buffer(times,minmax=True)
 clip={'name':name,'samplers':[],'channels':[]}
 for bone,f in rotation.items():
  values=np.array([quat(*f(float(t)/duration)) for t in times],dtype=np.float32)
  acc=out.add_buffer(values)
  idx=len(clip['samplers']);clip['samplers'].append({'input':ts,'output':acc,'interpolation':'LINEAR'})
  clip['channels'].append({'sampler':idx,'target':{'node':ids[bone],'path':'rotation'}})
 for bone,f in translation.items():
  values=np.array([f(float(t)/duration) for t in times],dtype=np.float32)
  acc=out.add_buffer(values)
  idx=len(clip['samplers']);clip['samplers'].append({'input':ts,'output':acc,'interpolation':'LINEAR'})
  clip['channels'].append({'sampler':idx,'target':{'node':ids[bone],'path':'translation'}})
 out.g['animations'].append(clip)

# All seven gameplay clips plus Tpose bind-check clip; upper and lower body are independent bone tracks.
def neutral_arm(side, swing=0.0):
 return ((0,0,1), (1.31+swing) if side == 'Left' else (-1.31-swing))
def aim_arm(side, recoil=0.0):
 return ((0,1,0),(-1.26+recoil) if side=='Left' else (1.26-recoil))
def gait_leg(side,t,scale):
 return ((1,0,0), (scale if side == 'Left' else -scale)*math.sin(2*math.pi*t))
anim('Tpose',1.0,2, rotation={})
anim('Idle',2.0,25,rotation={'LeftUpperArm':lambda t:neutral_arm('Left'), 'RightUpperArm':lambda t:neutral_arm('Right'), 'Spine':lambda t:((0,0,1),.012*math.sin(t*2*math.pi)), 'Head':lambda t:((1,0,0),.01*math.sin(t*2*math.pi))},translation={'Hips':lambda t:[0,.87+.006*math.sin(t*2*math.pi),0]})
anim('Walk',1.0,31,rotation={'LeftUpperArm':lambda t:neutral_arm('Left',.14*math.sin(t*2*math.pi)), 'RightUpperArm':lambda t:neutral_arm('Right',-.14*math.sin(t*2*math.pi)), 'LeftUpperLeg':lambda t:gait_leg('Left',t,.37), 'RightUpperLeg':lambda t:gait_leg('Right',t,.37), 'LeftLowerLeg':lambda t:((1,0,0),-.15-.16*max(0,math.sin(t*2*math.pi))), 'RightLowerLeg':lambda t:((1,0,0),-.15-.16*max(0,-math.sin(t*2*math.pi)))},translation={'Hips':lambda t:[0,.87+.014*abs(math.sin(t*2*math.pi)),0]})
anim('Run',.72,30,rotation={'LeftUpperArm':lambda t:neutral_arm('Left',.19*math.sin(t*2*math.pi)), 'RightUpperArm':lambda t:neutral_arm('Right',-.19*math.sin(t*2*math.pi)), 'LeftUpperLeg':lambda t:gait_leg('Left',t,.60), 'RightUpperLeg':lambda t:gait_leg('Right',t,.60), 'LeftLowerLeg':lambda t:((1,0,0),-.22-.27*max(0,math.sin(t*2*math.pi))), 'RightLowerLeg':lambda t:((1,0,0),-.22-.27*max(0,-math.sin(t*2*math.pi))), 'Spine':lambda t:((1,0,0),.11)},translation={'Hips':lambda t:[0,.87+.034*abs(math.sin(t*2*math.pi)),0]})
anim('Crouch',1.0,25,rotation={'LeftUpperArm':lambda t:aim_arm('Left'), 'RightUpperArm':lambda t:aim_arm('Right'), 'LeftUpperLeg':lambda t:((1,0,0),-.75), 'RightUpperLeg':lambda t:((1,0,0),-.75), 'LeftLowerLeg':lambda t:((1,0,0),1.05),'RightLowerLeg':lambda t:((1,0,0),1.05), 'Spine':lambda t:((1,0,0),.24)},translation={'Hips':lambda t:[0,.67+.005*math.sin(t*2*math.pi),0]})
anim('Aim',1.0,15,rotation={'LeftUpperArm':lambda t:aim_arm('Left'), 'RightUpperArm':lambda t:aim_arm('Right'), 'LeftLowerArm':lambda t:((1,0,0),-.2), 'RightLowerArm':lambda t:((1,0,0),-.2),'Head':lambda t:((1,0,0),-.055)})
anim('Shoot',.32,15,rotation={'LeftUpperArm':lambda t:aim_arm('Left',.13*math.exp(-t*6)), 'RightUpperArm':lambda t:aim_arm('Right',.13*math.exp(-t*6)), 'Spine':lambda t:((1,0,0),-.05*math.exp(-t*6)), 'Weapon':lambda t:((1,0,0),-.16*math.exp(-t*6))})
anim('Reload',1.55,30,rotation={'LeftUpperArm':lambda t:aim_arm('Left',-.26*math.sin(t*math.pi)), 'RightUpperArm':lambda t:aim_arm('Right',.13*math.sin(t*math.pi)), 'LeftLowerArm':lambda t:((1,0,0),-.65*math.sin(t*math.pi)), 'Weapon':lambda t:((0,0,1),.16*math.sin(t*math.pi))})
# Some importers require animation root directed scene graph. Parent skinned mesh nodes under root scene so valid.
GLB=ROOT/'assets/characters/operative.glb';GLB.parent.mkdir(parents=True,exist_ok=True)
out.write(GLB)
# Native Godot asset may be scaled via visual transform; original model around 1.8m.
# A tiny deterministic manifest for reproducibility.
json.dump({'asset':'Dusk Frontier original T-pose operative','format':'glTF 2.0 binary','original':True,'bones':len(rig),'clips':[a['name'] for a in out.g['animations']], 'mesh_primitives':len(out.g['meshes']), 'triangles':sum(len(p[0].faces) for p in parts),'sha256':hashlib.sha256(GLB.read_bytes()).hexdigest()},open(ROOT/'assets/characters/asset_manifest.json','w'),ensure_ascii=False,indent=2)
print('GLB created',GLB,GLB.stat().st_size,'meshpieces',len(parts),'triangles',sum(len(p[0].faces) for p in parts))

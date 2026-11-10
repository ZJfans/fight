from pathlib import Path
import random, math, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import trimesh
from trimesh.visual import TextureVisuals
from trimesh.visual.material import SimpleMaterial
root=Path('/mnt/data/borderland_v29')
matdir=root/'assets/materials';matdir.mkdir(parents=True,exist_ok=True)
moddir=root/'assets/modules';moddir.mkdir(exist_ok=True)
web=root/'web_playable/assets'
rng=np.random.default_rng(2901)
S=512
# intentionally subdued hand-authored procedural pattern, little noise
specs={
'concrete': (192,200,201), 'asphalt':(123,142,152), 'painted_metal':(172,187,186), 'roof_metal':(152,166,174), 'fabric':(150,164,159), 'crate':(183,169,149), 'rust':(159,125,103)}
textures={}
for name, rgb in specs.items():
 yy,xx=np.mgrid[:S,:S]; noise=rng.normal(0,2.6 if name not in ('asphalt','concrete') else 3.4,(S,S))
 arr=np.empty((S,S,3),dtype=np.float32)
 pat=np.zeros((S,S),dtype=np.float32)
 if name=='concrete':
  pat+=(np.sin(xx/113)*1.5+np.sin(yy/94)*1.3)
  pat-=((xx%256)<2)*8
 elif name=='asphalt':
  pat+=(rng.integers(-5,5,(S,S))*.55)
  pat-=((yy%224)<2)*5
 elif name=='painted_metal':
  pat+=(np.cos(xx/29)*2.1);pat-=((xx%55)<3)*13;pat+=((xx%55)>49)*3
 elif name=='roof_metal':
  pat-=((xx%42)<3)*17;pat+=(np.cos(xx/21)*1.6)
 elif name=='fabric':
  pat+=((xx+yy)%11<2)*-5+((xx-yy)%13<2)*3
 elif name=='crate':
  pat+=np.sin(yy/6.4)*2;pat-=((yy%94)<2)*9
 elif name=='rust':
  pat+=np.sin(xx/38+np.sin(yy/47))*4+np.cos(yy/72)*2
 for k in range(3):arr[:,:,k]=rgb[k]+noise+pat*(.92 if k==0 else 1.)
 im=Image.fromarray(arr.clip(0,255).astype('uint8'),'RGB')
 path=matdir/f'DF_MAT_{name}_albedo.png';im.save(path,optimize=True);textures[name]=im
 # flat roughness map with bounded material-specific variation
 rough={'concrete':223,'asphalt':230,'painted_metal':149,'roof_metal':160,'fabric':238,'crate':220,'rust':216}[name]
 rough_img=Image.fromarray(np.clip(rough+rng.normal(0,4,(S,S)),0,255).astype('uint8'),'L')
 rough_img.save(matdir/f'DF_MAT_{name}_roughness.png',optimize=True)
# new 4x4 material atlas for the custom engine (grayscale avoids double coloring)
chosen={0:'asphalt',1:'asphalt',2:'concrete',3:'painted_metal',4:'rust',5:'concrete',8:'concrete',9:'fabric',12:'painted_metal',13:'crate'}
atlas=Image.new('RGB',(1536,1536),(200,200,200));tile=384
for idx in range(16):
 name=chosen.get(idx,'roof_metal'); img=textures[name].resize((tile,tile),Image.Resampling.LANCZOS)
 # retain material colors from vertex colors: normalize albedo to light gray
 arr=np.asarray(img).astype(np.float32);av=np.mean(arr,axis=(0,1));grey=np.mean(arr,axis=2)
 grey=np.clip(grey-grey.mean()+197,165,233).astype('uint8')
 if idx==7:grey[:,:]=224
 if idx==10:grey[:,:]=192
 atlas.paste(Image.fromarray(np.stack([grey]*3,axis=-1),'RGB'),((idx%4)*tile,(idx//4)*tile))
atlas.save(web/'industrial_material_atlas.webp','WEBP',quality=88)

# original modular 3D assets, glTF metres, Y up
M={
 'wall': (96,117,121,255),'roof':(50,67,76,255),'rim':(46,61,68,255),'trim':(43,59,66,255),'glass':(70,112,119,255),
 'concrete':(156,165,165,255),'bollard':(202,165,69,255),'dark':(31,44,50,255),'yellow':(226,185,91,255),
 'sand':(177,166,142,255),'pallet':(127,107,86,255),'steel':(91,109,114,255),'black':(26,38,43,255)
}
def material(color):return SimpleMaterial(diffuse=M[color], name='DF_'+color)
def scene_mesh():
 scene=trimesh.Scene();n=0
 def box(name,x,y,z,w,h,d,mat):
  nonlocal n
  mesh=trimesh.creation.box(extents=[w,h,d]);mesh.visual=TextureVisuals(material=material(mat));
  scene.add_geometry(mesh, node_name=name+'_'+str(n), geom_name='geo'+str(n),transform=trimesh.transformations.translation_matrix([x,y,z]));n+=1
 return scene,box

def export(name,fun):
 scene,box=scene_mesh();fun(box);buf=scene.export(file_type='glb');p=moddir/name;p.write_bytes(buf)
 chk=trimesh.load(p,force='scene');b=chk.bounds
 print(name, len(buf), 'meshes',len(chk.geometry),'dimensions', [round(float(x),3) for x in chk.extents]);
 return {'file':name,'purpose':name[7:-4],'size_m':[round(float(x),2) for x in chk.extents], 'meshes':len(chk.geometry),'source':'Original procedural authored for Dusk Frontier V2.9','format':'glTF 2.0 GLB, metres, Y up'}
manifest=[]
def annex(box):
 w=9.6;d=7.8;h=5.0;seg=(w-2.60)/2;z=d/2
 box('rear_wall',0,h/2,-d/2,w,h,.24,'wall')
 for side in [-1,1]:
  box('side_wall',side*w/2,h/2,0,.24,h,d,'wall')
  x=side*(2.60+seg)/2
  box('front_panel',x,h/2,z,seg,h,.24,'wall')
  wx=x+side*seg*.18
  box('window_frame',wx,2.75,z+.15,1.50,1.35,.16,'trim')
  box('window_glazing',wx,2.75,z+.245,1.20,1.08,.06,'glass')
  box('window_mullion',wx,2.75,z+.29,.09,1.30,.08,'rim')
  box('sill',wx,1.98,z+.22,1.60,.13,.27,'concrete')
  box('foundation',x,.24,z+.15,seg,.48,.29,'concrete')
  for i in range(4):box('service_vent',wx+(i-1.5)*.32,1.48,z+.23,.05,.28,.08,'trim')
 box('door_lintel',0,4.17,z,w,1.65,.24,'wall')
 box('door_cap',0,3.52,z+.26,3.06,.24,.32,'trim')
 for side in [-1,1]:box('door_jamb',side*1.38,1.67,z+.19,.19,3.34,.28,'trim')
 box('threshold',0,.14,z+.25,3.04,.09,.55,'concrete')
 box('loading_canopy',0,3.49,z+1.34,4.0,.19,2.6,'roof')
 for side in [-1,1]:box('canopy_post',side*1.8,1.74,z+2.52,.18,3.48,.18,'trim')
 box('lamp_fixture',0,3.22,z+1.22,1.25,.09,.40,'yellow')
 box('pipe',-w/2-.22,2.85,-.75,.20,.20,4.5,'steel')
 box('downspout',-w/2-.32,1.85,d/2-.55,.22,3.40,.22,'steel')
 for j in range(5):box('east_vent',w/2+.16,2.85,-1.00+j*.31,.07,.36,.09,'dark')
manifest.append(export('DF_ART_HarborAnnex_Walls.glb',annex))
def roof(box):
 w=9.6;d=7.8;h=5.0
 box('roof_main',0,h+.18,0,w+.5,.28,d+.54,'roof')
 for i in range(14):box('roof_rib',-w/2+.3+i*(w-.6)/13,h+.38,0,.075,.12,d+.48,'rim')
 for k in range(-2,3):box('roof_vent',-w/2+.5,h+.32,k*1.25,.45,.12,.13,'steel')
manifest.append(export('DF_ART_HarborAnnex_Roof.glb',roof))
def barricade(box):
 box('precast_base',0,.65,0,3.8,1.30,1.02,'concrete');box('coping',0,1.37,0,3.88,.15,1.16,'wall')
 for i in [-1,1]:box('side_band',i*1.71,.73,.52,.11,.88,.07,'yellow')
 box('safety_line',0,1.20,.54,3.5,.12,.075,'yellow')
manifest.append(export('DF_ART_ConcreteCover.glb',barricade))
def pallet(box):
 for j in range(3):box('pallet_slats',0,.12,j*.48-.48,1.45,.12,.32,'pallet')
 for i in [-1,1]:box('pallet_riser',i*.53,.23,0,.24,.25,1.38,'pallet')
 box('cargo_case',0,.63,0,1.18,.60,1.06,'sand')
 for i in [-1,1]:box('strap',i*.42,.64,0,.08,.62,1.09,'steel')
manifest.append(export('DF_ART_PalletSupply.glb',pallet))
def lamp(box):
 box('mast',0,2.75,0,.20,5.5,.20,'steel');box('arm',1.05,5.45,0,2.20,.15,.17,'steel')
 box('sodium_lamp',2.05,5.30,0,1.0,.12,.62,'yellow');box('hood',2.05,5.40,0,1.14,.12,.68,'roof')
manifest.append(export('DF_ART_DockLight.glb',lamp))
(meta:=moddir/'DF_ART_MANIFEST_V29.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('materials=',len(list(matdir.glob('*'))),'manifest=',meta)

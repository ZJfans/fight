"""Deterministic texture pack from original user-session concept map & procedural detail."""
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance
import numpy as np, random, os
rng=random.Random(20261110)
root=os.path.dirname(__file__);im=Image.open('/mnt/data/暮色边境工业战区地图.png').convert('RGB');size=384
# Crop areas with real painted surface structure from original concept artwork.
regions=[
 (675,780,1010,918), # terrain
 (690,542,925,682),  # roadway
 (664,344,965,475),  # concrete floor
 (602,231,916,330),  # roofing corrugation
 (1030,320,1460,432),# shipping containers
 (73,400,345,580),  # ruined masonry
 (710,760,1260,890), # vegetation
 (665,332,800,433),  # lamp glints
 (718,230,916,410),  # concrete
 (137,535,345,660),  # cloth-ish
 (1245,445,1588,630),# glass
 (1238,678,1613,849),# water
 (708,370,1032,492), # concrete
 (315,686,610,829),  # dirt
 (720,335,930,490),  # polished
 (618,223,923,334),  # dark roof
]
# Generate textured grayscale albedo tiles: material color is set by mesh/lighting.
atlas=Image.new('RGB',(size*4,size*4));colors=[]
for k,(a,b,c,d) in enumerate(regions):
 crop=im.crop((a,b,c,d)).resize((size,size),Image.Resampling.BICUBIC)
 crop=ImageEnhance.Color(crop).enhance(.32 if k not in (6,7,11) else .60)
 arr=np.asarray(crop).astype(np.float32)
 # grayscale material detail, preserving the painted edge/texture arrangement
 lum=arr[:,:,0]*.2126+arr[:,:,1]*.7152+arr[:,:,2]*.0722
 lum=(lum-lum.mean())*.45 + 176
 yy,xx=np.indices((size,size))
 noise=np.random.default_rng(98765+k).normal(0,9,(size,size))
 tex=lum+noise
 if k in (0,1,2,5,13):
  # fine grit + irregular slab grouting
  tex -= ((xx%96)<2)*10
  tex -= ((yy%99)<2)*9
 if k in (3,4,8,9,15):
  tex -= ((xx%18)<2)*24
  tex += ((xx%18)>15)*5
 if k==4:
  dots=np.random.default_rng(45).random((size,size))
  tex-=np.where(dots>.955,40,0)
 if k==9:
  # camo mottling for clothing
  a=np.sin(xx*.068+np.cos(yy*.09))*np.cos(yy*.085)
  tex+=a*28
 if k==11:
  tex+=np.sin(xx*.13+np.sin(yy*.08)*5)*11
 if k==12:
  tex-=np.where(((xx+yy)//48)%2==0,20,0)
 if k==7:tex+=28
 tex=np.uint8(np.clip(tex,45,244))
 rgb=np.stack([tex,tex,tex],axis=-1)
 rgb[:,:,1]=np.clip(rgb[:,:,1].astype(np.float32)*(1.02 if k in (0,6,11) else 1),0,255).astype(np.uint8)
 tile=Image.fromarray(rgb,'RGB')
 atlas.paste(tile,((k%4)*size,(k//4)*size))
atlas.save(os.path.join(root,'assets','industrial_material_atlas.webp'),quality=88,method=6)
print('atlas built',os.path.getsize(os.path.join(root,'assets','industrial_material_atlas.webp')))

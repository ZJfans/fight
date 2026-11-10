"""Generate an original, redistributable glTF binary articulated test character."""
import trimesh
from pathlib import Path
s=trimesh.Scene()
def part(name, ext, translation, color):
 m=trimesh.creation.box(extents=ext)
 m.visual.vertex_colors=color
 s.add_geometry(m,node_name=name,geom_name=name,transform=trimesh.transformations.translation_matrix(translation))
part('torso',[.62,.84,.34],[0,1.25,0],[55,86,91,255])
part('vest',[.68,.60,.40],[0,1.30,.16],[47,55,57,255])
part('head',[.34,.38,.34],[0,1.91,0],[170,134,104,255])
part('helmet',[.42,.20,.43],[0,2.13,0],[58,70,66,255])
part('leg_L',[.24,.89,.26],[-.21,.46,0],[54,67,62,255])
part('leg_R',[.24,.89,.26],[.21,.46,0],[54,67,62,255])
part('arm_L',[.23,.77,.24],[-.48,1.25,.04],[61,77,72,255])
part('arm_R',[.23,.77,.24],[.48,1.25,.04],[61,77,72,255])
part('rifle',[.13,.15,.90],[.10,1.31,.56],[35,39,41,255])
part('backpack',[.50,.67,.27],[0,1.25,-.30],[70,76,66,255])
p=Path(__file__).resolve().parent.parent/'assets'/'operative_original.glb'
p.write_bytes(s.export(file_type='glb'))
print(p,p.stat().st_size)

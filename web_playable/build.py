from pathlib import Path
import base64,re
root=Path(__file__).parent
html=(root/'index.html').read_text()
css=(root/'src/style.css').read_text()
img=base64.b64encode((root/'assets/lobby_operative.webp').read_bytes()).decode()
css=css.replace("../assets/lobby_operative.webp","data:image/webp;base64,"+img)
html=html.replace('<link rel="stylesheet" href="src/style.css"/>','<style>'+css+'</style>')
for stem in ['render','world','gltf_actor','weapons','game']:
 src=(root/'src'/f'{stem}.js').read_text()
 src=src.replace('</script','<\\/script')
 html=html.replace('<script src="src/'+stem+'.js"></script>','<script>'+src+'</script>')
# Inline original GLB as a base64 data URL for offline fetch-free loading.
model=base64.b64encode((root.parent/'assets/characters/operative.glb').read_bytes()).decode()
html=html.replace("fetch('assets/operative_original.glb')","fetch('data:model/gltf-binary;base64,"+model+"')")
# Inline separate original GLB weapon resources; the standalone HTML needs no network.
wfiles=['DF_WPN_R07_Rifle.glb','DF_WPN_S12_Shotgun.glb','DF_WPN_M01_Pistol.glb']
weapon_urls=['data:model/gltf-binary;base64,'+base64.b64encode((root.parent/'assets/weapons'/name).read_bytes()).decode() for name in wfiles]
html=html.replace("loadGLB('assets/weapons/'+n)","loadGLB(["+','.join(repr(u) for u in weapon_urls)+"][i])")
# Inline original material atlas for completely offline rendering.
texture=base64.b64encode((root/'assets/industrial_material_atlas.webp').read_bytes()).decode()
html=html.replace("this.materialImage.src='assets/industrial_material_atlas.webp'","this.materialImage.src='data:image/webp;base64,"+texture+"'")
# Inline all eight role-view sprites so the HTML is self-contained and runs offline.
for i in range(8):
 filename=f'assets/operative_{i}.webp'
 data=base64.b64encode((root/filename).read_bytes()).decode()
 # The JS constructs each filename dynamically. Replace the expression in the JS once with an array lookup.
 if i==0:
  urls=[]
 urls.append('data:image/webp;base64,'+data)
html=html.replace("'assets/operative_'+i+'.webp'", "["+','.join(repr(url) for url in urls)+"][i]")
standalone=root/'暮色边境_立即试玩.html'
standalone.write_text(html)
print(standalone, len(html))

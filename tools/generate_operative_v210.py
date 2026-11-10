#!/usr/bin/env python3
"""Original 1.8m skinned team silhouettes for Dusk Frontier V2.10.
Based on this project's V2.7 rig generator; two faction variants share a bone map.
Requires trimesh/numpy; outputs self-contained glTF2 GLBs with skin + keyframes.
"""
from __future__ import annotations
import os
from pathlib import Path
src=Path(__file__).with_name('generate_operative_v27.py').read_text()
# V2.7 source already has Tpose and seven action clips. Keep its stable 18-bone names.
src=src.replace('import json, struct, hashlib, math','import json, struct, hashlib, math, os')
src=src.replace('ROOT = Path(__file__).resolve().parent.parent',"ROOT = Path(__file__).resolve().parent.parent\nFACTION=os.environ.get('DF_FACTION','player')\nHOSTILE=FACTION=='enemy'")
start=src.index('matdef=[\n')
end=src.index('for name,col,met,rough in matdef:',start)
mat="""matdef=[
('sage_fabric',(0.25,0.34,0.28) if not HOSTILE else (0.29,0.31,0.35),0.0,.94),
('carbon_shell',(.08,.115,.12) if not HOSTILE else (.12,.13,.16),0.14,.63),
('plate_olive',(.40,.46,.35) if not HOSTILE else (.34,.33,.31),.07,.78),
('utility_tan',(.55,.46,.30) if not HOSTILE else (.50,.38,.30),0,.86),
('metal_receiver',(.13,.17,.19),.56,.44),
('rubber',(.055,.075,.08),0,.96),
('visor',(.08,.19,.22) if not HOSTILE else (.15,.17,.19),.25,.18),
('skin',(.54,.40,.31),0,.95),
('warning',(.88,.72,.32) if not HOSTILE else (.89,.35,.22),0,.64),
('soft_steel',(.37,.43,.43),.52,.51),
('red_tag',(.70,.17,.13),0,.70),
('cloth_highlight',(.35,.43,.33) if not HOSTILE else (.45,.37,.34),0,.89)]
"""
src=src[:start]+mat+src[end:]
# New kit elements clearly visible from 54-degree camera. All are skinned rigid attachments.
needle="# build separate primitives by material. Each vertex has exact joint influence."
extras="""
# Camera-readability accents: helmet rear/sides, plated shoulders, left/right arm ID,
# broad pack silhouette, respirator/filter, rear antenna, shin protection.
for side in [-1,1]:
 box('upper_arm_armor',[side*.365,1.43,-.023],[.22,.115,.215],'Chest','plate_olive')
 box('unit_sleeve',[side*.35,1.50,-.14],[.14,.063,.045],'Chest','warning')
 box('helmet_side_rail',[side*.161,1.73,-.005],[.045,.064,.205],'Head','soft_steel')
 box('helmet_chevron',[side*.12,1.795,-.07],[.085,.025,.11],'Head','warning')
 box('shin_armor',[side*.135,.30,-.137],[.19,.20,.056],'LeftLowerLeg' if side<0 else 'RightLowerLeg','plate_olive')
box('helmet_rear_panel',[0,1.705,.149],[.255,.080,.048],'Head','plate_olive')
box('raised_headset',[0,1.826,-.01],[.26,.045,.13],'Head','carbon_shell')
box('helmet_front_sensor',[0,1.81,-.179],[.11,.042,.075],'Head','warning')
box('rear_backpack_frame',[0,1.27,.325],[.37,.42,.085],'Chest','carbon_shell')
box('rear_roll',[0,1.50,.342],[.30,.11,.12],'Chest','cloth_highlight')
box('lower_vest_back',[0,1.04,.19],[.40,.18,.10],'Hips','plate_olive')
box('respirator',[0,1.58,-.19],[.155,.125,.09],'Head','rubber')
for side in [-1,1]:
 cyl([side*.125,1.576,-.239],.055,.09,'Head','soft_steel',(0,0,1),8)
# A compact visual-only sling from vest to stock area; separate weapons are held by the socket.
box('chest_sling',[-.175,1.34,-.19],[.038,.39,.052],'Chest','utility_tan',angle=((0,0,1),-.28))
# Distinct hostile upper-arm tag (team identity independent of UI labels).
if HOSTILE:
 box('rear_enemy_band',[0,1.49,.324],[.36,.105,.042],'Chest','red_tag')
 box('rear_enemy_helmet',[0,1.80,.126],[.23,.05,.07],'Head','warning')
 box('radio_flag',[.285,1.52,.21],[.068,.13,.024],'Chest','red_tag')
else:
 box('rear_player_band',[0,1.50,.347],[.39,.102,.042],'Chest','warning')
 box('rear_player_helmet',[0,1.80,.137],[.24,.055,.061],'Head','warning')
 box('medical_patch',[-.28,1.36,.21],[.09,.09,.04],'Chest','cloth_highlight')
"""
src=src.replace(needle,extras+'\n'+needle)
src=src.replace("GLB=ROOT/'assets/characters/operative.glb'","GLB=ROOT/('assets/characters/operative_hostile.glb' if HOSTILE else 'assets/characters/operative.glb')")
src=src.replace("json.dump({'asset':'Dusk Frontier original T-pose operative'", "json.dump({'asset':'Dusk Frontier V2.10 T-pose '+FACTION+' operative'")
src=src.replace("ROOT/'assets/characters/asset_manifest.json'","ROOT/('assets/characters/asset_manifest_enemy.json' if HOSTILE else 'assets/characters/asset_manifest.json')")
# Avoid nested prints' path issue in execute compiled source.
exec(compile(src,str(Path(__file__).with_name('generate_operative_v27.py')),'exec'),{'__file__':str(Path(__file__).with_name('generate_operative_v27.py')),'__name__':'__main__'})

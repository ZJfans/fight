# V2.3 Character asset acquisition and license ledger

No external assets are bundled in this release: the environment cannot fetch remote files. The included `assets/operative_original.glb` is the legacy unskinned original and is **not** a skinned character.

Recommended first: Quaternius Universal Base Characters, CC0, https://quaternius.com/packs/universalbasecharacters.html ; animation source: Quaternius Universal Animation Library, CC0, https://quaternius.com/packs/universalanimationlibrary.html . Both publishers describe commercial usage as allowed. The free Standard animation set is a subset of the full library. Verify the exact downloaded package and naming before importing.

Alternative technical test: Khronos CesiumMan, CC BY 4.0, https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMan ; attribution and logo/trademark restrictions apply. It is not a final tactical soldier.

Import: copy the model to `assets/characters/operative.glb`, open the project in Godot 4, wait for the GLB import, run F5. Check the output for `CHARACTER_ASSET_READY bones=... clips=...`. If no clip names match Idle/Walk/Run/Sprint/Crouch/Shoot, edit the mapping in `character_asset_slot.gd` or retarget the animations in Godot. Skeleton detection alone does not establish a correct animation/mesh retarget. Keep a record of file origin, version, SHA-256 and license before distributing.

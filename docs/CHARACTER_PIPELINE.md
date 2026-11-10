# V2.1 Character art pipeline

## Implemented
- Original modular 3D operative made from Godot BoxMesh primitives (helmet, visor, vest, pouches, backpack, articulated arms and legs, rifle, muzzle flash).
- Independent animation pivots for torso, head, arms, legs and rifle.
- Procedural walk/run/crouch/reload/recoil/hit poses driven by actor.gd.
- Player and enemy palette distinction. No external art licensing required.

## Not implemented
- This is **not** a skinned humanoid mesh and does not use Skeleton3D or AnimationTree.
- No licensed photorealistic character or motion-captured clips have been integrated.
- No verified Godot render screenshot or runtime test in this environment.

## Next milestone
- Source a character GLB with explicit commercial use and redistribution rights, skeleton and clips.
- Import into Godot; inspect Skeleton3D bone names, scale, forward axis and animation tracks.
- Add AnimationTree locomotion blend and separate upper-body aim/recoil; verify with native Godot.

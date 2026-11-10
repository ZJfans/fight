extends Node3D
class_name CharacterAssetSlot
## V2.4 original rigged GLB: skinned mesh + 6 authored joint animation clips.
## This node deliberately owns only visual animation, never physics or gameplay damage.
signal asset_available(bone_count: int, clips: PackedStringArray)

@export var model_path := "res://assets/characters/operative.glb"
var model_root: Node3D
var animation_player: AnimationPlayer
var current_clip: String = ""
var asset_loaded: bool = false
var animation_names: PackedStringArray = []
var bone_count: int = 0
var shooting_hold: float = 0.0
var reload_hold: float = 0.0
var animation_speed: float = 1.0

func _ready() -> void:
    if not ResourceLoader.exists(model_path):
        push_warning("Operative GLB is missing; keeping geometric fallback")
        return
    var resource: Resource = load(model_path)
    if not (resource is PackedScene):
        push_warning("Operative GLB did not import as PackedScene")
        return
    model_root = (resource as PackedScene).instantiate() as Node3D
    if model_root == null:
        push_warning("Operative GLB has invalid root")
        return
    add_child(model_root)
    animation_player = _find_animation_player(model_root)
    var skeleton: Skeleton3D = _find_skeleton(model_root)
    if skeleton == null or animation_player == null or skeleton.get_bone_count() < 10:
        push_warning("GLB is missing a usable rig or AnimationPlayer; geometric fallback remains visible")
        model_root.queue_free()
        model_root = null
        return
    for library_name in animation_player.get_animation_library_list():
        var lib: AnimationLibrary = animation_player.get_animation_library(library_name)
        for clip_name in lib.get_animation_list():
            var full_name: String = (library_name + "/" if library_name != "" else "") + clip_name
            animation_names.append(full_name)
            var animation: Animation = animation_player.get_animation(full_name)
            if animation != null and clip_name in ["Idle", "Walk", "Run", "Crouch"]:
                animation.loop_mode = Animation.LOOP_LINEAR
    bone_count = skeleton.get_bone_count()
    asset_loaded = true
    asset_available.emit(bone_count, animation_names)
    print("BORDERLAND_CHARACTER_READY bones=", bone_count, " clips=", animation_names)
    play_state(false, false, false, false, false, 0.0)

func _find_skeleton(node: Node) -> Skeleton3D:
    if node is Skeleton3D:
        return node as Skeleton3D
    for child in node.get_children():
        var result: Skeleton3D = _find_skeleton(child)
        if result != null:
            return result
    return null

func _find_animation_player(node: Node) -> AnimationPlayer:
    if node is AnimationPlayer:
        return node as AnimationPlayer
    for child in node.get_children():
        var result: AnimationPlayer = _find_animation_player(child)
        if result != null:
            return result
    return null

func _select_clip(name: String) -> String:
    for clip in animation_names:
        if clip.get_file().to_lower() == name.to_lower():
            return clip
    return ""

func play_state(moving: bool, sprinting: bool, crouching: bool, fired: bool, reloading: bool, delta: float) -> void:
    if not asset_loaded or animation_player == null:
        return
    shooting_hold = maxf(0.0, shooting_hold - delta)
    reload_hold = maxf(0.0, reload_hold - delta)
    if fired:
        shooting_hold = 0.20
    if reloading:
        reload_hold = 0.20
    var desired: String = "Aim"
    if reload_hold > 0.0:
        desired = "Reload"
    elif shooting_hold > 0.0:
        desired = "Shoot"
    elif crouching:
        desired = "Crouch"
    elif sprinting and moving:
        desired = "Run"
    elif moving:
        desired = "Walk"
    var clip: String = _select_clip(desired)
    if clip == "":
        clip = _select_clip("Idle")
    if clip == "":
        return
    if current_clip != clip:
        # Preserve smooth locomotion transitions; shot and reload clips intentionally use shorter fades.
        animation_player.play(clip, 0.10 if desired in ["Shoot", "Reload"] else 0.18)
        current_clip = clip

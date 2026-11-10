extends Node3D
class_name TacticalCharacterVisual
## Original modular character. Node-pivot animation, NOT skinned GLB animation.
## Facing convention: forward = local -Z. All geometry and textures authored here.

var torso: Node3D
var left_arm: Node3D
var right_arm: Node3D
var left_leg: Node3D
var right_leg: Node3D
var weapon: Node3D
var head: Node3D
var flash: MeshInstance3D
var locomotion_phase := 0.0
var recoil := 0.0
var hit_reaction := 0.0
var death_amount := 0.0
var crouch_blend := 0.0
var reload_blend := 0.0
var base_color := Color("384b4b")

func _ready() -> void:
    pass

func make_material(color: Color, metallic: float = 0.0, roughness: float = 0.88) -> StandardMaterial3D:
    var mat := StandardMaterial3D.new()
    mat.albedo_color = color
    mat.metallic = metallic
    mat.roughness = roughness
    return mat

func part(parent: Node3D, label: String, dims: Vector3, pos: Vector3, color: Color, metal: float = 0.0) -> MeshInstance3D:
    var mesh := BoxMesh.new()
    mesh.size = dims
    var node := MeshInstance3D.new()
    node.name = label
    node.mesh = mesh
    node.position = pos
    node.material_override = make_material(color, metal)
    node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
    parent.add_child(node)
    return node

func pivot(parent: Node3D, label: String, pos: Vector3) -> Node3D:
    var node := Node3D.new()
    node.name = label
    node.position = pos
    parent.add_child(node)
    return node

func build(is_player: bool) -> void:
    base_color = Color("344b49") if is_player else Color("6a4840")
    var fabric := base_color
    var vest := Color("202e30") if is_player else Color("3b302d")
    var dark := Color("151d22")
    var steel := Color("59646a")
    var skin := Color("ae8970")
    torso = pivot(self, "TorsoPivot", Vector3(0, 1.10, 0))
    part(torso, "Jacket", Vector3(0.49, 0.58, 0.29), Vector3(0, 0, 0), fabric)
    part(torso, "PlateCarrier", Vector3(0.51, 0.42, 0.35), Vector3(0, 0.04, -0.04), vest)
    part(torso, "FrontPlate", Vector3(0.35, 0.27, 0.035), Vector3(0, 0.04, -0.235), steel)
    part(torso, "Belt", Vector3(0.54, 0.10, 0.34), Vector3(0, -0.32, 0), dark)
    for i in range(3):
        part(torso, "AmmoPouch%d" % i, Vector3(0.12, 0.16, 0.10), Vector3(-0.16 + i * 0.16, -0.17, -0.23), vest)
    part(torso, "Backpack", Vector3(0.42, 0.46, 0.20), Vector3(0, 0.02, 0.24), vest)
    head = pivot(torso, "HeadPivot", Vector3(0, 0.43, 0))
    part(head, "Neck", Vector3(0.15, 0.15, 0.14), Vector3(0, -0.03, 0), skin)
    part(head, "Face", Vector3(0.24, 0.29, 0.22), Vector3(0, 0.13, -0.02), skin)
    part(head, "Helmet", Vector3(0.32, 0.18, 0.31), Vector3(0, 0.29, 0), vest)
    part(head, "HelmetBrim", Vector3(0.35, 0.055, 0.38), Vector3(0, 0.23, -0.045), dark)
    part(head, "Visor", Vector3(0.23, 0.075, 0.035), Vector3(0, 0.15, -0.15), Color("1b303b"), 0.4)
    left_arm = pivot(torso, "LeftShoulder", Vector3(-0.32, 0.23, 0))
    right_arm = pivot(torso, "RightShoulder", Vector3(0.32, 0.23, 0))
    for side in [-1, 1]:
        var arm := left_arm if side < 0 else right_arm
        part(arm, "Sleeve", Vector3(0.19, 0.39, 0.20), Vector3(side * 0.02, -0.20, -0.015), fabric)
        part(arm, "Glove", Vector3(0.17, 0.17, 0.17), Vector3(side * 0.02, -0.45, -0.055), dark)
        part(arm, "ShoulderPad", Vector3(0.24, 0.13, 0.25), Vector3(0, -0.05, 0), vest)
    left_leg = pivot(self, "LeftHip", Vector3(-0.14, 0.83, 0))
    right_leg = pivot(self, "RightHip", Vector3(0.14, 0.83, 0))
    for leg in [left_leg, right_leg]:
        part(leg, "Trousers", Vector3(0.22, 0.48, 0.25), Vector3(0, -0.24, 0), fabric)
        part(leg, "KneePad", Vector3(0.22, 0.16, 0.09), Vector3(0, -0.38, -0.14), vest)
        part(leg, "Boot", Vector3(0.23, 0.22, 0.35), Vector3(0, -0.67, -0.065), dark)
    weapon = pivot(torso, "WeaponPivot", Vector3(0.08, 0.12, -0.34))
    part(weapon, "Receiver", Vector3(0.14, 0.16, 0.48), Vector3(0, 0, -0.10), dark, 0.55)
    part(weapon, "Barrel", Vector3(0.055, 0.055, 0.43), Vector3(0, 0.015, -0.52), steel, 0.75)
    part(weapon, "Magazine", Vector3(0.10, 0.23, 0.12), Vector3(0, -0.16, -0.14), dark, 0.5)
    part(weapon, "Stock", Vector3(0.13, 0.11, 0.26), Vector3(0, -0.02, 0.28), dark, 0.4)
    part(weapon, "Sight", Vector3(0.09, 0.11, 0.13), Vector3(0, 0.12, -0.13), dark)
    flash = part(weapon, "MuzzleFlash", Vector3(0.16, 0.16, 0.24), Vector3(0, 0.015, -0.82), Color("ffb73d"))
    var glow := StandardMaterial3D.new()
    glow.albedo_color = Color("ffba48")
    glow.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    flash.material_override = glow
    flash.visible = false

func update_pose(delta: float, horizontal_speed: float, crouching: bool, sprinting: bool, reloading: bool, fired: bool, hurt: bool, dead: bool) -> void:
    if fired:
        recoil = 1.0
    if hurt:
        hit_reaction = 1.0
    recoil = maxf(0.0, recoil - delta * 6.5)
    hit_reaction = maxf(0.0, hit_reaction - delta * 4.0)
    crouch_blend = move_toward(crouch_blend, 1.0 if crouching else 0.0, delta * 6.0)
    reload_blend = move_toward(reload_blend, 1.0 if reloading else 0.0, delta * 5.0)
    death_amount = move_toward(death_amount, 1.0 if dead else 0.0, delta * 2.5)
    var movement := clampf(horizontal_speed / 5.0, 0.0, 1.5)
    locomotion_phase += delta * (12.0 if sprinting else 8.0) * movement
    var stride := sin(locomotion_phase) * minf(movement, 1.0)
    left_leg.rotation.x = stride * 0.55 * (1.0 - crouch_blend * 0.55)
    right_leg.rotation.x = -stride * 0.55 * (1.0 - crouch_blend * 0.55)
    left_arm.rotation.x = -0.85 + stride * 0.14 + reload_blend * 0.65
    right_arm.rotation.x = -0.85 - stride * 0.12 + reload_blend * 0.35
    left_arm.rotation.z = -0.14
    right_arm.rotation.z = 0.14
    torso.position.y = 1.10 - crouch_blend * 0.32 + absf(stride) * 0.025
    torso.rotation.x = crouch_blend * 0.18 - recoil * 0.09 + hit_reaction * 0.12
    torso.rotation.z = hit_reaction * 0.12
    head.rotation.x = -torso.rotation.x * 0.35
    weapon.position.z = -0.34 + recoil * 0.15
    weapon.rotation.x = -recoil * 0.20 + reload_blend * 0.35
    flash.visible = fired
    rotation.z = death_amount * 1.25

extends Node3D
## Dusk Frontier V2.10 — non-gameplay visual asset gallery for Godot 4.
## Open res://scenes/art_gallery_v210.tscn in editor to inspect original GLB meshes.
## Does not change the active gameplay scene.

func _ready() -> void:
    _make_lighting()
    _make_floor()
    _add_model("res://assets/characters/operative.glb", Vector3(-3.3, 0, 0), "FieldOperative_Player", 0.0, "Idle")
    _add_model("res://assets/characters/operative_hostile.glb", Vector3(-1.1, 0, 0), "FieldOperative_Hostile", 0.0, "Aim")
    _add_model("res://assets/weapons/DF_WPN_R07_Rifle.glb", Vector3(-3.1, 1.2, -2.4), "R07", 0.0)
    _add_model("res://assets/weapons/DF_WPN_S12_Shotgun.glb", Vector3(-1.8, 1.2, -2.4), "S12", 0.0)
    _add_model("res://assets/weapons/DF_WPN_M01_Pistol.glb", Vector3(-.7, 1.2, -2.4), "M01", 0.0)
    _add_model("res://assets/modules/DF210_Tank_Vertical.glb", Vector3(3.4, 0, 2.4), "VerticalTank", 0.0)
    _add_model("res://assets/modules/DF210_Container_ServiceBlue.glb", Vector3(8.0, 0, 3.7), "ServiceContainer", 1.57)
    _add_model("res://assets/modules/DF210_Pallet_BundledCargo.glb", Vector3(3.2, 0, -1.7), "Pallet", 0.0)
    _add_model("res://assets/modules/DF210_Fence_IndustrialPanel.glb", Vector3(0.0, 0, 5.2), "SecurityFence", 0.0)
    _add_model("res://assets/modules/DF210_Ground_AsphaltPatch.glb", Vector3(5.4, .005, -5), "GroundMaterialPreview", 0.0)

func _make_lighting() -> void:
    var sun := DirectionalLight3D.new()
    sun.name = "TwilightSoftKey"
    sun.rotation_degrees = Vector3(-52, -33, 0)
    sun.light_energy = .85
    sun.light_color = Color("d3d6ca")
    sun.shadow_enabled = true
    add_child(sun)
    var light := OmniLight3D.new()
    light.name = "LoadingLamp"
    light.position = Vector3(2.5, 4.6, .7)
    light.light_color = Color("e8b46e")
    light.light_energy = .52
    light.omni_range = 8.0
    light.shadow_enabled = false
    add_child(light)
    var environment := WorldEnvironment.new()
    environment.environment = Environment.new()
    environment.environment.background_mode = Environment.BG_COLOR
    environment.environment.background_color = Color("172026")
    environment.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
    environment.environment.ambient_light_color = Color("8a989d")
    environment.environment.ambient_light_energy = .55
    add_child(environment)
    var camera := Camera3D.new()
    camera.name = "Locked54DegreeReferenceCamera"
    camera.fov = 40.0
    camera.position = Vector3(14.0, 17.5, 25.0)
    add_child(camera)
    camera.look_at(Vector3(2.3, 1.0, .5), Vector3.UP)
    camera.current = true

func _make_floor() -> void:
    var base := MeshInstance3D.new()
    base.name = "DuskPavedGround"
    var mesh := BoxMesh.new()
    mesh.size = Vector3(29,.22,28)
    base.mesh = mesh
    base.position = Vector3(2.0,-.14,0)
    var material := StandardMaterial3D.new()
    material.albedo_color = Color("454f50")
    material.roughness = .88
    material.metallic = .02
    var texture_path := "res://assets/materials/DF210_Asphalt_albedo.png"
    if ResourceLoader.exists(texture_path):
        material.albedo_texture = load(texture_path) as Texture2D
    base.material_override = material
    add_child(base)

func _add_model(path: String, at: Vector3, label: String, yaw: float = 0.0, animation: String = "") -> void:
    var holder := Node3D.new()
    holder.name = label
    holder.position = at
    holder.rotation.y = yaw
    add_child(holder)
    if not ResourceLoader.exists(path):
        push_warning("Gallery missing resource: " + path)
        return
    var resource: Resource = load(path)
    if not (resource is PackedScene):
        push_warning("GLB failed to import: " + path)
        return
    var instance: Node3D = (resource as PackedScene).instantiate() as Node3D
    if instance == null:
        return
    holder.add_child(instance)
    if animation != "":
        _play_named_clip(instance, animation)

func _play_named_clip(node: Node, wanted: String) -> bool:
    if node is AnimationPlayer:
        var anim_player := node as AnimationPlayer
        for lib_name in anim_player.get_animation_library_list():
            var library: AnimationLibrary = anim_player.get_animation_library(lib_name)
            for clip_name in library.get_animation_list():
                if clip_name.to_lower() == wanted.to_lower():
                    var id: String = (lib_name + "/" if lib_name != "" else "") + clip_name
                    anim_player.play(id)
                    return true
    for child in node.get_children():
        if _play_named_clip(child, wanted):
            return true
    return false

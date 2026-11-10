extends Node3D
class_name HarborSampleArt
## V2.9 modular harbor art sample — original authored GLB modules.
## Meter-scaled assets from assets/modules/DF_ART_*.glb. No gameplay rules here.
## Godot native sample placement is on the existing 42×34 m test arena;
## web version's primary mission map stays 110×100 m. See PARITY_V29.md.

var roof_root: Node3D
var material_cache: Dictionary = {}
var occluded := false
var sample_center := Vector3(0.0, 0.0, 9.0)

func _ready() -> void:
    _attach_glb("DF_ART_HarborAnnex_Walls.glb", sample_center, "WarehouseAnnex")
    roof_root = _attach_glb("DF_ART_HarborAnnex_Roof.glb", sample_center, "WarehouseRoof")
    _attach_glb("DF_ART_ConcreteCover.glb", Vector3(-6.80, 0.0, 10.8), "CoverNorth")
    _attach_glb("DF_ART_PalletSupply.glb", Vector3(6.40, 0.0, 10.4), "SupplyPallet")
    _attach_glb("DF_ART_DockLight.glb", Vector3(-6.90, 0.0, 13.2), "LoadingLight")
    _attach_glb("DF_ART_DockLight.glb", Vector3(7.30, 0.0, 12.5), "EastLight")
    _walls_with_real_door()
    _visual_road()
    _warm_lamp(Vector3(-4.8, 5.3, 12.8))

func _attach_glb(file: String, pos: Vector3, label: String) -> Node3D:
    var root := Node3D.new()
    root.name = label
    root.position = pos
    add_child(root)
    var path := "res://assets/modules/" + file
    if ResourceLoader.exists(path):
        var resource: Resource = load(path)
        if resource is PackedScene:
            var instance := (resource as PackedScene).instantiate() as Node3D
            if instance != null:
                root.add_child(instance)
                _apply_surface_materials(instance)
        else:
            push_warning("GLB could not be imported: " + path)
    else:
        push_warning("Missing art module: " + path)
    return root

func _apply_surface_materials(tree: Node) -> void:
    if tree is MeshInstance3D:
        var mesh := tree as MeshInstance3D
        var n := mesh.name.to_lower()
        var category := "painted_metal"
        var tint := Color("87999a")
        var roughness := 0.68
        var metallic := 0.24
        if "wall" in n or "panel" in n or "lintel" in n or "foundation" in n or "threshold" in n or "sill" in n:
            category = "concrete";tint = Color("a5adb0");roughness=0.87;metallic=0.03
        elif "roof" in n or "rib" in n or "hood" in n or "canopy" in n:
            category = "roof_metal";tint=Color("71818a");roughness=0.60;metallic=0.38
        elif "window_glazing" in n:
            category = "painted_metal";tint=Color("426770");roughness=0.28;metallic=0.2
        elif "pallet" in n or "cargo_case" in n:
            category = "crate";tint=Color("b2aa96");roughness=0.87;metallic=0.0
        elif "safety" in n or "lamp_fixture" in n or "sodium_lamp" in n:
            category = "painted_metal";tint=Color("e7bb70");roughness=0.35;metallic=0.30
        elif "precast" in n or "coping" in n:
            category = "concrete";tint=Color("a2aaa7");roughness=0.88;metallic=0.02
        mesh.material_override = _surface(category, tint, roughness, metallic)
    for child in tree.get_children():
        _apply_surface_materials(child)

func _surface(category: String, tint: Color, roughness: float, metallic: float) -> StandardMaterial3D:
    var key := "%s_%s_%s_%s" % [category,tint.to_html(),str(roughness),str(metallic)]
    if material_cache.has(key):
        return material_cache[key]
    var mat := StandardMaterial3D.new()
    mat.albedo_color = tint
    mat.roughness = roughness
    mat.metallic = metallic
    var path := "res://assets/materials/DF_MAT_%s_albedo.png" % category
    if ResourceLoader.exists(path):
        mat.albedo_texture = load(path) as Texture2D
    var rough_path := "res://assets/materials/DF_MAT_%s_roughness.png" % category
    if ResourceLoader.exists(rough_path):
        mat.roughness_texture = load(rough_path) as Texture2D
    material_cache[key] = mat
    return mat

func _physical_strip(label: String, pos: Vector3, size: Vector3) -> void:
    var body := StaticBody3D.new()
    body.name = label
    body.collision_layer = 1
    body.position = pos
    add_child(body)
    var collision := CollisionShape3D.new()
    var shape := BoxShape3D.new()
    shape.size = size
    collision.shape = shape
    body.add_child(collision)

func _walls_with_real_door() -> void:
    var x := sample_center.x
    var z := sample_center.z
    var w := 9.6
    var d := 7.8
    var h := 5.0
    _physical_strip("AnnexBackWall", Vector3(x,h/2,z-d/2),Vector3(w,h,.24))
    _physical_strip("AnnexWestWall", Vector3(x-w/2,h/2,z),Vector3(.24,h,d))
    _physical_strip("AnnexEastWall", Vector3(x+w/2,h/2,z),Vector3(.24,h,d))
    # The 2.6 m central doorway is clear: split the camera-facing wall into two strips.
    var front_piece := (w-2.6)/2.0
    for side in [-1.0,1.0]:
        _physical_strip("AnnexFrontStrip",Vector3(x+side*(2.6+front_piece)/2.0,h/2,z+d/2),Vector3(front_piece,h,.24))
    # Rooftop does not collide with character capsule; above-door lintel is high enough to pass.
    _physical_strip("ConcreteCover",Vector3(-6.8,.66,10.8),Vector3(3.88,1.32,1.16))

func _visual_road() -> void:
    # Modest shared low-poly loading lane styling, no decorative collision.
    for side in [-1.0,1.0]:
        var edge := MeshInstance3D.new()
        edge.name = "RoadCurb"
        edge.mesh = BoxMesh.new()
        (edge.mesh as BoxMesh).size = Vector3(.20,.12,14.2)
        edge.position = Vector3(side*8.3,.1,9)
        edge.material_override = _surface("concrete",Color("a4abaa"),.85,.03)
        add_child(edge)
    for i in range(5):
        var dash := MeshInstance3D.new()
        dash.name = "PaintDash"
        dash.mesh = BoxMesh.new()
        (dash.mesh as BoxMesh).size=Vector3(.12,.022,1.34)
        dash.position=Vector3(-7.1+float(i)*3.3,.035,13.6)
        dash.material_override=_surface("painted_metal",Color("d9b46e"),.78,.04)
        add_child(dash)

func _warm_lamp(world_position: Vector3) -> void:
    var light := OmniLight3D.new()
    light.name = "HarborSodiumPool"
    light.position = world_position
    light.light_color = Color("ffc887")
    light.light_energy = 0.42
    light.omni_range = 7.0
    light.shadow_enabled = false
    add_child(light)

func update_viewer(world_position: Vector3) -> void:
    if roof_root == null:
        return
    var in_annex := absf(world_position.x-sample_center.x)<4.5 and absf(world_position.z-sample_center.z)<3.5
    if in_annex != occluded:
        occluded = in_annex
        roof_root.visible = not in_annex

extends Node3D
class_name IndustrialSet

## V2.5 original industrial site dressing. Architectural shells and hard cover have
## real collision; bolts, rails, labels, trim and hazard markings are visual-only.
var cover_points: Array[Vector3] = []
var collision_count := 0
var detail_count := 0
var _materials: Dictionary = {}
var harbor_sample: HarborSampleArt

func _ready() -> void:
    construct()
    harbor_sample = preload("res://scripts/harbor_sample_art.gd").new() as HarborSampleArt
    harbor_sample.name = "V29_ArtSample"
    add_child(harbor_sample)
    cover_points.append(Vector3(-6.8,0.08,12.4))

func update_viewer(pos: Vector3) -> void:
    if harbor_sample != null:
        harbor_sample.update_viewer(pos)

func mat(c: Color, metal: float = 0.0, rough: float = 0.79, emission: bool = false) -> StandardMaterial3D:
    var key = "%s-%.2f-%.2f-%s" % [c.to_html(), metal, rough, str(emission)]
    if _materials.has(key): return _materials[key]
    var m := StandardMaterial3D.new()
    m.albedo_color = c
    m.metallic = metal
    m.roughness = rough
    if emission:
        m.emission_enabled = true
        m.emission = c
        m.emission_energy_multiplier = 2.2
    _materials[key] = m
    return m

func box(label: String, pos: Vector3, size: Vector3, color: Color, solid: bool = false, metal: float = 0.0, rough: float = 0.79, luminous: bool = false) -> Node3D:
    var node: Node3D
    if solid:
        node = StaticBody3D.new()
        node.collision_layer = 1
        collision_count += 1
    else:
        node = Node3D.new()
    node.name = label
    node.position = pos
    add_child(node)
    var part := MeshInstance3D.new()
    var cube := BoxMesh.new()
    cube.size = size
    part.mesh = cube
    part.material_override = mat(color, metal, rough, luminous)
    node.add_child(part)
    if solid:
        var collider := CollisionShape3D.new()
        var shape := BoxShape3D.new()
        shape.size = size
        collider.shape = shape
        node.add_child(collider)
    detail_count += 1
    return node

func cylinder(label: String, pos: Vector3, radius: float, height: float, color: Color, metal: float = 0.0) -> void:
    var node := MeshInstance3D.new()
    node.name = label
    var mesh := CylinderMesh.new()
    mesh.top_radius = radius
    mesh.bottom_radius = radius
    mesh.height = height
    node.mesh = mesh
    node.material_override = mat(color, metal)
    node.position = pos
    add_child(node)
    detail_count += 1

func container(label: String, pos: Vector3, color: Color, length: float = 5.0) -> void:
    box(label, pos, Vector3(length, 2.6, 2.45), color, true, 0.42)
    for side in [-1.0, 1.0]:
        for i in range(12):
            var x := pos.x - length * 0.5 + 0.3 + float(i) * (length - 0.6) / 11.0
            box("Corrugated steel", Vector3(x, pos.y, pos.z + side * 1.239), Vector3(0.07, 2.28, 0.075), color.lightened(0.13), false, 0.62)
        box("Corner corner bar", Vector3(pos.x - length * .49, pos.y, pos.z + side * 1.24), Vector3(0.13, 2.73, .18), Color("233b45"), false, 0.75)
        box("Corner corner bar", Vector3(pos.x + length * .49, pos.y, pos.z + side * 1.24), Vector3(0.13, 2.73, .18), Color("233b45"), false, 0.75)
    box("Container locking track", Vector3(pos.x + length * .5 + .028, pos.y, pos.z), Vector3(.08, 2.4, .13), Color("c1aaa0"), false, .7)
    box("Top lip", Vector3(pos.x, pos.y + 1.3, pos.z), Vector3(length + .12, .10, 2.60), Color("283c42"), false, .5)
    for dz in [-1.0,1.0]:
        cover_points.append(Vector3(pos.x, 0.08, pos.z + dz * 1.95))

func warehouse() -> void:
    var pos := Vector3(-12.1, 0.0, -8.0)
    var wall := Color("40545e")
    box("Hangar shell", pos + Vector3(0,2.95,0), Vector3(13.0,5.9,9.0), wall, true, .46)
    box("Standing seam roof", pos + Vector3(0,6.02,0), Vector3(13.5,.38,9.5), Color("1e303a"), false, .6)
    for i in range(22):
        var x := pos.x - 6.2 + float(i) * .59
        box("Roof folded rib", Vector3(x,6.26,pos.z), Vector3(.045,.09,9.55), Color("62737b"), false, .7)
    for i in range(7):
        var x := pos.x - 5.9 + float(i) * 1.98
        box("Hangar vertical braces", Vector3(x,2.5,pos.z+4.55), Vector3(.12,5.05,.19), Color("253843"), false, .7)
        box("Hangar rivet strip", Vector3(x,1.72,pos.z+4.67), Vector3(.07,.5,.045), Color("a99976"), false, .65)
    box("Cargo entry dark shutter", Vector3(pos.x + 1.8,2.26,pos.z+4.65),Vector3(5.5,4.52,.16),Color("17262d"),false,.6)
    for i in range(12):
        box("Shutter fold", Vector3(pos.x + 1.8,.33 + i*.35,pos.z+4.76),Vector3(5.5,.052,.08),Color("6e777c"),false,.64)
    box("Hangar danger stripe", Vector3(pos.x + 1.8,.10,pos.z+4.9),Vector3(5.8,.035,.22),Color("b9a044"),false,.2)
    # Warehouse is kept solid for the first playable slice: do not fake open entry.

func barrier(pos: Vector3, size: Vector3 = Vector3(3.0,1.20,.90)) -> void:
    box("Reinforced concrete barricade", pos + Vector3(0,size.y*.5,0), size, Color("818986"), true, .07)
    box("Warning stripe", pos + Vector3(0,size.y*.81,size.z*.5+.025), Vector3(size.x,.095,.045), Color("cfaa53"),false)
    box("Beveled coping", pos + Vector3(0,size.y+.045,0), Vector3(size.x + .09,.09,size.z+.09),Color("a3aaa3"),false)
    for side in [-1.0,1.0]:
        cover_points.append(pos + Vector3(0,.06,side * (size.z*.5 + .8)))

func lamp(pos: Vector3, lighting: bool = true) -> void:
    box("Lighting mast", pos + Vector3(0,2.65,0), Vector3(.18,5.3,.18),Color("3f525b"),false,.8)
    box("Light gantry", pos + Vector3(.7,5.23,0), Vector3(1.5,.12,.16),Color("61727b"),false,.7)
    box("Sodium industrial lamp", pos + Vector3(1.35,5.08,0), Vector3(.72,.11,.45),Color("ffbe72"),false,.1,.2,true)
    if lighting:
        var omni := OmniLight3D.new()
        omni.position = pos + Vector3(1.35,4.99,0)
        omni.light_color = Color("ffae6e")
        omni.light_energy = 0.38
        omni.omni_range = 8.0
        omni.shadow_enabled = false
        add_child(omni)

func construct() -> void:
    box("Wet concrete compound", Vector3(0,-.13,0),Vector3(42.0,.25,34.0),Color("343f42"),true,.18,.53)
    for x in range(-19,21,4):
        box("Expansion joint", Vector3(float(x),.012,0),Vector3(.038,.022,32),Color("252f33"),false)
    for z in range(-15,16,4):
        box("Concrete joint",Vector3(0,.013,float(z)),Vector3(40,.023,.03),Color("293337"),false)
    for x in [-20.4,20.4]:
        box("Perimeter blast wall",Vector3(x,1.8,0),Vector3(.65,3.6,34),Color("4d5c64"),true,.2)
    for z in [-16.8,16.8]:
        box("Concrete perimeter wall",Vector3(0,1.8,z),Vector3(41,3.6,.55),Color("4a555f"),true,.2)
    warehouse()
    # Administrative annex and pipework; visual-only trim separate from collision shells.
    box("Fuel depot annex",Vector3(13.0,2.2,-10.7),Vector3(9,4.4,7),Color("435760"),true,.28)
    for i in range(5):
        box("Annex ventilation grill",Vector3(8.9+i*.65,3.3,-7.16),Vector3(.4,.55,.08),Color("253139"),false,.8)
    for i in range(4):
        cylinder("Vertical holding tank",Vector3(10.6+i*1.75,1.35,-14.6),.55,2.7,Color("7e6152"),.7)
        cylinder("Tank cover",Vector3(10.6+i*1.75,2.75,-14.6),.59,.12,Color("2b424c"),.6)
    for i in range(5):
        var x := -8.4 + float(i) * 4.0
        barrier(Vector3(x,.0,4.5 if i%2 == 0 else -.9))
    var palette := [Color("3e565a"), Color("66534b"),Color("4d594e"),Color("394b4e")]
    for i in range(4):
        var x := 8.0 + float(i % 2) * 4.5
        var z := .7 + float(int(i / 2)) * 5.7
        container("ISO freight unit %d" % i,Vector3(x,1.3,z),palette[i])
    for i in range(12):
        var x := -18.0 + float(i) * 3.2
        box("Stenciled traffic stripe", Vector3(x,.021,12.8),Vector3(1.1,.024,.095),Color("af9560"),false)
    for i in range(9):
        var x := -18.0 + float(i)*4.0
        cylinder("Waste drum",Vector3(x,.56,11.0 if i%2 == 0 else -14),.36,1.12,Color("774c36") if i%2==0 else Color("3b6172"),.6)
    for i in range(4):
        lamp(Vector3(-15.0 + float(i)*9.0,0,14.8),i%2==0)
    # Horizontal pipe racks and architectural legibility from an orthographic camera.
    for i in range(9):
        box("Pipe riser",Vector3(-17.3 + float(i)*1.8,3.9,-15.1),Vector3(.13,.18,2.3),Color("7c7867"),false,.85)
    for i in range(5):
        box("Access hatch",Vector3(-18.0+float(i)*8.4,.022,-12.5),Vector3(1.3,.025,.92),Color("56616a"),false,.8)
    # V2.6 loading-yard art kit: decorative surfaces and collision-aware pallets.
    for i in range(9):
        var xi := -12.0 + float(i) * 2.15
        box("Cargo traffic paint", Vector3(xi, 0.035, 11.8), Vector3(1.3, 0.018, 0.14), Color("c4ad69"), false)
    for i in range(4):
        var px := -9.8 + float(i % 2) * 1.4
        var pz := 10.0 + float(int(i / 2)) * 1.1
        box("Palletized equipment", Vector3(px, 0.56, pz), Vector3(1.17, 1.12, 0.95), Color("a8a397"), true, 0.08)
    for i in range(6):
        var sx := 9.0 + float(i) * 1.6
        box("Loading yard hatch", Vector3(sx, 0.04, 10.5), Vector3(0.85, 0.027, 0.25), Color("2b586b"), false)
    print("BORDERLAND_INDUSTRIAL_SET details=",detail_count," collision=",collision_count," cover=",cover_points.size())

extends Node3D

const ACTOR_SCRIPT = preload("res://scripts/actor.gd")
var player: TacticalActor
var enemies: Array[TacticalActor] = []
var hud: Label
var message: Label
var kills := 0
var total_enemies := 6
var ended := false
var rng := RandomNumberGenerator.new()
var cover_points: Array[Vector3] = []
var follow_camera: Camera3D
var industrial_set: IndustrialSet
var mobile_mode := false
var deployed_traps: Array[Area3D] = []

func _ready() -> void:
    configure_input()
    rng.seed = 2046
    build_environment()
    build_map()
    spawn_actors()
    build_hud()
    build_mobile_controls()

func configure_input() -> void:
    # V2.4 uses real InputEvent resources, not JSON-like project.godot dictionaries.
    var bindings := {
        "move_left": KEY_A, "move_right": KEY_D,
        "move_forward": KEY_W, "move_back": KEY_S,
        "crouch": KEY_C, "reload": KEY_R, "sprint": KEY_SHIFT,
        "weapon_primary": KEY_1, "weapon_secondary": KEY_2, "weapon_pistol": KEY_3, "place_trap": KEY_G
    }
    for action in bindings:
        if InputMap.has_action(action):
            InputMap.erase_action(action)
        InputMap.add_action(action)
        var event := InputEventKey.new()
        event.physical_keycode = bindings[action]
        InputMap.action_add_event(action, event)
    if InputMap.has_action("shoot"):
        InputMap.erase_action("shoot")
    InputMap.add_action("shoot")
    var shoot_event := InputEventMouseButton.new()
    shoot_event.button_index = MOUSE_BUTTON_LEFT
    InputMap.action_add_event("shoot", shoot_event)

func _process(delta: float) -> void:
    if industrial_set != null and is_instance_valid(player):
        industrial_set.update_viewer(player.global_position)
    if follow_camera != null and is_instance_valid(player):
        var follow := player.global_position + Vector3(0.0, 24.0, 18.0)
        follow_camera.position = follow_camera.position.lerp(follow, minf(1.0, delta * 3.5))

func build_environment() -> void:
    var env := WorldEnvironment.new()
    var environment := Environment.new()
    environment.background_mode = Environment.BG_COLOR
    environment.background_color = Color("14212a")
    environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
    environment.ambient_light_color = Color("b7c7c9")
    environment.ambient_light_energy = 0.88
    env.environment = environment
    add_child(env)
    var sun := DirectionalLight3D.new()
    sun.rotation_degrees = Vector3(-55, -35, 0)
    sun.light_energy = 1.12
    sun.light_color = Color("e4e0d4")
    sun.shadow_enabled = true
    add_child(sun)
    var camera := Camera3D.new()
    camera.projection = Camera3D.PROJECTION_PERSPECTIVE
    camera.fov = 40.0
    camera.position = Vector3(0, 24, 18)
    camera.rotation_degrees = Vector3(-53.13, 0, 0)
    camera.current = true
    add_child(camera)
    follow_camera = camera

func material(color: Color, metallic := 0.0, roughness := 0.85) -> StandardMaterial3D:
    var m := StandardMaterial3D.new()
    m.albedo_color = color
    m.metallic = metallic
    m.roughness = roughness
    return m

func block(label: String, pos: Vector3, size: Vector3, color: Color, solid := true, metallic := 0.0) -> void:
    var root := StaticBody3D.new() if solid else Node3D.new()
    root.name = label
    root.position = pos
    add_child(root)
    var mesh := MeshInstance3D.new()
    var cube := BoxMesh.new()
    cube.size = size
    mesh.mesh = cube
    mesh.material_override = material(color, metallic)
    root.add_child(mesh)
    if solid:
        var shape := CollisionShape3D.new()
        var box := BoxShape3D.new()
        box.size = size
        shape.shape = box
        root.add_child(shape)

func build_map() -> void:
    industrial_set = preload("res://scripts/industrial_set.gd").new() as IndustrialSet
    industrial_set.name = "IndustrialZone"
    add_child(industrial_set)
    cover_points = industrial_set.cover_points.duplicate()

func get_cover_positions() -> Array[Vector3]:
    return cover_points

func spawn_actors() -> void:
    player = TacticalActor.new()
    player.name = "Player"
    add_child(player)
    player.position = Vector3(-13, 0.05, 9)
    player.setup(true, self)
    var points := [Vector3(4, 0.05, -6), Vector3(13, 0.05, -2), Vector3(-3, 0.05, -11), Vector3(15, 0.05, 10), Vector3(2, 0.05, 12), Vector3(-8, 0.05, -1)]
    for i in range(total_enemies):
        var enemy := TacticalActor.new()
        enemy.name = "Hostile_%02d" % i
        add_child(enemy)
        enemy.position = points[i]
        enemy.setup(false, self)
        enemy.target = player
        enemy.move_speed = 2.6
        enemy.hp = 75.0
        enemies.append(enemy)

func build_hud() -> void:
    var layer := CanvasLayer.new()
    add_child(layer)
    var panel := PanelContainer.new()
    panel.position = Vector2(18, 18)
    panel.custom_minimum_size = Vector2(345, 90)
    layer.add_child(panel)
    hud = Label.new()
    hud.add_theme_font_size_override("font_size", 17)
    panel.add_child(hud)
    message = Label.new()
    message.position = Vector2(22, 120)
    message.add_theme_font_size_override("font_size", 15)
    message.text = "WASD 移动 · 左键射击 · Shift 冲刺 · C 蹲伏 · R 换弹 · 1/2/3 切枪"
    layer.add_child(message)
    update_hud()

func update_hud() -> void:
    if hud == null or player == null or ended:
        return
    var weapon_names := ["R07 苍鹭", "S12 岸防", "M01 防卫"]
    var index := clampi(player.current_weapon,0,2)
    hud.text = "暮色边境 · 港区样板\n生命 %d    %s  %d/%d    击败 %d/%d%s" % [int(player.hp),weapon_names[index],player.ammo,player.magazine,kills,total_enemies,"   换弹中" if player.reload_time>0 else ""]

func enemy_killed(actor: TacticalActor) -> void:
    enemies.erase(actor)
    kills += 1
    if kills >= total_enemies:
        ended = true
        message.text = "任务完成 · 已清除全部敌人。重新运行场景可再玩一局。"

func game_over() -> void:
    ended = true
    message.text = "行动失败 · 重新运行场景重试"

func draw_tracer(a: Vector3, b: Vector3) -> void:
    var beam := MeshInstance3D.new()
    var cylinder := CylinderMesh.new()
    cylinder.top_radius = 0.025
    cylinder.bottom_radius = 0.025
    cylinder.height = a.distance_to(b)
    beam.mesh = cylinder
    beam.material_override = material(Color("ffd58a"))
    beam.position = (a + b) * 0.5
    beam.quaternion = Quaternion(Vector3.UP, (b - a).normalized())
    add_child(beam)
    var tween := create_tween()
    tween.tween_interval(0.085)
    tween.tween_callback(beam.queue_free)

func place_trap(actor: TacticalActor) -> void:
    if actor.trap_stock <= 0 or ended: return
    var forward := -actor.visual.global_transform.basis.z
    var pos := actor.global_position + forward * 1.25
    pos.y = 0.24
    # Avoid placing traps directly inside hard obstacles.
    var space := get_world_3d().direct_space_state
    var query := PhysicsShapeQueryParameters3D.new()
    var cylinder := CylinderShape3D.new()
    cylinder.radius = 0.39
    cylinder.height = 0.3
    query.shape = cylinder
    query.transform = Transform3D(Basis.IDENTITY, pos)
    query.collision_mask = 1
    if not space.intersect_shape(query, 1).is_empty(): return
    var area := Area3D.new()
    area.name = "PressureTrap"
    area.position = pos
    area.collision_layer = 0
    area.collision_mask = 4
    area.monitoring = true
    add_child(area)
    var sensor := CollisionShape3D.new()
    var trigger := SphereShape3D.new()
    trigger.radius = 0.57
    sensor.shape = trigger
    area.add_child(sensor)
    var mesh := MeshInstance3D.new()
    var disc := CylinderMesh.new()
    disc.top_radius = .32
    disc.bottom_radius = .34
    disc.height = .12
    mesh.mesh = disc
    mesh.material_override = material(Color("d5a04d"), .48, .37)
    area.add_child(mesh)
    area.body_entered.connect(func(body: Node3D) -> void:
        if not is_instance_valid(area): return
        if body is TacticalActor:
            var hostile := body as TacticalActor
            if not hostile.is_player:
                hostile.take_damage(42.0)
                deployed_traps.erase(area)
                area.queue_free()
    )
    deployed_traps.append(area)
    actor.trap_stock -= 1

func build_mobile_controls() -> void:
    # Godot native touchscreen buttons supplement keyboard controls, not substitute input events.
    var layer := CanvasLayer.new()
    layer.name = "TouchControls"
    add_child(layer)
    var screen := get_viewport().get_visible_rect().size
    mobile_mode = OS.has_feature("mobile") or DisplayServer.is_touchscreen_available()
    var actions := [
        ["▲","move_forward",Vector2(95,screen.y-175)],
        ["▼","move_back",Vector2(95,screen.y-80)],
        ["◀","move_left",Vector2(40,screen.y-127)],
        ["▶","move_right",Vector2(150,screen.y-127)],
        ["FIRE","shoot",Vector2(screen.x-115,screen.y-132)],
        ["C","crouch",Vector2(screen.x-180,screen.y-78)],
        ["R","reload",Vector2(screen.x-60,screen.y-207)],
        ["G","place_trap",Vector2(screen.x-110,screen.y-245)]
    ]
    for a in actions:
        var button := Button.new()
        button.name = "Touch_" + str(a[1])
        button.text = str(a[0])
        button.position = a[2]
        button.custom_minimum_size = Vector2(60,55)
        button.modulate.a = 0.74
        button.visible = mobile_mode
        layer.add_child(button)
        var action: String = str(a[1])
        button.button_down.connect(func() -> void: Input.action_press(action))
        button.button_up.connect(func() -> void: Input.action_release(action))

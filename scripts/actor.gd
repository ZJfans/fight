extends CharacterBody3D
class_name TacticalActor

var is_player := false
var hp := 100.0
var trap_stock := 3
var current_weapon := 0
var weapon_ammo := [24, 8, 15]
var weapon_mags := [24, 8, 15]
var ammo := 12
var magazine := 12
var reload_time := 0.0
var shot_cooldown := 0.0
var crouched := false
var move_speed := 5.0
var target: TacticalActor
var world: Node3D
var visual: Node3D
var phase := 0.0
var decision_clock := 0.0
var patrol_target := Vector3.ZERO
var muzzle: MeshInstance3D
var muzzle_timer := 0.0
var character_height := 1.80
var character_visual: TacticalCharacterVisual
var character_asset: CharacterAssetSlot
var weapon_models: Array[Node3D] = []
var weapon_mount: Node3D
var fired_this_frame := false
var hurt_this_frame := false
# Tactical cover: enemies only. The chosen point must occlude the target's line of sight.
var cover_goal := Vector3.ZERO
var cover_active := false
var cover_recheck := 0.0
var cover_hold := 0.0
var last_seen_position := Vector3.ZERO
var alert_time := 0.0


func setup(player: bool, parent_world: Node3D) -> void:
    is_player = player
    world = parent_world
    if player:
        ammo = 24
        magazine = 24
    collision_layer = 2 if player else 4
    collision_mask = 1 | (4 if player else 2)
    var capsule := CapsuleShape3D.new()
    capsule.radius = 0.32
    capsule.height = character_height
    var collider := CollisionShape3D.new()
    collider.shape = capsule
    collider.position.y = character_height / 2.0
    add_child(collider)
    visual = Node3D.new()
    add_child(visual)
    character_visual = preload("res://scripts/character_visual.gd").new() as TacticalCharacterVisual
    visual.add_child(character_visual)
    character_visual.build(is_player)
    character_asset = preload("res://scripts/character_asset_slot.gd").new() as CharacterAssetSlot
    if not is_player:
        character_asset.model_path = "res://assets/characters/operative_hostile.glb"
    # GLB import is synchronous after add_child enters the active scene tree.
    # Consume its result explicitly rather than relying on a late ready connection.
    muzzle = character_visual.flash
    visual.add_child(character_asset)
    _mount_weapons()
    if character_asset.asset_loaded:
        _on_character_asset_available(character_asset.bone_count, character_asset.animation_names)

func _mount_weapons() -> void:
    # V2.7 three separately authored glTF weapons; each model uses meters, barrel toward -Z.
    weapon_mount = Node3D.new()
    weapon_mount.name = "WeaponMount"
    weapon_mount.position = Vector3(0.0, 1.34, -0.25)
    visual.add_child(weapon_mount)
    var paths := [
        "res://assets/weapons/DF_WPN_R07_Rifle.glb",
        "res://assets/weapons/DF_WPN_S12_Shotgun.glb",
        "res://assets/weapons/DF_WPN_M01_Pistol.glb"
    ]
    for path in paths:
        var root_node := Node3D.new()
        root_node.name = path.get_file().get_basename()
        weapon_mount.add_child(root_node)
        if ResourceLoader.exists(path):
            var res := load(path)
            if res is PackedScene:
                root_node.add_child((res as PackedScene).instantiate())
        weapon_models.append(root_node)
    _display_weapon()

func _display_weapon() -> void:
    for i in range(weapon_models.size()):
        weapon_models[i].visible = i == current_weapon
    if muzzle != null and weapon_mount != null:
        # A world-space flash independent from the GLB socket; corrected upon weapon switch.
        muzzle.position = Vector3(0.0, 1.34, -(1.08 if current_weapon == 1 else (0.52 if current_weapon == 2 else 1.07)))

func _on_character_asset_available(bone_count: int, clips: PackedStringArray) -> void:
    if bone_count >= 10 and not clips.is_empty():
        character_visual.visible = false
        # The original fallback muzzle is embedded in the now-hidden mesh.
        # A separately parented flash keeps feedback visible with imported GLB.
        var flash_mesh := SphereMesh.new()
        flash_mesh.radius = 0.075
        flash_mesh.height = 0.15
        var flash := MeshInstance3D.new()
        flash.name = "ImportedMuzzleFlash"
        flash.mesh = flash_mesh
        flash.position = Vector3(0.0, 1.22, -1.24)
        var glow := StandardMaterial3D.new()
        glow.albedo_color = Color("ffbc54")
        glow.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
        flash.material_override = glow
        visual.add_child(flash)
        muzzle = flash
        _display_weapon()

func _physics_process(delta: float) -> void:
    if hp <= 0.0:
        return
    fired_this_frame = false
    # A hit may arrive in another actor physics update; consume the reaction only after animation.
    shot_cooldown = maxf(0.0, shot_cooldown - delta)
    cover_recheck = maxf(0.0, cover_recheck - delta)
    cover_hold = maxf(0.0, cover_hold - delta)
    alert_time = maxf(0.0, alert_time - delta)
    muzzle_timer = maxf(0.0, muzzle_timer - delta)
    # Flash remains independent from the imported skinned rig.
    if reload_time > 0.0:
        reload_time -= delta
        if reload_time <= 0.0:
            ammo = magazine
    var desired := Vector3.ZERO
    if is_player:
        desired = Vector3(Input.get_axis("move_left", "move_right"), 0, Input.get_axis("move_forward", "move_back"))
        desired = desired.limit_length(1.0)
        crouched = Input.is_action_pressed("crouch")
        if world.mobile_mode and Input.is_action_pressed("shoot"):
            var nearest: TacticalActor
            var nearest_distance := 22.0
            for hostile in world.enemies:
                if is_instance_valid(hostile) and hostile.hp > 0.0 and can_see(hostile):
                    var dist := global_position.distance_to(hostile.global_position)
                    if dist < nearest_distance:
                        nearest = hostile
                        nearest_distance = dist
            if nearest != null:
                face_point(nearest.global_position)
        else:
            var mouse := get_viewport().get_mouse_position()
            var camera := get_viewport().get_camera_3d()
            if camera != null:
                var origin := camera.project_ray_origin(mouse)
                var direction := camera.project_ray_normal(mouse)
                if absf(direction.y) > 0.001:
                    var hit := origin + direction * ((global_position.y + 0.8 - origin.y) / direction.y)
                    face_point(hit)
        if Input.is_action_just_pressed("weapon_primary"):
            switch_weapon(0)
        if Input.is_action_just_pressed("weapon_secondary"):
            switch_weapon(1)
        if Input.is_action_just_pressed("weapon_pistol"):
            switch_weapon(2)
        if Input.is_action_just_pressed("place_trap"):
            world.place_trap(self)
        if Input.is_action_pressed("reload"):
            reload()
        if Input.is_action_pressed("shoot"):
            fire()
    else:
        decision_clock -= delta
        if decision_clock <= 0.0:
            decision_clock = 0.35
            decide()
        var to_goal := patrol_target - global_position
        to_goal.y = 0.0
        if to_goal.length() > 0.7:
            desired = to_goal.normalized()
        if target != null and is_instance_valid(target) and target.hp > 0:
            face_point(target.global_position)
            if can_see(target):
                last_seen_position = target.global_position
                alert_time = 3.0
                if global_position.distance_to(target.global_position) < 17.0:
                    fire()
    var speed := move_speed * (0.48 if crouched else 1.0)
    if is_player and Input.is_action_pressed("sprint") and not crouched:
        speed *= 1.45
    velocity = desired * speed
    velocity.y = -0.1
    move_and_slide()
    phase += delta * desired.length() * (11.0 if not crouched else 6.0)
    visual.position.y = 0.0
    character_visual.update_pose(delta, Vector2(velocity.x, velocity.z).length(), crouched, is_player and Input.is_action_pressed("sprint"), reload_time > 0.0, fired_this_frame, hurt_this_frame, false)
    if muzzle != null:
        muzzle.visible = muzzle_timer > 0.0
    if character_asset != null and character_asset.asset_loaded:
        character_asset.play_state(Vector2(velocity.x, velocity.z).length() > 0.2, is_player and Input.is_action_pressed("sprint"), crouched, fired_this_frame, reload_time > 0.0, delta)
    hurt_this_frame = false
    if is_player:
        world.update_hud()

func face_point(point: Vector3) -> void:
    var d := point - global_position
    d.y = 0.0
    if d.length_squared() > 0.001:
        visual.rotation.y = atan2(-d.x, -d.z)

func decide() -> void:
    if target == null or not is_instance_valid(target) or target.hp <= 0.0:
        return
    var delta_to_player := target.global_position - global_position
    var distance := delta_to_player.length()
    var visible := can_see(target)
    if visible:
        last_seen_position = target.global_position
        alert_time = 3.0
    if ammo <= 0 and reload_time <= 0.0:
        reload()
    # Reloading enemies seek occluding hard cover instead of standing in the open.
    if reload_time > 0.0:
        if not cover_active and cover_recheck <= 0.0:
            cover_recheck = 0.7
            cover_active = find_cover()
        if cover_active:
            patrol_target = cover_goal
            if global_position.distance_to(cover_goal) < 0.9:
                cover_hold = 0.5
            return
    else:
        cover_active = false
    if cover_hold > 0.0:
        patrol_target = global_position
    elif not visible and alert_time > 0.0:
        patrol_target = last_seen_position
    elif not visible:
        patrol_target = global_position
    elif distance > 12.0:
        patrol_target = target.global_position
    elif distance < 5.0:
        patrol_target = global_position - delta_to_player.normalized() * 2.0
    else:
        patrol_target = global_position

func find_cover() -> bool:
    if target == null or not is_instance_valid(target):
        return false
    var best_score := INF
    var found := false
    # Main scene owns the authored solid cover locations, not decorative geometry.
    for point in world.get_cover_positions():
        var candidate: Vector3 = point
        var travel := global_position.distance_to(candidate)
        if travel > 9.0 or travel < 0.5:
            continue
        if not is_position_free(candidate):
            continue
        if not cover_blocks_target(candidate):
            continue
        var score := travel + candidate.distance_to(target.global_position) * 0.06
        if score < best_score:
            best_score = score
            cover_goal = candidate
            found = true
    return found

func is_position_free(point: Vector3) -> bool:
    var space := get_world_3d().direct_space_state
    var query := PhysicsShapeQueryParameters3D.new()
    var capsule := CapsuleShape3D.new()
    capsule.radius = 0.34
    capsule.height = character_height
    query.shape = capsule
    query.transform = Transform3D(Basis.IDENTITY, point + Vector3.UP * character_height * 0.5)
    query.collision_mask = 1
    return space.intersect_shape(query, 1).is_empty()

func cover_blocks_target(point: Vector3) -> bool:
    var origin := target.global_position + Vector3.UP * 1.25
    var destination := point + Vector3.UP * 1.15
    var ray := PhysicsRayQueryParameters3D.create(origin, destination)
    ray.collision_mask = 1
    var hit := get_world_3d().direct_space_state.intersect_ray(ray)
    return not hit.is_empty()

func can_see(other: TacticalActor) -> bool:
    var a := global_position + Vector3.UP * (0.95 if crouched else 1.35)
    var b := other.global_position + Vector3.UP * (0.85 if other.crouched else 1.25)
    var ray := PhysicsRayQueryParameters3D.create(a, b)
    ray.exclude = [get_rid()]
    ray.collision_mask = 1 | 2 | 4
    var hit := get_world_3d().direct_space_state.intersect_ray(ray)
    return not hit.is_empty() and hit["collider"] == other

func switch_weapon(index: int) -> void:
    if index == current_weapon: return
    weapon_ammo[current_weapon] = ammo
    weapon_mags[current_weapon] = magazine
    current_weapon = index
    _display_weapon()
    magazine = weapon_mags[index]
    ammo = weapon_ammo[index]
    reload_time = 0.0
    shot_cooldown = maxf(shot_cooldown, 0.22)

func reload() -> void:
    if reload_time <= 0.0 and ammo < magazine:
        reload_time = 1.7

func fire() -> void:
    if shot_cooldown > 0.0 or reload_time > 0.0 or hp <= 0:
        return
    if ammo <= 0:
        reload()
        return
    ammo -= 1
    shot_cooldown = (0.42 if current_weapon == 1 else (0.22 if current_weapon == 2 else 0.15)) if is_player else 0.65
    muzzle_timer = 0.075
    fired_this_frame = true
    var origin := global_position + Vector3.UP * (0.95 if crouched else 1.25)
    var forward := -visual.global_transform.basis.z
    var endpoint := origin + forward * 26.0
    var ray := PhysicsRayQueryParameters3D.create(origin, endpoint)
    ray.exclude = [get_rid()]
    ray.collision_mask = 1 | 2 | 4
    var hit := get_world_3d().direct_space_state.intersect_ray(ray)
    if not hit.is_empty():
        var actor := hit["collider"] as TacticalActor
        if actor != null and actor != self:
            actor.take_damage((46.0 if current_weapon == 1 else (18.0 if current_weapon == 2 else 22.0)) if is_player else 9.0)
    world.draw_tracer(origin, hit.get("position", endpoint))

func take_damage(amount: float) -> void:
    hp = maxf(0.0, hp - amount)
    hurt_this_frame = true
    if hp <= 0.0:
        if not is_player:
            world.enemy_killed(self)
        else:
            world.game_over()
        queue_free()

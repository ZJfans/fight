# V2.4 变更记录

1. 实际新增原创带蒙皮骨骼的 GLB 模型：18 bones、6 skeletal animations、3,072 triangles。
2. 修复 V2.3 角色 ready 信号连接晚于子节点 ready 的潜在时序问题；模型节点激活后即检查导入结果。
3. 动画状态切换：Idle/Walk/Run/Crouch/Shoot/Reload，移动动作循环，射击和换弹短暂保持，支持过渡时长。
4. 人物替换后使用独立于回退模型的枪口闪光网格。
5. GDScript 在 `_ready()` 注册真正的 `InputEventKey`、`InputEventMouseButton`，不依赖旧工程的 JSON 风格 project.godot 键位值。
6. 镜头跟随和 HUD 角色信息，便于引擎内检查导入状态。
7. 提供独立自包含 HTML 角色交互预览；真实 Chromium 桌面/手机视口测试与截图，明确未执行 Godot 渲染器。

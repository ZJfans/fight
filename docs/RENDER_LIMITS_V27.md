# V2.7 验收边界

- WebGL2: 原生 perspective FOV 40°，俯角 54°，跟随玩家，按屏幕方向移动。
- Chromium 测试环境缺 WebGL2，Canvas 使用 3D 几何正交缓存 + 行扫描弱透视变换；不是准确的透视投影，也没有 GPU 阴影/PBR。
- 角色 `operative.glb` 身高约 1.83 m，18 骨骼、8 段动画（含 Tpose），导出为 glTF 2.0/GLB。
- 武器为独立 GLB，模型空间 -Z 为前方；Muzzle 为命名空节点。
- Godot 4 导入未做运行验证（缺少 Godot 可执行程序），请导入后检查动画绑定和朝向。
- 地图沿用 V2.6 约 100m 地图、碰撞、任务和撤离系统；不是重新建空图。

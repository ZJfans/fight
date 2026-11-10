# V2.6 / 2026-11-10

继承上一份已交付 V2.4 ZIP，合并当前会话中已编写并测试的 V2.5 工作目录，然后重建美术主调。

1. Web 渲染：重配 C 常量、GPU 光照亮度、软件栅格照明，支持较明亮的蓝青色港区。
2. Web 地图：新增 groundStencil、cargoDrone、palletStack、industrialStencilLane、specialDockScene 模块；使用世界空间实体面片而非背景图片。
3. 相机与 HUD：近顶视正交相机、镜头缩放；H 极简 HUD；Tab 任务面板；桌面/手机响应式布局。
4. 角色：复用 V2.4 18 关节 GLB，渲染亮度调整和地面接触标记调整，仍为低多边形角色。
5. Godot 项目：重新调整相机、环境光和场景色彩；新增对应货盘、交通线及地面工艺细节。
6. 测试：Chromium 桌面/手机实际截图、武器与陷阱、三份情报、撤离结算、触控摇杆操作均有 JSON 记录。

未解决：Godot 引擎运行和 Godot 原生 Web 导出未验证；本轮 Chromium 测试 WebGL2 未创建，实际采用 Canvas 软件渲染；场景细节与商业品质有显著差距。

# 暮色边境 V2.7 · 斜俯视与角色/武器资产修正版

此版本从原 V2.6 潮汐港区完整项目继续编辑，保留已有任务、AI、掩体、物资和撤离机制。未重建游戏或复制参考游戏内容。

## 试玩
- 直接双击 `web_playable/暮色边境_立即试玩.html` 或压缩包外部提供的同名单文件。
- WASD 按屏幕方向移动，鼠标瞄准、左键射击、右键寻路。
- 1/2/3：原创突击步枪、霰弹枪、手枪；R 换弹；X 蹲伏；Shift 奔跑；E 交互。
- 滚轮缩放严格限制在目标视野高度 24–33 米；无旋转摄像机按钮或 Z/V 按键。
- 三份情报回收后在西侧撤离点按 E 结算。

## 摄像机
- 完整 3D WebGL2 模式：透视相机，垂直 FOV 40°，相机从 +Z 方向跟随，俯角 54.0°，前向偏移 2.3 米。
- **当前自动化 Chromium 无 WebGL2，实测的是 Canvas 软件渲染的弱透视近似。真实 GPU 阴影、PBR 纹理和游戏参考图的画面效果未得到验证。**
- Godot 原生工程采用 Camera3D PROJECTION_PERSPECTIVE、FOV=40°，从 +Z 后上方固定跟随。Godot 引擎仍未在当前机器安装，无法宣称原生运行通过。

## 资源（原创，单位米）
- `assets/characters/operative.glb`：T-pose 约 1.83m，18 骨骼，Tpose/Idle/Walk/Run/Crouch/Aim/Shoot/Reload 八段；上肢骨骼动作轨道可做独立动画混合。
- `assets/weapons/DF_WPN_R07_Rifle.glb`：突击步枪，枪口命名节点 `Muzzle`。
- `assets/weapons/DF_WPN_S12_Shotgun.glb`：霰弹枪，枪口 `Muzzle`。
- `assets/weapons/DF_WPN_M01_Pistol.glb`：手枪，枪口 `Muzzle`。
- `assets/modules/`：集装箱、仓库、掩体、补给箱、撤离信标五个独立 GLB。浏览器地图仍以 V2.6 程序化 3D 几何为主，这些是同系列可复用 Godot 模块，并非全部替换了网页中的场景实现。
- 完整名称、尺寸、骨骼与动画、hash 请看 `docs/ASSET_MANIFEST_V27.json`。

## 核验
- `tests/V27_desktop.png`、`tests/V27_mobile.png`：Chromium 软件回退渲染实测，不是概念图。
- `tests/CHROMIUM_V27.json`、`tests/CHROMIUM_V27_FLOW.json`、`tests/CHROMIUM_V27_TOUCH.json`：实际状态与输入测试。
- `tests/VALIDATION_V27.md`：未解决问题与复核说明。

## 未达到目标
- 目前美术**远未达到用户参考图**的材质、人物、光影水平；尤其 Canvas 软件回退没有正确的透视深度、动态阴影、PBR。
- Godot 工程模型导入/动画重定向和武器握持仍需在安装了 Godot 4 的环境下逐项检查校准。
- WebGL2 真实 GPU 画面缺少可复核截图；当前只核验单文件 HTML 在软件渲染模式下可玩。

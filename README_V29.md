# 暮色边境 V2.9 · 港区统一美术样板

本项目从 V2.8 原工程连续升级，**不是另起的新游戏**。玩法仍为原有单人港区战斗与三情报撤离。

## 立即试玩

直接使用 Chrome/Edge 打开 `web_playable/暮色边境_立即试玩.html`（完整单文件）。点击进入战区。

操作：WASD 移动、鼠标瞄准与左键射击、1/2/3 切枪、R 换弹、X 蹲伏、Shift 冲刺、E 拾取情报/撤离。其余原功能保留。

## Godot 4

导入 `project.godot`，F5 运行原生场景；也可单独打开 `scenes/harbor_art_sample.tscn` 预览新资产。原生仍为局部艺术样板集成，整体地图与 Web 单局功能不同，见 `docs/V29_ART_AND_PARITY.md`。当前执行环境未验证 Godot 实际运行。

## 重点资源

`assets/modules/DF_ART_*.glb` 为新增原创场景模块；`assets/materials/DF_MAT_*` 为新增纹理；保留原有 18 骨骼角色与三把命名枪口 GLB。新增资源的源代码见 `tools/build_v29_assets.py`。

## 诚实的测试范围

实际运行截图是 Chromium 下的 Canvas 软件渲染；不能冒充 Godot/WebGL GPU 材质及阴影测试。测试证据见 `tests/VALIDATION_V29.md`。

原生脚本修正：`scripts/main.gd` HUD 换行已正确转义。详见 `tests/VALIDATION_V29.md`，Godot 运行尚待本机验证。

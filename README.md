# 暮色边境 V2.10 — Godot 4 核心工程

此包从 **V2.10 完整工程** 整理，只保留 Godot 4 原生项目。已排除全部 `web_playable/`、HTML、JS、CSS、网页渲染器、浏览器截图与网页打包脚本。没有重做或更改玩法源代码。

## 打开方法

1. 将 ZIP 解压到任意目录。
2. 使用 **Godot 4.2 或更新的 Godot 4.x** 的 Import 功能选择 `project.godot`。
3. 等待导入 glTF/GLB 模型与 PNG 贴图。
4. 按 F5 运行 `scenes/main.tscn`（原生战斗项目）；单独查看美术可打开 `scenes/art_gallery_v210.tscn`。

## 内容

- `project.godot`：项目配置、主场景引用、渲染配置。
- `scenes/`：战斗主场景、港区美术样板、V2.10 美术预览。
- `scripts/`：玩家与敌人、武器及交互、工业地图、模型加载与动画相关 GDScript。
- `assets/characters/`：玩家与敌方骨骼 GLB。
- `assets/weapons/`：三把武器 GLB。
- `assets/modules/`：港区、仓库、集装箱、掩体、储罐、托盘、围栏等可导入 GLB。
- `assets/materials/`：原创建材与装备 PNG 贴图。
- `tools/`：可用于重新生成 V2.10 人物模型的 Python 源码（**不参与 Godot 启动**）。
- `docs/ASSET_MANIFEST.json`：资源清单及 GLB 结构检查数据。

## 重要的验收边界

本次是 **Godot 核心包的裁剪和引用完整性检查**，不是新增游戏功能或新的引擎内实测。已通过：ZIP 解压与校验、`res://` 本地文件引用存在性检查、GLB 2.0 文件头/JSON 解析、材质贴图文件清点。当前执行环境 **没有 Godot 可执行程序**，因此没有验证 Godot 4 的脚本解析、资源导入、画面以及原生玩法是否可运行。

原 V2.10 网页试玩是单独的实现分支；此包**没有网页版**，原生 Godot 功能/画质与之前的网页实测并不能视为完全等价。

打包范围：61 个 Godot 相关源文件（不含本 README 与新增清单），其中 GLB 20 个，PNG 贴图 24 个。

# 资产来源 / Provenance · V2.4

`assets/characters/operative.glb` 是本轮**本地程序化原创生成**，不依赖外部美术资产文件，无第三方角色或动作素材被重新打包。

- 源文件生成器：`tools/generate_operative.py`，依赖 numpy / trimesh；全部基础几何体、材质和关键帧由此生成。
- 角色设定：无商标战术头盔、面罩、背心、护甲、双腿、背包和虚构轻型卡宾枪。
- Godot 4.x 工程继承自上一版 V2.3（其中 `assets/operative_original.glb` 为早期原创无骨骼测试模型）。
- 此前检索的 Quaternius、Kenney、Khronos 资源**未下载，也没有暗示已集成**，因为当前容器无法解析外部素材域名。
- 当前模型主要用于骨骼导入和动画状态机制验证，尚不适合作为高写实最终人物。

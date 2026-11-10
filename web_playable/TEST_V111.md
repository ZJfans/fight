# V1.11 验证记录

- 输入：V1.10 完整项目 ZIP，解压并修改原工程。
- 新增：原创 `operative_original.glb`，通过 trimesh 导出，包含 10 个独立部件；新增 `src/gltf_actor.js`，解析 GLB 2.0 的 JSON/BIN、bufferView、accessor、mesh primitive、节点层级，并将三角面写入现有 WebGL2/软件渲染共用的 Mesh。
- 动作：对左右腿、左右臂进行节点级程序化摆动；不是蒙皮骨骼动画，也不是动作捕捉。没有声称写实角色完成。
- 已验证：GLB 文件头魔数和版本；Node.js `--check` 验证新增及改动 JS；HTML 构建完成且模型数据内嵌。
- 未验证：浏览器实际渲染、移动操作、GLB 模型的实际画面。Playwright/Chromium 尝试访问 file:// 与本地 http://127.0.0.1 均返回 `net::ERR_BLOCKED_BY_ADMINISTRATOR`。因此**本轮没有真实浏览器截图**，也不能声称画面通过测试。
- 外部资源：尝试下载 Khronos CesiumMan CC-BY 4.0 模型，但容器 DNS 无法解析 raw.githubusercontent.com，故没有使用或打包该资源。原创临时模型由脚本生成，不依赖第三方模型授权。
- 已知缺陷：GLB 加载器仅支持常见非压缩 POSITION/索引等数据；不支持 Draco、meshopt、纹理采样、glTF 动画轨道、蒙皮权重、完整节点四元数变换。角色为原创低多边形验证资产，不是写实成品。动画节点在 CPU 端重建三角形，角色多时可能影响性能。
- 下一步：在可访问 localhost 的浏览器测试环境中实测，修复模型尺度、朝向和动作；随后使用许可明确的写实带骨骼角色替换测试资产，并增加 glTF skinning 与 AnimationSampler。

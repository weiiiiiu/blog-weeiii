# 小程序引导气泡与 Glisse 学习笔记

用户要求继续按技术学习笔记的深度整理两篇新文章，配流程或时序图、示例和排查说明，上传博客；四篇文章都在开头标注各自原文链接。

## 来源与范围

- 小程序引导气泡：<https://mp.weixin.qq.com/s/rfq56_pfg9RhQuSRhLXeWg>。
- Glisse：<https://mp.weixin.qq.com/s/jS2XSrMKchUL8QjuXsyWJA>。
- 小程序依据官方菜单位置、窗口信息、Page 生命周期、WXSS、缓存、添加状态接口文档。
- Glisse 原文描述 0.5.0；官方 npm 当前为 0.6.0，本次源码提交 `4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9`。
- Glisse 0.6.0 在标记背景上有 SVG 与 WebGL 分支，不照抄“所有现代浏览器相同”的概括。
- 不操作原有三篇 vibe-coding 文章改动与 `1.js`，发布仅包含本次指定文件。

## 进度

- [x] 获取两篇原文并核对主要官方接口和源码。
- [x] 前两篇正文开头添加明确的原文链接。
- [x] 编写两篇新笔记、图解与可验证示例。
- [x] 隔离构建与桌面、手机、深色模式验收。
- [x] 推送发布并验证四篇原文链接与新增内容。

## 示例验证

- 小程序正文提取出的 JS 通过语法检查；参考坐标、原点转换、窄窗口限制、无效输入检查通过。
- 使用微信接口替身验证已添加、关闭、隐藏、resize、查询失败、存储失败与过期回调；非微信真机测试。
- Glisse 正文 TSX/CSS 原样提取，在临时目录安装 0.6.0 与 React 19.2.3；TypeScript 检查和 Vite 生产构建通过。
- Glisse Chromium 桌面和手机视口验证通过：标记背景出现 SVG 滤镜，点击与键盘切换受控状态，滑块更新参数，减少动态效果模式可操作，无页面错误。
- 不据 Chromium 验证宣称 Safari 或其他引擎实测通过；相关分支解释来自固定版本源码。
- 四张新图均为静态 SVG，三张流程／时序图附 Mermaid 源码，一张坐标示意图使用原生 SVG 绘制。
- 图表与示例截图已经检查。

## 发布前检查

- 隔离生产构建成功，总文章数 216；两篇新增文章均进入首页、RSS、搜索和 sitemap。
- 新笔记分别含 7 / 8 个章节、6 / 5 个代码块、3 / 4 个表格，各 2 张图。
- 新两篇完成桌面、手机、手机深色模式六组页面检查，无图片加载错误、横向溢出或页面异常。
- 原两篇及新两篇的首个引用块均显示“原文链接”，地址分别与四篇微信来源对应。
- 文章中的示例保持为代码文本，未向博客注入 Glisse 样式或新增运行时依赖。
- 证据：`/tmp/blog-paper-capsule-glisse-local-browser.json`、`/tmp/blog-paper-capsule-glisse-build.log`、`/tmp/blog-paper-glisse-example-browser.json`。

## 上线验收

- 发布提交：`83ddb16a61229dc923f5c500ccd55e006a528499`。
- Cloudflare Pages 部署 `f30c43d3-7c72-452f-a9b4-336cb105ae3e` 已成功。
- 新文章：<https://blog.006573.xyz/posts/miniprogram-capsule-guide-notes>、<https://blog.006573.xyz/posts/glisse-liquid-glass-notes>。
- 正式站点八组浏览器检查通过：新增两篇各桌面、手机与手机深色模式，原两篇各桌面；四篇原文链接正确，图解加载正常，无横向溢出或页面异常。
- 七个新增公开资源（四张 SVG、三份 Mermaid 源码）与本地发布文件逐字节一致。
- 三篇原有 vibe-coding 文件的内容哈希保持不变，未包含在本次提交中。
- 证据：`/tmp/blog-paper-capsule-glisse-deploy.json`、`/tmp/blog-paper-capsule-glisse-live-browser.json`、`/tmp/blog-paper-capsule-glisse-live-assets.json`。

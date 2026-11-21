# Skyline 公告轮播与 AI UI 学习笔记

继续整理用户提供的两篇微信文章，按已有博客规范发布详细学习笔记，正文开头附原文链接，并提供图解、示例与验证方法。

## 来源和范围

- 公告轮播：<https://mp.weixin.qq.com/s/PRnwM7X6yIgA3T5MM1dMyA>。
- AI UI：<https://mp.weixin.qq.com/s/7-5Zv9w3x_AorQPdC8Qp0g>。
- 以微信官方 Skyline、swiper、动画和页面生命周期文档核对实现条件。
- 以 Figma 官方 Auto Layout、组件、Plugin API 以及 W3C 对比度要求补足设计到实现的流程。
- 不操作三篇已有 vibe-coding 文件改动；发布只包含本次文章、图表与进度记录。
- 前一请求的头像已从 PDF 原始 JPEG 流提取至桌面，234 × 308；不加入博客仓库。

## 进度

- [x] 读取两篇原文并核对官方资料。
- [x] 编写详细学习笔记与图表。
- [x] 验证代码示例、排版及隔离生产构建。
- [x] 发布并核对线上页面和资源。

## 验证边界

- 小程序状态、事件和跳转处理可通过接口替身验证；真实 Skyline 动画仍须在微信设备上确认。
- Figma 示例是插件代码，类型检查不替代真实 Figma 文件中的视觉验收。
- 浏览器示例、静态图表和博客页面通过 Chromium 检查，不据此宣称其他引擎实测通过。

## 示例验证

- Skyline 笔记八节、七个代码块；AI UI 笔记八节、五个代码块；每篇配两张图与 Mermaid 源码。
- 小程序 JS 语法检查通过；验证空与单条列表、唯一 key、十轮下标计算、隐藏后暂停意愿、导航防重与失败恢复、tabBar 路由、过期等待回调。
- HTML/CSS 示例在 320、375、430、720 宽度下检查通过；长文案及逐个文字元素放大为两倍后无横向溢出，键盘焦点可见。
- 计算示例普通文字与白底、渐变两端颜色的对比度，均高于 4.5:1；不把端点检查当作任意渐变的完整验证。
- Figma 示例使用官方 `@figma/plugin-typings` 1.143.0，通过 TypeScript 严格类型检查；未对用户 Figma 文件执行写入。
- 四张图使用静态 SVG 和原生文本，无运行时绘图库；示例截图和图解均已检查。
- 示例证据：`/tmp/blog-paper-ai-ui-check/verify-skyline.cjs`、`/tmp/blog-paper-ai-ui-example-browser.json`。

## 发布前验收

- 隔离生产构建成功，文章总数 218；新增两篇进入首页、RSS、搜索与 sitemap。
- 两篇分别通过桌面、手机、手机深色模式共六组页面检查；来源链接正确、四张图正常加载、源码链接可访问，无横向溢出或页面异常。
- 已检查手机文章开头、桌面图层结构图、手机深色流程图；移动端可打开原始矢量图放大查看。
- 四份 SVG 均可独立解析，含无障碍标题，无 script 或 foreignObject。
- 验收浏览器拦截 Google 统计脚本，不向 GA 发送测试事件。
- 证据：`/tmp/blog-paper-skyline-ai-build.log`、`/tmp/blog-paper-skyline-ai-local-browser.json`。

## 上线验收

- 生产提交：`48070d6c30ebf09c2532542cf3472a6d7d41aa59`。
- Cloudflare Pages 部署 `1605f0a5-99a4-4708-b9f4-ce0ca6e9683c` 成功。
- Skyline 笔记：<https://blog.006573.xyz/posts/skyline-notice-carousel-notes>。
- AI UI 笔记：<https://blog.006573.xyz/posts/ai-ui-design-workflow-notes>。
- 正式页面六组浏览器检查全部通过；来源链接、图片和源码入口正确，无页面错误和横向溢出。
- 四张 SVG 与四份 Mermaid 源码均与本地发布文件逐字节一致。
- 正式首页、RSS、搜索索引和 sitemap 均已包含两篇新文章。
- 三篇原有 vibe-coding 文件内容哈希保持不变；本次本地预览服务已停止。
- 证据：`/tmp/blog-paper-skyline-ai-deploy.json`、`/tmp/blog-paper-skyline-ai-live-browser.json`、`/tmp/blog-paper-skyline-ai-live-assets.json`。

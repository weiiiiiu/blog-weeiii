# 文章图片加载优化

- [x] 回溯 Markdown → MDX → MDImg → 浏览器请求，确认线上 HTML 不含正文图片。
- [x] 检查 16F 的 21 张图片，本轮请求均为 200，单张约 61–260 KB。
- [x] 在静态 HTML 中直接渲染图片，移除零高度和加载后的模糊动画。
- [x] 构建时优先加载第一张正文图片，其余图片使用浏览器懒加载。
- [x] 修正加载完成判断，支持失败后手动重试及切换图片时重置状态。
- [x] 生产构建通过，检查 16F 静态 HTML 含 21 张图，首张 eager/high，其余 lazy。
- [x] Chrome 验证关闭 JavaScript 仍能显示图片、图片请求早于脚本完成、加载失败后重试、放大与关闭；未出现运行时或 hydration 错误。使用本地图片响应及故障注入验证组件行为，不作为真实 CDN 提速测量。
- [x] 现有 Jest 测试 13 项通过；已执行类型检查，仍有两处原有错误：`app/routes/home.tsx:46` 分类数组元组类型、`lib/data/server/searchindex.ts:3` 的 `velite.config` 模块路径。

保留 GitHub 图床与 Markdown 图片网址；不增加图床服务或依赖。

## 发布

- [x] 快进同步至远端 `0704e4d`，保留网页后台新增、更新的文章。
- 部署入口：推送 GitHub `weiiiiiu/blog-weeiii` 的 `master` 分支，由 Cloudflare Pages 项目 `blog-weeiii` 自动构建。
- 发布验收：Cloudflare 构建成功，线上 `/posts/16F` 的 HTML 包含 21 张正文图片，首张为 `eager` / `high`，其余为 `lazy`。

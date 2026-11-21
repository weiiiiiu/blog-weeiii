# Google Analytics 4 接入

本博客接入 GA4 标准版，[Google 官方说明可免费使用](https://marketingplatform.google.com/about/analytics/)。衡量 ID 留空时不加载 Google 脚本。

## 创建网站数据流

1. 打开 <https://analytics.google.com/>，使用 Google 账号创建账号和 GA4 媒体资源。
2. 在「管理 → 数据收集和修改 → 数据流」新增「网站」数据流。
3. 网站填写 `https://blog.006573.xyz`，名称可填写「个人博客」。
4. 复制 `G-XXXXXXXXXX` 格式的「衡量 ID」。不要使用数据流数字 ID，也不需要 API secret。`GTM-XXXXXXXX` 是 Google Tag Manager 容器 ID，本项目通过 gtag.js 直接接入 GA4，需要填写 `G-` 开头的衡量 ID。
5. 在该数据流「增强型衡量 → 设置 → 网页浏览 → 显示高级设置」中关闭「基于浏览器历史记录事件的网页更改」，避免和代码手动发送的 page_view 重复。

官方参考：[查找衡量 ID](https://support.google.com/analytics/answer/12270356?hl=zh-Hans)、[手动统计网页浏览及关闭历史记录自动统计](https://developers.google.com/analytics/devguides/collection/ga4/views)。

## 配置和发布

编辑 `site.config.ts`：

```ts
GAId: "G-你的衡量ID",
```

重新运行 `pnpm build` 并部署。SSG 的脚本和配置在构建时写入产物，改完配置需要重新发布。

也可以将 `GAId` 留空，在构建环境（如 Cloudflare Pages）设置 `VITE_GA_ID=G-XXXXXXXXXX`。该 ID 是公开的网站标识，不是密钥；本地测试可在 `.env.local` 中设置。修改环境变量后同样需要重新构建。

## 统计行为

- 只有合法的 `G-` 衡量 ID 才会加载外部脚本。
- 在 `gtag('js', ...)` 之前通过 `gtag('set', 'send_page_view', false)` 全局关闭自动首访，并保留 `config` 中的相同设置以兼容旧标签；由路由 hook 发送一次首访事件。
- 页面路径或查询条件变化时发送一次 page_view，包含页面标题、完整页面 URL 和上一页 URL。
- 目录锚点等纯 hash 变化不增加浏览量。
- 网站不提供评论或文章阅读计数，访问统计统一在 Google Analytics 后台查看。

## 验证

发布后访问首页，再点开一篇文章。在 GA「实时」报告确认访问；浏览器网络中应出现携带正确衡量 ID 的 Google tag 和统计请求。每次页面跳转应只记录一次 page_view。浏览器拦截统计脚本时，该访问可能不会被记录。

Google 新版标签可在脚本加载时直接初始化，不再等待页面中的 `config` 参数；仅在 `config` 中设置 `send_page_view: false` 可能仍产生自动首访。参考：[初始化兼容行为](https://support.google.com/analytics/answer/18411054?hl=en)、[全局 send_page_view 配置](https://developers.google.com/analytics/devguides/collection/ga4/reference/config#send_page_view)。

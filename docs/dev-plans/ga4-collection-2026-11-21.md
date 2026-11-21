# GA4 无实时数据排查

## 原因

线上已部署衡量 ID `G-F06D4HF1ZQ`。此前浏览器验证仅检查事件队列，未验证真实上报。

本机请求 `www.googletagmanager.com`、`www.google-analytics.com` 和 `region1.google-analytics.com` 时，TLS 连接失败，Sparkle 的 `Ads → REJECT` 规则命中数随请求增加。已放行的 `analytics.google.com` 后台可以访问，因此能打开后台不代表统计请求已发送。

## 修改与验证

- [x] 在项目根目录的 `1.js` 中，为上述三个域名添加精确 `DOMAIN` 规则，使用现有 `选择` 策略组，位于 `Ads` 拦截规则之前。
- [x] JavaScript 语法与生成配置验证通过；相比原脚本仅增加这三条规则，其余生成配置一致。
- [x] 对应候选运行配置通过 Mihomo 配置校验。
- [x] 用户自行更新并启用 Sparkle 实际覆写配置；只读检查确认三个精确域名规则均已生效，并优先于 Ads。
- [x] 启用后真实访问线上博客：统计脚本 HTTP 200，`G-F06D4HF1ZQ` 的 `page_view` 上报 HTTP 204，无请求失败。
- [ ] 在用户 GA 实时报告中确认展示。

按用户要求，代理修复仅修改项目 `1.js`，实际覆写由用户更新；未由代理修改 Sparkle 实际配置或重载。`1.js` 含私有代理配置，保持未跟踪，不提交到公开仓库。该代理修改无需部署博客。

## 真实上报发现的首次重复

两次真实浏览器验证均发现首页只有一次手动事件，但发出了两次 `page_view`（均 HTTP 204）；文章跳转只新增一次。Google 脚本当前在 `gtm.init` 时初始化目标，与新版初始化行为一致，页面 `config` 中的 `send_page_view: false` 未阻止自动首访。

在临时浏览器中对比相同线上 HTML、同一真实 Google 标签，收集请求被拦截以避免新增测试数据：原初始化产生两次 `page_view`；在 `gtag('js', ...)` 之前增加全局 `gtag('set', 'send_page_view', false)` 后仅一次。两种情况下网站手动事件队列均为一次，无浏览器错误。

- [x] `app/root.tsx` 提前全局关闭自动首访，保留现有配置兼容旧版标签。
- [x] 同步接入文档，说明全局设置和新版初始化行为。
- [x] 独立发布目录生产构建、类型检查通过，254 个 HTML 均在初始化之前包含全局关闭设置。
- [x] 生产包加载真实 Google 标签、拦截上报验证：首页累计一次、文章累计两次、锚点仍为两次；无请求失败或浏览器错误。结果：`/tmp/blog-paper-ga4-fixed-production.json`。
- [x] 发布修复并验证真实线上首访、文章跳转及锚点变化。

证据：`/tmp/blog-paper-ga4-network-initial.json`、`/tmp/blog-paper-ga4-network-diagnostic.json`、`/tmp/blog-paper-ga4-init-comparison.json`。

## 修复发布结果

- 生产提交：`00d2a86bd201d87c18498d1aae63dcc2f23f4a48`。
- Cloudflare Pages 部署：`62954195-33b0-481e-b1b5-d4265f052ced`，检查结果 `success`。
- 正式域名首页、文章和动态 HTML 均已包含提前设置的全局 `send_page_view=false`。
- 真实浏览器未拦截 Google 请求：脚本 HTTP 200；首页一次 `page_view`、进入文章新增一次，两个请求均携带 `G-F06D4HF1ZQ` 并得到 HTTP 204；锚点变化不增加 `page_view`；无请求失败或浏览器错误。
- 最终证据：`/tmp/blog-paper-ga4-fixed-live.json`。HTTP 204 验证接收接口成功响应，GA 后台报表是否已展示仍需用户确认。

本轮真实诊断访问可能出现在实时报告中，包括修复前用于发现问题的重复事件。此次修复防止后续首访重复，不回写历史统计。

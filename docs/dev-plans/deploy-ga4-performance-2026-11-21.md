# GA4、评论移除与性能优化发布

用户已授权部署上线，并要求核对本地是否缺少线上文章。

## 发布前核对

- [x] 部署入口为 GitHub `weiiiiiu/blog-weeiii` 的 `master`，由 Cloudflare Pages `blog-weeiii` 自动构建。
- [x] 发布前远端与本地 HEAD 均为 `75c47dfce314e6cf6ca00d1ad6116ae1db6ee247`，推送权限验证通过。
- [x] 本地文章源文件、Git HEAD、线上首页及 sitemap 均为 212 篇，路径一致，无缺失。
- [x] 未发现重复 slug、同名标题或仅忽略空白后完全相同的文章正文；此检查不判定部分段落重复或语义近似文章。
- [x] 本次发布网站代码、Logo、依赖、测试及相关文档；本机代理脚本 `1.js` 和三篇文章原有的未提交修改留在本地。
- [x] 在独立目录使用准确发布内容执行生产构建、类型检查和测试；19 项测试通过，文章仍为 212 篇。
- [x] 提交并推送生产分支，Cloudflare Pages 构建及部署成功。
- [x] 验证线上 GA ID、评论移除、动态首屏、Logo 及文章清单。

GA4 衡量 ID：`G-F06D4HF1ZQ`。后台历史记录自动计数应关闭，以配合代码主动发送 page_view。

## 发布结果

- 生产版本：[`e25647908937b09328561af278ebf393f3888c93`](https://github.com/weiiiiiu/blog-weeiii/commit/e25647908937b09328561af278ebf393f3888c93)。
- Cloudflare Pages 部署：`8c6d362d-fa2b-4ede-85f8-7a79256a96f2`，检查结果为 `success`。
- 正式网站：<https://blog.006573.xyz/>。
- 首页、文章、动态 HTML 均只加载一个正确的 GA 脚本，未包含评论计数或评论服务引用。
- 正式网站浏览器验证：三类页面各初始化一次 page_view，无水合或运行时错误，无评论请求。Google 请求在测试浏览器内被拦截，未向正式数据流发送测试访问；真实入库仍需在 GA 后台确认。
- 动态正文包含在首屏 HTML 中；线上 Logo 为 2,842 bytes，与发布文件一致。
- 线上 sitemap 与本地完整匹配，212 篇文章逐一请求，全部 HTTP 200，未发现缺失。
- 未发现重复 slug、同名标题或完全相同的正文。原有三篇文章的未提交编辑与 `1.js` 仍留在本地。

验收明细保存在 `/tmp/blog-paper-deployment-verification.json`、`/tmp/blog-paper-live-browser-results.json`。此次验收记录作为文档更新提交，使用 `[CF-Pages-Skip]` 前缀避免再次构建，生产代码仍为上述版本。

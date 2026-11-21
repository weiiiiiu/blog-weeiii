# 微信链接分享卡片笔记发布

用户要求继续沿用上一篇流程，根据新的微信公众号文章整理笔记并上传博客。

## 内容范围

- 原文：<https://mp.weixin.qq.com/s/nIE69ZOoQov_DEiS3-qb3Q?scene=1>，通过网页内容读取工具获取正文。
- 官方参考：Open Graph 协议 <https://ogp.me/>；微信 JS-SDK 文档 <https://developers.weixin.qq.com/doc/subscription/guide/h5/jssdk.html>。
- 保留分享入口差异和元数据检查的核心思路，将扫码、收藏、缓存等行为表述为可复测经验，不承诺所有版本都有效。
- 不将原文对平台政策动机的推断作为事实；不声称仅添加 Open Graph 就能强制生成微信卡片。
- 示例采用占位域名和原创文案，不复制原文品牌图、截图或长段正文。
- 本次只新增文章，不调整博客分享功能或安装微信 SDK。

## 进度

- [x] 核对原文、Open Graph 属性和微信分享接口前提。
- [x] 新增 `content/posts/wechat-link-share-card-notes.md`，分类为开发。
- [x] 独立目录构建通过，文章总数 214；新文章已进入首页、开发分类、搜索、RSS 和 sitemap；HTML 示例保留在正文代码块中，未污染页面真实元数据。
- [ ] 提交新增文章和发布记录，推送 Cloudflare Pages 部署。
- [ ] 验收正式文章的桌面与手机显示，确认上线入口。

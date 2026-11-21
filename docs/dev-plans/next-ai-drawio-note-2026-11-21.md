# Next AI Draw.io 笔记发布

用户要求根据微信公众号文章整理笔记并上传，沿用当前博客的 Markdown 和 Cloudflare Pages 发布流程。

## 内容来源与范围

- 微信原文：<https://mp.weixin.qq.com/s/a5Bm1VeQ40pxkxTX-fHjZw>，作者自称挖挖。直接请求遇到微信验证页，通过网页内容读取工具取得正文。
- 项目：<https://github.com/DayuanJiang/next-ai-draw-io>。
- MCP 接入和功能：<https://next-ai-drawio.jiang.jp/en/mcp>、仓库 `packages/mcp-server/README.md`。
- Codex 命令对照本机 `codex mcp add --help`、`codex mcp list --help` 和官方 MCP 文档。
- 采用独立整理与原创博客发布提示词，不复制原文截图或长段正文；不将文中安装示例作为本机安装指令执行。

## 进度

- [x] 核对正文、项目文档和现有文章格式，未发现同主题笔记。
- [x] 新增 `content/posts/next-ai-drawio-notes.md`，分类 AI，保留来源链接。
- [x] 独立发布目录构建通过，文章总数 213；新笔记已进入文章页面、首页、搜索、RSS 和 sitemap。
- [ ] 提交并推送新增文章及发布记录，保留既有文章编辑和私有代理脚本。
- [ ] 确认 Cloudflare 部署完成并验收正式文章页面。

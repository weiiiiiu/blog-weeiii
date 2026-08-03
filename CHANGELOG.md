# CHANGELOG

本项目的变更记录，按日期倒序排列。

## 2026-08-03

### 更新内容

- 「关于」页改为 markdown 驱动，可在后台编辑。原先内容硬编码在 `app/routes/about/about.tsx` 的 JSX 里，CMS 无法读取，且残留大量模板原作者的个人信息。现拆为 `content/pages/about.md`，velite 新增 `about` 单文件集合（`single: true`），路由改用 loader 读取并渲染 `content_html`，页面大标题与副标题也一并提为 frontmatter 字段。
- `.velite/index.js`、`index.d.ts` 取消 git 跟踪。这两个是 velite 生成物，早于 `.gitignore` 规则被提交，导致每次构建都弄脏工作区。文件保留在本地，不影响构建。

- 新增 `.nvmrc`（Node 22）：Cloudflare Pages 默认 Node 版本偏旧，而 Vite 8 要求 Node ≥ 20.19，不锁版本首次构建会失败。
- 新增 `.pages.yml`：接入 Pages CMS 网页后台，可在 https://app.pagescms.org 直接编辑文章与碎碎念，无需本地命令行。碎碎念正文使用纯 markdown 编辑器，避免所见即所得编辑器破坏 `#标签` 与 `##` 分条格式。
- 新增 `scripts/bootstrap-velite.mjs`：修复全新检出无法构建的问题。根因是 `velite.config.ts` → `lib/data/server/rss.ts` → `lib/data/server/posts.ts:4` 在模块顶层 import 了 `.velite/posts.json`，而该文件正是 velite 自身要生成的产物，导致全新环境（含 CI）必然构建失败。脚本在 velite 运行前补空占位数据引导，随后被真实内容覆盖。
- `package.json`：`pre` 脚本改为先执行引导脚本再跑 velite；`build` 脚本改为先执行 `pnpm pre`，使 CI 与托管平台只需一条 `pnpm build` 即可完成从内容处理到静态导出的全流程。
- `.gitignore`：移除对 `content/` 的忽略，使文章能进入版本库（网页后台发文的前提）；移除对 `site.config.ts` 的忽略，使 CI 能读到站点配置；将整目录忽略的 `/public/` 收窄为仅忽略 velite 生成物（`/public/data/`、`atom.xml`、`rss`、`feed.json`、`sitemap.xml`），保留头像、字体、favicon 等需入库的静态资源。
- 新增 `site.config.ts`（由 `site.config.template.ts` 生成）：填入作者与时区信息；移除未使用的 `walineApi`、`GAId` 占位值，避免指向不存在的评论后端。GitHub 主页与站点域名暂为占位符，待部署后填写。
- 绑定自定义域名 `blog.006573.xyz`，`site.config.ts` 的 `domain` 由 `blog-weeiii.pages.dev` 改为该域名，修正 RSS 与 sitemap 中的绝对链接。
- 导入《价格行为学》读书笔记 193 篇至 `content/posts/`。源文件 frontmatter 使用中文键且缺少 velite 必需的 `title` 与 `date`，直接放入会构建失败；新增 `scripts/import-notes.mjs` 完成转换：`标题` → `title`（前缀讲次号）、按讲次生成 `date` 使首页排序等于课程阅读顺序、补 `categories: 价格行为学`、去除正文中与模板 `<h1>` 重复的一级标题。图片沿用原有 jsDelivr 图床绝对链接，未做迁移。

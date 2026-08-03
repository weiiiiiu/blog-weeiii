# CHANGELOG

本项目的变更记录，按日期倒序排列。

## 2026-08-03

### 更新内容

- 新增 `.pages.yml`：接入 Pages CMS 网页后台，可在 https://app.pagescms.org 直接编辑文章与碎碎念，无需本地命令行。碎碎念正文使用纯 markdown 编辑器，避免所见即所得编辑器破坏 `#标签` 与 `##` 分条格式。
- 新增 `scripts/bootstrap-velite.mjs`：修复全新检出无法构建的问题。根因是 `velite.config.ts` → `lib/data/server/rss.ts` → `lib/data/server/posts.ts:4` 在模块顶层 import 了 `.velite/posts.json`，而该文件正是 velite 自身要生成的产物，导致全新环境（含 CI）必然构建失败。脚本在 velite 运行前补空占位数据引导，随后被真实内容覆盖。
- `package.json`：`pre` 脚本改为先执行引导脚本再跑 velite；`build` 脚本改为先执行 `pnpm pre`，使 CI 与托管平台只需一条 `pnpm build` 即可完成从内容处理到静态导出的全流程。
- `.gitignore`：移除对 `content/` 的忽略，使文章能进入版本库（网页后台发文的前提）；移除对 `site.config.ts` 的忽略，使 CI 能读到站点配置；将整目录忽略的 `/public/` 收窄为仅忽略 velite 生成物（`/public/data/`、`atom.xml`、`rss`、`feed.json`、`sitemap.xml`），保留头像、字体、favicon 等需入库的静态资源。
- 新增 `site.config.ts`（由 `site.config.template.ts` 生成）：填入作者与时区信息；移除未使用的 `walineApi`、`GAId` 占位值，避免指向不存在的评论后端。GitHub 主页与站点域名暂为占位符，待部署后填写。

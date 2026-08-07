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
- 左上角站点 logo 由 `app/assets/icons/neko.svg`（单色矢量猫）换成个人照片 `public/logo.png`（144×144，圆形裁切，源图裁自 `image.jpg` 头部区域）。`topbar/index.tsx` 改用 `<img>` 渲染并移除已失效的 `NekoIcon` 导入。注意：原 svg 使用 `fill="currentColor"` 可随明暗主题自动变色，改用照片后不再具备该特性。
- 重裁 `public/logo.png`：上一版按方形取景，但顶栏用 `rounded-full` 圆形遮罩，四角被削后脸正好落在裁掉的区域，视觉上只剩帽子。改为按圆形可见区域定位，裁剪框 `(160,100)-(720,660)`，脸位于圆心。
- `public/favicon.ico` 由黑猫换成同一照片（脸部特写裁剪），并从单一 32×32 扩为 16/32/48/64 多尺寸。浏览器标签栏此前仍显示旧图标即因该文件未同步更换。
- 站点 logo 与 favicon 改用 AI 生成的 Labubu 头像图（透明背景、头部撑满画面）。此前用个人照片，在 36px 顶栏与 16px 标签栏下细节尽失。背景以边缘泛洪填充抠除（阈值 28——按颜色距离阈值抠会误伤米色绒毛，因其与粉色背景的 RGB 距离仅约 46）。顶栏移除圆形遮罩 `rounded-full`，否则会削掉兔耳。`favicon.ico` 输出 16/32/48/64 多尺寸。
- 碎碎念卡片头像（`MemoCard.tsx`）由模板自带的猫图换成同一张 Labubu 图，直接复用 `/logo.png`。原实现按明暗主题在 `avatar-white.png` / `avatar-black.png` 间切换，是因为旧图为单色线稿；全彩透明图无需区分主题，故移除该条件分支，连带移除因此失效的 `theme` 变量与 `useAppState` 导入。同时去掉 `rounded-full border`——圆形遮罩会削掉兔耳，且透明图加边框会画出方框。删除随之孤立的 `public/avatar-white.png`、`public/avatar-black.png`。
- 碎碎念卡片头像由 40px（`h-10 w-10`）缩小至 32px（`h-8 w-8`）。原猫图自带留白，而新图头部撑满画幅，同尺寸下视觉重量明显更大。
- 头像尺寸再次下调：顶栏 logo 36px → 28px，碎碎念卡片头像 32px → 28px（`h-8` → `h-7`），两处统一。
- 作者名改为全大写 `ZHONG WEI`（`site.config.ts` 的 `author`），顶栏、页脚、碎碎念、各页 title 与 RSS 一并生效；`content/pages/about.md` 的 `hero` 同步改为 `Hi, I'm ZHONG WEI`。
- 「关于」页顶部背景图改为可在后台更换。原先 `about.css` 中写死 `url(/imgs/bg.jpg)`，CMS 无法修改。现提为 about.md 的 `cover` 字段：CSS 改用 `var(--about-cover)`，由 `about.tsx` 通过内联 CSS 自定义属性注入（背景绘制在 `::after` 伪元素上，内联样式无法直接命中，故走变量）；预加载逻辑同步改用该字段并在缺省时跳过。`.pages.yml` 增加 image 类型字段，可直接在后台上传新图。
- 修复碎碎念正文未以 `## ` 开头时内容被静默丢弃、页面显示 0 条的问题。根因在 `lib/data/server/memos.ts` 的 `splitMemo`：原逻辑遇到第一个 `## ` 之前的行一律 `continue` 跳过，用户在后台直接写正文（不加二级标题）会导致整条内容消失且无任何报错。现改为：正文开头无 `## ` 时自动为其建立一条 memo，id 留空并由 `velite.config.ts` 的对象级 transform 回填该文件的 `date`。`## ` 分隔多条的原有行为不变。`.pages.yml` 的正文字段说明同步更新为「直接写即可，多条才需要 ## 分隔」。
- 正文图片去掉圆角与投影。样式来自 `app/styles/components.css` 中 `.markdown-wrapper` 作用域下的 `img, picture { @apply rounded-2xl shadow-md; box-shadow: ... }`，整条移除。该规则仅作用于正文，顶栏 logo 与碎碎念头像不受影响；同文件中链接下划线、行内代码、代码块的圆角与阴影保留。
- 接入 Waline 评论与浏览量服务，`site.config.ts` 增加 `walineApi: https://waline-gamma-opal.vercel.app`（Vercel 部署，数据库为其模板自动配置的 Neon）。此前该字段缺省，导致 `waline.tsx` 直接返回、文章页的阅读量与评论数占位元素始终为空。部署前已实测服务端写入链路：POST `/api/article` 递增后回读数值持久化，确认表结构可用。
- Waline 服务端地址由 `waline-gamma-opal.vercel.app` 改为自有子域名 `comment.006573.xyz`。绑定自定义域名后 Vercel 会将原 `.vercel.app` 地址设为 307 跳转，继续使用旧地址会让 API 请求（尤其 POST）走重定向。切换前已验证新域名：TLS 有效、浏览量与评论数接口正常、写入递增数值与旧域名连续（同一数据库）。
- 修复文章页顶部阅读量/评论数恒为 0（评论实际存在）的问题。Waline 以 path 字符串作为内容唯一标识，读写必须完全一致。本站为目录式 URL，`waline.tsx` 与 `CommentCard.tsx` 用 `location.pathname` 得到的是带尾斜杠的 `/posts/xxx/`，而 `posts.$slug.tsx` 顶部计数元素的 `data-path` 按 `/posts/${slug}` 拼接、不带尾斜杠，两者查的是不同记录。新增 `lib/waline-path.ts` 统一去除尾斜杠作为规范形式，在上述两处调用；`data-path` 本就是规范形式，无需改动。注意：切换前以带尾斜杠路径写入的数据（测试评论与浏览量）会与新路径不再关联。
- 修复评论组件在页面上完全不渲染、顶部阅读量与评论数始终为空的问题。真正的根因是 `@waline/client` 版本过旧：`package.json` 虽写 `^3.8.0`，但 lockfile 将其锁死在 3.8.0，该版本初始化阶段抛 `TypeError: Cannot read properties of null (reading 'token')`，崩溃发生在任何网络请求之前，导致 `#waline` 容器停留在占位文字、计数元素永不被填充。以官方 CDN 的 3.15.2 在同一页面做隔离验证可正常渲染并填充计数，据此升级至 3.15.2。
- 移除模板作者遗留的两处个人化文案：`topbar/index.tsx` 顶栏下方的站点标语「人活着就是为了卡卡西」，以及 `MemoSkeleton.tsx` 碎碎念加载提示中的「等等，卡卡西正在做饭……」（同处 "Cooking..." 一并改为中性的 "Loading..."）。顶栏那处的外层 div 是撑开固定头部高度的布局占位，予以保留，仅删除文字与随之失效的文字样式类。
- 文章页右下角悬浮按钮增加阅读进度百分比。新增 `app/hooks/use-reading-progress.ts` 计算页面滚动进度（用 requestAnimationFrame 合并滚动事件，并监听 resize，因图片加载完会改变文档总高度）；`FloatButton` 增加可选 `label`，有文字时由固定 40×40 方形变为自适应宽度胶囊。附带修复：该组件原以绝对定位居中图标，改用 flex 后，两处传入 `display: block` 的调用（`FloatButtons` 的 TOC 按钮、`memos.tsx` 的移动端按钮）会使图标垂直偏移 2px，已一并改为 `flex`。
- 新增《Vibe Coding 需要知道的设计术语》系列 3 篇（文字排版 / 色彩系统 / 栅格与布局），转载自 linux.do，原作者 Henry_He，正文开头保留署名与原帖链接。新增 `scripts/import-vibe-articles.mjs` 完成转换：frontmatter 换为博客 schema（补 `categories: 设计` 与 `description`，去掉论坛标签）、去除与模板 `<h1>` 重复的一级标题、论坛用语中性化、文末 roadmap 的站外互链改为本站内链。配图 66 张已从 `cdn3.ldstatic.com` 迁移至自有图床 `weiiiiiu/pa-charts` 的 `img/vibe-coding/`，避免依赖第三方图床（对方随时可能加防盗链）。
- 新增《近年 AI 应用技术串讲》。在原始笔记基础上做了结构与内容修订：原文将全部说明文字塞在末尾一个 Markdown 代码块内、链接单独堆在上方，现按概念把说明与链接合并归位；清理导出遗留的反斜杠转义；裸链接改为带标题的链接；去重与剥离 utm 跟踪参数。链接核实与更正：OpenAI 函数调用文档已迁至 `developers.openai.com`、Anthropic Agent Skills 博客已迁至 `anthropic.com/engineering`、MCP 由第三方镜像 `modelcontextprotocol.info` 改为官方 `modelcontextprotocol.io`；另补入 Anthropic 官方工程博客四篇与 Claude 工具调用文档。全文 25 条链接逐一验证可达。配图迁至自有图床 `img/ai-overview/`。

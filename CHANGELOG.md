# CHANGELOG

本项目的变更记录，按日期倒序排列。

## 2026-08-15

### 更新内容

- 新增券商转户两篇：《嘉信（Schwab）→ IBKR 无损搬家》与《从 IBKR 转持仓到嘉信（Schwab）：ACATS 全流程》，由仓库外的两份 markdown 导入 `content/posts/`，与已有的《IBKR 美元怎么低损耗地花回内地》合为「入金 → 出金 → 提现」一组。导入按本站既有惯例做三处转换：补 frontmatter（`title`/`date`/`categories: 投资`/`tags`/`description`）、删除正文首行与模板 `<h1>` 重复的一级标题、`来源` 一节的裸链接改为带标题的 markdown 链接。另修正原稿一处笔误：成本价小节标题写「两点要注意」但实际列了三条，改为「三点」。两篇均未改动技术内容。

- 《IBKR 美元怎么低损耗地花回内地》补正出金费率，并结清最后一条存疑项。此前 IBKR 收费页对抓取返回 403，只能引二手来源；改用浏览器 UA 取到官方中文页后发现两处错误：一是免费额度，官方原文为「IBKR 每个日历月支持两次免费取款」，而非流传的每月 1 次；二是费率，亚太区收费表分「银行转账/电汇」与「本地电子转账」两列，原文误取了电汇列，CNH 实为电汇 60 元 / 本地转账 **7 元**（HKD 95/8，USD 10/1），相差近九倍。据此撤销原「一次提够」的建议——超额后一次仅 7 元，必须一次做完的是换汇（佣金有 USD 2 最低值）而非出金。另补入 IBKR 按美东时间划分日历月，影响「月底一笔 + 次月初一笔」凑免费额度的做法。第七节因此改名为「这些结论的依据」，三条关键结论均已有一手来源，仅保留「条款与实际执行未必一致」作为仍需小额实测的理由。参考资料中的收费页链接换为可直接打开的中文版。

- 修订《IBKR 美元怎么低损耗地花回内地》第七节「还没实测的部分」。原版把三条强度完全不同的信息并列，读起来像整套方案都悬着，实际上其中两条已可确证：中银「人民币直扣」是官方条款的直接陈述（条件、结果、例外均写明），不是推导；「支付宝交易在卡组织侧以 CNY 计价」经补查已由机制侧与结果侧两条独立来源印证——支付宝外卡内用走传统四方模式、收单行为中行与工行、商户侧人民币结算，故授权币种为 CNY，且内地支付宝账单显示 CNY 而 AlipayHK 显示 HKD。该清算链路说明补入第四节开头，因为它正是第三节「按交易货币找对应户口」规则得以生效的前提。第七节重写为「已查实 / 仍存疑」两栏，仅保留 IBKR 每月免费出金次数一条（官方收费页持续返回 403，二手来源分歧），并说明仍建议小额实测的真实理由是条款与柜面执行未必一致，而非逻辑存疑。

- 新增《IBKR 美元怎么低损耗地花回内地》。记录 IBKR 美元 → 港卡 → 内地消费的完整路径与每一环成本。核心结论是 USD→CNY 的换汇无法回避，只能选择它发生的位置：IBKR 的 IDEALPRO 约 0.02%、卡组织与银行牌价约 0.5%~1%、支付宝加价 3%，故应在 IBKR 内换成 CNH 再出金。文中费率与条款均核对至一手来源：中银万事达扣账卡「外币直接扣账设定」的三个生效条件与 ATM 取现例外引自官网《重要注意事项》原文，12 币种直扣与外币交易费豁免引自官网常见问题，汇丰对应规则引自其产品页，IBKR 的 HKD/USD/CNH 免额外验证与 CNH 60 元出金费引自 IBKR 官方文档与香港站收费页。末节显式标注三处仅有条款推导、尚无实测账单佐证的事项（内地交易是否真从人民币户口扣、支付宝在万事达网络的计价币种、IBKR 每月免费出金次数为 1 还是 2），避免读者误当已验证结论。

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
- 新增《一位美股期权交易员的决策框架》。由两份 HTML（交易判断流程图、大白话详解）合并整理为一篇 markdown：两份原稿在期望值算法、六大因素等处内容高度重叠，直接拼接会大量重复，故按「内核数学 → 五步流程 → 六大因素 → 个性化选择 → 分析方法 → Edge → 红线 → 术语表 → 给普通人的建议」重新编排，白话解释与结构化要点就近合并。原稿中的 Mermaid 流程图（博客不支持 Mermaid 渲染）经 mermaid.ink 渲染为 SVG，补齐显式宽高与背景矩形后上传至自有图床 `img/maitian/`。原文的免责声明与「绝大多数普通人长期亏钱」的结论提至文首保留。
- 重写《一位美股期权交易员的决策框架》第三节「六大因素」。原版把术语（点阵图、鹰鸽、做市商对冲、反身性、CTA、前瞻 PE）直接罗列未作解释，读者反馈看不懂；现逐个用日常比喻展开，并补入「好消息可能是坏消息」的判断链条说明。同时新增宏观数据发布日程表，日期与时间均取自官方发布日历（BLS、BEA、Census），含北京时间换算，以及 GDP 一季三发、GDP 与 PCE 同日发布、消费者信心存在两套口径、日程可能因停摆顺延等易错点。
- 新增正文表格样式。此前 `app/styles/components.css` 中完全没有表格规则，markdown 表格按浏览器默认渲染（细黑边框、无内边距）。现参照参考图实现：表头浅灰底（`--tag-bg`）、正文隔行斑马纹（`--bg-2`）、去除所有竖线与外框、左对齐、加大单元格内边距。颜色一律取主题变量而非硬编码，故明暗主题自动适配。表格设为 `display:block; overflow-x:auto`，使多列表格在窄屏横向滚动，而不是把每格挤成两三个字。
- 更正美联储主席。文中沿用了原始笔记里的「鲍威尔讲话」，但据美联储官网理事会名单，现任主席为凯文·沃什（Kevin Warsh），鲍威尔已卸任主席、仅保留理事席位。原稿成文时间早于换届，撰写时未核实现任者。

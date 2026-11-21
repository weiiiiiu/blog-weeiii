# 线上性能测试：2026-11-21

测试对象：<https://blog.006573.xyz/>。

结论：桌面首页和文章首屏表现良好；手机首页仍有渲染延迟，动态页正文显示明显偏慢。优先处理日期时区导致的水合失败、动态页首屏依赖 JavaScript，以及全站过大的 Logo。

## 测试范围与方法

- [x] 首页、文章 `/posts/16F`、动态 `/memos`、分类 `/categories` 各进行 3 次普通 HTTP 访问。
- [x] 共运行 10 次 Lighthouse：手机首页 3 次、桌面首页 1 次；文章、动态各测试一次无尾斜杠入口，再直接测试最终网址，文章 1 次、动态 3 次。
- [x] 使用独立 Chrome 检查冷缓存、暖缓存、运行时错误、文章滚动图片加载和关闭 JavaScript 的动态页。
- [x] 固定中文语言，对 UTC、上海、洛杉矶时区分别检查首页水合及 DOM 节点是否被替换。
- [x] 对照当前仓库源码定位问题，保存测试报告与原始数据。

环境：Lighthouse **13.6.0**，Chrome **157.0.8103.79**。手机使用默认模拟配置：412×823、DPR 1.75、约 1.6 Mbps、RTT 150 ms、CPU 4 倍减速；桌面使用默认 desktop 配置。正式评分使用英文浏览器语言、America/Los_Angeles 时区。Lighthouse 清理浏览器缓存，测试顺序执行，CDN 缓存和连接预热仍会影响各轮结果。

网络经过本机网络环境，响应头显示 Cloudflare LAX 节点；这些是单一网络路径下的实验室结果，不能代表中国大陆各运营商、真实手机或真实用户 75 分位数据。未测真实用户 INP，也未进行并发压力测试。

## 核心指标

多次测试的各项数值分别取中位数。文章和动态页主表使用带尾斜杠的最终网址，排除入口重定向。

| 页面 / 设备 | 次数 | 性能分 | FCP 首次内容显示 | LCP 最大内容显示 | TBT 主线程阻塞 | CLS 布局偏移 | 加载期传输量 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 首页 / 手机 | 3 | **93** | 1.17 s | **3.26 s** | 48 ms | 0 | 350 KiB |
| 首页 / 桌面 | 1 | **99** | 0.45 s | **0.79 s** | 0 ms | 0.00003 | 351 KiB |
| `/posts/16F/` / 手机 | 1 | **99** | 1.09 s | **1.09 s** | 127 ms | 0.00021 | 686 KiB |
| `/memos/` / 手机 | 3 | **81** | 1.09 s | **5.13 s** | 0 ms | 0 | 542 KiB |

传输量取 Lighthouse `total-byte-weight`，包括加载期请求；不是滚动浏览整篇文章后的总流量。KiB = 1024 bytes。

- 手机首页三次：84 / 93 / 93 分，LCP 4.30 / 3.25 / 3.26 s，存在首轮波动。
- 手机动态页三次：81 / 84 / 81 分，LCP 5.14 / 4.54 / 5.13 s，慢首屏可重复出现。
- 无尾斜杠入口：文章 100 分、动态 80 分，但 Lighthouse 提示发生跳转，故不与最终网址混合计算中位数。
- 文章 LCP 元素是标题，高分不代表 21 张正文图片全部加载完成；其 Lighthouse `interactive` 为 4.54 s，评论和脚本仍在后续加载。

作为参考，LCP ≤2.5 s 为良好、>4 s 为较差；性能总分由多个指标加权，因此首页 93 分仍然可以存在 LCP 偏慢。[LCP 指标说明](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint)、[Lighthouse 评分说明](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)。

## 发现与优化顺序

### P1：日期时区不一致，首页水合失败并重建 212 张卡片

首页及文章页的普通浏览器检查均捕获 `Minified React error #418`。固定浏览器语言为 `zh-CN` 后，首页对照结果如下：

| 浏览器时区 | 日期文本变化数 | 初始文章卡片被替换数 | 水合错误 |
| --- | ---: | ---: | --- |
| UTC | 0 | 0 | 无 |
| Asia/Shanghai | 8 | 212 | #418 |
| America/Los_Angeles | 191 | 212 | #418 |

例如 `/posts/王者怼人` 的静态 HTML 为 `2026年9月8日`，上海时区客户端变为 `2026年9月9日`；`/posts/16F` 在静态 HTML 为 `2026年7月28日`，洛杉矶客户端变为 `2026年7月27日`。

观察器保存初始 `a.article-card` 的节点引用，加载后检查 `isConnected`，确认 212 个旧节点均已脱离文档。按照 [React #418 官方解释](https://react.dev/errors/418)，服务端和客户端内容不一致会导致对应树在客户端重新生成。这里已验证日期差异和重建行为；尚未量化修复后能节省多少 LCP。

定位：`app/hooks/use-date-i18n.ts:27` 使用 `getFullYear/getMonth/getDate` 读取环境本地时间；`app/components/home/ArticleItem.tsx` 在首轮渲染直接调用日期格式化，相关解析见 `lib/date.ts`。

建议：静态生成与客户端第一次渲染使用相同的日期快照或固定时区；水合完成后再切换到用户时区。修复后在上述三个时区验证不再出现 #418、卡片节点不被替换，再复测 LCP。

### P1：动态页首屏等待 JavaScript，且加载了较大的编译相关脚本

`/memos/` 初始 HTML 的可见主体为 `Loading...`。关闭 JavaScript 后，导航可见，动态正文始终未出现。LCP 最终落在动态正文段落上，三次手机测试为 4.54–5.14 s。

定位：`app/routes/memos.tsx:183` 设置 `clientLoader.hydrate = true`，`HydrateFallback` 返回 `OverallSkeleton`。虽然 loader 有 SSG 数据，线上初始页面没有直接展示这些正文。

同页加载期 JavaScript 传输约 361 KiB，其中 `MDXComponent-IALyQKYf.js` 约 104 KiB、`memos-main-BlNXWXUe.js` 约 105 KiB（网络传输大小）。Lighthouse 估计这两个文件在初始加载中约 **173 KiB 未使用**；这不意味着可直接删除对应功能。

源码线索：`app/components/markdown/MDXComponent.tsx` 从 `@mdx-js/mdx` 导入 `runSync`；`app/routes/memos.tsx` 顶层导入 Markdown 编译工具、GFM 和语法高亮插件，筛选结果在客户端编译。

建议：让无筛选条件的首屏直接显示预渲染正文；把搜索、筛选所需编译及高亮依赖移到用户使用功能时加载。检查 MDX 运行依赖的构建产物，减少进入首屏的无关代码。

### P2：28×28 Logo 下载了 97 KiB

`/logo.png` 文件为 256×256、99,041 bytes，导航中仅显示 28×28 CSS 像素，并由 HTML preload 以高优先级请求。它占首页加载期传输量约 **28%**。

Lighthouse 估计可节省约 96 KiB；该数值是工具估算，实际收益需要重新编码后测量。建议生成适合 2×/3× 屏幕的小尺寸 WebP/AVIF，保留必要清晰度；重新评估它是否需要抢占 preload 优先级。

### P2：未配置 GA ID，仍发出无效统计请求

线上 HTML 包含 `https://www.googletagmanager.com/gtag/js?id=undefined`；本次网络环境中该请求失败，Chrome 报 `ERR_CONNECTION_CLOSED`。无法据此断定 Google 在所有网络中的返回状态，但 `id=undefined` 已由 HTML 和源码共同确认。

定位：`site.config.ts` 未配置 `GAId`，`app/root.tsx:49` 无条件插入外部脚本和初始化代码，`app/hooks/use-gtag.ts` 仍可能调用未配置的统计逻辑。

建议：仅在有效 `GAId` 存在时加载和初始化统计。此项容易修复，但尚未量化其性能影响，不应视为动态页 5 秒 LCP 的主因。

### P3：列表、图片及评论的后续优化

- 首页直接展示 **212 篇文章**，Lighthouse DOM 审计为约 2,244 个元素，原始 HTML 约 276 KiB。修复水合问题后，再评估分页或分批展示；本轮未测得严重主线程阻塞，不能仅凭节点数认定它是唯一瓶颈。
- 文章静态 HTML 已包含 21 张正文图片，首张 `eager/high`，其余 `lazy`。本次有限滚动检查后成功加载 7 张正文图片，无图片失败请求；滚动期间测得 CLS 约 0.0006。未测试全部图片或弱网滚动。
- 文章图片缺少明确宽高，仍建议预留比例，降低弱网时布局移动的风险。本轮数据未显示严重图片布局抖动。
- 文章 Waline 脚本约 71 KiB 传输，页面初始即挂载。可评估滚动接近评论区再加载；若保留首屏阅读/评论计数，应与评论编辑器拆开处理。
- Inter 字体约 46 KiB，由 `fonts.gstatic.com` 加载。可考虑自托管或系统字体；本轮字体请求成功，不能推断所有访问地区的表现。

## 响应时间与缓存

以下为独立 `curl --compressed -L` 请求的中位数，包含 DNS/TLS 与重定向成本，与 Lighthouse 的服务器响应时间审计不是同一口径。

| 请求入口 | 最终 HTTP 状态 | 跳转次数 | 首字节时间 | HTML 压缩传输体积 |
| --- | ---: | ---: | ---: | ---: |
| `/` | 200 | 0 | 0.415 s | 29.5 KiB |
| `/posts/16F` | 200 | 1 | 0.617 s | 34.9 KiB |
| `/memos` | 200 | 1 | 0.597 s | 5.8 KiB |
| `/categories` | 200 | 1 | 0.584 s | 6.0 KiB |

本轮未发现主文档访问失败。文章等无尾斜杠 URL 会通过 308 跳转到带斜杠 URL；可以统一外链、RSS、站点地图和直接导航 URL，但需验证客户端路由、评论路径及现有链接兼容性。

HTML 返回 `Cache-Control: public, max-age=0, must-revalidate`，`CF-Cache-Status: DYNAMIC`；抽样 JS/CSS/Logo 返回 `max-age=14400, must-revalidate`。暖缓存检查中首页 28 个请求有 25 个来自浏览器缓存，静态资源缓存是有效的。可为带内容哈希的 `/assets/*` 设置更长缓存；不宜直接对可更新且无哈希的 HTML/JSON 套用一年缓存。

## 原始报告与复现

本地临时结果目录：`/tmp/blog-paper-perf-results/`。完整归档：`/tmp/blog-paper-performance-2026-11-21.zip`。临时目录可能被系统清理，本 Markdown 保留结论、关键数据和复现说明。

- `home-mobile-1/2/3.html`、`home-desktop-1.html`：首页 Lighthouse 可视报告。
- `post-canonical-mobile-1.html`：文章最终网址报告。
- `memos-canonical-mobile-1/2/3.html`：动态最终网址报告。
- 同名 `.json`：完整 Lighthouse 数据；`metrics-summary.json`：核心指标汇总。
- `http-timing.json`、`resource-headers.json`：HTTP 响应和缓存证据。
- `hydration-check.json`：时区对照、文本差异、卡片替换数和错误。
- `browser-check.json`：常规浏览器观察；文章以 `browser-check-post-recheck.json` 为准。第一版滚动观察器曾因 Text 节点没有 `outerHTML` 抛出测试脚本异常，已修正并复测，未将该异常计为网站错误。
- `memos-no-js.txt`：关闭 JavaScript 后的可见文本。
- `*-mobile.png`：各页面首屏截图。

测试脚本在 `/tmp/blog-paper-perf-tools/`，归档也包含脚本。工具安装在临时目录，未修改项目依赖。

后续建议验收目标：多时区无水合错误；动态默认入口无需等待 JS 即可阅读正文；手机 LCP 中位数 ≤2.5 s、CLS ≤0.1，并复核真实用户数据。

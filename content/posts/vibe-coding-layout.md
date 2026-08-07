---
title: Vibe Coding 需要知道的设计术语——栅格与布局
date: 2026-06-26 12:00:00
categories: 设计
tags:
  - Vibe Coding
  - 设计
description: 栅格、间距、对齐与滚动容器——描述页面结构时该用的那套词汇。
---

> 本文转载自 linux.do，原作者 **Henry_He**，[点此查看原帖](https://linux.do/t/topic/2480260)。

经常看到朋友和同事在 Vibe Coding 时吐槽 AI “听不懂人话”: “高级感”、“眼前一亮”，“再改改”，结果页面越改越乱。可能并非 AI 能力不够，更多是因为我们采取了“玄学抽卡”的策略。我们无法将思考外包给模型，但是 AI 时代的学习范式也得改变。

LLM 在 Pre-training 与 RL 阶段均基于海量代码数据训练，对英文专业术语的语义锚点远强于中文（且中文语义信息熵过高，容易产生歧义），怎么和 Agent 对齐很重要，打算长期整理一份术语速查表整理分享出来，方便查阅

**视觉设计篇 roadmap**

* ~~Typography / 文字排版~~ /posts/vibe-coding-typography
* ~~Color system / 色彩系统~~ /posts/vibe-coding-color-system
* ~~Grid & Layout / 栅格与布局~~
* ~~Iconography / 图标系统~~
* Spacing & Imagery / 间距与图像
* Motion & Interaction / 动效与交互
* 合订版

---

布局处理内容在页面里的位置关系。它决定导航放在哪里，正文多宽，按钮离表单多远，屏幕变窄后哪些内容先换行或收起。

栅格是布局的参考线，响应式是布局对不同屏幕的调整方式，前端布局工程则把这些规则落到浏览器里。三者放在一起看，才能解释一个页面为什么稳定，或者为什么一缩小就乱。

## 1. 布局基础与空间关系 (Layout Basics & Spatial Relationships)

### Layout (布局)

Layout 处理界面元素放在哪里。导航、正文、侧边栏、按钮和底部信息区，都需要在屏幕上找到稳定的位置。

### Composition (构图)

Composition 处理这些元素放在一起后的画面关系。它关心视线先落在哪里，哪个区域更重，哪些内容应该退到后面。布局更像搭结构，构图更像调画面的重心。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/1e75fc54e56ccc44317cce8823627c698d63dc64.png)

### Visual Hierarchy (视觉层级)

视觉层级用尺寸、字重、颜色对比和留白拉开信息优先级。标题、价格、按钮、说明文字不能都一样重。

### Reading Flow (阅读路径)

阅读路径是用户视线在页面上移动的顺序。Z 型或 F 型扫描可以参考，但真实页面还要看内容和任务。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/55624d4aabbb187d7e31226fd1595cf255021d9d.png)

</div>

### Alignment (对齐)

对齐让分散的元素沿同一条参考线排列。即使没有画出边框，文本、按钮和卡片边缘也会形成隐形轴线。轴线稳定，页面就不会显得东倒西歪。

### Proximity (邻近)
邻近关系用距离表达内容之间的关系。靠得近的元素会被看成一组，距离拉开以后，用户会自然把它们当成不同模块。

### Grouping (分组)

分组不一定要靠分割线完成。表单字段、设置项和列表信息，很多时候只要调整间距就能变清楚。

### Whitespace (留白)

留白是内容之间没有被占用的空间，包括内边距、外边距和区块之间的空隙。留白不足时，页面会堵，用户很难判断哪些内容属于一组；留白过多时，相关信息又会被拉散。

---

## 2. 栅格系统 (Grid Systems)

### Grid (栅格)

Grid 是由行、栏、槽距和页面边距组成的参考线系统。这些线通常不直接显示在页面上，却会支撑内容对齐。12 栏栅格在 Web 中很常见，因为它容易拆成 2、3、4、6 等不同分栏。

### Container (页面容器)
Container 是承载页面主要内容的外层区域。它通常会设置 `max-width`，再在视口中居中。没有容器限制时，正文在宽屏上会被拉得太长，读一行要扫很远。

### Margin (页面外边距)
Margin 是容器边缘到浏览器边缘之间的空白。它给内容和屏幕边缘留出缓冲。手机上如果没有这层空白，文字和按钮会贴着屏幕边缘，看起来很紧。

### Row (行)
Row 是水平方向上的布局带。它把多个内容块放在同一层，方便控制垂直节奏。比如一行里放三张指标卡，下一行再放图表。

### Column (栏)
Column 是垂直方向的分栏基准，也常缩写成 Col。内容可以占一栏，也可以跨多栏。栏太窄，卡片内容会挤；栏太宽，列表和正文又会变得松散。

### Gutter (槽距)
Gutter 是相邻栏或行之间的空白。它把内容隔开，避免相邻信息粘在一起。槽距太小，卡片会像挤在一起；槽距太大，页面会显得散。

### Module (模块)
Module 是落在栅格里的实际内容块。一个模块可以占一栏，也可以跨多栏。商品卡片、统计卡片、图表区都可以看成模块。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/818989c7a8a10906fbaf5825607f7b640065dd5a.png)

</div>

### Baseline Grid (基线网格)
Baseline Grid 是纵向排版的参考线，类似书写本里的横格。它让文本行高、段落间距和组件高度更容易落在同一套节奏上。多列内容并排时，基线网格能减少“这一列高一点、那一列低一点”的错位感。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/392361cd4a2d574a30dc23946649567cdb54ddec.png)

</div>

### Modular Grid (模块化栅格)
Modular Grid 在栏的基础上加入行，形成横纵都有约束的网格矩阵。控制台、商品卡片矩阵和杂志式页面常用它，因为这些页面需要反复比较同一类信息。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/7699de610f1a792fdee7843defc0f06a87f04e14.png)

</div>

---

## 3. 页面布局模式 (Layout Patterns)

### Single-column (单栏)
把内容收在一个居中的窄列里。文章、说明页和文档正文通常用单栏，因为读者需要从上到下连续阅读。
### Sidebar (侧边栏)
一侧放导航或筛选项，另一侧放主要内容。后台、文档和设置页常用这种结构，因为用户需要一边切换项目，一边查看内容。
### Split (分栏)
把屏幕分成两个主要区域。登录页可以一边放品牌图，一边放表单；对比页可以左右放两个对象。
### Multi-column (多栏)
在水平方向划出多列，并排展示同级内容。索引页、资源列表和分类入口可以用多栏，让用户快速扫过更多项目。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/82512f16262359e46bff4e3e66639202d396a9da.png)

</div>

### Card Grid (卡片网格)
Card Grid 把信息封装在独立卡片里，再按矩阵排列。商品、视频缩略图和模板列表常用这种方式。卡片边界清楚，用户更容易扫视和比较。

### Masonry (瀑布流)
Masonry 的列宽固定，卡片高度不同，内容会交错向下排列。图片流和 UGC 内容可以这样排，因为每个项目高度不一样。需要严格比较价格、状态或指标的列表，不适合瀑布流。

### Dashboard (仪表盘)
Dashboard 由图表、指标卡片、列表和筛选器组成。它把多个维度放在同一屏里，方便用户监控和比较。仪表盘的难点在于取舍：屏幕可以很满，但最重要的指标必须先被看到。

### Master-detail (主从布局)
Master-detail 把列表和详情放在同一屏。用户在左侧选择项目，右侧显示详情。邮件客户端、设置页和管理后台都常见，适合频繁切换项目的任务。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/656da305c2add786100ae32dfa2556e5499b26a9.png)

</div>

---

## 4. 响应式布局策略 (Responsive Layout Strategy)

### Breakpoint (断点)

Breakpoint 是布局规则发生变化的宽度位置，通常基于视口宽度。到达某个断点后，页面可能从单栏变成多栏，也可能显示侧边栏或增加页面留白。断点应该跟内容什么时候撑不住有关，不能只照搬设备尺寸。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/bbe428b53a389effb60d42456ac995df95ee7a44.png)


</div>

### Responsive Design (响应式布局)

响应式布局会随着可用空间连续调整。容器变窄时，元素先压缩或换行；空间不足时，再通过断点切换成小屏结构。理想状态下，页面会一步步收紧，而不是突然坏掉。

<div align="center">

![Responsive Design](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/96767b46c52699b19e2b18a2d71d48f526377263.gif)
</div>



### Adaptive Design (适配式布局)
适配式布局会为几个宽度准备不同版型。宽度变化时，页面不一定连续缩放；跨过断点后，它会切换到另一套布局。它更像准备几套固定方案。

<div align="center">

![Adaptive Design](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/601978ab14bd78619071525a6335d44d56ba0893.gif)
</div>


### Fixed (固定)
固定布局使用明确尺寸，例如 `width: 300px`。小图标、头像、固定宽度按钮可以这样做。长文本、表格和窄屏页面如果大量固定尺寸，很容易溢出。

<div align="center">

![Fixed](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/77b0962c739280fbe08ce41ea4fef318d03fe4b5.gif)
</div>

### Fluid (流体)
流体布局让元素跟随父容器变化，例如 `width: 100%` 或 `flex: 1`。它能吃满可用空间，但也需要最大、最小宽度约束。不设上限，正文会太长；不设下限，卡片会被挤坏。

<div align="center">

![Fluid](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/61cdd1852ecec993ff7797b43d9fd783a86d992c.gif)
</div>

### Intrinsic (内在布局)
内在布局让内容参与决定尺寸，例如 `max-content`、`min-content`、`fit-content`。标签、按钮和菜单项的文字长度不稳定时，这类尺寸很有用。它能避免短内容占太大，也能让长内容有边界。

<div align="center">

![Intrinsic](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/bb0604cde7034860cf4ffb1cbec41ef4c41dbfaa.gif)
</div>

### Viewport (视口)

Viewport 是浏览器或设备当前可见的页面区域。断点、`vw` / `vh` 这类视口单位，以及首屏能看到多少内容，都以它为参考。

做响应式布局时，Viewport 通常决定页面级结构什么时候变化。手机上收起侧边栏，桌面上展开多列内容，就是典型例子。

<div align="center">

![Viewport](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/cdac49724a26cb7c2523e768e66dc10a59de7e9e.gif)
</div>

### Container Query (容器查询)

Container Query 让组件根据自己所在容器的尺寸变化，而不是只看整个屏幕宽度。同一个卡片可能出现在宽主栏，也可能出现在窄侧栏。只看视口宽度时，它很难知道自己实际还有多少空间。

容器够宽时，组件可以显示更多字段；容器变窄时，就收起次要内容。这比全局断点更贴近组件自己的处境。

<div align="center">

![Container Query](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/02e9bce13278cf2e13d4366cec2c62209676f0d8.gif)
</div>

### Safe Area (安全区域)

Safe Area 是移动设备边缘里适合放置内容的安全范围。刘海、圆角屏幕和底部系统手势条都会占掉一部分边缘空间。

移动端的固定底栏、返回按钮和全屏图片如果贴得太靠边，可能会被硬件遮挡，或者和系统手势冲突。Safe Area 给这些边缘内容留出避让空间。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/827fb995fb6b4b10863d6cc08f569c92955986f1.png)

</div>

---

## 5. 前端布局工程 (Front-end Layout Engineering)

### Normal Flow (文档流)

Normal Flow 是浏览器默认的排版方式。没有用 `position`、`float`、`flex` 或 `grid` 改变布局时，元素会按照 HTML 顺序进入页面。

块级元素通常从上到下排列，行内内容在一行里从左到右流动，空间不足时自动换行。先理解文档流，才能判断元素为什么出现在当前位置，也能少用定位去硬修布局。

<div align="center">

![Normal Flow](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/20fd82ade6f7f023183f0139b111d5c78c77aae6.gif)
</div>

### Box Model (盒模型)

Box Model 描述一个元素在页面上占据空间的方式。每个盒子由内容区、内边距、边框和外边距组成，对应 `content`、`padding`、`border` 和 `margin`。

内容区放文本或图片，内边距拉开内容和边框，边框形成盒子的边界，外边距负责和其他元素保持间隔。布局出问题时，先看盒子的实际尺寸，别只看 `width` 或 `height`。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/429f732e94c473af0ad20d4eb135c441d65e8cb4.png)

</div>

### Display (显示类型)

Display 决定元素以什么身份参与页面排版。`block` 会独占一行，`inline` 会跟随文字流动，`inline-block` 能排在一行里，也可以设置宽高。

`display` 还可以创建新的布局上下文，例如 `flex` 和 `grid`。所以它既影响元素自己怎么排，也影响子元素怎么排。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/a136dd8fd90a50f98a494b957c7746fcc83b0dea.png)

</div>

### Flexbox (弹性布局)

Flexbox 是一维布局模型，主要处理一条轴线上的排列、分布和对齐。它可以让一组元素沿主轴排成一行或一列，再用交叉轴控制另一方向的对齐。

导航栏、按钮组、工具栏、表单行和卡片内部的图文结构都很适合 Flexbox。它不负责画完整网格，更擅长处理一排或一列项目在空间变化时怎么分布。

<div align="center">

![Flexbox](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/276db4f621b0b5f92d3bb01835ad0105a1b8d214.gif)
</div>

### CSS Grid (CSS 栅格布局)

CSS Grid 是二维布局模型，可以同时控制行和列。页面骨架、卡片矩阵、仪表盘和表单分区都适合用它。

和设计里的栅格系统相比，CSS Grid 更偏工程实现。它可以把容器切成横向和纵向轨道，让元素占据指定区域，也可以跨越多行或多列。

> Modular Grid 更像设计稿里的参考网格，用来规划视觉节奏和内容对齐；CSS Grid 是浏览器里的布局规则，决定元素占据哪些行、列和区域。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/ccaae9f376e1930ad0d31e16c711b8a6cb94fe77.png)

</div>

### Positioning (定位)

Positioning 决定元素如何确定自己的位置。默认的 `static` 跟随文档流；`relative` 保留原本空间，再相对自身偏移；`absolute` 脱离文档流，相对最近的定位祖先放置。

`fixed` 相对视口固定，常见于悬浮按钮、固定导航和底部操作栏；`sticky` 会先跟随文档流滚动，到达阈值后吸附在指定位置。定位适合处理覆盖和固定区域，不适合替代常规布局。


### Z-index (层级)

Z-index 控制重叠元素在视觉上的前后顺序。数值更大的元素通常显示在更上层，但它只在特定层叠环境中比较，不能直接理解成整个页面的全局优先级。

使用 `z-index` 时，层级数量要克制。导航、浮层、弹窗、提示最好有固定约定。否则页面做久了，很容易出现 `9999` 这类局部修补。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/8da9ec4bb9c98fe6da46e99818e03c09acc12d47.png)

</div>

### Stacking Context (层叠上下文)

Stacking Context 是一组元素内部自己的叠放环境。一个元素创建新的层叠上下文后，子元素会先在内部排序，然后整个上下文再作为一个整体参与外部叠放。

这也是很多层级问题难排查的原因：子元素的 `z-index` 再高，也可能只能在父级上下文内部生效。常见触发条件包括定位配合 `z-index`、`opacity` 小于 1、`transform`、`filter`、`isolation` 等。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/09485494cfe3af2a26d0413195ff1a1b9fedae01.png)

</div>

### Overflow (溢出)

Overflow 描述内容超出盒子边界时怎么处理。默认情况下，内容可能继续显示在盒子外；也可以用 `overflow: hidden` 或 `overflow: clip` 截断，或者用 `auto` / `scroll` 提供滚动。

固定高度区域、长文本、图片、表格和横向列表都容易溢出。处理前先判断：内容应该换行，容器应该变大，还是确实需要裁切或滚动。

<div align="center">

![Overflow](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/b4bf19dc14ff0a8937b3abc8fdf7a62575ded609.gif)
</div>

### Scroll Container (滚动容器)

Scroll Container 是能够承载滚动的容器。一个元素设置了会产生滚动机制的 `overflow` 后，就可能成为内部内容的滚动边界。

滚动容器会影响吸顶元素、滚动阴影、内部列表、固定表头和弹层定位。很多滚动问题来自内部容器，不一定是页面本身在滚。

<div align="center">

![Scroll Container](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/182affc38336cc33ebf93b3dfed0c8cd3dc3ef98.gif)
</div>

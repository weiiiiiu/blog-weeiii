---
title: Vibe Coding 需要知道的设计术语——文字排版
date: 2026-06-18 12:00:00
categories: 设计
tags:
  - Vibe Coding
  - 设计
description: 字体分类、字号层级、行高与字距——把「排版难看」翻译成 AI 听得懂的英文术语。
---

> 本文转载自 linux.do，原作者 **Henry_He**，[点此查看原帖](https://linux.do/t/topic/2431084)。

经常看到朋友和同事在 Vibe Coding 时吐槽 ai 听不懂人话——“高级感”,“眼前一亮”,“再改改”，然后页面越来越乱。很多时候不是 AI 能力不行，更像我们是在用玄学抽卡。

LLM在pre-train和RL都用了海量的代码训练，自然英文术语的语义锚点会强于中文（而且中文语义信息熵太高了），打算长期整理一份术语速查表整理分享出来，方便查阅

***


## 1. 字体分类与基本术语 (Font Classifications & Basics)

### Typography (文字排版)

文本的字体选择、间距调整、版面布局，以及最终在屏幕或纸张上的阅读呈现方式。好的排版会先给读者一个入口，再让他们知道哪里可以扫过去，哪里值得停下来读。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/248c35322b961c532964e9f846ca541e0fd7f865.png)


### Font (字体)

特定样式、粗细和尺寸的字形集合。在数字开发中，通常指包含这些字形数据的二进制文件（如 `.ttf`、`.otf`）。字体决定文字的基本形态，也会影响界面的语气、信息密度和识别效率。

### Serif (衬线体)

笔画末端带有装饰性“尖角”或“细脚”的字体。视觉风格偏传统、正式，常用于长文阅读或需要呈现经典质感的场景。它通常能强化文本的书面感，但在小尺寸界面中需要注意清晰度。

### Sans-Serif (无衬线体)

笔画末端平滑、无额外装饰的字体。笔画粗细相对均匀，视觉风格更简洁、清晰，是数字设备和网页界面的常用选择。按钮、导航和表单里常用无衬线体，因为小尺寸下也比较稳。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/492914b1f44e7181add14cfe6d91b4bb49efa53d.png)


### Proportional Font (比例字体)

每个字符根据自身形状（如 `W` 与 `i`）占用不同水平宽度的字体。整体排版更紧凑、自然，更接近日常文章和网页的阅读节奏。正文、说明文字和大多数界面标签通常都用比例字体。

### Monospace (等宽字体)

每个字符（无论宽窄）都占用相同水平宽度的字体。常用于代码编辑器和终端，便于多行文本、数字和符号在垂直方向上稳定对齐。在界面设计中，它也常用于数据、编号、日志和需要精确比较的内容。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/05aeae1ad113dceeca0c4a162769fa8173053fd6.png)


***

## 2. 文本布局与间距 (Layout & Spacing)

文本间距决定文字之间的关系：字符是否紧凑，行与行是否适合连续阅读，文本边缘是否形成稳定的扫描路径。它和颜色、字号一样，都会直接影响界面的层级与可读性。

### Tracking (字间距)

均匀应用在整段文本或单词中所有字符之间的水平间距，在 CSS 中通过 `letter-spacing` 属性进行控制。标题、标签和按钮文本对它很敏感：太松会散，太紧会难扫。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/502b0e90ed9cfceeb14e65e2d0dbc6fc64e93a5c.gif)


### Kerning (字距微调)

调整特定两个字母（如 A 和 V）之间的间距，用于修正因字母形状产生的视觉空隙，使单词整体更连贯。它关注的是局部字形之间的视觉平衡，而不是整段文本的统一间距。


![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/b5235ab939ae2bf7acbea7fc91d57202b83f27b1.gif)



### Leading (行间距)

文本行之间的垂直距离，在 CSS 中通常通过 `line-height` 属性进行控制。正文能不能连续读下去，很多时候取决于这里。列表、表单和卡片里的多行内容也一样，行距太紧会显得堵。


![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/cc20468072f8592b32a1e10c7f8ac68dad0ca0a5.png)


### Alignment (对齐方式)

文本或界面元素沿特定基准线水平排列的规则。包含左对齐、右对齐、居中和两端对齐，用于决定阅读视线的起点和文本边缘的呈现形态。列表、表格和表单里，对齐方式会直接影响查找速度。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/22768c86cded4112da5654ce696603d2e4e91b20.png)


***

## 3. 字形解剖学 (Type Anatomy)

字形解剖学描述文字内部的基准线和结构部位。它帮助设计师和工程师理解为什么同样的字号在不同字体中看起来大小不同，也解释了图标、文本和组件在垂直方向上如何对齐。

### Baseline (基线)

大多数英文字母排列所在的水平基准线，是文本在垂直方向上对齐的基准。按钮、输入框、图标和多字体文本混排时，基线决定了文字是否看起来稳定。

### X-height (x 字高)

小写字母（如 `x`、`a`、`e`）主体部分的垂直高度，不包含向上或向下延伸的笔画。两个字体字号相同，看起来却一大一小，常常就是 x-height 在起作用。

### Ascender (升部)

小写字母中超出 x 字高并向上延伸的笔画部分，例如字母 `b`、`d`、`h` 的上半部分。升部会影响行高计算和多行文本之间的垂直留白。

### Descender (降部)

小写字母中向下延伸并超出基线以下的部分，例如字母 `g`、`j`、`p` 的下半部分。降部需要在行间距中保留足够空间，否则相邻文本行会显得拥挤。

### Cap Height (大写字高)

从基线到大写英文字母（如 `H`、`I`）顶端的垂直高度，与 x 字高共同决定字体在屏幕上的视觉比例。英文标题、按钮文字和图标对齐时，经常要看这个高度。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/cc87c9ad6b9220f3e41777c4d23864c9d68de641.png)


## 4. 数字排版度量单位 (CSS & Digital Units)

数字界面中的排版需要被转换成可计算的单位。不同单位承载不同意图：有的强调像素级控制，有的强调相对缩放，有的用于约束文本长度和响应式布局。

### PX (像素 / Pixel)

屏幕显示的基本度量单位。在 CSS 中作为逻辑像素使用，其最终对应的物理像素数量由设备的屏幕像素比（DPR）决定。字号、边框、图标尺寸和组件间距经常用 px，因为它的边界最明确。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/3586a542a0f7aab13b6d4f4fca4ce3aaebc8cd4b.png)


### PT (点 / Point)

物理长度单位，等于 1/72 英寸。在 iOS 等系统中常作为逻辑测量单位，通过缩放系数映射为物理像素，用于维持不同设备上的视觉尺寸一致性。它更多出现在操作系统、移动端界面和印刷排版语境中。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/853218475ac211730ea470923e068bfcb00f0656.png)


### EM (相对单位 / 字符宽度单位)

相对长度单位，`1em` 等于当前元素（或父元素）的 `font-size` 计算值。其尺寸会随着嵌套层级中的字号变化而累乘。组件内部的内边距、图标尺寸或装饰线条如果要跟着文字缩放，`em` 很顺手。

### REM (Root EM / 根相对单位)

相对长度单位，`1rem` 始终相对于 HTML 根元素的 `font-size` 计算值，可以避免深度嵌套时的字号累乘问题，常用于建立全局一致的排版尺度。设计系统中的字号、间距和断点常会优先使用它来保持跨页面一致性。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/c77f9403877285863a0de568c6a191ebe1878dbf.png)


### CH (Character Unit / 字符单位)

相对长度单位，等于当前字体中数字 `0` 的宽度。在等宽字体中，`1ch` 刚好等于任意单个字符的宽度。输入框宽度、代码块行长、表格列宽，都可以用它和字符数量对应起来。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/d6265f33f144c0403a3e3e6538fb1efa8cc27317.png)


***

## 5. 渲染与高级前端术语 (Rendering & Advanced Engineering)

文字最终需要经过浏览器、操作系统和字体文件共同渲染。加载策略、字体回退和像素对齐都会影响用户看到的结果，因此 Typography 也是前端工程的一部分。

### Anti-aliasing (抗锯齿 / 字体平滑)

平滑屏幕上字体边缘的技术。通过在边缘网格中填充不同透明度的过渡像素，减轻阶梯状的锯齿现象，让文字边缘在屏幕上更连续。它直接影响小字号文本和高对比文字的视觉舒适度。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/319ba412ab0910e730afdb1b728dc85c3a4d2f42.png)


### Font Hinting (字体提示 / 字体微调)

在小字号显示时将字体的关键笔画（如横和竖）对齐至像素边界的技术，用于提升小字号文本在屏幕上的清晰度。低分辨率屏幕和信息密集界面里，Hinting 的差异会更明显。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/a6d1f8df72060403349e6d6d625cde2f266367f3.png)


### FOIT (Flash of Invisible Text / 无形文本闪烁)

网页在加载网络字体时，因文件尚未下载完毕，浏览器先隐藏文字（不显示文字但保留位置），待下载完成后再显示新字体的现象。它会让内容在短时间内不可读，影响首屏感知和阅读连续性。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/5dccc156b7f356023fd87fd3a980bee6fe89eec0.gif)


### FOUT (Flash of Unstyled Text / 无样式文本闪烁)

网页在加载网络字体时，因文件尚未下载完毕，浏览器先使用系统默认字体显示文字，待下载完成后再切换为新字体，从而导致排版发生短暂跳变或闪烁的现象。它通常比 FOIT 更早显示内容，但需要控制字体指标差异带来的布局移动。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/ae6218213731a64e06096e480e76d782b51450f8.gif)


### Font Fallback (字体回退机制 / 字体栈)

浏览器依次检索备用字体的选择机制。当网页首选字体在设备上不存在或未加载成功时，浏览器会按照 `font-family` 声明的顺序查找后续字体，直到找到可用字形。合理的字体栈可以降低加载失败、缺字和跨平台字形差异带来的风险。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/5e670d93c8d410d3384f3ba4458cb652149686bb.gif)


### Ligature (连字 / 合体字)

将两个或多个相邻字母或符号合并为一个字形显示的技术。它可以消除传统排版中的笔画冲突（如 `fi`），也可以在编程字体中把多字符符号（如 `=>`）显示成一个连续符号。代码和数学表达里要稍微谨慎：看起来更顺，不代表读起来一定更清楚。

![](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/7d137e3abde89abba70d5187d3b1128003b4a6a9.png)


***

**视觉设计篇 roadmap**

*   ~~Typography / 文字排版 ok~~
*   ~~Color system / 色彩系统~~
*   Grid & Layout / 栅格与布局
*   Iconography / 图标系统
*   Spacing & Imagery / 间距与图像
*   Motion & Interaction / 动效与交互
*   合订版

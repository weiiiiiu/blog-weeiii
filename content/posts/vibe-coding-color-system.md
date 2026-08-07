---
title: Vibe Coding 需要知道的设计术语——色彩系统
date: 2026-06-23 12:00:00
categories: 设计
tags:
  - Vibe Coding
  - 设计
description: 主色、语义色、中性色与对比度——让 AI 明白哪些颜色该强调、哪些只做背景。
---

> 本文转载自 linux.do，原作者 **Henry_He**，[点此查看原帖](https://linux.do/t/topic/2454227)。

经常看到朋友和同事在 Vibe Coding 时吐槽 ai 听不懂人话——“高级感”,“眼前一亮”,“再改改”，然后页面越来越乱。很多时候不是 AI 能力不行，更像我们是在用玄学抽卡。

LLM在pre-train和RL都用了海量的代码训练，自然英文术语的语义锚点会强于中文（而且中文语义信息熵太高了），打算长期整理一份术语速查表整理分享出来，方便查阅

---


Color System 处理界面里的颜色分工。哪些颜色用来强调按钮，哪些颜色用来表示警告，哪些颜色只做背景、边框或辅助文字，都需要被安排清楚。颜色选得好，正文更好读，主按钮更明显，错误提示也不会被忽略。



界面里很多东西长得相似：文字、图标、按钮、卡片、表单。颜色可以帮它们拉开关系。比如蓝色按钮告诉用户“这里是主操作”，红色文案提醒“这里有危险”，浅灰背景让内容区不那么拥挤。



这篇文章固定用浅色模式。示意图主要靠颜色本身说明问题，如果跟随深色主题反相，色相、明度和对比度会被改掉，判断就不准了。



## **1. 色彩基础与感知 (Color Basics & Perception)**



### **Hue (色相)**



Hue 是颜色属于哪一类。红、黄、绿、蓝、紫，说的就是色相。设计软件和 CSS 里的 HSL、HSV 会把色相放在一个 0° 到 360° 的圆环上，像在色轮上选方向。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/a7fda5c613e9cf82a58a4237475eef9c2c09273b.png)
</div>



### **Saturation (饱和度)**



Saturation 描述颜色的鲜艳程度。饱和度高，颜色更亮眼；饱和度低，颜色会往灰里走。做界面时，主按钮可以稍微鲜一点，背景和大面积色块通常要收一点，不然会刺眼。



### **Chroma (彩度)**



Chroma 也描述颜色的鲜艳程度，但更常出现在 OKLCH 这类感知色彩模型里。它关注颜色离灰轴有多远。做颜色阶梯时，Chroma 稳定，颜色看起来也更容易成套。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/f389252a73aed86bb97f91dafaae67ad59e16818.png)
</div>


### **Lightness (明度)**



Lightness 描述颜色在调色模型里的明暗。在 HSL 里，0% 接近黑色，100% 接近白色，50% 通常是这个色相最饱满的位置。



### **Luminance (亮度)**



Luminance 更偏人眼实际感到的亮度。同样的数值，不同色相在人眼里不一定一样亮。后面讲对比度时会用到这个概念。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/bdee1d320a04bb5d3e0e04df043f38f26403282d.png)
</div>



### **Alpha (透明通道)**



Alpha 描述颜色的透明通道。Alpha 为 1 时，颜色完全盖住下面的内容；Alpha 降低后，下面的背景、图片或卡片会透出来。



### **Opacity (不透明度)**



Opacity 描述元素整体有多不透明。100% 是完全不透明，0% 是完全透明。它和 Alpha 很接近，但在 CSS 里 `opacity` 会影响整个元素，包括文字、图标和子元素。



设计软件常用灰白棋盘格表示透明背景。弹窗遮罩、悬浮提示、禁用状态和半透明标签，都会用到这种叠加关系。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/fb529808aafec6f908153f28cfa21ec13647561c.png)
</div>



### **Warm Color (暖色)**



Warm Color 是带有温暖联想的颜色。红、橙、黄通常更热、更靠前。这不是物理规则，但在界面里很好用：警告、促销和高能量入口常用暖色。



### **Cool Color (冷色)**



Cool Color 是带有冷静联想的颜色。蓝、青、紫通常更冷、更安静。信息区、背景、数据面板和需要降低刺激感的界面经常用冷色。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/f3a7ba8ad98c8c2a4cb5b84bce219b72f0a0b582.png)
</div>



---



## **2. 色彩表示法与色彩空间 (Color Representation & Color Spaces)**



颜色进了屏幕和代码，就要写成数值。RGB 和 Hex 更像在控制屏幕的红绿蓝通道；HSL 更像平时说“换个色相、再亮一点”；OKLCH 更适合做感知更稳定的颜色调整。



### **RGB (Red, Green, Blue)**



RGB 用红、绿、蓝三个发光通道混出屏幕上的颜色。每个通道通常写成 0 到 255。三个通道都是 0，就是黑色；三个通道都开到最大，就是白色。



### **RGBA (Red, Green, Blue, Alpha)**



RGBA 多了一个 Alpha 通道，用来控制透明度。比如一个半透明黑色遮罩，就是在 RGB 的颜色上再加透明度，让下面的页面还能隐约看见。


<div align="center">

![RGBA](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/6d7ca08d5582d67462ce27afae5c98133325f187.gif)
</div>





### **Hex Code (十六进制颜色码)**



Hex Code 是网页和设计工具里最常见的颜色写法之一。它以 `#` 开头，后面通常是 6 位十六进制数字。每两位控制一个通道：红、绿、蓝。

每个通道从 `00` 到 `FF`，对应十进制的 0 到 255。`#FF5733` 里的 `FF` 是红色通道，`57` 是绿色通道，`33` 是蓝色通道。

> 有时也会看到 8 位 Hex，例如 `#FF573380`。最后两位 `80` 表示 Alpha 透明通道。`FF` 是完全不透明，`00` 是完全透明。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/ebe08ab5e9235ea9bb40542ef484c6f872a06c69.png)
</div>




### **HSL (Hue, Saturation, Lightness)**



HSL 把颜色拆成色相、饱和度和明度。它不像 RGB 那样直接写红绿蓝通道，更接近日常调色的话：换成蓝色、再鲜一点、再暗一点。



### **HSLA (Hue, Saturation, Lightness, Alpha)**



HSLA 是带 Alpha 通道的 HSL，用来控制透明度。它适合在保留 HSL 调色方式的同时，做遮罩、浮层和半透明状态。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/b714bb4564d1bf421bcfd07aef524d5f94bf68e3.png)
</div>



### **OKLCH (Oklab Lightness, Chroma, Hue)**



HSL 的 Lightness 不完全等于人眼感到的亮度。黄色和蓝色都设成 `L = 50%`，黄色通常还是更亮，蓝色更暗。做无障碍对比度、颜色阶梯或自动深色模式时，这个差异会带来麻烦。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/59e887734a20e79b303617ddcefeb45d2d192d3d.png)
</div>



OKLCH 的 L 更接近人眼感到的亮度。调色相或彩度时，只要 L 接近，颜色之间的明暗关系通常更稳。它适合做颜色阶梯、主题切换和需要控制对比度的设计系统。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/5a811d2e641aea4342f15e75055424d16cb8ffd1.png)
</div>



### **Color Gamut (色域)**

色域是设备或色彩系统能显示多少颜色。普通屏幕、广色域屏幕、打印机能表现的范围并不一样。



### **Color Space (色彩空间)**

色彩空间像一张约定好的颜色地图，让设计工具、浏览器和设备知道同一个色值应该怎么解释。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/947a0d61b22464548b28137c2f4323f3d6961703.png)
</div>



### **sRGB (Standard RGB)**



sRGB 是网页和普通屏幕最常见的默认色彩空间。它的范围不算宽，但兼容性最好。界面如果主要面向普通浏览器和普通显示器，使用 sRGB 最稳。



### **Adobe RGB**



Adobe RGB 的色域比 sRGB 宽，尤其能覆盖更多青绿色。它常见于专业摄影和印刷流程，适合需要把屏幕预览和纸张输出对起来的场景。



### **Display P3 (广色域色彩空间)**



Display P3 也是广色域，很多现代手机和电脑屏幕都支持。它比 sRGB 能显示更鲜的红、黄、绿。做面向新设备的图片、插画或品牌视觉时，P3 能带来更亮眼的颜色，但也要注意旧屏幕上的回退。



### **Rec. 2020 (BT.2020)**



Rec. 2020 的色域非常宽，主要面向 4K/8K、HDR 视频和高端放映。现在大多数普通屏幕还不能完整显示它的范围。做网页 UI 时通常不会直接以它为日常目标。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/e563290ddf42d0b9500414cd60cb1737752b5a56.png)
</div>



---



## **3. 色彩架构与调色盘 (Color Architecture & Palettes)**



界面很少只靠一个颜色。通常需要一组颜色一起工作：主色负责主要操作，语义色负责成功和错误，中性色负责背景、边框和次要文字。



### **Palette (调色盘 / 色板)**



Palette 是一个项目允许使用的一组颜色。它能避免每个页面都自己挑蓝色，也方便团队说清楚“这个蓝色”到底是哪一个。



### **Color Scale (色阶)**



Color Scale 是把一个基础色做成一串深浅不同的阶梯。浅色可以做背景，稍深一点可以做边框，基础色可以做按钮，再深的颜色可以做 hover 或深色文字。Tailwind CSS、Material Design 这类系统常用 50 到 900 命名色阶。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/4c8494f77fdead1443d048155b42a84910ae42b1.png)
</div>



### **Tint (加白)**



Tint 是给颜色加白。颜色会变浅，也会更柔和，常用来做浅背景、提示底色或轻量标签。



### **Shade (加黑)**



Shade 是给颜色加黑。颜色会变暗、变重，常用来做深色文字、按下状态或深色背景。



### **Tone (加灰)**



Tone 是给颜色加灰。颜色会没那么鲜，适合大面积背景、插画配色或需要安静一点的界面。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/d739fccded2adc7e397dcfd0d7b673f3d93ca963.png)
</div>



### **Primary Color (主色 / 品牌色)**



Primary Color 是产品最常用、最容易被记住的颜色。它通常出现在主按钮、当前选中项、重点链接和品牌区域。



### **Secondary Color (辅助色)**



Secondary Color 用来补充主色。它通常出现在次级按钮、辅助入口和品牌延展区域，不能和主色抢同一个层级。



### **Accent Color (强调色)**



Accent Color 用来制造局部强调。它通常只小面积出现，比如促销标签、VIP 徽章、通知圆点或特殊高亮。用多了会抢主色的注意力。



### **Semantic Color (语义色)**



Semantic Color 是带含义的状态颜色。绿色常表示成功，红色常表示危险或错误，黄色常表示警告。它们适合系统反馈，但最好配合文字或图标一起用。



### **Status Color (状态色)**



Status Color 是用来表达当前状态的颜色。成功、错误、警告、信息、禁用都可以有对应状态色。它和 Semantic Color 很接近，但更强调组件或对象当前处于什么状态。



### **Foreground Color (前景色)**



Foreground 是前景色，通常是文字、图标和边框。前景色要和背景保持足够对比，否则内容会难读。



### **Background Color (背景色)**



Background 是背景色，是文字、图标、按钮和卡片下面的底。背景色会影响整体明暗，也会影响前景内容的可读性。



### **Neutral Color (中性色 / 无彩色)**



Neutral Color 是黑、白、灰这一组颜色，有时会带一点冷暖倾向。它们负责界面里最普通但最常见的部分：正文、次要文字、分割线、边框、禁用状态和背景。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/b93cfa7e0b2edef66336ef99dc985366ee46bfb9.png)
</div>



---



## **4. 色彩工程与 Tokens (Color Engineering & Tokens)**



颜色进入设计系统后，不能只写一个色值。团队需要知道这个颜色叫什么、用在哪里、换主题时应该变成什么。否则组件里到处写死 `#3B82F6`，以后改品牌色或做深色模式会很痛苦。



### **Design Tokens (设计令牌)**



Design Tokens 是把设计决策存成变量。颜色、间距、字体、圆角都可以做成 token。颜色 token 的好处是：设计稿和代码可以用同一套名字，而不是互相猜色值。



### **CSS Custom Properties (CSS Variables)**



CSS Custom Properties 是 CSS 里的变量，例如 `--color-primary`。它们可以被复用，也可以被主题覆盖。网页里的颜色 token 通常会落到这些变量上。



### **Primitive Token (原始令牌)**



Primitive token 保存具体颜色，比如 `blue-500`。它更像颜色材料库，描述颜色客观上是什么。



### **Semantic Token (语义令牌)**



Semantic token 保存用途，比如 `text-primary`、`danger-bg`、`button-primary-bg`。组件最好使用 semantic token，这样换主题时只改映射，不必改每个组件。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/ede19632ea6dbfd1247cbad9badd260c9bd39793.png)
</div>



### **Theming (主题化)**



Theming 是让界面切换不同外观。切换主题时，组件结构不变，变的是 semantic token 指向哪一组 primitive。比如 `text-primary` 在浅色模式里指向深灰，在深色模式里指向浅灰。



### **Light Mode (浅色模式)**



浅色模式通常是浅底深字，接近纸张阅读。它适合明亮环境，也更接近大多数网页的默认外观。



### **Dark Mode (深色模式)**



深色模式通常是深底浅字，能降低整体亮度，适合低光环境。OLED 屏幕上也可能更省电。

> 深色模式不能简单把浅色模式反相。深色背景会改变颜色的观感，主色和强调色往往要重新调明度和饱和度，才不会发闷或刺眼。

<div align="center">

![theme](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/be3f64ac7a1c0ae42ddf10be1493cb6d3b828638.gif)
</div>




---



## **5. 无障碍与可读性 (Accessibility & Readability)**



颜色要先能看见，才谈得上传递信息。文字和背景的对比够不够、色弱用户能不能分清状态、系统高对比模式会不会覆盖样式，都会影响真实可用性。



### **Relative Luminance (相对亮度)**



相对亮度描述的是颜色在人眼看来有多亮。人眼对不同颜色的敏感度不一样：绿色更亮，红色次之，蓝色更暗。



下面这个 sRGB 公式把这种差异写进了计算里：


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/a91eacfc52454b5c35d4adde9214378c2ade8dfc.png)
</div>



### **Contrast Ratio (对比度)**



对比度是前景色和背景色之间的亮度差。白底白字是 1:1，基本看不见；黑底白字最高可以到 21:1。



### **WCAG 标准**



WCAG 是常用的网页无障碍标准。它对文本对比度有明确要求：

* AA 级（标准）：普通文本对比度不低于 4.5:1，大号文本（18pt 以上）不低于 3:1。
* AAA 级（高级）：普通文本对比度不低于 7:1，大号文本不低于 4.5:1。

<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/590d9748f8e7a073a527793e818fe909b2ed8068.png)
</div>



### **Color Blindness (色盲模式适配)**



色盲和色弱用户可能分不清某些色相，比如红色和绿色。界面状态不能只靠颜色表达。错误提示最好同时有文字、图标或形状差异。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/89ff22ede3f0d43ee2f98f94e7d8cf901000821c.png)
</div>



### **Forced Colors / High Contrast Mode (强制色 / 高对比模式)**



Windows 高对比度模式和一些辅助工具会覆盖网页原来的颜色，让页面使用系统指定的高反差主题。



在这种模式下，阴影、渐变底色和装饰色可能会被浏览器忽略或替换。按钮、链接和边框会更依赖系统颜色。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/6de085cfdc3a716ce5a45c26d2f74016e2c16199.png)
</div>



---



## **6. 图形渲染与视觉效果 (Rendering & Visual Effects)**



颜色最后会变成屏幕上的像素，也会和其他图层混在一起。渐变、透明叠加和混合模式看起来像视觉效果，背后都是颜色计算。



### **Gradient (渐变色)**



Gradient 是让两种或多种颜色平滑过渡。浏览器或设计软件会计算起点和终点之间的中间颜色，所以你看到的是连续变化，而不是一格一格跳色。



最常见的是线性渐变和径向渐变。线性渐变沿一个方向变化，径向渐变从中心向外扩散。

<div align="center">

![Gradient](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/fd2de5ea1cf99e6267674bca7b5a9e34fa4c85ac.gif)
</div>


### **Blending Mode (混合模式)**



Blending Mode 决定上层颜色和下层颜色怎么混。Photoshop 里的正片叠底、滤色，CSS 里的 `mix-blend-mode`，都是这类规则。不同模式会用不同算法，重新算出交界处的颜色。


<div align="center">

![image](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/vibe-coding/a389895e7f00b61cf3b97a5427de866c4f0363b9.png)
</div>


---




**视觉设计篇 roadmap**

* ~~Typography / 文字排版~~ /posts/vibe-coding-typography
* ~~Color system / 色彩系统~~
* ~~Grid & Layout / 栅格与布局~~
* Iconography / 图标系统
* Spacing & Imagery / 间距与图像
* Motion & Interaction / 动效与交互
* 合订版

---
title: AI 辅助 UI 设计的参考拆解与可编辑交付
date: 2026-11-21T08:17:05-08:00
categories: 开发
tags:
  - UI设计
  - AI
  - Figma
  - CSS
  - 学习笔记
description: 把参考图拆成可执行的设计规则，用分阶段提示词、设计变量、响应式卡片与 Figma 图层示例，说明如何从效果图走向可维护的界面。
draft: false
---

> 原文链接：[同样用AI做UI，设计师和程序员的差距出来了](https://mp.weixin.qq.com/s/7-5Zv9w3x_AorQPdC8Qp0g)

原文展示了一条设计流程：先选择视觉参考，再让 AI 迭代界面方向，之后转到 Figma 整理可编辑稿，并手动修正图标等细节。可借鉴的部分，是把“选择方向、评价结果、修正局部”放在人控制的循环里。

把这个流程用到开发中，需要进一步回答：参考图到底提供了哪些规则，如何限制一次修改的范围，图片转成图层后算不算真正可编辑，以及最终怎样适配不同屏幕。下面以一个移动端工具箱首页为练习场景，把这些问题落实为参数、代码与验收操作。

## 先规定用户要完成的任务

“年轻、有科技感”描述的是感受，不能直接决定首页结构。工具箱首页的主要任务可以是：用户快速找到图片压缩或格式转换，判断功能是否适用，然后进入工具。

因此，布局应该先保证入口标题清楚、说明可读、常用功能容易找到。渐变、圆角和插画用于辅助识别，不能把最重要的入口挤到首屏之外。视觉方向与信息结构要分别确定，再结合起来。

一个可交给 AI 的任务说明可以这样写：

```text
设计对象：移动端工具箱首页，先按 375 CSS 像素宽度讨论。
主要任务：找到图片压缩或格式转换，并进入对应工具。
必须保留：产品名、简短介绍、常用工具入口、每个工具的一句说明。
内容优先级：工具入口 > 使用说明 > 装饰。
视觉方向：轻量、清晰、偏蓝紫；只在页头使用低对比渐变。
约束：正文使用真实文字，图标保持一种风格，卡片高度随内容增长。
先输出信息结构与两种布局方案，暂时不要生成装饰插画。
```

这里的 `375` 是一个观察视口，不是所有设备的永久宽度。`375 × 812` 的画板可以帮助比较首屏，但页面内容超过 812 时应允许滚动，不应为了装进截图就压缩字号和点击区域。

原文把差异归因于设计经验。落到可操作的方法上，更有用的理解是：谁能给出明确约束，并从输出中发现具体问题，谁就更容易得到稳定的结果；职业标签本身不会替人完成这一步。

## 从参考图提取规则而非整页照搬

同一张参考图可以拆成不同维度。每个维度都应回答“观察到了什么、准备保留什么、在当前产品里如何验证”。不要只截一张图，然后要求模型无限接近。

| 维度 | 可以观察的关系 | 转成工具箱的规则 |
| --- | --- | --- |
| 信息层级 | 标题、主要动作、说明谁先被看到 | 工具名高于说明，装饰色不抢标题 |
| 色彩角色 | 背景、内容面、主动作如何区分 | 页面浅底、白卡片、实色主动作 |
| 空间关系 | 卡片内距、模块间距、左右边距 | 用一组间距变量控制，不逐块猜值 |
| 形状与图标 | 圆角、描边、填充、透视是否一致 | 相同尺寸图标框，相同线条粗细 |
| 材质与装饰 | 阴影、渐变、透明效果在哪里出现 | 渐变集中在页头，正文留在稳定底色上 |

参考图适合提供方向，按钮大小和正文对比度则需要结合当前内容重新判断。一个用于展示概念的漂亮封面，不一定适合容纳大量工具名称。

选定方向后，可以用另一张图专门讨论图标，但要给它限定职责。比如“只借鉴图标的单色描边和几何简化，不改变现有卡片布局”。如果每一轮都引入不同的整页风格，最后容易得到互不协调的拼接结果。

## 把迭代做成可以比较的流程

![AI UI 设计流程图，从任务约束、参考拆解、布局和变量到可编辑重建与不同视口验收](/imgs/learning-notes/ai-ui-design-flow.svg)

[查看大图](/imgs/learning-notes/ai-ui-design-flow.svg) · [Mermaid 源码](/diagrams/learning-notes/ai-ui-design-flow.mmd)

一个有效的迭代顺序是先确定内容与层级，再确定布局，之后细化字体、颜色和图标，最后处理状态与响应式。前一层还没确定时就精修投影，后面改布局会让很多工作重做。

每一轮提示词可以包含四部分：保留项、问题、修改范围、验收条件。比如：

```text
保留：当前蓝紫页头、产品名位置、两列工具入口。
问题：卡片说明过浅；图标颜色太多；长标题挤压说明。
本轮修改：只调整卡片内部的字号、行高、图标颜色和内边距。
约束：不要新增功能，不改变导航，不重画页头。
验收：标题两行时不卡住说明；320 和 375 宽度都无横向滚动；
      正文与实际背景对比度至少 4.5:1。
先说明修改的变量，再给出结果。
```

“更高级”没有告诉模型哪个结果可以接受。上面的条件则能逐一检查：标题是否换行、卡片是否长高、颜色是否满足对比度、界面有没有超出边界。

保留每轮的截图和变量改动即可，不必把所有尝试都混进最后的设计稿。如果某轮修好了图标却破坏了布局，应只接纳图标变化，或者回到上一版重做这一步。

## 用设计变量连接视觉稿与代码

设计变量把颜色、间距、圆角等重复决策命名。语义名称比单纯的色号更有用：`--text-muted` 表示次级文字，`--surface` 表示内容表面，切换主题或调整品牌色时才知道哪些位置应一起变化。

下面这套数值是工具箱练习的起点，不是从原文图片精确采样的结果：

| 角色 | 示例值 | 用法 |
| --- | --- | --- |
| 页面背景 | `#f6f7fc` | 衬托内容区 |
| 内容表面 | `#ffffff` | 让文字拥有稳定背景 |
| 主要文字 | `#17203d` | 标题与正文 |
| 次级文字 | `#59647c` | 简短说明，不承担禁用态 |
| 主动作 | `#4f46e5` | 少量强调、按钮或焦点相关元素 |
| 页面边距 | `20px` | 与视口边缘保持距离 |
| 卡片间距与内距 | `12px`、`16px` | 分别控制组件之间与内部的空间 |
| 卡片圆角 | `16px` | 同类入口统一形状 |

普通文字采用至少 `4.5:1` 的对比度目标；大号文字的 WCAG 门槛为 `3:1`，其中“大号”有明确的字号和字重条件，不能只凭视觉感觉认定。白色卡片上的次级文字，与渐变背景上的同一种文字，需要分别检查实际背景。[WCAG 文字对比度](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

以下 CSS 可以保存为 `toolbox.css`，与下一节 HTML 一起打开。它只用系统字体，不依赖外部图片或组件库。

```css
:root {
  --page: #f6f7fc;
  --surface: #ffffff;
  --text: #17203d;
  --text-muted: #59647c;
  --brand: #4f46e5;
  --border: #e1e5f1;
  --focus: #312e81;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --radius: 16px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--page);
  color: var(--text);
  font: 16px/1.5 system-ui, -apple-system, "PingFang SC", sans-serif;
}
.toolbox {
  width: 100%;
  max-width: 720px;
  margin-inline: auto;
  padding: var(--space-5);
}
.hero {
  padding: var(--space-6);
  border-radius: var(--radius);
  background: linear-gradient(120deg, #e8edff, #f2eaff);
}
h1 { margin: 0; font-size: 28px; line-height: 1.3; }
h2 { margin: var(--space-6) 0 var(--space-3); font-size: 20px; }
.hero p { margin: var(--space-2) 0 0; color: var(--text-muted); }
.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}
.tool-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
  min-height: 148px;
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  text-decoration: none;
  overflow-wrap: anywhere;
}
.tool-card:hover { border-color: var(--brand); }
.tool-card:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 3px;
}
.tool-card strong { font-size: 18px; line-height: 1.4; }
.tool-description { font-size: 14px; color: var(--text-muted); }
.tool-icon {
  width: 24px;
  height: 24px;
  flex: none;
  fill: none;
  stroke: var(--brand);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
@media (max-width: 340px) {
  .tool-grid { grid-template-columns: minmax(0, 1fr); }
}
```

`minmax(0, 1fr)` 允许网格列收缩，`min-width: 0` 防止内容撑开卡片，`overflow-wrap` 给特别长的连续字符提供断行机会。这三个条件解决的是不同层级的宽度问题。

以 375 像素宽度计算，减去两侧各 20 的边距和中间 12 的间隔，每列宽度为 `(375 - 40 - 12) / 2 = 161.5px`。当视口变成 320 时，示例改为一列；不是把所有字号按比例缩小。卡片只有最小高度，长内容可以继续撑高。

## 一个可检查的工具入口示例

将下面内容保存为 `index.html`，与 CSS 放在同一目录。`/tools/compress` 和 `/tools/convert` 是待接入的业务路由，这份示例负责入口展示，不包含压缩或转换算法。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>轻工具箱</title>
  <link rel="stylesheet" href="./toolbox.css">
</head>
<body>
  <main class="toolbox">
    <header class="hero">
      <h1>轻工具箱</h1>
      <p>让常用的小事，少花一点时间。</p>
    </header>
    <section aria-labelledby="tools-title">
      <h2 id="tools-title">常用工具</h2>
      <div class="tool-grid">
        <a class="tool-card" href="/tools/compress">
          <svg class="tool-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3"></rect>
            <path d="M3 16l5-5 4 4 3-3 6 6"></path>
            <circle cx="16" cy="8" r="1.5"></circle>
          </svg>
          <strong>图片压缩</strong>
          <span class="tool-description">调整图片体积，方便上传与分享。</span>
        </a>
        <a class="tool-card" href="/tools/convert">
          <svg class="tool-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h15l-4-4M20 17H5l4 4"></path>
          </svg>
          <strong>格式转换</strong>
          <span class="tool-description">在常用图片格式之间转换。</span>
        </a>
      </div>
    </section>
  </main>
</body>
</html>
```

整个卡片使用链接，因为它执行导航；如果行为是立即开始转换，则应使用按钮并实现对应状态。不要为了方便布局把所有交互都写成带点击监听的 `div`。

图标是装饰性的，工具名称已经表达了功能，所以用 `aria-hidden="true"` 避免重复朗读。描边图标使用 SVG 可以保持统一尺寸、颜色和清晰度；如果使用 AI 生成的 PNG 插画，应明确它是图片资产，不把它误称为可改路径的矢量图标。

颜色和图标不是全部状态。真正的工具页还需要上传中、处理中、失败和成功状态；首页在没有常用记录时也要有合理的空状态。先列清这些状态，再让 AI 逐个扩展，能减少只做一张理想截图的问题。

## Figma 可编辑稿需要真实的结构

把 JPG 拖进 Figma 后，可以移动、裁剪和缩放它，但图片内部的标题、按钮和图标仍然是像素。将整张图矢量化，可能得到很多路径，也不等于获得了能改文案、自动排版的组件。

真正的重建至少包含文字节点、容器关系、尺寸规则和复用组件。AI 工具能否直接写入文件，取决于它所连接的编辑能力以及对目标文件的权限；单独提供一个文件链接，并不会自动赋予所有工具写入能力。即便成功生成图层，仍要检查这些结构。[Figma Auto Layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout-in-Figma)、[Figma 组件](https://help.figma.com/hc/en-us/articles/360038662654-Guide-to-components-in-Figma)

![Figma 可编辑结构示意图，页面包含自动布局容器和工具卡片实例，卡片内部保留图标、标题与说明节点](/imgs/learning-notes/ai-ui-editable-layers.svg)

[查看大图](/imgs/learning-notes/ai-ui-editable-layers.svg) · [Mermaid 源码](/diagrams/learning-notes/ai-ui-editable-layers.mmd)

| 层级 | 应采用的结构 | 怎样验证 |
| --- | --- | --- |
| 页面 | Frame，明确观察尺寸与滚动区域 | 改成另一种宽度，检查内容边界 |
| 模块 | Auto Layout，声明方向、内距和间距 | 删除一项，后面的内容自动补位 |
| 卡片 | 主组件与实例 | 修改主组件圆角，实例同步变化 |
| 文案 | Text，正确的字体与换行规则 | 换成长文案，容器能够增长 |
| 图标 | 矢量或明确标注的图片资产 | 检查是否能改描边，或需要更换原图 |
| 状态 | 适合业务的变体与属性 | 切换状态不需要手动移动十几个图层 |

Figma 的 Hug 对应内容驱动的尺寸，Fill 对应填满父级可分配的空间，Fixed 对应明确约束的尺寸。它们和 CSS 的概念可以互相解释，但不能逐个词机械转换。比如父容器采用水平还是垂直布局，会改变 Fill 在子节点上的意义。

对工具卡片，一个容易维护的结构是：卡片宽度由外部布局决定，高度随内容增长；图标固定尺寸；标题和说明填满卡片内部宽度，并根据文案增加高度。把所有节点都绝对定位到截图坐标，短文案可能很像原图，换几个字就会失效。

## 用 Plugin API 说明结构化重建

下面是 Figma Design 插件主线程的 TypeScript 示例。它从明确参数创建一个两列卡片组件，而不是识别或转换 JPG；也不能放进普通网页控制台运行。代码需要在已有插件工程中编译，并在具有编辑权限的设计文件中执行。

示例使用 Inter 演示英文文案。中文交付时应选择文件中可用、覆盖相应汉字的字体，并重新检查换行。加载字体失败会停止执行，不应静默生成缺字稿。[文字与字体加载](https://developers.figma.com/docs/plugins/working-with-text/)

```typescript
async function createToolCards() {
  const regular: FontName = { family: 'Inter', style: 'Regular' };
  const bold: FontName = { family: 'Inter', style: 'Bold' };
  await Promise.all([figma.loadFontAsync(regular), figma.loadFontAsync(bold)]);

  const rgb = (hex: string): RGB => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255
  });
  const paint = (hex: string): SolidPaint => ({ type: 'SOLID', color: rgb(hex) });

  const main = figma.createComponent();
  main.name = 'ToolCard';
  main.layoutMode = 'VERTICAL';
  main.resize(161.5, 148);
  main.layoutSizingHorizontal = 'FIXED';
  main.layoutSizingVertical = 'HUG';
  main.minHeight = 148;
  main.paddingTop = main.paddingBottom = 16;
  main.paddingLeft = main.paddingRight = 16;
  main.itemSpacing = 8;
  main.cornerRadius = 16;
  main.fills = [paint('#ffffff')];
  main.strokes = [paint('#e1e5f1')];
  main.strokeWeight = 1;
  main.strokeAlign = 'INSIDE';

  function label(name: string, value: string, font: FontName, size: number, color: string) {
    const node = figma.createText();
    node.name = name;
    node.fontName = font;
    node.fontSize = size;
    node.lineHeight = { unit: 'PERCENT', value: 150 };
    node.characters = value;
    node.fills = [paint(color)];
    main.appendChild(node);
    // 先加入 Auto Layout 父级，再设置 Fill。
    node.layoutSizingHorizontal = 'FILL';
    node.textAutoResize = 'HEIGHT';
    return node;
  }
  label('Title', 'Compress image', bold, 18, '#17203d');
  label('Description', 'Make images smaller for uploading.', regular, 14, '#59647c');

  const row = figma.createFrame();
  row.name = 'ToolRow';
  row.layoutMode = 'HORIZONTAL';
  row.resize(335, 148);
  row.layoutSizingHorizontal = 'FIXED';
  row.layoutSizingVertical = 'HUG';
  row.itemSpacing = 12;
  row.fills = [];
  for (const [title, description] of [
    ['Compress image', 'Make images smaller for uploading.'],
    ['Convert format', 'Choose a different image format.']
  ]) {
    const instance = main.createInstance();
    row.appendChild(instance);
    instance.layoutSizingHorizontal = 'FILL';
    const titleNode = instance.findOne(n => n.name === 'Title' && n.type === 'TEXT');
    const descriptionNode = instance.findOne(n => n.name === 'Description' && n.type === 'TEXT');
    if (titleNode?.type === 'TEXT') titleNode.characters = title;
    if (descriptionNode?.type === 'TEXT') descriptionNode.characters = description;
  }
  main.x = row.x + row.width + 80;
  figma.currentPage.selection = [row];
  figma.viewport.scrollAndZoomIntoView([row]);
}

createToolCards()
  .then(() => figma.closePlugin('已创建卡片组件与实例'))
  .catch(error => figma.closePlugin(String(error)));
```

这段代码保留了可编辑文字、Auto Layout、主组件与实例关系。它省略了页头和图标，也没有把所有颜色绑定成 Figma Variables；要交付完整设计系统，还需补齐这些内容。对象上的数值与共享变量是两个层级，写了同样的色号不代表已经建立统一变量绑定。

源码类型可使用 `@figma/plugin-typings` 检查。类型正确只说明 API 使用符合声明，不能保证实际字体、换行、图标和视觉比例都符合需求。运行后应改长标题、缩窄容器、修改主组件，再观察实例是否按预期变化。[Plugin API 类型](https://github.com/figma/plugin-typings)、[TextNode](https://developers.figma.com/docs/plugins/api/TextNode/)

## 用操作结果判断是否可以交付

最后的验收应该覆盖视觉、结构和交互，不能只比较一张静态截图。

| 验收操作 | 通过条件 | 暴露的问题 |
| --- | --- | --- |
| 把短标题改成长标题 | 换行合理，说明不被覆盖 | 固定高度、绝对坐标依赖 |
| 从 375 改到 320、430 宽度 | 没有横向滚动，布局按规则变化 | 只为一张画板做设计 |
| 将网页文字放大到 200% | 主要内容仍能阅读和操作 | 容器裁剪、文字溢出 |
| 使用键盘 Tab 遍历入口 | 焦点顺序合理且可见 | 只处理鼠标悬停 |
| 修改主组件样式 | 实例同步更新，文案覆盖仍保留 | 复制粘贴图层冒充组件 |
| 改页面主色 | 相关元素通过变量统一变化 | 到处散落的硬编码色号 |
| 检查空、忙碌和失败状态 | 有清晰信息与下一步动作 | 只有理想状态的效果图 |
| 检查普通文字对比度 | 与实际背景达到约定目标 | 浅色说明、渐变上的低对比文字 |

交付包至少应说明布局规则、字体和颜色、组件及状态、资产格式、目标路由与验收视口。AI 可以帮助生成候选界面，也可以按这些结构创建节点和代码；人需要持续判断输出是否符合用户任务。

练习时可以先完成上面的两张卡片：修改长文案、调整主题色、切换屏幕宽度、检查 Figma 实例联动。能够稳定承受这些变化，比只在最初截图里看起来漂亮，更接近一个可以继续开发的界面。

---
title: Glisse 液态玻璃组件的渲染原理与 React 实践
date: 2026-11-21T07:50:36-08:00
categories: 开发
tags:
  - React
  - CSS
  - SVG
  - WebGL
  - 学习笔记
description: 从 Glisse 0.6.0 源码拆解背景采样、位移、色散、磨砂与交互动画，配渲染流程图、Switch 时序图和可运行的 React 示例。
draft: false
---

> 原文链接：[React 组件库，目标是在网页端高保真复刻苹果全新的 Liquid Glass（液体玻璃）UI 材质效果](https://mp.weixin.qq.com/s/jS2XSrMKchUL8QjuXsyWJA)

Glisse 把玻璃材质与按钮、开关、滑块等交互封装成 React 组件。理解它时，可以把画面拆成几层：背景内容提供可以被观察的图像，位移改变采样位置，色散使颜色通道稍微分开，磨砂柔化细节，边缘高光帮助人辨认玻璃轮廓。

原文介绍的是 0.5.0。下面以 **Glisse 0.6.0** 为范围，这个版本新增的背景处理路径也会影响兼容性判断。组件要求 React 和 React DOM 18 或以上；示例固定版本，方便复现。[官方项目](https://github.com/0kzh/glisse)、[版本元数据](https://registry.npmjs.org/glisse/0.6.0)

## 把玻璃效果拆成不同的绘制任务

| 观察到的效果 | 对应任务 | 不应混淆的地方 |
| --- | --- | --- |
| 背景仍可见但不清晰 | 模糊、透明填色、饱和度调整 | 模糊不会自动让背景线条弯曲 |
| 背景边缘看起来被拉扯 | 按位移场重新采样背景 | 需要有可采样的内容与正确的相对位置 |
| 边缘出现细小彩边 | 颜色通道使用略有区别的位移 | 强度过大容易变成明显的重影 |
| 轮廓沿某些方向发亮 | 绘制边缘光照或高光图 | 不等于模拟了完整的三维光线路径 |
| 按住时抬起、松手时回弹 | 指针事件驱动几何与弹簧动画 | 业务开关值和每帧视觉位置是两组状态 |

`backdrop-filter` 本身既能接收 `blur()` 等函数，也允许引用 SVG 滤镜。Glisse 的部分路径正是把 SVG 位移与 `backdrop-filter` 组合起来。因此，准确的区别是“仅用模糊不够”，而不是“它完全不使用 backdrop-filter”。[backdrop-filter 说明](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)

材质是一种网页中的视觉近似。纯色背景没有足够的纹理可供观察，折射强度再大也可能不明显；可以先放几条高对比线、文字或色块，再调整参数。

## 先看清 0.6.0 的渲染分支

![Glisse 渲染流程图，区分标记背景、WebKit WebGL 路径、SVG 内容滤镜和未标记背景的降级方式](/imgs/learning-notes/glisse-rendering-paths.svg)

[查看大图](/imgs/learning-notes/glisse-rendering-paths.svg) · [Mermaid 源码](/diagrams/learning-notes/glisse-rendering-paths.mmd)

`Glass` 组件生成带有 `lg-glass` 类名的 DOM 元素，并调用 `useRefraction`。挂载后，逻辑查找与玻璃相交的 `data-glisse-backdrop` 元素，再选择绘制路径。[Glass 入口](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/src/glass.tsx)、[背景选择与分支](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/src/internal/refraction.ts)

| 条件 | 该版本的处理方式 | 使用时的含义 |
| --- | --- | --- |
| 找到标记背景，命中 WebKit 路径且 WebGL 2 可用 | 把支持的背景内容绘制成纹理，再绘制弯曲的玻璃边缘 | 背景内容种类和图片跨域条件会影响结果 |
| 找到标记背景，未走上述绘制路径 | 对背景内容应用 SVG 透镜滤镜，并更新透镜位置 | 不依赖对任意实时背景直接应用 SVG 滤镜 |
| 没有标记背景，命中 Chromium 路径 | 使用 SVG 滤镜处理实时背景 | 与浏览器的背景滤镜实现有关 |
| 没有标记背景，未命中 Chromium 路径 | 保留磨砂、填色和边缘高光 | 不保证背景也发生折射 |

这里描述的是库的实现分支，源码有基于 User-Agent 的判断，不能当作整个浏览器平台永久不变的能力表。验收时应记录具体浏览器、引擎和设备，而不是只写“支持现代浏览器”。

背景标记的位置也很关键。该版本会排除与玻璃存在祖先、后代关系的候选元素，并要求可见区域相交。可采用共同容器中的兄弟结构：

```tsx
<div className="stage">
  <div data-glisse-backdrop className="scene">背景内容</div>
  <Glass className="panel">前景内容</Glass>
</div>
```

如果把 `data-glisse-backdrop` 直接加在包住 `Glass` 的外层容器上，它不会按这个选择规则成为该玻璃的背景。多个标记背景重叠时也应保持结构明确，不依赖复杂层叠关系碰巧选中正确对象。

## 位移贴图怎样让直线变弯

SVG 的 `feDisplacementMap` 使用第二张图像中的通道值，决定从第一张图像的哪个位置读取像素。可以把它理解成一个“采样坐标偏移器”：

```text
sampleX = x + scale × (mapX - 0.5)
sampleY = y + scale × (mapY - 0.5)
output(x, y) = input(sampleX, sampleY)
```

`mapX` 和 `mapY` 是选择通道的归一化值。值为 0.5 时不偏移；若 `scale = 20`、`mapX = 0.75`，输出位置会从横向偏移 5 个单位的位置采样。这里描述的是“输出去哪里取值”，不能直接理解成“原像素向右移动了 5”。[feDisplacementMap 定义](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap)

玻璃不能只用随机噪声作为位移图，否则更像水波。Glisse 根据元素宽、高、圆角和边缘带的形状建立位移场：中部相对平稳，边缘发生更明显的弯曲。通用玻璃路径的边缘带宽度按短边比例计算，并设有最大值；材质参数改变的是这套模型中的量，不是任意同名参数都能在不同玻璃库之间直接通用。[透镜形状与位移场](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/src/internal/lens.ts)

为了模拟色散，可以对红、绿、蓝通道使用略有差异的采样距离，再合成输出。Glisse 0.6.0 的 WebGL 绘制路径按不同系数采样三种颜色，随后进行柔化和颜色合成；SVG 路径使用相应的滤镜操作。它们目标相近，但实现与限制不同。[WebGL 采样与合成](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/src/internal/drawn.ts)

还要区分两类容易都被叫作“Canvas 的东西”：生成位移贴图时可以使用 Canvas 编码图像；WebKit 绘制分支则还会把背景内容画到纹理，并通过 WebGL 着色器生成弯曲画面。两者处理的数据和工作量不同。

## 一个可以调整参数的 React 示例

在已有 React 项目中安装固定版本：

```bash
npm install glisse@0.6.0
```

新建 `GlassLab.tsx`。自定义属性通过扩展 `CSSProperties` 声明，避免 TypeScript 把它们当成未知的普通 CSS 属性。背景与玻璃是兄弟节点，控件放在演示区域外，便于分别观察材质和交互：

```tsx
import { useState, type CSSProperties } from "react";
import { Glass, Slider, Switch } from "glisse";
import "./glass-lab.css";

type GlassStyle = CSSProperties & {
  "--lg-glass-bend": number;
  "--lg-glass-dispersion": number;
  "--lg-blur": string;
  "--lg-rim-shine": number;
};

export default function GlassLab() {
  const [enabled, setEnabled] = useState(true);
  const [bend, setBend] = useState(0.45);
  const material: GlassStyle = {
    "--lg-glass-bend": enabled ? bend : 0,
    "--lg-glass-dispersion": 0.4,
    "--lg-blur": "0px",
    "--lg-rim-shine": 0.13
  };

  return (
    <section className="glass-lab">
      <div className="lab-stage">
        <div className="lab-scene" data-glisse-backdrop aria-hidden="true">
          <span className="lab-word">Aa 0123</span>
          <span className="lab-stripe" />
        </div>
        <Glass className="lab-panel" style={material}>
          <h2>Liquid Glass</h2>
          <p>观察边缘处的背景变化</p>
        </Glass>
      </div>
      <div className="lab-controls">
        <label className="lab-toggle">
          <span>启用背景弯曲</span>
          <Switch aria-label="启用背景弯曲"
                  checked={enabled} onCheckedChange={setEnabled} />
        </label>
        <p>弯曲强度 {bend.toFixed(2)}</p>
        <Slider aria-label="弯曲强度" min={0} max={1} step={0.05}
                value={bend} onValueChange={setBend} />
      </div>
    </section>
  );
}
```

同目录的 `glass-lab.css`：

```css
.glass-lab { max-width: 640px; margin: 24px auto; color: #162332; }
.lab-stage {
  position: relative;
  height: 260px;
}
.lab-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(120deg, #a5d8ff, #ffc9de);
}
.lab-word {
  position: absolute;
  left: 24px;
  top: 60px;
  font: 700 72px/1.2 sans-serif;
  color: #264e75;
}
.lab-stripe {
  position: absolute;
  left: 0;
  right: 0;
  top: 180px;
  height: 8px;
  background: #fff;
}
.lab-panel {
  position: absolute;
  left: 50%;
  top: 48px;
  transform: translateX(-50%);
  width: 220px;
  height: 156px;
  box-sizing: border-box;
  border-radius: 32px;
  padding: 24px;
}
.lab-panel h2 { margin: 0 0 12px; font-size: 21px; }
.lab-panel p { margin: 0; font-size: 14px; }
.lab-controls { padding: 20px 8px; }
.lab-toggle { display: flex; align-items: center; gap: 16px; }
```

把 `<GlassLab />` 挂到应用后，先把弯曲强度从 0 调到 0.45，观察背景文字和白线在边缘处的变化。关闭开关只把弯曲强度设为 0，不等于把磨砂、填色、高光和全部材质逻辑一起关闭。

组件包导入时会向文档插入一份样式。若采用 SSR 或 SSG，并希望初始 HTML 就带上基础样式，可以在构建系统中显式导入包导出的 `glisse/styles.css`；运行时测量与折射初始化仍发生在客户端。严格 CSP 项目还应检查动态样式、数据图像等实际用法是否符合策略。[样式入口](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/src/internal/styles.ts)、[包导出](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/package.json)

## 参数分别控制什么

| 参数 | 作用 | 调试方法 |
| --- | --- | --- |
| `--lg-glass-bend` | 通用玻璃的位移强度参数 | 从 0 开始增大，用直线观察弯曲 |
| `--lg-glass-dispersion` | 颜色通道分离程度 | 先设为 0，再逐步增加，检查是否出现过强重影 |
| `--lg-blur` | 磨砂模糊长度 | 写带单位的值，例如 `0px` 或 `3px` |
| `--lg-rim-shine` | 边缘高光强度 | 在浅、深背景上分别观察轮廓与对比度 |

这些值不能直接解释成像素位移，也不是材料的完整物理参数。例如在该版本通用玻璃模型中，位移范围与边缘带宽度有关，改变元素尺寸会改变效果。示例中的 0.45、0.4、0.13 是一组演示设置，不是所有场景的最佳值。

组件还可能使用自己的参数，例如开关的 `--lg-switch-bend` 和滑块的 `--lg-slider-bend`。不要以为修改 `--lg-glass-bend` 就必然改变所有控件内部的透镜。主题会影响填色和高光，应同时检查 `data-theme` 与系统深浅色设置。[通用玻璃配置](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/src/internal/refraction.ts)、[开关实现](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/src/switch.tsx)

## 交互回弹与业务状态怎样配合

![Glisse 开关交互时序图，展示指针输入、弹簧逐帧绘制、onCheckedChange 和父组件写回 checked](/imgs/learning-notes/glisse-switch-sequence.svg)

[查看大图](/imgs/learning-notes/glisse-switch-sequence.svg) · [Mermaid 源码](/diagrams/learning-notes/glisse-switch-sequence.mmd)

以 `Switch` 为例，按下时记录指针并建立抬起目标；移动时根据位移更新视觉位置；松开后决定新的开关值，调用 `onCheckedChange`。在受控模式下，父组件要把结果写回 `checked`。只传入固定的 `checked={true}`，却不更新它，组件就会继续以旧业务状态为准。

每帧的视觉变化不需要全部通过 React 状态驱动。源码通过 `requestAnimationFrame` 推进弹簧，更新 DOM 的变换、透明度及透镜位置；React 负责业务状态和组件结构。这样可以把频繁的视觉更新与相对低频的业务提交分开。[Switch 指针处理](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/src/switch.tsx)

弹簧中可以区分当前位置、目标位置和速度。刚度影响追向目标的力度，阻尼影响回弹如何衰减。Glisse 的弹簧实现会在运动收敛后停止对应动画；检测到减少动态效果偏好时，直接更新到目标值。触摸滚动、指针取消、键盘操作也应该纳入验收，而不能只测试鼠标点击。[弹簧调度](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/src/internal/spring.ts)

## 兼容性与性能要围绕真实背景测试

WebGL 绘制分支不是一个通用浏览器截图器。它针对图片、视频、Canvas、文字、背景颜色及部分渐变等内容进行绘制；边框、阴影、SVG、其他渐变以及不满足跨域条件的图片等可能不能得到同样的弯曲效果。背景“能正常显示”不代表它一定能以相同方式进入绘制纹理。[背景绘制范围](https://github.com/0kzh/glisse/blob/4922c852a6866ee9991d2f8c715bb1cfbe7aa2b9/src/internal/drawn.ts)

性能也不能只看组件数量。需要同时观察被处理的背景面积、设备像素比、滤镜步骤、玻璃移动频率，以及背景本身是否每帧变化。相同逻辑面积的纹理，像素比从 1 到 2，像素数量约变成四倍；这解释了为什么桌面上平滑的演示不能直接代表手机上的成本。

可以先缩小标记背景的范围，避免把整页长文档都作为一个背景源；减少大面积重叠玻璃，并分别测试静态背景、滚动图片和视频。浏览器性能面板应查看长帧、绘制与合成开销，不能只用 React 渲染次数判断是否流畅。

| 现象 | 优先核对 |
| --- | --- |
| 只有磨砂，看不出折射 | 背景是否有纹理，是否命中可折射路径 |
| 加了背景标记仍无效果 | 标记是否在兄弟内容上，是否与玻璃相交 |
| Chrome 与 Safari 结果不同 | 是否使用不同渲染分支，背景内容是否都可绘制 |
| 参数变化不明显 | 改的是通用玻璃还是控件内部透镜，参数单位是否正确 |
| 开关松手后回到旧值 | 受控回调是否更新了 `checked` |
| 玻璃滚动时掉帧 | 标记区域面积、背景变化频率、像素比和重复合成 |
| 文字不清楚或键盘难以使用 | 前景对比度、可访问名称、焦点与减少动态效果 |

## 做一组可复现的材质实验

固定背景与元素尺寸，每轮只改变一个条件：先将弯曲强度设为 0，再增加弯曲，之后增加色散，最后加入模糊。分别截图，标出白线的位置变化、彩边和文字可读性，就能分辨每个参数负责什么。

接着在有、无 `data-glisse-backdrop` 两种结构下，对照 Chromium 与 WebKit 浏览器；再测试减少动态效果、键盘操作和较窄窗口。记录浏览器版本、设备和参数，不把某一次运行的帧率泛化成所有设备的表现。

学习这类组件库时，值得掌握的是背景来源、采样规则、合成顺序和状态回路。理解这四件事，才能解释“为什么有效”“为什么不同浏览器不一样”，以及“什么时候应该降低效果强度”。

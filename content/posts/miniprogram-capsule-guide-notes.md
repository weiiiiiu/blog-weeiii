---
title: 微信小程序胶囊引导气泡的定位与状态管理
date: 2026-11-21T07:37:17-08:00
categories: 开发
tags:
  - 微信小程序
  - 前端
  - UI
  - 学习笔记
description: 从坐标示意图和生命周期时序图理解小程序引导气泡，推导边界与箭头定位，处理添加状态、关闭缓存和异步回调。
draft: false
---

> 原文链接：[微信小程序实战：精准跟随右上角胶囊的「添加到我的小程序」引导气泡](https://mp.weixin.qq.com/s/rfq56_pfg9RhQuSRhLXeWg)

右上角的引导气泡是页面自己绘制的浮层。微信提供胶囊矩形的位置，页面根据它计算气泡和箭头，再用 WXML、WXSS 显示。这个浮层提示用户怎样操作，实际添加仍由用户在微信菜单中完成。

实现时需要同时处理三件事：**让坐标处在同一个参考系中，让箭头与气泡一起计算，让提示状态与真实添加状态分开保存。** 单独调一个 `right: 36rpx`，很难同时解决不同窗口宽度、导航栏模式和关闭后重新出现的问题。

## 先明确接口返回的是哪种坐标

`wx.getMenuButtonBoundingClientRect()` 返回胶囊的 `left`、`right`、`top`、`bottom`、`width`、`height`，单位是 px，原点在屏幕左上角。这里的 `right` 是右边界的横坐标，不是“距离右侧还有多少”。[菜单按钮位置接口](https://developers.weixin.qq.com/miniprogram/dev/api/ui/menu/wx.getMenuButtonBoundingClientRect.html)

窗口信息使用 `wx.getWindowInfo()` 读取。它提供 `windowWidth`、`windowHeight`、`screenTop` 等字段；`screenTop` 表示窗口上边缘的 y 值。原文使用的 `getSystemInfoSync()` 从基础库 2.20.1 起停止维护，新的窗口查询可以使用职责更明确的接口。[窗口信息](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getWindowInfo.html)、[旧接口说明](https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getSystemInfoSync.html)

| 量 | 含义 | 使用时要注意 |
| --- | --- | --- |
| 胶囊 `right` | 从屏幕左侧量到胶囊右边界 | 不能直接赋给 CSS `right` |
| CSS `right` | 浮层右边缘距定位容器右边缘的距离 | 同坐标系时才是 `窗口宽度 - 胶囊 right` |
| `screenTop` | 窗口在屏幕中的纵向起点 | 屏幕坐标转窗口坐标时需要考虑 |
| `windowWidth` | 可使用窗口的宽度 | 不要用物理像素宽度代替 |
| `pixelRatio` | 设备像素比 | 给页面元素写 px 定位时不需要再乘一次 |

设页面固定定位区域的屏幕原点为 `(Ox, Oy)`，胶囊屏幕坐标是 `(L, T, R, B)`，换成该区域中的坐标就是：

```text
left   = L - Ox
right  = R - Ox
top    = T - Oy
bottom = B - Oy
```

默认导航栏、自定义导航栏、桌面窗口的可布局区域可能不同，不能把 `B + 12` 当作所有环境都适用的定位公式。下面的示例面向**移动端全宽、自定义导航栏、页面根部固定定位**：横向原点取 0，纵向原点使用有效的 `screenTop`；字段缺失时，仅在已经确认原点为 0 的自定义导航场景下回退到 0。

`navigationStyle: "custom"` 会保留右上角胶囊，自定义标题、返回入口和安全区布局需要自己实现。不要仅为了复制气泡样例就删掉已有导航栏。[页面配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html)

## 把气泡与箭头放在同一张坐标图里

![小程序胶囊与气泡定位示意，标出窗口宽度、胶囊矩形、气泡边界和箭头中心](/imgs/learning-notes/miniprogram-guide-geometry.svg)

[查看大图](/imgs/learning-notes/miniprogram-guide-geometry.svg)

图中的数值是演算样例，单位均为 px。假设页面原点与屏幕原点一致：窗口宽 390，胶囊 `left = 290`、`right = 377`、`bottom = 76`。气泡最大宽度为 280，两侧至少留 12，主体距胶囊底部 12。

先计算主体，再计算箭头：

```text
气泡宽度 w = min(280, 窗口宽 W - 2 × 边距 m)
气泡左边 x = clamp(胶囊右边 r - w, m, W - m - w)
气泡顶部 y = 胶囊底部 b + 间距 g
锚点横坐标 c = (胶囊左边 l + 胶囊右边 r) / 2
箭头在气泡中的横坐标 a = c - x
```

`clamp(value, min, max)` 表示把一个数限制在上下界内。按上面的数值，结果是 `w = 280`、`x = 97`、`y = 88`、`c = 333.5`、`a = 236.5`。箭头与胶囊中心对齐，而不是依赖某个固定的右侧偏移。

要注意，接口返回的是**整个胶囊**的矩形，不能据此直接取得内部“···”按钮的精确矩形。这份示例指向整个胶囊中心；如果设计要求只指向左侧菜单图标，需要额外定义并在目标客户端验证偏移规则。

为了让三角形避开圆角，可以将 `a` 约束到 `[20, w - 20]`。一旦发生约束，箭头就不再严格对齐目标；示例选择隐藏箭头而保留气泡，不用一个明显偏离的箭头假装定位正确。

## 将定位计算写成不依赖微信的函数

把几何计算与页面生命周期分开，就可以给函数输入矩形，在普通 JavaScript 环境下验证结果。以下函数的坐标输入约定与上一节相同：

```javascript
function calculateGuide(win, menu) {
  if (!win || !menu) return null;
  const W = win.windowWidth;
  const H = win.windowHeight;
  const originY = Number.isFinite(win.screenTop) ? win.screenTop : 0;
  const values = [W, H, originY, menu.left, menu.right,
    menu.top, menu.bottom, menu.width, menu.height];
  if (!values.every(Number.isFinite) || W < 180 || H <= 0) return null;
  if (menu.width <= 0 || menu.height <= 0) return null;
  if (Math.abs(menu.right - menu.left - menu.width) > 1) return null;
  if (Math.abs(menu.bottom - menu.top - menu.height) > 1) return null;

  const l = menu.left;
  const r = menu.right;
  const b = menu.bottom - originY;
  // 本示例不尝试猜测桌面窗口或特殊容器的横向偏移。
  if (l < 0 || r > W || r <= l || b <= 0 || b > H) return null;

  const margin = 12;
  const gap = 12;
  const width = Math.min(280, W - margin * 2);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const left = clamp(r - width, margin, W - margin - width);
  const top = b + gap;
  // 给本例短文案预留空间；最终仍以渲染后的高度检查为准。
  if (H - top < 100) return null;
  const wantedArrow = (l + r) / 2 - left;
  const arrowLeft = clamp(wantedArrow, 20, width - 20);

  return {
    left, top, width, arrowLeft,
    showArrow: Math.abs(arrowLeft - wantedArrow) < 0.5
  };
}
```

这里故意不使用“取不到胶囊就写死一个 top”的回退方式。无效坐标时不展示非必要的引导，后续页面显示或窗口变化时再测量，可以避免浮层挡住错误位置。

定位数据全部用 px 传给视图。`rpx` 适合按页面宽度缩放的设计尺寸，它的基本比例是 `1rpx = 页面宽度 / 750 px`，还可能涉及取整。如果把接口返回的 `76px` 直接写成 `76rpx`，在 375px 宽的页面上就只有约 38px，误差会非常明显。[WXSS 长度单位](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html)

## 视图只负责绘制和关闭

将浮层直接放在页面根部，避开会裁剪它或改变定位上下文的祖先容器。WXML 中的 `guide` 来自上面的计算结果：

```html
<view wx:if="{{showGuide}}"
      class="add-guide"
      style="left:{{guide.left}}px;top:{{guide.top}}px;width:{{guide.width}}px;">
  <view wx:if="{{guide.showArrow}}"
        class="add-guide-arrow"
        style="left:{{guide.arrowLeft}}px;"></view>
  <view class="add-guide-text">打开右上角菜单，添加到我的小程序，下次更方便找到。</view>
  <button class="add-guide-close"
          aria-label="关闭添加引导"
          catchtap="closeGuide">×</button>
</view>
```

```css
.add-guide {
  position: fixed;
  z-index: 1000;
  box-sizing: border-box;
  padding: 16px 52px 16px 16px;
  border-radius: 12px;
  color: #fff;
  background: #242424;
}
.add-guide-text {
  font-size: 14px;
  line-height: 21px;
}
.add-guide-arrow {
  position: absolute;
  top: -8px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #242424;
  transform: translateX(-50%);
}
.add-guide-close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 44px;
  height: 44px;
  margin: 0;
  padding: 0;
  line-height: 44px;
  font-size: 24px;
  color: #fff;
  border-radius: 8px;
  background: transparent;
}
.add-guide-close::after { border: none; }
```

三角形使用透明左右边框和有色下边框绘制。`left` 定位箭头的中心，再通过 `translateX(-50%)` 把三角形自身居中；如果漏掉这一步，就会偏半个底边宽度。关闭按钮有独立点击区域，正文右侧预留空间，避免文字落到按钮下面。

`z-index` 只解决它所在层叠环境中的顺序。遇到祖先裁剪、原生组件或同层渲染问题，应检查具体组件与渲染环境，不是不断把数值从 1000 改成 999999。当前许多原生组件已经支持同层渲染，也不能再一概认定它们永远盖住普通视图。[原生组件与同层渲染](https://developers.weixin.qq.com/miniprogram/dev/component/native-component.html)

## 显示过程需要管理异步结果

![小程序引导生命周期时序图，展示关闭记录、真实添加状态、坐标测量、视图更新和过期回调失效](/imgs/learning-notes/miniprogram-guide-lifecycle.svg)

[查看大图](/imgs/learning-notes/miniprogram-guide-lifecycle.svg) · [Mermaid 源码](/diagrams/learning-notes/miniprogram-guide-lifecycle.mmd)

读取胶囊位置是同步调用，检查是否已添加则使用异步回调。`wx.checkIsAddedToMyMiniProgram()` 的 `success` 返回 `added`，从基础库 2.29.1 起支持。关闭提示的本地记录不能替代这个结果。[真实添加状态接口](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/my-miniprogram/wx.checkIsAddedToMyMiniProgram.html)

下面的页面逻辑与前面的 `calculateGuide` 放在同一个页面 JS 文件中。它采用保守策略：状态接口不可用或失败时不展示。页面配置中的 `navigationStyle` 为 `custom`，并满足前述坐标约定。

```javascript
const DISMISSED_KEY = "blog-demo:add-guide:dismissed:v1";

Page({
  data: { showGuide: false, guide: {} },
  onLoad() {
    this._epoch = 0;
    this._ready = false;
    this._active = false;
    this._dismissed = false;
    try { this._dismissed = wx.getStorageSync(DISMISSED_KEY) === true; }
    catch (error) { console.warn("读取引导记录失败", error); }
  },
  onShow() {
    this._active = true;
    if (this._ready) this.refreshGuide();
  },
  onReady() {
    this._ready = true;
    this.refreshGuide();
  },
  onResize() {
    if (this._ready && this._active) this.refreshGuide();
  },
  onHide() {
    this._active = false;
    this._epoch += 1;
    this.setData({ showGuide: false });
  },
  onUnload() {
    this._active = false;
    this._epoch += 1;
  },
  refreshGuide() {
    const epoch = ++this._epoch;
    this.setData({ showGuide: false });
    if (this._dismissed || !this._active) return;
    if (typeof wx.checkIsAddedToMyMiniProgram !== "function") return;
    const current = () => epoch === this._epoch && this._active && !this._dismissed;
    wx.checkIsAddedToMyMiniProgram({
      success: ({ added }) => {
        if (!current() || added !== false) return;
        try {
          const win = wx.getWindowInfo();
          const menu = wx.getMenuButtonBoundingClientRect();
          const guide = calculateGuide(win, menu);
          if (!guide) return;
          this.setData({ guide, showGuide: true }, () => {
            // 大字或文案换行后，再检查实际高度。
            this.createSelectorQuery().select(".add-guide")
              .boundingClientRect(rect => {
                if (!current()) return;
                if (!rect || rect.bottom > win.windowHeight - 12) {
                  this.setData({ showGuide: false });
                }
              }).exec();
          });
        } catch (error) { console.warn("引导定位失败", error); }
      },
      fail: error => console.warn("添加状态查询失败，本轮不展示", error)
    });
  },
  closeGuide() {
    this._dismissed = true;
    this._epoch += 1;
    this.setData({ showGuide: false });
    try { wx.setStorageSync(DISMISSED_KEY, true); }
    catch (error) { console.warn("关闭记录保存失败，本页仍保持关闭", error); }
  }
});
```

`onReady` 只在首次渲染完成后触发，`onShow` 会在页面再次显示时触发，`onResize` 响应窗口尺寸变化。仅在 `onLoad` 测量一次，无法覆盖页面返回和可调整窗口的情况。[页面生命周期](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html)、[显示区域变化](https://developers.weixin.qq.com/miniprogram/dev/framework/view/resizable.html)

`_epoch` 是异步请求的轮次编号。例如第一次查询尚未返回，用户已经离开页面；离开时编号递增，旧回调即使返回，也不能再次打开气泡。关闭、重新测量同样会让旧结果失效。它不取消微信内部的请求，只阻止过期结果修改当前视图。

示例在显示后检查实际高度，因此极端大字模式下可能短暂出现再隐藏。若业务要求完全避免闪现，可以先以不可见状态测量布局，确认通过后再切换可见性，同时保留轮次检查。

## 关闭记录与添加状态不要混用

| 状态 | 能证明什么 | 应怎样使用 |
| --- | --- | --- |
| `showGuide` | 当前视图是否显示提示 | 控制页面渲染 |
| `_dismissed` | 当前页面实例已决定不再提示 | 缓存写入失败时也尊重本次关闭 |
| 本地 `dismissed:v1` | 这个引导版本曾被用户关闭 | 后续打开时抑制重复提示 |
| 接口返回 `added` | 查询时是否已加入“我的小程序” | 已添加时无需再展示添加引导 |

不要把关闭按钮事件统计为“添加成功”，也不要把 `hasShow` 这种含义模糊的键同时用作“已显示”“已关闭”和“已添加”。需要统计时，分别记录提示曝光和用户关闭；添加状态另行判断。

本地缓存可能被用户或系统清理，它不是永久账号状态。产品如果要求七天后再提示，可以保存关闭时间并按时间判断；若只是修改了一句文案，不应随意换版本键让所有人重新被打扰。[本地缓存说明](https://developers.weixin.qq.com/miniprogram/dev/api/storage/wx.setStorageSync.html)

## 用输入样例和真机分别验收

几何函数可以先验证确定结果，设备显示则需要开发者工具和真机。二者解决不同问题。

| 测试条件 | 预期结果 |
| --- | --- |
| W 为 390，胶囊为 L290、R377、B76，原点为 0 | 气泡 x97、y88、宽280，箭头横坐标236.5 |
| 相同屏幕矩形，窗口 `screenTop` 为 44 | 气泡 y44，证明纵向原点参与换算 |
| W 为 280，胶囊为 L180、R267 | 气泡左边限制为12，宽度缩为256，箭头仍按实际 x 计算 |
| 胶囊全零、字段缺失或明显超出窗口 | 不展示，不生成 NaN 样式 |
| 已添加、已关闭、接口失败 | 按对应策略保持隐藏 |
| 查询未返回时关闭或离开页面 | 旧回调不能让气泡复活 |
| 字体变大或文案变长 | 不盖住关闭按钮，底部溢出时隐藏或调整布局 |
| 横竖屏、折叠变化、平板或桌面窗口 | 重新验证坐标原点、可用区域和箭头，不照搬手机固定值 |

调试时记录 `menuRect`、窗口信息、导航模式、计算结果和设备条件。先判断误差来自坐标原点、单位、主体边界还是箭头偏移，再修改对应公式，才能让调整有依据。

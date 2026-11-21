---
title: 微信小程序 Skyline 公告轮播的无缝循环与生命周期
date: 2026-11-21T08:17:04-08:00
categories: 开发
tags:
  - 微信小程序
  - Skyline
  - 动画
  - 学习笔记
description: 拆解复制首条实现无缝轮播的坐标与时序，分析定时器和页面生命周期的竞态，并提供可暂停的 swiper 公告示例与验收方法。
draft: false
---

> 原文链接：[微信小程序Skyline垂直公告轮播｜JS 无缝滚动、点击跳转、柔和过渡](https://mp.weixin.qq.com/s/PRnwM7X6yIgA3T5MM1dMyA)

公告轮播看起来只是每隔几秒把文字向上挪一行，实际同时涉及三个问题：列表到了末尾怎样接回开头，逻辑层和渲染层怎样同步，页面离开以后谁负责停止任务。

原文采用固定高度容器、纵向列表、末尾复制首条，以及 JS 定时修改 `transform` 的方式。下面先把这个模型拆开，再给出适合常规公告的 `swiper` 实现。两种实现都需要明确空列表、暂停、页面隐藏和点击跳转的行为。

## 视口与轨道是两个不同的对象

外层视口决定一次能看见多少内容，内层轨道决定所有公告实际排在哪里。假设每条公告的高度是 `H = 72rpx`，视口高度也取 `H`，超过视口的内容被裁掉。

三条业务公告 A、B、C 的渲染轨道为：

```text
业务列表       [ A, B, C ]
渲染轨道       [ A, B, C, A′ ]
物理下标         0  1  2   3
逻辑下标         0  1  2   0
轨道位移         0 -H -2H -3H
```

A′ 是首条的视觉副本。它需要与 A 使用相同的文字、图标、目标地址和尺寸，但必须使用不同的渲染 key。业务身份可以相同，节点身份不能混淆。`wx:key="index"` 表示寻找数据项上的 `index` 属性，不能假定它总会自动采用循环下标；更稳妥的是生成专用 `renderKey`。[WXML 列表渲染](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/list.html)

![公告轮播轨道流程图，从 A 到 B 到 C 到 A 的副本，再关闭过渡复位到真正的 A](/imgs/learning-notes/skyline-notice-loop.svg)

[查看大图](/imgs/learning-notes/skyline-notice-loop.svg) · [Mermaid 源码](/diagrams/learning-notes/skyline-notice-loop.mmd)

普通切换把轨道向上移动一个 `H`。从 C 滑到 A′ 后，视口中已经是 A 的画面；此时关闭过渡，把轨道从 `-3H` 直接放回 `0`。两处可见内容一致，用户才不会看见倒着滚回开头的过程。

这里有三个必须成立的条件：

1. 每条内容的实际外部高度都等于 `H`，不能某一条因换行、边框或间距变高。
2. A′ 已经完整进入视口，复位不能发生在滑动中途。
3. 复位时没有过渡，重新开启过渡之后再开始下一次移动。

如果直接把下标从 2 改为 0，且仍保留 `transition`，浏览器或渲染器会在 `-2H` 与 `0` 之间插值，结果就是穿过 B 倒滚。复制节点解决的是这个几何问题。

## 下标计算可以先脱离界面验证

下面是手写轨道的纯数据模型。输入要求是具有唯一 `id` 的非空公告项；业务层应先清洗空文字和重复 ID。

```javascript
function buildTrack(items) {
  const rows = items.map(item => ({
    ...item,
    renderKey: `real:${item.id}`,
    cloned: false
  }));
  if (items.length > 1) {
    rows.push({
      ...items[0],
      renderKey: `clone:${items[0].id}`,
      cloned: true
    });
  }
  return rows;
}

function advance(index, total) {
  if (total < 2) return null;
  // 调用时 index 必须指向真实项；副本必须先完成复位。
  if (!Number.isInteger(index) || index < 0 || index >= total) {
    throw new RangeError('Invalid physical index');
  }
  const next = index + 1;
  return {
    physicalIndex: next,
    logicalIndex: next % total,
    offsetRpx: next * 72,
    needsReset: next === total
  };
}
```

例如 `advance(2, 3)` 返回物理下标 3、逻辑下标 0、位移量 216，并标记需要复位。样式再把正的位移量写成 `translateY(-216rpx)`。这可以避免代码里正负号重复相乘。

高度与位移都使用 `rpx` 时，不需要先把 72 转为像素。如果通过节点查询得到的是 `px` 高度，位移也应使用 `px`。混用单位会在某些屏幕上刚好对齐，在另一些屏幕上逐条偏移。

## 定时器到点不等于动画已经完成

原文的目标节奏是停留约 5 秒、滑动约 0.6 秒。用 `setInterval(..., 5600)` 从初始展示开始计时，第一条会先静止约 5.6 秒；之后两次切换启动相隔约 5.6 秒，扣除约 0.6 秒动画，才是约 5 秒静止时间。

更需要关注的是 `setData` 与动画不共享同一个起点。JS 发出数据更新后，还要经过视图更新和渲染，`setTimeout(..., 600)` 只表示回调最早在一段时间后被调度，不能证明画面已经完成了 600 毫秒的插值。

![公告自定义轨道的切换时序，动画完成后才复位，页面隐藏使等待任务失效](/imgs/learning-notes/skyline-notice-sequence.svg)

[查看大图](/imgs/learning-notes/skyline-notice-sequence.svg) · [Mermaid 源码](/diagrams/learning-notes/skyline-notice-sequence.mmd)

手写方案可以用下面的状态约束组织代码，而不是堆叠多个互相不知道的定时器：

| 状态 | 允许发生的事 | 结束条件 |
| --- | --- | --- |
| 停止 | 保留当前内容，不启动新的移动 | 页面显示且用户允许播放 |
| 停留 | 只保留一个等待定时器 | 等待结束后进入移动 |
| 移动 | 更新目标位移，不再排第二次移动 | 收到对应的动画完成信号 |
| 复位 | 关闭过渡，副本位置归零 | 视图更新完成，再开始停留 |

CSS 过渡结束可监听 `bind:transitionend`，事件要绑在实际发生过渡的轨道上，它不冒泡。监听多个过渡属性时，还要区分是哪一个属性结束。采用 `swiper` 时则使用组件的 `bind:animationfinish`。[动画事件](https://developers.weixin.qq.com/miniprogram/dev/framework/view/animation.html)、[swiper 事件](https://developers.weixin.qq.com/miniprogram/dev/component/swiper.html)

`setData` 回调可以作为一次视图更新完成的边界，不能把它当成整段动画已经完成。复位和下次移动之间本来就有停留时间，通常没有必要用一个神秘的“50 毫秒”去恢复过渡后立即开跑。

如果目标设备没有按预期送出结束事件，超时保护应该停止并恢复到一个确定位置，随后重新计时。不能把超时当作正常完成，继续快速堆叠位移。状态机测试与真机动画验收需要分别进行。

## 常规公告可以直接使用 swiper

官方 `swiper` 支持 Skyline 与 WebView，提供纵向排列、循环衔接和自动切换。普通公告不需要维护自己的副本节点，也不需要每帧向逻辑层同步位置。[组件文档](https://developers.weixin.qq.com/miniprogram/dev/component/swiper.html)

下面四段代码属于同一页面。三个示例地址需要替换为项目实际注册的页面；其中 `/pages/home/index` 假设已经配置为 tabBar 页面。

页面 JSON：

```json
{
  "renderer": "skyline",
  "componentFramework": "glass-easel",
  "glassEaselWebview": true,
  "usingComponents": {}
}
```

已有项目还应按官方迁移指引配置 `app.json` 的 `lazyCodeLoading: "requiredComponents"`、渲染选项及测试环境。写上 `renderer` 不代表当前真机一定采用 Skyline，灰度策略和设备能力也会影响实际渲染器，可以在页面实例读取 `this.renderer` 确认。[Skyline 迁移指引](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/migration/)、[glass-easel 配置](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/glass-easel/migration)

WXML：

```xml
<view wx:if="{{notices.length}}" class="notice-bar">
  <swiper
    class="notice-swiper"
    vertical="{{true}}"
    circular="{{notices.length > 1}}"
    autoplay="{{visible && !paused && notices.length > 1}}"
    interval="{{5000}}"
    duration="{{600}}"
    indicator-dots="{{false}}"
    bindchange="onNoticeChange"
  >
    <swiper-item wx:for="{{notices}}" wx:key="id">
      <view class="notice-row" bindtap="openNotice" data-id="{{item.id}}">
        <text class="notice-badge">公告</text>
        <text class="notice-text" max-lines="1" overflow="ellipsis">{{item.text}}</text>
      </view>
    </swiper-item>
  </swiper>
  <button wx:if="{{notices.length > 1}}"
    class="notice-toggle" bindtap="togglePause"
    aria-label="{{paused ? '继续公告轮播' : '暂停公告轮播'}}">
    {{paused ? '继续' : '暂停'}}
  </button>
</view>
```

`swiper` 的直接子节点只放 `swiper-item`。暂停按钮放在外面，避免把它误当成一张轮播页。`max-lines` 配合 `overflow="ellipsis"` 控制 Skyline 的单行省略，WXSS 再补上单行规则，兼顾 WebView。[text 组件](https://developers.weixin.qq.com/miniprogram/dev/component/text.html)

WXSS：

```css
.notice-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  padding: 0 24rpx;
  box-sizing: border-box;
  background: #fff7e6;
  color: #51330b;
}
.notice-swiper {
  flex: 1;
  min-width: 0;
  height: 88rpx;
}
.notice-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 88rpx;
  overflow: hidden;
}
.notice-badge {
  flex-shrink: 0;
  margin-right: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
}
.notice-text {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  line-height: 40rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notice-toggle {
  flex-shrink: 0;
  margin: 0 0 0 16rpx;
  padding: 0 12rpx;
  min-width: 88rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 26rpx;
  color: #51330b;
  background: transparent;
  border: 0;
  border-radius: 0;
}
.notice-toggle::after { border: 0; }
```

示例把行高扩大为 `88rpx`，给点击区域留出更多空间。这里不再使用手写轨道的 `72rpx` 位移公式。`min-width: 0` 让文本允许在 flex 容器中收缩，否则长公告可能把暂停按钮挤出屏幕。两处横向排列都显式写 `flex-direction: row`，避免依赖渲染器的默认方向。

页面 JS：

```javascript
const TAB_PAGES = new Set(['/pages/home/index']);
const DETAIL_PAGES = new Set([
  '/pages/activity/index',
  '/pages/vip/index'
]);

function cleanNotices(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw.flatMap(item => {
    if (!item || typeof item.id !== 'string' ||
        typeof item.text !== 'string') return [];
    const id = item.id.trim();
    const text = item.text.trim();
    if (!id || !text || seen.has(id)) return [];
    seen.add(id);
    return [{ id, text, url: typeof item.url === 'string' ? item.url.trim() : '' }];
  });
}

Page({
  data: { notices: [], visible: false, paused: false },

  onLoad() {
    this._navigating = false;
    this._logicalIndex = 0;
    this.setData({ notices: cleanNotices([
      { id: 'activity', text: '本月活动正在进行，查看活动说明', url: '/pages/activity/index' },
      { id: 'vip', text: '会员权益说明已更新', url: '/pages/vip/index' },
      { id: 'info', text: '服务时间为每天 9 点至 18 点', url: '' }
    ]) });
  },

  onShow() {
    this._navigating = false;
    this.setData({ visible: true });
  },

  onHide() { this.setData({ visible: false }); },

  togglePause() { this.setData({ paused: !this.data.paused }); },

  onNoticeChange(event) {
    // 记录状态即可；不要在 change 中无条件反写 current。
    this._logicalIndex = event.detail.current;
  },

  openNotice(event) {
    if (!this.data.visible || this._navigating) return;
    const item = this.data.notices.find(n => n.id === event.currentTarget.dataset.id);
    if (!item || !item.url) return;
    const path = item.url.split('?')[0];
    const isTab = TAB_PAGES.has(path);
    if (!isTab && !DETAIL_PAGES.has(path)) {
      wx.showToast({ title: '公告链接暂不可用', icon: 'none' });
      return;
    }
    this._navigating = true;
    const fail = () => {
      this._navigating = false;
      wx.showToast({ title: '页面打开失败，请稍后重试', icon: 'none' });
    };
    if (isTab) wx.switchTab({ url: path, fail });
    else wx.navigateTo({ url: item.url, fail });
    // 成功时保持锁定；返回当前页的 onShow 再释放。
  }
});
```

暂停保存的是用户意愿，`visible` 保存的是页面可见性。用户主动暂停后切到别的页面再回来，不应因为 `onShow` 重新开始播放。把两个状态混成一个 `autoplay` 开关，往往会丢失这个区别。

示例没有自建轮播定时器，页面卸载时由组件销毁其内部行为。如果另外接入了异步公告请求，需要在卸载时使请求回调失效；快速刷新列表时还要用请求序号，防止旧响应覆盖新列表。

## 自动播放间隔与精确停留时间要分开

上面的 `interval=5000` 使用组件定义的自动切换间隔，`duration=600` 控制切换动画时长。不要仅凭这两个数字就承诺“每条在每台设备上准确静止 5000 毫秒”。组件实现、用户手势和调度都会影响观察到的时序。

如果业务要求从每次动画完成后再计时 5 秒，可以关闭 `autoplay`，监听 `animationfinish`，由单个 `setTimeout` 更新 `current`。初始渲染完成也要启动一次等待；用户手动滑动后则重新开始等待。下一次等待只由“初始就绪”或“动画完成”启动，不能同时再留一个 `setInterval`。

手写调度器的最小取消模型如下，适用于需要额外调度的版本，不要叠加到前面的自动播放示例上：

```javascript
function createWaiter() {
  let timer = null;
  let generation = 0;
  function cancel() {
    generation += 1;
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }
  return {
    cancel,
    schedule(callback, delay) {
      cancel();
      const expected = generation;
      timer = setTimeout(() => {
        if (expected !== generation) return;
        timer = null;
        callback();
      }, delay);
    }
  };
}
```

`cancel()` 同时清理定时器和改变代次。后续如果还嵌套了 `setData` 回调，也需要携带同一代次检查。它防止的是旧任务继续推进状态，并不保证时钟精确，也不能替代动画完成事件。

在页面 `onHide`、`onUnload`、用户暂停和替换列表时取消任务；在可见、未暂停、列表至少两条时再启动。只清理 `onUnload` 不够，因为 `navigateTo` 打开新页通常会隐藏并保留旧页。[页面生命周期](https://developers.weixin.qq.com/miniprogram/dev/reference/api/Page.html)

## 点击跳转依赖业务项而非当前下标

动画过程中，一条正在离开，另一条正在进入。点击目标应来自实际被点中的行，所以示例把 `id` 放在行上，再从业务列表取数据，而不是读取一个定时器已经提前改动的 `currentIndex`。

`currentTarget` 是绑定事件的节点，`target` 可能是内部文字或图标；`data-id` 写在外层行上时应读取前者。手写的 A′ 也应指向 A 的业务 ID，不能把物理下标 3 当成第四条业务公告。

| 目标 | 处理方式 | 注意 |
| --- | --- | --- |
| 小程序普通页 | `wx.navigateTo` | 页面必须注册，允许查询参数，受页面栈限制 |
| tabBar 页 | `wx.switchTab` | 目标必须在 tabBar 中，URL 不能附带查询参数 |
| 空地址 | 保留展示，不执行跳转 | 不要把空值拼成一个无效路径 |
| 未知地址 | 拒绝跳转并给反馈 | 后台数据不应决定任意路由调用 |

示例将 tabBar 路径与详情路径分开配置。若 tabBar 需要业务参数，应通过明确的应用状态传递方案实现，不能直接套用普通页的查询参数规则。[navigateTo](https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.navigateTo.html)、[switchTab](https://developers.weixin.qq.com/miniprogram/dev/api/route/wx.switchTab.html)

## Skyline 兼容问题要定位到具体能力

Skyline 的官方支持表包含 CSS Transition，也包含有版本条件的 CSS Animation。`@keyframes` 样式隔离还可受 `keyframeStyleIsolation` 配置影响。因此，遇到动画不生效时，应检查定义位置、组件隔离、微信版本及实际渲染器，而不能归纳为“Skyline 不支持关键帧”。[Skyline WXSS 支持表](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/wxss.html)

同时要区分 CSS `@keyframes` 与 `this.animate`。后者属于小程序的关键帧动画接口，官方文档标注仅支持 WebView；两者名字相似，能力范围不同。更复杂的 Skyline 手势联动可考虑 worklet，但简单公告没有必要为此引入逐帧 JS 通信。

自动更新的内容也需要让用户有时间读完。暂停按钮不应只作为调试工具；公告还能通过详情或完整公告列表再次访问。对于网页中的类似组件，WCAG 对自动更新内容提出了暂停、停止、隐藏或控制更新频率的要求，小程序也可以采用这一交互原则。[自动更新内容说明](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)

## 用行为矩阵验收轮播

| 场景 | 应有结果 | 常见错误 |
| --- | --- | --- |
| 空列表 | 不显示公告区域，不取首项 | 模板访问不存在的第零项 |
| 单条公告 | 静态显示，可以按需点击 | 仍复制自身、持续滑动 |
| 三条循环十轮 | 顺序稳定，无倒滚、漂移、闪白 | 高度不一致或提前复位 |
| 最后一条切换时点击 | 打开实际被点击项对应的页面 | 用已提前更新的下标查询 URL |
| 页面隐藏后返回 | 不叠加定时器；保留用户暂停意愿 | 后台继续跑，返回后加速 |
| 连续快速点击 | 只触发一次有效导航 | 重复压入相同页面 |
| 跳转失败 | 有反馈且能再次点击 | 导航锁永远不释放 |
| 长文字和窄屏 | 文字按策略省略，按钮仍可操作 | 内容把按钮挤出容器 |
| 轮播中替换列表 | 下标和待执行任务同时重置 | 旧回调操作新列表 |

纯函数可以验证副本、下标和位移；接口替身可以验证可见性、暂停与导航锁。真机还需要观察动画结束事件、触摸行为、字体尺寸以及 Skyline 和 WebView 的差异。逻辑测试通过，只能说明状态符合预期，不能证明每一帧都没有跳动。

最值得保留的实现原则是：业务列表负责公告内容，渲染轨道负责视觉衔接，状态机负责何时推进，页面生命周期负责何时停止。四者有清晰边界，轮播才不会在返回页面或刷新数据时变得不可预测。

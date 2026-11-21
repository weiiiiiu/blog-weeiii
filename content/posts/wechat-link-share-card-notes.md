---
title: 微信链接分享卡片与 Open Graph 配置笔记
date: 2026-11-21T04:00:11-08:00
categories: 开发
tags:
  - 微信
  - Open Graph
  - 网页开发
description: 区分文字链接与网页分享，整理 Open Graph 标签、分享图片、原始 HTML 检查和微信 JS-SDK 的使用边界。
draft: false
---

同一个网址，在微信里可能显示为文字链接，也可能显示为带标题和缩略图的卡片。排查时要分别看两件事：**通过什么入口分享，以及网页提供了什么分享信息。** 补齐网页标签可以改善元数据，但不能保证所有微信版本、入口都生成同一种卡片。

这篇笔记整理自[《普通链接发微信，怎么变成卡片？》](https://mp.weixin.qq.com/s/nIE69ZOoQov_DEiS3-qb3Q?scene=1)，并补充 Open Graph 协议和微信 JS-SDK 文档中的配置要求。

## 先区分发送文字和分享网页

原文记录了一个现象：直接发送网址，与扫码打开网页后从页面菜单分享，得到的消息样式不同。作者还列举了从收藏等入口打开页面再分享的尝试。

这类观察适合用来设计对照测试。把一条含网址的文字消息转发出去，与在网页内发起分享，是不同的操作；验证时应记录具体入口、手机系统和微信版本，不能只比较两次发送的网址是否相同。

## 在网页中提供 Open Graph 信息

Open Graph 用 HTML 元数据描述页面。协议规定的四项基础属性是 `og:title`、`og:type`、`og:image` 和 `og:url`；`og:description` 用来补充摘要。[Open Graph 协议](https://ogp.me/)

下面是一份文章页面的示例。域名、文案和图片尺寸都需要替换为实际值：

```html
<head>
  <title>微信链接分享卡片笔记</title>
  <meta property="og:title" content="微信链接分享卡片笔记">
  <meta property="og:description" content="网页分享标签、图片与微信入口的排查记录。">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://example.com/posts/share-card">
  <meta property="og:image" content="https://example.com/images/share-card.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">
  <meta property="og:image:alt" content="微信链接分享卡片笔记封面">
</head>
```

图片的类型、宽度、高度和替代说明属于扩展属性。`og:url` 应指向页面的规范地址，每篇文章使用自己的标题、摘要和地址。[图片属性说明](https://ogp.me/#structured)

示例中的 600 × 600 只是便于演示的图片尺寸，不是微信统一要求。准备缩略图时，可以把主体放在中央、为边缘留出空间，再检查实际裁切效果。

## 检查服务器返回的 HTML

对于 React、Vue 等网站，浏览器运行后的页面与服务器最初返回的 HTML 可能不同。为兼容只读取初始 HTML 的抓取流程，建议通过静态生成或服务端渲染输出分享标签，避免把元数据完全依赖于组件挂载后的修改。

检查时可以在电脑浏览器选择“查看网页源代码”，找到 `<head>` 中真正的 `<meta>` 标签。开发者工具的 Elements 面板展示的是当前 DOM，两者需要分清。

也可以下载响应正文：

```bash
curl -fsSL "https://example.com/posts/share-card" -o page.html
```

打开 `page.html` 后，确认返回的是文章页面，并检查标题、摘要和图片地址。教程正文中的代码示例也可能包含 `og:image` 字样，因此仅搜索到这个字符串，还不能证明页面头部已经配置好了。

## 分享图片单独排查

看到卡片缺图时，可以按下面的顺序检查：

| 检查项 | 要确认的内容 |
| --- | --- |
| 图片地址 | 使用完整的 HTTPS 地址，部署后仍指向正确文件 |
| 匿名访问 | 在未登录状态下也能打开，不依赖当前浏览器的 Cookie |
| 响应内容 | 返回真实图片，检查状态码与 `Content-Type` |
| 访问限制 | 没有被防盗链、访问挑战或过期签名拦住 |
| 图片内容 | 主体清晰，透明背景和裁切不会让图标难以辨认 |

可以用一次实际下载检查响应，而不只看图片是否能在自己的浏览器里显示：

```bash
curl -fsSL -D image-headers.txt \
  "https://example.com/images/share-card.png" \
  -o share-card.png
```

查看 `image-headers.txt`，再打开下载到的图片。一次正常响应只能确认当前请求路径可用；如果微信仍然缺图，还需要结合服务端访问日志和实际分享结果定位。

## 修改之后怎样判断缓存

原文建议给链接增加版本参数来对照旧结果，例如 `?v=2`。这可以作为排查手段，但不能保证微信一定立即重新抓取；页面、图片和客户端可能各自保留旧结果。

更容易复盘的做法是先确认线上 HTML 已更新，再为替换后的图片使用新文件名，例如从 `share-card.png` 改为 `share-card-v2.png`，同步更新图片地址。之后用相同入口分享新旧页面，记录差异。

如果链接原来已有查询参数，追加参数应使用 `&`。采用微信 JS-SDK 时，签名也要对应当前完整页面地址中的查询参数，不能拿旧地址的签名套在新链接上。[微信签名与常见错误说明](https://developers.weixin.qq.com/doc/subscription/guide/h5/jssdk.html)

## 需要主动设置分享内容时使用 JS-SDK

Open Graph 提供网页元数据。微信还提供正式的分享内容设置接口：[JS-SDK 分享接口](https://developers.weixin.qq.com/doc/subscription/guide/h5/jssdk.html)。

| 接口 | 配置内容 |
| --- | --- |
| `wx.updateAppMessageShareData` | 分享给朋友等入口的标题、描述、链接和图标 |
| `wx.updateTimelineShareData` | 朋友圈等入口的标题、链接和图标 |

使用前需要确认账号拥有对应接口权限、配置 JS 接口安全域名，并完成 `wx.config` 的签名验证。分享数据应在 `wx.ready` 后、用户点击分享之前设置。

下面只演示设置数据的部分，前提是 SDK 已加载、配置验证成功，并已声明所需接口：

```javascript
wx.ready(function () {
  wx.updateAppMessageShareData({
    title: "微信链接分享卡片笔记",
    desc: "网页元数据与分享图片的排查步骤。",
    link: "https://example.com/posts/share-card",
    imgUrl: "https://example.com/images/share-card.png"
  });
});
```

这里的链接还必须符合账号配置的安全域名要求。这个接口用于设置分享内容，不会替用户自动发送消息；设置成功也需要继续在真实分享场景中验收。

## 做一次可复现的分享测试

建议先选一篇页面做小范围对照，记录以下结果：

1. **检查页面**：原始 HTML 的标题、摘要、规范地址和图片地址是否正确。
2. **检查图片**：未登录时能否正常获取并显示图片。
3. **比较入口**：分别测试直接发送网址、在网页菜单发起分享，以及扫码或从收藏打开后的分享。
4. **比较接收结果**：查看接收方实际收到的消息，核对标题、图片和点击后的目标地址。
5. **保存条件**：记录手机系统、微信版本、测试 URL、操作入口和时间。

这样能把“页面没有提供信息”“资源访问异常”“旧结果未更新”和“入口表现不同”分开排查，也方便以后换设备或更新微信版本时复测。

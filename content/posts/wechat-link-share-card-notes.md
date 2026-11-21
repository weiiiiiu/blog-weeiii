---
title: 微信链接分享卡片与 Open Graph 配置笔记
date: 2026-11-21T04:00:11-08:00
categories: 开发
tags:
  - 微信
  - Open Graph
  - 网页开发
description: 用数据流图和 JS-SDK 时序图拆解微信分享，讲清初始 HTML、OG 图片、票据缓存、URL 签名、分享接口与分层排查。
draft: false
---

> 原文链接：[普通链接发微信，怎么变成卡片？](https://mp.weixin.qq.com/s/nIE69ZOoQov_DEiS3-qb3Q?scene=1)

“链接发出去没有卡片”可能是几种不同问题：发送的是一条含网址的文本，网页没有输出可读的分享信息，图片请求失败，或者 JS-SDK 配置没有通过。它们外观相似，修复位置却不同。

理解这些现象，需要拆开页面元数据、签名和分享调用。**Open Graph 是页面提供信息的方式；微信 JS-SDK 是微信内网页经过授权后设置分享信息的方式。** 两者需要分别理解。

本文的流程图是帮助定位问题的模型。微信没有在引用文档中完整公开所有入口的卡片抓取、缓存和字段优先级，因此不会把“添加 OG 就一定生成卡片”或某个缓存刷新技巧写成平台保证。代码是教学示例，也不表示本博客已接入微信 SDK。

## 先区分分享入口与信息来源

![微信分享数据路径图，展示 Open Graph 元数据与经过授权的 JS-SDK 两种方式，以及接收端验收边界](/imgs/learning-notes/wechat-share-paths.svg)

[查看大图](/imgs/learning-notes/wechat-share-paths.svg) · [Mermaid 源码](/diagrams/learning-notes/wechat-share-paths.mmd)

图中的两条路径**不是先抓 OG、再执行 SDK 的固定流水线**。网页可以同时提供两种信息，但具体入口是否采用它们，要通过实际客户端结果验证。

| 操作 | 实际做了什么 | 可以据此判断什么 |
| --- | --- | --- |
| 在聊天框粘贴 URL 并发送 | 发送含网址的文字消息 | 不能据此判断网页内 SDK 是否生效 |
| 转发已有消息 | 复用一次已有消息的转发入口 | 不能直接视为重新读取页面元数据 |
| 在微信内打开网页，从菜单分享 | 网页处于微信环境，可能使用对应分享能力 | 可以验证页面配置与最终分享结果 |
| 扫码或收藏后打开网页再分享 | 改变进入网页的路径 | 可作为对照条件，不能当成稳定的强制转卡片方法 |

原文对入口差异的观察有助于设计测试，但“这次成功”不能推出“任何账号、机型、入口都成功”。测试记录应至少包含 URL、入口、系统、微信版本和接收端截图。

## Open Graph 应该出现在初始 HTML 的哪里

Open Graph 用 `<head>` 中的元数据描述网页。基础属性是 `og:title`、`og:type`、`og:image` 和 `og:url`，摘要可以用 `og:description` 补充。[Open Graph 协议](https://ogp.me/)

```html
<head>
  <title>微信分享学习笔记</title>
  <meta property="og:title" content="微信分享学习笔记">
  <meta property="og:description" content="理解元数据、签名和分享调用的关系。">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://example.com/posts/share-notes">
  <meta property="og:image" content="https://example.com/images/share-notes-v1.png">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">
  <meta property="og:image:alt" content="微信分享流程示意封面">
</head>
```

示例尺寸只是图片本身的尺寸，不是微信统一规格。每篇文章应提供自己的标题、摘要、规范 URL 和适合裁切的图片。`og:image` 填完整的公开图片地址，声明的类型、宽高应与文件一致。[OG 图片结构化属性](https://ogp.me/#structured)

对 React 等网站，需要分清两个时间点：

```text
请求文章 URL
  → 服务器或 CDN 返回初始 HTML
  → 浏览器加载 JavaScript
  → React 水合，或客户端生成 / 更新 DOM
```

兼容只读取响应 HTML 的读取方时，标签必须在第一份 HTML 中已经存在。如果组件挂载后才写入 `<meta>`，自己的浏览器可能显示正确，读取初始响应的一方却看不到。SSG 可以在构建时把每篇文章的元数据写进对应 HTML；SSR 则在请求时生成。判断依据是部署后的响应内容，而不是采用了某个框架就自动正确。

先下载页面，再只检查真实 `<head>`，避免把正文教程中的示例标签当成配置：

```bash
curl -fsSL "https://example.com/posts/share-notes" -o page.html
```

下面用 Python 标准库提取头部 OG 标签，不运行页面脚本：

```python
from html.parser import HTMLParser
from pathlib import Path

class HeadMeta(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_head = False

    def handle_starttag(self, tag, attrs):
        if tag == "head":
            self.in_head = True
        data = dict(attrs)
        if self.in_head and tag == "meta":
            key = data.get("property", "")
            if key.startswith("og:"):
                print(key, "=", data.get("content", ""))

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False

HeadMeta().feed(Path("page.html").read_text(encoding="utf-8"))
```

预期至少能看到四个基础属性，并且属于当前文章。还要检查是否输出了重复、冲突的标签。Elements 面板显示的是运行后的 DOM，可以辅助检查，但不能替代这一步。

## 页面能打开为什么图片仍可能失败

页面和图片通常是两次独立的资源请求。页面返回正确，不代表图片也能被另一个读取方获取。图片地址可能过期、需要 Cookie、被防盗链拦截，或实际返回一张访问挑战页面。

```bash
curl -fsSL -D image-headers.txt \
  "https://example.com/images/share-notes-v1.png" \
  -o share-image.png
file share-image.png
```

检查响应链、最终状态、`Content-Type`，并实际打开下载文件。不能只因为文件名是 `.png` 就认定内容真是图片。

| 观察 | 下一步 |
| --- | --- |
| 图片匿名 GET 失败 | 先修 URL、鉴权、对象存储或 CDN 访问规则 |
| HTTP 200 但内容是 HTML | 检查访问挑战、错误页或错误重写 |
| 图片确实可读，但卡片仍缺图 | 查看访问日志与实际客户端结果，继续排查平台或缓存条件 |
| 只有部分入口异常 | 保持页面不变，对照分享入口和客户端版本 |

这一步证明的是当前测试请求可用，不能证明微信的所有读取链路都已成功。没有请求日志和客户端证据时，不应仅凭灰色缩略图断定某一个原因。

## JS-SDK 的调用时序

需要主动配置微信网页分享内容时，先确认账号具有相应接口权限，并配置符合要求的 **JS 接口安全域名**。加载 SDK、完成 `wx.config` 验证后，在 `wx.ready` 中设置分享内容。[微信 JS-SDK 官方文档](https://developers.weixin.qq.com/doc/subscription/guide/h5/jssdk.html)

![微信 JS-SDK 签名时序图，从页面 URL、服务端票据缓存到 wx.config、wx.ready 和分享数据设置](/imgs/learning-notes/wechat-sdk-sequence.svg)

[查看大图](/imgs/learning-notes/wechat-sdk-sequence.svg) · [Mermaid 源码](/diagrams/learning-notes/wechat-sdk-sequence.mmd)

读图时先划清数据所在的位置：

| 数据 | 所在位置与用途 |
| --- | --- |
| `appId` | 标识公众号，可出现在前端配置 |
| `appSecret` | 后端凭据，用于服务端获取访问凭证 |
| `access_token` | 后端调用微信服务端接口的凭证 |
| `jsapi_ticket` | 后端计算 JS-SDK 签名的临时票据 |
| `nonceStr`、`timestamp`、`signature` | 后端生成，返回前端交给 `wx.config` |
| 页面 URL | 参与签名，必须对应调用接口的页面 |

前端向自己的后端请求配置；后端持有并缓存 token 和 ticket，再返回签名参数。不要把凭据放进前端环境变量、静态 HTML 或浏览器请求中。对于纯静态博客，这意味着要接入这一流程，还需要一个服务端签名端点，仅增加静态脚本不能代替它。

图中“缓存并合并并发刷新”是实现建议：有效票据直接复用；临近过期时刷新；多个请求同时到达时，由一次刷新服务它们。有效期应依据接口的 `expires_in` 管理，并预留余量，而不是每个访客都重新获取票据。多实例部署还需要共享缓存或协调机制，单进程内存缓存不一定够用。

## 签名字符串为什么容易算错

签名使用以下四个字段，按字段名排序后，以原始值拼接，再计算 SHA-1 摘要。这里的 SHA-1 是协议指定的摘要计算，不是把字符串加密后供客户端解密。

```text
jsapi_ticket=TICKET&noncestr=NONCE&timestamp=TIMESTAMP&url=PAGE_URL
```

容易出错的不是哈希函数，而是输入字符串：

- 参与签名的键名是小写 `noncestr`，返回给 `wx.config` 的字段名则是 `nonceStr`。
- `timestamp` 通常用 Unix 秒值，签名与前端配置必须使用同一个值；随机串也必须一致。
- URL 去掉 `#` 及其后面的片段，保留路径和查询参数；不要擅自调整参数顺序、解码后重编码或补删尾部斜杠。
- 拼接签名原文时不要再做一层 URL 编码。请求传输中的编码与参与哈希的字符串是两回事。

例如，页面地址是 `https://example.com/posts/share-notes?from=menu&v=2#demo`，签名 URL 应保留 `?from=menu&v=2`，去掉 `#demo`。给旧 URL 算出的签名，不能直接复用给新增查询参数后的地址。[官方签名算法与常见错误](https://developers.weixin.qq.com/doc/subscription/guide/h5/jssdk.html)

下面是服务端 Node.js 的教学函数，只演示 URL 校验与签名，不包含票据获取、缓存和 HTTP 路由。`ticket` 来自服务端缓存，`nonceStr` 与 `timestamp` 由后端生成：

```javascript
import { createHash } from "node:crypto";

export function signPage({ pageUrl, ticket, nonceStr, timestamp }) {
  const url = pageUrl.split("#")[0];
  const parsed = new URL(url);
  if (parsed.origin !== "https://example.com" || parsed.username || parsed.password) {
    throw new Error("只为本站页面签名");
  }

  // 仅用 URL 对象校验；哈希仍使用收到的原始 URL 字符串。
  const raw = [
    `jsapi_ticket=${ticket}`,
    `noncestr=${nonceStr}`,
    `timestamp=${timestamp}`,
    `url=${url}`
  ].join("&");

  return createHash("sha1").update(raw, "utf8").digest("hex");
}
```

接成真实端点时，需要限制可签名的站点和路径、校验输入、处理票据失效，并返回与这次签名一致的参数。缓存的票据可以用于多个页面，但**某个页面的签名不能不分 URL 地套用到所有页面**。

还要区分三个经常被混用的 URL：

| URL | 表示什么 | 本例 |
| --- | --- | --- |
| 当前页面签名 URL | 当前执行 JS 接口的页面地址，不含片段 | `https://example.com/posts/share-notes?from=menu&v=2` |
| 分享 `link` | 希望接收方打开的目标地址，需要满足安全域名要求 | `https://example.com/posts/share-notes` |
| `og:url` | 页面在 Open Graph 中的规范标识 | `https://example.com/posts/share-notes` |

后两者可以保持稳定，不代表签名时就可以丢掉当前页面的查询参数。SPA 切换路由时还要检查页面地址、所用签名和分享内容是否同步更新；排错时记录真实客户端参与验证的 URL，不要只看应用内部的路由变量。

## 验证通过后再设置分享内容

在页面加载官方 SDK 后执行初始化。下面示例假设自己已经实现 `POST /api/wechat/signature`，请求正文为 `{ url }`，响应包含 `appId`、`timestamp`、`nonceStr`、`signature`；这个端点并不是微信提供给浏览器直接调用的接口。

```html
<script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
```

```javascript
async function initWechatShare() {
  const url = window.location.href.split("#")[0];
  const response = await fetch("/api/wechat/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });
  if (!response.ok) throw new Error("签名配置获取失败");
  const signed = await response.json();

  const share = {
    title: "微信分享学习笔记",
    link: "https://example.com/posts/share-notes",
    imgUrl: "https://example.com/images/share-notes-v1.png"
  };

  wx.error(error => console.error("微信配置验证失败", error));
  wx.ready(() => {
    wx.updateAppMessageShareData({
      ...share,
      desc: "理解元数据、签名和分享调用的关系。",
      success: () => console.info("朋友分享内容已设置"),
      fail: error => console.error("朋友分享设置失败", error)
    });
    wx.updateTimelineShareData({
      ...share,
      fail: error => console.error("朋友圈分享设置失败", error)
    });
  });
  wx.config({
    debug: false,
    appId: signed.appId,
    timestamp: signed.timestamp,
    nonceStr: signed.nonceStr,
    signature: signed.signature,
    jsApiList: ["updateAppMessageShareData", "updateTimelineShareData"]
  });
}

initWechatShare().catch(error => console.error("分享初始化失败", error));
```

该示例用于微信内网页，且需要在 SDK 已加载后执行。朋友分享接口包含 `desc`；朋友圈接口使用标题、链接和图片。应在用户可能点击分享之前准备好数据，不能等用户点击菜单时才发异步请求，期待本次分享一定拿到返回值。

`wx.ready` 表示配置验证已经通过；接口的 `success` 表示对应分享信息设置成功。**它们都不代表用户已经发送，更不能当作接收方已收到消息的证明。** 最终验收仍要实际操作分享并检查接收端。[分享接口定义](https://developers.weixin.qq.com/doc/subscription/guide/h5/jssdk.html)

## 用分层证据排查旧卡片和错误

修改后仍看到旧结果，先区分三层缓存：站点或 CDN 返回的 HTML、图片资源缓存，以及平台或客户端可能保留的分享结果。刷新自己的浏览器，最多说明这一次浏览器请求的结果，不能证明其他层全部更新。

建议按顺序记录证据：

| 检查层 | 要保存的证据 | 常见修复方向 |
| --- | --- | --- |
| 线上页面 | 当前 URL 的响应头、初始 HTML、真实 OG 标签 | 检查是否发布了正确构建，刷新站点缓存 |
| 图片 | 图片 GET 的状态、类型与实际内容 | 修正地址或访问规则，为新图片使用新文件名 |
| 签名配置 | 页面 URL、nonce、时间戳、客户端具体错误 | 比对 URL 字符串、配置值、票据和权限 |
| SDK 设置 | `wx.ready`、设置接口的成功或失败结果 | 检查调用时机、接口列表与数据内容 |
| 分享结果 | 相同入口的接收端截图及落地地址 | 对照版本、入口与资源变化，不靠猜测归因 |

日志中不应记录 appSecret、token 或完整 ticket。签名失败时，可以比较前后端使用的 URL、nonce 和时间戳，并在受控服务端检查票据来源。

给页面添加 `?v=2` 可以作为实验变量，但不是微信缓存清除协议；加 `#v2` 也不会让服务器收到一个带新查询参数的资源请求。修改图片时，用 `share-notes-v2.png` 这样的新路径更容易区分新旧资源，但最终是否采用新图片仍要检查实际结果。

## 做一组能复盘的对照实验

不要一次改变标题、图片、URL、手机和入口，否则结果变化后无法判断是哪项起作用。可以在同一台设备、同一个微信版本下做下面的实验：

| 轮次 | 只改变的条件 | 观察重点 |
| --- | --- | --- |
| A | 同一 URL，分别发送文本与从网页菜单分享 | 消息类型是否与入口有关 |
| B | 同一页面，确认初始 HTML 中的标题已更新 | 接收端是否仍显示旧标题 |
| C | 保持页面地址，图片换新文件名并更新引用 | 接收端是否采用新图 |
| D | SDK 验证通过后，为两种分享接口设置不同标题 | 哪个入口采用了哪套设置 |
| E | 保持正确配置，再换系统或微信版本 | 差异是否只出现在特定客户端 |

每轮保存测试时间、完整 URL、头部元数据、SDK 状态和接收端结果。得到这些证据后，才能把“站点输出不对”“签名不匹配”“资源不可读”和“入口表现不同”分开处理。

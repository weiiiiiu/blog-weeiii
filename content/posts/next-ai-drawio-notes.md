---
title: 用 Next AI Draw.io 和 AI 协作画流程图
date: 2026-11-21T03:40:41-08:00
categories: AI
tags:
  - AI
  - MCP
  - Draw.io
  - 流程图
description: 用组件图和编辑时序图拆解 Next AI Draw.io，学习 stdio 与浏览器通道、mxCell 节点、原子编辑、冲突处理和文件导出。
draft: false
---

> 原文链接：[AI 绘图工具介绍](https://mp.weixin.qq.com/s/a5Bm1VeQ40pxkxTX-fHjZw)

让 AI 画一张图，难点不只在第一版。人把一个框拖走后，AI 下一轮还能保留这个位置吗？“把这个框改名”怎样定位到正确节点？画布已经变了，为什么磁盘里的源文件仍然是旧版？

沿着原文演示的一次局部编辑追踪数据，可以理解两个问题：**自然语言怎样变成可编辑的图，以及人和 AI 怎样在同一份文档上继续修改。**

本文讨论 MCP 使用方式。工具行为对照 [Next AI Draw.io 源码快照 `9534a668`](https://github.com/DayuanJiang/next-ai-draw-io/tree/9534a668e3bd53f9c08aa5b8d2d77f409ccd09d4/packages/mcp-server)；示例用于理解协议和数据结构，不把源码推导当成一次实际绘图实测。后续版本的参数应以客户端发现的工具定义为准。

## 从组件图看清谁负责什么

![Next AI Draw.io 组件图，区分 MCP 标准输入输出、本地 HTTP 预览、浏览器画布和归档文件](/imgs/learning-notes/drawio-architecture.svg)

[查看大图](/imgs/learning-notes/drawio-architecture.svg) · [Mermaid 源码](/diagrams/learning-notes/drawio-architecture.mmd)

图中有两条容易混淆的通道。**AI 客户端到 MCP 服务走 stdio；浏览器到预览服务走本地 HTTP。** 它们服务于同一个绘图会话，但协议和用途不同。

| 组件 | 输入与职责 | 可以观察的结果 |
| --- | --- | --- |
| AI 客户端与模型 | 理解需求，根据工具定义组织参数，读取工具结果后继续推理 | 要调用哪个工具、修改哪个节点 |
| MCP 子进程 | 校验参数、维护当前 XML、应用编辑、保存历史 | 工具成功或错误结果、文档状态 |
| 本地 HTTP 服务 | 将会话状态与浏览器连接起来 | 会话预览地址、状态同步请求 |
| 浏览器中的 draw.io | 渲染文档、响应拖动和选区、生成图片 | 当前画布、选中节点、导出图像 |
| 项目文件 | 保存需要长期维护或展示的产物 | `.drawio` 源文件、SVG 或 PNG |

stdio 模式下，客户端启动工具子进程，通过标准输入发送 JSON-RPC 消息，通过标准输出接收结果。普通诊断日志应走标准错误输出，避免混入协议消息。这里浏览器的 HTTP 地址不能直接当作这个 MCP 服务的远程连接地址。[MCP 传输规范](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)

浏览器可以回传人工修改，服务也可以把新 XML 同步给浏览器。因此，AI 并不是一直对着最初那张图片“修图”；它操作的是有节点、边、页面和坐标的结构化文档。[服务入口与状态处理](https://github.com/DayuanJiang/next-ai-draw-io/blob/9534a668e3bd53f9c08aa5b8d2d77f409ccd09d4/packages/mcp-server/src/index.ts)

## 接入后先验证工具和会话

在装有 Node.js、npx 和 Codex CLI 的环境中，可以添加 MCP 服务：

```bash
codex mcp add drawio -- npx @next-ai-drawio/mcp-server@latest
codex mcp list
```

`mcp list` 用来确认配置存在。它不等于已经成功生成图。进入一个能加载该配置的 Codex 会话后，还需要完成工具发现和会话启动。要固定团队环境，可在验证某个版本后将 `@latest` 换成明确版本号。[项目接入说明](https://next-ai-drawio.jiang.jp/en/mcp)、[Codex MCP 配置](https://developers.openai.com/codex/mcp)

可以把启动后的验收拆成三步：

1. 客户端能列出 `start_session`、`get_diagram`、`edit_diagram` 等工具，说明服务提供了可发现的能力。
2. 调用 `start_session` 获得会话标识和完整浏览器 URL，说明已创建或恢复绘图会话。打开返回的完整链接，保留其中参数。
3. 创建简单图形，再读取 XML 并检查浏览器，确认工具调用、状态保存和画布显示都正常。

MCP 中，`tools/list` 返回工具名称、说明和输入结构；`tools/call` 请求执行某个工具。客户端负责把这些能力提供给模型，模型再根据需求选择调用。知道“工具存在”和看到“本次调用成功”是两个不同的检查点。[MCP 工具规范](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)

## 图形实际保存成什么

先看一个最小例子：两个矩形框，“编写文章”和“发布”，中间一条箭头。下面是未压缩的 draw.io XML 示意，展示节点和边的关系：

```xml
<mxfile>
  <diagram id="blog-flow" name="发布流程">
    <mxGraphModel>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="write" value="编写文章"
                vertex="1" parent="1"
                style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#111111;">
          <mxGeometry x="80" y="80" width="160" height="60" as="geometry" />
        </mxCell>
        <mxCell id="publish" value="发布"
                vertex="1" parent="1"
                style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#111111;">
          <mxGeometry x="320" y="80" width="160" height="60" as="geometry" />
        </mxCell>
        <mxCell id="write-to-publish" edge="1" parent="1"
                source="write" target="publish"
                style="edgeStyle=orthogonalEdgeStyle;endArrow=block;">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

读这段结构时，先找三个东西：

- **身份**：`id` 是节点标识。文字 `value` 可以重复，不能凭文字唯一定位节点。
- **几何**：`mxGeometry` 记录位置和尺寸。修改名称时保留它，才能维持布局。
- **关系**：边通过 `source` 和 `target` 引用节点 ID。把节点换成新 ID，却不维护引用，可能破坏连线关系。

`0` 和 `1` 在这个例子中构成根与默认图层。一个文档还可以包含多个 `<diagram>` 页面；同一句“修改发布框”，必须同时明确页面和节点。

该版本的 MCP 工具还支持紧凑写法：把图形几何表示为 `mxCell` 上的 `x`、`y`、`w`、`h`，工具再展开成标准结构。**紧凑写法是这个工具的输入约定，不应据此认为所有 draw.io 文件都直接这样保存。** [节点展开实现](https://github.com/DayuanJiang/next-ai-draw-io/blob/9534a668e3bd53f9c08aa5b8d2d77f409ccd09d4/packages/mcp-server/src/compact-cells.ts)

## 一次局部修改怎样完成

假设人已经拖动“发布”框并选中它，然后要求 AI 改为“提交并发布”，保留位置和连线。

![Draw.io 局部编辑时序图，展示读取选区、同步 XML、检查状态、原子修改与结果验收](/imgs/learning-notes/drawio-edit-sequence.svg)

[查看大图](/imgs/learning-notes/drawio-edit-sequence.svg) · [Mermaid 源码](/diagrams/learning-notes/drawio-edit-sequence.mmd)

这张时序图有两个读取动作，作用不同。`get_selection` 回答“用户指的是谁”，返回选中节点及所在页面的信息；`get_diagram` 回答“当前文档长什么样”，会尝试让浏览器同步最新 XML。如果浏览器没有响应，返回值可能带有状态过旧的提示，不能把它当作已确认最新的画布。

知道节点当前完整状态后，再提交编辑。以下仅展示 `edit_diagram` 的**参数对象**，假设已读取上面那张图，且节点坐标仍然是示例值。实际操作应使用刚刚读到的坐标和完整样式：

```json
{
  "page_id": "blog-flow",
  "operations": [
    {
      "operation": "update",
      "cell_id": "publish",
      "new_xml": "<mxCell id=\"publish\" value=\"提交并发布\" vertex=\"1\" parent=\"1\" style=\"rounded=1;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#111111;\" x=\"320\" y=\"80\" w=\"160\" h=\"60\"/>"
    }
  ]
}
```

**`update` 替换的是整个节点，不是只合并传入字段。** 所以不能只发送一个新 `value` 就期待其他属性自动保留。源码会检查部分缺失几何的错误，但调用方仍应完整保留需要留下的属性；复杂节点还可能带有父容器、自定义数据和包装元素。[编辑参数与校验实现](https://github.com/DayuanJiang/next-ai-draw-io/blob/9534a668e3bd53f9c08aa5b8d2d77f409ccd09d4/packages/mcp-server/src/edit-diagram.ts)

还有三个边界影响局部编辑的准确性：

| 情况 | 正确处理 | 原因 |
| --- | --- | --- |
| 多页文档 | 读取页面信息，显式传入页面选择参数 | 该版本省略选择参数时编辑第一页，不必然是屏幕当前页 |
| 只知道选区摘要 | 必要时再读取完整 XML | 摘要不能代替节点完整结构 |
| 选区接口失败 | 检查预览是否打开及其实现，再按 ID 明确目标 | 选区读取依赖支持该能力的预览界面，不能猜测“这个框” |

修改成功后要做两种验收：读取结构确认 ID、坐标与连线关系；查看画布或截图确认文字未溢出、箭头未穿过节点。XML 合法只能证明结构可以被处理，不能证明图已经好读。

## 人和 AI 同时修改时会发生什么

设 AI 读取到状态 A，接着人在浏览器把节点拖成状态 B。如果 AI 仍基于 A 提交完整节点，它可能把新位置覆盖回去。

该源码版本会记录模型已见的文档状态，编辑前将它与服务已收到的当前状态比较。发现未见过的人工变化时，拒绝本次修改，并在错误结果中提供当前 XML。AI 应据此重建操作，再重试。这是一种防止基于旧状态覆盖新修改的检查；它不等于多人实时协同中的自动合并。[状态检查实现](https://github.com/DayuanJiang/next-ai-draw-io/blob/9534a668e3bd53f9c08aa5b8d2d77f409ccd09d4/packages/mcp-server/src/edit-gate.ts)

可以用下面的状态推演理解它：

```text
AI 读到 A：publish.x = 320
人改成 B：publish.x = 460，并同步给服务
AI 基于 A 提交改名：保留了旧坐标 320
服务拒绝：当前状态已变化，本次不写入
AI 基于 B 重建操作：改名，同时保留坐标 460
服务检查通过后写入 C
```

这里有两个不同保证：**状态检查**避免用已知过旧的基线修改；**原子应用**保证一批操作只要有一项无效，就不写入这批操作，避免只改了一半。浏览器修改的传输仍存在时序，因此收到同步警告或冲突提示时，要先查看当前结果，不能无限重放旧参数。

也不必机械地在每一次调用前都读取整张图。AI 刚创建或修改完文档，且状态没有变化时，可以继续编辑。需要优先读取的场景是：导入陌生文件、恢复未知版本、用户刚手改、或者已经收到冲突提示。

## 恢复版本和保存文件要分开理解

“恢复上一版”与“只恢复上一版的位置”是两种操作。`restore_version` 会把历史文档状态放回画布，同时保留被替换的当前状态以便再恢复。它不是按属性进行三方合并的工具。[版本恢复实现](https://github.com/DayuanJiang/next-ai-draw-io/blob/9534a668e3bd53f9c08aa5b8d2d77f409ccd09d4/packages/mcp-server/src/index.ts)

例如，上一版布局正确，这一版文字正确。直接回退会连文字一起回退。要保留新文字，需要比较两个状态，再明确应用“旧几何 + 新文字”的节点编辑，或先恢复旧版，再重做已经确认的新文字修改。

保存也有三层，不能互相替代：

| 层次 | 保存在哪里 | 用来解决什么 |
| --- | --- | --- |
| 当前会话状态 | MCP 服务与预览画布 | 让人和 AI 接着编辑 |
| 自动保存与历史 | 默认位于用户目录下的 `.next-ai-drawio` | 恢复近期会话；历史与会话数量有保留上限 |
| 显式导出 | `export_diagram` 指定的绝对路径 | 项目归档、版本控制与交付 |

加载已有文件后，画布里的修改不会自动写回那个原始路径。要让项目文件更新，需要显式导出回目标文件。自动保存的内部文件也不宜绕过工具直接修改，否则可能与活动会话状态不一致。[持久化实现](https://github.com/DayuanJiang/next-ai-draw-io/blob/9534a668e3bd53f9c08aa5b8d2d77f409ccd09d4/packages/mcp-server/src/persistence.ts)

`.drawio` 保存可编辑文档；PNG 和普通 SVG 用于展示；`.drawio.svg` 则在 SVG 中保留编辑信息。图片导出需要浏览器参与渲染，可能因预览关闭、标签页暂停或通信失败而超时。看到“XML 编辑成功、PNG 导出失败”，应先检查浏览器渲染与回传通道，不要立即重建整张图。[导出说明](https://github.com/DayuanJiang/next-ai-draw-io/tree/9534a668e3bd53f9c08aa5b8d2d77f409ccd09d4/packages/mcp-server#readme)

## 用博客发布流程做一次练习

先给 AI 一份可以核对的需求，而不是只说“帮我画得专业一点”：

```text
先读取当前仓库的构建与部署配置，再创建“博客文章发布”流程图。
包含：编辑 Markdown、检查元数据、本地构建、推送仓库、线上构建、线上验收。
本地构建失败返回编辑，线上构建失败进入日志排查。
把本地操作和托管平台操作分组，判断分支写清成功与失败。
给主要节点使用稳定且易理解的 ID。
完成后读取图结构并查看截图，检查遗漏分支和连线遮挡。
```

然后逐项验证，而不是把生成第一张图当作练习结束：

1. 手动拖动一个节点，选中它，让 AI 只改名字；检查坐标和相连边是否保留。
2. 加入一个失败分支；检查它是否能回到可执行的步骤，而不是走进死路。
3. 对比一次历史恢复与一次局部修正，观察哪些属性随版本一起变化。
4. 同时导出源文件和展示图片，重新加载源文件，确认节点仍然可编辑。

排查时按症状缩小范围：

| 症状 | 优先检查 |
| --- | --- |
| 工具列表没有 drawio | 客户端配置是否生效，子进程能否启动 |
| 工具调用成功但画布不变 | 是否打开了当前会话链接，预览同步是否正常 |
| 改名后节点跳位 | 是否误把完整替换理解为字段合并，是否使用旧几何 |
| 修改被拒绝 | 阅读错误中的当前 XML，区分状态变化和无效节点操作 |
| 源文件还是旧内容 | 是否完成显式导出，导出目标路径是否正确 |
| SVG 或 PNG 导出超时 | 预览是否可用，浏览器能否完成渲染和回传 |

完成这组练习后，应能沿着“需求 → 工具参数 → XML 状态 → 画布 → 文件”逐层解释一张图的变化，也能判断问题发生在哪一层。

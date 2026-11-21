---
title: DeepSeek Harness 企业使用教程与工单处理流程
date: 2026-11-21T08:51:15-08:00
categories: 开发
tags:
  - DeepSeek
  - AI Agent
  - 企业应用
  - 学习笔记
description: 一张图加八步，讲清 DeepSeek Harness 每一步到底是怎么跑的：调哪个工具、传什么参数、返回什么数据。
draft: false
---

> 项目原文：[DeepSeek Harness 官方仓库](https://github.com/deepseek-ai/deepseek-harness)

## 一句话

DeepSeek Harness 是帮客服办工单的框架：模型想“下一步查什么”，Harness 调工具去查，查完带回来再想下一步。真正开通套餐的是公司的权限服务，不是模型一句话。

本文按 `@deepseek-ai/dsh` 0.2.2-rc.5 写，官方标的是开发者预览，不能当生产软件用。

![一张图看懂：DeepSeek Harness 怎么办工单](/imgs/learning-notes/deepseek-harness-overview.svg)

[查看大图](/imgs/learning-notes/deepseek-harness-overview.svg) · [Mermaid 源码](/diagrams/learning-notes/deepseek-harness-overview.mmd)

## 每一步到底是怎么跑的

下面这张工单全是虚构的演示数据，观察时点固定在 2026-11-21 16:18 UTC。工单 `TK-1001`：租户 `DEMO-CORP`、账号 `ACCT-017`、订单 `ORD-10086`、产品 `TEAM-5`。用户说付了钱，页面还是免费版。

**第 1 步：客服把工单交给 Harness。**

客服输入一句话：“核查 TK-1001 的付款和开通情况，只查不改。”Harness 收到的是这段纯文本任务，再加一条约束：只查不改。没有别的上下文，模型一开始什么都不知道。

**第 2 步：模型决定先查什么。**

Harness 把三样东西拼好发给模型：任务文本、已经查到的结果（第一轮是空的）、能用的工具清单。清单里每个工具都写明了名字、要什么参数、是干嘛的。

模型看完清单，决定先调一个叫 `get_ticket` 的工具，参数是 `ticket_id=TK-1001`。模型输出的不是中文回答，而是一条工具调用：调哪个工具、传什么参数。

**第 3 步：Harness 真的去调工具。**

Harness 拿到模型说的工具调用，先检查：这个工具要不要审批？`get_ticket` 是只读，不用批。然后通过 MCP 或插件连到工单系统，把 `ticket_id=TK-1001` 传过去。

工具返回结果，Harness 把结果原样带回给模型，再跑下一轮。模型不是一次想完所有步骤，是查一步、看一步、再定下一步。

**第 4 步：四个工具，各查各的系统。**

- `get_ticket` 查工单系统，返回：`{ticket_id: TK-1001, order_id: ORD-10086, account_id: ACCT-017, product: TEAM-5}`。这一步只做一件事：把工单里的订单号、账号抠出来，后面查询才有范围。
- `get_order` 查订单系统，参数 `order_id=ORD-10086`，返回：`{status: PAID, paid_at: 16:02:00, refunded: false}`。已支付、未退款，客户截图不能代替这条记录。
- `get_entitlement` 查权限系统，参数 `account_id=ACCT-017, product=TEAM-5`，返回：`{status: INACTIVE}`。权益还是免费版。注意别拿错账号：`ACCT-018` 开通了，不代表 `ACCT-017` 没问题。
- `get_activation_jobs` 查开通任务，返回：`JOB-5002, {status: FAILED, error: 调用权限服务超时}`，在途任务：无。

每个工具背后都是公司接好的一个接口，返回的是结构化数据，不是几句话。模型靠这些字段做判断，不是靠猜。上面这些工具名是举例，公司实际接的时候名字可能不一样，干的事一样。

**第 5 步：模型对照规程做判断。**

模型把四份返回拼起来：订单已付未退款、权益未生效、任务超时失败、无在途任务。再调 `get_runbook` 查到规程 `RB-ENT-001`：付款后等 5 分钟；建议补开通前要确认已付款未退款、权益未生效、没有在途任务。

16:02 到 16:18 已经过了 16 分钟，条件都满足，模型输出建议：按规程提交补开通审批。但这只是建议，模型没有动手，因为“只查不改”的约束还在，补开通是写操作，必须先审批。

**第 6 步：人审批，Harness 停下来等。**

建议挂到审批里，Harness 暂停，等人点批准还是拒绝。审批人看到的是：要对 `ACCT-017` 的 `TEAM-5` 执行补开通，证据就是上面四份查询结果。

批了，Harness 才继续；拒了，任务就停在这里。模型不能自己绕过审批，换个工具偷偷执行。

**第 7 步：补开通，真正执行。**

![付款未开通的处理时序，从查询工单和订单，到审批补开通，再查询实际权益并确认业务结果](/imgs/learning-notes/deepseek-harness-ticket-sequence.svg)

[查看大图](/imgs/learning-notes/deepseek-harness-ticket-sequence.svg) · [Mermaid 源码](/diagrams/learning-notes/deepseek-harness-ticket-sequence.mmd)

审批通过后，Harness 调 `submit_activation`，参数：`tenant_id=DEMO-CORP, account_id=ACCT-017, product=TEAM-5, order_id=ORD-10086`，同时带一个幂等键（直接用 `order_id` 就行）。接口收到重复请求也不会开通两次，防的是同一张工单被点两次、网络超时导致重提。

接口返回一个任务编号，只表示“收到了”，不等于开通成功。

**第 8 步：再查权益，确认真的生效。**

Harness 再调一次 `get_entitlement`，`ACCT-017` 的 `TEAM-5` 变成 `ACTIVE`，才算补开通成功。然后按授权写回工单、发客户通知。

如果还是 `INACTIVE`，就继续查任务状态或升级给人处理，不能直接告诉客户“已经为您开通”。

## 记住一句

模型只动脑，不办事。真正开通套餐的是公司权限服务，不是模型一句话。

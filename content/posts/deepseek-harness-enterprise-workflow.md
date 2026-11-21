---
title: DeepSeek Harness 企业使用教程与工单处理流程
date: 2026-11-21T08:51:15-08:00
categories: 开发
tags:
  - DeepSeek
  - AI Agent
  - 企业应用
  - 学习笔记
description: 用一张已付款未开通的工单，一步步讲清 DeepSeek Harness 是怎么查、怎么判、怎么补开通的。
draft: false
---

> 项目原文：[DeepSeek Harness 官方仓库](https://github.com/deepseek-ai/deepseek-harness)

## 一句话

DeepSeek Harness 是帮客服办工单的框架：模型想“下一步查什么”，Harness 调工具去查，查完带回来再想下一步。真正开通套餐的是公司的权限服务，不是模型一句话。

本文按 `@deepseek-ai/dsh` 0.2.2-rc.5 写，官方标的是开发者预览，不能当生产软件用。

![一张图看懂：DeepSeek Harness 怎么办工单](/imgs/learning-notes/deepseek-harness-overview.svg)

[查看大图](/imgs/learning-notes/deepseek-harness-overview.svg) · [Mermaid 源码](/diagrams/learning-notes/deepseek-harness-overview.mmd)

## 例子：付了钱，还是免费版

工单 `TK-1001`：租户 `DEMO-CORP`、账号 `ACCT-017`、订单 `ORD-10086`、产品 `TEAM-5`。用户说付了钱，页面还是免费版。下面全是虚构的演示数据，观察时点固定在 2026-11-21 16:18 UTC。

**第 1 步：查订单，到底付没付。** `ORD-10086` 已支付（16:02 UTC）、未退款，归属 `ACCT-017` / `TEAM-5`。客户截图、工单标题都不能代替订单系统记录。

**第 2 步：查权益，现在到底开通没。** `ACCT-017` 的 `TEAM-5` 权益是 `INACTIVE`，还是免费版。别拿错账号：`ACCT-018` 开通了，不代表 `ACCT-017` 没问题。

**第 3 步：沿时间线找断在哪。**

| 时间 | 发生了什么 |
| --- | --- |
| 16:02:00 | 订单支付成功 |
| 16:02:03 | 支付回调已收到 |
| 16:02:04 | 开通任务 `JOB-5002` 开始 |
| 16:02:34 | 调权限服务超时，任务失败 |
| 16:18:00 | 权益仍未生效，也没有在途任务 |

断在“支付回调之后的开通环节”。但这只能说明断在哪，不能证明根因，网络问题、下游繁忙、响应丢了都会表现为超时。不要把一次超时写成“权限数据库损坏”。

**第 4 步：对照规程，看能不能建议补开通。** 规程 `RB-ENT-001`：付款后等 5 分钟；建议补开通前要确认已付款未退款、权益未生效、没有在途任务，还要有人审批。16:02 到 16:18 已经过了 16 分钟，可以提建议了。但“可以建议”不等于“已经批准执行”。

**第 5 步：给客服一份能核对的报告。**

> **结论：** 截至 16:18 UTC，ORD-10086 已支付未退款，ACCT-017 的 TEAM-5 权益尚未生效。
>
> **断在哪：** 支付回调已收到，最近一次开通任务 JOB-5002 调权限服务超时，现在没有在途任务。
>
> **证据：** orders:ORD-10086、entitlements:ACCT-017:TEAM-5、jobs:JOB-5002、events:EV-002、events:EV-004。
>
> **建议：** 按 RB-ENT-001 提交补开通审批；执行前再查一次订单、退款、权益和在途任务。
>
> **还没做的事：** 没执行补开通，没证明根因，没发客户通知。

## 批了之后，怎么真把开通做完

![付款未开通的处理时序，从查询工单和订单，到审批补开通，再查询实际权益并确认业务结果](/imgs/learning-notes/deepseek-harness-ticket-sequence.svg)

[查看大图](/imgs/learning-notes/deepseek-harness-ticket-sequence.svg) · [Mermaid 源码](/diagrams/learning-notes/deepseek-harness-ticket-sequence.mmd)

五件事，一句话一个：

1. 批的是哪个动作要写清楚，订单、账号、产品、操作、证据都在审批里。
2. 动手前再查一遍，后台可能已经自动补成功了，或者订单刚退款。
3. 接口自己要防重复，不能靠模型保证“我只调一次”。
4. “受理了”不等于“办完了”，还得查权益到底生效没有。
5. 只有正确账号、正确产品的权益真的生效了，才算补开通成功。

## 记住一句

模型只动脑，不办事。真正开通套餐的是公司权限服务，不是模型一句话。

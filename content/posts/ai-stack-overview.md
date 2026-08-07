---
title: 近年 AI 应用技术串讲｜从 Transformer 到 Agent、Skill、Harness
date: 2026-08-03 20:00:00
categories: AI
tags:
  - AI
  - Agent
  - LLM
description: 按演进顺序把 LLM、RAG、Function Calling、MCP、Agent、Context Engineering、Agent Skill 到 Harness Engineering 串成一条线，每个概念配官方文档与原始论文。
---

这两年 AI 应用层的新词冒得太快，很多概念是层层叠加出来的——不按顺序看容易糊成一团。这里按**演进顺序**串一遍，每节先用两三句说清是什么，再附原始论文和官方文档。

---

## 1. LLM

Transformer 架构的提出奠定了大模型时代的基础，使基于注意力机制的生成模型成为主流。目前最主流的是 **Decoder-Only**（仅解码器）的 Transformer 架构变体。

![大模型演进树](https://fastly.jsdelivr.net/gh/weiiiiiu/pa-charts@master/img/ai-overview/llm-tree.png)

- 原始论文：[Attention Is All You Need](https://arxiv.org/abs/1706.03762)

## 2. Prompt Engineering（提示词工程）

提示词是用来引导模型按特定意图生成输出的输入指令，主要分「系统提示词」和「用户提示词」。

提示词工程通过设计和优化提示词，让模型更准确、可控地产出所需结果。**它不改变模型的参数**，是一种低成本调优手段——这也是它和微调的本质区别。

- [提示词工程笔记](https://www.aneasystone.com/archives/2024/01/prompt-engineering-notes.html)

## 3. Fine-tuning（微调）

在已有模型基础上用特定数据再训练，让模型更适合某个具体任务或场景。

和提示词工程相反，**微调要动模型参数**。LoRA 的思路是只训练少量低秩参数，把训练成本大幅降下来。

- 原始论文：[LoRA: Low-Rank Adaptation of Large Language Models](https://arxiv.org/abs/2106.09685)

## 4. RAG（检索增强生成）

先从外部知识库检索相关信息，再结合这些信息一起生成回答，以此提升准确性和知识时效性。

- 原始论文：[Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)

## 5. Function Calling（函数调用）

让模型按约定格式输出调用指令，再由外部系统真正去执行具体操作。

这一步的意义是：**模型从「只会说话」变成「会调用工具」**。

- 官方文档：[OpenAI · Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- 官方文档：[Claude · Tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)

## 6. MCP（Model Context Protocol）

一种标准化协议，让模型以统一方式连接外部工具、数据源和服务，获取上下文并执行操作。

MCP 最重要的贡献之一是**让工具可以跨 AI 应用复用**，从而推动社区生态。在它之前，每个应用的工具接入方式都是各写各的。

- 官方文档：[Model Context Protocol · 入门](https://modelcontextprotocol.io/docs/getting-started/intro)

## 7. Agent

能基于目标进行「思考 → 行动 → 观察」循环、自主调用工具完成复杂任务的智能系统。

Agent 本质上是对人类工作方式的模拟。**最简形态就是「提示词 + LLM + Tools」**。

- 原始论文：[ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- 官方工程博客：[Anthropic · Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- 官方工程博客：[Anthropic · Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Agent 设计模式概览（Medium）](https://medium.com/binome/ai-agent-workflow-design-patterns-an-overview-cf9e1f609696)
- [tw93：Agent 是什么](https://tw93.fun/2026-03-21/agent.html)

## 8. Multi-Agent

由多个分工协作的 Agent 共同完成任务，通过**拆分任务**与**隔离上下文**来解决单 Agent 难以处理的复杂问题。

需要谨慎使用——Token 消耗大、协作效率低、系统复杂度高都是现实代价。不是所有任务都值得上多智能体。

- 官方文档：[Claude · 何时以及如何使用多智能体系统](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)
- 官方工程博客：[Anthropic · 多智能体研究系统](https://www.anthropic.com/engineering/multi-agent-research-system)

## 9. Context Engineering（上下文工程）

Agent 运行时需要提供给 LLM 的一切相关信息——对话历史、用户输入、背景知识、工具结果——都是上下文。

上下文工程关注**如何筛选、压缩和组织上下文**，从而最大化模型的决策与推理能力。可以理解为提示词工程在 Agent 时代的延伸：要管的不再只是一段提示词，而是整个信息流。

- 官方工程博客：[Anthropic · Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [LangChain · Context Engineering for Agents](https://blog.langchain.com/context-engineering-for-agents/)

## 10. Agent Skill

一种轻量级开放格式，把一整套 Agent 能力（提示词、工具脚本、知识文件等）**封装成可复用模块**，实现低门槛分享与复用。

几个要点：

- Agent Skill 本质上约等于一个子 Agent
- 特别适合 SOP 的沉淀与复用（*离职的同事终将化作温暖的 Skill*）
- Agent 会在运行中**按需激活**不同 Skill、按需读取包内文件，即所谓「渐进式披露」

- 官方文档：[Claude · Agent Skills 概览](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- 官方工程博客：[Anthropic · Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- 社区：[agentskills.io](https://agentskills.io/home)

## 11. OpenClaw

开源、高可扩展的 AI Agent 框架，基于 TypeScript 开发，核心用途是构建可自定义的私人 AI 助手。创新之一是**拓展了 Agent 的交互入口**（飞书等）。

- OpenClaw 源码量很大，想快速理解可以先看精简版实现：[HKUDS/nanobot](https://github.com/HKUDS/nanobot)

## 12. Harness Engineering

强调通过构建**受控环境**，让 Agent 在约束下高效可靠地完成长周期复杂任务。包含围绕 Agent 构建约束机制、反馈回路、可靠上下文等一系列工程实践。

- 官方文章：[OpenAI · 在智能体优先的世界中利用 Codex](https://openai.com/zh-Hans-CN/index/harness-engineering/)

---

## 附：Claude Code 相关源码

官方未开源，以下是社区的逆向 / 分支实现，可用于理解其内部结构：

- [instructkr/claw-code](https://github.com/instructkr/claw-code)
- [hesreallyhim/claude-code-fork](https://github.com/hesreallyhim/claude-code-fork)
- [视频讲解](https://www.youtube.com/watch?v=DXTS82fJO9A)

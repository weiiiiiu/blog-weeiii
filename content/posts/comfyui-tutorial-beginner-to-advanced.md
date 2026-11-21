---
title: ComfyUI 教程：从新手到进阶
date: 2026-11-22T02:05:00+08:00
categories: 开发
tags:
  - ComfyUI
  - AI 绘画
  - 学习笔记
description: 从安装、第一张图，到 LoRA、ControlNet、高清放大的完整路线，每一步都写清点哪、填什么。
draft: false
---

> 官方文档：[ComfyUI 官方文档](https://docs.comfy.org/zh/) · 官方下载：[comfy.org/download](https://comfy.org/download)

## 一句话

ComfyUI 是在自己电脑上跑 AI 画图的工具。加载模型、写提示词、采样、存图，每一步都是一个节点，用线连起来就是一条工作流。搭好一次，以后反复用，别人分享的工作流拿来就能跑。

## 第一步：装好

新手只装桌面版，别手搓环境。去 [comfy.org/download](https://comfy.org/download) 下安装包（写这篇时最新是 1.1.9），双击装好，第一次启动选**本地运行**，同意条款，勾选快速安装，等 Python 和依赖下载完就行。装好后在浏览器打开 `http://127.0.0.1:8188`，就是 ComfyUI 的画布。

电脑要求：Windows 10/11 64 位或 macOS 13 以上（苹果芯片），内存最低 8GB、推荐 16GB，有 NVIDIA 或 AMD 独显最好，没有也能跑，就是慢。

另外两条路知道就行：便携版是解压即用的文件夹（`ComfyUI_windows_portable_nvidia.7z`，运行 `run_nvidia_gpu.bat`）；手动安装是 `git clone` 官方仓库再装依赖，适合 Linux 和想折腾的人。

## 第二步：跑通第一张图

打开后默认就有一条连好的文生图工作流，7 个节点：

![ComfyUI 默认文生图工作流：加载底模型、写提示词、定画布、采样去噪、解码存图](/imgs/learning-notes/comfyui-basic-workflow.svg)

[查看大图](/imgs/learning-notes/comfyui-basic-workflow.svg) · [Mermaid 源码](/diagrams/learning-notes/comfyui-basic-workflow.mmd)

每个节点只干一件事：

- **Load Checkpoint（加载底模型）**：选一个模型文件。它一次吐出三样东西：MODEL（去噪的模型）、CLIP（把提示词翻成模型能懂的向量）、VAE（潜空间和图片之间互相转换）。
- **CLIP Text Encode ×2（写提示词）**：两个节点，一个写正向提示词（想要什么），一个写负向提示词（不要什么）。
- **Empty Latent Image（定画布）**：空白画布，宽高在这里设。SD1.5 用 512×512。
- **KSampler（采样器）**：核心。拿模型、提示词和画布，一步步把噪声变成图。
- **VAE Decode（解码）**：把采样器出的潜空间数据转成真正的图片。
- **Save Image（存图）**：显示图片，存到 `ComfyUI/output` 文件夹。

模型要自己下一个：SD1.5 的 `v1-5-pruned-emaonly-fp16.safetensors`（约 4GB），放到 `ComfyUI/models/checkpoints/` 里，回到 Load Checkpoint 节点选中它。然后正向提示词写一句英文，比如 `a beautiful sunset over the ocean, cinematic lighting`，负向写 `low quality, blurry, watermark`，按 `Ctrl + Enter`（或点 Queue），第一张图就出来了。

顺带记两个数：KSampler 的 `steps`（去噪步数）先设 20–30，`CFG`（提示词听话程度）先设 7。`seed` 是随机种子，同一组提示词 + 同一个种子，出同一张图。

## 第三步：模型去哪下、放哪

模型不随安装附带，都要自己下。常去的两个地方：Hugging Face（官方模型）和 Civitai（社区模型、LoRA、别人分享的工作流）。下载前看清模型是给哪个底座用的，SD1.5 的 LoRA 不能给 SDXL 用。

放对目录，ComfyUI 才能认出来：

| 文件 | 放哪里 |
| --- | --- |
| 底模型 checkpoint | `models/checkpoints/` |
| LoRA | `models/loras/` |
| ControlNet | `models/controlnet/` |
| 放大模型 | `models/upscale_models/` |
| VAE | `models/vae/` |

放错目录，节点里就选不到这个文件。工作流里缺模型时节点会变红框，点开能看到缺哪个文件。

## 进阶一：LoRA 叠风格

LoRA 是打在底模型上的小补丁，几百 MB 就能教会模型一种画风、一张脸、一类物件。用法就两步：

![ComfyUI 进阶接线：LoRA、ControlNet、高清放大分别插在工作流的哪个位置](/imgs/learning-notes/comfyui-advanced-workflow.svg)

[查看大图](/imgs/learning-notes/comfyui-advanced-workflow.svg) · [Mermaid 源码](/diagrams/learning-notes/comfyui-advanced-workflow.mmd)

1. 加一个 `LoraLoader` 节点，串在 Load Checkpoint 和 KSampler 之间的模型连线上，选中 LoRA 文件。
2. 在正向提示词里写上这个 LoRA 的触发词（模型页面会标出来）。

强度 `strength` 从 0.6–0.9 起手，1.0 容易把底模型的风格冲坏。多个 LoRA 可以首尾相接串起来叠加，风格和角色各挂各的。

## 进阶二：ControlNet 控构图

文字说不清“左臂抬起 37 度”，一张姿态骨架图说得清。ControlNet 就是拿一张参考图去约束构图。用法也是两步：

1. **预处理**：把参考图转成控制图。Canny 抠轮廓、Depth 抠深度、OpenPose 抠姿态，三个最常用。
2. **Apply**：把控制图经 `ControlNetApply` 节点注进 KSampler。

注意 `ControlNetApply` 不会替你做预处理，直接喂原始照片进去效果很差。强度 0.5–0.8 最自然。多个 ControlNet 可以一起上，一个管姿态、一个管边缘，约束按权重叠加。

## 进阶三：高清放大

想把图放大还不糊，别直接拉大分辨率。两段式：先正常出图，再放大精修。

1. KSampler 出一张中等分辨率的图。
2. 放大到目标尺寸（Upscale Image 节点，或 Latent 放大潜空间）。
3. VAE Encode 回潜空间，接 Tile ControlNet（强度约 0.6），再走一遍 KSampler，但 `denoise` 调到 0.3–0.5。

denoise 是关键：太高等于重画一张，构图会跑掉；0.3–0.5 是在原图上补细节，构图不丢，清晰度直接上去。

## 常见坑

- **节点红框**：缺自定义节点。装 ComfyUI-Manager，点 Install Missing Custom Nodes 一键补齐。
- **模型选不到**：放错目录，对照上面的表检查。
- **出图黑屏或报错**：先看是不是显存不够，尺寸改小（比如 512×512）再试；再看模型和节点是不是配套的版本。
- **别人分享的工作流打不开**：ComfyUI 生成的每张 PNG 里都存着完整工作流，把图拖回画布就能还原整条工作流。JSON 文件也一样，拖进去就行。

## 再往前

- **SDXL**：用法和 SD1.5 完全一样，只有一点不同，画布必须给到 1024×1024 的同像素量（比如 896×1152）。
- **Flux.2**：2025 年 11 月发布的 32B 模型，当前开源画质上限，但门槛也高，文本编码器换成了 `mistral_3_small`，fp8 版就要 18GB，消费级显卡跑起来比较吃力。先把 SD1.5 / SDXL 玩熟再碰它。

路线就一句话：桌面版装好 → 默认工作流出第一张图 → LoRA 换风格 → ControlNet 控构图 → 放大出高清。每一步都是在同一条工作流上加节点，不用重学。

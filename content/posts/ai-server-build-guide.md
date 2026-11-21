---
title: AI 服务器搭建学习笔记
date: 2026-11-22T02:10:00+08:00
categories: 开发
tags:
- AI 服务器
- vLLM
- 模型部署
- 学习笔记
description: 从硬件术语、装机到 vLLM 部署、优化的完整学习笔记，走 4×V100 32GB 的数据中心卡路线。
draft: false
---

> 这是 2026 年 10 月整理的学习笔记：从硬件术语、装机教程，到模型参数测算、部署、优化、安全、RAG、量化、微调，全部讲细。不针对任何预算，走的是数据中心卡路线。

> ⚠️ **V100 用户必读**：V100 是 sm_70（Volta），**AWQ 量化在 vLLM 里不支持**（要求 sm_75+，启动直接报错）；GPTQ 可用但高速 Marlin 核需 sm_80+，V100 只能用标准核；**FP16 是 V100 上最稳、往往也是最快的选择**；vLLM V1 引擎需 sm_80+，V100 自动用 V0 引擎；FlashAttention2 不可用，必要时加 `--enforce-eager`；必须 `--dtype half`（V100 不支持 BF16）。

![从买卡到跑起来：选卡、算显存、装机、部署、优化五步](/imgs/learning-notes/ai-server-build-overview.svg)

[查看大图](/imgs/learning-notes/ai-server-build-overview.svg) · [Mermaid 源码](/diagrams/learning-notes/ai-server-build-overview.mmd)

## 第一部分：专业术语词典

### 1.1 显卡与硬件术语

**GPU 产品线**：NVIDIA 显卡分三条线
- **GeForce（消费级）**：RTX 3090 / 4090 / 5090，有风扇、有视频输出，驱动偏游戏。
- **RTX 专业卡（原 Quadro）**：RTX A6000 / 6000 Ada，ECC 显存、ISV 认证驱动，偏图形工作站。
- **数据中心卡（原 Tesla）**：T4 / V100 / A100 / L4 / L40 / L20 / H100。**被动散热（没风扇）、无视频输出**、ECC 显存、大显存，为 7×24 服务器设计。AI 服务站用这条线。

**显存类型**：
- **HBM（高带宽内存）**：HBM2 / HBM2e / HBM3。显存芯片叠在 GPU 旁边，带宽极大、贵。V100 用 HBM2（900GB/s），A100 用 HBM2e（1555~2039GB/s）。
- **GDDR**：GDDR6 / GDDR6X。传统显存颗粒铺在 PCB 上，便宜、带宽低一些。L20 用 GDDR6（864GB/s）。

**显存容量 vs 显存带宽**：容量决定"能不能装下模型"，带宽决定"跑得快不快"。大模型每生成一个字都要把全部参数从显存读一遍，所以推理速度 ≈ 带宽 ÷ 模型大小。

**被动散热 vs 主动散热**：被动=只有散热片没风扇，靠服务器机箱的暴力扇从前往后吹透；主动=自带风扇。数据中心卡全是被动散热，**离开服务器机箱风道就会过热降频**。

**ECC 显存**：带纠错码的显存，能发现并纠正单位翻转，长期运行稳定。数据中心卡全系 ECC，消费卡没有。

**Tensor Core**：NVIDIA GPU 里专门做矩阵乘法的单元，AI 计算主要靠它。几代架构的 Tensor Core 支持的精度不同（见 Compute Capability）。

**Compute Capability（计算能力）**：`sm_xx` 编号，代表 GPU 架构代际，直接决定支持哪些精度格式：
- sm_70（Volta，V100）：FP16、INT8；**不支持 BF16、FP8，vLLM 里不支持 AWQ**
- sm_75（Turing，T4）：FP16、INT8；不支持 BF16；支持 AWQ/GPTQ
- sm_80（Ampere，A100）：支持 BF16；不支持 FP8；AWQ/GPTQ 全功能（含 Marlin 加速）
- sm_89（Ada，L4 / L40 / L20）：支持 FP8
- sm_90（Hopper，H100）：支持 FP8
- 买老卡之前先查 sm 版本，再看模型要什么精度，对不上就跑不了。

**TDP**：热设计功耗，即满载功耗。V100 约 250~300W（看版本），L20 约 275~300W。选电源和散热都按 TDP 算。

**FHFL**：Full Height Full Length，全高全长卡，数据中心卡的标准尺寸（约 26.7cm 长），买机箱/服务器时确认装得下。

**NVLink**：NVIDIA 私有的卡间高速直连技术，绕过 PCIe 和 CPU，卡对卡直接传数据。
- V100 PCIe 版：卡顶部有 NVLink 金手指，插桥接器（bridge）把两张卡配对，**100GB/s 双向带宽**（PCIe Gen3 x16 实际只有约 13GB/s，NVLink 快 7~8 倍）。
- V100 SXM 版（焊在服务器主板上的）：6 条链路，300GB/s，但那是整机形态，散买不到。
- 注意：桥接器只能**两两配对**，4 张卡 = 0-1、2-3 两对，不能 4 张全互联。
- 作用：tensor parallel 多卡跑大模型时，卡间要频繁同步中间数据，NVLink 带宽越大，多卡效率越高。

**PCIe**：
- **x16 / x8**：通道数，x16 是满速。消费级主板双卡常拆成 x8/x8；服务器主板每槽多为 x16。
- **Gen3 / Gen4 / Gen5**：代际，带宽逐代翻倍。V100 是 Gen3 的卡，插 Gen4/Gen5 槽向下兼容。
- **Lane（通道）**：CPU 提供的 PCIe 通道总数决定能插几张全速卡。
- **Riser（转接卡）**：2U 服务器高度不够，GPU 横插需要 riser 转接。

**2U / 4U**：服务器高度单位，1U=4.45cm。2U=8.9cm，4U=17.8cm。2U 里的卡要横插，4U 可直接竖插。

**19 英寸机柜**：服务器标准宽度，有机柜就上导轨，没有直接放地上也行。

**IPMI / BMC / iDRAC**：服务器的远程管理芯片，不开机箱、不接显示器就能远程装系统、看开机画面、调风扇。Tesla 卡无视频输出，**IPMI 是装机的唯一途径**。Dell 叫 iDRAC，超微直接叫 IPMI。

**EPS 12V 8-pin**：CPU 供电口。Tesla 卡的 8-pin 供电是这个线序，**不是普通显卡的 8-pin**，插错会烧卡。服务器原装电源自带的线直接用，别自己转接。

**PDU**：电源分配单元，机柜里的排插，选支持电流要大于服务器满载。

**温度墙 / 降频（Thermal Throttling）**：GPU 超过某个温度自动降频保护。V100 约 80°C 开始降，87°C 硬墙。`nvidia-smi` 实时看温度。

### 1.2 模型与精度术语

**参数量（Parameters）**：模型里可训练数字的个数。7B=70 亿，14B=140 亿，32B=320 亿，70B=700 亿。参数越多一般越聪明，但显存和算力需求也越大。

**精度格式**：一个参数用多少位二进制存。位数越少模型越小、跑得越快，精度损失越大。

| 格式 | 位数 | 1 参数占几字节 | 说明 |
|---|---|---|---|
| FP32 | 32 位 | 4 | 训练用，推理用不上 |
| FP16 | 16 位 | 2 | 推理常用，**V100 上最稳** |
| BF16 | 16 位 | 2 | 和 FP16 都是 16 位，范围更大；**V100 不支持** |
| FP8 | 8 位 | 1 | 新卡（Ada/Hopper）才支持，V100 不支持 |
| INT8 | 8 位 | 1 | 整数 8 位，V100 支持（bitsandbytes） |
| INT4 | 4 位 | 0.5 | 整数 4 位，V100 上用 GPTQ（AWQ 不支持 V100） |
| FP4 | 4 位 | 0.5 | 最新格式，只有 Blackwell（5090/B200）支持 |

**量化（Quantization）**：把 FP16 模型压缩成 INT8/INT4 的过程。原理：神经网络对精度不敏感，用粗一点的"尺子"存参数，效果几乎不变，显存减半、速度翻倍（**有加速核的前提下**）。

**AWQ / GPTQ**：两种把 FP16 压成 INT4 的算法。看到 "Qwen3-32B-AWQ" 就是"官方 32B 模型用 AWQ 压好的 INT4 版"。
- **V100 注意**：AWQ 在 vLLM 里**不支持 Volta**（要求 sm_75+，V100 启动直接报错 "Minimum capability: 75"）。V100 上 INT4 统一用 **GPTQ**。
- GPTQ 的高速 Marlin 核需 sm_80+，V100 只能用标准 ExLlamaV2 核：**省显存有效，但 decode 速度不一定比 FP16 快**（无加速核有反量化开销）。V100 上 INT4 的核心价值是"装下更大的模型"，不是提速。

**GGUF**：llama.cpp / Ollama 用的量化格式，vLLM 不用。vLLM 用 GPTQ（V100）或 AWQ（新卡）。

**EXL2**：另一种量化格式，exllamav2 引擎用，了解即可。

**KV Cache**：模型生成时，为了不重复计算，会把之前所有 token 的 Key 和 Value 缓存起来。占显存 = 2（K 和 V）× 层数 × KV 头数 × 头维度 × 字节数 × token 数。现代模型用 GQA（分组查询注意力）大幅压缩了 KV 头数，所以实际占用比老公式小。**上下文越长，KV Cache 越大**。

**上下文窗口（Context Window）**：模型一次能"记住"多长，4k / 8k / 32k / 128k token。窗口越大，KV Cache 占显存越多。

**MoE（混合专家）**：一种架构，总参数大，但每次只激活其中几个"专家"。如 Qwen3-30B-A3B：总 300 亿参数，每次只用 30 亿，效果接近 30B dense，速度和显存接近 3B。**显存小想用大模型，优先看 MoE**。

**Instruct / Base**：Instruct 是经过指令微调、会聊天的版本；Base 是底座，只会续写。做助手下 Instruct 版。

**Distill（蒸馏）**：用大模型教小模型，如 DeepSeek-R1-Distill-Qwen-32B。名字里有 Distill 的一般性价比不错。

### 1.3 推理服务术语

**TTFT（Time To First Token）**：从发请求到第一个字吐出来。用户感知的"反应速度"。

**Prefill（预填充）**：模型把 prompt 全部读一遍、算出 KV Cache 的阶段。**TTFT 几乎完全由 prefill 决定**。prompt 越长、模型越大，prefill 越慢。

**Decode（解码）**：一个字一个字往外生成的阶段。**瓶颈在显存带宽**（每步要读全部参数一遍），速度 ≈ 带宽 ÷ 模型大小。

**Tokens per second**：每秒生成的 token 数，decode 阶段的吞吐指标。

**vLLM**：目前最主流的开源推理引擎，PagedAttention + Continuous Batching，高并发强，自带 OpenAI 兼容 API。**生产环境首选**。V100 上自动用 V0 引擎（V1 需 sm_80+），功能完整。

**TGI**：HuggingFace 的推理引擎，vLLM 的竞品，了解即可。

**Ollama**：最简单的本地跑模型工具，`ollama pull` + `ollama serve`，适合单机尝鲜，多卡和高并发不如 vLLM。

**llama.cpp**：C++ 写的轻量推理引擎，CPU 也能跑，GGUF 格式就是给它用的。**V100 上如果 vLLM 折腾不动，llama.cpp + GGUF 是保底方案**（GGUF 在任何卡上都能跑）。

**Tensor Parallel（张量并行）**：把一个模型切分到多张卡上跑。vLLM 参数 `--tensor-parallel-size 2`。多卡跑大模型必备，卡间走 NVLink 最快。

**Pipeline Parallel（流水线并行）**：把模型按层切分到多张卡，延迟高，一般不用。

**Continuous Batching**：vLLM 的核心优化，请求不用等整批结束，来一个插一个，并发高的关键。

**PagedAttention**：vLLM 的 KV Cache 管理技术，显存利用率高。

**Prefix Caching（前缀缓存）**：prompt 开头相同部分（如系统提示词）只算一次，后续复用。对话/助手场景**最有效的 TTFT 优化**。

**Chunked Prefill**：长 prompt 分块预填充，避免一次 prefill 堵住所有请求。

**Speculative Decoding（推测解码）**：用小模型先猜、大模型验证，加速 decode。vLLM 支持 n-gram 推测。

**OpenAI 兼容 API**：vLLM 启动后在 8000 端口提供 `/v1/chat/completions` 等接口，所有 OpenAI SDK 代码改个 `base_url` 就能用。

**gpu-memory-utilization**：vLLM 参数，显存使用上限，一般设 0.9，留 10% 给系统。

**max-num-seqs**：最大并发序列数。单用户场景调小（如 4~8），减少排队。

**max-model-len**：最大上下文长度。设得越大，vLLM 预留的 KV Cache 越多，设成实际需要的就行，别无脑拉满。

## 第二部分：硬件搭建教程

### 2.1 数据中心卡一览（通用知识）

| 型号 | 显存 | 带宽 | 功耗 | 架构 / sm | 特点 |
|---|---|---|---|---|---|
| T4 | 16GB GDDR6 | 320GB/s | 70W | Turing sm_75 | 最省电，轻量推理，支持 AWQ/GPTQ |
| V100 16GB | 16GB HBM2 | 900GB/s | 250W | Volta sm_70 | 老将，带宽强，**AWQ 不可用** |
| V100 32GB | 32GB HBM2 | 900GB/s | 250~300W | Volta sm_70 | 二手性价比之王，**AWQ 不可用** |
| A100 40GB | 40GB HBM2e | 1555GB/s | 250W | Ampere sm_80 | 上一代训练主力，支持 BF16，AWQ 全功能 |
| A100 80GB | 80GB HBM2e | 2039GB/s | 300~400W | Ampere sm_80 | 大模型单卡方案 |
| L4 | 24GB GDDR6 | 300GB/s | 72W | Ada sm_89 | 单槽半高，推理能效比好，支持 FP8 |
| L40 / L40S | 48GB GDDR6 | 864GB/s | 300~350W | Ada sm_89 | 推理热门，支持 FP8 |
| L20 | 48GB GDDR6 | 864GB/s | 275~300W | Ada sm_89 | 中国特供版 L40 |
| H100 / H800 | 80GB HBM3 | 2000~3000GB/s | 350~700W | Hopper sm_90 | 训练旗舰 |

**选卡方法**：先定要跑多大的模型（看第三部分显存测算），再倒推需要多少显存，最后看带宽和 sm 版本支不支持目标精度。

**二手卡验货**（必做）：
```bash
nvidia-smi -q -d ECC # 看 Volatile ECC 错误计数，有增长就退货
nvidia-smi -q -d POWER # 看功耗读数是否正常
nvidia-smi -q -d TEMPERATURE
nvidia-smi --query-gpu=name,memory.total --format=csv # 确认显存容量，防 16G 冒充 32G
```
跑个满载测试 10 分钟，温度稳定在 75°C 以下、无 ECC 报错、无降频，才算过关。

### 2.2 服务器选型教程

**原则**：数据中心卡是被动散热，**必须**配服务器机箱的风道。不要拿消费级主板+机箱硬上，改造散热的时间成本更高。

**2U vs 4U**：
- 2U（8.9cm 高）：便宜省空间，GPU 靠 riser 转接横插，风道挤、风扇吵。
- 4U（17.8cm 高）：贵一点，卡直接插主板 x16 槽，风道顺、风扇可调低速。
- 放家里选 4U，放机房/车库选 2U。

**常见二手服务器**：
- Dell PowerEdge R740（2U）：货多、配件便宜，iDRAC 远程管理好用。
- 超微 Supermicro 4029 系列（4U）：能上 8~10 张双宽卡，扩展性强。

**CPU/内存**：推理主要吃 GPU，CPU 别多花钱。双路 Xeon Scalable 二手（金牌 61xx/62xx 系列）+ 64~128GB DDR4 ECC REG 足够。**内存是必须的**：显存是 GPU 的，内存是 CPU/操作系统的；模型权重文件先落内存再进显存，RAG 向量库、embedding 模型也吃内存。64GB 起步，128GB 舒服。

**买之前确认三件事**：① IPMI/BMC 能进（Tesla 无视频输出全靠它装机）；② 电源功率够（多卡至少 1600W）；③ PCIe 槽位是 x16 且卡装得下（FHFL 全长卡）。

### 2.3 散热管理教程

**原理**：机箱前置风扇 → 冷风穿过 GPU 散热片 → 热风从后排出。**前进后出**，风道里不要有线缆遮挡。

**日常监控**：
```bash
nvidia-smi dmon -s pucvmt # 持续监控功耗、温度、显存、风扇
watch -n 1 nvidia-smi # 每秒刷新看温度
```
正常跑推理压在 70~75°C，超 80°C 开始降频，87°C 硬墙。

**家用降噪**：服务器默认风扇按最坏情况全速。用 `ipmitool` 改温控策略：
```bash
ipmitool sensor list | grep -i fan # 看风扇转速
ipmitool sdr type Temperature # 看温度传感器
```
Dell iDRAC 网页里可直接调风扇偏移量；超微用 `ipmitool raw` 切手动模式再设转速（不同型号命令略有差异，查对应手册）。

**进阶**：DCGM + Prometheus + Grafana 做温度/功耗看板，超温发告警。

### 2.4 供电教程

**功率估算**：所有部件 TDP 相加再 ×1.3 留余量。
例：双 V100（300W×2）+ 双路 Xeon（~300W）+ 内存硬盘风扇（~150W）= 1050W，×1.3 ≈ 1400W，选 1600W 或 2000W 冗余电源。四卡则按 1900W×1.3 ≈ 2500W，选 2+1 冗余或 3000W。

**接线警告**：Tesla 卡的 8-pin 是 **EPS 12V CPU 线序**，和显卡 8-pin 不一样。用服务器电源自带的 GPU 供电线，**不要自己买转接线硬插**，烧卡不保修。

**家用电路**：1400W ÷ 220V ≈ 6.4A，普通 10A 插座够用，但别和空调、热水器同回路。

### 2.5 装机到系统（step by step）

1. **IPMI 远程装机**：浏览器进 iDRAC/IPMI 地址，挂载 Ubuntu 22.04 LTS Server ISO，远程启动安装。全程不需要接显示器。
2. **装驱动**：
```bash
sudo apt install nvidia-driver-550 # V100 用 550 系，CUDA 12.x
reboot
nvidia-smi # 看到所有卡即成功
```
3. **装 Docker + GPU 支持**：
```bash
curl -fsSL https://get.docker.com | sh
sudo apt install nvidia-container-toolkit
sudo systemctl restart docker
docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi # 验证
```
4. **检查拓扑**：`nvidia-smi topo -m`，确认卡之间是 PIX（同 PCIe switch）或 PHB，NVL（NVLink）最好；NODE（跨 NUMA）性能差。
5. **（可选）设功耗墙**：`sudo nvidia-smi -i 0 -pl 250` 把 300W 的卡限到 250W，温度噪音双降，性能损失约 5%。

### 2.6 存储规划

- **系统盘**：500GB~1TB NVMe。Ubuntu + Docker 镜像（vLLM 镜像 10GB+）+ 日志，500GB 起步。
- **模型盘**：单独一块 2TB+ NVMe 或 SATA SSD。模型文件很大：32B FP16 约 64GB，70B FP16 约 140GB，70B GPTQ 约 40GB。下 5~10 个模型轻松几百 GB。
- **模型缓存目录**：默认 `~/.cache/huggingface`，改环境变量 `HF_HOME=/data/models` 指到数据盘，别让模型塞满系统盘。
- **备份**：RAG 文档、微调数据集、LoRA 权重放机械盘或另做备份，丢了要重跑。

## 第三部分：模型参数与选型教程

### 3.1 怎么看懂一个模型

以 `Qwen3-32B-AWQ` 为例拆解：
- **Qwen3**：模型系列（通义千问第三代）
- **32B**：320 亿参数
- **AWQ**：用 AWQ 算法压成的 INT4 量化版（**V100 用户跳过 AWQ，找 GPTQ 版**）

HuggingFace 模型页看这几个地方：
- 模型名里的 B 数 = 参数量
- Files and versions 里看权重文件总大小（≈ 显存占用）
- Model card 看 license（Qwen3 是 Apache 2.0，可商用）
- 有没有 `Instruct`（聊天版）后缀
- `config.json` 里的 `quantization_config` 告诉你是什么量化

国内下载用 **ModelScope**（魔搭），速度比 HuggingFace 快一个数量级，模型 ID 和 HF 对应。

**离线使用**：模型下载到本地后，vLLM 用 `--model /本地路径` 加载，设环境变量 `HF_HUB_OFFLINE=1` 防止它去联网检查。

### 3.2 显存测算完整教程

**公式**：
```
权重显存 = 参数量 × 每参数字节数
FP16/BF16：×2　　INT8：×1　　INT4：×0.5

总需求 = 权重显存 + KV Cache + 10% 余量
```

**KV Cache 估算**（GQA 架构，Qwen3 这类）：
Qwen3-32B（64 层，8 个 KV 头，128 维，FP16）：每 token 约 0.25MB。
- 4k 上下文 ≈ 1GB
- 8k 上下文 ≈ 2GB
- 32k 上下文 ≈ 8GB

**速查表**（权重显存，V100 视角）：

| 模型 | FP16 | INT4 (GPTQ) | 单 V100-32G | 双 V100-32G | 四 V100-32G |
|---|---|---|---|---|---|
| 7B | 14GB | 3.5GB | ✅ FP16 | ✅ | ✅ |
| 14B | 28GB | 7GB | ✅ FP16（短上下文） | ✅ | ✅ |
| 32B | 64GB | 16GB | GPTQ 可试（需验证） | GPTQ ✅ / INT8 ✅ | FP16 ✅ |
| 70B | 140GB | 35GB | ❌ | GPTQ ✅ | GPTQ ✅ / INT8 ✅ |

说明：
- vLLM 按 `--gpu-memory-utilization 0.9` 算可用显存：单卡 32GB ≈ 28.8GB 可用，双卡 ≈ 57.6GB，四卡 ≈ 115GB。
- **32B FP16（64GB 权重）要 4 张 V100-32G，不是 2 张**——2 张只有 57.6GB 可用，装不下。
- AWQ 在 V100 上不可用，INT4 统一看 GPTQ 版。
- 超了会直接 OOM 报错，不会悄悄跑坏。

**一句话判据**：权重 + KV Cache + 10% 余量 < 可用显存总量，就能跑。

### 3.3 模型选型（按显存分档，V100 视角）

- **单 V100-32G**：Qwen3-14B FP16（短上下文）、Qwen3-32B-GPTQ（需实测验证）
- **双 V100-32G**：Qwen3-32B-GPTQ（稳）、Qwen3-14B FP16（长上下文随便开）
- **四 V100-32G**：Qwen3-32B FP16、70B 级 GPTQ、Qwen3-30B-A3B FP16（MoE）
- **通用原则**：V100 上 FP16 永远是最稳的选择；INT4 用来"装下更大的模型"，别指望它提速。

### 3.4 选模型的三步决策

1. **定用途**：聊天助手 → Instruct 版；知识问答 → 配 RAG；代码 → 代码特化模型。
2. **算显存**：用 3.2 的公式，权重+KV+余量 < 可用显存。
3. **选精度**：V100：FP16 最稳 → 装不下就 GPTQ INT4 → 别碰 AWQ/FP8/BF16。新卡（sm_80+）：FP16 → AWQ → FP8。

## 第四部分：部署教程

### 4.1 vLLM 完整教程（Docker）

**V100 单卡启动**（注意 `--dtype half`）：
```bash
docker run -d --gpus all \
-p 8000:8000 \
-v /data/models:/root/.cache/huggingface \
--name vllm \
vllm/vllm-openai:latest \
--model Qwen/Qwen3-14B \
--dtype half \
--tensor-parallel-size 1 \
--gpu-memory-utilization 0.9 \
--enable-prefix-caching \
--max-model-len 8192 \
--api-key sk-你自己设一个密码 \
--port 8000
```

**多卡**：把 `--tensor-parallel-size` 改成卡数。

**参数逐个解释**：
| 参数 | 意思 |
|---|---|
| `--model` | 模型名（HF ID）或本地路径 |
| `--dtype half` | **V100 必加**，强制 FP16（V100 不支持 BF16，auto 可能选错） |
| `--tensor-parallel-size` | 张量并行卡数，几张卡就填几 |
| `--gpu-memory-utilization 0.9` | 显存用 90%，留 10% 保命 |
| `--enable-prefix-caching` | 开前缀缓存，TTFT 大杀器 |
| `--enable-chunked-prefill` | 长 prompt 分块，默认开 |
| `--max-model-len` | 最大上下文，按需设，别拉满 |
| `--max-num-seqs` | 最大并发，单用户设 4~8 |
| `--api-key` | **必设**，不设等于裸奔（见第七部分） |
| `--enforce-eager` | V100 上如果报 attention 相关错再加（禁用 CUDA graph） |
| `--served-model-name` | 对外显示的模型名 |
| `--port` / `--host` | 监听端口和地址 |

**验证**：
```bash
curl http://localhost:8000/v1/models -H "Authorization: Bearer sk-你自己设一个密码"
curl http://localhost:8000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer sk-你自己设一个密码" \
-d '{"model": "Qwen/Qwen3-14B", "messages": [{"role": "user", "content": "你好"}]}'
```

**看日志排错**：`docker logs -f vllm`。常见错：
- OOM：`--gpu-memory-utilization` 调小、换小模型、或 `--max-model-len` 调小
- `Minimum capability: 75`：你下了 AWQ 模型，V100 跑不了，换 FP16 或 GPTQ 版
- CUDA 版本不对：换镜像 tag
- 端口占用：换 `--port`

**开机自启**：加 `--restart unless-stopped`，或写 docker-compose.yml。

### 4.2 Ollama（轻量备选）

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen3:14b
ollama serve # 11434 端口
```
Ollama 简单但多卡并行弱、高并发差，正式服务用 vLLM。**llama.cpp + GGUF** 是 V100 的保底方案：GGUF 在任何卡上都能跑，vLLM 实在折腾不动时用它。

### 4.3 接入你的应用

vLLM 提供 OpenAI 兼容接口，所有 OpenAI SDK 只需改 `base_url`：
```python
from openai import OpenAI
client = OpenAI(base_url="http://服务器IP:8000/v1", api_key="sk-你自己设一个密码")
resp = client.chat.completions.create(model="Qwen/Qwen3-14B",
messages=[{"role": "user", "content": "你好"}])
```

## 第五部分：性能优化教程

### 5.1 TTFT（首字延迟）优化

TTFT = prefill 耗时。优化手段按效果排序：

1. **Prefix Caching**：`--enable-prefix-caching`。系统提示词只算一次。对话/助手场景**最有效**，TTFT 可降一个数量级。
2. **缩短 prompt**：系统提示词精简，历史对话做滑动窗口。
3. **小模型**：TTFT 和模型大小成正比，14B 的 TTFT 天然比 32B 快一倍。
4. **Chunked Prefill**：默认开着，长 prompt 不堵队。
5. **量化**：在新卡（sm_80+）上有 Marlin 加速，INT4 prefill 更快；**V100 上 INT4 不一定更快**（无加速核），别为了 TTFT 去量化，V100 上量化只为省显存。

### 5.2 解码速度（流畅度）优化

每秒 token 数 ≈ 显存带宽 ÷ 模型大小。优化方向：
1. **多卡并行**：tensor parallel 下每卡只搬一部分数据，双卡速度接近翻倍（NVLink 下效率更高）。
2. **控制上下文**：KV Cache 每步也要读，历史别堆太长。
3. **Speculative Decoding**：`--speculative-model` 配小模型猜，大模型验，特定场景提速。
4. **V100 上 FP16 的 decode 往往比 GPTQ-INT4 快**——INT4 在 V100 的价值是"装下大模型"，不是"跑得快"。

### 5.3 带宽速查

| 卡 | 带宽 | 32B-GPTQ(16GB)理论速度 |
|---|---|---|
| V100 | 900GB/s | ~56 tok/s |
| RTX 3090 | 936GB/s | ~58 tok/s |
| L20 | 864GB/s | ~54 tok/s |
| A100 40GB | 1555GB/s | ~97 tok/s |

实际取理论值的 60~70%。中文语音助手 30 tok/s 已远超人说话速度（4~5 字/秒）。

### 5.4 速度计算公式（手算教程）

推理分两个阶段，瓶颈不一样，公式也不一样。

**Decode（吐字）——瓶颈是带宽**：
```
每秒 token 数 ≈ 显存带宽 ÷ 模型权重字节数（再 ×0.6~0.7 取实际值）
```
算例：V100（900GB/s）跑 Qwen3-32B-GPTQ（16GB）→ 900÷16=56 tok/s 理论，实际约 35~40 tok/s。

**Prefill（读 prompt，决定 TTFT）——瓶颈主要是算力**：
- 带宽只决定下限：TTFT ≥ 权重字节数 ÷ 带宽
- 算例：32B FP16（64GB）在 V100 上 → 64÷900=71ms，TTFT 不可能比这更快
- 算力决定主体：prefill 计算量 ≈ 2 × 参数量 × prompt token 数
- 算例：32B 模型，512 token prompt → 2×32×10⁹×512=32.8 TFLOPs；V100 FP16 算力 125 TFLOPS → 32.8÷125=262ms（100% 利用率），实际 30~50% 利用率 → 0.5~1s
```
TTFT ≈ max(带宽下限，算力时间) + 框架开销
```

**带宽和 TTFT 的关系**：带宽只给 TTFT 兜底，真正决定 TTFT 的是算力 × prompt 长度。prompt 越长，算力越重要。这也是 prefix caching 最有效的原因——它直接跳过 prefill 计算。

### 5.5 vLLM 官方量化兼容性表（V100 必查）

vLLM 官方文档的硬件兼容性（Volta = SM 7.0 = V100）：

| 量化方式 | Volta | Turing | Ampere | Ada | Hopper |
|---|---|---|---|---|---|
| AWQ | ❌ | ✅ | ✅ | ✅ | ✅ |
| GPTQ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marlin 加速核 | ❌ | ✅ | ✅ | ✅ | ✅ |
| bitsandbytes | ✅ | ✅ | ✅ | ✅ | ✅ |
| GGUF | ✅ | ✅ | ✅ | ✅ | ✅ |

vLLM 版本迭代快，部署前以官方文档为准，先拿小模型验证。

## 第六部分：网络与安全教程

**vLLM 默认没有鉴权**，`--api-key` 不设的话，谁扫到你的 8000 端口谁就能免费用你的卡。按下面四步加固：

1. **设 API Key**：`--api-key sk-一串随机密码`，所有请求带 `Authorization: Bearer`。
2. **防火墙**：`ufw allow 22 && ufw allow 8000 && ufw enable`，只开必要端口。
3. **反向代理 + HTTPS**（要从外网访问时）：Nginx/Caddy 反代 8000，套个域名上 HTTPS。Caddy 一行配置自动续证书，最省事。
4. **SSH 加固**：密钥登录、禁密码登录（`PasswordAuthentication no`）、改默认 22 端口、装 fail2ban 防爆破。

**内网访问最省事**：Tailscale 组网，手机/电脑进同一虚拟局域网直接访问 `http://服务器TailscaleIP:8000`，不暴露公网，最安全。

## 第七部分：电费与运行成本

**公式**：功率(kW) × 24小时 × 30天 × 电价 = 月电费

| 配置 | 满载功率 | 月耗电 | 月电费（0.55元/度） |
|---|---|---|---|
| 双 V100 | ~1.1kW | ~790 度 | ~435 元 |
| 四 V100 | ~1.9kW | ~1370 度 | ~750 元 |

- **空载便宜很多**：vLLM 空闲时单卡约 60~80W，整机待机 300W 左右。
- **省电三招**：`nvidia-smi -pl 250` 降功耗墙（性能损失 ~5%）；不用时直接关机，别 7×24 空转；批量任务放夜间低谷电价跑。
- 7×24 跑之前先算一笔账，电费是长期持有成本的大头。

## 第八部分：RAG 知识库（MaxKB）

**RAG 原理一句话**：把你的文档切成小块 → 转成向量存进向量库 → 用户提问时检索最相关的几块 → 拼进 prompt 发给大模型。让模型能回答它没学过的私有知识。

**MaxKB**：开源可视化 RAG 平台，Docker 一键起，内置文档管理、向量库（pgvector）、检索策略配置：
```bash
docker run -d --name maxkb -p 8080:8080 1panel/maxkb
```
浏览器进 8080，建知识库 → 上传文档 → 建应用 → 把应用的 API 地址接到你的助手链路。

**链路**：用户问题 → MaxKB 检索相关文档块 → 拼进 prompt → vLLM 生成回答。

**embedding 模型**：把文本转向量的小模型，中文用 bge-m3。很小（~2GB），可以放 CPU 跑，不占 GPU；想快就放 GPU，和 LLM 共用一张卡也行。

**注意事项**：
- RAG 的 prompt 会变长（多了检索到的文档块），TTFT 会增加，prefix caching 覆盖不到检索部分。
- 检索质量看切块大小和 embedding 模型，调这两个比换大模型见效快。
- 你的离线语音助手链路就是：VAD → ASR →（MaxKB RAG +）Qwen → TTS。

## 第九部分：自己动手量化模型

**什么时候需要自己压**：官方没出你想要的量化版、或者你微调出了自己的模型想压缩部署。

**GPTQ（V100 用这个，不用 AWQ）**：
```bash
pip install auto-gptq optimum
```
```python
from optimum.gptq import GPTQQuantizer
quantizer = GPTQQuantizer(bits=4, dataset="wikitext2", block_name_to_quantize="model.layers")
# 加载 FP16 模型 → 量化 → 保存，校准用 wikitext2 这类通用文本
```
- **校准集**：量化时用来"找感觉"的一小批文本，通用场景用 wikitext2/c4，垂直场景用自己的领域文本效果更好。
- 压完用 vLLM 加载，config.json 里会有 `quantization_config`，vLLM 自动识别。

**GGUF（给 llama.cpp / Ollama 用）**：
```bash
# llama.cpp 的 convert + quantize 两步
python convert_hf_to_gguf.py /data/models/Qwen3-14B
./llama-quantize./qwen3-14b.gguf./qwen3-14b-q4.gguf q4_k_m
```

**V100 提醒**：自己压 AWQ 在 V100 上照样跑不了（核不支持），压 GPTQ 或 GGUF。

## 第十部分：微调入门（LoRA / QLoRA）

**原理一句话**：不碰原始大模型，只训练一组很小的"适配器"参数（LoRA），推理时挂上去。QLoRA = 4-bit 量化基座 + LoRA，显存需求大降。

**工具**：**LLaMA-Factory**（中文友好，命令行/网页双模式，对老卡兼容最好，V100 可用）。unsloth 很快但很多版本不支持 Volta，别碰。

**流程**：
1. 准备数据：问答对存成 jsonl（`{"instruction": "...", "input": "...", "output": "..."}`），几百到几千条就能见效。
2. LLaMA-Factory 选基座模型 → 选 QLoRA → 配学习率/轮数 → 开训。
3. 训完得到 adapter，两种用法：合并回基座（变完整模型）或推理时动态加载。

**显存参考**（QLoRA，batch=1）：
- 7B：~12GB　　14B：~20GB　　32B：~48GB+

**vLLM 加载 LoRA**：
```bash
--enable-lora --lora-modules my-adapter=/data/adapters/my-lora
```
请求时在模型名里指定 adapter 即可切换，不用重启服务。

## 第十一部分：避坑清单

**硬件**：
1. Tesla 卡**无视频输出**，全靠 IPMI/BMC 装机，买服务器先确认远程管理能进。
2. 被动散热卡**必须**有服务器机箱风道，裸奔必降频。
3. 8-pin 供电是 CPU（EPS）线序，别拿显卡线硬插，会烧。
4. 二手卡必查 `nvidia-smi -q -d ECC`，Volatile ECC 有增长直接退货；确认显存容量防 16G 冒充 32G。
5. 服务器风扇默认全速，用 ipmitool / iDRAC 调温控曲线。
6. NVLink 桥接器只能两两配对，4 卡 = 2 对；买卡问卖家桥接器包不包含。

**模型与精度（V100）**：
7. **AWQ 在 vLLM 里不支持 V100**（要求 sm_75+），看到 Minimum capability: 75 报错就是下了 AWQ 版，换 FP16 或 GPTQ。
8. V100 不支持 BF16/FP8，启动 vLLM 必加 `--dtype half`。
9. **32B FP16（64GB）要 4 张 V100-32G，不是 2 张**；2 张只有 57.6GB 可用。
10. V100 上 INT4 的价值是省显存装大模型，不是提速；FP16 往往更快更稳。
11. 模型下 Instruct 版，Base 版不会聊天。

**部署与安全**：
12. vLLM 的 `--api-key` 必设，不设等于把卡送给全网。
13. `--max-model-len` 别拉满，按实际上下文设，省 KV Cache。
14. 国内下模型用 ModelScope，别跟 HuggingFace 龟速死磕。
15. 模型缓存目录改到数据盘（`HF_HOME`），别塞满系统盘。

**成本**：
16. 7×24 跑之前先算电费：双 V100 一月 ~435 元，四卡 ~750 元（0.55 元/度）。
17. 温度常驻监控，80°C 是红线。

## 第十二部分：DIY 攒机教程（单个部件，4×V100 为例）

### 部件清单

| 部件 | 选型 | 说明 |
|---|---|---|
| CPU | AMD EPYC Rome（见下表，按需选） | SP3 接口，单颗就有 128 条 PCIe 通道，不用双路；16~24 核跑服务绰绰有余 |
| 主板 | **ASRock Rack ROMED8-2T** | ATX，单 SP3，**7× PCIe 4.0 x16**，8× DDR4 RDIMM，AST2500（VGA+IPMI），双万兆网口。7 个 x16 槽，4 张双槽卡随便插 |
| 备选主板 | Gigabyte MZ32-AR0 | E-ATX，有 4× Gen4 x16 槽（Slot 3/4/6/7），但板子更大，机箱也要大 |
| 内存 | DDR4-3200 REG ECC（RDIMM）8×16GB | 8 条插满=8 通道，性能最好；**必须是 REG/ECC**，普通台式机内存不兼容 |
| CPU 散热 | SP3 4U 被动散热片（如 Dynatron A39） | 靠机箱风道吹，不用风扇头 |
| 机箱 | 4U 机架式机箱（支持 ATX，8 槽位） | 如超微 CSE-846 或国产 4U；关键看前面板能不能装 3×120mm 风扇 |
| 电源 | 1600W | 见下文电源方案 |
| 风扇 | 3×12038 暴力扇（台达 Delta） | 前面板进风，直吹 GPU |
| NVLink 桥接器 | V100 NVLink bridge ×2 | 0-1、2-3 配对 |

**为什么选 EPYC 不选 Xeon**：单颗 EPYC 给 128 条 PCIe 通道，4 张 x16 卡+硬盘全够；Xeon 要双路才有这么多通道，复杂度翻倍。

### CPU 选型表（AMD EPYC Rome / SP3，二手主力，参数已核实）

| 型号 | 核心/线程 | 基频/加速 | 三级缓存 | TDP | 适合 |
|---|---|---|---|---|---|
| 7282 | 16/32 | 2.8/3.2GHz | 64MB | 120W | 最省电，纯推理够用 |
| 7302 | 16/32 | 3.0/3.3GHz | 128MB | 155W | **甜点**：主频最高，Python/Java 单线程服务也快 |
| 7352 | 24/48 | 2.3/3.2GHz | 128MB | 155W | 核多又省电，多容器/多任务 |
| 7402 | 24/48 | 2.8/3.35GHz | 128MB | 180W | 性能最均衡，要核多选它 |
| 7502 | 32/64 | 2.5/3.35GHz | 128MB | 180W | 32 核，跑虚拟化/多服务 |
| 7452 | 32/64 | 2.35/3.35GHz | 128MB | 155W | 32 核里最省电 |

**买 CPU 三个警告**：
1. **带 P 后缀**（如 7302P/7402P）是单路专用版，只能插单路主板——ROMED8-2T 就是单路板，P 版能用还更便宜；但以后想换双路板就废了。
2. **避开 Dell/HP 锁定版**：OEM 锁定的 CPU 只能用在对应品牌服务器上，DIY 板子点不亮。买散片问卖家"是不是锁定版、能不能上华擎/技嘉板子"。
3. 推理+Python/Docker，**7302 是甜点**：16 核 3.0GHz 主频最高（Python 很多是单线程，主频比核数重要），155W 不费电。

### CPU 怎么插（SP3 和家用完全不一样）

1. EPYC 包装里有个**塑料 carrier（托架）**，先把 CPU 卡进托架（有防呆口，对准三角标）
2. 托架滑进主板的 SP3 插槽（像抽屉一样推进去）
3. 用 **torque 螺丝刀**按插槽上标的 **1→2→3 顺序**拧紧三颗螺丝（别用普通螺丝刀硬拧，会压坏针脚）
4. 硅脂点 5 点（中间+四角），扣上散热片，同样按顺序拧

### 电源方案（DIY 最大的坑）

**先纠正一个错误**：Tesla V100 PCIe 32GB 是 **TDP 250W，每张卡 2× 8-pin EPS 供电**（TechPowerUp 规格页确认，之前写 1× 是错的）。
- 4 张卡 = **8 个** EPS 8-pin 接口
- 4×250W=1000W + CPU 180W + 其他 150W ≈ 1330W → 1600W 起步

**坑**：普通 ATX 1600W 电源一般只有 2 个 CPU 8-pin，8 个 EPS 接口根本不够。

- **方案 A（便宜）**：双 ATX 电源（如 2×1000W）+ Add2PSU 同步启动器，一个带主板+2 张卡，一个带另外 2 张卡
- **方案 B（省心）**：超微 4U 机箱 + 服务器冗余电源 + PDB 电源分配板，自带 GPU 供电线，线序不会错

### 风道搭建（被动卡的命根子，有真实案例支撑）

ServeTheHome 实测过 Gigabyte W291-Z00 装 **4× Tesla V100 32GB**：靠机箱大前置风扇 + 定制导风罩，被动卡满载无压力。照抄这个思路：

1. **前进后出**：前面板 3 把 12038 暴力扇全速进风，穿过 GPU 散热片，从后部排出
2. **隔槽插卡**：4 张卡插 PCIE1/3/5/7，每张之间空一槽，别插成连体
3. **导风罩**：CPU 散热片上加 air shroud，把风导向散热片，不然风从旁边跑了
4. **走背线**：所有线缆走主板背面，风道里不许有线挡着
5. 验证：满载跑 10 分钟，`nvidia-smi` 温度压在 75°C 以下才算过关

### 装机顺序

1. CPU→托架→插槽→拧螺丝→硅脂→散热片
2. 内存 8 条全插（按主板丝印顺序）
3. 主板固定到机箱铜柱
4. 接 24-pin + 8-pin + 4-pin 主板供电
5. 插 GPU（隔槽），接 EPS 8-pin 供电（**每张卡 2 个**，共 8 个）
6. 前面板跳线（power sw）、风扇接到主板 SYS_FAN
7. 网线接 IPMI 口，开机进 IPMI 装系统（见 2.5）

**真实 DIY/实装参考**（不是编的）：
- ServeTheHome《Gigabyte W291-Z00 评测》：单路 EPYC + **4× Tesla V100 32GB** 实装，前置大风扇+导风罩压住被动卡
- Bargain Hardware 4 卡 V100/P100 视频：超微 12 代双路 Xeon + 4 卡，跑 LLM benchmark 全流程
- Lon.TV：单张 V100 32GB 家用改装（鼓风机+OcuLink），证明被动卡离开服务器风道必须改散热
- "The Only Way To Build A GPU Server"：另一个思路——ASRock ROMED2-32GM-2T 用 SlimSAS 转接出 8 张卡的 x16 通道，8 卡密度不用 PCIe 槽直插

## 第十三部分：2.5 万预算配置单（2026-10-06，拿去直接发给定制厂商）

预算 25000，目标 4×V100 32GB + NVLink，vLLM 推理：

```
4× Tesla V100 32GB PCIe 原生卡（PG500，不要 SXM2 转接版）
AMD EPYC 7302（16核）或同级，单路即可
4× PCIe x16 槽位，4 张双槽全高卡能同时插下
128GB DDR4 REG ECC
1TB NVMe（不要 SATA）
1600W，8× GPU 8-pin 供电线（V100 每张要 2 个）
4U，被动卡风道（前置高转速风扇）
Ubuntu 22.04，驱动+CUDA 装好，能进系统跑 nvidia-smi
```

**NVLink 说明（2026-10-06 修正）**：此前写过"V100 NVLink 桥接器 ×2"，经多方核实修正——**零售版 PCIe V100（PG500）没有 NVLink 金手指，不支持桥接器**，只有 DGX Station 定制版（DGXS）是例外。4 卡按无 NVLink 规划，vLLM 走 PCIe 通信照样跑。如果 NVLink 是刚需，走 SXM2 卡 + NVLink 转接底板路线（社区验证过的方案，底板约 800-1500 元），另行配单。

**预算分配**（估算）：
- 4× V100 32GB（eBay 约 $400-500/张）：约 14000
- 主机（CPU+板+128G 内存+1T NVMe+1600W 电源+4U 机箱）：约 9000
- 合计约 23000，余 2000 弹性

**下单前三句话**：
1. 配置单每项写进订单，卡必须写死"32GB PCIe 原生"
2. 发货前 4 卡全插点亮，`nvidia-smi` 截图+拷机 30 分钟，温度正常
3. 质保**三年**（店保），写进订单：保什么（点不亮/显存报错/掉驱动）、怎么保（换卡还是维修）、运费谁出；木架发货、运费谁出，写清楚

**避坑**：35999 的 SXM2 丐版（E5-2686 v4 + X99 寨板 + 转接板）别碰，贵了至少 13000，PCIe 只能跑 x8。

**老实话**：DIY 比整机省不了太多钱，整机贵就贵在电源、风道、兼容性都调好了。DIY 的价值是**你彻底搞懂每个部件**，以后坏了自己会修。

---

*学习笔记 v8，2026-10-06。vLLM 版本迭代快，量化支持矩阵以官方文档为准，部署前先小模型验证。主板槽位、CPU 参数、V100 供电均以官网/TechPowerUp 规格页为准。价格为估算，实际以卖家报价为准。NVLink 兼容性结论 2026-10-06 修正：零售 PCIe V100 无 NVLink 金手指。*

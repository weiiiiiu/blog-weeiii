---
title: AI 服务器搭建学习笔记
date: 2026-11-22T02:12:00+08:00
categories: 开发
tags:
- AI 服务器
- vLLM
- 模型部署
- 学习笔记
description: 从选卡、算显存、装机到 vLLM 部署、优化的精简版笔记，走 4×V100 32GB 的数据中心卡路线。
draft: false
---

> 这是 2026 年 10 月整理的学习笔记精简版：只留能直接用的结论、表格和命令。走的是数据中心卡路线，目标 4×V100 32GB 跑 vLLM 推理。

> ⚠️ **V100 用户必读**：V100 是 sm_70（Volta），**AWQ 量化在 vLLM 里不支持**（要求 sm_75+，启动直接报错）；GPTQ 可用但高速 Marlin 核需 sm_80+，V100 只能用标准核；**FP16 是 V100 上最稳、往往也是最快的选择**；vLLM V1 引擎需 sm_80+，V100 自动用 V0 引擎；必须 `--dtype half`（V100 不支持 BF16）。

![从买卡到跑起来：选卡、算显存、装机、部署、优化五步](/imgs/learning-notes/ai-server-build-overview.svg)

[查看大图](/imgs/learning-notes/ai-server-build-overview.svg) · [Mermaid 源码](/diagrams/learning-notes/ai-server-build-overview.mmd)

## 一、术语速查

| 词 | 一句话 |
|---|---|
| 数据中心卡 | T4 / V100 / A100 / L4 / L40 / L20 / H100，被动散热、没风扇、无视频输出、ECC 显存，为 7×24 服务器设计 |
| 被动散热 | 只有散热片没风扇，靠机箱风道吹透；离开服务器风道必过热降频 |
| 显存容量 vs 带宽 | 容量定"装不装得下模型"，带宽定"跑得快不快"；推理速度 ≈ 带宽 ÷ 模型大小 |
| HBM / GDDR | HBM 带宽大、贵（V100 用 HBM2，900GB/s）；GDDR 便宜、带宽低一些 |
| Compute Capability | `sm_xx` 编号定架构代际，直接决定支持哪些精度：sm_70（V100）支持 FP16/INT8，**不支持 BF16、FP8，vLLM 里不支持 AWQ**；sm_80（A100）支持 BF16；sm_89/90 支持 FP8 |
| NVLink | 卡间高速直连，V100 PCIe 桥接器 100GB/s 双向；只能两两配对，4 卡 = 0-1、2-3 两对 |
| 2U / 4U | 服务器高度，1U=4.45cm；2U 卡要横插，4U 可直接竖插 |
| IPMI / BMC / iDRAC | 远程管理芯片，不接显示器就能装系统；Tesla 卡无视频输出，**装机全靠它** |
| EPS 12V 8-pin | Tesla 卡的 8-pin 是 CPU 线序，**不是显卡 8-pin**，插错烧卡 |
| 温度墙 | V100 约 80°C 开始降频，87°C 硬墙 |

**精度格式**：FP16（2 字节，V100 最稳）、BF16（V100 不支持）、FP8（新卡才支持）、INT8（V100 支持）、INT4（V100 用 GPTQ，AWQ 不可用）。

**量化**：把 FP16 压成 INT8/INT4，显存减半。AWQ 在 vLLM 里不支持 V100，V100 上 INT4 统一用 GPTQ；GPTQ 高速 Marlin 核需 sm_80+，V100 只能用标准核，省显存有效、提速不一定。

**KV Cache**：生成时缓存之前 token 的 Key/Value，上下文越长占显存越多。Qwen3-32B 每 token 约 0.25MB，32k 上下文约 8GB。

**MoE**：总参数大、每次只激活几个专家，如 Qwen3-30B-A3B 每次只用 30 亿参数。显存小想用大模型优先看 MoE。**Instruct** 是会聊天的版本，做助手下 Instruct 版。

**TTFT**：发请求到第一个字吐出来，几乎完全由 Prefill（读 prompt）决定。**Decode** 是一个字一个字生成，瓶颈在显存带宽，速度 ≈ 带宽 ÷ 模型大小。**vLLM** 是目前主流推理引擎，自带 OpenAI 兼容 API；**Ollama** 最简单，适合尝鲜；**llama.cpp + GGUF** 是 V100 的保底方案。

## 二、选卡

| 型号 | 显存 | 带宽 | 功耗 | 架构 / sm | 特点 |
|---|---|---|---|---|---|
| T4 | 16GB GDDR6 | 320GB/s | 70W | Turing sm_75 | 最省电，轻量推理 |
| V100 16GB | 16GB HBM2 | 900GB/s | 250W | Volta sm_70 | 老将，带宽强，**AWQ 不可用** |
| V100 32GB | 32GB HBM2 | 900GB/s | 250~300W | Volta sm_70 | 二手性价比之王，**AWQ 不可用** |
| A100 40GB | 40GB HBM2e | 1555GB/s | 250W | Ampere sm_80 | 支持 BF16，AWQ 全功能 |
| A100 80GB | 80GB HBM2e | 2039GB/s | 300~400W | Ampere sm_80 | 大模型单卡方案 |
| L4 | 24GB GDDR6 | 300GB/s | 72W | Ada sm_89 | 单槽半高，支持 FP8 |
| L40 / L40S | 48GB GDDR6 | 864GB/s | 300~350W | Ada sm_89 | 推理热门，支持 FP8 |
| L20 | 48GB GDDR6 | 864GB/s | 275~300W | Ada sm_89 | 中国特供版 L40 |
| H100 / H800 | 80GB HBM3 | 2000~3000GB/s | 350~700W | Hopper sm_90 | 训练旗舰 |

**选卡方法**：先定要跑多大的模型（看第三节显存测算），再倒推需要多少显存，最后看带宽和 sm 版本支不支持目标精度。

**二手卡验货**（必做）：
```bash
nvidia-smi -q -d ECC # 看 Volatile ECC 错误计数，有增长就退货
nvidia-smi --query-gpu=name,memory.total --format=csv # 确认显存容量，防 16G 冒充 32G
```
满载跑 10 分钟，温度稳定在 75°C 以下、无 ECC 报错、无降频，才算过关。

## 三、显存怎么算

**公式**：权重显存 = 参数量 × 每参数字节数（FP16 ×2、INT8 ×1、INT4 ×0.5）；总需求 = 权重显存 + KV Cache + 10% 余量。

**速查表**（V100 视角）：

| 模型 | FP16 | INT4 (GPTQ) | 单 V100-32G | 双 V100-32G | 四 V100-32G |
|---|---|---|---|---|---|
| 7B | 14GB | 3.5GB | ✅ FP16 | ✅ | ✅ |
| 14B | 28GB | 7GB | ✅ FP16（短上下文） | ✅ | ✅ |
| 32B | 64GB | 16GB | GPTQ 可试（需验证） | GPTQ ✅ / INT8 ✅ | FP16 ✅ |
| 70B | 140GB | 35GB | ❌ | GPTQ ✅ | GPTQ ✅ / INT8 ✅ |

vLLM 按 `--gpu-memory-utilization 0.9` 算可用显存：单卡 32GB ≈ 28.8GB，双卡 ≈ 57.6GB，四卡 ≈ 115GB。**32B FP16（64GB 权重）要 4 张 V100-32G，不是 2 张**。超了直接 OOM 报错。

**一句话判据**：权重 + KV Cache + 10% 余量 < 可用显存总量，就能跑。

**选型分档**：单卡跑 Qwen3-14B FP16（短上下文）；双卡跑 Qwen3-32B-GPTQ；四卡跑 Qwen3-32B FP16、70B 级 GPTQ。**通用原则**：V100 上 FP16 永远最稳；INT4 用来"装下更大的模型"，别指望它提速。

**选模型三步**：定用途（聊天助手下 Instruct 版）→ 按公式算显存 → 选精度（V100：FP16 最稳 → 装不下就 GPTQ INT4 → 别碰 AWQ/FP8/BF16）。国内下模型用 ModelScope，比 HuggingFace 快得多。

## 四、装机要点

**原则**：被动散热卡**必须**配服务器机箱风道，别拿消费级主板+机箱硬上。放家里选 4U（卡直接插，风道顺），放机房选 2U。

**常见二手服务器**：Dell PowerEdge R740（2U，iDRAC 好用）、超微 Supermicro 4029 系列（4U，能上 8~10 张卡）。

**CPU/内存**：推理主要吃 GPU，CPU 别多花钱。双路 Xeon Scalable 二手 + 64~128GB DDR4 ECC REG 足够。64GB 起步，128GB 舒服。

**买之前确认三件事**：① IPMI/BMC 能进；② 电源功率够（多卡至少 1600W）；③ PCIe 槽位是 x16 且卡装得下。

**散热**：前进后出，风道里别挡线。正常跑推理压在 70~75°C，超 80°C 降频。监控命令：`nvidia-smi dmon -s pucvmt`。家用降噪用 `ipmitool` 或 iDRAC 调风扇策略。

**供电**：所有部件 TDP 相加 ×1.3。双 V100 约 1050W → 选 1600W；四卡约 1900W → 选 2500W 或冗余电源。Tesla 卡 8-pin 是 EPS 线序，用服务器电源自带的线，**别自己转接**。1400W ÷ 220V ≈ 6.4A，普通 10A 插座够用，别和空调同回路。

**装机到系统**：
1. 浏览器进 iDRAC/IPMI，挂载 Ubuntu 22.04 LTS Server ISO 远程安装，不用接显示器。
2. 装驱动：`sudo apt install nvidia-driver-550`，`reboot`，`nvidia-smi` 看到所有卡即成功。
3. 装 Docker + `nvidia-container-toolkit`，用 `docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi` 验证。
4. `nvidia-smi topo -m` 检查拓扑，NVL（NVLink）最好，NODE（跨 NUMA）最差。
5. 可选：`sudo nvidia-smi -i 0 -pl 250` 限功耗墙，温度噪音双降，性能损失约 5%。

**存储**：系统盘 500GB~1TB NVMe；模型盘单独 2TB+（32B FP16 约 64GB，70B FP16 约 140GB）；模型缓存改 `HF_HOME=/data/models` 指到数据盘。

## 五、vLLM 部署

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
多卡把 `--tensor-parallel-size` 改成卡数。

| 参数 | 意思 |
|---|---|
| `--dtype half` | **V100 必加**，强制 FP16 |
| `--tensor-parallel-size` | 张量并行卡数，几张卡填几 |
| `--gpu-memory-utilization 0.9` | 显存用 90%，留 10% 保命 |
| `--enable-prefix-caching` | 开前缀缓存，TTFT 大杀器 |
| `--max-model-len` | 最大上下文，按需设，别拉满 |
| `--max-num-seqs` | 最大并发，单用户设 4~8 |
| `--api-key` | **必设**，不设等于裸奔 |
| `--enforce-eager` | V100 报 attention 相关错时再加 |

**验证**：
```bash
curl http://localhost:8000/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer sk-你自己设一个密码" \
-d '{"model": "Qwen/Qwen3-14B", "messages": [{"role": "user", "content": "你好"}]}'
```
**排错**：`docker logs -f vllm`。OOM 就调小显存占用、换小模型或调小 `--max-model-len`；报 `Minimum capability: 75` 是下了 AWQ 版，换 FP16 或 GPTQ。

**轻量备选**：Ollama（`ollama pull qwen3:14b`）适合尝鲜，多卡高并发不如 vLLM。vLLM 提供 OpenAI 兼容接口，应用代码只改 `base_url` 就能接。

## 六、优化

**TTFT（首字延迟）**：1. `--enable-prefix-caching`，对话场景最有效；2. 缩短 prompt，历史做滑动窗口；3. 小模型天生更快；4. Chunked Prefill 默认开着。V100 上别为 TTFT 去量化，INT4 不一定更快。

**解码速度**：多卡并行（NVLink 下效率更高）、控制上下文别堆太长。V100 上 FP16 的 decode 往往比 GPTQ-INT4 快。

| 卡 | 带宽 | 32B-GPTQ(16GB)理论速度 |
|---|---|---|
| V100 | 900GB/s | ~56 tok/s |
| RTX 3090 | 936GB/s | ~58 tok/s |
| L20 | 864GB/s | ~54 tok/s |
| A100 40GB | 1555GB/s | ~97 tok/s |

实际取理论值的 60~70%。中文语音助手 30 tok/s 已远超人说话速度。

**手算公式**：Decode 每秒 token ≈ 带宽 ÷ 模型权重字节数（×0.6~0.7）；TTFT ≈ max（权重字节数 ÷ 带宽，2 × 参数量 × prompt token ÷ 算力）+ 框架开销。带宽只给 TTFT 兜底，真正决定 TTFT 的是算力 × prompt 长度。

**vLLM 量化兼容性（V100 必查）**：AWQ ❌、GPTQ ✅、Marlin 加速核 ❌、bitsandbytes ✅、GGUF ✅。部署前以官方文档为准，先拿小模型验证。

## 七、安全与电费

**vLLM 默认没有鉴权**，不设 `--api-key` 等于把卡送给全网。加固四步：设 API Key → 防火墙只开必要端口 → 外网访问走 Nginx/Caddy 反代 + HTTPS → SSH 密钥登录、禁密码、装 fail2ban。**内网最省事**：Tailscale 组网直接访问，不暴露公网。

**电费**：功率(kW) × 24 × 30 × 电价。双 V100 满载 ~1.1kW，一月 ~435 元；四卡 ~1.9kW，一月 ~750 元（0.55 元/度）。空闲单卡约 60~80W。省电：`nvidia-smi -pl 250` 降功耗墙、不用就关机、批量任务放夜间低谷电价跑。

## 八、RAG、量化、微调（一句话版）

**RAG**：文档切块 → 转向量存库 → 提问时检索相关块拼进 prompt。MaxKB 一行 Docker 起：`docker run -d --name maxkb -p 8080:8080 1panel/maxkb`，中文 embedding 用 bge-m3。你的语音助手链路就是：VAD → ASR →（MaxKB RAG +）Qwen → TTS。

**自己量化**：V100 压 GPTQ（`auto-gptq` + `optimum`，校准集用 wikitext2），别压 AWQ；给 llama.cpp 用就压 GGUF。

**微调**：LoRA 只训一组小适配器，QLoRA = 4-bit 基座 + LoRA。工具用 LLaMA-Factory（中文友好，V100 可用）。数据是问答对 jsonl，几百到几千条见效。vLLM 加载：`--enable-lora --lora-modules my-adapter=/data/adapters/my-lora`。

## 九、DIY 攒机（4×V100 为例）

| 部件 | 选型 | 说明 |
|---|---|---|
| CPU | AMD EPYC Rome（见下表） | 单颗 128 条 PCIe 通道，不用双路 |
| 主板 | **ASRock Rack ROMED8-2T** | ATX，单 SP3，**7× PCIe 4.0 x16**，AST2500（VGA+IPMI），双万兆网口 |
| 内存 | DDR4-3200 REG ECC 8×16GB | 8 条插满=8 通道；**必须是 REG/ECC** |
| 机箱 | 4U 机架式（支持 ATX，8 槽位） | 前面板能装 3×120mm 风扇 |
| 电源 | 1600W | 见下文，8 个 EPS 接口是关键 |
| 风扇 | 3×12038 暴力扇 | 前面板进风，直吹 GPU |

**为什么选 EPYC**：单颗给 128 条 PCIe 通道，4 张 x16 卡+硬盘全够；Xeon 要双路才有这么多通道。

**CPU 选型（EPYC Rome / SP3，二手主力）**：

| 型号 | 核心/线程 | 基频/加速 | TDP | 适合 |
|---|---|---|---|---|
| 7282 | 16/32 | 2.8/3.2GHz | 120W | 最省电，纯推理够用 |
| 7302 | 16/32 | 3.0/3.3GHz | 155W | **甜点**：主频最高，Python 单线程也快 |
| 7352 | 24/48 | 2.3/3.2GHz | 155W | 核多又省电 |
| 7402 | 24/48 | 2.8/3.35GHz | 180W | 性能最均衡 |
| 7502 | 32/64 | 2.5/3.35GHz | 180W | 32 核，跑虚拟化/多服务 |
| 7452 | 32/64 | 2.35/3.35GHz | 155W | 32 核里最省电 |

**买 CPU 三个警告**：带 P 后缀（如 7302P）是单路专用版，ROMED8-2T 能用还更便宜，但以后换双路板就废了；避开 Dell/HP 锁定版，DIY 板子点不亮；推理+Python/Docker，**7302 是甜点**。

**电源方案（DIY 最大的坑）**：V100 PCIe 32GB 是 TDP 250W，**每张卡 2× 8-pin EPS 供电**，4 张卡 = 8 个接口，普通 ATX 1600W 只有 2 个 CPU 8-pin，根本不够。方案 A：双 ATX 电源 + Add2PSU 同步启动器；方案 B：超微 4U 机箱 + 服务器冗余电源 + PDB 分配板，自带 GPU 供电线，线序不会错。

**风道**：前进后出；隔槽插卡（PCIE1/3/5/7，每张空一槽）；CPU 加导风罩；走背线，风道里不许有线挡着。满载 10 分钟温度压在 75°C 以下才算过关。ServeTheHome 实测过单路 EPYC + 4× V100 32GB，靠前置大风扇+导风罩压住被动卡。

## 十、2.5 万预算配置单（2026-10-06，拿去直接发给定制厂商）

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

**NVLink 说明（2026-10-06 修正）**：**零售版 PCIe V100（PG500）没有 NVLink 金手指，不支持桥接器**，只有 DGX Station 定制版是例外。4 卡按无 NVLink 规划，vLLM 走 PCIe 通信照样跑。如果 NVLink 是刚需，走 SXM2 卡 + NVLink 转接底板路线（底板约 800-1500 元），另行配单。

**预算分配**（估算）：4× V100 32GB（eBay 约 $400-500/张）约 14000 + 主机（CPU+板+128G 内存+1T NVMe+1600W 电源+4U 机箱）约 9000，合计约 23000，余 2000 弹性。

**下单前三句话**：配置单每项写进订单，卡必须写死"32GB PCIe 原生"；发货前 4 卡全插点亮，`nvidia-smi` 截图+拷机 30 分钟，温度正常；质保**三年**（店保）写进订单：保什么、怎么保、运费谁出，木架发货、运费谁出，写清楚。

**避坑**：35999 的 SXM2 丐版（E5-2686 v4 + X99 寨板 + 转接板）别碰，贵了至少 13000，PCIe 只能跑 x8。DIY 比整机省不了太多钱，整机贵就贵在电源、风道、兼容性都调好了。DIY 的价值是**你彻底搞懂每个部件**，以后坏了自己会修。

---

*学习笔记 v8 精简版，2026-10-06。vLLM 版本迭代快，量化支持矩阵以官方文档为准，部署前先小模型验证。主板槽位、CPU 参数、V100 供电均以官网/TechPowerUp 规格页为准。价格为估算，实际以卖家报价为准。NVLink 兼容性结论 2026-10-06 修正：零售 PCIe V100 无 NVLink 金手指。*

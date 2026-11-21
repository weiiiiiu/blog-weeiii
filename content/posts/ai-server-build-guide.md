---
title: AI 服务器搭建学习笔记
date: 2026-11-22T02:15:00+08:00
categories: 开发
tags:
  - AI 服务器
  - vLLM
  - 模型部署
  - 学习笔记
description: 从选卡、算显存、装机到 vLLM 部署、优化的精简版笔记，走数据中心卡路线。
draft: false
---

> 这是 2026 年 10 月整理的学习笔记精简版：只留能直接用的结论、表格和命令。走的是数据中心卡路线，目标是在自己的服务器上跑大模型推理。

![从买卡到跑起来：选卡、算显存、装机、部署、优化五步](/imgs/learning-notes/ai-server-build-overview.svg)

[查看大图](/imgs/learning-notes/ai-server-build-overview.svg) · [Mermaid 源码](/diagrams/learning-notes/ai-server-build-overview.mmd)

## 一、术语速查

| 词 | 一句话 |
|---|---|
| 数据中心卡 | T4 / A100 / L4 / L40 / L20 / H100，被动散热、没风扇、无视频输出、ECC 显存，为 7×24 服务器设计 |
| 被动散热 | 只有散热片没风扇，靠机箱风道吹透；离开服务器风道必过热降频 |
| 显存容量 vs 带宽 | 容量定"装不装得下模型"，带宽定"跑得快不快"；推理速度 ≈ 带宽 ÷ 模型大小 |
| HBM / GDDR | HBM 带宽大、贵；GDDR 便宜、带宽低一些 |
| Compute Capability | `sm_xx` 编号定架构代际，直接决定支持哪些精度；买卡前先查 sm 版本，再看模型要什么精度，对不上就跑不了 |
| NVLink | 卡间高速直连，带宽远高于 PCIe；多卡跑大模型时卡间同步靠它 |
| 2U / 4U | 服务器高度，1U=4.45cm；2U 卡要横插，4U 可直接竖插 |
| IPMI / BMC / iDRAC | 远程管理芯片，不接显示器就能装系统；数据中心卡无视频输出，**装机全靠它** |
| EPS 12V 8-pin | 数据中心卡的 8-pin 是 CPU 线序，**不是显卡 8-pin**，插错烧卡 |
| 温度墙 | 超温自动降频保护；跑推理一般压在 70~75°C，超 80°C 开始降频 |

**精度格式**：FP16（2 字节，推理常用）、BF16（16 位，范围更大）、FP8（8 位，新卡支持）、INT8、INT4（GPTQ / AWQ 两种算法）。

**量化**：把 FP16 压成 INT8/INT4，显存减半。不同架构支持的量化格式不同，部署前查官方兼容表，先拿小模型验证。

**KV Cache**：生成时缓存之前 token 的 Key/Value，上下文越长占显存越多。Qwen3-32B 每 token 约 0.25MB，32k 上下文约 8GB。

**MoE**：总参数大、每次只激活几个专家，如 Qwen3-30B-A3B 每次只用 30 亿参数。显存小想用大模型优先看 MoE。**Instruct** 是会聊天的版本，做助手下 Instruct 版。

**TTFT**：发请求到第一个字吐出来，几乎完全由 Prefill（读 prompt）决定。**Decode** 是一个字一个字生成，瓶颈在显存带宽，速度 ≈ 带宽 ÷ 模型大小。**vLLM** 是目前主流推理引擎，自带 OpenAI 兼容 API；**Ollama** 最简单，适合尝鲜；**llama.cpp + GGUF** 是保底方案。

## 二、选卡

| 型号 | 显存 | 带宽 | 功耗 | 架构 / sm | 特点 |
|---|---|---|---|---|---|
| T4 | 16GB GDDR6 | 320GB/s | 70W | Turing sm_75 | 最省电，轻量推理 |
| A100 40GB | 40GB HBM2e | 1555GB/s | 250W | Ampere sm_80 | 支持 BF16，AWQ 全功能 |
| A100 80GB | 80GB HBM2e | 2039GB/s | 300~400W | Ampere sm_80 | 大模型单卡方案 |
| L4 | 24GB GDDR6 | 300GB/s | 72W | Ada sm_89 | 单槽半高，支持 FP8 |
| L40 / L40S | 48GB GDDR6 | 864GB/s | 300~350W | Ada sm_89 | 推理热门，支持 FP8 |
| L20 | 48GB GDDR6 | 864GB/s | 275~300W | Ada sm_89 | 中国特供版 L40 |
| H100 / H800 | 80GB HBM3 | 2000~3000GB/s | 350~700W | Hopper sm_90 | 训练旗舰 |

**选卡方法**：先定要跑多大的模型（看第三节显存测算），再倒推需要多少显存，最后看带宽和 sm 版本支不支持目标精度。

**二手卡验货**（必做）：
```bash
nvidia-smi -q -d ECC      # 看 Volatile ECC 错误计数，有增长就退货
nvidia-smi --query-gpu=name,memory.total --format=csv  # 确认显存容量，防小显存冒充大显存
```
满载跑 10 分钟，温度稳定在 75°C 以下、无 ECC 报错、无降频，才算过关。

## 三、显存怎么算

**公式**：权重显存 = 参数量 × 每参数字节数（FP16 ×2、INT8 ×1、INT4 ×0.5）；总需求 = 权重显存 + KV Cache + 10% 余量。

**速查表**（按显存档位）：

| 模型 | FP16 | INT4 | 24GB | 48GB | 96GB | 128GB |
|---|---|---|---|---|---|---|
| 7B | 14GB | 3.5GB | ✅ FP16 | ✅ | ✅ | ✅ |
| 14B | 28GB | 7GB | INT4 ✅ | ✅ | ✅ | ✅ |
| 32B | 64GB | 16GB | INT4 ✅ | INT4 ✅ | ✅ FP16 | ✅ |
| 70B | 140GB | 35GB | ❌ | INT4 ✅ | INT4 ✅ | INT4 ✅ |

vLLM 按 `--gpu-memory-utilization 0.9` 算可用显存：24GB ≈ 21.6GB，48GB ≈ 43.2GB，96GB ≈ 86.4GB，128GB ≈ 115GB。超了直接 OOM 报错。

**一句话判据**：权重 + KV Cache + 10% 余量 < 可用显存总量，就能跑。

**选型分档**：24GB 跑 7B FP16、14B INT4；48GB 跑 14B FP16、32B INT4；96GB 跑 32B FP16；128GB 跑 32B FP16 长上下文、70B INT4。**通用原则**：FP16 最稳；INT4 用来"装下更大的模型"，别指望它提速。

**选模型三步**：定用途（聊天助手下 Instruct 版）→ 按公式算显存 → 选精度（FP16 最稳 → 装不下就 INT4）。国内下模型用 ModelScope，比 HuggingFace 快得多。

## 四、装机要点

**原则**：被动散热卡**必须**配服务器机箱风道，别拿消费级主板+机箱硬上。放家里选 4U（卡直接插，风道顺），放机房选 2U。

**常见二手服务器**：Dell PowerEdge R740（2U，iDRAC 好用）、超微 Supermicro 4029 系列（4U，能上 8~10 张卡）。

**CPU/内存**：推理主要吃 GPU，CPU 别多花钱。双路 Xeon Scalable 二手 + 64~128GB DDR4 ECC REG 足够。64GB 起步，128GB 舒服。

**买之前确认三件事**：① IPMI/BMC 能进；② 电源功率够（多卡至少 1600W）；③ PCIe 槽位是 x16 且卡装得下。

**散热**：前进后出，风道里别挡线。正常跑推理压在 70~75°C，超 80°C 降频。监控命令：`nvidia-smi dmon -s pucvmt`。家用降噪用 `ipmitool` 或 iDRAC 调风扇策略。

**供电**：所有部件 TDP 相加 ×1.3 留余量。数据中心卡的 8-pin 是 EPS 线序，用服务器电源自带的线，**别自己转接**。1400W ÷ 220V ≈ 6.4A，普通 10A 插座够用，别和空调同回路。

**装机到系统**：
1. 浏览器进 iDRAC/IPMI，挂载 Ubuntu 22.04 LTS Server ISO 远程安装，不用接显示器。
2. 装驱动（按显卡型号选版本），`reboot`，`nvidia-smi` 看到所有卡即成功。
3. 装 Docker + `nvidia-container-toolkit`，用 `docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi` 验证。
4. `nvidia-smi topo -m` 检查拓扑，NVL（NVLink）最好，NODE（跨 NUMA）最差。
5. 可选：`sudo nvidia-smi -i 0 -pl 250` 限功耗墙，温度噪音双降，性能损失约 5%。

**存储**：系统盘 500GB~1TB NVMe；模型盘单独 2TB+（32B FP16 约 64GB，70B FP16 约 140GB）；模型缓存改 `HF_HOME=/data/models` 指到数据盘。

## 五、vLLM 部署

**单卡启动**：
```bash
docker run -d --gpus all \
  -p 8000:8000 \
  -v /data/models:/root/.cache/huggingface \
  --name vllm \
  vllm/vllm-openai:latest \
  --model Qwen/Qwen3-14B \
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
| `--tensor-parallel-size` | 张量并行卡数，几张卡填几 |
| `--gpu-memory-utilization 0.9` | 显存用 90%，留 10% 保命 |
| `--enable-prefix-caching` | 开前缀缓存，TTFT 大杀器 |
| `--max-model-len` | 最大上下文，按需设，别拉满 |
| `--max-num-seqs` | 最大并发，单用户设 4~8 |
| `--api-key` | **必设**，不设等于裸奔 |

**验证**：
```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-你自己设一个密码" \
  -d '{"model": "Qwen/Qwen3-14B", "messages": [{"role": "user", "content": "你好"}]}'
```
**排错**：`docker logs -f vllm`。OOM 就调小显存占用、换小模型或调小 `--max-model-len`；报量化相关错，检查模型量化格式与显卡架构是否匹配。

**轻量备选**：Ollama（`ollama pull qwen3:14b`）适合尝鲜，多卡高并发不如 vLLM。vLLM 提供 OpenAI 兼容接口，应用代码只改 `base_url` 就能接。

## 六、优化

**TTFT（首字延迟）**：1. `--enable-prefix-caching`，对话场景最有效；2. 缩短 prompt，历史做滑动窗口；3. 小模型天生更快；4. Chunked Prefill 默认开着。量化主要是省显存，别指望它降 TTFT。

**解码速度**：多卡并行（NVLink 下效率更高）、控制上下文别堆太长。FP16 的 decode 往往比 INT4 稳。

| 卡 | 带宽 | 32B-INT4(16GB)理论速度 |
|---|---|---|
| RTX 3090 | 936GB/s | ~58 tok/s |
| L20 | 864GB/s | ~54 tok/s |
| A100 40GB | 1555GB/s | ~97 tok/s |

实际取理论值的 60~70%。中文语音助手 30 tok/s 已远超人说话速度。

**手算公式**：Decode 每秒 token ≈ 带宽 ÷ 模型权重字节数（×0.6~0.7）；TTFT ≈ max（权重字节数 ÷ 带宽，2 × 参数量 × prompt token ÷ 算力）+ 框架开销。带宽只给 TTFT 兜底，真正决定 TTFT 的是算力 × prompt 长度。

## 七、安全与电费

**vLLM 默认没有鉴权**，不设 `--api-key` 等于把卡送给全网。加固四步：设 API Key → 防火墙只开必要端口 → 外网访问走 Nginx/Caddy 反代 + HTTPS → SSH 密钥登录、禁密码、装 fail2ban。**内网最省事**：Tailscale 组网直接访问，不暴露公网。

**电费**：功率(kW) × 24 × 30 × 电价。双卡（约 1.1kW）一月 ~435 元；四卡（约 1.9kW）一月 ~750 元（0.55 元/度）。空闲单卡约 60~80W。省电：`nvidia-smi -pl 250` 降功耗墙、不用就关机、批量任务放夜间低谷电价跑。

## 八、RAG、量化、微调（一句话版）

**RAG**：文档切块 → 转向量存库 → 提问时检索相关块拼进 prompt。MaxKB 一行 Docker 起：`docker run -d --name maxkb -p 8080:8080 1panel/maxkb`，中文 embedding 用 bge-m3。语音助手链路就是：VAD → ASR →（MaxKB RAG +）Qwen → TTS。

**自己量化**：GPTQ（`auto-gptq` + `optimum`，校准集用 wikitext2）或 GGUF（给 llama.cpp 用），压之前确认目标卡支持这种格式。

**微调**：LoRA 只训一组小适配器，QLoRA = 4-bit 基座 + LoRA。工具用 LLaMA-Factory（中文友好）。数据是问答对 jsonl，几百到几千条见效。vLLM 加载：`--enable-lora --lora-modules my-adapter=/data/adapters/my-lora`。

---

*学习笔记 v8 精简版，2026-10-06。vLLM 版本迭代快，量化支持矩阵以官方文档为准，部署前先小模型验证。价格为估算，实际以卖家报价为准。*

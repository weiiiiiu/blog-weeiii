---
title: IBKR 转仓嘉信
date: 2026-08-15 21:30:00
categories: 投资
tags:
  - 投资
  - ACATS
description: 走 ACATS，两头都是 $0，申请在嘉信端提交，约 5–7 个工作日。转移期间持仓冻结，成本价会跟着转但晚 15 天到。
draft: false
---
> **一句话**：走 **ACATS**，两头都是 **$0**，申请在**嘉信端**提交，约 **5–7 个工作日**。
> 转移期间持仓冻结、不能交易；成本价会跟着转，但晚 15 天到。

适用场景：美股账户之间的转移（US broker → US broker）。

---

## 一、先分清 ACATS 和 FOP


| 方式 | 用途 | 用不用得上 |
| ----------------------------------------------------- | ----------------------------------------- | ---------------- |
| **ACATS** Automated Customer Account Transfer Service | 两家**美国券商之间**转移美股 / ETF / 期权 / 美债 / 现金，全自动 | ✅ 标准路径 |
| **FOP** Free of Payment | 转移**非美证券**到美国以外的机构（加拿大、欧洲、亚太） | ❌ 嘉信主要托管美国证券，用不到 |


选错的代价很实际：FOP 转出亚太非美证券要收 **USD 50/笔**，而 ACATS 是 $0。其他特殊方式（DWAC 转出 $100/笔、DRS 转出 $5/笔）标准美股转嘉信也不会碰到。

---

## 二、费用：两头都是 $0

**IBKR 侧**

- **ACATS 转出全免费**，全部转移（full）和部分转移（partial）**都是 $0**。官方 Other Fees 页写得很直白：`ACATS — Deposit or Withdrawal — None`
- **没有账户关闭费**
- 官方脚注："While IBKR does not charge for incoming or outgoing ACATS transfers, customers should consult with their sending or receiving firm to determine if there will be any applicable fees." ——即 IBKR 不收，但对方收不收要自己问

**嘉信侧**

- **转入 $0**
- （嘉信只对**整户转出**收 $50，那是反方向的事，与转入无关）

**Full vs Partial 没有成本差异**，两边都是 $0。唯一区别是部分转移要逐笔列出标的。

> **总成本：$0**——前提是走 ACATS，且持仓是标准美国证券。

---

## 三、流程：在嘉信端发起

ACATS 的规则是**指令由接收方录入系统**（FINRA Rule 11870），所以申请在**嘉信**提交，嘉信录入后系统自动通知 IBKR，两家对接完成。IBKR Client Portal 里虽然也有 Transfer Positions → Outgoing，但走标准美股 ACATS 时**不需要你在 IBKR 端操作**。

### 步骤

1. **先在嘉信开好对应类型的账户**（个人 / 联名 / IRA），注册信息必须与 IBKR 一致
2. **下载 IBKR 最新一期月结单**，嘉信要用它核对持仓
3. 在嘉信提交 **Transfer of Account（TOA / ACAT）申请**，填：
  - IBKR 账户号
  - 账户名称（须与嘉信完全一致）
  - 账户类型（individual / joint / IRA…）
  - 税号（SSN / Tax ID）
  - 选 **full** 还是 **partial**；partial 要逐笔列出 symbol + 数量
4. 附上 IBKR 月结单
5. 提交后跟踪状态即可，剩下的两家自动对接

### 材料清单

- IBKR 账户号、账户名称、账户类型
- SSN / Tax ID
- IBKR 最新月结单
- 标的清单（仅部分转移需要）

### 两个前提，不满足会被拒

- **两边注册信息必须一致**：姓名、税号、账户类型、法定居住国全部要 match，任一不符 ACATS 直接 reject
- **账户处于良好状态**：无未结保证金欠款（margin debit）、无未交收交易、无冻结或纠纷。有融资余额或空头持仓会让流程复杂化甚至失败

---

## 四、时间线


| 阶段 | 时长 | 依据 |
| ----------------------- | ------------ | ---------------- |
| 嘉信录入后，IBKR 核对（validate） | 1 个工作日内 | FINRA 11870 |
| 核对通过后完成资产交割 | 3 个工作日内 | FINRA 11870 |
| **整体完成（无异常）** | **5–7 个工作日** | SEC 口径不超过 6 个工作日 |


出问题会拖：信息不匹配、有不可转资产、保证金或分红待结算、需人工处理，都可能延到 **7–10 个工作日**，极端复杂情况约 **3 周**。

---

## 五、限制

### 转移进行中：持仓冻结

- IBKR 核对通过后，**账户即被冻结直到转移完成**；**所有未成交挂单会被取消，且不能下新单**
- **全部转移**：这些持仓期间基本无法交易
- **部分转移**：只冻结正在转移的标的，其余照常交易

### 转移完成后：账户不会自动关闭

- 全部转移后 IBKR 账户变成**空账户**，但**不会被自动注销**
- **不产生闲置费**：IBKR 自 **2021-07-01** 起取消了所有 inactivity fee，空账户可无限期免费保留
- 主动申请关闭的话，IBKR 会在最后一笔提款后**保留约 3 个月**（收尾费用、利息、分红、公司行动），之后永久关闭
- 部分转移则账户完全正常，无任何限制

---

---

## 来源

- [IBKR Other Fees（ACATS=None、Asset Transfer Out、DWAC/DRS）](https://www.interactivebrokers.com/en/pricing/other-fees.php)
- [IBKR Campus — Cash & Position Transfers](https://www.interactivebrokers.com/campus/trading-lessons/cash-and-position-transfers/)
- [IBKR Guides — ACATS Transfers](https://www.ibkrguides.com/brokerportal/transferandpay/acatstrans.htm)
- [IBKR Guides — Free of Payment (FOP)](https://www.ibkrguides.com/brokerportal/transferandpay/basic-fop.htm)
- [IBKR Guides — Position Transfer Basis（成本价）](https://www.ibkrguides.com/clientportal/performanceandstatements/positiontransfer.htm)
- [SEC — Transferring your Brokerage Account（时间 / 冻结）](https://www.sec.gov/about/reports-publications/investorpubsacctxferhtm)
- [FINRA Rule 11870 — Customer Account Transfer Contracts](https://www.finra.org/rules-guidance/rulebooks/finra-rules/11870)
- [DTCC — Cost Basis Reporting Service (CBRS)](https://www.dtcc.com/clearing-and-settlement-services/equities-clearing-services/cbrs)
- [第三方费用核对 — IBKR Transfer Out Fee (ACAT) 2026](https://www.brokerage-review.com/account-fee/acat/interactive-brokers-transfer-fee.aspx)
- [IBKR 取消闲置费（2021-07-01 生效）](https://www.daytrading.com/interactive-brokers-ends-account-inactivity-fees)
- [关闭 IBKR 账户（3 个月收尾期）](https://brokerchooser.com/invest-long-term/how-to-exit/close-account-interactive-brokers)


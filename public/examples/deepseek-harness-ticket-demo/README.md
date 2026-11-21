# DeepSeek Harness 工单流程练习资料

本目录包含完全虚构的业务数据，没有真实客户、付款或服务记录。
用途：体验 Harness 读取多份资料、关联证据、按业务规程给出核查建议的过程。
它不包含内部系统连接器，也不会真的补开通；真实业务接入需企业提供受控工具接口。

## 使用步骤

1. 解压后检查本目录，仅含 CSV、Markdown 和任务文本，没有程序脚本。
2. 安装满足教程要求的 Node.js，在此目录启动固定版本：
   npx @deepseek-ai/dsh@0.2.2-rc.5 web
3. 在 Web UI 设置模型服务，选择本目录为工作区。
4. 新建会话，粘贴 task.txt 的内容。
5. 检查是否真的读取资料，以及报告中的每项事实能否定位到对应记录。

## 文件

- tickets.csv：待核查工单及关联业务标识。
- orders.csv：支付与退款状态。
- entitlements.csv：当前权益，包含另一账号作为关联干扰项。
- activation_jobs.csv：开通任务状态和该订单当前活动任务数。
- activation_events.csv：支付回调和开通调用的时间线。
- runbook.md：模拟等待窗口、建议条件和操作边界。
- task.txt：可以直接粘贴的任务描述。

观察时点固定为 2026-11-21T16:18:00Z；不要拿电脑当前时间替代。
完整教程：https://blog.006573.xyz/posts/deepseek-harness-enterprise-workflow

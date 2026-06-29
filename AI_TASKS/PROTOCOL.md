# ChatGPT + Codex + GitHub 协作协议

## 核心原则

仓库是长期记忆，聊天只是临时界面。

所有任务、交付、审查、风险说明，都必须沉淀到 GitHub Issue、PR、PR 评论和 `AI_TASKS/handoff.md`。

用户不再负责在 ChatGPT 和 Codex 之间复制长报告。

## 角色分工

### 用户

* 只提出目标
* 只提供 Issue / PR 编号
* 只做最终合并、暂停或回滚决策
* 不负责搬运 Codex 长报告
* 不在聊天中粘贴密钥、token、数据库连接串

### ChatGPT

* 负责拆解任务
* 负责设计 Issue 内容
* 负责审查 PR
* 负责判断风险
* 负责给下一步策略
* 以 GitHub Issue / PR / handoff 为主要上下文

### Codex

* 负责读取 Issue
* 负责开分支执行
* 负责修改代码
* 负责运行检查
* 负责创建 PR
* 负责更新 PR 描述
* 负责在 PR 评论中写交付报告
* 负责更新 `AI_TASKS/handoff.md`

## 标准流程

1. 用户提出目标
2. ChatGPT 输出 GitHub Issue 内容
3. 用户或 Codex 创建 Issue
4. Codex 基于 Issue 新建分支
5. Codex 执行任务
6. Codex 创建 PR
7. Codex 更新 PR 描述、PR 评论和 `AI_TASKS/handoff.md`
8. 用户只告诉 ChatGPT：看 PR #x
9. ChatGPT 审查 PR
10. 用户决定 merge / 修改 / 暂停

## 禁止流程

* 禁止 Codex 只在聊天中汇报，不写 PR
* 禁止用户复制 Codex 长报告给 ChatGPT
* 禁止 ChatGPT 长期输出大段让用户来回搬运的指令
* 禁止没有 Issue 就直接做复杂功能
* 禁止把部署、数据库、支付、认证混在一个任务里
* 禁止提交真实密钥
* 禁止把晟景装饰内容混进 GEO Monitor SaaS

## 最小沟通格式

用户以后只需要说：

* 创建任务：我要做 xxx
* 审查任务：看 PR #x
* 继续任务：继续 Issue #x
* 暂停任务：暂停 Issue #x
* 合并后：PR #x 已合并
* 新开对话：继续 geo-monitor-saas，先读 AI_TASKS/PROTOCOL.md

## 每个任务的完成定义

任务只有满足以下条件才算完成：

1. GitHub Issue 已记录任务目标
2. Codex 已创建 PR
3. PR 描述完整
4. 自测结果写清楚
5. `AI_TASKS/handoff.md` 已更新
6. ChatGPT 审查通过
7. 用户合并或明确暂停

## 新对话恢复方式

任何新 ChatGPT 对话开始时，只需要输入：

“继续 geo-monitor-saas 的协作流程，请先根据仓库里的 AI_TASKS/PROTOCOL.md、AGENTS.md、PR 和 handoff 继续。”

ChatGPT 应优先基于仓库文件和 GitHub PR / Issue 状态继续，而不是依赖旧聊天内容。

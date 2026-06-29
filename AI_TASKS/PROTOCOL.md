# ChatGPT + Codex + GitHub 协作协议

## 1. 核心原则

仓库是长期记忆，聊天只是临时界面。

所有任务目标、实施结果、风险说明、验收记录，都应沉淀到 GitHub Issue、PR、PR 评论和 `AI_TASKS/handoff.md`。用户不负责在 ChatGPT 和 Codex 之间复制长报告。

## 2. 角色分工

### 用户

- 提出目标。
- 提供 Issue / PR 编号。
- 做最终合并、暂停、回滚、发布决策。
- 不在聊天中粘贴密钥、token、数据库连接串、账号密码。

### ChatGPT

- 拆解任务。
- 设计 Issue 内容。
- 审查 PR。
- 判断风险。
- 给下一步策略。
- 以 GitHub Issue / PR / handoff 为主要上下文。

### Codex

- 读取 Issue、PR 和仓库协作文档。
- 基于任务新建 `codex/*` 分支。
- 修改代码或文档。
- 运行必要检查。
- 创建 PR。
- 更新 PR 描述或 PR 评论。
- 更新 `AI_TASKS/handoff.md`。

## 3. 标准流程

1. 用户提出目标。
2. ChatGPT 输出 GitHub Issue 内容，或用户直接创建 Issue。
3. Codex 读取 Issue 和仓库协作文档。
4. Codex 从 `main` 新建 `codex/*` 分支。
5. Codex 执行任务。
6. Codex 运行必要检查。
7. Codex 创建 PR。
8. Codex 更新 PR 描述或 PR 评论，以及 `AI_TASKS/handoff.md`。
9. 用户让 ChatGPT 审查 PR。
10. 用户决定 merge / 修改 / 暂停 / 回滚。

## 4. 禁止流程

- 禁止 Codex 只在聊天中汇报，不写 PR / handoff。
- 禁止用户搬运 Codex 长报告给 ChatGPT。
- 禁止没有 Issue 就直接执行复杂功能。
- 禁止自动合并 PR。
- 禁止把部署、数据库、支付、认证混在一个低风险任务里。
- 禁止提交真实密钥、token、数据库连接串、账号密码。
- 禁止使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 5. Human Gate

以下任务必须进入 Human Gate，由用户明确确认后才能继续：

- 生产部署。
- 生产数据库迁移。
- 删除、重置、批量改写数据。
- 修改支付、认证、权限、安全策略。
- 修改生产环境变量或云服务配置。
- 批量发送邮件、短信、消息或营销内容。
- 自动合并 PR。

Codex 可以准备方案、diff、检查报告或草稿 PR，但不能绕过 Human Gate 完成最终动作。

## 6. Loop 协议入口

当任务同时满足以下条件时，必须参考 `AI_TASKS/LOOP_PROTOCOL.md`：

1. 重复性：未来会反复执行。
2. 可验收：能明确判断完成状态。
3. 有价值：收益高于执行成本和风险。

典型场景：

- CI 修复。
- 批量内容生成。
- GEO 监控。
- 部署前检查。
- 数据质量巡检。
- 重复性产品迭代。

## 7. PR 交付要求

每个 PR 至少说明：

1. 修改了哪些文件。
2. 是否只改文档。
3. 是否修改业务代码。
4. 是否修改部署配置。
5. 是否涉及密钥。
6. 是否需要人工确认。
7. 自测命令和结果。
8. 风险和回滚建议。
9. 下一步建议。

## 8. 新对话恢复方式

新 ChatGPT / Codex 对话开始时，优先读取：

1. `AGENTS.md`
2. `AI_TASKS/current.md`
3. `AI_TASKS/PROTOCOL.md`
4. `AI_TASKS/handoff.md`
5. 相关 GitHub Issue / PR

不要依赖旧聊天记录作为唯一上下文。

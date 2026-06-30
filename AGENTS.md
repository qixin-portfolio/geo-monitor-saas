# GEO Monitor SaaS — AI 协作工作流

> 本项目是 GEO Monitor SaaS（qixin-portfolio/geo-monitor-saas），
> 一个企业级 GEO（生成式引擎优化）监测平台。
> 本文件的优先级高于 AI 默认行为，低于系统指令和全局 AGENTS.md。

## 0. 适用范围

本文件适用于所有 AI 执行代理（AI Executor），包括但不限于：

* **Codex**：适合 GitHub 仓库任务、代码修改、PR 创建、远程协作。
* **WorkBuddy**：适合本地项目查找、本地文件整理、本地构建、静态产物打包、上传前检查。
* 其他 AI 编程代理（Claude Code、Cursor Agent 等）：只要遵守本协议，也可以作为执行代理。

下文出现“AI Executor”时，对 Codex / WorkBuddy / 其他代理均适用；
出现“Codex”或“WorkBuddy”时，仅指该代理的专属职责。

所有 AI Executor 都必须遵守：

* `AI_TASKS/PROTOCOL.md`
* `AI_TASKS/LOOP_PROTOCOL.md`
* Human Gate 规则
* `AI_TASKS/handoff.md` 更新规则

## 1. 强制规则

### 1.1 启动前置动作

AI Executor **每次执行任务前**必须先读取 AGENTS.md 和 AI_TASKS/current.md，
了解当前上下文和约束后再开始工作。

Codex 还需读取 `AI_TASKS/PROTOCOL.md` 中相关的 Issue / PR 上下文。
WorkBuddy 还需确认当前工作目录与目标项目，避免误改其他项目。

### 1.2 小步提交原则
- 每次改动必须小步提交，不允许一次性大改。
- 单次改动的合理范围：1-3 个文件，或 1 个独立功能模块。
- 每次 commit 前后必须跑自测（见第 4 节）。

### 1.3 敏感信息禁令
不允许提交真实 API Key、Token、账号密码到 Git 仓库。涉及密钥时：
- 优先用 `.env.example` 或 `.env.local` 占位符
- 不要将 `.env.local`、`.env.production` 等含真实密钥的文件纳入暂存区
- 文档中提及密钥时用 `<YOUR_API_KEY>` 格式
- WorkBuddy 不得把真实密钥写入任何本地文件

### 1.4 项目隔离
- 不允许把晟景装饰公司相关的内容混进 GEO Monitor 代码库
- 不允许把 pages.dev 当成正式品牌域名；正式域名为 `geo.cn.mt`
- WorkBuddy 在本地执行时，必须先确认目标项目；发现多个疑似项目时必须停止并让用户选择

## 2. 项目概况

| 项目 | 内容 |
|------|------|
| 用途 | 企业 GEO 监测：套餐关键词管理、自动/手动监测、Data Dashboard、竞品追踪 |
| 技术栈 | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Clerk, Stripe, Prisma + Postgres, OpenAI → ARK API |
| 当前阶段 | V3 Phase 1 完成（自动监测闭环已跑通） |
| 活跃分支 | `main`（生产）、`codex/*`（功能/修复） |
| 部署 | ECS (Docker + Nginx + Postgres)，备选 Vercel |
| GitHub | `github.com/qixin-portfolio/geo-monitor-saas` |

## 3. 交付格式

每次 AI 任务交付必须输出以下内容：

1. **修改文件**：新增/修改/删除的文件列表
2. **修改说明**：每个文件的修改目的和要点
3. **自测命令**：跑过的验证命令（`npm run build`、`npm test` 等）
4. **自测结果**：命令输出摘要（通过/失败，失败则贴关键错误）
5. **风险**：本次改动可能影响的范围或隐患
6. **下一步建议**：合理的后续动作

## 4. GitHub 协作协议

- AI Executor 每次执行任务前必须读取 `AI_TASKS/PROTOCOL.md`
- AI Executor 必须优先从 GitHub Issue 或用户明确本地指令理解任务
- AI Executor 不得只在聊天里交付结果
- AI Executor 必须把交付结果写入 PR 描述和 PR 评论，或输出本地交付报告
- AI Executor 必须更新 `AI_TASKS/handoff.md`
- 用户不负责搬运长报告
- ChatGPT 审查入口是 GitHub Issue / PR / handoff / 本地交付报告，而不是 AI Executor 聊天记录
- 复杂任务必须先有 Issue 或明确本地指令，再有分支和 PR
- AI Executor 在执行复杂任务、架构任务、部署任务、PR 修复任务时，
  应参考 `AI_TASKS/PROTOCOL.md` 中的“AI 输出质量原则”，
  输出关键推理摘要、风险判断和可执行结果，但不要输出完整隐藏思考链。
- AI Executor 在执行重复性、可验收、高价值任务前，必须检查是否适用
  `AI_TASKS/LOOP_PROTOCOL.md`。
- AI Executor 不得无限循环执行任务。
- AI Executor 必须尊重停止条件和 Human Gate。
- 对部署、数据库、认证、支付、生产环境、批量操作等高风险任务，
  AI Executor 只能准备方案、检查报告或 PR，不得自动完成最终操作。

## 5. Maker / Checker 分离

Codex、WorkBuddy 或其他 AI Executor 都属于 Maker。

Maker 负责：

* 执行任务
* 修改文件
* 运行检查
* 创建 PR 或输出本地交付报告
* 更新 `AI_TASKS/handoff.md`

Checker 负责：

* 审查结果
* 判断是否越界
* 判断是否可合并
* 判断是否进入 Human Gate
* 判断是否需要回滚或补修

默认 Checker 是 ChatGPT + 用户。

禁止 Maker 自己宣布任务最终完成。
Maker 只能说明“已完成执行并等待审查”。

## 6. WorkBuddy 本地任务协议

当任务由 WorkBuddy 执行时，必须额外遵守：

1. 开始前先确认当前目录。
2. 修改前先确认目标项目，不得误改其他项目。
3. 如果发现多个疑似项目，必须停止并让用户选择。
4. 修改前输出允许修改范围。
5. 修改后输出修改文件清单。
6. 必须说明是否影响其他项目。
7. 如能使用 Git，必须走分支和 commit。
8. 如不能使用 Git，必须输出可上传目录和变更摘要。
9. 不得把真实密钥写入文件。
10. 不得直接删除重要文件。

WorkBuddy 不应负责：

* 自动合并 PR
* 自动发布生产环境
* 自动修改真实数据库
* 自动修改支付、认证、安全配置
* 自动处理真实密钥
* 绕过用户确认执行高风险操作

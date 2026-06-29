# GEO Monitor SaaS — AI 协作规则

> 本项目是 GEO Monitor SaaS（qixin-portfolio/geo-monitor-saas），一个企业级 GEO（生成式引擎优化）监测平台。
> 本文件优先级高于 AI 默认行为，低于 system、developer、安全、权限和全局 AGENTS.md。

## 1. 项目概况

| 项目 | 内容 |
|------|------|
| 用途 | 企业 GEO 监测：关键词管理、监测运行、Dashboard、竞品追踪、内容任务 |
| 技术栈 | Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Clerk, Stripe, Prisma + Postgres |
| 生产分支 | `main` |
| 功能分支 | `codex/*` |
| GitHub | `github.com/qixin-portfolio/geo-monitor-saas` |

## 2. 核心协作原则

1. 仓库是长期记忆，聊天只是临时界面。
2. 用户只提出目标、提供 Issue / PR 编号、做最终决策。
3. ChatGPT 负责拆任务、审 PR、判断风险、给下一步策略。
4. Codex 负责读 Issue、开分支、改代码、跑检查、创建 PR、更新 PR 描述和 `AI_TASKS/handoff.md`。
5. Codex 不得只在聊天中汇报，必须把结果写入 PR / handoff。
6. 复杂任务必须先有 Issue，再有分支和 PR。
7. 不允许自动合并 PR。
8. 部署、数据库、支付、认证、生产环境、删除数据、批量操作等高风险任务必须进入 Human Gate。
9. 对重复性、可验收、高价值任务，必须参考 `AI_TASKS/LOOP_PROTOCOL.md`。
10. 不允许提交真实密钥、token、数据库连接串、账号密码。

## 3. Codex 启动前置动作

每次执行任务前必须先读取：

1. `AGENTS.md`
2. `AI_TASKS/current.md`
3. `AI_TASKS/PROTOCOL.md`
4. 如任务具有重复性、可验收、有价值，再读取 `AI_TASKS/LOOP_PROTOCOL.md`

如果用户提供 Issue / PR 编号，Codex 必须优先从 GitHub Issue / PR 理解任务。

## 4. 执行边界

允许：

- 基于 Issue 或明确任务修改代码、文档、测试。
- 为任务创建 `codex/*` 分支。
- 运行必要的本地检查。
- 创建 PR，更新 PR 描述和 `AI_TASKS/handoff.md`。

禁止：

- 提交 `.env`、真实密钥、token、数据库连接串、账号密码。
- 自动合并 PR。
- 未经确认执行生产部署、生产数据库迁移、删除数据、重置配置。
- 大范围重构认证、支付、数据库、部署配置，除非 Issue 明确要求且通过 Human Gate。
- 使用 `git add .`、`git reset --hard`、`git clean`、force push。
- 把与 GEO Monitor 无关的业务内容混入本仓库。

## 5. 小步提交原则

- 单次任务应保持小范围、可回滚。
- 每次提交只包含本次任务相关文件。
- 复杂任务拆成多个 Issue / PR。
- 修改前先查现有文件、组件、工具函数、接口，不猜测项目结构。

## 6. 验证要求

默认检查：

- 文档-only 任务：运行 `git diff --check`。
- 代码任务：优先运行 `pnpm typecheck` 和 `pnpm build`，必要时运行相关测试。
- 如果无法运行检查，必须在 PR 和 handoff 中说明原因。

## 7. 交付要求

每个 PR 必须说明：

1. 修改了哪些文件。
2. 是否只改文档。
3. 是否修改业务代码。
4. 是否修改部署配置。
5. 是否涉及密钥。
6. 是否需要人工确认。
7. 自测命令和结果。
8. 下一步建议。

每次任务结束必须更新：

- PR 描述或 PR 评论。
- `AI_TASKS/handoff.md`。

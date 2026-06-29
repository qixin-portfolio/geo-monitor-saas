 # GEO Monitor SaaS — AI 协作工作流

 > 本项目是 GEO Monitor SaaS（qixin-portfolio/geo-monitor-saas），一个企业级 GEO（生成式引擎优化）监测平台。
 > 本文件的优先级高于 AI 默认行为，低于系统指令和全局 AGENTS.md。

 ## 1. 强制规则

 ### 1.1 启动前置动作
 Codex **每次执行任务前**必须先读取 AGENTS.md 和 AI_TASKS/current.md，了解当前上下文和约束后再开始工作。

 ### 1.2 小步提交原则
 - 每次改动必须小步提交，不允许一次性大改。
 - 单次改动的合理范围：1-3 个文件，或 1 个独立功能模块。
 - 每次 commit 前后必须跑自测（见第 4 节）。

 ### 1.3 敏感信息禁令
 不允许提交真实 API Key、Token、账号密码到 Git 仓库。涉及密钥时：
 - 优先用 `.env.example` 或 `.env.local` 占位符
 - 不要将 `.env.local`、`.env.production` 等含真实密钥的文件纳入暂存区
 - 文档中提及密钥时用 `<YOUR_API_KEY>` 格式

 ### 1.4 项目隔离
 - 不允许把晟景装饰公司相关的内容混进 GEO Monitor 代码库
 - 不允许把 pages.dev 当成正式品牌域名；正式域名为 `geo.cn.mt`

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

 - Codex 每次执行任务前必须读取 `AI_TASKS/PROTOCOL.md`
 - Codex 必须优先从 GitHub Issue 理解任务
 - Codex 不得只在聊天里交付结果
 - Codex 必须把交付结果写入 PR 描述和 PR 评论
 - Codex 必须更新 `AI_TASKS/handoff.md`
 - 用户不负责搬运长报告
 - ChatGPT 审查入口是 GitHub Issue / PR / handoff，而不是 Codex 聊天记录
 - 复杂任务必须先有 Issue，再有分支和 PR

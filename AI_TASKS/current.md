# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

Production Release Gate 设计：RepairTask 单条按钮 production 发布前 Gate

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/22](https://github.com/qixin-portfolio/geo-monitor-saas/pull/22)
- 分支：`codex/production-release-gate`
- 基线：远端 `main`，已包含 PR #21。
- 当前状态：PR #22 已创建，等待人工审查与合并确认。

## 背景

PR #21 已合并到 main，Staging RepairTask Button QA 记录已落库到仓库文档。

当前已完成：

- 本地 Button Browser QA：15 pass / 0 fail / 0 blocked。
- Staging Button QA：19 pass / 0 fail / 0 blocked。
- Staging 使用 Clerk Staging 真实登录。
- Staging 使用 Supabase `geo-monitor-staging` 和 transaction pooler。
- Tenant A / B 隔离通过。
- GeoContentTask QA 前 A=0 / B=0，QA 后 A=1 / B=1。
- duplicate / 已存在场景未重复写入。
- Content Backlog 可看到对应 tenant 任务。
- 未使用真实客户数据。

本轮只设计 production 发布前 Gate，不进入 production 发布、不连接 production DB、不修改功能代码。

## 本次目标

1. 新增 `docs/qa/repair-task-production-release-gate.md`。
2. 明确 production 发布前必须确认的 DB / Clerk / env / tenant / route protection 边界。
3. 明确 production 最小 smoke test。
4. 明确 Gate 通过前禁止事项。
5. 明确回滚方案。
6. 更新 `AI_TASKS/current.md` 和 `AI_TASKS/handoff.md`。
7. 创建 docs-only PR，不自动合并。

## 修改范围

- `docs/qa/repair-task-production-release-gate.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 禁止事项

- 不修改 `src`。
- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不新增 public API route。
- 不新增新的写库路径。
- 不部署 production。
- 不跑 production DB。
- 不接批量创建。
- 不接无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不改 UI。
- 不改 server action。
- 不提交 `.env.local`、seed、payload 或临时脚本。
- 不使用真实客户数据。
- 不打印完整 `DATABASE_URL`。
- 不打印 Clerk Secret、token、cookie 或密码。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] PR #21 已合并到 main。
- [x] Production Release Gate 文档已新增。
- [x] 文档记录已完成验证：本地 15 pass、staging 19 pass、A/B 隔离、A/B 任务数量、duplicate 未重复写入。
- [x] 文档明确 production 发布前必须确认 Production DB、Production Clerk、route protection、tenant resolution、env 边界。
- [x] 文档明确 production 不使用 staging Clerk key / staging Supabase / Neon / 测试库。
- [x] 文档明确 production release 前只读 smoke test。
- [x] 文档明确发布后最小 smoke test 只允许内部测试账号和内部测试 tenant。
- [x] 文档明确 Gate 通过前禁止批量、无人确认、全租户开放、新写库路径、公开 API、destructive production DB 操作。
- [x] 文档明确回滚优先隐藏入口 / 关闭按钮 / 回滚部署，不删除生产数据，不直接改 production DB。
- [x] `pnpm test:unit` 通过，19 个文件 / 94 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [x] PR 已创建。
- [x] `AI_TASKS/handoff.md` 已更新为最终 PR 状态。

## 是否需要 Loop

- 判断：需要。
- 依据：这是 production 发布前 Gate，涉及认证、数据库、写库按钮和发布风险，必须可验证、可停止、可追踪。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮只创建 Gate 文档 PR，不自动合并；是否进行 production smoke test 必须由人工确认。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

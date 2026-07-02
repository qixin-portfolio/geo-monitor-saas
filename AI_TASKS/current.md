# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

Production Smoke Test Readiness Check：RepairTask 单条按钮 production smoke test 前准备清单

## GitHub 入口

- PR：待创建
- 分支：`codex/production-smoke-test-readiness`
- 基线：远端 `main`
- 当前 main：`4cd4ec27fc51b8f47f17b22ca65f8c4ea8e9e556`
- 当前状态：正在创建 docs-only readiness 文档，等待 PR 和人工审查。

## 背景

RepairTask 单条“加入修复任务池”按钮链路当前主线状态：

- PR #21 已合并：Staging RepairTask Button QA Record。
- PR #22 已合并：Production Release Gate。
- 本地 Button Browser QA：15 pass / 0 fail / 0 blocked。
- Staging Button QA：19 pass / 0 fail / 0 blocked。
- Staging 使用 Clerk Staging 真实登录。
- Staging 使用 Supabase `geo-monitor-staging` 和 transaction pooler。
- Tenant A / B 隔离通过。
- GeoContentTask QA 前 A=0 / B=0，QA 后 A=1 / B=1。
- duplicate / 已存在场景未重复写入。
- Content Backlog 可看到对应 tenant 任务。
- Production Release Gate 已建立。
- 未使用真实客户数据。

当前仍不允许直接 production rollout。本轮只准备 production smoke test 前的人工 readiness checklist。

## 本次目标

1. 新增 `docs/qa/repair-task-production-smoke-test-readiness-check.md`。
2. 明确这不是 production smoke test。
3. 明确这不是 production rollout。
4. 明确 production smoke test 前必须人工确认的环境、账号、tenant、发布窗口和回滚路径。
5. 明确未来 production smoke test 的允许动作和禁止动作。
6. 更新 `AI_TASKS/current.md` 和 `AI_TASKS/handoff.md`，移除 PR #22 等待审查 / 合并确认的过时状态。
7. 创建 docs-only PR，不自动合并。

## 修改范围

- `docs/qa/repair-task-production-smoke-test-readiness-check.md`
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
- 不运行 production DB。
- 不点击生产按钮。
- 不使用真实客户数据。
- 不改 UI。
- 不改 server action。
- 不提交 `.env.local`、seed、payload 或临时脚本。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不进入全租户开放。

## 验收标准

- [x] Readiness Check 文档已新增。
- [x] 文档明确不是 production smoke test。
- [x] 文档明确不是 production rollout。
- [x] 文档记录本地 QA 15 pass / 0 fail / 0 blocked。
- [x] 文档记录 Staging QA 19 pass / 0 fail / 0 blocked。
- [x] 文档记录 Production Release Gate 已合并。
- [x] 文档明确 production 环境人工核对清单。
- [x] 文档明确 production smoke test 前必须准备内部测试账号 / tenant / Query / QueryRun / Analysis。
- [x] 文档明确未来 smoke test 最多只允许内部测试 tenant 创建 1 条 `GeoContentTask`。
- [x] 文档明确禁止批量、无人确认、全租户开放、新写库路径、公开 API 和 destructive production DB 操作。
- [x] `AI_TASKS/handoff.md` 已更新为当前 PR 状态。
- [x] `pnpm test:unit` 通过，19 个文件 / 94 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [ ] PR 已创建。

## 是否需要 Loop

- 判断：需要。
- 依据：这是 production smoke test 前的 readiness gate，涉及认证、生产环境、写库按钮和回滚策略，必须可验证、可停止、可追踪。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮只创建 readiness 文档 PR，不自动合并；是否执行 Production Smoke Test 必须由人工确认。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

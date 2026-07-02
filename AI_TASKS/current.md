# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

证据化修复工作台 v0.1

## GitHub 入口

- 分支：`codex/repair-task-workbench-v0.1`
- 基线：远端 `main`
- 当前 main：`08580e4298b2bab96d91b13535967aad0ef720c3`
- 依赖状态：PR #21 / #22 / #23 / #24 均已合并。

## 背景

RepairTask 单条“加入修复任务池”按钮链路工程阶段已完成。

已完成：

- server action 已 QA。
- 单条按钮已接入 Evidence Detail Drawer。
- 本地 Browser QA：15 pass / 0 fail / 0 blocked。
- Staging QA：19 pass / 0 fail / 0 blocked。
- PR #21 已合并：Staging RepairTask Button QA Record。
- PR #22 已合并：Production Release Gate。
- PR #23 已合并：Production Smoke Test Readiness Check。
- PR #24 已合并：AI_TASKS 状态同步。

当前能力边界仍是：单条、用户确认、可追踪。

## 本轮目标

实现证据化修复工作台 v0.1 的最小可用版本，让已创建的 RepairTask 能展示：

1. 任务类型。
2. 风险等级。
3. 关联 query。
4. 关联 evidence。
5. 为什么建议修。
6. 建议怎么修。
7. 当前状态。
8. 后续 Retest / Report 占位。

## 审计结论

- `GeoContentTask` 已有 `type`、`status`、`tenantId`、`queryRunId`、`analysisId`、`title`、`sourceReason`、`recommendedAngle`、`evidenceJson`、`briefJson` 等字段。
- Evidence Detail Drawer 创建任务时，server action 会写入 tenant-scoped `GeoContentTask`，并保存 query/run/analysis 上下文。
- Content Backlog 列表路径：`/dashboard/content-backlog`。
- Content Backlog 详情路径：`/dashboard/content-backlog/[id]`。
- 数据加载通过 `getOrCreateTenant()` + `prisma.geoContentTask.findMany/findUnique`，并检查 `task.tenantId === tenant.id`。
- tenant isolation 继续依赖 Clerk userId -> User -> Tenant；开发环境仅在 `NODE_ENV=development` 下使用 fallback。
- 本轮可在不修改 schema 的情况下完成 v0.1。

## 修改范围

- `docs/product/repair-task-workbench-v0.1.md`
- `src/lib/content-backlog/repair-task-workbench.ts`
- `src/lib/content-backlog/repair-task-workbench.test.ts`
- `src/app/dashboard/content-backlog/page.tsx`
- `src/app/dashboard/content-backlog/[id]/page.tsx`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 禁止事项

- 不部署 production。
- 不运行 production DB。
- 不点击生产按钮。
- 不使用真实客户数据。
- 不新增 public API route。
- 不新增新的写库路径。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全租户开放。
- 不跳过 Human Gate。
- 不提交 `.env.local`、seed、payload 或临时脚本。
- 不打印 `DATABASE_URL` / Clerk Secret / token / cookie / password。
- 不做 `prisma db push`。
- 不做 `prisma migrate dev`。
- 不做 `prisma migrate reset`。
- 不做 destructive SQL。

## 验收标准

- [x] 不需要 schema change。
- [x] 新增产品设计文档。
- [x] 新增 RepairTask Workbench 纯函数。
- [x] 新增任务类型 / 风险等级 / 风险原因单元测试。
- [x] Content Backlog 列表展示 Workbench 任务类型与风险等级。
- [x] 任务详情页展示工作台总览、关联 evidence、建议怎么修和 Retest 占位。
- [x] 不改变 `createEvidenceRepairTask` 行为。
- [x] 不新增写库路径。
- [x] `pnpm test:unit` 通过，20 个文件 / 100 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [ ] 本地 Browser QA：blocked，干净克隆只有 `.env.example`，无本地非生产 `DATABASE_URL`，未复制或保存任何 secret。
- [ ] PR 已创建。

## 是否需要 Loop

- 判断：需要。
- 依据：RepairTask 工作台是可验收的产品切片，涉及 Human Gate、写库边界和后续阶段方向。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮虽然不新增写库路径，但会改变 RepairTask 展示与工作台入口；PR 合并前需要人工审查。

## 交付格式

1. 审计结论
2. 是否需要 schema change
3. 修改文件
4. 修改说明
5. 自测命令
6. 自测结果
7. Browser QA 结果
8. 风险
9. 下一步建议

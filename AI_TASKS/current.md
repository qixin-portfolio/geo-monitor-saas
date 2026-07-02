# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 或明确本地指令开分支执行。

---

## 任务名称

RepairTask 状态流与人工推进 v0.1.4 / Stage 2.4

## GitHub 入口

- 分支：`codex/repair-task-status-flow-v0.1`
- PR：[#29](https://github.com/qixin-portfolio/geo-monitor-saas/pull/29)
- 基线：最新远端 `main`
- 当前 main：`890eeb34680f3034f426d1160a88f02a066a9a34`
- 依赖状态：PR #25 / #26 / #27 / #28 / #30 / #31 均已合并。

## 最新 main 状态

- PR #30 已合并：GEOFlow-inspired execution layer product doc。
- PR #31 已合并：manual monitoring run reliability fix。
- PR #31 的非生产 1-query API smoke test 仍是 production 前 remaining QA item。
- 没有 production rollout 完成记录。
- 没有 API smoke test 已通过记录。

## 背景

阶段 2「证据化修复工作台」持续推进：

- PR #25 已合并：证据化修复工作台 v0.1。
- PR #26 已合并：RepairTask Detail 页面 5 区块优化。
- PR #27 已合并：Risk Review 审核状态设计。
- PR #28 已合并：Retest Plan v0.1。
- 当前 RepairTask Detail 已展示任务类型、风险等级、证据依据和复测计划。
- 当前仍不是 production rollout。
- 当前仍不做批量、无人执行、Lead Attribution、PDF。

## 本轮目标

在 RepairTask Detail 页新增只读“状态流与下一步动作”模块：

1. 展示当前任务处于哪个阶段。
2. 说明当前阶段代表什么。
3. 给出下一步建议。
4. 标明是否需要 Human Gate。
5. 标明是否可进入复测 / 老板报告。
6. 明确本页不会自动执行、不会生成报告、不会触发复测。

## 修改范围

- `src/app/dashboard/content-backlog/[id]/page.tsx`
- `src/lib/content-backlog/repair-task-workbench.ts`
- `src/lib/content-backlog/repair-task-workbench.test.ts`
- `docs/product/repair-task-workbench-v0.1.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 实现计划

- [x] 审计 `GeoContentTask.status` 字段和现有状态更新逻辑。
- [x] 新增只读 workflow ViewModel / 纯函数。
- [x] 兼容映射现有 `GeoContentTaskStatus`，不改 schema。
- [x] 详情页新增“状态流与下一步动作”模块。
- [x] 补充状态 normalize / fallback / Human Gate / retest-report hint 单测。
- [x] 补修 `BLOCKED` / `REJECTED` lifecycle steps，避免前序 happy path 被标为 completed。
- [x] 更新产品文档 Stage 2.4。
- [x] 更新 AI_TASKS 状态。
- [x] rebase 到最新 `origin/main` 并解决 AI_TASKS 冲突。
- [x] 运行 `pnpm test:unit`。
- [x] 运行 `pnpm typecheck`。
- [x] 运行 `pnpm build`。
- [x] 运行 `git diff --check`。
- [ ] 完成本地非生产 Browser QA。
- [x] 创建 PR，等待人工审查。

## 禁止事项

- 不改 schema。
- 不新增 migration。
- 不改 env。
- 不新增 public API route。
- 不新增 server action。
- 不新增新的写库路径。
- 不改 `createEvidenceRepairTask`。
- 不改 `getClerkTenant` / tenant resolution。
- 不运行 `prisma db push` / `migrate dev` / `migrate reset`。
- 不做 production deploy。
- 不连接 production DB。
- 不使用真实客户数据。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不调用外部 AI。
- 不提交 `.env.local`、seed、payload 或临时 runner。
- 不打印 `DATABASE_URL` / Clerk Secret / token / cookie / password。

## 当前产品能力边界

本轮只做状态流解释和人工推进建议：

- 不新增“更新状态”按钮。
- 不新增“开始复测”按钮。
- 不新增“生成报告 / PDF”按钮。
- 不新增状态写库。
- 不新增复测写库。
- 不调用任何外部 AI / network。
- 页面加载不会自动创建任务。
- production rollout、批量创建、无人执行、全租户开放仍禁止。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮修改 RepairTask Detail 展示结构和状态解释，PR 合并前需要人工审查；不允许自动合并。

## 验证结果

- `pnpm test:unit`：通过，130 tests。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。
- Browser QA：blocked。当前干净工作区只有 `.env.example`，没有明确非生产 `.env.local`；未复制、读取或打印任何 secret，未连接 production / staging DB。

## 交付格式

1. 当前 main commit
2. PR 链接
3. 当前 head commit
4. 修改文件
5. status 字段审计结论
6. 自测命令与结果
7. Browser QA 结果
8. 是否保持 tenant-scoped detail query
9. 是否有 schema / migration / env / 写库路径 / server action 改动
10. 风险
11. 下一步建议

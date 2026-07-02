# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

RepairTask Risk Review 审核状态设计 v0.1.2 / Stage 2.2

## GitHub 入口

- 分支：`codex/repair-task-risk-review-v0.1`
- PR：待创建
- 基线：远端 `main`
- 当前 main：`a8db463df222b451f7a74107476730d94f48a88b`
- 依赖状态：PR #21 / #22 / #23 / #24 / #25 / #26 均已合并。

## 背景

阶段 2「证据化修复工作台」持续推进：

- PR #25 已合并：证据化修复工作台 v0.1。
- PR #26 已合并：RepairTask Detail 页面 5 区块优化。
- 当前 RepairTask Detail 已展示任务概览、证据依据、建议动作、风险审核、复测与报告占位。
- 当前仍不是 production rollout。
- 当前仍不做批量、无人执行、Lead Attribution、PDF。

## 本轮目标

增强 Risk Review 审核展示，让每条 RepairTask 明确告诉运营：

1. 当前风险等级是什么。
2. 这条任务能不能直接执行。
3. 为什么需要审核。
4. 需要补哪些证据。
5. 哪些情况禁止执行。
6. 后续真正审核流需要预留什么信息结构。

## 修改范围

- `src/app/dashboard/content-backlog/[id]/page.tsx`
- `src/lib/content-backlog/repair-task-workbench.ts`
- `src/lib/content-backlog/repair-task-workbench.test.ts`
- `docs/product/repair-task-workbench-v0.1.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 实现计划

- [x] 新增 / 优化 Risk Review 纯函数。
- [x] 风险审核区块升级为执行决策卡。
- [x] 展示风险等级、执行建议、风险原因、需要补充的证据、禁止事项、Human Gate 提醒。
- [x] 补充 GREEN / YELLOW / RED / fallback / required evidence / prohibited actions 单测。
- [x] 更新产品文档 Stage 2.2。
- [x] 更新 AI_TASKS 状态。
- [x] 运行 `pnpm test:unit`。
- [x] 运行 `pnpm typecheck`。
- [x] 运行 `pnpm build`。
- [x] 运行 `git diff --check`。
- [x] 完成本地非生产 Browser QA。
- [ ] 创建 PR，等待人工审查。

## 禁止事项

- 不改 schema。
- 不新增 migration。
- 不改 env。
- 不新增 public API route。
- 不新增新的写库路径。
- 不新增 server action。
- 不改 `createEvidenceRepairTask`。
- 不改 `getClerkTenant` / tenant resolution。
- 不做 production deploy。
- 不连接 production DB。
- 不使用真实客户数据。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不新增自动发布能力。
- 不跳过 Human Gate。
- 不提交 `.env.local`、seed、payload 或临时 runner。
- 不打印 `DATABASE_URL` / Clerk Secret / token / cookie / password。

## 当前产品能力边界

本轮只做风险审核展示与规则增强：

- 风险等级仍是启发式提示，不是法律 / 合规最终结论。
- Risk Review 只是执行前提示，不新增审核写库。
- 不新增“通过审核”按钮。
- 不新增发布按钮。
- 不新增执行按钮。
- 页面加载不会自动创建任务。
- production rollout、批量创建、无人执行、全租户开放仍禁止。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮修改 RepairTask 执行前风险建议，PR 合并前需要人工审查；不允许自动合并。

## 验证结果

- `pnpm test:unit`：通过。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。
- Browser QA：Local 非生产通过。
  - `/dashboard/content-backlog` 正常加载，列表展示任务类型、风险等级、状态。
  - RepairTask 详情页正常加载，风险审核建议展示风险等级、执行建议、风险原因、需要补充的证据、禁止事项、Human Gate 提醒。
  - 页面未新增审核通过按钮、自动发布按钮、批量入口或无人执行入口。
  - 不存在 task id 返回 404 / safe fallback。
  - GeoContentTask 计数保持 `1 -> 1`，QA 过程中未新增写库。
  - 跨 tenant URL 测试未执行：本地 dev fallback 只有一个 tenant session；代码层仍保持 tenant-scoped detail query。

## 交付格式

1. 当前 main commit
2. PR 链接
3. 当前 head commit
4. 修改文件
5. 自测命令与结果
6. Browser QA 结果
7. Risk Review 执行决策 / required evidence / prohibited actions / Human Gate 是否完成
8. 是否保持 tenant-scoped detail query
9. 是否有 schema / migration / env / 写库路径改动
10. 风险
11. 下一步建议

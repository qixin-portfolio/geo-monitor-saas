# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 或明确本地指令开分支执行。

---

## 任务名称

RepairTask Retest Before / After 复测占位升级 v0.1.3 / Stage 2.3

## GitHub 入口

- 分支：`codex/repair-task-retest-plan-v0.1`
- PR：[#28](https://github.com/qixin-portfolio/geo-monitor-saas/pull/28)
- 基线：远端 `main`
- 当前 main：`9de8ccb6e33bea7fe4b4406176819ca49da7a11b`
- 依赖状态：PR #25 / #26 / #27 均已合并。

## 背景

阶段 2「证据化修复工作台」持续推进：

- PR #25 已合并：证据化修复工作台 v0.1。
- PR #26 已合并：RepairTask Detail 页面 5 区块优化。
- PR #27 已合并：Risk Review 审核状态设计。
- 当前 RepairTask Detail 已展示任务概览、证据依据、建议动作、风险审核、复测与报告占位。
- 当前仍不是 production rollout。
- 当前仍不做批量、无人执行、Lead Attribution、PDF。

## 本轮目标

升级 RepairTask Detail 页的“复测与报告占位”区块，让每条修复任务明确展示：

1. 修复前状态是什么。
2. 这条任务希望改善什么。
3. 修复后应该观察哪些指标。
4. 什么情况算改善。
5. 什么情况算暂无变化。
6. 什么情况算风险未通过。
7. 未来老板报告应该怎么解释结果。

## 修改范围

- `src/app/dashboard/content-backlog/[id]/page.tsx`
- `src/lib/content-backlog/repair-task-workbench.ts`
- `src/lib/content-backlog/repair-task-workbench.test.ts`
- `docs/product/repair-task-workbench-v0.1.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 实现计划

- [x] 新增 / 优化 Retest Plan 纯函数。
- [x] 复测与报告占位升级为复测与验收计划。
- [x] 展示修复前状态、复测目标、待观察指标、改善 / 暂无变化 / 风险未通过判定、老板报告摘要占位。
- [x] 补充 FAQ / CASE_STUDY / QUALIFICATION / SERVICE_PAGE / SCHEMA / COMPARISON / SOURCE_BUILDING / CONTENT_UPDATE / fallback 单测。
- [x] 更新产品文档 Stage 2.3。
- [x] 更新 AI_TASKS 状态。
- [x] 运行 `pnpm test:unit`。
- [x] 运行 `pnpm typecheck`。
- [x] 运行 `pnpm build`。
- [x] 运行 `git diff --check`。
- [x] 完成本地非生产 Browser QA。
- [x] 创建 PR，等待人工审查。

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
- 不新增真实 retest 执行能力。
- 不调用 OpenAI / Gemini / DeepSeek / 豆包 / 千问等外部 AI。
- 不新增 cron / queue / background job。
- 不跳过 Human Gate。
- 不提交 `.env.local`、seed、payload 或临时 runner。
- 不打印 `DATABASE_URL` / Clerk Secret / token / cookie / password。

## 当前产品能力边界

本轮只做 Retest Before / After 展示结构和规则占位：

- Retest Plan 只是验收计划，不是复测结果。
- 不新增“开始复测”按钮。
- 不新增“生成报告 / PDF”按钮。
- 不新增复测写库或报告写库。
- 不调用任何外部 AI / network。
- 页面加载不会自动创建任务。
- production rollout、批量创建、无人执行、全租户开放仍禁止。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮修改 RepairTask 复测验收文案和展示结构，PR 合并前需要人工审查；不允许自动合并。

## 验证结果

- `pnpm test:unit`：通过。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。
- Browser QA：Local 非生产通过。
  - `/dashboard/content-backlog` 正常加载，列表展示当前 tenant 的 RepairTask。
  - RepairTask 详情页正常加载，“复测与验收计划”展示修复前状态、复测目标、待观察指标、改善判定、暂无变化判定、风险未通过判定、老板报告摘要占位。
  - 页面未新增“开始复测”按钮。
  - 页面未新增“生成报告 / PDF”按钮。
  - 页面未触发外部 AI 调用。
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
7. Retest Plan / 修复前状态 / 复测目标 / 指标 / 判定规则 / 老板报告占位是否完成
8. 是否保持 tenant-scoped detail query
9. 是否有 schema / migration / env / 写库路径 / 外部 AI 调用 / PDF 改动
10. 风险
11. 下一步建议

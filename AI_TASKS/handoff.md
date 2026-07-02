# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | RepairTask Risk Review 审核状态设计 v0.1.2 / Stage 2.2 |
| 执行分支 | `codex/repair-task-risk-review-v0.1` |
| 状态 | 本地实现与验证完成，PR 待创建 |
| GitHub 入口 | 待创建 |
| 当前 main | `a8db463df222b451f7a74107476730d94f48a88b` |
| 上一轮依赖 | PR #21 / #22 / #23 / #24 / #25 / #26 均已合并到 main |
| 本轮性质 | Risk Review 展示 + ViewModel 纯函数 + 单测 + 文档；不改 schema；不新增写库路径 |
| 是否使用真实客户数据 | 否 |

## 阶段结论

阶段 2.1 已完成：RepairTask Detail 页面已拆成任务概览、证据依据、建议动作、风险审核、复测与报告占位 5 个区块。

本轮进入 Stage 2.2，只增强“风险审核建议”展示，让运营在执行前看到更明确的风险等级、执行决策、补证据要求、禁止事项和 Human Gate 提醒。

## 本轮目标

Risk Review 区块升级为执行决策卡：

- 风险等级：`GREEN` / `YELLOW` / `RED`。
- 执行建议：是否可进入内容制作、是否需要补证据、是否禁止直接执行。
- 风险原因：沿用启发式风险规则。
- 需要补充的证据：按任务类型和风险等级给出清单。
- 禁止事项：按风险等级给出不能做的动作。
- Human Gate 提醒：明确系统不会自动发布、不会自动修改线上内容、不会绕过负责人审核。

## 安全边界

- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不新增 public API route。
- 不新增新的写库路径。
- 不新增 server action。
- 不改变 `createEvidenceRepairTask`。
- 不改变 `getClerkTenant` / tenant resolution。
- 不部署 production。
- 不连接 production DB。
- 不使用真实客户数据。
- 不提交 `.env.local`、seed、payload 或临时 runner。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不新增自动发布能力。
- 不跳过 Human Gate。

## 当前修改文件

- `docs/product/repair-task-workbench-v0.1.md`：追加 Stage 2.2 Risk Review 审核状态设计。
- `src/lib/content-backlog/repair-task-workbench.ts`：新增 / 优化 Risk Review 纯函数和 detail view model 字段。
- `src/lib/content-backlog/repair-task-workbench.test.ts`：补充 risk review 单测。
- `src/app/dashboard/content-backlog/[id]/page.tsx`：风险审核区块升级为执行决策卡。
- `AI_TASKS/current.md`：同步当前任务状态。
- `AI_TASKS/handoff.md`：同步当前交接状态。

## 已确认

- `GeoContentTask` 详情查询仍使用 `findFirst({ where: { id, tenantId: tenant.id } })`。
- `queryRun` 查询仍使用 `findFirst`，并通过 `query.tenantId = tenant.id` 限制当前 tenant。
- `queryRunAnalysis` 查询仍使用 `findFirst`，并通过 `queryRun.query.tenantId = tenant.id` 限制当前 tenant。
- 页面没有新增 public API route。
- 页面没有新增写库按钮。
- 页面没有新增审核通过按钮。
- 页面没有新增发布按钮。
- 页面没有新增批量入口、无人执行入口、Lead Attribution 或 PDF。
- ViewModel 纯函数不访问 DB / env / network / session / file IO。

## 验证记录

- `pnpm test:unit`：通过。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。
- Browser QA：Local 非生产通过。
  - `/dashboard/content-backlog` 正常加载，列表展示任务类型、风险等级、状态。
  - RepairTask 详情页正常加载，展示风险等级、执行建议、风险原因、需要补充的证据、禁止事项、Human Gate 提醒。
  - 未新增审核通过按钮、自动发布按钮、批量入口或无人执行入口。
  - 不存在 task id 返回 404 / safe fallback。
  - GeoContentTask 计数保持 `1 -> 1`，QA 过程中未新增写库。
  - 跨 tenant URL 测试未执行：本地 dev fallback 只有一个 tenant session；代码层仍保持 tenant-scoped detail query。

## 风险与注意事项

- 风险等级仍是启发式提示，不是法律 / 合规最终结论，也不是平台官方归因。
- Risk Review 不保存审核状态，不记录审核人，不新增审核流。
- 红 / 黄 / 绿只指导人工判断，不自动执行，不自动发布。
- 本轮不是 production rollout，不允许直接进入 production 发布。

## 下一步建议

1. 创建 PR，等待人工审查。
2. 人工审查重点看 Risk Review 文案是否克制、是否无新增写库路径、是否保持 tenant-scoped detail query。
3. 不自动合并，不进入 production rollout。

---

## 历史记录

| 时间 | 任务 | 分支 / PR | 结果 | 备注 |
|------|------|-----------|------|------|
| 2026-06-29 | 初始化 AI 协作工作流 | PR #5 | 已合并 | 只改协作文档 |
| 2026-06-29 | Evidence Map MVP | PR #6 | 已合并 | 文档 + 只读页面 + 纯函数 |
| 2026-06-30 | Evidence Chain Hardening | PR #7 | 已合并 | 测试 + AnswerSource + RepairTask draft |
| 2026-06-30 | RepairTask 接入 Content Backlog | PR #8 | 已合并 | RepairTask draft 映射为 Content Backlog draft |
| 2026-06-30 | Run Before/After Comparison | PR #9 | 已合并 | 同一 query 最近两次 AI 答案变化对比 |
| 2026-06-30 | Real Run Calibration | PR #10 | 已合并 | 脱敏真实 run 样本校准 Evidence 规则 |
| 2026-06-30 | Evidence Confidence Label | PR #11 | 已合并 | 证据链置信度标签 |
| 2026-06-30 | Evidence Detail Drawer | PR #12 | 已合并 | 证据详情抽屉 |
| 2026-06-30 | RepairTask Create Button Safety Design | PR #13 | 已合并 | 创建单条修复任务能力安全设计与初版 validator |
| 2026-06-30 | RepairTask Validator Hardening | PR #14 | 已合并 | validator 白名单输出与 priority 拒绝策略 |
| 2026-07-01 | Minimal RepairTask Server Action | PR #15 | 已合并 | server 端单条 `GeoContentTask` 写库能力，未接 UI |
| 2026-07-01 | RepairTask Server Action QA Gate | PR #16 | 已合并 | 接 UI 前人工 QA Gate |
| 2026-07-01 | RepairTask Server Action Manual QA Record | PR #17 | 已合并 | 记录未执行状态和 QA 前置条件 |
| 2026-07-01 | RepairTask Server Action Manual QA Execution | PR #18 | 已合并 | 本地非生产 Manual QA 15 pass / 0 fail / 0 blocked |
| 2026-07-01 | Evidence Detail Drawer Single RepairTask Button | PR #19 | 已合并 | 单条按钮、确认弹窗、安全提示，复用已 QA 的 server action |
| 2026-07-01 | RepairTask Button Browser QA | PR #20 | 已合并 | 本地非生产 Button Browser QA 15 pass / 0 fail / 0 blocked |
| 2026-07-02 | Staging RepairTask Button QA Record | PR #21 | 已合并 | Staging Button QA 19 pass / 0 fail / 0 blocked |
| 2026-07-02 | RepairTask Production Release Gate | PR #22 | 已合并 | production 发布前 Gate，非 rollout |
| 2026-07-02 | Production Smoke Test Readiness Check | PR #23 | 已合并 | production smoke test 前人工准备清单，非 rollout |
| 2026-07-02 | AI_TASKS 状态同步 | PR #24 | 已合并 | RepairTask 单条按钮链路阶段完成，下一阶段为证据化修复工作台设计 |
| 2026-07-02 | RepairTask Workbench v0.1 | PR #25 | 已合并 | 证据化修复工作台 v0.1，tenant-scoped detail query 和非生产 Browser QA 通过 |
| 2026-07-02 | RepairTask Detail Sections v0.1.1 | PR #26 | 已合并 | 详情页 5 区块优化，非 production rollout |

# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | RepairTask 状态流与人工推进 v0.1.4 / Stage 2.4 |
| 执行分支 | `codex/repair-task-status-flow-v0.1` |
| 状态 | PR #29 已 rebase 到最新 main，等待重新审查；Browser QA blocked |
| GitHub 入口 | [PR #29](https://github.com/qixin-portfolio/geo-monitor-saas/pull/29) |
| 当前 main | `890eeb34680f3034f426d1160a88f02a066a9a34` |
| 上一轮依赖 | PR #25 / #26 / #27 / #28 / #30 / #31 均已合并到 main |
| 本轮性质 | 状态流只读展示 + ViewModel 纯函数 + 单测 + 文档；不改 schema；不新增写库路径 |
| 是否使用真实客户数据 | 否 |

## 最新 main 状态

- PR #30 已合并：GEOFlow-inspired execution layer product doc。
- PR #31 已合并：manual monitoring run reliability fix。
- PR #31 的非生产 1-query API smoke test 仍是 production 前 remaining QA item。
- 没有 production rollout 完成记录。
- 没有 API smoke test 已通过记录。

## 阶段结论

阶段 2.3 已完成：RepairTask Detail 页已展示复测与验收计划。

本轮 Stage 2.4 只增强“状态流与下一步动作”展示，让运营看到当前阶段、下一步建议、Human Gate、复测 / 报告入口条件，以及本轮禁止自动执行的边界。

PR 审查后已补修：`BLOCKED` / `REJECTED` / `SKIPPED` / unknown / missing status 不会把前序 happy path 标为 completed。

本次 rebase 只解决 AI_TASKS 冲突，未修改状态流逻辑。

## 本轮目标

新增只读“状态流与下一步动作”模块：

- 当前阶段：兼容映射现有 `GeoContentTaskStatus`，不改 schema。
- 状态说明：解释当前阶段代表什么。
- 下一步建议：告诉运营应该人工推进什么。
- Human Gate：标明是否需要人工确认。
- 复测 / 报告提示：只展示是否具备进入条件，不触发真实流程。
- 安全提示：本页不会自动执行、不会生成报告、不会触发复测。

## 安全边界

- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不新增 public API route。
- 不新增 server action。
- 不新增新的写库路径。
- 不部署 production。
- 不连接 production DB。
- 不使用真实客户数据。
- 不提交 `.env.local`、seed、payload 或临时 runner。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不新增自动发布能力。
- 不新增真实 retest 执行能力。
- 不新增状态写库。
- 不调用 OpenAI / Gemini / DeepSeek / 豆包 / 千问等外部 AI。
- 不新增 cron / queue / background job。
- 不跳过 Human Gate。

## 当前修改文件

- `docs/product/repair-task-workbench-v0.1.md`：追加 Stage 2.4 状态流与人工推进说明。
- `src/lib/content-backlog/repair-task-workbench.ts`：新增 workflow normalize / next action / Human Gate / lifecycle 纯函数。
- `src/lib/content-backlog/repair-task-workbench.test.ts`：补充状态流和 fallback 单测。
- `src/app/dashboard/content-backlog/[id]/page.tsx`：新增只读“状态流与下一步动作”模块。
- `AI_TASKS/current.md`：同步当前任务状态和 rebase 结果。
- `AI_TASKS/handoff.md`：同步当前交接状态和 rebase 结果。

## 已确认

- `GeoContentTask` 详情查询仍使用 `findFirst({ where: { id, tenantId: tenant.id } })`。
- `queryRun` 查询仍使用 `findFirst`，并通过 `query.tenantId = tenant.id` 限制当前 tenant。
- `queryRunAnalysis` 查询仍使用 `findFirst`，并通过 `queryRun.query.tenantId = tenant.id` 限制当前 tenant。
- 页面没有新增 public API route。
- 页面没有新增写库按钮。
- 页面没有新增“更新状态”按钮。
- 页面没有新增“开始复测”按钮。
- 页面没有新增“生成报告 / PDF”按钮。
- 页面没有新增批量入口、无人执行入口、Lead Attribution 或 PDF。
- ViewModel 纯函数不访问 DB / env / network / session / file IO。
- 本次 rebase 只解决 `AI_TASKS/current.md` 和 `AI_TASKS/handoff.md` 冲突。

## 验证记录

- `pnpm test:unit`：通过，130 tests。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。
- Browser QA：blocked。当前干净工作区只有 `.env.example`，没有明确非生产 `.env.local`；未复制、读取或打印任何 secret，未连接 production / staging DB。

## 风险与注意事项

- 状态流是只读展示，不是状态更新流。
- 未知 / 缺失状态必须 fallback 为阻塞，不应渲染成可执行。
- 本轮不保存状态变更，不记录审核人，不新增报告流。
- 本轮不是 production rollout，不允许直接进入 production 发布。
- PR #31 的非生产 1-query API smoke test 仍是 production 前 remaining QA item，不应误记为已通过。

## 下一步建议

1. 重新审查 PR #29。
2. 如需合并前 Browser QA，请由人工提供明确非生产 Preview / Local / Staging 环境。
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
| 2026-07-02 | RepairTask Risk Review v0.1.2 | PR #27 | 已合并 | 风险审核建议卡，非 production rollout |
| 2026-07-02 | RepairTask Retest Plan v0.1.3 | PR #28 | 已合并 | Retest Plan 只读展示，非 production rollout |
| 2026-07-02 | Manual Monitoring Run Reliability Fix | PR #31 | 已合并 | 修复 manual run fire-and-forget；1-query 非生产 API smoke test 仍是 production 前 remaining QA |
| 2026-07-02 | GEOFlow-inspired Execution Layer Product Doc | PR #30 | 已合并 | 只改产品文档，非 production rollout |

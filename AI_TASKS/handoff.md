# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | RepairTask Retest Before / After 复测占位升级 v0.1.3 / Stage 2.3 |
| 执行分支 | `codex/repair-task-retest-plan-v0.1` |
| 状态 | 开发中，PR 待创建 |
| GitHub 入口 | 待创建 |
| 当前 main | `9de8ccb6e33bea7fe4b4406176819ca49da7a11b` |
| 上一轮依赖 | PR #25 / #26 / #27 均已合并到 main |
| 本轮性质 | Retest Before / After 展示 + ViewModel 纯函数 + 单测 + 文档；不改 schema；不新增写库路径 |
| 是否使用真实客户数据 | 否 |

## 阶段结论

阶段 2.2 已完成：RepairTask Detail 页的风险审核已升级为只读执行决策卡。

本轮进入 Stage 2.3，只增强“复测与报告占位”展示，让运营和老板在执行前看到修复前状态、复测目标、观察指标、改善 / 暂无变化 / 风险未通过判定，以及未来报告会如何解释结果。

## 本轮目标

Retest / Report 区块升级为复测与验收计划：

- 修复前状态：当前 query、品牌提及 / 推荐状态、evidence 缺口、risk level、task type。
- 复测目标：按任务类型生成目标。
- 待观察指标：品牌提及、品牌推荐、推荐语、引用源、竞品压制、情感、事实错误、风险等级。
- 改善判定：从未提及到被提及、从未推荐到被推荐、引用新增内容、推荐语更准确等。
- 暂无变化判定：仍未提及、仍只推荐竞品、未引用新增内容、回答无明显变化等。
- 风险未通过判定：错误引用、夸大表达、虚假表述、黄色 / 红色风险未通过等。
- 老板报告摘要占位：只说明未来如何对比，不承诺排名、推荐或流量提升。

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
- 不新增真实 retest 执行能力。
- 不调用 OpenAI / Gemini / DeepSeek / 豆包 / 千问等外部 AI。
- 不新增 cron / queue / background job。
- 不跳过 Human Gate。

## 当前修改文件

- `docs/product/repair-task-workbench-v0.1.md`：追加 Stage 2.3 Retest Before / After 复测占位设计。
- `src/lib/content-backlog/repair-task-workbench.ts`：新增 / 优化 Retest Plan 纯函数和 detail view model 字段。
- `src/lib/content-backlog/repair-task-workbench.test.ts`：补充 retest plan 单测。
- `src/app/dashboard/content-backlog/[id]/page.tsx`：复测区块升级为“复测与验收计划”。
- `AI_TASKS/current.md`：同步当前任务状态。
- `AI_TASKS/handoff.md`：同步当前交接状态。

## 已确认

- `GeoContentTask` 详情查询仍使用 `findFirst({ where: { id, tenantId: tenant.id } })`。
- `queryRun` 查询仍使用 `findFirst`，并通过 `query.tenantId = tenant.id` 限制当前 tenant。
- `queryRunAnalysis` 查询仍使用 `findFirst`，并通过 `queryRun.query.tenantId = tenant.id` 限制当前 tenant。
- 页面没有新增 public API route。
- 页面没有新增写库按钮。
- 页面没有新增“开始复测”按钮。
- 页面没有新增“生成报告 / PDF”按钮。
- 页面没有新增批量入口、无人执行入口、Lead Attribution 或 PDF。
- ViewModel 纯函数不访问 DB / env / network / session / file IO。

## 验证记录

- `pnpm test:unit`：通过。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。
- Browser QA：Local 非生产通过。
  - `/dashboard/content-backlog` 正常加载，列表展示当前 tenant 的 RepairTask。
  - RepairTask 详情页正常加载，“复测与验收计划”展示修复前状态、复测目标、待观察指标、改善判定、暂无变化判定、风险未通过判定、老板报告摘要占位。
  - 未新增“开始复测”按钮。
  - 未新增“生成报告 / PDF”按钮。
  - 未触发外部 AI 调用。
  - 不存在 task id 返回 404 / safe fallback。
  - GeoContentTask 计数保持 `1 -> 1`，QA 过程中未新增写库。
  - 跨 tenant URL 测试未执行：本地 dev fallback 只有一个 tenant session；代码层仍保持 tenant-scoped detail query。

## 风险与注意事项

- Retest Plan 是验收计划，不是复测结果。
- 本轮不保存复测结果，不记录复测人，不新增报告流。
- 文案不能表达“已经改善”“已经复测”“AI 一定会推荐”。
- 本轮不是 production rollout，不允许直接进入 production 发布。

## 下一步建议

1. 创建 PR，等待人工审查。
2. 人工审查重点看 Retest Plan 文案是否克制、是否无新增写库路径、是否保持 tenant-scoped detail query。
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

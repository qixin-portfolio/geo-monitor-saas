# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | RepairTask Server Action QA Gate：修复任务创建按钮接入前 QA 闸门 |
| 执行分支 | `codex/repair-task-qa-gate` |
| 状态 | PR 已创建，等待人工审查与合并确认 |
| GitHub 入口 | PR #16：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/16](https://github.com/qixin-portfolio/geo-monitor-saas/pull/16) |
| 上一轮依赖 | PR #15 已合并到远端 main |
| 实现 commit | `651528ef8cf0ae866c86196c267cba82afa5bec6` |

## 本轮交接

### 修改文件

- `docs/qa/repair-task-server-action-qa-gate.md`：新增接 UI 按钮前人工 QA Gate，覆盖能力边界、前置条件、QA 用例、UI 接入条件和安全文案。
- `docs/architecture/repair-task-create-safety-design.md`：补充 server action QA Gate，说明 PR #15 写库能力接 UI 前必须人工验证。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：记录本轮是 QA Gate，不新增按钮、不新增 public API route、不新增新的写库路径。
- `docs/architecture/evidence-chain-data-model.md`：记录 QA Gate 对 `GeoContentTask` 现有字段、幂等限制和未来 schema 评估的影响。
- `docs/loops/evidence-led-geo-loop.md`：将 QA Gate 纳入 Loop 过程、输出和验收。
- `AI_TASKS/current.md`：记录本轮任务。
- `AI_TASKS/handoff.md`：记录本轮交接。

### 当前审查记录

- `createEvidenceRepairTask` 是 `"use server"` 路径。
- 当前没有新增 public API route。
- action 调用 `validateRepairTaskDraft`，并只使用 `sanitizedDraft`。
- tenantId 来自 server 端 `getOrCreateTenant()`，不使用 client payload。
- `queryId` / `queryRunId` / `analysisId` 会按当前 tenant 重新查询归属。
- 幂等去重使用 `tenantId`、`sourceQuery`、`type`、unfinished status，以及 `evidenceJson.repairTask.taskType` / `evidenceGap` / `suggestedPage`。
- 由于 `GeoContentTask` 没有 `queryId` 或 `idempotencyKey` 字段，当前幂等仍是保守去重，不是强唯一约束。

### 验证记录

- `pnpm exec vitest run src/app/dashboard/content-backlog/actions/create-evidence-repair-task.test.ts`：通过，1 个文件 / 7 个测试。
- `pnpm test:unit`：通过，19 个文件 / 94 个测试。
- `pnpm typecheck`：通过。
- `pnpm build`：通过，包含 `/dashboard/content-backlog` 和 `/dashboard/evidence-map` 路由。
- `git diff --check`：通过。

### 风险与注意事项

- PR #15 已引入 server 端单条 `GeoContentTask` 写库能力。
- 本轮不新增新的写库路径。
- 本轮不新增前端真实按钮。
- 本轮不新增 public API route。
- 本轮不修改 Prisma schema。
- 本轮不生成 migration。
- 本轮不运行生产迁移。
- 本轮不修改 `.env`、部署配置、Clerk、Stripe、Billing、proxy。
- 本轮不自动部署。
- 本轮不做批量创建、自动修复、Lead Attribution、PDF、全平台接入。
- 下一轮如果接 UI 按钮，必须通过 Human Gate，并先完成手动 QA。

### 下一步建议

1. 等待人工审查 PR #16。
2. PR #16 合并且手动 QA 通过后，才考虑接入 Evidence Detail Drawer 的单条“加入修复任务池”按钮。
3. 下一轮如接 UI，仍需 Human Gate，不做批量创建或自动修复。

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

# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | 修复 manual monitoring run fire-and-forget 导致 batch 卡 RUNNING |
| 执行分支 | `codex/fix-manual-monitoring-run-await` |
| 状态 | PR #31 已创建，等待人工审查 |
| GitHub 入口 | [PR #31](https://github.com/qixin-portfolio/geo-monitor-saas/pull/31) |
| 当前 main | `dfd9c53dc1be2e710e4b80c1472cf6b1ea7a7564` |
| 上一轮依赖 | 从远端 `main` 新 worktree 开始；原仓库脏工作区未触碰 |
| 本轮性质 | monitoring 手动运行可靠性小修 + OpenAI timeout/max token + 单测；不改 schema；不新增写库路径 |
| 是否使用真实客户数据 | 否 |

## 阶段结论

诊断确认：`src/app/api/monitoring/run/route.ts` 先创建 `RunBatch(PENDING)`，再 fire-and-forget 调用 `runTenantBatch`。这会在 Next / serverless 请求结束后留下 `RUNNING` batch 的风险。

本轮改为 route 内 `await runTenantBatch`，并在 runner 抛错时把本次 batch 标为 `FAILED` 后返回安全错误。

PR 审查后补丁：处理 manual route overlap race。只要 route 创建了本次 batch，即使 runner 返回 `skipped-overlap` 或抛错，本次 batch 也会进入 `FAILED` 终态，并补齐 `failureCount`。

## 本轮目标

- `POST /api/monitoring/run` 不再 fire-and-forget。
- 保留已有 batch 创建逻辑，手动请求等待 batch 进入终态。
- 返回 `batchId`、`status`、`queryCount`、`successCount`、`failureCount`。
- `RunNowButton` 识别 awaited route 直接返回的终态，失败时显示失败状态。
- OpenAI provider 使用已有 `MONITORING_TIMEOUT_MS` / `MONITORING_MAX_TOKENS` 配置。
- 测试覆盖 route await、runner failure fallback、missing key count 断言、OpenAI 参数传递。
- 测试覆盖 overlap skipped 不留下 `PENDING`、runner throw 不留下 `PENDING/RUNNING`、final read 失败不覆盖成功终态。

## 安全边界

- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不新增 public API route。
- 不新增新的写库路径。
- 不部署 production。
- 不连接 production DB。
- 不使用真实客户数据。
- 不提交 `.env.local`、seed、payload 或临时 runner。
- 不打印 `OPENAI_API_KEY` / `DATABASE_URL` / Clerk Secret。
- 不调用真实 OpenAI API。
- 不做批量监测。
- 不做 production rollout。

## 当前修改文件

- `src/app/api/monitoring/run/route.ts`：manual run 改为 awaited execution，异常时 finalize batch 为 `FAILED`。
- `src/app/api/monitoring/run/route.test.ts`：覆盖 route 等待 runner、overlap skipped、runner 抛错 fallback、final read failure。
- `src/components/run-now-button.tsx`：支持 manual route 直接返回终态。
- `src/lib/monitoring/openai-provider.ts`：接入 timeout / max token 配置。
- `src/lib/monitoring/openai-provider.test.ts`：覆盖 OpenAI 参数传递。
- `src/lib/monitoring/run-tenant-batch.integration.test.ts`：补充 missing key count 断言。
- `AI_TASKS/current.md` / `AI_TASKS/handoff.md`：同步当前任务。

## 已确认

- 原仓库脏工作区未 stash / reset / clean / commit。
- 新 worktree：`/private/tmp/geo-monitor-monitoring-run-fix`。
- route 仍使用已有 `/api/monitoring/run`，未新增 public API route。
- route 兜底更新使用 `{ id, tenantId }`，只处理本次 route 创建的 batch。
- 未改 schema / migration / env。
- 未连接 production DB。
- 未打印或保存 secret。
- 未调用真实 OpenAI API。

## 验证记录

- `pnpm test:unit`：通过，22 test files / 128 tests。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。
- API smoke test：blocked，未授权真实 API 调用，未提供明确非生产 DB / OpenAI key。

## 风险与注意事项

- 手动监测请求会等待监测完成；如果后续 active query 规模变大，仍应单独设计 queue / worker。
- 本轮没有改 cron/internal monitoring route。
- API smoke test 需要非生产 DB 和非生产 OpenAI key，且只跑 1 个 query。

## 下一步建议

1. 跑完 unit / typecheck / build / diff check。
2. 创建 PR，等待人工审查。
3. 如有明确非生产环境，再做 1-query API smoke test。

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

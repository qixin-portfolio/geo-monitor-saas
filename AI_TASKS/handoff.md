# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | Production Smoke Test Readiness Check：RepairTask 单条按钮 production smoke test 前准备清单 |
| 执行分支 | `codex/production-smoke-test-readiness` |
| 状态 | docs-only readiness 文档待 PR 审查 |
| GitHub 入口 | PR 待创建 |
| 当前 main | `4cd4ec27fc51b8f47f17b22ca65f8c4ea8e9e556` |
| 上一轮依赖 | PR #21 / PR #22 均已合并到 main |
| 本轮性质 | docs-only，不修改功能代码 |
| 是否使用真实客户数据 | 否 |

## 本轮交接

### 修改文件

- `docs/qa/repair-task-production-smoke-test-readiness-check.md`：新增 production smoke test 前 readiness checklist。
- `AI_TASKS/current.md`：同步当前任务为 Production Smoke Test Readiness Check，并记录 PR #21 / PR #22 已合并。
- `AI_TASKS/handoff.md`：同步交接状态，移除 PR #22 等待审查 / 合并确认的过时状态。

### Readiness Check 摘要

- 本文档不是 production smoke test。
- 本文档不是 production rollout。
- 本文档只用于判断是否具备安排小范围 production smoke test 的条件。
- 已记录本地 Browser QA 15 pass / 0 fail / 0 blocked。
- 已记录 Staging Button QA 19 pass / 0 fail / 0 blocked。
- 已记录 Production Release Gate 已合并。
- production smoke test 前必须人工确认 Production Vercel、Production domain、Production DB、Production Clerk、route protection、tenant resolution、发布窗口和回滚路径。
- 如果未来执行 smoke test，最多只允许内部测试账号和内部测试 tenant 创建 1 条 `GeoContentTask`。
- 禁止全租户开放、批量创建、无人确认执行、新写库路径、公开 API 和 destructive production DB 操作。

### 安全边界

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

### 验证记录

- `pnpm test:unit`：通过，19 个文件 / 94 个测试。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。

### 风险与注意事项

- 本轮只是 readiness 文档，不是 production smoke test。
- 本轮不是 production rollout。
- readiness 文档合并后，仍需人工决定是否执行 Production Smoke Test。
- Production Smoke Test 如被批准，必须限制为内部测试账号和内部测试 tenant。
- 后续不应直接进入批量创建、无人确认执行或全租户开放。

### 下一步建议

1. 创建 docs-only PR。
2. 等待 ChatGPT / 用户审查 readiness 文档。
3. PR 审查通过并合并后，再由人工决定是否进入 Production Smoke Test。
4. 不要直接 production rollout。

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

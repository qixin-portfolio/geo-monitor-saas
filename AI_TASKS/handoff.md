# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | Production Release Gate 设计：RepairTask 单条按钮 production 发布前 Gate |
| 执行分支 | `codex/production-release-gate` |
| 状态 | Gate 文档已起草，PR 待创建 |
| GitHub 入口 | PR 待创建 |
| 上一轮依赖 | PR #21 已合并到 main，Staging RepairTask Button QA 记录已落库 |
| 本轮性质 | docs-only，不修改功能代码 |
| 是否使用真实客户数据 | 否 |

## 本轮交接

### 修改文件

- `docs/qa/repair-task-production-release-gate.md`：新增 production 发布前 Gate，定义前置确认、最小 smoke test、禁止事项和回滚方案。
- `AI_TASKS/current.md`：记录本轮任务、边界、验收和 Human Gate。
- `AI_TASKS/handoff.md`：记录本轮交接。

### Gate 设计摘要

- PR #21 合并后，不代表可以直接 production rollout。
- production 发布前必须人工确认 Production DB、Production Clerk、route protection、tenant resolution 和 Vercel env 边界。
- Production 不得使用 staging Clerk key、staging Supabase、Neon 或测试库。
- release 前只允许 production 只读 smoke test，不写库。
- release 后最小 smoke test 只允许内部测试账号和内部测试 tenant。
- 如执行 smoke test，只允许创建 1 条内部测试 tenant 的任务。
- Gate 通过前禁止批量创建、无人确认执行、全租户开放、真实客户大范围开放、新增写库路径和公开 API。
- 回滚优先隐藏入口、关闭按钮或回滚部署；不删除生产数据，不直接改 production DB。

### 安全边界

- 不修改 `src`。
- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不新增 public API route。
- 不新增新的写库路径。
- 不部署 production。
- 不跑 production DB。
- 不改 UI。
- 不改 server action。
- 不接批量创建。
- 不接无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不提交 `.env.local`、seed、payload 或临时脚本。
- 不使用真实客户数据。

### 验证记录

- `pnpm test:unit`：通过，19 个文件 / 94 个测试。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。

### 风险与注意事项

- 本轮只是 Gate 文档，不是 production 发布。
- Gate 合并后仍需人工决定是否执行小范围 production smoke test。
- production smoke test 如被批准，必须严格限制为内部测试账号和内部测试 tenant。
- 后续不应直接进入批量创建、无人确认执行或全租户开放。

### 下一步建议

1. 创建 docs-only PR，不自动合并。
2. PR 审查通过后，再由人工决定是否进行小范围 production smoke test。

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

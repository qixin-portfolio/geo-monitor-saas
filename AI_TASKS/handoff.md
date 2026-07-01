# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | RepairTask Server Action Manual QA：修复任务创建按钮接入前手动 QA 记录 |
| 执行分支 | `codex/repair-task-manual-qa` |
| 状态 | 验证通过，等待提交与 PR 创建 |
| GitHub 入口 | PR 待创建 |
| 上一轮依赖 | PR #16 已合并到远端 main |
| 实现 commit | 待提交 |

## 本轮交接

### 修改文件

- `docs/qa/repair-task-server-action-manual-qa-record.md`：新增 Manual QA 记录，列出环境、用例、实际状态、未执行原因、UI 接入前判断和残余风险。
- `docs/architecture/repair-task-create-safety-design.md`：补充 Manual QA 状态和未通过前禁止接 UI 的边界。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：记录本轮只做 Manual QA 准备与执行记录。
- `docs/architecture/evidence-chain-data-model.md`：记录 Manual QA 对数据模型的影响为零，不改 schema、不新增写库路径。
- `docs/loops/evidence-led-geo-loop.md`：将 Manual QA record 纳入 Loop 过程、输出和验收。
- `AI_TASKS/current.md`：记录本轮任务。
- `AI_TASKS/handoff.md`：记录本轮交接。

### 当前审查记录

- `createEvidenceRepairTask` 是 `"use server"` 路径。
- 当前没有新增 public API route。
- action 调用 `validateRepairTaskDraft`，并只使用 `sanitizedDraft`。
- tenantId 来自 server 端 `getOrCreateTenant()`，不使用 client payload。
- `queryId` / `queryRunId` / `analysisId` 会按当前 tenant 重新查询归属。
- 幂等去重使用 `tenantId`、`sourceQuery`、`type`、unfinished status，以及 `evidenceJson.repairTask.taskType` / `evidenceGap` / `suggestedPage`。
- duplicate 命中时返回 `duplicate=true` 和已有 `taskId`，不重复创建。

### Manual QA 状态

- 当前状态：未执行。
- 原因：当前干净 clone 没有非生产数据库连接、测试账号、测试 tenant、测试 Query / QueryRun / Analysis。
- 本轮未接触真实客户数据。
- 本轮未使用真实 raw AI response。
- 本轮未使用真实手机号、微信号、邮箱、token、cookie。
- 下一步需要人工在非生产环境执行 QA record 中的 15 条用例。

### 验证记录

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
- 所有关键手动 QA 用例通过前，不允许进入真实 UI 按钮接入。

### 下一步建议

1. 完成本轮测试、typecheck、build 和 diff check。
2. 创建 PR 并等待人工审查。
3. PR 合并后，由人工在非生产环境执行 Manual QA。
4. Manual QA 全部通过并经 Human Gate 确认后，才考虑接入单条“加入修复任务池”按钮。

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

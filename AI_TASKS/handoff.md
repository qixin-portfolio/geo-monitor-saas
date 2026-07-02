# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | 证据化修复工作台 v0.1 |
| 执行分支 | `codex/repair-task-workbench-v0.1` |
| 状态 | 执行中，等待验证与 PR 审查 |
| 当前 main | `08580e4298b2bab96d91b13535967aad0ef720c3` |
| 上一轮依赖 | PR #21 / #22 / #23 / #24 均已合并到 main |
| 本轮性质 | 低风险展示 + ViewModel 整理；不改 schema；不新增写库路径 |
| 是否使用真实客户数据 | 否 |

## 阶段结论

RepairTask 单条“加入修复任务池”按钮链路工程阶段已完成。

当前进入阶段 2：“证据化修复工作台”设计与 v0.1 实现。

本轮只做最小可用展示：

- RepairTask 类型。
- 风险等级。
- 关联 query。
- 关联 evidence / evidence gap。
- 为什么建议修。
- 建议怎么修。
- 当前状态。
- 后续 Retest / Report 占位。

## 审计结论

- 现有 `GeoContentTask` 字段足够支撑 v0.1，只需派生 ViewModel。
- 不需要 Prisma schema change。
- 不需要 migration。
- 不需要新增 public API route。
- 不需要新增 server action。
- 不需要改变 `createEvidenceRepairTask`。
- tenant isolation 继续使用现有 `getOrCreateTenant()` 和 `tenantId` 过滤。

## 当前产品能力边界

当前只完成“单条、用户确认、可追踪”的修复任务加入和展示链路。

仍禁止：

- 直接 production rollout。
- 批量创建。
- 无人确认执行。
- 全租户开放。
- Lead Attribution。
- PDF。
- 新增写库路径。
- 新增 public API。
- 跳过 Human Gate。

## 本轮交接

### 修改文件

- `docs/product/repair-task-workbench-v0.1.md`：新增阶段 2 v0.1 产品设计与安全边界。
- `src/lib/content-backlog/repair-task-workbench.ts`：新增任务类型、风险等级、风险原因和证据摘要 ViewModel 纯函数。
- `src/lib/content-backlog/repair-task-workbench.test.ts`：新增纯函数单元测试。
- `src/app/dashboard/content-backlog/page.tsx`：列表页升级为证据化修复工作台入口，展示类型和风险等级。
- `src/app/dashboard/content-backlog/[id]/page.tsx`：详情页新增工作台总览、关联 evidence、建议怎么修和 Retest 占位。
- `AI_TASKS/current.md`：同步本轮任务状态。
- `AI_TASKS/handoff.md`：同步本轮交接状态。

### 安全边界

- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不新增 public API route。
- 不新增新的写库路径。
- 不部署 production。
- 不运行 production DB。
- 不点击生产按钮。
- 不使用真实客户数据。
- 不提交 `.env.local`、seed、payload 或临时脚本。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。

### 验证记录

- `pnpm test:unit`：通过，20 个文件 / 100 个测试。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。
- Browser QA：blocked。干净克隆只有 `.env.example`，无本地非生产 `DATABASE_URL`；未复制、保存或打印任何 secret，未连接 production/staging DB。

### 风险与注意事项

- 风险等级为启发式派生，不是合规结论，也不是第三方平台官方归因。
- v0.1 的 Retest / Report 仅为占位，不自动复测，不生成报告。
- 若后续需要保存风险等级、复测结果或审计记录，应单独提出 schema change proposal。

### 下一步建议

1. 完成验证命令和本地 Browser QA。
2. 创建 PR，等待人工审查。
3. 不直接 production rollout。
4. 不进入批量创建或无人确认执行。

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

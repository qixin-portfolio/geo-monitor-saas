# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | Evidence Detail Drawer Add Single RepairTask Button：接入单条“加入修复任务池”按钮 |
| 执行分支 | `codex/repair-task-single-button` |
| 状态 | 实现中，等待验证、提交、创建 PR |
| GitHub 入口 | PR 待创建 |
| 上一轮依赖 | PR #18 已合并到远端 main，Manual QA 为 15 pass / 0 fail / 0 blocked |
| 实现 commit | 待提交 |
| 当前 head commit | 待提交 |

## 本轮交接

### 修改文件

- `src/app/dashboard/evidence-map/evidence-detail-drawer.tsx`：在 RepairTask Draft 区域接入单条“加入修复任务池”按钮、确认弹窗、loading 和结果提示；调用已通过 Manual QA 的 `createEvidenceRepairTask`。
- `src/app/dashboard/evidence-map/page.tsx`：向 Drawer 传入 `queryId`、`queryRunId`、`analysisId` 和安全的 `contentTaskDraft`；修正文案为“人工确认后创建单条任务”。
- `docs/architecture/repair-task-create-safety-design.md`：记录单条按钮接入边界、payload 策略和后续按钮级 QA。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：记录本轮新增单条按钮及安全边界。
- `docs/architecture/evidence-chain-data-model.md`：记录本轮复用现有 `GeoContentTask`，不改 schema。
- `docs/loops/evidence-led-geo-loop.md`：将单条按钮纳入 Evidence-led GEO Loop。
- `AI_TASKS/current.md`：记录本轮任务。
- `AI_TASKS/handoff.md`：记录本轮交接。

### 已实现行为

- Drawer 中新增“加入修复任务池”按钮。
- 点击按钮先显示确认弹窗，不直接写库。
- 确认弹窗文案说明任务由系统推断生成，并非第三方平台确认的来源结论。
- 用户确认后调用 `createEvidenceRepairTask`。
- 前端只传最小 draft、`queryId`、`queryRunId`、`analysisId`。
- 前端不传 `tenantId`。
- 前端不传 raw answer、完整 AI response、token、cookie、secret 或未知字段。
- success 显示“已加入修复任务池。”。
- duplicate 显示“该修复任务已存在，未重复创建。”。
- validation error 显示“当前任务信息不足，暂时无法加入修复任务池。”。
- permission / tenant error 显示“当前账号无权创建该任务。”。
- unknown error 显示“暂时无法创建任务，请稍后重试。”。
- 不展示原始 error stack、raw API response 或数据库错误。

### 安全边界

- 复用 PR #15 已新增、PR #18 已完成 Manual QA 的 `createEvidenceRepairTask`。
- 不新增 public API route。
- 不新增新的 server action 写库逻辑。
- 不新增新的写库路径。
- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不自动部署。

### Manual QA 前置条件

- PR #18 已合并到 main。
- Manual QA 环境为本地非生产 `localhost:5432` 测试库。
- Manual QA 结果为 15 pass / 0 fail / 0 blocked。
- 本轮 UI 接入仍需 PR 审查；合并后建议补按钮级浏览器 QA。

### 验证记录

- `pnpm test:unit`：待执行。
- `pnpm typecheck`：待执行。
- `pnpm build`：待执行。
- `git diff --check`：待执行。

### 风险与注意事项

- PR #15 已引入 server 端单条 `GeoContentTask` 写库能力，本轮把它接到用户主动触发的 UI。
- 幂等仍不是 DB unique constraint。
- 本轮没有新增按钮级自动化测试；需依赖 typecheck/build 和后续人工浏览器 QA。
- 后续 QA 应覆盖确认弹窗、取消、loading、success、duplicate、error 和 tenant 切换体验。

### 下一步建议

1. 完成本轮验证并创建 PR。
2. 等待 ChatGPT / 用户审查 PR，不自动合并。
3. PR 合并后，在非生产环境补按钮级浏览器 QA。

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

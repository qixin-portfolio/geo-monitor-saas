# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | RepairTask Detail 页面信息分区优化 v0.1.1 / Stage 2.1 |
| 执行分支 | `codex/repair-task-detail-sections-v0.1` |
| 状态 | 实现与本地非生产 Browser QA 已完成，PR 待创建 |
| GitHub 入口 | 待创建 |
| 当前 main | `aede76589499b2f4e206399a045b0dee711f076e` |
| 上一轮依赖 | PR #21 / #22 / #23 / #24 / #25 均已合并到 main |
| 本轮性质 | 详情页 UI 信息架构 + ViewModel 纯函数 + 单测 + 文档；不改 schema；不新增写库路径 |
| 是否使用真实客户数据 | 否 |

## 阶段结论

阶段 2「证据化修复工作台 v0.1」已完成，RepairTask 工作台已能展示 type / risk / evidence basis。

本轮进入 Stage 2.1，只优化 RepairTask Detail 页面信息分区，让详情页从“能显示”升级为“能指导执行”。

## 本轮目标

RepairTask Detail 页面拆成 5 个只读区块：

1. 任务概览：标题、状态、任务类型、风险等级、创建时间、关联 query / platform、一句话总结。
2. 证据依据：`sourceReason`、evidence basis summary、关联 run / analysis 摘要、AI 回答安全摘要、品牌 / 竞品提及状态。
3. 建议动作：`recommendedAngle`、建议修复方向、建议产出物类型、执行提示、验收标准占位。
4. 风险审核：`GREEN` / `YELLOW` / `RED`、风险原因、风险处理建议。
5. 复测与报告占位：修复前状态、待复测状态、未来复测指标、报告摘要占位。

## 安全边界

- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不新增 public API route。
- 不新增新的写库路径。
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

- `docs/product/repair-task-workbench-v0.1.md`：追加 v0.1.1 / Stage 2.1 的 5 区块和安全边界说明。
- `src/lib/content-backlog/repair-task-workbench.ts`：新增 / 优化 RepairTask Detail ViewModel 纯函数。
- `src/lib/content-backlog/repair-task-workbench.test.ts`：补充 detail view model、fallback、风险处理和异常 JSON 场景单测。
- `src/app/dashboard/content-backlog/[id]/page.tsx`：详情页改为 5 个只读信息区块，保持 tenant-scoped 查询。
- `AI_TASKS/current.md`：同步当前任务状态。
- `AI_TASKS/handoff.md`：同步当前交接状态。

## 已确认

- `GeoContentTask` 详情查询仍使用 `findFirst({ where: { id, tenantId: tenant.id } })`。
- `queryRun` 查询仍使用 `findFirst`，并通过 `query.tenantId = tenant.id` 限制当前 tenant。
- `queryRunAnalysis` 查询仍使用 `findFirst`，并通过 `queryRun.query.tenantId = tenant.id` 限制当前 tenant。
- 页面没有新增 public API route。
- 页面没有新增写库按钮。
- 页面没有新增批量入口、无人执行入口、Lead Attribution 或 PDF。
- ViewModel 纯函数不访问 DB / env / network / session / file IO。

## 验证记录

- `pnpm test:unit`：通过，20 个文件 / 105 个测试。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。
- Browser QA：通过，Local 非生产环境。

## Browser QA 记录

- QA 环境：Local dev；使用本机已有 `.env.local` 注入进程，脱敏检查为 local 类型。
- 是否连接 production：否。
- 是否打印或保存 secret：否。
- 是否点击写库按钮：否。
- `/dashboard/content-backlog`：正常加载；可看到当前 tenant 的 RepairTask；列表展示任务类型、风险等级、状态。
- `/dashboard/content-backlog/[id]`：正常加载；任务概览、证据依据、建议动作、风险审核、复测与报告占位 5 个区块均可见。
- type / risk / evidence / recommended action：展示清楚。
- JSON / evidence：未作为 HTML 渲染，未新增 `dangerouslySetInnerHTML`。
- 不存在 task id：返回 404 / safe fallback。
- 跨 tenant URL 测试：本地 dev fallback 只有一个可用 tenant session，本轮未执行；tenant-scoped 查询保持 `id + tenantId` 和 relation tenant filter。
- GeoContentTask 数量：QA 前 1，QA 后 1，未新增任务。

## 风险与注意事项

- 风险等级仍是启发式派生，只作为人工执行提示，不是合规结论，也不是第三方平台官方归因。
- Retest / Report 只是占位，不会自动复测，不会生成 PDF。
- 详情页保留既有简报 / 草稿入口，但本轮没有新增写库路径，也不会自动触发。
- 本轮不是 production rollout，不允许直接进入 production 发布。

## 下一步建议

1. 完成验证命令和非生产 Browser QA。
2. 创建 PR，等待人工审查。
3. 人工审查重点看 tenant-scoped detail query、5 区块信息是否清楚、是否无新增写库路径。
4. 不自动合并，不进入 production rollout。

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

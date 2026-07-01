# RepairTask Create Button Safety Design

> 本文是安全设计与接口方案。当前已进入最小 server action 基础能力，
> 但仍不实现真实前端按钮，不做批量创建，不修改 Prisma schema，不生成 migration。

## 1. 当前状态

- Evidence Map 是只读页面。
- Evidence Detail Drawer 只展示 derived data。
- `RepairTaskDraft` 由 `EvidenceMapItem` 纯函数派生。
- `ContentBacklogTaskDraft` 由 `RepairTaskDraft` 纯函数映射。
- 当前只在页面展示“可进入修复任务池”的只读语义。
- 已新增 server-only 单条创建能力：`createEvidenceRepairTask`。
- 该能力只在 server 端创建一条 `GeoContentTask`，尚未接入 UI 按钮。
- 尚未创建真实“加入修复任务池”按钮。

## 2. 未来创建任务的数据流

建议链路：

```text
EvidenceMapItem
→ RepairTaskDraft
→ ContentTaskDraft
→ validateRepairTaskDraft
→ validated server action / API
→ tenant scoped GeoContentTask
```

关键原则：

- 前端只提交最小 draft，不提交 `tenantId`。
- server 端重新从登录态解析 tenant context。
- server 端重新校验 Query / QueryRun 是否属于当前 tenant。
- server 端重新运行 draft validation，不信任 client payload。
- 写入目标优先复用现有 `GeoContentTask`。
- `evidenceJson` / `briefJson` 用于承载 evidence gap、suggested page、next steps 和来源摘要。

## 3. 权限校验要求

未来最小安全 server action / API 必须满足：

- 用户必须登录。
- 用户必须属于当前 tenant / org。
- 只能给自己的 tenant 创建任务。
- 不能通过前端传入 `tenantId` 越权。
- server 端必须调用 `getOrCreateTenant()` 或等价 tenant resolver。
- server 端必须用当前 tenant 查询 `Query` / `QueryRun` / `QueryRunAnalysis`。
- 如果 `queryId`、`queryRunId` 或 `analysisId` 不属于当前 tenant，返回 404 或 403。
- 不信任 client payload 中的 `tenantId`、`userId`、`createdByUserId`。

当前实现边界：

- server action / server-only function：`src/app/dashboard/content-backlog/actions/create-evidence-repair-task.ts`
- 输入：`draft`、可选 `queryId`、`queryRunId`、`analysisId`
- 输出：`success`、`taskId`、`duplicate`、`errors`
- 所有 database create 必须发生在 server 端 tenant scoped 逻辑内。
- 不新增前端按钮，不新增 API route。

## 4. 字段校验要求

必须先通过白名单与长度限制：

- `taskType` 白名单：`page_update`、`new_page`、`faq_addition`、`schema_fix`、`third_party_profile`、`review_collection`、`authority_building`、`sentiment_defense`、`competitor_counter`。
- `GeoContentTask.type` 白名单：沿用 Prisma `GeoContentTaskType`。
- `priority` 白名单：RepairTask 使用 `P0` / `P1` / `P2`；Content Backlog 写库前只接受映射后的 `90` / `70` / `45`，非法值直接拒绝。
- `evidenceGap` 白名单：`competitor_evidence_advantage`、`missing_citable_brand_evidence`、`weak_brand_definition`、`no_major_gap`。
- `relatedQuery` 长度限制，空值必须 fallback 为安全占位。
- `suggestedPage` 长度限制。
- `title` / `description` / `sourceReason` / `recommendedAngle` 长度限制。
- `nextSteps` 限制数量与单条长度。
- 禁止 raw AI response 入库。
- 禁止 secret、token、email、phone、cookie、private key、database URL、webhook secret 等敏感字段入库。

`validateRepairTaskDraft` 是写库前的纯函数前置校验：

- 不联网。
- 不读写数据库。
- 不依赖浏览器环境。
- 输出 `valid`、`errors`、`sanitizedDraft`。
- server action 只使用 `sanitizedDraft`，不使用原始 client payload 写库。

Validator Hardening 后的约束：

- `sanitizedDraft` 使用显式白名单输出。
- `evidenceJson` 只保留 `source`、`trigger`、`relatedQuery`、`suggestedPage`、`nextSteps`、`repairTask`。
- `evidenceJson.repairTask` 只保留 `taskType`、`priority`、`evidenceGap`、`suggestedPage`、`expectedImpact`、`effortLevel`、`nextSteps`。
- `briefJson` 只保留 `audience`、`searchIntent`、`angle`、`differentiationTargets`、`forbiddenClaims`、`evidenceNeeded`、`outline`、`internalLinks`、`llmsNotes`。
- 未知字段不会通过 spread 进入 `sanitizedDraft`。
- 嵌套 raw response、secret、token、cookie、authorization 等字段会被拒绝。
- 顶层 Content Backlog priority 只接受 RepairTask 映射产生的 `90`、`70`、`45`；非法 priority 直接返回 `valid=false`，不再静默 fallback。
- `sanitizedDraft` 是 server action 的输入基线；真正写入前仍必须执行 server 端 tenant 校验、幂等去重和权限校验。

## 4.1 Minimal RepairTask Server Action

本轮新增 `createEvidenceRepairTask`，作为未来 UI 按钮的 server 端基础能力。

能力范围：

- 只创建单条 `GeoContentTask`。
- 调用 `validateRepairTaskDraft` 并只使用 `sanitizedDraft`。
- 通过 `getOrCreateTenant()` 在 server 端解析当前 tenant。
- 不信任 client payload 中的 `tenantId`、`userId` 或未知字段。
- 如果传入 `queryId`、`queryRunId`、`analysisId`，必须用当前 tenant 重新查询归属。
- 如果归属不匹配，直接拒绝，不写库。
- 写入时使用 `tenant.id`，不使用前端传入 tenant。
- 写入 `evidenceJson` / `briefJson` 时再次显式白名单重建安全对象。

当前仍不做：

- 不接前端按钮。
- 不做批量创建。
- 不做无人值守执行修复。
- 不新增 API route。
- 不新增 Prisma schema 字段。
- 不生成 migration。

## 4.2 RepairTask Server Action QA Gate

`createEvidenceRepairTask` 已经具备 server 端单条写库能力。接入 Evidence Map / Evidence Detail Drawer 按钮前，必须先通过 QA Gate。

QA Gate 范围：

- 新增人工 QA 清单：`docs/qa/repair-task-server-action-qa-gate.md`。
- 确认 action 仍是 server-only，不新增 public API route。
- 确认 UI 仍未接入真实按钮。
- 确认不新增新的写库路径。
- 确认 tenant 校验、query / run / analysis 归属校验和幂等去重可人工复核。
- 确认 `sourceReason`、`evidenceJson`、`briefJson` 不写入 raw response、prompt、token、secret 或隐私字段。

UI 接入前置条件：

- QA Gate 文档已合并。
- 手动 QA 使用非生产环境、测试 tenant、测试账号和脱敏样本完成。
- server action 不暴露 public API。
- 仍然只允许单条创建。
- UI 必须有确认弹窗。
- UI 必须提示“系统推断，不代表官方来源结论”。
- UI 文案不得使用“无人值守执行修复”等绝对化表述。

## 4.3 RepairTask Server Action Manual QA

QA Gate 合并后，必须在非生产环境执行手动 QA，并把执行状态记录到：

- `docs/qa/repair-task-server-action-manual-qa-record.md`

当前记录状态：

- 本轮已完成 server action 静态审查。
- 本轮未执行真实非生产 QA。
- 未执行原因：当前环境没有非生产数据库连接、测试账号、测试 tenant、测试 Query / QueryRun / Analysis。
- 本轮不修改 env，不使用真实客户数据，不使用真实 raw AI response。

在手动 QA 全部通过前：

- 不允许接前端真实按钮。
- 不允许批量创建。
- 不允许新增新的写库路径。
- 不允许把该能力作为已完成 UI 可用能力对外描述。

## 5. 幂等去重要求

同一 tenant 在短时间内不应重复创建多条相同任务。

建议生成 `idempotencyKey`：

```text
tenantId + queryId + evidenceGap + taskType + suggestedPage
```

当前无 schema 变更的临时方案：

- 写入前用 `tenantId`、`sourceQuery`、`type`、`status in unfinished` 查询已有任务。
- 同时检查 `evidenceJson.repairTask.evidenceGap`、`evidenceJson.repairTask.taskType`、`evidenceJson.suggestedPage`。
- 如果找到未完成同类任务，返回 `existing`，不创建新任务。
- 由于 `GeoContentTask` 没有 `queryId` 或 `idempotencyKey` 字段，当前用 server 端确认后的 `sourceQuery` 作为 query identity 的保守替代。

未来如需强幂等：

- 再考虑 schema 中增加 `idempotencyKey` 或在 `evidenceJson` 中保存 key。
- 加唯一约束前必须单独评估 migration 和历史数据清洗。

## 6. 审计字段建议

未来可写入 `evidenceJson` 或新字段：

- `source = evidence_map`
- `sourceRunId`
- `sourceQueryId`
- `confidenceLevel`
- `createdByUserId`
- `createdFromEvidenceAt`
- `idempotencyKey`
- `validationVersion`

当前 `GeoContentTask` 已有：

- `tenantId`
- `queryRunId`
- `analysisId`
- `sourceQuery`
- `sourceReason`
- `evidenceJson`
- `briefJson`
- `createdAt`
- `updatedAt`

本轮不新增审计字段到 Prisma schema。

## 7. UI 安全文案

按钮不要写：

- 无人值守执行修复
- 一键修复
- 生成真实归因
- 已创建任务

建议按钮写：

- 加入修复任务池

确认弹窗建议：

> 该任务由系统根据当前 AI 答案和来源信息推断生成，不代表官方来源结论。创建后会进入 GEO 修复任务池，可由人工继续编辑、确认和执行。

成功反馈建议：

- 已加入修复任务池。
- 已存在相同修复任务，未重复创建。

失败反馈建议：

- 当前证据不足，暂不能创建任务。
- 任务字段校验失败，请刷新后重试。

## 8. 不做事项

本轮不做：

- Prisma schema 修改。
- migration。
- 真实按钮。
- 批量创建。
- 自动执行修复。
- 外部 API 调用。
- Lead Attribution。
- PDF 导出。
- 全平台接入。
- 自动部署。

## 9. 下一轮 UI 接入建议

下一轮如果进入 UI，建议只接入单条按钮，不做批量创建：

1. Evidence Detail Drawer 中展示“加入修复任务池”按钮。
2. 点击前显示确认弹窗，说明任务由系统推断生成，不代表官方来源结论。
3. 前端只提交最小 draft 和 query/run 标识。
4. server action 继续重新校验 tenant、payload 和幂等。
5. 成功后提示 created / duplicate，不自动跳转批量流程。

仍需 Human Gate：

- 是否展示真实按钮给所有用户。
- 是否需要新增 idempotency schema。
- 是否把按钮限制为特定 plan / tenant。

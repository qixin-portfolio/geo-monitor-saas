# RepairTask Create Button Safety Design

> 本文是安全设计与接口方案。本轮不实现真实按钮，不写数据库，不修改 Prisma schema，不生成 migration。

## 1. 当前状态

- Evidence Map 是只读页面。
- Evidence Detail Drawer 只展示 derived data。
- `RepairTaskDraft` 由 `EvidenceMapItem` 纯函数派生。
- `ContentBacklogTaskDraft` 由 `RepairTaskDraft` 纯函数映射。
- 当前只在页面展示“可进入修复任务池”的只读语义。
- 尚未把 Evidence Map 的单条 RepairTask 写入数据库。
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

推荐边界：

- 路由：`POST /api/evidence-map/repair-tasks`
- 输入：`queryId`、可选 `queryRunId`、`ContentBacklogTaskDraft`
- 输出：`created | existing` 和任务摘要
- 所有 database create 必须发生在 server 端 tenant scoped 逻辑内。

## 4. 字段校验要求

必须先通过白名单与长度限制：

- `taskType` 白名单：`page_update`、`new_page`、`faq_addition`、`schema_fix`、`third_party_profile`、`review_collection`、`authority_building`、`sentiment_defense`、`competitor_counter`。
- `GeoContentTask.type` 白名单：沿用 Prisma `GeoContentTaskType`。
- `priority` 白名单：RepairTask 使用 `P0` / `P1` / `P2`；Content Backlog 写库前映射为 1-100 数值。
- `evidenceGap` 白名单：`competitor_evidence_advantage`、`missing_citable_brand_evidence`、`weak_brand_definition`、`no_major_gap`。
- `relatedQuery` 长度限制，空值必须 fallback 为安全占位。
- `suggestedPage` 长度限制。
- `title` / `description` / `sourceReason` / `recommendedAngle` 长度限制。
- `nextSteps` 限制数量与单条长度。
- 禁止 raw AI response 入库。
- 禁止 secret、token、email、phone、cookie、private key、database URL、webhook secret 等敏感字段入库。

本轮新增的 `validateRepairTaskDraft` 是纯函数前置校验：

- 不联网。
- 不读写数据库。
- 不依赖浏览器环境。
- 输出 `valid`、`errors`、`sanitizedDraft`。
- 只作为未来 server action / API 的安全基建，不代表本轮已接入写库。

## 5. 幂等去重要求

同一 tenant 在短时间内不应重复创建多条相同任务。

建议生成 `idempotencyKey`：

```text
tenantId + queryId + evidenceGap + taskType + suggestedPage
```

未来无 schema 变更的临时方案：

- 写入前用 `tenantId`、`sourceQuery`、`type`、`status in unfinished` 查询已有任务。
- 同时检查 `evidenceJson.repairTask.evidenceGap`、`evidenceJson.repairTask.taskType`、`evidenceJson.suggestedPage`。
- 如果找到未完成同类任务，返回 `existing`，不创建新任务。

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

- 自动修复
- 一键修复
- 生成真实归因
- 已创建任务

建议按钮写：

- 加入修复任务池

确认弹窗建议：

> 该任务由系统根据当前 AI 答案和来源信息推断生成，不代表平台官方归因。创建后会进入 GEO 修复任务池，可由人工继续编辑、确认和执行。

成功反馈建议：

- 已加入修复任务池。
- 已存在相同修复任务，未重复创建。

失败反馈建议：

- 当前证据不足，暂不能创建任务。
- 任务字段校验失败，请刷新后重试。

## 8. 不做事项

本轮不做：

- 数据库写入。
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

## 9. 下一轮最小实现建议

下一轮如果进入实现，建议只做最小安全 server action / API：

1. server 端解析当前 tenant。
2. server 端按 tenant 重新读取 query / latest run。
3. server 端从已有 evidence 纯函数重新生成 draft，或对 client draft 重新校验。
4. 调用 `validateRepairTaskDraft`。
5. 执行幂等查询。
6. 只写入一条 `GeoContentTask`。
7. 返回 created / existing。

仍需 Human Gate：

- 是否允许写生产数据库。
- 是否需要新增 idempotency schema。
- 是否展示真实按钮给所有用户。

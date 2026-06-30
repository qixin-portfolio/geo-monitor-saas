# Evidence Chain Data Model

> 本文是概念模型设计。本轮 MVP 不修改 Prisma schema，不生成 migration。

## 1. AnswerSource

AI 回答引用或被推断依赖的来源。

字段：

- `id`
- `queryRunId`
- `url`
- `domain`
- `title`
- `snippet`
- `sourceType`
- `isOwned`
- `isCompetitor`
- `confidence`
- `extractionMethod`

本轮状态：

- 已实现为 `AnswerSourceDraft`。
- 从 `citationsJson`、`sourcesJson`、answer URL、summary URL 提取。
- 不落库。
- source type 仍由关键词和 URL 启发式推断。

## 2. EvidenceGap

某个 query 下品牌缺少的可被 AI 引用的证据。

字段：

- `id`
- `tenantId`
- `queryId`
- `queryRunId`
- `missingSourceType`
- `reason`
- `priority`
- `suggestedPageId`
- `suggestedAction`
- `confidence`

本轮状态：

- 不落库。
- 由 `extractEvidenceMap` 纯函数派生。

## 3. OwnedPage

企业自己可修复、可增强的页面。

字段：

- `id`
- `tenantId`
- `url`
- `title`
- `pageType`
- `targetQueries`
- `schemaStatus`
- `lastCheckedAt`

本轮状态：

- 仅设计。
- 页面建议先用文本字段表达，例如“案例页 / 客户评价页”。

## 4. PageImpactScore

判断哪一页最值得优先修。

字段：

- `id`
- `tenantId`
- `pageId`
- `affectedQueryCount`
- `sourceGapCount`
- `competitorPressure`
- `priorityScore`
- `reason`

本轮状态：

- 仅设计。
- 当前页面用 P0 / P1 / P2 表达修复机会优先级。

## 5. LeadEvent

未来接入的咨询线索事件。

字段：

- `id`
- `tenantId`
- `source`
- `landingPage`
- `contactMethod`
- `message`
- `matchedQueryId`
- `attributionLevel`
- `confidenceScore`
- `createdAt`

本轮状态：

- 不实现。
- 不接入表单、电话、企微、埋点。

## 6. RepairTask

由 EvidenceGap 派生的页面修复任务。

字段：

- `id`
- `tenantId`
- `priority`
- `taskType`
- `relatedQueryId`
- `relatedQueryRunId`
- `suggestedPage`
- `evidenceGap`
- `expectedImpact`
- `effortLevel`
- `nextSteps`
- `status`

任务类型：

- `page_update`
- `new_page`
- `faq_addition`
- `schema_fix`
- `third_party_profile`
- `review_collection`
- `authority_building`
- `sentiment_defense`
- `competitor_counter`

本轮状态：

- 不新增表。
- 已实现为 `RepairTaskDraft`。
- 由 EvidenceMapItem 派生，在 Evidence Map 页面只读展示。
- 已新增 `mapRepairTaskToContentTask`，可映射为现有 Content Backlog draft。
- 本轮仍不写入数据库。

## 7. RepairTask 到 GeoContentTask 的兼容映射

本轮优先复用现有 `GeoContentTask` 字段，不改 Prisma schema：

| RepairTask 字段 | Content Backlog draft 字段 |
|-----------------|----------------------------|
| `taskType` | 映射为现有 `GeoContentTaskType`，原始值保存在 `evidenceJson.repairTask.taskType` |
| `priority` | 映射为 1-100 数值优先级，P0=90、P1=70、P2=45 |
| `relatedQuery` | `sourceQuery` 和 `targetKeyword` |
| `description` | `sourceReason` |
| `suggestedPage` | `sourceReason`、`evidenceJson.suggestedPage`、`briefJson.internalLinks` |
| `evidenceGap` | `evidenceJson.trigger` 和 `evidenceJson.repairTask.evidenceGap` |
| `expectedImpact` | `sourceReason` 和 `briefJson.evidenceNeeded` |
| `nextSteps` | `briefJson.outline` 和 `evidenceJson.nextSteps` |

类型映射：

| RepairTask type | GeoContentTask type |
|-----------------|---------------------|
| `competitor_counter` | `COMPARISON` |
| `sentiment_defense` | `FAQ` |
| `faq_addition` | `FAQ` |
| `schema_fix` | `SCHEMA` |
| `page_update` | `LOCAL_SERVICE_PAGE` |
| `new_page` | `LOCAL_SERVICE_PAGE` |
| `review_collection` | `CASE_PAGE` |
| `third_party_profile` | `ARTICLE` |
| `authority_building` | `ARTICLE` |

当前实现边界：

- `mapRepairTaskToContentTask` 是纯函数。
- Evidence Map 只读展示 Content Backlog draft 类型和优先级。
- 不调用 `prisma.geoContentTask.create`。
- 不新增 API。
- 不生成 migration。

## 8. 本轮实现范围

已实现或计划实现：

- Evidence Map Item 类型。
- Source type 推断。
- Evidence gap 推断。
- Suggested page / action 推断。
- `/dashboard/evidence-map` 只读展示。
- AnswerSource draft 提取。
- RepairTask draft 映射。
- RepairTask draft 到 Content Backlog draft 的兼容映射。
- Evidence extraction 单元测试。

未来实现：

- AnswerSource 落库。
- OwnedPage 管理。
- PageImpactScore 计算。
- RepairTask 安全写入 Content Backlog。
- LeadEvent 弱归因。

## 9. 何时考虑 Prisma schema

满足以下条件后再考虑 schema：

- AnswerSource extraction 在至少 3-5 轮真实 run 中稳定。
- RepairTask draft 的类型和字段能覆盖 Content Backlog 场景。
- 页面修复建议能被用户确认有实际执行价值。
- 需要跨 batch 保存来源和修复任务历史。
- 现有 `GeoContentTask.evidenceJson` 和 `briefJson` 无法承载必要字段。

在此之前，继续使用 derived data，避免过早迁移。

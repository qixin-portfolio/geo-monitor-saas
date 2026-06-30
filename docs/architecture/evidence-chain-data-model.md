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
- 可在下一轮映射到现有 `GeoContentTask.evidenceJson` 或新增轻量 migration。

## 7. 本轮实现范围

已实现或计划实现：

- Evidence Map Item 类型。
- Source type 推断。
- Evidence gap 推断。
- Suggested page / action 推断。
- `/dashboard/evidence-map` 只读展示。
- AnswerSource draft 提取。
- RepairTask draft 映射。
- Evidence extraction 单元测试。

未来实现：

- AnswerSource 落库。
- OwnedPage 管理。
- PageImpactScore 计算。
- RepairTask 队列。
- LeadEvent 弱归因。

## 8. 何时考虑 Prisma schema

满足以下条件后再考虑 schema：

- AnswerSource extraction 在至少 3-5 轮真实 run 中稳定。
- RepairTask draft 的类型和字段能覆盖 Content Backlog 场景。
- 页面修复建议能被用户确认有实际执行价值。
- 需要跨 batch 保存来源和修复任务历史。

在此之前，继续使用 derived data，避免过早迁移。

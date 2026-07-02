# RepairTask Workbench v0.1

## 1. 本阶段目标

把已经由用户确认加入任务池的 `GeoContentTask`，整理成一个低风险、可解释、可追踪的证据化修复工作台。

v0.1 需要回答：

- 这是什么类型的修复任务。
- 风险等级是什么。
- 关联哪个 query。
- 关联哪些 evidence / evidence gap。
- 为什么建议修。
- 建议怎么修。
- 当前状态是什么。
- 后续如何进入 Retest / Report。

本轮优先做展示和 ViewModel 整理，不改 Prisma schema，不新增写库路径。

## 2. 非目标

本轮不做：

- Production rollout。
- 批量创建。
- 无人确认执行。
- 全租户开放。
- Lead Attribution。
- PDF。
- 新增 public API route。
- 新增 server action。
- 新增 migration。
- Retest 的真实执行。
- Report 的真实生成。

## 3. 当前能力边界

当前 RepairTask 能力仍然限定为：

- 单条任务。
- 用户主动确认。
- 写入现有 `GeoContentTask`。
- 由当前 tenant 隔离。
- 可在 Content Backlog / RepairTask Workbench 中查看。

v0.1 只读取已有字段做派生展示：

- `GeoContentTask.type`
- `GeoContentTask.status`
- `GeoContentTask.queryRunId`
- `GeoContentTask.analysisId`
- `GeoContentTask.title`
- `GeoContentTask.sourceQuery`
- `GeoContentTask.sourceReason`
- `GeoContentTask.recommendedAngle`
- `GeoContentTask.evidenceJson`
- `GeoContentTask.briefJson`

## 4. RepairTask 类型系统

Workbench 使用产品层类型，不直接等同 Prisma `GeoContentTaskType`：

| Workbench 类型 | 用途 |
| --- | --- |
| `FAQ` | 补常见问题和风险解释 |
| `CASE_STUDY` | 补真实案例、前后对比、客户场景 |
| `QUALIFICATION` | 补资质、证书、认证、合规证明 |
| `SERVICE_PAGE` | 补服务页、业务说明、适用场景 |
| `SCHEMA` | 补结构化数据 |
| `COMPARISON` | 补对比页或差异说明 |
| `SOURCE_BUILDING` | 补第三方资料、权威来源、外部可信信号 |
| `CONTENT_UPDATE` | 更新已有内容、补说明、补内链 |

v0.1 的类型来自纯函数派生：

1. 优先读取 `evidenceJson.repairTask.taskType`。
2. 再映射现有 `GeoContentTask.type`。
3. 最后根据标题、原因、建议角度和 evidence 文本做保守 fallback。

## 5. 风险等级

| 风险等级 | 含义 |
| --- | --- |
| `GREEN` | 可作为低风险内容补强方向，仍需人工确认 |
| `YELLOW` | 涉及对比、评价、排名、效果承诺或第三方数据，需要更严格人工复核 |
| `RED` | 涉及明确禁止方向，必须阻断，不应进入执行 |

### 5.1 风险规则

绿色：

- 补真实 FAQ。
- 补真实案例。
- 补真实资质。
- 补服务说明。
- 补 Schema。
- 更新已有页面的可验证说明。

黄色：

- 涉及竞品对比。
- 涉及客户评价。
- 涉及排名。
- 涉及效果承诺。
- 涉及第三方数据但证据不足。

红色：

- 攻击竞品。
- 伪造评价。
- 虚构案例。
- 批量灌水。
- 隐藏文本。
- 提示词注入。
- RAG 投毒。

v0.1 只做提示和阻断建议展示，不自动执行任何修复动作。

## 6. 工作台页面结构

入口沿用 `/dashboard/content-backlog`，页面标题升级为“证据化修复工作台”。

列表展示：

- 优先级。
- 任务标题。
- Workbench 任务类型。
- 风险等级。
- 为什么建议修。
- 竞品摘要。
- 当前状态。
- 关联 query。
- 创建时间。

详情页展示：

- 工作台总览：任务类型、风险等级、当前状态、关联 query。
- 关联 evidence：evidence gap、建议页面、后续复测占位。
- 为什么建议修：沿用 `sourceReason` 和当前 query/run/analysis 派生信息。
- 建议怎么修：优先读取 `briefJson.evidenceNeeded`，否则读取 `evidenceJson.nextSteps`。
- 当前状态：沿用现有 `GeoContentTaskStatus`。
- 生成简报 / 草稿入口：继续复用现有任务动作，不新增写库路径。

### 6.1 v0.1.1 / Stage 2.1 Detail 信息分区

v0.1.1 把 RepairTask Detail 从“能显示”整理成“能指导执行”的 5 个区块：

1. 任务概览：展示任务标题、状态、Workbench 类型、风险等级、创建时间、关联 query / platform，以及一段老板能看懂的来源说明。
2. 证据依据：展示 `sourceReason`、evidence gap、建议页面、关联 run / analysis 摘要、品牌提及状态、竞品摘要和 AI 回答安全摘要。
3. 建议动作：展示 `recommendedAngle`、建议修复方向、建议产出物类型、执行提示、建议怎么修和验收标准占位。
4. 风险审核：展示 `GREEN` / `YELLOW` / `RED` 风险等级、风险原因和处理建议。这里仅做展示，不新增审核写库、不新增“通过审核”按钮、不新增自动发布入口。
5. 复测与报告占位：展示修复前状态、待复测状态、未来复测指标和报告摘要占位。这里不执行 retest，不生成 PDF，不触发外部调用。

v0.1.1 继续保持以下边界：

- 不改 Prisma schema。
- 不新增 migration。
- 不改 env。
- 不新增 public API route。
- 不新增写库路径。
- 不改变 `createEvidenceRepairTask`。
- 不改变 `getClerkTenant` / tenant resolution。
- 不做 production rollout。
- 不做批量创建。
- 不做无人执行。
- 不做 Lead Attribution。
- 不做 PDF。

## 7. 证据依据展示字段

v0.1 可展示的证据字段：

- `sourceQuery` / `evidenceJson.relatedQuery`
- `evidenceJson.trigger`
- `evidenceJson.repairTask.evidenceGap`
- `evidenceJson.suggestedPage`
- `evidenceJson.repairTask.suggestedPage`
- `evidenceJson.nextSteps`
- `briefJson.evidenceNeeded`
- `queryRunId`
- `analysisId`
- `QueryRunAnalysis.summary`
- `QueryRunAnalysis.evidenceSpansJson`
- `QueryRunAnalysis.competitorsJson`

不展示：

- 完整 raw AI response。
- prompt。
- token。
- cookie。
- secret。
- 客户隐私字段。

## 8. Retest / Report 占位

v0.1 只保留占位：

- Retest：后续在任务完成后，针对同一 query 触发复测或读取下一轮 run。
- Report：后续把修复前后变化整理成老板看得懂的 GEO 修复报告。

本轮不执行 retest，不生成 PDF，不做自动化报告。

## 9. 安全边界

本轮明确不做：

- Production rollout。
- Production DB 操作。
- Prisma migration。
- `prisma db push`。
- `prisma migrate dev`。
- `prisma migrate reset`。
- destructive SQL。
- 批量创建。
- 无人确认执行。
- 新增 public API。
- 新增写库路径。
- Lead Attribution。
- PDF。

如果后续发现现有字段无法表达任务生命周期、复测结果或审计记录，应单独提出 schema change proposal，并在 staging 重新 QA。

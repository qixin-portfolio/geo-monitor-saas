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

### 6.2 v0.1.2 / Stage 2.2 Risk Review 审核状态设计

v0.1.2 把 Detail 页里的“风险审核”升级为执行前的风险决策卡，但仍然只做展示，不做审核写库。

Risk Review 需要回答：

- 当前风险等级是什么。
- 这条任务能不能直接执行。
- 为什么需要审核。
- 需要补哪些证据。
- 哪些情况禁止执行。
- 后续真正审核流需要预留什么信息结构。

风险等级执行含义：

| 风险等级 | 执行含义 |
| --- | --- |
| `GREEN` | 可进入内容制作，但仍需基于真实资料；不代表自动发布，也不代表系统已经完成审核 |
| `YELLOW` | 暂不建议直接执行；需要补证据或人工确认后再进入内容制作 |
| `RED` | 禁止直接执行；只能记录风险或改写方向，不得自动发布或包装成事实 |

Required evidence 规则：

- `FAQ`：服务范围、真实流程、常见问题答案、更新时间。
- `CASE_STUDY`：真实项目名称或脱敏项目、施工 / 服务过程、结果说明、可核验图片或记录。
- `QUALIFICATION`：营业执照、资质证书、行业背书、授权证明。
- `SERVICE_PAGE`：服务范围、服务流程、适用场景、案例或资质依据。
- `SCHEMA`：页面真实内容、结构化字段、与页面正文一致。
- `COMPARISON`：对比维度、事实来源、不攻击竞品、不使用“碾压”“吊打”等表达。
- `SOURCE_BUILDING`：第三方页面、媒体来源、平台资料、可公开访问的证明来源。
- `CONTENT_UPDATE`：关联 query、页面现有内容、需要补充的事实依据、更新时间。

Prohibited actions 规则：

- `GREEN`：不得跳过事实来源确认、不得自动发布线上内容、不得把系统建议包装成已审核结论。
- `YELLOW`：不得未补证据就直接执行、不得把排名 / 最好 / 推荐写成确定事实、不得使用无法核验的客户评价、不得承诺价格 / 效果 / 转化结果。
- `RED`：不得攻击竞品、伪造客户评价、虚构案例、伪造榜单、批量灌水、隐藏文本、提示词注入、RAG 投毒、夸大或无法证明的承诺。

Human Gate 说明：

> 这不是自动修复结论，而是执行前的风险提示。黄色和红色任务必须由人工确认后再处理。

本轮明确不做：

- 不新增审核状态字段。
- 不新增审核写库。
- 不新增“通过审核”按钮。
- 不新增 server action。
- 不新增 public API route。
- 不新增自动执行。
- 不新增自动发布。
- 不做 production rollout。
- 不做批量创建。
- 不做 Lead Attribution。
- 不做 PDF。

风险等级是启发式提示，不是法律、合规或平台官方最终结论。后续若要保存审核人、审核时间、审核结果或复测记录，应单独提出 schema change proposal。

### 6.3 v0.1.3 / Stage 2.3 Retest Before / After 复测占位设计

v0.1.3 把 Detail 页里的“复测与报告占位”升级为“复测与验收计划”。它只说明未来怎么验收，不代表已经复测，也不保存任何复测结果。

Retest Plan 需要回答：

- 修复前状态是什么。
- 这条任务希望改善什么。
- 修复后应该观察哪些指标。
- 什么情况算改善。
- 什么情况算暂无变化。
- 什么情况算风险未通过。
- 未来老板报告应该如何解释结果。

修复前状态展示：

- 当前任务来自哪次 AI 监测 / query。
- 当前品牌提及状态。
- 当前推荐状态。
- 当前 evidence 缺口摘要。
- 当前 risk level。
- 当前 task type。

复测目标按任务类型派生：

- `FAQ`：AI 能否更准确理解服务范围和常见问题；品牌是否更容易在相关问答中被提及。
- `CASE_STUDY`：AI 是否能引用真实案例作为推荐依据；品牌是否在本地 / 行业问题中更具可信度。
- `QUALIFICATION`：AI 是否能识别资质、认证和背书；品牌可信度是否改善。
- `SERVICE_PAGE`：AI 是否能理解服务范围、服务区域和服务对象；推荐语是否更准确。
- `SCHEMA`：页面结构化信息是否更容易被机器读取；FAQ / LocalBusiness / Organization / Article 信息是否更清楚。
- `COMPARISON`：对比表达是否更事实化、更克制；是否避免攻击竞品。
- `SOURCE_BUILDING`：是否新增可公开访问的第三方来源；AI 是否更容易找到外部证据。
- `CONTENT_UPDATE`：旧内容是否更准确、更完整；更新时间和事实依据是否更清楚。
- fallback：补充可核验事实，让 AI 更容易理解品牌和服务。

待观察指标：

- AI 是否提及品牌。
- AI 是否推荐品牌。
- 推荐语是否更准确。
- 是否出现新的引用来源。
- 是否仍被竞品压制。
- 情感倾向是否改善。
- 是否出现事实错误。
- 风险等级是否下降。

改善判定规则：

- 品牌从未提及变为被提及。
- 品牌从未推荐变为被推荐。
- AI 回答开始引用新补充的案例 / FAQ / 资质 / 服务页。
- 推荐语更准确。
- 竞品压制减弱。
- 情感从中性 / 负向变为中性偏正向。

暂无变化判定规则：

- AI 仍未提及品牌。
- AI 仍只推荐竞品。
- 未引用新增内容。
- 回答内容无明显变化。

风险未通过判定规则：

- AI 出现错误引用。
- 夸大表达被模型采纳。
- 出现虚假或无法证明的表述。
- 触发黄色或红色风险时，不得包装成改善。

老板报告摘要占位：

> 修复完成后，系统将对同一 query 进行复测，并对比修复前后的品牌提及、推荐语、引用源和风险变化。当前页面只展示验收计划，不生成正式报告，不承诺排名、推荐或流量提升。

本轮明确不做：

- 不新增复测写库。
- 不新增报告生成写库。
- 不新增外部 AI 调用。
- 不新增 cron / queue / background job。
- 不新增“开始复测”按钮。
- 不新增“生成报告 / PDF”按钮。
- 不生成 PDF。
- 不做 production rollout。

复测计划不是复测结果。页面不能表达“已经改善”“已经复测”“AI 一定会推荐”，也不能承诺排名、推荐或流量提升。

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

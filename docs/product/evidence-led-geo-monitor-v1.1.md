# Evidence-led GEO Monitor v1.1

## 1. 新产品定位

GEO Monitor 从“AI 提及率监测工具”升级为：

> AI 答案证据链与页面修复建议系统。

它不只回答“AI 有没有提到我”，而是回答老板真正关心的四个问题：

1. 哪些用户问题没有推荐我。
2. AI 推荐了哪些竞品。
3. AI 信了哪些来源和证据。
4. 我应该优先修哪一页，才最可能改变 AI 答案。

## 2. 老板真正购买的价值

老板不购买分数本身，老板购买的是可执行的增长判断：

- 预算应该投在哪些页面。
- 哪些问题正在把潜在客户导给竞品。
- 哪些证据缺失导致 AI 不敢推荐自己。
- 修改后能否看到答案变化。
- 未来线索能否回溯到某条 AI 回答、某个页面、某个 query。

## 3. 为什么分数不够

“提及率 20%”只能说明结果，不说明原因。

对经营者来说，分数的短板是：

- 不知道 AI 为什么不推荐。
- 不知道竞品赢在哪里。
- 不知道应该改官网、案例、FAQ，还是第三方资料。
- 不知道改完以后是否有效。
- 不能把内容动作和咨询线索连起来。

证据链比单一分数更值钱，因为它能把监测结果变成修复动作。

## 4. 四个核心模块

### Query Evidence Map

按 query 展示 AI 回答里的品牌提及、竞品提及、来源类型、证据缺口和修复优先级。

### Source Citation Map

识别或推断 AI 信任的来源类型，例如工商信息、官网、本地地图、社媒、媒体报道、第三方口碑。

### Page Impact Recommendation

把证据缺口映射到页面建议，例如本地推荐页、案例页、客户评价页、透明工地页、材料说明页、售后 FAQ。

### Lead Attribution Ledger

未来把咨询线索与 query、AI 回答、页面访问和修复动作建立弱归因链，帮助判断哪类 AI 答案可能带来线索。

## 5. V1.1 MVP 范围

本轮只做低风险切片：

- 新增产品方案文档。
- 新增 Loop 执行文档。
- 新增证据链概念数据模型文档。
- 新增 Evidence extraction 纯函数。
- 新增 `/dashboard/evidence-map` 只读页面。
- 基于现有 Query / QueryRun / QueryRunAnalysis 派生 Evidence Map。
- 空数据时展示兜底状态。
- 不修改 Prisma schema。
- 不生成 migration。
- 不运行生产迁移。

## 6. Evidence Chain Hardening 范围

MVP 合并后的第一轮加固聚焦数据质量，不扩展大页面：

- 为 `extractEvidenceMap` 补充 Vitest 单元测试。
- 从 `citationsJson`、URL、answer、summary 中提取 AnswerSource draft。
- 将 evidence gap 映射为 RepairTask draft。
- 在 Evidence Map 中展示“建议修复任务”。
- 不把 AnswerSource / RepairTask 落库。
- 不修改 Prisma schema。

暂不落库的原因：

- 当前规则仍是启发式，需要先通过真实监测结果校准。
- AnswerSource 的 URL、domain、sourceType 结构需要更多样本验证。
- RepairTask 与现有 Content Backlog 的关系还需要下一轮设计清楚。
- 先用 derived data 验证产品价值，可回滚成本最低。

## 7. V1.2 / V1.3 演进路线

### RepairTask Backlog 接入轮

Evidence Chain Hardening 后，本轮把 RepairTask draft 连接到现有 Content Backlog 语义：

- 新增 `mapRepairTaskToContentTask` 纯函数。
- 将 `page_update`、`new_page`、`faq_addition`、`sentiment_defense`、`competitor_counter` 等 RepairTask 类型映射为现有 `GeoContentTaskType`。
- 在 Evidence Map 页面展示“可进入修复任务池”的只读入口。
- 使用现有 `GeoContentTask` 可展示字段承载 `evidenceGap`、`suggestedPage`、`expectedImpact` 和 `nextSteps`。
- 本轮不写入数据库，不新增真实创建按钮，不修改 Prisma schema。

暂不直接创建任务的原因：

- 现有 `/api/runs/[id]/content-tasks` 是按 run 批量生成，不是按单条 RepairTask draft 精准创建。
- Evidence Map 的 RepairTask 仍是启发式派生，需要先确认映射规则稳定。
- 直接写库会引入去重、状态流、权限校验、误生成任务等额外风险。
- 先做 draft 映射和只读入口，可以让用户看清“将会进入任务池的内容”。

本轮不做 Lead Attribution。线索归因需要表单、电话、企微、埋点或页面访问数据，本轮目标只是让证据缺口进入可执行任务池语义。

### Run Before/After Comparison 接入轮

RepairTask draft 能进入任务池语义后，下一步需要证明修复动作是否真的影响了 AI 答案。本轮增加同一个 query 最近两次 run 的前后变化对比：

- 新增 `compareEvidenceRuns` 纯函数。
- 基于同一 `queryId` 最近两条 `QueryRun` / `QueryRunAnalysis` 派生 EvidenceMapItem。
- 判断品牌是否从未提及变成提及，或从提及变成未提及。
- 判断竞品提及数量是否减少。
- 判断来源类型是否从 `unknown` / `business_registry` 改善为 `official_site` / `authority_media` / `local_listing`。
- 判断 evidence gap 是否从 P0 类缺口改善为 P1 或更低。
- 在 Evidence Map 页面展示“答案变化趋势”和每条 query 的前后变化。

本轮仍是只读派生数据，不写入数据库，不创建真实 RepairTask，不做 Lead Attribution，不做 PDF，不做全平台接入。

### Real-run Calibration 接入轮

Run Comparison 合并后，本轮用脱敏 monitoring run 样本校准 Evidence Map / AnswerSource / RepairTask / Run Comparison 的启发式规则：

- 新增 `real-run-samples` 脱敏夹具，覆盖品牌未提及、竞品提及、工商来源、官网/本地列表/权威媒体、字符串化 citations、异常 citations、前后改善/无变化/恶化。
- 校准 AnswerSource extraction 对 `citationsJson`、`sourcesJson`、嵌套来源对象、URL 尾部标点和 owned domain 的容错。
- 校准 source type 分类，补充工商、短视频、本地列表、权威媒体等更接近真实 run 的关键词和域名线索。
- 校准 Evidence Gap，避免在品牌已经有官网、本地列表或权威媒体证据时误判为“只有工商信息”。
- 校准 RepairTask 映射，避免在已有高质量来源时误触发 `schema_fix`。
- 保持 Evidence Map 页面只读，并用文案说明这些判断是系统推断，数据不足不是失败。

本轮仍不接生产数据库，不写入 RepairTask，不修改 Prisma schema，不生成 migration，不做 Lead Attribution。真实样本只保留足够测试规则的脱敏字段，不保存客户隐私或完整 raw API response。

### Evidence Confidence Label 接入轮

Real-run Calibration 合并后，本轮给 Evidence Map / AnswerSource / RepairTask / Run Comparison 增加置信度标签，帮助用户区分三类判断：

- 高置信命中：明确命中品牌或竞品，并且有可解析 URL、官网、本地列表或权威媒体等强信号。
- 中置信推断：主要依赖 answer / summary 文本关键词，能看到品牌或竞品线索，但来源证据不足。
- 低置信 / 数据不足：缺少 citation、sourceType 为 `unknown`、answer 为空或过短、历史 run 缺失，或者 JSON 解析失败。

页面展示仍是轻量只读：只显示置信度、简短原因和数据不足提示，不创建真实 RepairTask，不写入数据库，不把 derived data 当事实归因。

### Evidence Detail Drawer 接入轮

Evidence Confidence Label 合并后，本轮在 Evidence Map 页面增加轻量“证据详情抽屉”，让用户从单行表格结论下钻到系统推断依据：

- Query 基本信息：query、场景、platform、surface、provider、model 和当前 run 时间。
- 品牌与竞品判断：品牌是否提及、竞品命中列表和文本匹配依据。
- 来源判断：sourceTypes、可解析来源、domain、sourceType、confidence 和 extractionMethod。
- Evidence Gap：证据缺口、优先级、原因、建议页面和建议动作。
- RepairTask Draft：任务类型、标题、预期影响、工作量和 next steps。
- Run Before/After Comparison：同 query 最近两次 run 的品牌、竞品、来源、缺口和总体变化。
- Confidence Label：高 / 中 / 低置信、分数、原因和 warning。

本轮仍是只读 derived data 展示，不写入数据库，不创建真实 RepairTask，不修改 Prisma schema，不做 Lead Attribution，也不把系统推断包装成平台官方归因。

### RepairTask Create Button Safety Design 接入轮

Evidence Detail Drawer 合并后，下一步不是直接上线“创建任务”按钮，而是先完成安全设计审查。

本轮新增：

- `repair-task-create-safety-design` 架构文档。
- `validateRepairTaskDraft` 纯函数和单元测试。
- 未来从 Evidence Map 创建单条修复任务的数据流、权限校验、字段校验、幂等去重、审计字段和 UI 安全文案。

为什么先设计再实现：

- 创建修复任务会从只读 derived data 进入真实数据库写入。
- 必须先确认 tenant 校验、字段白名单、敏感字段过滤和幂等去重。
- 不能信任前端传入的 `tenantId`、`userId` 或完整 raw response。
- 必须避免重复创建、越权创建、把 secret 或隐私字段写入 `evidenceJson`。

本轮仍不创建真实按钮，不写数据库，不修改 Prisma schema，不生成 migration，不做 Lead Attribution。

### RepairTask Validator Hardening 接入轮

RepairTask Create Button Safety Design 合并后，本轮继续停在写库前的安全闸门，不进入按钮实现。

本轮加固：

- `validateRepairTaskDraft` 的 `sanitizedDraft` 改为显式白名单输出。
- `evidenceJson` 和 `briefJson` 只保留未来写入 `GeoContentTask` 需要的明确字段。
- 嵌套 `repairTask` 只保留 task type、priority、evidence gap、suggested page、expected impact、effort level 和 next steps。
- raw response、prompt、token、secret、cookie、authorization 等字段会被拒绝，不进入 sanitized output。
- Content Backlog 顶层 `priority` 只接受 RepairTask 映射产生的 `90`、`70`、`45`，非法值直接拒绝，不再静默 fallback。

为什么继续不做按钮：

- Validator 只能保证字段形状和敏感字段过滤，不能替代 server 端 tenant 校验。
- 真正写库前仍需要幂等去重、权限校验、query/run 归属校验和审计字段确认。
- 任何“加入修复任务池”按钮都会从 derived data 进入真实数据库写入，必须单独过 Human Gate。

本轮仍不创建真实按钮，不写数据库，不新增 API route / server action，不修改 Prisma schema，不生成 migration，不做 Lead Attribution。

### Minimal RepairTask Server Action 接入轮

RepairTask Validator Hardening 合并后，本轮进入最小 server 端创建能力，但仍不接前端按钮。

本轮新增：

- `createEvidenceRepairTask` server action / server-only function。
- 只创建单条 `GeoContentTask`。
- 只使用 `validateRepairTaskDraft` 返回的 `sanitizedDraft`。
- server 端重新解析当前 tenant，不使用 client payload 里的 `tenantId`。
- 如果传入 `queryId`、`queryRunId`、`analysisId`，server 端必须确认它们属于当前 tenant。
- 使用现有 `GeoContentTask` 字段做保守幂等去重，避免同一 tenant 下重复创建同类修复任务。

当前边界：

- 不接 Evidence Detail Drawer / Evidence Map 的真实按钮。
- 不做批量创建。
- 不做自动修复。
- 不新增 API route。
- 不修改 Prisma schema，不生成 migration。
- 不做 Lead Attribution、PDF 或全平台接入。

为什么还不接 UI：

- 真实按钮会让用户触发生产数据写入，需要单独审查文案、确认弹窗、错误反馈和权限体验。
- 当前幂等策略复用 `sourceQuery`、`type` 和 `evidenceJson.repairTask`，足够保守，但不是强唯一约束。
- 下一轮 UI 接入前仍需要 Human Gate，确认按钮开放范围和真实写库风险。

### RepairTask Server Action QA Gate 接入轮

Minimal RepairTask Server Action 合并后，本轮不继续接 UI，而是先建立“加入修复任务池”按钮前的人工 QA 闸门。

本轮新增：

- `docs/qa/repair-task-server-action-qa-gate.md`。
- 人工 QA 前置条件：非生产环境、测试 tenant、测试账号、测试 Query / QueryRun / Analysis、脱敏样本。
- QA 用例：未登录、无 tenant、非法 priority、非法 taskType、raw response、secret-like 字段、跨 tenant query / run / analysis、合法创建、重复创建和 tenant 隔离。
- UI 接入前置条件：必须通过手动 QA、仍只允许单条创建、必须有确认弹窗，并明确提示“系统推断，不代表平台官方归因”。

本轮仍不新增按钮、不新增 public API route、不新增新的写库路径、不做批量创建、不做自动修复、不做 Lead Attribution。

### V1.2

- 继续用更多真实 run 样本观察和校准 AnswerSource / Evidence Gap / Run Comparison。
- 继续校准 Evidence Confidence Label 的阈值和文案，避免把弱推断包装成事实。
- 观察 Evidence Detail Drawer 是否能帮助用户复核每条 query 的判断依据。
- 基于最小 server action 评估是否进入“单条 UI 按钮接入”。
- 给每条 evidence gap 生成明确 next steps。
- 评估“加入修复任务池”按钮是否具备确认弹窗、错误反馈、权限校验和去重提示。

### V1.3

- 引入 OwnedPage 和 PageImpactScore。
- 建立页面级修复队列。
- 生成 Weekly Boss Brief。
- 增加可导出的 GEO Evidence Report。
- 接入 LeadEvent，形成线索弱归因账本。

## 8. 不做什么

本轮不做：

- 全量外部网页抓取。
- 所有 AI 平台接入。
- 浏览器埋点和完整归因。
- 企微、电话、表单集成。
- PDF 导出。
- 付费套餐重构。
- 生产数据库迁移。
- 认证、支付、部署配置改动。

## 9. 风险和反例

### 风险

- 启发式来源识别会漏判，不能当成事实证据。
- 没有真实引用 URL 时，只能推断来源类型。
- 页面建议是优先级建议，不保证改完立即改变 AI 答案。
- 竞品词库不足时，竞品提及会漏掉。

### 反例

- 如果 AI 答案没有引用来源，系统只能做弱推断。
- 如果行业本身缺少可公开证据，页面修复的效果会慢。
- 如果 query 太泛，页面建议会变粗，需要人工二次判断。
- 如果品牌名没有配置，品牌提及判断会失真。

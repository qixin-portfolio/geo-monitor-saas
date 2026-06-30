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

### V1.2

- 用真实 run 样本校准 AnswerSource extraction。
- 把 RepairTask draft 映射到现有 Content Backlog。
- 给每条 evidence gap 生成明确 next steps。
- 支持按 batch 对比前后答案变化。

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

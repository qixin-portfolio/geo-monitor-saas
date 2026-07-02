# GEOFlow-inspired Content Execution Layer v0.1

# GEO Monitor 内容执行层借鉴设计 v0.1

## 1. 结论

GEOFlow 可以作为 GEO Monitor 未来“内容执行层”的参考，但 GEO Monitor 不应变成内容工厂。

建议定位：

- GEO Monitor：发现问题、诊断原因、生成修复任务、绑定证据、复测效果、输出报告。
- GEOFlow 类系统：生产内容、审核内容、分发内容、维护内容资产。

一句话结论：

GEO Monitor 不直接照搬 GEOFlow，而是吸收它的内容工程、分发通道、审核流、任务日志和素材健康设计。

本设计只定义产品路线，不引入 GEOFlow 代码，不迁移 Laravel / PHP / Redis / Queue 技术栈，不新增表，不新增写库路径，不接自动发布。

## 2. GEO Monitor 与 GEOFlow 的边界

| 维度 | GEO Monitor | GEOFlow-inspired Execution Layer |
| --- | --- | --- |
| 核心定位 | AI 搜索可见度监测、证据化诊断、修复任务、复测与报告 | 内容生产、审核、发布、分发、内容资产维护 |
| 主要用户 | 老板、运营、增长负责人、品牌负责人 | 内容运营、编辑、SEO / GEO 执行人员、技术管理员 |
| 核心对象 | QueryRun、EvidenceGap、RepairTask、RetestPlan、ReportSnapshot | EvidenceAsset、RepairDraft、PublishTarget、DistributionLog、ReviewDecision |
| 核心动作 | 监测、分析、解释、生成修复建议、设计复测 | 写草稿、改稿、审核、导出、发布、记录分发状态 |
| 风险边界 | 不替用户发布内容，不把建议包装成事实，不自动改生产数据 | 任何发布动作都需要渠道权限、审核记录、回滚方式和日志 |
| 是否写库 | 当前已有受控 RepairTask 写库；本轮不新增写库 | 未来可能写内容资产、草稿、审核、分发日志；本轮不实现 |
| 是否发布内容 | 当前不发布 | 未来可支持 Manual Export；自动发布后置 |
| 是否自动化 | 当前以只读诊断、人工确认、复测计划为主 | 未来可半自动草稿、人工审核、手动导出 |
| 是否需要 Human Gate | 需要。RepairTask、风险审核、复测解释都需要人工判断 | 更需要。任何发布、渠道连接、外部写入都必须 Human Gate |

GEO Monitor 当前阶段仍是监测、诊断、修复任务和复测计划，不做自动发布。Execution Layer 只能作为后续能力边界，不应提前把系统推向内容工厂或无人分发系统。

## 3. 可借鉴模块一：Evidence Asset Library

GEO Monitor 应该建设证据资产库，把“建议修什么”进一步推进到“缺什么真实证据”。

资产类型：

- Brand Profile
- Service Description
- Case Study
- Qualification
- FAQ
- Customer Review Authorization
- Media Mention
- Price / Package Explanation
- Process Documentation
- Local Service Area
- Before / After Proof
- Third-party Source

每个 Evidence Asset 应该有：

- source
- owner
- validity
- update time
- claim supported
- related RepairTask
- risk level
- usage permission
- expiry / review date

价值：

- 让 RepairTask 不只是 AI 建议，而是能回到真实资料。
- 每条修复任务都能说明它依赖哪些证据、缺哪些证据。
- 老板能直接看到“缺什么证据”，而不是只看到“要写一篇文章”。
- 后续报告能统计“证据健康度”，例如过期证据、无授权评价、缺案例、缺资质页。

第一版建议只做 PRD 和只读设计，不急着新增表。可以先从现有 `evidenceJson`、`briefJson.evidenceNeeded` 和 RepairTask 风险审核中提炼字段。

## 4. 可借鉴模块二：GEO Infrastructure Checklist

GEO Monitor 可以设计 GEO 基础设施检查清单，用来判断品牌内容是否具备被搜索引擎和 AI 系统读取、理解、引用的基础条件。

检查项：

- sitemap.xml
- robots.txt
- llms.txt
- LocalBusiness Schema
- Organization Schema
- Service Schema
- FAQ Schema
- Article Schema
- Breadcrumb Schema
- 页面标题
- 联系方式可抓取
- 案例页可索引
- 资质页可索引
- 服务区域页可索引
- 页面更新时间
- canonical
- 内链结构
- 图片 alt
- FAQ 可读性

输出形式：

- PASS
- WARNING
- FAIL
- NOT_CHECKED

接入 RepairTask 的方式：

- 基础设施缺失可以自动生成 RepairTask draft。
- 生成后仍必须 Human Gate，不能自动写库、自动改站、自动发布。
- 风险等级应和 RepairTask Workbench 对齐：结构化数据缺失通常是 GREEN / YELLOW；隐藏文本、虚假 Schema、RAG 投毒等必须 RED。
- 第一版可以只做只读检查结果和“建议创建修复任务”入口，不做生产站抓取和自动修改。

## 5. 可借鉴模块三：Content Execution Layer

未来内容执行层的定位是：接住 GEO Monitor 已经发现的 Evidence Gap 和 RepairTask，把它变成可审核、可导出、可复测的执行物。

未来链路：

```text
AI 可见度监测
→ Evidence Gap
→ RepairTask
→ Draft
→ Review
→ Publish Target
→ Distribution Log
→ Retest
→ Report
```

核心对象建议：

- ContentAsset
- RepairDraft
- DraftRevision
- PublishTarget
- PublishChannel
- DistributionLog
- ReviewDecision
- RetestRun
- ReportSnapshot

当前阶段不新增这些表。这里只是路线设计。

产品边界：

- Draft 只能来自真实证据和 RepairTask，不应凭空生成事实。
- Review 必须记录人工判断，不应由 AI 自己判定“可发布”。
- Publish Target 第一版只做 Manual Export / Copy Draft。
- Retest 是复测计划和未来结果记录，不是“保证 AI 会推荐”的承诺。
- Report 只能解释已发生的监测结果，不能承诺排名、流量或转化。

## 6. 可借鉴模块四：发布渠道适配器

GEOFlow 的多站点分发思路可以作为远期参考，但 GEO Monitor 第一版不实现自动分发。

未来可支持：

- WordPress REST
- Static GEO Site
- HTTP API
- Customer CMS
- Manual Export
- Knowledge Base Page
- Xiaohongshu / Zhihu / WeChat Official Account 作为人工分发渠道记录

每个渠道要有：

- channel type
- authentication mode
- manual / automated
- approval required
- rollback method
- risk level
- last publish status

第一版只能做 Manual Export / Copy Draft。自动发布必须后置。

渠道设计原则：

- 不复用用户登录态写外部系统。
- 不保存明文密钥。
- 不打印 token、cookie、Authorization header。
- 发布失败不能影响 GEO Monitor 的监测主链路。
- 外部发布必须有可追踪日志和人工确认。

## 7. 可借鉴模块五：Agent 安全边界

安全原则：

- AI 不直接发布。
- AI 不直接改生产数据。
- AI 不直接写任意代码。
- AI 输出结构化草稿。
- 系统套受控模板。
- 人工审核后才进入发布。
- 所有动作可追踪。
- 高风险内容必须 blocked。
- 黄风险内容必须 needs review。
- 红风险内容不得执行。

风险规则表：

| 风险类型 | 允许展示 | 生成草稿 | 人工审核 | 发布 | 自动执行 |
| --- | --- | --- | --- | --- | --- |
| 绿色 | 允许 | 允许，但必须基于真实证据 | 需要 | 人工确认后才允许 | 不允许 |
| 黄色 | 允许 | 允许生成待审草稿 | 必须 | 审核通过且证据补齐后才允许 | 不允许 |
| 红色 | 允许展示风险原因 | 不允许生成可发布草稿，只能生成改写建议或阻断说明 | 必须记录阻断 | 不允许 | 不允许 |

明确规则：

- RED 不允许自动执行。
- YELLOW 必须人工审核。
- GREEN 也不等于无人发布。

这套边界应该贯穿 RepairTask、RepairDraft、ReviewDecision、PublishChannel 和 ReportSnapshot。

## 8. 可借鉴模块六：Job / Revision / Event Log

GEOFlow 的任务、队列、分发日志思路说明：执行层必须可追踪。GEO Monitor 未来如果做状态写入，不能只保存一个最终状态，需要记录事件链。

建议未来对象：

- RepairTaskEvent
- RepairTaskStatusHistory
- RepairDraftRevision
- PublishJob
- PublishEvent
- RetestEvent

事件类型示例：

- TASK_CREATED
- DRAFT_GENERATED
- HUMAN_REVIEW_REQUIRED
- REVIEW_APPROVED
- REVIEW_REJECTED
- PUBLISH_REQUESTED
- PUBLISH_SUCCEEDED
- PUBLISH_FAILED
- RETEST_SCHEDULED
- RETEST_COMPLETED
- REPORT_INCLUDED

这些是未来设计，不在本轮实现。

如果未来做状态写入，必须单独 PRD、server action、tenant-scoped update、audit log、Staging QA。

第一版可以先做只读状态流文档，把“任务从哪里来、为什么创建、谁审核、是否导出、是否复测”讲清楚，再决定是否落库。

## 9. 可借鉴模块七：老板报告与健康度

报告指标：

- AI Visibility Health
- Evidence Asset Health
- RepairTask Health
- GEO Infrastructure Health
- Publishing Health
- Retest Health

老板报告应该能回答：

- AI 有没有推荐我
- 哪些问题没推荐我
- 我输给谁
- 我缺什么证据
- 本月修了什么
- 哪些修复已发布
- 哪些任务待复测
- 复测有没有改善
- 下月应该优先补什么

报告边界：

- 报告不是广告文案。
- 报告不能承诺 AI 排名提升。
- 报告应该区分“已监测事实”“系统推断”“人工待确认”“未验证结果”。
- 对老板最重要的不是生成了多少内容，而是哪些证据缺口被补上、哪些问题复测有变化、哪些风险仍未通过。

## 10. 暂时不要做的事情

当前阶段明确不做：

- 不做自动发布
- 不做多站点分发
- 不接 WordPress
- 不接外部 HTTP API
- 不生成静态站点包
- 不生成 PDF
- 不做真实复测
- 不做外部 AI 自动改稿
- 不做无人执行
- 不做批量内容污染
- 不做 RAG 投毒
- 不做隐藏文本
- 不做虚假榜单
- 不做攻击竞品内容

这些能力不是永远不能做，而是需要更成熟的证据资产、审核流、事件日志、权限控制和 Human Gate。没有这些基础，自动化只会放大风险。

## 11. 推荐路线图

### Now：当前优先

- Evidence Asset Library PRD
- GEO Infrastructure Checklist PRD
- RepairTask 状态流
- RepairTask Event Log 设计
- 老板报告结构

### Next：中期

- RepairDraft
- Human Review
- Manual Export
- Draft Revision
- Retest Result

### Later：后期

- WordPress Adapter
- Static GEO Site
- Publishing Channel
- Distribution Log
- Automated Retest
- Report Snapshot

### Much Later：谨慎探索

- 多站点分发
- Agent 生成模板
- AI 爬虫趋势分析
- 半自动发布

路线取舍：

- 先把证据和审核做扎实，再考虑发布。
- 先做 Manual Export，再考虑外部渠道。
- 先做只读状态流，再做写库状态机。
- 先做复测结果记录，再做自动复测。

## 12. 对当前阶段 2.4 的影响

结合当前正在做的 RepairTask 状态流，GEOFlow 的 job / revision / event 思路说明我们下一步应该先做：

- 只读状态流
- 人工推进原则
- Human Gate
- Event Log 设计

不要马上做：

- 状态写入
- 自动发布
- 真实复测
- 多渠道分发

对 Stage 2.4 的建议：

- RepairTask Detail 可以继续强化“当前状态为什么是这个状态”，但不要新增执行按钮。
- 状态流应先解释 TODO / BRIEF_READY / DRAFT_READY / REVIEW_NEEDED / APPROVED / EXPORTED / SKIPPED 的含义。
- Event Log 第一版可以只做产品设计，说明未来需要记录哪些事件、谁触发、何时触发、是否跨 tenant。
- 任何状态写入都必须单独 PRD，带 tenant-scoped update、audit log、测试和 Staging QA。

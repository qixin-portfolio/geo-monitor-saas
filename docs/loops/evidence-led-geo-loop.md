# Evidence-led GEO Loop

> 本 Loop 用于把 GEO Monitor 的监测结果转成证据链、页面建议和后续修复任务。

## 1. Trigger / 心跳

- 手动触发：用户点击 Run Monitoring。
- 定期触发：未来每周自动生成 Boss Brief。
- 事件触发：未来有新线索进入时做归因匹配。

## 2. Inputs / 输入

- Tenant
- Brand Profile
- Query
- QueryRun
- QueryRunAnalysis
- AI Answer
- Competitor names
- Owned pages，未来接入
- Known source types
- Lead events，未来接入

## 3. Process / 循环过程

每次监测后执行：

1. 判断 AI 回答是否提及本品牌。
2. 提取竞品提及。
3. 提取或推断引用来源类型。
4. 从 `citationsJson`、URL、answer、summary 中提取 AnswerSource draft。
5. 判断证据缺口。
6. 生成页面级建议。
7. 将 evidence gap 映射为 RepairTask draft。
8. 将 RepairTask draft 映射为 Content Backlog draft。
9. 对比同一 query 最近两次 run 的答案变化。
10. 用脱敏 real-run samples 回归测试启发式规则，减少误判。
11. 给 Evidence Map / AnswerSource / RepairTask / Run Comparison 生成置信度标签。
12. 在 Evidence Detail Drawer 中展示每条 query 的系统推断依据。
13. 未来与线索做弱归因匹配。

## 4. Outputs / 输出

- Evidence Map
- Source Citation Map
- Page Impact Recommendation
- RepairTask draft
- Content Backlog draft
- EvidenceRunComparison
- Real-run calibration fixtures
- EvidenceConfidenceLabel
- Evidence Detail Drawer
- Weekly Boss Brief，未来
- Exportable GEO Evidence Report，未来
- Lead Attribution Ledger，未来

## 5. Verification / 验收

本轮验收：

- `pnpm typecheck` 通过。
- `pnpm build` 通过。
- `/dashboard/evidence-map` 页面存在。
- 空数据时页面不崩。
- 有 QueryRun 数据时可展示 Evidence Map 雏形。
- `extractEvidenceMap` 单元测试通过。
- AnswerSource draft 没有外部 API 调用。
- RepairTask draft 不写入数据库。
- Content Backlog draft 映射不写入数据库。
- `mapRepairTaskToContentTask` 单元测试通过。
- `compareEvidenceRuns` 单元测试通过。
- 脱敏 real-run samples 覆盖 citations 数组、字符串化 JSON、异常 citations、来源质量提升和前后变化。
- AnswerSource extraction 对缺失或异常 citations 安全 fallback。
- Evidence gap 不会在已有官网、本地列表或权威媒体时误判为弱品牌定义。
- Run Comparison 在数据不足时返回 `unknown`，不误判为 `improved`。
- Evidence Confidence Label 能区分高置信命中、中置信推断、低置信或数据不足。
- 置信度标签不写入数据库，不作为事实归因。
- Evidence Detail Drawer 能展示 Query 基本信息、品牌/竞品判断、来源判断、Evidence Gap、RepairTask Draft、Run Comparison 和 Confidence Label。
- Evidence Detail Drawer 不写入数据库，不创建真实 RepairTask，不展示完整 raw API response。
- Evidence Map 能展示“答案变化趋势”。
- 没有历史 run 时展示数据不足状态，不崩溃。
- 不修改 `.env`。
- 不写入真实 secret。
- 不修改 Prisma schema。
- 不生成 migration。
- 不运行生产迁移。
- 不修改 Vercel / Clerk / Supabase / Stripe 配置。

## 6. Stop / Rollback

遇到以下情况必须停止：

- 需要生产数据库迁移。
- 需要把 RepairTask 直接写入生产任务池。
- 需要保存 EvidenceRunComparison 到数据库。
- 需要真实密钥或外部付费 API。
- 需要导入生产 raw API response 或客户隐私样本。
- 需要修改认证、支付、部署配置。
- schema 影响过大。
- dashboard 路由异常。
- build 无法在本轮边界内修复。
- 工作区出现大量意外变更。

回滚方式：

- 本轮改动集中在文档、纯函数和 dashboard 只读页面。
- 如需回滚，可 revert 对应 PR。

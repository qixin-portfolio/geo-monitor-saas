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
13. 为未来单条 RepairTask 创建能力执行安全设计审查。
14. 加固 `validateRepairTaskDraft`，确保未来写库前只接受白名单字段和合法 priority。
15. 通过最小 server action 创建单条 tenant scoped `GeoContentTask`。
16. 为最小 server action 建立 UI 接入前 QA Gate，人工验证 tenant、归属校验、幂等和安全字段。
17. 记录 server action 手动 QA 状态；没有非生产环境和测试数据时必须标记未执行，不得伪造通过。
18. 在本地非生产环境执行 server action 级 Manual QA，验证 15 条接 UI 前安全用例。
19. 在 Evidence Detail Drawer 中接入单条“加入修复任务池”按钮，用户确认后复用已 QA 的 server action。
20. 未来与线索做弱归因匹配。

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
- RepairTask create safety design
- RepairTask draft validation result
- Hardened RepairTask draft validation result
- Minimal RepairTask server action result
- RepairTask server action QA Gate
- RepairTask server action manual QA record
- RepairTask server action manual QA execution result
- Evidence Detail Drawer single RepairTask create button
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
- Evidence Detail Drawer 不展示完整 raw API response；只有用户确认单条按钮后才调用已 QA 的 server action 创建任务。
- RepairTask create safety design 明确权限校验、字段校验、幂等去重、审计字段和 UI 安全文案。
- `validateRepairTaskDraft` 单元测试通过。
- `validateRepairTaskDraft` 使用显式白名单输出，不保留未知 `evidenceJson` / `briefJson` 字段。
- 嵌套 raw response、secret、token、cookie、authorization 等字段会被拒绝。
- 非法 Content Backlog priority 会返回 `valid=false`，不静默 fallback。
- Minimal RepairTask server action 只创建单条 `GeoContentTask`。
- server action 不信任 client payload 中的 `tenantId`。
- 如果传入 `queryId` / `queryRunId` / `analysisId`，必须确认属于当前 tenant。
- 重复任务返回 `duplicate=true`，不重复创建。
- RepairTask server action QA Gate 已记录人工 QA 前置条件、用例清单和 UI 接入前置条件。
- QA Gate 当轮不新增 public API route、不新增前端按钮、不新增新的写库路径。
- RepairTask server action manual QA record 已记录执行状态；未实际执行时必须说明原因和下一步所需测试环境。
- RepairTask server action manual QA execution 已在本地非生产 `localhost` 测试库完成 15 条用例。
- Manual QA 覆盖未登录、无 tenant、非法 priority、非法 taskType、raw response、secret-like 字段、跨 tenant query/run/analysis、合法创建、duplicate、tenant 可见性和安全字段检查。
- Manual QA 结果为 15 pass / 0 fail / 0 blocked。
- 所有关键手动 QA 用例通过前，不允许进入 UI 按钮接入；PR #18 已记录 15 pass / 0 fail / 0 blocked。
- 即使 server action 级 QA 已通过，UI 按钮接入后仍需按钮级浏览器 QA。
- Evidence Detail Drawer 已接入单条“加入修复任务池”按钮。
- 按钮必须由用户主动点击并确认后调用 `createEvidenceRepairTask`。
- 按钮只传最小 draft、`queryId`、`queryRunId`、`analysisId`，不传 `tenantId`、raw answer、完整 AI response、token、cookie 或 secret。
- 按钮提供 success、duplicate、validation、permission 和 unknown error 安全提示，不展示原始 stack 或数据库错误。
- 本轮不做批量创建，不做无人确认执行修复。
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

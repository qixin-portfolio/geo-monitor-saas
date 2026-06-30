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
9. 未来对比上次 run 的答案变化。
10. 未来与线索做弱归因匹配。

## 4. Outputs / 输出

- Evidence Map
- Source Citation Map
- Page Impact Recommendation
- RepairTask draft
- Content Backlog draft
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
- 需要真实密钥或外部付费 API。
- 需要修改认证、支付、部署配置。
- schema 影响过大。
- dashboard 路由异常。
- build 无法在本轮边界内修复。
- 工作区出现大量意外变更。

回滚方式：

- 本轮改动集中在文档、纯函数和 dashboard 只读页面。
- 如需回滚，可 revert 对应 PR。

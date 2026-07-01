# RepairTask Create Button Safety Design

> 本文是安全设计与接口方案。当前已进入最小 server action 基础能力，
> 并在 Evidence Detail Drawer 中接入单条“加入修复任务池”按钮；本轮不做批量创建，
> 不修改 Prisma schema，不生成 migration，不新增新的写库路径。

## 1. 当前状态

- Evidence Map 仍以证据浏览为主，不提供批量创建。
- Evidence Detail Drawer 已接入单条“加入修复任务池”按钮。
- `RepairTaskDraft` 由 `EvidenceMapItem` 纯函数派生。
- `ContentBacklogTaskDraft` 由 `RepairTaskDraft` 纯函数映射。
- 已新增 server-only 单条创建能力：`createEvidenceRepairTask`。
- Drawer 按钮必须由用户主动点击并确认后，才调用 `createEvidenceRepairTask` 创建一条 `GeoContentTask`。
- 按钮不新增 public API route，不新增 server action 写库路径，不传 `tenantId`。

## 2. 创建任务的数据流

当前链路：

```text
EvidenceMapItem
→ RepairTaskDraft
→ ContentTaskDraft
→ validateRepairTaskDraft
→ createEvidenceRepairTask server action
→ tenant scoped GeoContentTask
```

关键原则：

- 前端只提交最小 draft，不提交 `tenantId`。
- server 端重新从登录态解析 tenant context。
- server 端重新校验 Query / QueryRun 是否属于当前 tenant。
- server 端重新运行 draft validation，不信任 client payload。
- 写入目标优先复用现有 `GeoContentTask`。
- `evidenceJson` / `briefJson` 用于承载 evidence gap、suggested page、next steps 和来源摘要。

## 3. 权限校验要求

未来最小安全 server action / API 必须满足：

- 用户必须登录。
- 用户必须属于当前 tenant / org。
- 只能给自己的 tenant 创建任务。
- 不能通过前端传入 `tenantId` 越权。
- server 端必须调用 `getOrCreateTenant()` 或等价 tenant resolver。
- server 端必须用当前 tenant 查询 `Query` / `QueryRun` / `QueryRunAnalysis`。
- 如果 `queryId`、`queryRunId` 或 `analysisId` 不属于当前 tenant，返回 404 或 403。
- 不信任 client payload 中的 `tenantId`、`userId`、`createdByUserId`。

当前实现边界：

- server action / server-only function：`src/app/dashboard/content-backlog/actions/create-evidence-repair-task.ts`
- 输入：`draft`、可选 `queryId`、`queryRunId`、`analysisId`
- 输出：`success`、`taskId`、`duplicate`、`errors`
- 所有 database create 必须发生在 server 端 tenant scoped 逻辑内。
- Evidence Detail Drawer 只复用该 action，不新增 API route。

## 4. 字段校验要求

必须先通过白名单与长度限制：

- `taskType` 白名单：`page_update`、`new_page`、`faq_addition`、`schema_fix`、`third_party_profile`、`review_collection`、`authority_building`、`sentiment_defense`、`competitor_counter`。
- `GeoContentTask.type` 白名单：沿用 Prisma `GeoContentTaskType`。
- `priority` 白名单：RepairTask 使用 `P0` / `P1` / `P2`；Content Backlog 写库前只接受映射后的 `90` / `70` / `45`，非法值直接拒绝。
- `evidenceGap` 白名单：`competitor_evidence_advantage`、`missing_citable_brand_evidence`、`weak_brand_definition`、`no_major_gap`。
- `relatedQuery` 长度限制，空值必须 fallback 为安全占位。
- `suggestedPage` 长度限制。
- `title` / `description` / `sourceReason` / `recommendedAngle` 长度限制。
- `nextSteps` 限制数量与单条长度。
- 禁止 raw AI response 入库。
- 禁止 secret、token、email、phone、cookie、private key、database URL、webhook secret 等敏感字段入库。

`validateRepairTaskDraft` 是写库前的纯函数前置校验：

- 不联网。
- 不读写数据库。
- 不依赖浏览器环境。
- 输出 `valid`、`errors`、`sanitizedDraft`。
- server action 只使用 `sanitizedDraft`，不使用原始 client payload 写库。

Validator Hardening 后的约束：

- `sanitizedDraft` 使用显式白名单输出。
- `evidenceJson` 只保留 `source`、`trigger`、`relatedQuery`、`suggestedPage`、`nextSteps`、`repairTask`。
- `evidenceJson.repairTask` 只保留 `taskType`、`priority`、`evidenceGap`、`suggestedPage`、`expectedImpact`、`effortLevel`、`nextSteps`。
- `briefJson` 只保留 `audience`、`searchIntent`、`angle`、`differentiationTargets`、`forbiddenClaims`、`evidenceNeeded`、`outline`、`internalLinks`、`llmsNotes`。
- 未知字段不会通过 spread 进入 `sanitizedDraft`。
- 嵌套 raw response、secret、token、cookie、authorization 等字段会被拒绝。
- 顶层 Content Backlog priority 只接受 RepairTask 映射产生的 `90`、`70`、`45`；非法 priority 直接返回 `valid=false`，不再静默 fallback。
- `sanitizedDraft` 是 server action 的输入基线；真正写入前仍必须执行 server 端 tenant 校验、幂等去重和权限校验。

## 4.1 Minimal RepairTask Server Action

本轮之前已新增 `createEvidenceRepairTask`，作为 UI 按钮的 server 端基础能力。

能力范围：

- 只创建单条 `GeoContentTask`。
- 调用 `validateRepairTaskDraft` 并只使用 `sanitizedDraft`。
- 通过 `getOrCreateTenant()` 在 server 端解析当前 tenant。
- 不信任 client payload 中的 `tenantId`、`userId` 或未知字段。
- 如果传入 `queryId`、`queryRunId`、`analysisId`，必须用当前 tenant 重新查询归属。
- 如果归属不匹配，直接拒绝，不写库。
- 写入时使用 `tenant.id`，不使用前端传入 tenant。
- 写入 `evidenceJson` / `briefJson` 时再次显式白名单重建安全对象。

当前仍不做：

- 不做批量创建。
- 不做无人确认执行修复。
- 不新增 API route。
- 不新增 Prisma schema 字段。
- 不生成 migration。

## 4.2 RepairTask Server Action QA Gate

`createEvidenceRepairTask` 已经具备 server 端单条写库能力。接入 Evidence Map / Evidence Detail Drawer 按钮前，必须先通过 QA Gate。

QA Gate 范围：

- 新增人工 QA 清单：`docs/qa/repair-task-server-action-qa-gate.md`。
- 确认 action 仍是 server-only，不新增 public API route。
- QA Gate 当轮确认 UI 尚未接入前端按钮。
- 确认不新增新的写库路径。
- 确认 tenant 校验、query / run / analysis 归属校验和幂等去重可人工复核。
- 确认 `sourceReason`、`evidenceJson`、`briefJson` 不写入 raw response、prompt、token、secret 或隐私字段。

UI 接入前置条件：

- QA Gate 文档已合并。
- 手动 QA 使用非生产环境、测试 tenant、测试账号和脱敏样本完成。
- server action 不暴露 public API。
- 仍然只允许单条创建。
- UI 必须有确认弹窗。
- UI 必须提示“系统推断，不代表官方来源结论”。
- UI 文案不得使用“无人确认执行修复”等绝对化表述。

## 4.3 RepairTask Server Action Manual QA

QA Gate 合并后，必须在非生产环境执行手动 QA，并把执行状态记录到：

- `docs/qa/repair-task-server-action-manual-qa-record.md`

当前执行状态：

- 已在本地非生产 `localhost:5432` 测试库执行 server action 级 Manual QA。
- 测试数据为 fake Tenant A / Tenant B、fake Query / QueryRun / QueryRunAnalysis 和仓库外 payload。
- Clerk 测试用户已绑定到 fake tenant，但文档不记录完整 user id。
- QA runner 位于仓库外，不提交到仓库。
- 15 条用例通过，0 失败，0 blocked。
- 覆盖未登录、无 tenant、非法 priority、非法 taskType、raw response、secret-like 字段、跨 tenant query/run/analysis、合法创建、duplicate、tenant 可见性和安全字段检查。
- 本轮不修改 env，不使用真实客户数据，不使用真实 raw AI response。

Manual QA 通过后仍然保留以下 UI 接入边界：

- 本轮不允许批量创建。
- 本轮不新增新的写库路径。
- 本轮不把该能力作为已完成 UI 可用能力对外描述。
- 按钮接入后还需要浏览器端到端 QA，覆盖确认弹窗、重复提示、失败提示和 tenant 切换体验。

## 4.4 Evidence Detail Drawer 单条按钮接入

本轮在 Evidence Detail Drawer 的 RepairTask Draft 区域接入单条“加入修复任务池”按钮。

按钮边界：

- 仅支持用户主动点击后创建单条任务。
- 点击按钮后必须先显示确认弹窗，不能直接写库。
- 确认文案说明任务来自系统推断，并非第三方平台确认的来源结论。
- 前端只传最小 Content Backlog draft、`queryId`、`queryRunId`、`analysisId`。
- 前端不传 `tenantId`，不传 raw answer，不传完整 AI response，不传 token / cookie / secret。
- server action 继续使用 `validateRepairTaskDraft`、tenant context、query/run/analysis 归属校验和 duplicate 逻辑。
- 成功、duplicate、validation、permission 和未知错误都显示安全提示，不展示原始 stack 或数据库错误。

当前仍不做：

- 不做批量创建。
- 不做无人确认执行修复。
- 不新增 public API route。
- 不新增新的写库路径。
- 不做 Lead Attribution、PDF 或全平台接入。

## 5. 幂等去重要求

同一 tenant 在短时间内不应重复创建多条相同任务。

建议生成 `idempotencyKey`：

```text
tenantId + queryId + evidenceGap + taskType + suggestedPage
```

当前无 schema 变更的临时方案：

- 写入前用 `tenantId`、`sourceQuery`、`type`、`status in unfinished` 查询已有任务。
- 同时检查 `evidenceJson.repairTask.evidenceGap`、`evidenceJson.repairTask.taskType`、`evidenceJson.suggestedPage`。
- 如果找到未完成同类任务，返回 `existing`，不创建新任务。
- 由于 `GeoContentTask` 没有 `queryId` 或 `idempotencyKey` 字段，当前用 server 端确认后的 `sourceQuery` 作为 query identity 的保守替代。

未来如需强幂等：

- 再考虑 schema 中增加 `idempotencyKey` 或在 `evidenceJson` 中保存 key。
- 加唯一约束前必须单独评估 migration 和历史数据清洗。

## 6. 审计字段建议

未来可写入 `evidenceJson` 或新字段：

- `source = evidence_map`
- `sourceRunId`
- `sourceQueryId`
- `confidenceLevel`
- `createdByUserId`
- `createdFromEvidenceAt`
- `idempotencyKey`
- `validationVersion`

当前 `GeoContentTask` 已有：

- `tenantId`
- `queryRunId`
- `analysisId`
- `sourceQuery`
- `sourceReason`
- `evidenceJson`
- `briefJson`
- `createdAt`
- `updatedAt`

本轮不新增审计字段到 Prisma schema。

## 7. UI 安全文案

按钮不要写：

- 无人确认执行修复
- 一键修复
- 生成真实归因
- 已创建任务

建议按钮写：

- 加入修复任务池

确认弹窗建议：

> 该任务由系统根据当前 AI 答案、来源信息和证据缺口推断生成，并非第三方平台确认的来源结论。加入后你可以在 GEO 修复任务中继续编辑和确认。

成功反馈建议：

- 已加入修复任务池。
- 该修复任务已存在，未重复创建。

失败反馈建议：

- 当前任务信息不足，暂时无法加入修复任务池。
- 当前账号无权创建该任务。
- 暂时无法创建任务，请稍后重试。

## 8. 不做事项

本轮不做：

- Prisma schema 修改。
- migration。
- 批量创建。
- 无人确认执行修复。
- 外部 API 调用。
- Lead Attribution。
- PDF 导出。
- 全平台接入。
- 自动部署。

## 9. 下一轮 QA 建议

下一轮建议审查按钮级浏览器 QA，不做批量创建：

1. 验证 Evidence Detail Drawer 的确认弹窗、取消、loading、success、duplicate 和 error 状态。
2. 验证按钮只提交最小 draft 和 query/run/analysis 标识。
3. 验证 server action 继续重新校验 tenant、payload 和幂等。
4. 验证 Content Backlog 只显示当前 tenant 的任务。
5. 继续禁止批量创建和无人确认执行。

仍需 Human Gate：

- 是否需要新增 idempotency schema。
- 是否把按钮限制为特定 plan / tenant。

## 10. Button Browser QA 结果

PR #19 合并后，已在本地非生产环境执行按钮级浏览器 QA。

QA 范围：

- 本地 `localhost:5432` 测试库 `geo_monitor`。
- fake Tenant A / Tenant B。
- fake Query / QueryRun / QueryRunAnalysis。
- Evidence Detail Drawer 的真实按钮、确认弹窗、取消、确认、success、duplicate 和 permission error 路径。
- Content Backlog 当前 tenant 可见性和 Tenant B 隔离显示。

QA 结果：

- 15 pass / 0 fail / 0 blocked。
- 打开 Drawer 不写库。
- 点击“加入修复任务池”先弹确认，不直接创建任务。
- 点击取消不写库。
- 点击确认只创建单条 `GeoContentTask`。
- 重复确认返回 duplicate，不重复写库。
- 权限错误显示安全文案，不暴露 stack、Prisma 错误或 raw server error。
- 写入任务扫描未发现 raw response、prompt、token、secret、cookie、authorization 或数据库连接串模式。

本地限制：

- development 环境会绕过 Clerk route protection。
- 本轮 Tenant B 切换通过 fake DB 的 dev fallback 模拟，不等同于 staging 的真实 Clerk 用户切换。
- 进入 staging 或生产 rollout 前，仍需 Human Gate，并使用 Clerk 测试账号 A / B 复测登录、退出和 tenant 隔离。

本轮仍未做：

- schema 修改。
- migration。
- public API route。
- 新的写库路径。
- 批量创建。
- 无人确认执行。
- Lead Attribution、PDF 或全平台接入。

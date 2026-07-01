# RepairTask Server Action Manual QA Record

> 本文记录 `createEvidenceRepairTask` 在接入前端“加入修复任务池”按钮前的手动 QA 状态。
> 本轮不新增 UI 按钮、不新增 public API route、不新增新的写库路径。

## 1. QA 环境说明

| 项目 | 记录 |
|------|------|
| QA 状态 | 已执行 |
| QA 结论 | 15 条用例通过，0 失败，0 blocked |
| 是否为非生产环境 | 是，本地 `localhost:5432` 测试库 `geo_monitor` |
| 测试账号 | Clerk 测试用户已绑定到 Tenant A / Tenant B，文档不记录完整 user id |
| 测试 tenant | `manual_qa_tenant_a_local` / `manual_qa_tenant_b_local` |
| 测试 Query / QueryRun / Analysis | 使用本地 fake seed 数据 |
| 测试数据说明 | 只使用 Manual QA 假数据，不包含真实客户数据 |
| 是否确认未使用真实客户数据 | 是 |
| 是否使用真实 raw AI response | 否 |
| 是否使用真实手机号、微信号、邮箱、token、cookie | 否 |
| payload 文件 | `/private/tmp/repair-task-manual-qa-payloads.local.json`，仓库外本地文件 |
| QA runner | `/private/tmp/repair-task-manual-qa-runner.ts`，仓库外本地 runner |

执行方式：

- 使用仓库外 runner 调用真实 `createEvidenceRepairTask` server action。
- runner 只模拟 `getOrCreateTenant()` 的当前 tenant context，不新增 UI、不新增 public API route。
- runner 先清理 fake Tenant A / B 下的旧 `GeoContentTask`，保证合法创建和 duplicate 用例可重复验证。
- runner 只输出每条用例 pass / fail / blocked 和简短原因，不打印完整 `DATABASE_URL`、Clerk secret、token、cookie 或完整 Clerk user id。

执行前确认：

- `.env.local` 被 `.gitignore` 忽略。
- `DATABASE_URL` host 为 `localhost`。
- migration 已部署到本地测试库且无待执行 migration。
- `pnpm test:unit`、`pnpm typecheck`、`pnpm build` 在 seed 前已通过。

## 2. Server Action 审查摘要

已静态审查 `src/app/dashboard/content-backlog/actions/create-evidence-repair-task.ts`：

- action 文件使用 `"use server"`。
- 当前没有新增 public API route。
- tenant 由 server 端 `getOrCreateTenant()` 获取。
- 不使用 client payload 中的 `tenantId`。
- 写库前调用 `validateRepairTaskDraft()`。
- 写库仅使用 `validation.sanitizedDraft` 派生出的安全字段。
- `queryId`、`queryRunId`、`analysisId` 会按当前 tenant 重新查询归属。
- 归属不匹配时返回错误，不写库。
- 重复任务通过 `tenantId`、`sourceQuery`、`type`、unfinished status 和 `evidenceJson.repairTask` 做保守去重。
- duplicate 命中时返回 `duplicate=true` 和已有 `taskId`，不重复创建。

## 3. QA 用例表格

| # | 用例名称 | 输入条件 | 预期结果 | 实际结果 | 状态 | 备注 |
|---|----------|----------|----------|----------|------|------|
| 1 | 未登录调用应拒绝 | runner 模拟 `getOrCreateTenant()` 抛错 | 返回未登录或无法确认租户错误，不写库 | 拒绝成功，未新增任务，错误包含“未登录” | 通过 | 通过仓库外 runner 调用真实 server action |
| 2 | 无 tenant 应拒绝 | runner 模拟 `getOrCreateTenant()` 返回 `null` | 拒绝创建，不写入 `GeoContentTask` | 拒绝成功，未新增任务，错误包含“无法确认当前租户” | 通过 | 覆盖无法确认 tenant 场景 |
| 3 | 非法 priority 应拒绝 | draft priority 为 `50` | validator 拒绝，错误包含 invalid priority | 拒绝成功，未新增任务，错误包含 `invalid priority` | 通过 | 验证 PR #14 的非法 priority 拒绝策略 |
| 4 | 非法 taskType 应拒绝 | `repairTask.taskType` 不在白名单 | validator 拒绝，不写库 | 拒绝成功，未新增任务，错误包含 `taskType` | 通过 | 验证 RepairTask taskType 白名单 |
| 5 | raw response 字段应拒绝或不入库 | draft 包含 `rawResponse` 假字段 | 拒绝或确保不入库 | 拒绝成功，未新增任务，错误包含 `raw response` | 通过 | payload 只含 fake marker，不含完整 raw AI response |
| 6 | secret-like 字段应拒绝或不入库 | draft 包含 `secretLikeField` 假字段 | 拒绝或确保不入库 | 拒绝成功，未新增任务，错误包含 `secret` | 通过 | payload 只含 fake marker，不含真实 secret |
| 7 | queryId 不属于当前 tenant 应拒绝 | Tenant A context + Tenant B queryId | 拒绝创建，不写库 | 拒绝成功，未新增任务，错误包含“query 不存在或不属于当前租户” | 通过 | 覆盖 query 归属校验 |
| 8 | queryRunId 不属于当前 tenant 应拒绝 | Tenant A context + Tenant B queryRunId | 拒绝创建，不写库 | 拒绝成功，未新增任务，错误包含“queryRun 不存在或不属于当前租户” | 通过 | 覆盖 run 归属校验 |
| 9 | analysisId 不属于当前 tenant 应拒绝 | Tenant A context + Tenant B analysisId | 拒绝创建，不写库 | 拒绝成功，未新增任务，错误包含“analysis 不存在或不属于当前租户” | 通过 | 覆盖 analysis 归属校验 |
| 10 | 合法 draft 可创建单条任务 | Tenant A 合法 draft + query/run/analysis | 创建一条 `GeoContentTask`，返回 `success=true` | 创建成功，返回 `success=true`、`duplicate=false` 和本地 fake task id | 通过 | 只创建 fake Tenant A 的单条任务 |
| 11 | 重复创建返回 duplicate | 同 tenant 重复提交同一 draft | 返回 `duplicate=true`，不重复写库 | 返回 `duplicate=true` 和已有 task id，任务数量未增加 | 通过 | 幂等仍不是 DB unique constraint |
| 12 | 任务只出现在当前 tenant | 当前 tenant 创建后按 Tenant A / B 查询 | 只在当前 tenant 可见 | Tenant A 可查到任务，Tenant B 用同 taskId 查不到 | 通过 | 通过本地 DB 只读查询验证 tenantId 隔离 |
| 13 | 切换 tenant 后不可见 | 查询 Tenant B 的 Content Backlog 范围 | 看不到其他 tenant 的任务 | Tenant B 查询结果不包含 Tenant A 创建的任务 | 通过 | 通过本地 DB 只读查询模拟切换 tenant |
| 14 | description 不含敏感内容 | 检查 fake task 的 `title` / `sourceReason` / `briefJson` | 不包含 raw response / prompt / token / secret | 未发现 raw response、prompt、token、secret、cookie 或 DB URL 模式 | 通过 | 只扫描本地 fake task 展示字段 |
| 15 | nextSteps 安全 | 检查 `evidenceJson.nextSteps` 和 `repairTask.nextSteps` | 不超长，不含敏感信息 | 数量和长度符合限制，未发现敏感模式 | 通过 | 验证写入后的 nextSteps 安全摘要 |

## 4. UI 接入前判断

Manual QA passed in local non-production environment.

本地 server action 级 QA 已通过 15 条用例，但进入 Evidence Detail Drawer 的单条“加入修复任务池”按钮仍需要 Human Gate。

原因：

- 本轮没有新增真实 UI 按钮。
- 本轮没有新增 public API route。
- 本轮没有新增新的写库路径。
- 本轮 runner 模拟 tenant context 调用真实 server action，并未通过浏览器按钮完成端到端 UI QA。
- 真实按钮会让用户主动触发数据库写入，仍需单独审查确认弹窗、错误提示、loading / duplicate 状态和权限体验。

进入后续 UI 按钮接入 PR 前必须满足：

- 用户明确确认进入 Human Gate。
- UI 仍然只允许单条创建，不允许批量创建。
- UI 必须有确认弹窗。
- UI 必须提示“系统推断，不代表官方来源结论”。
- UI 不得暗示立即提升排名或第三方平台确认来源。
- server action 继续复用 `validateRepairTaskDraft`、tenant 归属校验和 duplicate 逻辑。

## 5. 残余风险

- 幂等仍不是 DB unique constraint。
- 当前只支持单条创建。
- 不支持批量创建。
- 不支持无人值守执行修复。
- 创建结果不代表官方来源结论。
- 本轮验证的是 server action 级能力，不是按钮级浏览器端到端流程。
- 下一轮若接 UI，需要补充按钮点击、确认弹窗、重复提示、失败提示和 tenant 切换后的浏览器 QA。

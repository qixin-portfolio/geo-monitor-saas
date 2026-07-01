# RepairTask Server Action Manual QA Record

> 本文记录 `createEvidenceRepairTask` 在接入前端“加入修复任务池”按钮前的手动 QA 状态。
> 本轮不新增 UI 按钮、不新增 public API route、不新增新的写库路径。

## 1. QA 环境说明

| 项目 | 记录 |
|------|------|
| QA 状态 | 未执行 |
| 是否为非生产环境 | 未确认 |
| 测试账号 | 未提供 |
| 测试 tenant | 未提供 |
| 测试 Query / QueryRun / Analysis | 未提供 |
| 测试数据说明 | 需要脱敏 mock 数据或非生产测试数据 |
| 是否确认未使用真实客户数据 | 本轮未执行真实 QA，因此未接触客户数据 |
| 是否使用真实 raw AI response | 否 |
| 是否使用真实手机号、微信号、邮箱、token、cookie | 否 |

未执行原因：

- 当前执行环境是干净 clone，不包含非生产数据库连接、Clerk 测试账号、测试 tenant 或测试 QueryRun 数据。
- 本轮安全要求禁止修改 env，也禁止使用真实客户数据或真实 raw AI response。
- 在缺少非生产账号和测试数据的情况下，不能伪造手动 QA 通过结论。

下一步人工 QA 需要：

- 非生产环境访问方式。
- 测试账号和可登录会话。
- 测试 tenant。
- 属于该 tenant 的测试 Query、QueryRun、QueryRunAnalysis。
- 另一个测试 tenant 的 Query / QueryRun / Analysis，用于验证跨 tenant 拒绝。
- 脱敏 mock draft payload，不包含 raw response、手机号、微信号、邮箱、token、cookie。

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
| 1 | 未登录调用应拒绝 | 无登录会话调用 action | 返回未登录或无法确认租户错误，不写库 | 未执行 | 未执行 | 需要非生产登录/未登录调用方式 |
| 2 | 无 tenant 应拒绝 | 登录用户没有可解析 tenant | 拒绝创建，不写入 `GeoContentTask` | 未执行 | 未执行 | 需要测试账号和无 tenant 场景 |
| 3 | 非法 priority 应拒绝 | draft priority 不在白名单 | validator 拒绝，错误包含 invalid priority | 未执行 | 未执行 | 单元测试已覆盖，仍需非生产手动验证 |
| 4 | 非法 taskType 应拒绝 | draft taskType 不在白名单 | validator 拒绝，不写库 | 未执行 | 未执行 | 需要脱敏异常 payload |
| 5 | raw response 字段应拒绝或不入库 | draft 包含 rawResponse / fullResponse | 拒绝或确保不入库 | 未执行 | 未执行 | 单元测试覆盖 rawResponse 拒绝 |
| 6 | secret-like 字段应拒绝或不入库 | draft 包含 token / secret-like 字段 | 拒绝或确保不入库 | 未执行 | 未执行 | 需要脱敏 mock 字段 |
| 7 | queryId 不属于当前 tenant 应拒绝 | 传入其他 tenant 的 queryId | 拒绝创建，不写库 | 未执行 | 未执行 | 需要第二个测试 tenant |
| 8 | queryRunId 不属于当前 tenant 应拒绝 | 传入其他 tenant 的 queryRunId | 拒绝创建，不写库 | 未执行 | 未执行 | 需要第二个测试 tenant |
| 9 | analysisId 不属于当前 tenant 应拒绝 | 传入其他 tenant 的 analysisId | 拒绝创建，不写库 | 未执行 | 未执行 | 需要第二个测试 tenant |
| 10 | 合法 draft 可创建单条任务 | 当前 tenant 的合法 draft + query/run/analysis | 创建一条 `GeoContentTask`，返回 `success=true` | 未执行 | 未执行 | 需要非生产数据库 |
| 11 | 重复创建返回 duplicate | 同 tenant 重复提交同一 draft | 返回 `duplicate=true`，不重复写库 | 未执行 | 未执行 | 需要先创建第 10 条任务 |
| 12 | 任务只出现在当前 tenant | 当前 tenant 创建后查看 Content Backlog | 只在当前 tenant 可见 | 未执行 | 未执行 | 需要 UI 或数据库只读核查 |
| 13 | 切换 tenant 后不可见 | 切换到其他测试 tenant 查看 | 看不到其他 tenant 的任务 | 未执行 | 未执行 | 需要两个测试 tenant |
| 14 | description 不含敏感内容 | 查看创建任务的 `sourceReason` / description | 不包含 raw response / prompt / token / secret | 未执行 | 未执行 | 需要创建成功后核查 |
| 15 | nextSteps 安全 | 查看创建任务的 `evidenceJson.nextSteps` / `briefJson.outline` | 不超长，不含敏感信息 | 未执行 | 未执行 | 需要创建成功后核查 |

## 4. UI 接入前判断

当前不允许进入 Evidence Detail Drawer 的单条“加入修复任务池”按钮接入。

原因：

- 关键 QA 用例尚未在非生产环境手动执行。
- 当前只有单元测试和静态审查通过。
- 真实按钮会触发数据库写入，必须在手动 QA 通过后再进入 Human Gate。

进入后续 UI 按钮接入 PR 前必须满足：

- 本记录中所有关键 QA 用例通过。
- 手动 QA 使用非生产环境、测试账号、测试 tenant 和脱敏数据完成。
- 未发现 tenant 越权、重复创建、敏感字段入库或 raw response 入库。
- 用户明确确认进入 Human Gate。

## 5. 残余风险

- 幂等仍不是 DB unique constraint。
- 当前只支持单条创建。
- 不支持批量创建。
- 不支持自动修复。
- 创建结果不代表平台官方归因。
- 没有非生产手动 QA 通过前，不应暴露真实前端按钮。

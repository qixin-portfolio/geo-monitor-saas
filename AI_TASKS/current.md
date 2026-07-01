# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

Minimal RepairTask Server Action：最小安全修复任务创建能力

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：待创建
- 分支：`codex/minimal-repair-task-action`
- 基线：远端 `main`，已包含 PR #14。
- 实现 commit：待提交
- 当前状态：实现与验证已完成，等待提交并创建 PR。

## 背景

PR #14 已进入 main，`validateRepairTaskDraft` 已加固为写库前安全闸门。
本轮允许实现“加入修复任务池”的最小 server 端基础能力，但不接 UI 按钮、不做批量创建、不做自动修复。

## 本次目标

1. 审查现有 `GeoContentTask`、Content Backlog、tenant / auth 和任务创建逻辑。
2. 新增 `createEvidenceRepairTask` server action / server-only function。
3. server 端重新获取当前 tenant，不信任 client payload 中的 `tenantId`。
4. 调用 `validateRepairTaskDraft`，只使用 `sanitizedDraft`。
5. 如果传入 `queryId`、`queryRunId`、`analysisId`，必须确认属于当前 tenant。
6. 只创建单条 `GeoContentTask`，并用现有字段做保守幂等去重。
7. 更新产品、架构、Loop 和 handoff 文档。

## 修改范围

- `src/app/dashboard/content-backlog/actions/create-evidence-repair-task.ts`
- `src/app/dashboard/content-backlog/actions/create-evidence-repair-task.test.ts`
- `docs/architecture/repair-task-create-safety-design.md`
- `docs/product/evidence-led-geo-monitor-v1.1.md`
- `docs/architecture/evidence-chain-data-model.md`
- `docs/loops/evidence-led-geo-loop.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 禁止事项

- 不提交真实 API Key / Token / 账号密码。
- 不提交 `.env`、数据库连接串、账号密码。
- 不自动合并 PR。
- 不擅自修改生产部署、数据库、认证、支付配置。
- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不接 UI 真实按钮。
- 不做批量创建。
- 不做自动修复。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不自动部署。
- 不大改 UI。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] `GeoContentTask` 现有字段足够承载单条 RepairTask draft，不需要 schema。
- [x] server action 只使用 server 端 tenant，不使用 payload tenantId。
- [x] server action 调用 `validateRepairTaskDraft`，只使用 `sanitizedDraft`。
- [x] `queryId` / `queryRunId` / `analysisId` 归属不匹配时拒绝。
- [x] 非法 draft / 非法 priority / raw response 字段会拒绝。
- [x] 合法 draft 可创建单条 `GeoContentTask`。
- [x] 重复任务返回 `duplicate=true`，不重复创建。
- [x] 不接前端按钮。
- [x] 不做批量创建。
- [x] 不修改 Prisma schema。
- [x] 不生成 migration。
- [x] 不修改 env。
- [x] `pnpm exec vitest run src/app/dashboard/content-backlog/actions/create-evidence-repair-task.test.ts` 通过，1 个文件 / 7 个测试。
- [x] `pnpm test:unit` 通过，19 个文件 / 94 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。

## 是否需要 Loop

- 判断：需要。
- 依据：RepairTask 创建能力会反复触发字段校验、tenant 校验、幂等去重和写库安全审查，属于高价值、可验收、可回滚的工程循环。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮新增 server 端真实写库能力，但不接 UI 按钮；下一轮如果要把按钮暴露给用户，必须再次进入 Human Gate。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

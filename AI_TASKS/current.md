# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

RepairTask Server Action QA Gate：修复任务创建按钮接入前 QA 闸门

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/16](https://github.com/qixin-portfolio/geo-monitor-saas/pull/16)
- 分支：`codex/repair-task-qa-gate`
- 基线：远端 `main`，已包含 PR #15。
- 实现 commit：`651528ef8cf0ae866c86196c267cba82afa5bec6`
- 当前状态：PR 已创建，等待人工审查与合并确认。

## 背景

PR #15 已进入 main，并新增 `createEvidenceRepairTask` server action / server-only function。
该能力已经可以在 server 端创建单条 tenant scoped `GeoContentTask`，但尚未接前端“加入修复任务池”按钮。

本轮只做 QA Gate 和 UI 接入前安全准备，不新增按钮、不新增 public API route、不新增新的写库路径。

## 本次目标

1. 审查现有 server action、validator、tenant 校验、query / run / analysis 归属校验和幂等去重策略。
2. 新增 `docs/qa/repair-task-server-action-qa-gate.md`。
3. 明确人工 QA 前置条件、QA 用例清单和 UI 接入前置条件。
4. 更新产品、架构、数据模型、Loop 和 handoff 文档。
5. 保持本轮不改 UI、不改 schema、不生成 migration、不新增写库路径。

## 修改范围

- `docs/qa/repair-task-server-action-qa-gate.md`
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
- 不新增 public API route。
- 不接前端真实按钮。
- 不新增新的写库路径。
- 不做批量创建。
- 不做自动修复。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不自动部署。
- 不大改 UI。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] 已确认 PR #15 server action 文件存在于 main。
- [x] 已审查 `createEvidenceRepairTask` 当前 server-only 边界。
- [x] 已新增 QA Gate 文档。
- [x] 已记录人工 QA 前置条件。
- [x] 已记录未登录、无 tenant、非法字段、跨 tenant、合法创建、重复创建和 tenant 隔离 QA 用例。
- [x] 已记录 UI 接入前置条件和安全文案。
- [x] 不新增前端真实按钮。
- [x] 不新增 public API route。
- [x] 不新增新的写库路径。
- [x] 不修改 Prisma schema。
- [x] 不生成 migration。
- [x] 不修改 env。
- [x] `pnpm exec vitest run src/app/dashboard/content-backlog/actions/create-evidence-repair-task.test.ts` 通过，1 个文件 / 7 个测试。
- [x] `pnpm test:unit` 通过，19 个文件 / 94 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [x] PR 描述已更新。
- [x] `AI_TASKS/handoff.md` 已更新。

## 是否需要 Loop

- 判断：需要。
- 依据：RepairTask 写库能力已经存在，接 UI 前必须有可重复、可验证、可停止、可追责的 QA Gate。

## 是否需要 Human Gate

- 判断：需要。
- 原因：下一轮如果把“加入修复任务池”按钮暴露给用户，会触发真实数据库写入，必须由用户确认后再继续。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

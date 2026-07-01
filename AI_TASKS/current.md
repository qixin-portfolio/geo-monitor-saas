# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

RepairTask Server Action Manual QA Execution：接 UI 按钮前的本地非生产手动 QA 执行记录

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/18](https://github.com/qixin-portfolio/geo-monitor-saas/pull/18)
- 分支：`codex/repair-task-manual-qa-execution`
- 基线：远端 `main`，已包含 PR #17。
- 实现 commit：`d2746ecd1dd275f6da239ff66471a03a19a45e8b`
- 当前 head commit：`12b91a018c820b7ac1ba6629d116a9a5dc39b9a9`
- 当前状态：PR 已创建，等待人工审查与合并确认。

## 背景

PR #17 已进入 main，并新增 Manual QA 记录文档。
当前本地环境已准备好：

- `DATABASE_URL` host 为 `localhost`。
- 写入库为本地测试库 `geo_monitor`。
- Clerk 测试用户已绑定到 fake Tenant A / Tenant B。
- fake Query / RunBatch / QueryRun / QueryRunAnalysis 已由本地 seed 准备。
- QA payload 位于仓库外 `/private/tmp/repair-task-manual-qa-payloads.local.json`。

本轮执行 `createEvidenceRepairTask` 的 15 条 Manual QA 用例，并把结果写回仓库文档。

## 本次目标

1. 执行前确认 `.env.local` 被忽略、DB host 为 `localhost`、payload 和 server action 存在。
2. 使用仓库外 runner 调用真实 `createEvidenceRepairTask` server action。
3. 覆盖 15 条 QA Gate 用例。
4. 更新 `docs/qa/repair-task-server-action-manual-qa-record.md`。
5. 更新产品、架构、数据模型、Loop 和 handoff 文档。
6. PR #18 已创建，等待 ChatGPT / 用户审查。

## 修改范围

- `docs/qa/repair-task-server-action-manual-qa-record.md`
- `docs/architecture/repair-task-create-safety-design.md`
- `docs/product/evidence-led-geo-monitor-v1.1.md`
- `docs/architecture/evidence-chain-data-model.md`
- `docs/loops/evidence-led-geo-loop.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 禁止事项

- 不使用生产环境。
- 不使用真实客户数据。
- 不使用真实 raw AI response。
- 不使用真实手机号、微信号、邮箱、token、cookie。
- 不打印完整 `DATABASE_URL`。
- 不打印 Clerk secret、token、cookie 或完整 Clerk user id。
- 不提交 `.env.local`、数据库连接串、账号密码。
- 不提交本地 seed 脚本。
- 不提交仓库外 payload / runner。
- 不自动合并 PR。
- 不擅自修改生产部署、数据库、认证、支付配置。
- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不新增 public API route。
- 不接前端真实按钮。
- 不新增新的写库路径。
- 不做批量创建。
- 不做无人值守执行修复。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不自动部署。
- 不大改 UI。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] 已确认 `.env.local` 被 git ignore。
- [x] 已确认 `DATABASE_URL` host 为 `localhost`。
- [x] 已确认 payload 文件存在于仓库外。
- [x] 已确认 server action 文件存在。
- [x] 已执行 15 条 Manual QA 用例。
- [x] 15 条用例通过，0 失败，0 blocked。
- [x] 合法 draft 创建单条 fake `GeoContentTask`。
- [x] 重复创建返回 `duplicate=true`，不重复写库。
- [x] 跨 tenant query / run / analysis 均被拒绝。
- [x] raw response / secret-like payload 均被拒绝或未入库。
- [x] 创建后的任务只在当前 tenant 范围内可见。
- [x] 写入字段未发现 raw response、prompt、token、secret、cookie 或 DB URL 模式。
- [x] 不新增前端真实按钮。
- [x] 不新增 public API route。
- [x] 不新增新的写库路径。
- [x] 不修改 Prisma schema。
- [x] 不生成 migration。
- [x] 不修改 env。
- [x] `pnpm test:unit` 通过，19 个文件 / 94 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [x] PR 描述已更新。
- [x] `AI_TASKS/handoff.md` 已更新。

## 是否需要 Loop

- 判断：需要。
- 依据：RepairTask 写库能力已经存在，接 UI 前必须有可重复、可验证、可停止、可追责的 QA 记录。

## 是否需要 Human Gate

- 判断：需要。
- 原因：虽然本地 server action 级 Manual QA 已通过，但下一轮如果把“加入修复任务池”按钮暴露给用户，会触发真实数据库写入，必须由用户确认后再继续。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

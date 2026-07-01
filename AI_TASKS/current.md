# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

RepairTask Server Action Manual QA：修复任务创建按钮接入前手动 QA 记录

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/17](https://github.com/qixin-portfolio/geo-monitor-saas/pull/17)
- 分支：`codex/repair-task-manual-qa`
- 基线：远端 `main`，已包含 PR #16。
- 实现 commit：`ca41b10e628ec39283f3d8636e328416882401b3`
- 当前状态：PR 已创建，等待人工审查与合并确认。

## 背景

PR #16 已进入 main，并新增 `docs/qa/repair-task-server-action-qa-gate.md`。
PR #15 已引入 `createEvidenceRepairTask` server action / server-only function。

本轮只根据 QA Gate 准备并记录手动 QA，不接前端按钮、不新增 public API route、不新增新的写库路径。

## 本次目标

1. 阅读 QA Gate 文档。
2. 审查 `createEvidenceRepairTask` 当前实现。
3. 新增 `docs/qa/repair-task-server-action-manual-qa-record.md`。
4. 如果无法执行非生产 QA，明确记录未执行、原因、所需环境和下一步。
5. 更新产品、架构、数据模型、Loop 和 handoff 文档。

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
- 不做无人值守执行修复。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不自动部署。
- 不大改 UI。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] 已确认 PR #16 文件存在于 main。
- [x] 已读取 QA Gate 文档。
- [x] 已审查 `createEvidenceRepairTask` 当前 server-only 边界。
- [x] 已新增 Manual QA record。
- [x] 已记录 QA 环境说明、用例表格、UI 接入前判断和残余风险。
- [x] 已明确本轮未执行真实非生产 QA。
- [x] 已记录未执行原因和下一步所需非生产环境。
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
- 原因：下一轮如果把“加入修复任务池”按钮暴露给用户，会触发真实数据库写入，必须由用户确认后再继续。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

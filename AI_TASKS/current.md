# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

Staging RepairTask Button QA：真实 Clerk / Preview 环境按钮级 QA 记录

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：待创建。
- 分支：`codex/staging-repair-task-button-qa-record`
- QA Preview 分支：`staging/repair-task-button-qa`
- QA Preview commit：`91c8db392239400ca0f19964bad8d4a3eb145a26`
- 基线：远端 `main`，已包含 PR #20。
- 当前状态：Staging Button QA 已完成，docs-only PR 待创建。

## 背景

PR #20 已合并到 main，本地 Button Browser QA 已通过。

本轮在 staging Preview + Clerk Staging 真实登录环境下复测 Evidence Detail Drawer 单条“加入修复任务池”按钮，验证真实 route protection、真实账号切换、tenant 隔离和单条创建链路。

前置条件：

- PR #18 server action 级 Manual QA：15 pass / 0 fail / 0 blocked。
- PR #19 只接入单条按钮，复用 `createEvidenceRepairTask`。
- PR #20 本地 Button Browser QA：15 pass / 0 fail / 0 blocked。
- staging migration / fake seed 已完成。
- Clerk Staging 测试用户 A / B 已绑定到 `staging_qa_tenant_a` / `staging_qa_tenant_b`。

## 本次目标

1. 使用 staging Preview URL 验证未登录访问会被 Clerk route protection 拦截。
2. 使用 `qa-a+clerk_test@example.com` / `qa-b+clerk_test@example.com` 完成真实登录、登出和账号切换。
3. 验证 Tenant A / B Evidence Map 和 Content Backlog 不串租户。
4. 验证 Drawer、RepairTask Draft、确认弹窗、取消、确认、success 和重复创建防护。
5. 验证每个 tenant 只创建 1 条 `GeoContentTask`。
6. 新增 `docs/qa/staging-repair-task-button-qa-record.md`。
7. 更新 `AI_TASKS/current.md` 和 `AI_TASKS/handoff.md`。
8. 创建 docs-only PR，不自动合并。

## 修改范围

- `docs/qa/staging-repair-task-button-qa-record.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 禁止事项

- 不修改 `.env`。
- 不提交 `.env.local`。
- 不修改 Prisma schema。
- 不生成 migration。
- 不新增 public API route。
- 不新增新的写库路径。
- 不修改 `createEvidenceRepairTask` server action。
- 不修改 validator。
- 不提交 seed 脚本、payload 文件或仓库外 QA runner。
- 不使用真实客户数据、真实 raw AI response、真实手机号、真实微信号、token 或 cookie。
- 不打印完整 `DATABASE_URL`。
- 不打印 Clerk Secret、token、cookie 或密码。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不自动部署。
- 不部署 production。
- 不修改 Production env。
- 不使用 production / Neon 数据库。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] PR #20 已进入 main。
- [x] staging Preview branch-specific env 指向 Supabase `geo-monitor-staging`。
- [x] runtime `DATABASE_URL` 使用 Supabase transaction pooler，port `6543`。
- [x] 未登录访问 dashboard 被 Clerk Staging 拦截。
- [x] 用户 A 登录成功，只看到 Tenant A query。
- [x] 用户 A Drawer 可打开，RepairTask Draft 可见。
- [x] 打开页面 / Drawer 不直接写库。
- [x] 点击按钮先出现确认弹窗。
- [x] 点击取消不创建任务。
- [x] 用户 A 点击确认后创建 1 条任务。
- [x] 用户 A 成功后显示“已加入修复任务池。”。
- [x] 同一任务重复创建被已加入状态阻止，DB 计数保持 A=1。
- [x] 用户 A Content Backlog 可见 A 任务。
- [x] 用户 A 任务内容不包含 raw response / prompt / token / cookie / secret。
- [x] 用户 B 登录成功，只看到 Tenant B query。
- [x] 用户 B 看不到 Tenant A query / task。
- [x] 用户 B 点击确认后创建 1 条任务。
- [x] DB 只读验证 `staging_qa_tenant_a=1`，`staging_qa_tenant_b=1`。
- [x] Staging Button QA 记录 19 pass / 0 fail / 0 blocked。
- [x] `pnpm test:unit` 通过，19 个文件 / 94 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [ ] PR 已创建。
- [ ] `AI_TASKS/handoff.md` 已更新为最终 PR 状态。

## Staging 环境注意事项

- session pooler 曾出现 `EMAXCONNSESSION`。
- 切换 transaction pooler 后，未观察到 PgBouncer / prepared statement / Prisma 连接错误。
- Supabase SQL Editor 只执行只读 count 查询。
- 本轮允许 staging fake 数据写入 QA repair task，但不允许写 production / Neon。
- Supabase SQL Editor 中的 private Untitled query 草稿仅包含只读 SQL，不包含 secret。

## 是否需要 Loop

- 判断：需要。
- 依据：这是将真实写库 UI 入口投入后续小范围验证前的按钮级 QA，必须可验证、可停止、可追踪。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮只创建 QA 记录 PR，不自动合并；是否进入 staging 发布检查仍需人工确认。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

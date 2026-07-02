# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | Staging RepairTask Button QA：真实 Clerk / Preview 环境按钮级 QA 记录 |
| 执行分支 | `codex/staging-repair-task-button-qa-record` |
| 状态 | Staging QA 已完成，docs-only PR 待创建 |
| GitHub 入口 | PR 待创建 |
| 上一轮依赖 | PR #20 已合并到远端 main，本地按钮 QA 已记录 |
| QA Preview 分支 | `staging/repair-task-button-qa` |
| QA Preview commit | `91c8db392239400ca0f19964bad8d4a3eb145a26` |
| QA 环境 | staging Preview + Supabase `geo-monitor-staging` + Clerk Staging |
| QA 结果 | 19 pass / 0 fail / 0 blocked |
| 是否使用真实客户数据 | 否 |

## 本轮交接

### 修改文件

- `docs/qa/staging-repair-task-button-qa-record.md`：新增 staging Preview + Clerk Staging 按钮级 QA 记录，覆盖 19 条用例。
- `AI_TASKS/current.md`：记录本轮任务、边界、验收和限制。
- `AI_TASKS/handoff.md`：记录本轮交接。

### QA 执行摘要

- 未登录访问 staging Preview dashboard 被 Clerk Staging route protection 拦截。
- `qa-a+clerk_test@example.com` 登录成功，只看到 Tenant A Evidence Map query。
- 用户 A Drawer 可打开，RepairTask Draft 可见。
- 打开页面 / Drawer 不直接创建 `GeoContentTask`。
- 点击“加入修复任务池”先出现确认弹窗。
- 点击取消不创建任务。
- 用户 A 点击确认后创建单条任务，显示“已加入修复任务池。”。
- 用户 A Content Backlog 可见 A 任务。
- 登出 A 并登录 `qa-b+clerk_test@example.com` 后，只看到 Tenant B query / task。
- 用户 B 点击确认后创建单条任务，显示“已加入修复任务池。”。
- 最终 DB 只读验证：`staging_qa_tenant_a=1`，`staging_qa_tenant_b=1`。
- 未发现 tenant 泄露。
- Content Backlog 展示内容未发现 raw AI response、prompt、token、cookie、secret 或真实客户数据。
- session pooler 曾出现 `EMAXCONNSESSION`；切换 transaction pooler 后页面稳定加载，未观察到 PgBouncer / prepared statement 错误。

### 安全边界

- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不提交 `.env.local`。
- 不修改 `src`。
- 不新增 public API route。
- 不新增新的写库路径。
- 不修改 `createEvidenceRepairTask` server action。
- 不提交 seed 脚本、payload 文件或仓库外 QA runner。
- 不使用真实客户数据。
- 不打印完整 `DATABASE_URL`。
- 不打印 Clerk Secret、token、cookie 或密码。
- 不连接 production / Neon 数据库。
- 不修改 Production env。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不部署 production。

### Staging 环境限制

- 本轮验证的是 staging Preview + Clerk Staging，不是 production。
- Supabase SQL Editor 自动保存的 private Untitled query 草稿只包含只读 SQL / tenant 计数，不包含 secret。
- 同一任务重复创建在本轮表现为 UI 已加入/禁用状态阻止重复点击，最终用 DB 计数确认没有重复创建。

### 验证记录

- `pnpm test:unit`：通过，19 个文件 / 94 个测试。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。

### 风险与注意事项

- 幂等仍不是 DB unique constraint。
- 本轮确认的是 staging 非生产链路，不是 production 验证。
- 后续不应直接进入批量创建、无人确认执行或 production rollout。

### 下一步建议

1. 创建 docs-only PR，不自动合并。
2. PR 审查通过后，再由人工决定是否进入小范围 staging 观察或 production 前 Human Gate。

---

## 历史记录

| 时间 | 任务 | 分支 / PR | 结果 | 备注 |
|------|------|-----------|------|------|
| 2026-06-29 | 初始化 AI 协作工作流 | PR #5 | 已合并 | 只改协作文档 |
| 2026-06-29 | Evidence Map MVP | PR #6 | 已合并 | 文档 + 只读页面 + 纯函数 |
| 2026-06-30 | Evidence Chain Hardening | PR #7 | 已合并 | 测试 + AnswerSource + RepairTask draft |
| 2026-06-30 | RepairTask 接入 Content Backlog | PR #8 | 已合并 | RepairTask draft 映射为 Content Backlog draft |
| 2026-06-30 | Run Before/After Comparison | PR #9 | 已合并 | 同一 query 最近两次 AI 答案变化对比 |
| 2026-06-30 | Real Run Calibration | PR #10 | 已合并 | 脱敏真实 run 样本校准 Evidence 规则 |
| 2026-06-30 | Evidence Confidence Label | PR #11 | 已合并 | 证据链置信度标签 |
| 2026-06-30 | Evidence Detail Drawer | PR #12 | 已合并 | 证据详情抽屉 |
| 2026-06-30 | RepairTask Create Button Safety Design | PR #13 | 已合并 | 创建单条修复任务能力安全设计与初版 validator |
| 2026-06-30 | RepairTask Validator Hardening | PR #14 | 已合并 | validator 白名单输出与 priority 拒绝策略 |
| 2026-07-01 | Minimal RepairTask Server Action | PR #15 | 已合并 | server 端单条 `GeoContentTask` 写库能力，未接 UI |
| 2026-07-01 | RepairTask Server Action QA Gate | PR #16 | 已合并 | 接 UI 前人工 QA Gate |
| 2026-07-01 | RepairTask Server Action Manual QA Record | PR #17 | 已合并 | 记录未执行状态和 QA 前置条件 |
| 2026-07-01 | RepairTask Server Action Manual QA Execution | PR #18 | 已合并 | 本地非生产 Manual QA 15 pass / 0 fail / 0 blocked |
| 2026-07-01 | Evidence Detail Drawer Single RepairTask Button | PR #19 | 已合并 | 单条按钮、确认弹窗、安全提示，复用已 QA 的 server action |

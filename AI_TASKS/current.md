# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

RepairTask Button Browser QA：Evidence Detail Drawer 单条按钮浏览器级 QA

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/20](https://github.com/qixin-portfolio/geo-monitor-saas/pull/20)
- 分支：`codex/repair-task-button-browser-qa`
- 基线：远端 `main`，已包含 PR #19。
- 实现 commit：`a23c05184c888a977c186a86c027bc1328d614f9`
- 当前 head commit：以 PR #20 页面为准。
- 当前状态：PR #20 已创建，等待人工审查与合并确认。

## 背景

PR #19 已合并到 main，Evidence Detail Drawer 已接入单条“加入修复任务池”按钮。

上一轮前置条件：

- PR #18 server action 级 Manual QA：15 pass / 0 fail / 0 blocked。
- PR #19 只接入单条按钮，复用 `createEvidenceRepairTask`。
- PR #19 未新增 public API route，未新增新的写库路径，未修改 schema / migration / env。

本轮对按钮做浏览器级 QA，确认真实点击链路符合预期。

## 本次目标

1. 在本地非生产环境启动项目。
2. 使用 fake Tenant A / B 和本地测试库执行按钮级浏览器 QA。
3. 覆盖 Drawer、RepairTask Draft、确认弹窗、取消、确认、success、duplicate、permission error、Content Backlog 可见性、Tenant B 隔离和敏感字段扫描。
4. 新增 `docs/qa/repair-task-button-browser-qa-record.md`。
5. 同步产品、架构、Loop 和 handoff 文档。
6. 创建 PR，不自动合并。

## 修改范围

- `docs/qa/repair-task-button-browser-qa-record.md`
- `docs/product/evidence-led-geo-monitor-v1.1.md`
- `docs/architecture/repair-task-create-safety-design.md`
- `docs/loops/evidence-led-geo-loop.md`
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
- 不使用真实客户数据、真实 raw AI response、手机号、微信号、邮箱、token 或 cookie。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不自动部署。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] PR #19 已进入 main。
- [x] `.env.local` 被 git ignore。
- [x] `DATABASE_URL` host 为 `localhost`。
- [x] 本地 Browser QA 使用 fake Tenant A / Tenant B。
- [x] Drawer 可打开。
- [x] RepairTask Draft 可见。
- [x] 打开 Drawer 不直接写库。
- [x] 点击“加入修复任务池”先出现确认弹窗。
- [x] 点击取消不创建任务。
- [x] 点击确认创建成功。
- [x] 成功后显示“已加入修复任务池。”。
- [x] 重复创建返回 duplicate，不重复写库。
- [x] duplicate 显示“该修复任务已存在，未重复创建。”。
- [x] 数据不足 / 中置信推断文案仍提示系统推断。
- [x] 切换到 Tenant B fake query 后状态不串。
- [x] permission error 不展示 raw error、stack 或 Prisma 错误。
- [x] Content Backlog 中能看到 Tenant A 新任务。
- [x] Tenant B 看不到 Tenant A 任务。
- [x] 任务内容不包含 raw response / prompt / token / secret / cookie。
- [x] Button Browser QA 记录 15 pass / 0 fail / 0 blocked。
- [x] `pnpm test:unit` 通过，19 个文件 / 94 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [x] PR 已创建。
- [x] `AI_TASKS/handoff.md` 已更新为最终 PR 状态。

## 本地限制

- `NODE_ENV=development` 下 `src/proxy.ts` 会绕过 Clerk route protection。
- dashboard 侧栏在 development 下显示固定 `D`，不展示 Clerk `UserButton`。
- 本轮 Tenant B 切换通过 fake DB 的 dev fallback 模拟，不等同于 staging 的真实 Clerk 账号切换。
- 下一轮若进入 staging 检查，必须用 Clerk 测试账号 A / B 复测登录、退出和 tenant 隔离。

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

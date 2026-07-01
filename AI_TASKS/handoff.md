# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | RepairTask Button Browser QA：Evidence Detail Drawer 单条按钮浏览器级 QA |
| 执行分支 | `codex/repair-task-button-browser-qa` |
| 状态 | PR #20 已创建，等待人工审查与合并确认 |
| GitHub 入口 | PR #20：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/20](https://github.com/qixin-portfolio/geo-monitor-saas/pull/20) |
| 上一轮依赖 | PR #19 已合并到远端 main，单条按钮已接入 |
| 实现 commit | `a23c05184c888a977c186a86c027bc1328d614f9` |
| 当前 head commit | 以 PR #20 页面为准 |
| QA 环境 | `localhost:5432` 本地测试库 `geo_monitor` |
| QA 结果 | 15 pass / 0 fail / 0 blocked |
| 是否使用真实客户数据 | 否 |

## 本轮交接

### 修改文件

- `docs/qa/repair-task-button-browser-qa-record.md`：新增按钮级浏览器 QA 记录，覆盖 15 条用例和本地 dev 限制。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：记录 PR #19 后的本地按钮 QA 结果和 staging 前置复测建议。
- `docs/architecture/repair-task-create-safety-design.md`：补充按钮浏览器 QA 结果、安全边界和本地限制。
- `docs/loops/evidence-led-geo-loop.md`：将 Button Browser QA 纳入 Evidence-led GEO Loop 的输出和验收。
- `AI_TASKS/current.md`：记录本轮任务、边界、验收和限制。
- `AI_TASKS/handoff.md`：记录本轮交接。

### QA 执行摘要

- 本地 `DATABASE_URL` host 为 `localhost`，未打印完整连接串。
- 使用 fake Tenant A / Tenant B、fake Query / QueryRun / QueryRunAnalysis。
- 打开 Evidence Detail Drawer 不直接写库。
- 点击“加入修复任务池”先出现确认弹窗。
- 点击取消不创建任务。
- 点击确认创建单条 `GeoContentTask` 并显示“已加入修复任务池。”。
- 重复创建返回 duplicate，不重复写库。
- permission error 显示“当前账号无权创建该任务。”，不展示 stack、Prisma 错误或 raw server error。
- Content Backlog 中 Tenant A 可见新任务。
- Tenant B 隔离显示不包含 Tenant A 任务。
- 创建任务扫描未发现 raw response、prompt、token、secret、cookie、authorization 或数据库连接串模式。

### 安全边界

- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不提交 `.env.local`。
- 不新增 public API route。
- 不新增新的写库路径。
- 不修改 `createEvidenceRepairTask` server action。
- 不修改 validator。
- 不提交 seed 脚本、payload 文件或仓库外 QA runner。
- 不使用真实客户数据。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不自动部署。

### 本地限制

- 本轮是 `NODE_ENV=development` 本地 QA，`src/proxy.ts` 会绕过 Clerk route protection。
- dashboard 侧栏在 development 下显示固定 `D`，不展示 Clerk `UserButton`。
- Tenant B 切换通过 fake DB 的 dev fallback 模拟，不等同于 staging 真实 Clerk 账号切换。
- 下一轮如进入 staging 检查，必须使用 Clerk 测试账号 A / B 复测登录、退出和 tenant 隔离。

### 验证记录

- `pnpm test:unit`：通过，19 个文件 / 94 个测试。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。

### 风险与注意事项

- 幂等仍不是 DB unique constraint。
- 本轮确认的是本地非生产按钮链路，不是 staging / production 验证。
- staging 前仍需 Human Gate。
- 后续不应直接进入批量创建、无人确认执行或生产 rollout。

### 下一步建议

1. 等待 ChatGPT / 用户审查 PR #20，不自动合并。
2. 人工审查 PR 后，再决定是否进入小范围 staging 发布检查。

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

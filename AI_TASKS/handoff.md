# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | Minimal RepairTask Server Action：最小安全修复任务创建能力 |
| 执行分支 | `codex/minimal-repair-task-action` |
| 状态 | 实现与验证已完成，等待提交并创建 PR |
| GitHub 入口 | PR 待创建 |
| 上一轮依赖 | PR #14 已合并到远端 main |
| 实现 commit | 待提交 |

## 本轮交接

### 修改文件

- `src/app/dashboard/content-backlog/actions/create-evidence-repair-task.ts`：新增最小 server action / server-only function，验证 tenant、payload、query/run/analysis 归属和幂等后，只创建单条 `GeoContentTask`。
- `src/app/dashboard/content-backlog/actions/create-evidence-repair-task.test.ts`：覆盖未登录、非法 draft、非法 priority、raw response、跨 tenant query/run、合法创建和重复创建。
- `docs/architecture/repair-task-create-safety-design.md`：记录最小 server action 的当前边界、权限校验和保守幂等策略。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：记录本轮只新增 server 端能力，不接 UI 按钮。
- `docs/architecture/evidence-chain-data-model.md`：记录 `GeoContentTask` 字段复用、写入字段和幂等限制。
- `docs/loops/evidence-led-geo-loop.md`：把最小 server action 纳入 Loop 过程、输出和验收。
- `AI_TASKS/current.md`：记录本轮任务。
- `AI_TASKS/handoff.md`：记录本轮交接。

### 验证记录

- `pnpm exec vitest run src/app/dashboard/content-backlog/actions/create-evidence-repair-task.test.ts`：通过，1 个文件 / 7 个测试。
- `pnpm typecheck`：通过。
- `pnpm test:unit`：通过，19 个文件 / 94 个测试。
- `pnpm build`：通过，包含 `/dashboard/content-backlog` 和 `/dashboard/evidence-map` 路由。
- `git diff --check`：通过。

### 风险与注意事项

- 本轮不修改 Prisma schema。
- 本轮不生成 migration。
- 本轮不运行生产迁移。
- 本轮不修改 `.env`、部署配置、Clerk、Stripe、Billing、proxy。
- 本轮不自动部署。
- 本轮不接前端真实按钮。
- 本轮不做批量创建。
- 本轮不做自动修复。
- 本轮不做 Lead Attribution、PDF、全平台接入。
- 本轮新增 server 端单条写库能力：只写入当前 tenant scoped `GeoContentTask`。
- `getOrCreateTenant()` 是当前项目既有 tenant resolver；生产路径依赖 Clerk userId，开发环境仍保留项目既有 dev fallback。
- 当前幂等不新增 schema，用 `tenantId`、`sourceQuery`、`type`、unfinished status 加 `evidenceJson.repairTask` 字段做保守去重。
- 由于 `GeoContentTask` 没有 `queryId` 或 `idempotencyKey` 字段，当前用 server 端确认后的 `sourceQuery` 作为 query identity 的保守替代。

### 下一步建议

1. 完成 `pnpm test:unit`、`pnpm build` 和 `git diff --check`。
2. 创建 PR 后等待人工审查。
3. 下一轮如接入 Evidence Detail Drawer / Evidence Map 真实按钮，必须再次进入 Human Gate。
4. UI 按钮只建议做单条创建，不做批量创建或自动修复。

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

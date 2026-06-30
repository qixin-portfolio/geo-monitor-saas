# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | RepairTask Create Button Safety Design：创建单条修复任务能力安全设计 |
| 执行分支 | `codex/repair-task-create-design` |
| 状态 | 验证已通过，等待提交和创建 PR |
| GitHub 入口 | PR 待创建 |
| 上一轮依赖 | PR #12 已合并到远端 main |
| 实现 commit | 待提交 |

## 本轮交接

### 修改文件

- `docs/architecture/repair-task-create-safety-design.md`：新增创建单条修复任务能力的安全设计，覆盖数据流、权限、字段校验、幂等、审计、UI 文案和不做事项。
- `src/lib/evidence/validate-repair-task-draft.ts`：新增纯函数校验 Content Backlog draft，限制白名单、长度、raw response 和敏感字段。
- `src/lib/evidence/validate-repair-task-draft.test.ts`：覆盖正常 draft、非法 taskType、过长字段、raw response、secret-like 字段、空 query fallback、nextSteps 限制。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：记录 RepairTask 创建安全设计轮次。
- `docs/architecture/evidence-chain-data-model.md`：记录未来写入链路如何复用 `GeoContentTask` 和本轮不落库边界。
- `docs/loops/evidence-led-geo-loop.md`：把 RepairTask 创建安全设计纳入 Loop 过程、输出和验收。
- `AI_TASKS/current.md`：记录本轮任务。
- `AI_TASKS/handoff.md`：记录本轮交接。

### 验证记录

- `pnpm exec vitest run src/lib/evidence/validate-repair-task-draft.test.ts`：通过，1 个文件 / 7 个测试。
- `pnpm test:unit`：通过，18 个文件 / 82 个测试。
- `pnpm typecheck`：通过。
- `pnpm build`：通过，包含 `/dashboard/evidence-map` 和 `/dashboard/content-backlog` 路由。
- `git diff --check`：通过。

### 风险与注意事项

- 本轮不修改 Prisma schema。
- 本轮不生成 migration。
- 本轮不运行生产迁移。
- 本轮不修改 `.env`、部署配置、Clerk、Stripe、Billing、proxy。
- 本轮不自动部署。
- 本轮不接入数据库写入。
- 本轮不新增真实“加入修复任务池”按钮。
- 本轮不做 Lead Attribution、PDF、全平台接入。
- `validateRepairTaskDraft` 只是未来 server action / API 的前置纯校验，不代表已经允许生产写库。

### 下一步建议

1. 完成 `test:unit` / `typecheck` / `build` / `git diff --check` 后创建 PR。
2. 审查 PR 时重点看安全设计是否足以覆盖 tenant 越权、字段污染、敏感信息入库和重复创建。
3. 下一轮如进入最小 server action / API，需要 Human Gate 确认是否允许真实写入 `GeoContentTask`。
4. Lead Attribution 仍应另开独立 Issue，等任务池写入链路稳定后再做。

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

# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | RepairTask 接入 Content Backlog：证据缺口进入修复任务池 |
| 执行分支 | `codex/repair-task-backlog` |
| 状态 | 验证通过，待 PR 创建和人工审查 |
| GitHub 入口 | 待创建 PR |
| 上一轮依赖 | PR #7 已合并到 main |

## 本轮交接

### 修改文件

- `src/lib/evidence/map-repair-task-to-content-task.ts`：新增 RepairTask draft 到 Content Backlog draft 的纯函数映射。
- `src/lib/evidence/map-repair-task-to-content-task.test.ts`：覆盖 competitor advantage、missing evidence、weak definition、sentiment defense、new page、page update。
- `src/app/dashboard/evidence-map/page.tsx`：展示“可进入修复任务池”的只读入口和映射后的任务类型/优先级。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：说明 RepairTask Backlog 接入轮和不做 Lead Attribution。
- `docs/loops/evidence-led-geo-loop.md`：补充 Content Backlog draft 输出和停止条件。
- `docs/architecture/evidence-chain-data-model.md`：说明 RepairTask 到 GeoContentTask 的兼容映射。
- `AI_TASKS/current.md`：记录本轮任务。
- `AI_TASKS/handoff.md`：记录本轮交接。

### 验证记录

- `pnpm exec vitest run src/lib/evidence/map-repair-task-to-content-task.test.ts`：通过，1 个文件 6 个测试。
- `pnpm test:unit`：通过，15 个文件 51 个测试。
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
- 本轮不做 Lead Attribution、PDF、全平台接入。
- `mapRepairTaskToContentTask` 仅生成可被现有 Content Backlog 语义消费的 draft。
- Evidence Map 页面只读展示“可进入修复任务池”，不创建真实任务。

### 下一步建议

1. 审查本轮映射是否符合 Content Backlog 使用习惯。
2. 如果通过，再设计安全的单条 RepairTask 创建 API。
3. 做 batch 前后对比，验证页面修复后 AI 答案是否变化。
4. Lead Attribution 另开独立 Issue，等任务池稳定后再做。

---

## 历史记录

| 时间 | 任务 | 分支 / PR | 结果 | 备注 |
|------|------|-----------|------|------|
| 2026-06-29 | 初始化 AI 协作工作流 | PR #5 | 已合并 | 只改协作文档 |
| 2026-06-29 | Evidence Map MVP | PR #6 | 已合并 | 文档 + 只读页面 + 纯函数 |
| 2026-06-30 | Evidence Chain Hardening | PR #7 | 已合并 | 测试 + AnswerSource + RepairTask draft |
| 2026-06-30 | RepairTask 接入 Content Backlog | `codex/repair-task-backlog` | 进行中 | RepairTask draft 映射为 Content Backlog draft |

# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | Run Before/After Comparison：同一 query 的 AI 答案前后变化 |
| 执行分支 | `codex/run-before-after-comparison` |
| 状态 | 验证通过，待提交并创建 PR |
| GitHub 入口 | PR 待创建 |
| 上一轮依赖 | PR #8 已合并到远端 main |
| 实现 commit | 待提交 |

## 本轮交接

### 修改文件

- `src/lib/evidence/compare-evidence-runs.ts`：新增同一 query 前后两次 EvidenceMapItem 的纯函数对比。
- `src/lib/evidence/compare-evidence-runs.test.ts`：覆盖品牌 gained/lost、竞品减少、来源改善、gap 改善、无历史、无变化。
- `src/app/dashboard/evidence-map/page.tsx`：展示“答案变化趋势”和每条 query 的前后变化摘要。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：说明 Run Before/After Comparison 接入轮。
- `docs/loops/evidence-led-geo-loop.md`：补充 EvidenceRunComparison 输出和停止条件。
- `docs/architecture/evidence-chain-data-model.md`：说明 EvidenceRunComparison derived data。
- `AI_TASKS/current.md`：记录本轮任务。
- `AI_TASKS/handoff.md`：记录本轮交接。

### 验证记录

- `pnpm exec vitest run src/lib/evidence/compare-evidence-runs.test.ts`：通过，1 个文件 7 个测试。
- `pnpm test:unit`：通过，16 个文件 58 个测试。
- `pnpm typecheck`：通过。
- `pnpm build`：通过，包含 `/dashboard/evidence-map` 路由。
- `git diff --check`：通过。

### 风险与注意事项

- 本轮不修改 Prisma schema。
- 本轮不生成 migration。
- 本轮不运行生产迁移。
- 本轮不修改 `.env`、部署配置、Clerk、Stripe、Billing、proxy。
- 本轮不自动部署。
- 本轮不接入数据库写入。
- 本轮不做 Lead Attribution、PDF、全平台接入。
- 本轮不创建真实数据库 RepairTask 按钮。
- `compareEvidenceRuns` 仅生成 derived comparison，不落库。
- Evidence Map 页面只读展示前后变化，不展示完整 raw API response。

### 下一步建议

1. 用真实 monitoring 样本校准前后变化判断规则。
2. 后续再考虑安全的单条 RepairTask 创建按钮。
3. Lead Attribution 另开独立 Issue，等任务池稳定后再做。

---

## 历史记录

| 时间 | 任务 | 分支 / PR | 结果 | 备注 |
|------|------|-----------|------|------|
| 2026-06-29 | 初始化 AI 协作工作流 | PR #5 | 已合并 | 只改协作文档 |
| 2026-06-29 | Evidence Map MVP | PR #6 | 已合并 | 文档 + 只读页面 + 纯函数 |
| 2026-06-30 | Evidence Chain Hardening | PR #7 | 已合并 | 测试 + AnswerSource + RepairTask draft |
| 2026-06-30 | RepairTask 接入 Content Backlog | PR #8 | 已合并 | RepairTask draft 映射为 Content Backlog draft |
| 2026-06-30 | Run Before/After Comparison | 待创建 | 进行中 | 同一 query 最近两次 AI 答案变化对比 |

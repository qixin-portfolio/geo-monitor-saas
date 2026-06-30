# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | Evidence Confidence Label：证据链置信度标签 |
| 执行分支 | `codex/evidence-confidence-label` |
| 状态 | 验证通过，等待提交并创建 PR |
| GitHub 入口 | PR 待创建 |
| 上一轮依赖 | PR #10 已合并到远端 main |
| 实现 commit | 待提交 |

## 本轮交接

### 修改文件

- `src/lib/evidence/classify-evidence-confidence.ts`：新增置信度标签纯函数，输出 `high` / `medium` / `low`、0-100 分、原因和 warning。
- `src/lib/evidence/classify-evidence-confidence.test.ts`：覆盖 URL + 官网高置信、竞品无 URL 中置信、异常 JSON / unknown / 空 answer / 缺少 previous run 低置信、多强信号高置信。
- `src/app/dashboard/evidence-map/page.tsx`：轻量展示置信度标签、分数、原因和数据不足提示；仍然只读。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：记录 Evidence Confidence Label 接入轮。
- `docs/architecture/evidence-chain-data-model.md`：记录 `EvidenceConfidenceLabel` 概念模型和不落库边界。
- `docs/loops/evidence-led-geo-loop.md`：把置信度标签纳入 Loop 过程、输出和验收。
- `AI_TASKS/current.md`：记录本轮任务。
- `AI_TASKS/handoff.md`：记录本轮交接。

### 验证记录

- `pnpm exec vitest run src/lib/evidence/classify-evidence-confidence.test.ts`：通过，1 个文件 7 个测试。
- `pnpm test:unit`：通过，17 个文件 75 个测试。
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
- 置信度标签是系统推断解释，不代表平台官方归因。
- Evidence Map 页面仍是只读 derived data，不展示完整 raw API response。

### 下一步建议

1. 完成 `test:unit` / `typecheck` / `build` / `git diff --check` 后创建 PR。
2. 审查 PR 时重点看置信度阈值是否过度乐观。
3. 后续继续用脱敏真实 run 样本校准高 / 中 / 低阈值。
4. Lead Attribution 仍应另开独立 Issue，等任务池稳定后再做。

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

# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | Evidence Detail Drawer：证据详情抽屉 |
| 执行分支 | `codex/evidence-detail-drawer` |
| 状态 | PR 已创建，等待人工审查与合并确认 |
| GitHub 入口 | PR #12：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/12](https://github.com/qixin-portfolio/geo-monitor-saas/pull/12) |
| 上一轮依赖 | PR #11 已合并到远端 main |
| 实现 commit | `7665cd45a6b3614f1e21e8b522309bbe70cbc688` |

## 本轮交接

### 修改文件

- `src/app/dashboard/evidence-map/page.tsx`：接入每条 query 的“查看详情”入口，把已存在的 derived data 传给详情抽屉。
- `src/app/dashboard/evidence-map/evidence-detail-drawer.tsx`：新增轻量客户端详情抽屉，展示 Query 基本信息、品牌/竞品判断、来源判断、Evidence Gap、RepairTask Draft、Run Comparison 和 Confidence Label。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：记录 Evidence Detail Drawer 接入轮。
- `docs/architecture/evidence-chain-data-model.md`：记录详情抽屉作为只读 UI 投影，不新增数据模型。
- `docs/loops/evidence-led-geo-loop.md`：把详情抽屉纳入 Loop 过程、输出和验收。
- `AI_TASKS/current.md`：记录本轮任务。
- `AI_TASKS/handoff.md`：记录本轮交接。

### 验证记录

- `pnpm exec vitest run src/lib/evidence/classify-evidence-confidence.test.ts src/lib/evidence/extract-answer-sources.test.ts src/lib/evidence/extract-evidence-map.test.ts src/lib/evidence/map-evidence-gap-to-repair-task.test.ts src/lib/evidence/map-repair-task-to-content-task.test.ts src/lib/evidence/compare-evidence-runs.test.ts`：通过，6 个文件 / 48 个测试。
- `pnpm test:unit`：通过，17 个文件 / 75 个测试。
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
- 详情抽屉是系统推断解释，不代表平台官方归因。
- Evidence Map 页面仍是只读 derived data，不展示完整 raw API response。

### 下一步建议

1. 完成 `test:unit` / `typecheck` / `build` / `git diff --check` 后创建 PR。
2. 审查 PR 时重点看 drawer 是否只展示 derived data，是否误导用户把推断当事实。
3. 下一轮若考虑“创建单条修复任务”按钮，必须单独审查 tenant 校验、字段校验、幂等去重和权限。
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
| 2026-06-30 | Evidence Confidence Label | PR #11 | 已合并 | 证据链置信度标签 |

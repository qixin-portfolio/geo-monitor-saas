# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | 真实 Monitoring 样本校准：Evidence Map / AnswerSource / RepairTask / Run Comparison |
| 执行分支 | `codex/real-run-calibration` |
| 状态 | 验证通过，等待提交并创建 PR |
| GitHub 入口 | PR 待创建 |
| 上一轮依赖 | PR #9 已合并到远端 main |
| 实现 commit | 待提交 |

## 本轮交接

### 修改文件

- `src/lib/evidence/fixtures/real-run-samples.ts`：新增脱敏 real-run 样本，覆盖 citations 数组、字符串化 JSON、异常 citations、质量来源和前后变化。
- `src/lib/evidence/extract-answer-sources.ts`：增强 `citationsJson` / `sourcesJson` 容错、嵌套 sources 提取、URL 尾部标点清理、owned domain 识别。
- `src/lib/evidence/extract-answer-sources.test.ts`：使用脱敏样本覆盖 AnswerSource 提取。
- `src/lib/evidence/extract-evidence-map.ts`：增强 source type 关键词/域名线索，放宽品牌和竞品匹配，校准弱品牌定义判断。
- `src/lib/evidence/extract-evidence-map.test.ts`：使用脱敏样本覆盖品牌、竞品、来源、gap 和建议页面。
- `src/lib/evidence/map-evidence-gap-to-repair-task.ts`：校准 schema 修复触发条件，已有官网/本地列表/权威媒体时不误触发。
- `src/lib/evidence/map-evidence-gap-to-repair-task.test.ts`：补充质量来源下不触发 schema 修复的测试。
- `src/lib/evidence/compare-evidence-runs.test.ts`：补充脱敏样本的改善、无变化、恶化对比测试。
- `src/app/dashboard/evidence-map/page.tsx`：轻微文案优化，说明判断是系统推断，数据不足不是失败。
- `docs/product/evidence-led-geo-monitor-v1.1.md`：记录 Real-run Calibration 接入轮。
- `docs/architecture/evidence-chain-data-model.md`：记录脱敏样本、derived data 和暂不落库边界。
- `docs/loops/evidence-led-geo-loop.md`：把样本校准纳入 Loop 过程与验收。
- `AI_TASKS/current.md`：记录本轮任务。
- `AI_TASKS/handoff.md`：记录本轮交接。

### 验证记录

- `pnpm exec vitest run src/lib/evidence/extract-answer-sources.test.ts src/lib/evidence/extract-evidence-map.test.ts src/lib/evidence/compare-evidence-runs.test.ts src/lib/evidence/map-evidence-gap-to-repair-task.test.ts src/lib/evidence/map-repair-task-to-content-task.test.ts`：通过，5 个文件 41 个测试。
- `pnpm test:unit`：通过，16 个文件 68 个测试。
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
- 新增样本是脱敏 mock，不包含真实 secret、客户隐私或完整 raw API response。
- Evidence Map 页面仍是只读 derived data，不展示完整 raw API response。

### 下一步建议

1. 创建 PR 后由 ChatGPT 做合并前审查。
2. 后续继续追加脱敏真实 run 样本，观察 AnswerSource / Evidence Gap / Run Comparison 的误判。
3. 规则稳定后，再评估安全的单条 RepairTask 创建按钮。
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

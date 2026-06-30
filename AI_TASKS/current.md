# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

真实 Monitoring 样本校准：Evidence Map / AnswerSource / RepairTask / Run Comparison

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/10](https://github.com/qixin-portfolio/geo-monitor-saas/pull/10)
- 分支：`codex/real-run-calibration`
- 基线：远端 `main`，已包含 PR #9。
- 实现 commit：`0e8c06d11de09cae128651bb2f52b3bf94645df9`
- 当前状态：PR 已创建，等待人工审查与合并确认。

## 背景

PR #9 已进入 main，Evidence Map 已经具备 AnswerSource、RepairTask draft、Content Backlog draft 和同 query 前后变化对比。
本轮不扩展新业务闭环，而是用脱敏真实 run 样本校准启发式规则，降低误判。

## 本次目标

1. 新增脱敏 real-run samples 夹具。
2. 校准 `citationsJson` / `sourcesJson` / URL / answer text 的来源提取容错。
3. 校准 source type 分类、competitor detection、evidence gap 判断和 RepairTask 映射。
4. 用样本覆盖前后 run 改善、无变化、恶化，避免数据不足被误判为改善。
5. 轻微优化 Evidence Map 文案，说明判断是系统推断。
6. 更新产品、架构、Loop 和 handoff 文档。

## 修改范围

- `src/lib/evidence/fixtures/real-run-samples.ts`
- `src/lib/evidence/extract-answer-sources.ts`
- `src/lib/evidence/extract-answer-sources.test.ts`
- `src/lib/evidence/extract-evidence-map.ts`
- `src/lib/evidence/extract-evidence-map.test.ts`
- `src/lib/evidence/map-evidence-gap-to-repair-task.ts`
- `src/lib/evidence/map-evidence-gap-to-repair-task.test.ts`
- `src/lib/evidence/compare-evidence-runs.test.ts`
- `src/app/dashboard/evidence-map/page.tsx`
- `docs/product/evidence-led-geo-monitor-v1.1.md`
- `docs/architecture/evidence-chain-data-model.md`
- `docs/loops/evidence-led-geo-loop.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 禁止事项

- 不提交真实 API Key / Token / 账号密码。
- 不提交 `.env`、数据库连接串、账号密码。
- 不自动合并 PR。
- 不擅自修改生产部署、数据库、认证、支付配置。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不创建真实数据库 RepairTask 按钮。
- 不接数据库写入。
- 不修改 Prisma schema。
- 不生成 migration。
- 不自动部署。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] 修改范围符合任务说明。
- [x] 新增样本为脱敏 mock，不包含真实 secret、客户隐私或完整 raw API response。
- [x] 没有真实密钥或敏感信息。
- [x] 没有无关文件变更。
- [x] evidence 相关单测通过，5 个文件 41 个测试。
- [x] `pnpm test:unit` 通过，16 个文件 68 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [x] 不修改 Prisma schema。
- [x] 不生成 migration。
- [x] 不修改 env。
- [x] 不接入数据库写入。
- [x] 不自动部署。
- [x] PR 描述已更新。
- [x] `AI_TASKS/handoff.md` 已更新。

## 是否需要 Loop

- 判断：需要。
- 依据：本任务是 Evidence 规则的重复性校准，未来会持续追加脱敏样本并回归验证，具有明确验收标准和产品价值。

## 是否需要 Human Gate

- 判断：不需要额外 Human Gate。
- 原因：本轮不部署、不改生产数据库、不改认证、支付、权限或环境变量；不保存真实样本，不写 RepairTask。最终合并 PR 仍由用户决定。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

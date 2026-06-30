# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

Evidence Confidence Label：证据链置信度标签

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：待创建
- 分支：`codex/evidence-confidence-label`
- 基线：远端 `main`，已包含 PR #10。
- 当前状态：验证通过，等待提交并创建 PR。

## 背景

PR #10 已进入 main，Evidence Map / AnswerSource / RepairTask / Run Comparison 已经具备脱敏样本校准。
本轮目标是在不扩展新页面、不接数据库写入的前提下，为现有 derived data 增加置信度标签，帮助用户区分事实命中、系统推断和数据不足。

## 本次目标

1. 新增 `classifyEvidenceConfidence` 纯函数。
2. 为高 / 中 / 低置信规则补单元测试。
3. 在 `/dashboard/evidence-map` 页面轻量展示置信度标签、简短原因和数据不足提示。
4. 更新产品、架构、Loop 和 handoff 文档。

## 修改范围

- `src/lib/evidence/classify-evidence-confidence.ts`
- `src/lib/evidence/classify-evidence-confidence.test.ts`
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
- 不大改 UI。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] 修改范围符合任务说明。
- [x] `classifyEvidenceConfidence` 是纯函数，不读库、不联网、不写数据库。
- [x] 高置信 / 中置信 / 低置信测试覆盖完成。
- [x] `pnpm exec vitest run src/lib/evidence/classify-evidence-confidence.test.ts` 通过，1 个文件 7 个测试。
- [x] `pnpm test:unit` 通过，17 个文件 75 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [x] 不修改 Prisma schema。
- [x] 不生成 migration。
- [x] 不修改 env。
- [x] 不接入数据库写入。
- [x] 不自动部署。
- [ ] PR 描述已更新。
- [x] `AI_TASKS/handoff.md` 已更新。

## 是否需要 Loop

- 判断：需要。
- 依据：置信度标签会随 Evidence 规则持续校准，未来会反复用脱敏样本回归验证，具备重复性、可验收和产品价值。

## 是否需要 Human Gate

- 判断：不需要额外 Human Gate。
- 原因：本轮不部署、不改生产数据库、不改认证、支付、权限或环境变量；不保存置信度结果，不写 RepairTask。最终合并 PR 仍由用户决定。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

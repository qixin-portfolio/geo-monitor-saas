# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

Run Before/After Comparison：同一 query 的 AI 答案前后变化

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/9](https://github.com/qixin-portfolio/geo-monitor-saas/pull/9)
- 分支：`codex/run-before-after-comparison`
- 实现 commit：`a2629f0`
- 当前状态：PR 已创建，等待人工审查与合并确认。

## 背景

PR #8 已进入远端 main。Evidence Map 页面已经能把 evidence gap 派生为 RepairTask draft，并映射为 Content Backlog draft。
本轮目标是在 Evidence Map 基础上增加同一个 query 最近两次 run 的前后变化对比，用于判断页面修复任务是否让 AI 答案向好。

## 本次目标

1. 新增 `compareEvidenceRuns` 纯函数。
2. 为前后变化判断补单元测试。
3. 在 Evidence Map 页面展示“答案变化趋势 / 前后变化”。
4. 使用现有 `QueryRun` / `QueryRunAnalysis` 按同一 `queryId` 最近两次 run 做只读对比。
5. 更新产品、架构、Loop 和 handoff 文档。

## 修改范围

- `docs/product/evidence-led-geo-monitor-v1.1.md`
- `docs/loops/evidence-led-geo-loop.md`
- `docs/architecture/evidence-chain-data-model.md`
- `src/lib/evidence/compare-evidence-runs.ts`
- `src/lib/evidence/compare-evidence-runs.test.ts`
- `src/app/dashboard/evidence-map/page.tsx`
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
- 不自动部署。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] 修改范围符合任务说明。
- [x] 没有真实密钥或敏感信息。
- [x] 没有无关文件变更。
- [x] `compareEvidenceRuns` 单元测试通过，1 个文件 7 个测试。
- [x] `pnpm test:unit` 通过，16 个文件 58 个测试。
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
- 依据：本任务继续把 GEO 监测结果转为可验证的答案变化判断，具有重复性、可验收、有产品价值。

## 是否需要 Human Gate

- 判断：不需要额外 Human Gate。
- 原因：本轮不部署、不改生产数据库、不改认证、支付、权限或环境变量；不保存 EvidenceRunComparison，不写 RepairTask。最终合并 PR 仍由用户决定。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

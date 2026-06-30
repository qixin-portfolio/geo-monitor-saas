# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

RepairTask 接入 Content Backlog：证据缺口进入修复任务池

## GitHub 入口

- Issue：待填写。
- PR：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/8](https://github.com/qixin-portfolio/geo-monitor-saas/pull/8)
- 分支：`codex/repair-task-backlog`
- 实现 commit：`d87a88a`
- 当前状态：等待人工确认合并。

## 背景

Evidence Chain Hardening 已进入 main。Evidence Map 页面已经能派生 RepairTask draft。
本轮目标是把 RepairTask draft 映射到现有 Content Backlog / `GeoContentTask` 可消费的 draft，让证据缺口开始进入可执行任务池语义，但暂不写入数据库。

## 本次目标

1. 审查现有 Content Backlog / `GeoContentTask` 结构。
2. 新增 `mapRepairTaskToContentTask` 纯函数。
3. 在 Evidence Map 页面展示“可进入修复任务池”的轻量入口。
4. 不新增数据库写入按钮，不运行 migration。
5. 更新产品、架构、Loop 文档。

## 修改范围

- `docs/product/evidence-led-geo-monitor-v1.1.md`
- `docs/loops/evidence-led-geo-loop.md`
- `docs/architecture/evidence-chain-data-model.md`
- `src/lib/evidence/map-repair-task-to-content-task.ts`
- `src/lib/evidence/map-repair-task-to-content-task.test.ts`
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
- 不接真实数据写入。
- 不自动部署。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] 修改范围符合任务说明。
- [x] 没有真实密钥或敏感信息。
- [x] 没有无关文件变更。
- [x] `mapRepairTaskToContentTask` 单元测试通过，1 个文件 6 个测试。
- [x] `pnpm test:unit` 通过，15 个文件 51 个测试。
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
- 依据：本任务继续把 GEO 监测结果转为可执行修复任务，具有重复性、可验收、有产品价值。

## 是否需要 Human Gate

- 判断：不需要额外 Human Gate。
- 原因：本轮不部署、不改生产数据库、不改认证、支付、权限或环境变量；不把 RepairTask 写入数据库。最终合并 PR 仍由用户决定。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

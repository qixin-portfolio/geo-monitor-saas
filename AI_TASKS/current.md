# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

RepairTask Validator Hardening：修复任务 draft 校验器加固

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：待创建
- 分支：`codex/repair-task-validator-hardening`
- 基线：远端 `main`，已包含 PR #13。
- 实现 commit：待提交
- 当前状态：实现与验证已完成，等待提交并创建 PR。

## 背景

PR #13 已进入 main，项目已经有 `validateRepairTaskDraft` 作为未来“加入修复任务池”写库前的纯函数校验器。
审查发现上一版 sanitizer 对 `evidenceJson` / `briefJson` 的未知字段处理还不够硬，下一轮如果直接复用 sanitized draft 写入 `GeoContentTask`，可能把非白名单字段、大字段或伪装 raw response 的嵌套对象带入数据库。

## 本次目标

1. 修复 `validateRepairTaskDraft` 的白名单输出问题。
2. 明确 Content Backlog 顶层 `priority` 策略：非法值直接拒绝，不静默 fallback。
3. 补充 validator 单元测试，覆盖未知字段移除、嵌套 raw response、secret-like 字段、非法 priority 和白名单输出。
4. 更新 RepairTask 创建安全设计、产品、架构、Loop 和 handoff 文档。

## 修改范围

- `src/lib/evidence/validate-repair-task-draft.ts`
- `src/lib/evidence/validate-repair-task-draft.test.ts`
- `docs/architecture/repair-task-create-safety-design.md`
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
- 不做真实数据库写入。
- 不新增 API route 写库。
- 不新增 server action 写库。
- 不上线创建 RepairTask 按钮。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不修改 Prisma schema。
- 不生成 migration。
- 不自动部署。
- 不大改 UI。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] 修改范围符合任务说明。
- [x] `sanitizedDraft` 显式白名单输出，不通过 spread 保留未知字段。
- [x] `evidenceJson` / `briefJson` 未知字段会被移除。
- [x] 嵌套 raw response / full response 会被拒绝。
- [x] `evidenceJson` / `briefJson` 内 secret-like 字段会被拒绝。
- [x] 非法 Content Backlog priority 会返回 `valid=false`。
- [x] 合法 draft 仍能通过。
- [x] `pnpm exec vitest run src/lib/evidence/validate-repair-task-draft.test.ts` 通过，1 个文件 / 12 个测试。
- [x] `pnpm test:unit` 通过，18 个文件 / 87 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [x] 不修改 Prisma schema。
- [x] 不生成 migration。
- [x] 不修改 env。
- [x] 不接入数据库写入。
- [x] 不新增真实按钮。
- [x] 不新增 API route / server action 写库。
- [x] 不自动部署。

## 是否需要 Loop

- 判断：需要。
- 依据：RepairTask 创建能力会反复触发字段校验、tenant 校验、幂等去重和写库安全审查，属于高价值、可验收、可回滚的工程循环。

## 是否需要 Human Gate

- 判断：当前轮不需要额外 Human Gate；下一轮真实写库前必须进入 Human Gate。
- 原因：本轮只加固纯函数和文档，不写数据库、不新增按钮、不新增 API / server action。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

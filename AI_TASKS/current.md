# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

RepairTask Create Button Safety Design：创建单条修复任务能力安全设计

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：待创建。
- 分支：`codex/repair-task-create-design`
- 基线：远端 `main`，已包含 PR #12。
- 实现 commit：待提交。
- 当前状态：验证已通过，等待提交和创建 PR。

## 背景

PR #12 已进入 main，Evidence Detail Drawer 已能展示每条 query 的 RepairTask Draft 和 Content Backlog draft。
下一步如果要让用户点击“加入修复任务池”，就会从只读 derived data 进入数据库写入边界。本轮只做安全设计和纯校验基建，不上线真实按钮。

## 本次目标

1. 审查现有 Content Backlog / GeoContentTask / tenant / API 边界。
2. 新增 `docs/architecture/repair-task-create-safety-design.md`。
3. 新增 `validateRepairTaskDraft` 纯函数和单元测试，沉淀字段白名单、长度限制和敏感字段拒绝规则。
4. 更新产品、架构、Loop 和 handoff 文档。

## 修改范围

- `docs/architecture/repair-task-create-safety-design.md`
- `src/lib/evidence/validate-repair-task-draft.ts`
- `src/lib/evidence/validate-repair-task-draft.test.ts`
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
- [x] 安全设计文档覆盖当前状态、未来数据流、权限校验、字段校验、幂等去重、审计字段、UI 文案和不做事项。
- [x] `validateRepairTaskDraft` 是纯函数，不读库、不联网、不依赖浏览器。
- [x] `validateRepairTaskDraft` 单元测试覆盖正常 draft、非法 taskType、过长字段、raw response、secret-like 字段、空 query fallback、nextSteps 限制。
- [x] `pnpm exec vitest run src/lib/evidence/validate-repair-task-draft.test.ts` 通过，1 个文件 / 7 个测试。
- [x] `pnpm test:unit` 通过，18 个文件 / 82 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [x] 不修改 Prisma schema。
- [x] 不生成 migration。
- [x] 不修改 env。
- [x] 不接入数据库写入。
- [x] 不新增真实按钮。
- [x] 不自动部署。
- [ ] PR 描述已更新。
- [ ] `AI_TASKS/handoff.md` 已更新。

## 是否需要 Loop

- 判断：需要。
- 依据：RepairTask 创建能力会反复触发数据库写入、权限校验、字段校验和幂等去重，属于高价值、可验收、需要长期沉淀的工程循环。

## 是否需要 Human Gate

- 判断：需要在下一轮真实写库前进入 Human Gate。
- 原因：本轮不写数据库、不上线按钮，因此不需要额外确认；但下一轮如果实现 server action / API 并写入 `GeoContentTask`，必须由用户确认后再继续。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

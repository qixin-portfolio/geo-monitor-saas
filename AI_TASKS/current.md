# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

Evidence Detail Drawer：证据详情抽屉

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：待创建。
- 分支：`codex/evidence-detail-drawer`
- 基线：远端 `main`，已包含 PR #11。
- 实现 commit：待提交。
- 当前状态：验证已通过，等待提交和创建 PR。

## 背景

PR #11 已进入 main，Evidence Map 已具备 Evidence Map / AnswerSource / RepairTask / Run Comparison / Confidence Label 等 derived data。
本轮目标是在不新增数据库写入、不大改 UI 的前提下，为每条 query 增加一个轻量详情抽屉，让用户能看到系统为什么给出当前判断。

## 本次目标

1. 在 `/dashboard/evidence-map` 为每条 query 增加“查看详情”入口。
2. 展示 Query 基本信息、品牌/竞品判断、来源判断、Evidence Gap、RepairTask Draft、Run Comparison 和 Confidence Label。
3. 明确标注这些内容是系统推断和 derived data，不代表平台官方归因。
4. 更新产品、架构、Loop 和 handoff 文档。

## 修改范围

- `src/app/dashboard/evidence-map/page.tsx`
- `src/app/dashboard/evidence-map/evidence-detail-drawer.tsx`
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
- [x] Evidence Detail Drawer 只读展示，不读写数据库、不调用外部 API。
- [x] 页面不展示完整 raw API response。
- [x] 页面不展示 secret、token、数据库连接串或客户隐私字段。
- [x] 空数据、无历史 run、字段缺失时页面不崩。
- [x] evidence 单文件组测试通过，6 个文件 / 48 个测试。
- [x] `pnpm test:unit` 通过，17 个文件 / 75 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [x] 不修改 Prisma schema。
- [x] 不生成 migration。
- [x] 不修改 env。
- [x] 不接入数据库写入。
- [x] 不自动部署。
- [ ] PR 描述已更新。
- [ ] `AI_TASKS/handoff.md` 已更新。

## 是否需要 Loop

- 判断：需要。
- 依据：Evidence Detail Drawer 是证据链工作流的解释层，未来会随着 Evidence 规则、真实样本和 RepairTask 接入持续迭代，具备重复性、可验收和产品价值。

## 是否需要 Human Gate

- 判断：不需要额外 Human Gate。
- 原因：本轮不部署、不改生产数据库、不改认证、支付、权限或环境变量；不保存详情结果，不写 RepairTask。最终合并 PR 仍由用户决定。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

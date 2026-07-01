# 当前任务单模板

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

Evidence Detail Drawer Add Single RepairTask Button：接入单条“加入修复任务池”按钮

## GitHub 入口

- Issue：由本轮 PR 承载任务边界与交付物，当前 Issue 编号待补录。
- PR：[https://github.com/qixin-portfolio/geo-monitor-saas/pull/19](https://github.com/qixin-portfolio/geo-monitor-saas/pull/19)
- 分支：`codex/repair-task-single-button`
- 基线：远端 `main`，已包含 PR #18。
- 实现 commit：`e3dd998cf2bbdf8f86d854126d7ba57a46cf3f24`
- 当前 head commit：以 PR #19 页面为准。
- 当前状态：PR 已创建，等待人工审查与合并确认。

## 背景

PR #18 已合并到 main，并记录 `createEvidenceRepairTask` server action 在本地非生产环境完成 Manual QA：

- 15 pass / 0 fail / 0 blocked。
- QA 环境为 `localhost:5432` 本地测试库。
- 未使用真实客户数据、真实 raw AI response、手机号、微信号、邮箱、token 或 cookie。

本轮在 Evidence Detail Drawer 中接入单条“加入修复任务池”按钮，调用已通过 Manual QA 的 server action。

## 本次目标

1. 在 RepairTask Draft 区域新增单条“加入修复任务池”按钮。
2. 点击按钮后先展示确认弹窗，不直接写库。
3. 用户确认后调用 `createEvidenceRepairTask`。
4. 前端只传最小 draft、`queryId`、`queryRunId`、`analysisId`。
5. 不传 `tenantId`、raw answer、完整 AI response、token、cookie、secret 或未知字段。
6. 处理 success / duplicate / validation / permission / unknown error 安全提示。
7. 更新产品、架构、数据模型、Loop 和 handoff 文档。

## 修改范围

- `src/app/dashboard/evidence-map/evidence-detail-drawer.tsx`
- `src/app/dashboard/evidence-map/page.tsx`
- `docs/architecture/repair-task-create-safety-design.md`
- `docs/product/evidence-led-geo-monitor-v1.1.md`
- `docs/architecture/evidence-chain-data-model.md`
- `docs/loops/evidence-led-geo-loop.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 禁止事项

- 不修改 `.env`。
- 不修改 Prisma schema。
- 不生成 migration。
- 不新增 public API route。
- 不新增新的 server action 写库逻辑。
- 不新增新的写库路径。
- 不传或信任 client `tenantId`。
- 不传 raw answer、完整 AI response、token、cookie、secret。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不做全平台接入。
- 不自动部署。
- 不大改 UI。
- 不使用 `git add .`、`git reset --hard`、`git clean`、force push。

## 验收标准

- [x] PR #18 已进入 main。
- [x] Evidence Detail Drawer 显示单条“加入修复任务池”按钮。
- [x] 点击按钮先显示确认弹窗。
- [x] 确认弹窗文案说明系统推断，并非第三方平台确认的来源结论。
- [x] 用户确认后才调用 `createEvidenceRepairTask`。
- [x] 前端不传 `tenantId`。
- [x] 前端只传最小安全 payload。
- [x] success 显示“已加入修复任务池。”。
- [x] duplicate 显示“该修复任务已存在，未重复创建。”。
- [x] validation error 显示“当前任务信息不足，暂时无法加入修复任务池。”。
- [x] permission / tenant error 显示“当前账号无权创建该任务。”。
- [x] unknown error 显示“暂时无法创建任务，请稍后重试。”。
- [x] 不展示原始 error stack、raw API response 或数据库错误。
- [x] 不新增 public API route。
- [x] 不新增新的写库路径。
- [x] 不修改 Prisma schema。
- [x] 不生成 migration。
- [x] 不修改 env。
- [x] `pnpm test:unit` 通过，19 个文件 / 94 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [x] PR 描述已更新。
- [x] `AI_TASKS/handoff.md` 已更新。

## 是否需要 Loop

- 判断：需要。
- 依据：本轮把已通过 Manual QA 的 server action 暴露为用户主动触发的 UI 写库入口，必须可验证、可停止、可追踪。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮只创建 PR，不自动合并；按钮接入后仍需要审查和后续按钮级浏览器 QA。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

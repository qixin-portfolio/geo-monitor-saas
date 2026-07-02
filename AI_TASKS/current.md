# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 开分支执行。

---

## 任务名称

RepairTask 单条按钮链路阶段收口：AI_TASKS 状态同步

## GitHub 入口

- PR：待创建
- 分支：`codex/sync-ai-tasks-after-pr23`
- 基线：远端 `main`
- 当前 main：`6fc9cc56b3ac1654670464286cdd37c270e9f989`
- 当前状态：RepairTask 单条按钮链路工程阶段已完成；本轮只同步 AI_TASKS 状态。

## 阶段结论

RepairTask 单条“加入修复任务池”按钮链路工程阶段可以标记完成。

已完成：

- server action 已 QA。
- 单条按钮已接入 Evidence Detail Drawer。
- 本地 Browser QA：15 pass / 0 fail / 0 blocked。
- Staging QA：19 pass / 0 fail / 0 blocked。
- PR #21 已合并：Staging RepairTask Button QA Record。
- PR #22 已合并：Production Release Gate。
- PR #23 已合并：Production Smoke Test Readiness Check。
- Production Release Gate 已建立。
- Production Smoke Test Readiness Check 已建立。
- 当前 open PR 只有 #3，且与 RepairTask 单条按钮链路无关。

## 当前产品能力边界

当前只完成“单条、用户确认、可追踪”的修复任务加入链路。

仍禁止：

- 直接 production rollout。
- 批量创建。
- 无人确认执行。
- 全租户开放。
- Lead Attribution。
- PDF。
- 新增写库路径。
- 新增 public API。
- 绕过确认弹窗。
- 把系统推断说成第三方平台确认结论。

## 下一阶段方向

下一阶段不是 production rollout，也不是批量自动化。

下一阶段应进入：“证据化修复工作台”设计。

阶段 2 目标：

- RepairTask 风险等级：绿 / 黄 / 红。
- 修复任务类型：FAQ、案例页、资质页、服务页、Schema、对比页。
- 每条任务绑定证据依据。
- 修复前后复测。
- 生成老板看得懂的 GEO 修复报告。

## 本轮目标

1. 同步 `AI_TASKS/current.md`。
2. 同步 `AI_TASKS/handoff.md`。
3. 移除“PR #23 已创建，等待人工审查与合并确认”等过时状态。
4. 不进入下一阶段功能开发。
5. 创建 docs-only PR，不自动合并。

## 修改范围

- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 禁止事项

- 不修改 `src`。
- 不修改 Prisma schema。
- 不生成 migration。
- 不修改 env。
- 不新增 public API route。
- 不新增新的写库路径。
- 不部署 production。
- 不运行 production DB。
- 不点击生产按钮。
- 不使用真实客户数据。
- 不改 UI。
- 不改 server action。
- 不提交 `.env.local`、seed、payload 或临时脚本。
- 不做批量创建。
- 不做无人确认执行。
- 不做 Lead Attribution。
- 不做 PDF。
- 不进入全租户开放。
- 不启动“证据化修复工作台”功能开发。

## 验收标准

- [x] `AI_TASKS/current.md` 记录 RepairTask 单条按钮链路阶段完成。
- [x] `AI_TASKS/handoff.md` 记录 RepairTask 单条按钮链路阶段完成。
- [x] 文档明确当前只完成“单条、用户确认、可追踪”的修复任务加入链路。
- [x] 文档明确仍禁止 production rollout、批量创建、无人确认执行、全租户开放、Lead Attribution、PDF、新写库路径和 public API。
- [x] 文档明确下一阶段方向是“证据化修复工作台”设计。
- [x] 文档明确下一阶段不是 production rollout，也不是批量自动化。
- [x] `pnpm test:unit` 通过，19 个文件 / 94 个测试。
- [x] `pnpm typecheck` 通过。
- [x] `pnpm build` 通过。
- [x] `git diff --check` 通过。
- [ ] PR 已创建。

## 是否需要 Loop

- 判断：需要。
- 依据：这是 RepairTask 单条按钮链路的阶段收口状态同步，涉及 Human Gate 和下一阶段方向，必须可追踪。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮只同步状态，不进入 production rollout，不启动下一阶段功能开发；后续方向必须由人工确认。

## 交付格式

1. 修改文件
2. 修改说明
3. 自测命令
4. 自测结果
5. 风险
6. 下一步建议

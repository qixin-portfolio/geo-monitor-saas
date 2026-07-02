# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。
> 复杂任务应优先记录到 GitHub Issue，再由 Codex 基于 Issue 或明确本地指令开分支执行。

---

## 任务名称

新增 GEOFlow-inspired Content Execution Layer 产品设计文档

## GitHub 入口

- 分支：`codex/geoflow-inspired-execution-layer-v0.1`
- PR：[#30](https://github.com/qixin-portfolio/geo-monitor-saas/pull/30)
- 基线：远端 `main`
- 当前 main：`dfd9c53dc1be2e710e4b80c1472cf6b1ea7a7564`
- 新 worktree：`/private/tmp/geo-monitor-geoflow-execution-layer`

## 背景

GEO Monitor 当前主线已经具备 RepairTask 单条加入修复任务池、证据化修复工作台、Retest Plan、RepairTask 详情页、tenant-scoped detail query 等能力。

参考对象为开源项目 GEOFlow。产品判断：

- GEOFlow 更像“GEO 内容生产 + 多站点分发系统”。
- GEO Monitor 更像“AI 搜索可见度监测 + 证据化修复 + 复测报告系统”。

本轮只做产品路线文档，明确 GEO Monitor 可以借鉴什么、暂时不做什么。

## 本轮目标

新增：

- `docs/product/geoflow-inspired-content-execution-layer-v0.1.md`

文档需要明确：

1. GEO Monitor 与 GEOFlow 的产品边界。
2. Evidence Asset Library。
3. GEO Infrastructure Checklist。
4. Content Execution Layer。
5. 发布渠道适配器。
6. Agent 安全边界。
7. Job / Revision / Event Log。
8. 老板报告与健康度。
9. 暂时不要做的事情。
10. 推荐路线图。
11. 对当前 Stage 2.4 的影响。

## 修改范围

允许修改：

- `docs/product/geoflow-inspired-content-execution-layer-v0.1.md`
- `AI_TASKS/current.md`
- `AI_TASKS/handoff.md`

## 禁止事项

- 不修改 `src`。
- 不修改 `prisma/schema.prisma`。
- 不新增 migration。
- 不修改 env。
- 不新增 public API route。
- 不新增 server action。
- 不新增写库路径。
- 不引入 GEOFlow 代码。
- 不添加 submodule。
- 不添加 package dependency。
- 不接 WordPress。
- 不接 HTTP API 发布。
- 不做自动发布。
- 不做多站点分发。
- 不做外部 AI 调用。
- 不做真实复测。
- 不生成 PDF。
- 不做 production rollout。
- 不连接 production DB。
- 不提交 `.env.local`、seed、payload 或临时 runner。
- 不使用真实客户数据。
- 不打印 secret。

## 当前状态

- [x] 原脏工作区已确认，未处理、未 stash、未 reset、未 clean。
- [x] 已创建独立 worktree：`/private/tmp/geo-monitor-geoflow-execution-layer`。
- [x] 本地 `main` pull 因与 `origin/main` 分叉失败；已改为从最新 `origin/main` 创建任务分支。
- [x] 已阅读 GEOFlow README、分发 Agent 示例、统一分发方案和相关 grep 线索。
- [x] 已新增产品路线文档。
- [x] 已更新 AI_TASKS 状态。
- [x] 运行 `pnpm test:unit`。
- [x] 运行 `pnpm typecheck`。
- [x] 运行 `pnpm build`。
- [x] 运行 `git diff --check`。
- [x] 提交 commit。
- [x] 创建 PR。

## 验收标准

- 文档结构完整覆盖 12 个章节。
- 本轮只修改允许的 3 个文件。
- 不修改 `src` / schema / migration / env。
- 不新增 public API route / server action / 写库路径。
- 不引入 GEOFlow 代码、submodule 或 dependency。
- 不连接 production，不调用外部 AI，不做发布渠道接入。
- `pnpm test:unit`、`pnpm typecheck`、`pnpm build`、`git diff --check` 有明确结果。
- 创建 PR，不自动合并。

## 验证结果

- `pnpm install --frozen-lockfile`：通过；仅安装本地依赖，未修改依赖清单。
- `pnpm test:unit`：通过，20 个测试文件、123 个测试。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。

## 是否需要 Human Gate

- 判断：需要。
- 原因：本轮是产品路线文档，会影响后续 Evidence Asset Library、GEO Infrastructure Checklist、Content Execution Layer 的设计方向；PR 合并前需要人工审查。

## 交付格式

1. 新 worktree 路径
2. 当前 main commit
3. PR 链接
4. head commit
5. 修改文件列表
6. 是否 docs-only
7. 是否修改 src
8. 是否修改 schema / migration / env
9. 是否新增 public API route
10. 是否新增写库路径
11. 是否引入 GEOFlow 代码或依赖
12. 是否连接 production
13. `pnpm test:unit` 结果
14. `pnpm typecheck` 结果
15. `pnpm build` 结果
16. `git diff --check` 结果
17. 是否可以进入人工审查

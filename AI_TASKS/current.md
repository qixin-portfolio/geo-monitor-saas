# 当前任务单

> 本文件由 Codex 维护。每次任务开始前先读取，并在明确任务后按需更新。

---

## 任务名称

修复 manual monitoring run fire-and-forget 导致 batch 卡 RUNNING

## 分支

- `codex/fix-manual-monitoring-run-await`
- PR：[#31](https://github.com/qixin-portfolio/geo-monitor-saas/pull/31)

## 背景

Dashboard 出现 `OpenAI / 3 个问题 / 0 成功 / 0 失败 / RUNNING`，诊断结论指向手动监测接口创建 `RunBatch` 后 fire-and-forget 调用 `runTenantBatch`。在 Next / serverless 请求生命周期中，请求返回后后台任务可能被挂起，导致 batch 已写 `RUNNING` 和 `queryCount`，但 QueryRun 与 RunBatch 没有 finalize。

## 本轮目标

- `POST /api/monitoring/run` 不再 fire-and-forget。
- 手动监测 route `await runTenantBatch`，返回终态批次统计。
- 前端 RunNowButton 正确识别 awaited route 返回的终态。
- OpenAI provider 使用 `MONITORING_TIMEOUT_MS` 和 `MONITORING_MAX_TOKENS`。
- 补充最小测试，覆盖 route 等待 runner、runner 抛错 batch 不留 RUNNING、OpenAI timeout / max token 参数。
- 补充 overlap / runner error 终态兜底，避免本次创建的 batch 卡 `PENDING`。

## 禁止事项

- 不改 schema / migration / env。
- 不新增 public API route。
- 不新增新的写库路径。
- 不重置数据库。
- 不运行 destructive SQL。
- 不部署 production。
- 不连接 production DB。
- 不使用真实客户数据。
- 不提交 `.env.local`、seed、payload 或临时 runner。
- 不打印 `OPENAI_API_KEY` / `DATABASE_URL` / Clerk Secret。
- 不调用真实 OpenAI API。
- 不做批量监测。
- 不改 PR #29 / PR #30。

## 当前实现

- [x] 审计手动 run 链路。
- [x] 将 manual route 改为 awaited execution。
- [x] route catch 将本次 batch 标为 `FAILED`，返回安全错误。
- [x] RunNowButton 支持直接返回的 `SUCCESS` / `PARTIAL_FAILURE` / `FAILED`。
- [x] OpenAI provider 接入 timeout / max token 配置。
- [x] 增加 route unit test。
- [x] 增加 OpenAI provider unit test。
- [x] 补充 missing key integration count 断言。
- [x] 运行 `pnpm test:unit`。
- [x] 运行 `pnpm typecheck`。
- [x] 运行 `pnpm build`。
- [x] 运行 `git diff --check`。
- [x] 创建 PR，等待人工审查。
- [x] 按 PR 审查补丁：`skipped-overlap` 会把本次创建的 batch 标为 `FAILED` 终态。
- [x] 按 PR 审查补丁：runner error 兜底会补齐 `failureCount`。
- [x] 按 PR 审查补丁：成功后 final read 失败不会覆盖已完成 batch。

## 验证结果

- `pnpm test:unit`：通过，22 test files / 128 tests。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。

## API smoke test

本轮未授权真实 API 调用；除非后续明确提供非生产 DB 与非生产 OpenAI key，并授权只跑 1 个 query，否则 API smoke test 标记为 blocked。

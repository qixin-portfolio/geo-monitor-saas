# AI 任务交接日志

> 用途：让 ChatGPT、Codex 和用户通过仓库文件接力，不依赖聊天长报告。
> 维护方式：每次任务结束后由 Codex 更新；重要结论同步到 PR 描述或 PR 评论。

---

## 当前状态

| 字段 | 内容 |
|------|------|
| 当前任务 | MonitoringJob queue + cron worker v1 |
| 执行分支 | `codex/monitoring-job-queue-v1` |
| 状态 | PR 已创建，等待人工审查 |
| 当前 base | `origin/main` `890eeb34680f3034f426d1160a88f02a066a9a34` |
| PR | [#32](https://github.com/qixin-portfolio/geo-monitor-saas/pull/32) |
| 本轮性质 | PR A：基础 DB 队列 + cron worker |
| 是否使用真实客户数据 | 否 |

## 阶段结论

本轮只做 PR A：把 manual monitoring run 从 request 内同步执行改为 DB queue 入队，由 cron worker 后续消费。

本轮不包含 lock / retry / ExecutionTrace / UI。后续应单独拆 PR B 和 PR C。

## 本轮目标

- 新增基础 `MonitoringJob` model。
- 新增基础 queue migration。
- `POST /api/monitoring/run` 只创建 `RunBatch(PENDING)` 和 `MonitoringJob(PENDING)`。
- route 立即返回 `batchId` / `jobId`。
- 新增 cron worker `runMonitoringJobs`。
- 新增 cron API `/api/cron/run-monitoring`。
- 补充 queue / cron / worker 基础单测。

## 明确不包含

- 不包含 `lockedAt` / `lockedBy`。
- 不包含 `retryCount` / `maxRetry` / `lastError` / `nextRetryAt`。
- 不包含 retry / backoff。
- 不包含 ExecutionTrace。
- 不包含 trace API。
- 不包含 RepairTask 详情页 Trace UI。
- 不包含 `src/app/page.tsx`。
- 不包含 `docs/geo-monitor/*`。
- 不包含 `docs/hengjing-transparent-site/*`。

## 安全边界

- 未连接 production DB。
- 未部署 production。
- 未读取 / 打印 / 保存 secret。
- 未运行 migration reset。
- 未运行 db push。
- 未删除当前脏工作区文件。
- 未使用 `git add .`。
- 未自动合并。

## 当前修改文件

- `prisma/schema.prisma`：新增基础 `MonitoringJob` model 与关系。
- `prisma/migrations/20260703010000_add_monitoring_job_queue/migration.sql`：新增基础 `MonitoringJob` 表、索引和外键。
- `src/app/api/monitoring/run/route.ts`：manual run 改为只入队，并用事务同时创建 batch/job，避免半截 PENDING batch。
- `src/app/api/monitoring/run/route.test.ts`：覆盖 active batch 返回和入队。
- `src/app/api/cron/run-monitoring/route.ts`：新增 cron worker API。
- `src/app/api/cron/run-monitoring/route.test.ts`：覆盖 cron secret 鉴权和 worker 调用。
- `src/cron/run-monitoring-jobs.ts`：新增基础 worker。
- `src/cron/run-monitoring-jobs.test.ts`：覆盖基础 worker 成功、失败、claim lost、tenant-scoped fallback。
- `AI_TASKS/handoff.md`：同步本轮交接状态。

## 验证记录

- `pnpm prisma:generate`：通过。
- `pnpm test:unit`：通过，24 files / 133 tests。
- `pnpm typecheck`：通过。
- `pnpm build`：通过。
- `git diff --check`：通过。

## 风险与注意事项

- PR A 没有 `lockedAt`/`lockedBy`，只靠 `status: PENDING -> RUNNING` 做基础 claim，完整并发锁应在 PR B 补。
- PR A 没有 retry，runner 失败会把 job 标为 `FAILED`，retry/backoff 应在 PR B 补。
- 尚未在明确非生产 DB 上运行 migration。
- 尚未做 1-query API smoke test。

## 下一步建议

1. 人工审查 PR A 文件范围，确认没有混入首页、docs、lock/retry/trace/UI。
2. 如通过，创建 PR A。
3. 等明确非生产 DB 后，再运行 migration deploy 和最小 smoke test。

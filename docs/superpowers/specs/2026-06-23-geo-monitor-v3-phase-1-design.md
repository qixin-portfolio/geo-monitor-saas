# GEO Monitor V3 Phase 1 Design

Date: 2026-06-23
Status: Approved in conversation, pending written-spec review
Owner: Codex + Qixin

## 1. Context

The current product is a SaaS shell for GEO monitoring:

- multi-tenant tenant/user structure already exists
- Clerk auth exists
- Stripe plans and query limits exist
- dashboard exists
- GEO monitoring is still V1 manual entry

Today the core workflow is:

1. user creates a query
2. user asks an AI tool manually outside the product
3. user copies the answer back into GEO Monitor
4. dashboard computes mention rate, rank, and competitor tags from manual records

This is useful as a validation shell, but it is not yet a monitoring product. Phase 1 should turn the product into an automated monitoring loop without overbuilding infrastructure.

## 2. Product Decisions Already Locked

These choices were confirmed in chat and are fixed for this phase:

- goal: true automation, not semi-automation
- model strategy: start with one provider only
- deployment strategy: architecture must support both Vercel and ECS, but first production path is Vercel
- results priority: dashboard-first output, not auto-written reports first

## 3. Goals

Phase 1 must deliver the following:

1. run active queries automatically on a schedule
2. allow a manual "run now" trigger using the same execution path
3. call one AI provider through a provider abstraction
4. persist each batch run, each query attempt, and each parsed result
5. compute dashboard-ready insight snapshots after each batch
6. show latest monitoring results and recent trends in the dashboard

## 4. Non-Goals

This phase intentionally does not include:

- multi-provider routing in production
- Redis, BullMQ, or a dedicated queue service
- browser automation or crawling
- auto-generated weekly reports as the primary output
- prescriptive content recommendations as the main feature
- advanced plan-based task quotas beyond current query limits
- migration of scheduled execution to ECS worker on day one

## 5. Approaches Considered

### Option A: Vercel-first automation with portable service boundaries

Use Vercel Cron to trigger an internal run endpoint. Keep scheduling thin and move all real logic into reusable services that can later be called by an ECS worker.

Pros:

- fastest path to a real automated product
- minimal ops burden now
- preserves an upgrade path to ECS worker later

Cons:

- Vercel runtime limits require disciplined batch design
- not ideal for very high volume long term

### Option B: Full worker architecture first

Introduce Redis, queueing, retries, and a dedicated worker immediately.

Pros:

- best long-term backend shape
- strongest retry and throughput model

Cons:

- highest complexity
- slowest path to user-visible value

### Option C: analysis-first, automation later

Keep data manual for now, but improve dashboards, insight logic, and reports first.

Pros:

- quickest visual progress
- lower backend risk

Cons:

- does not solve the core product gap
- keeps the human in the operational loop

### Recommendation

Choose Option A.

It is the best trade-off between speed and product truth. The system will feel automated to the user while the code structure stays compatible with a future ECS worker migration.

## 6. Chosen Architecture

Phase 1 adds one new backend lane beside the existing SaaS shell:

`scheduler -> batch orchestrator -> query runner -> analyzer -> dashboard readers`

### 6.1 Scheduler

Responsibilities:

- trigger runs on a fixed schedule
- authenticate the trigger
- avoid embedding business logic in the scheduled entrypoint

Phase 1 implementation shape:

- Vercel Cron calls an internal API route
- route validates a shared secret
- route invokes the batch orchestration service
- schedule frequency is global and deployment-configured for Phase 1, not tenant-configurable

Portability rule:

- the scheduler entrypoint must be thin
- orchestration logic must live in shared server-side modules, not inside the route body
- an ECS worker must be able to call the same orchestration service later

### 6.2 Batch Orchestrator

Responsibilities:

- find tenants with active queries
- create a batch record per run
- iterate through queries in a controlled order
- collect per-query success/failure results
- trigger snapshot generation after query execution completes

Behavior:

- one batch represents one monitoring run for one tenant
- if a tenant has no active queries, no batch is created
- if a tenant already has a running batch, the orchestrator must skip or fail fast to avoid overlap

### 6.3 Query Runner

Responsibilities:

- build the final prompt for a query
- call the selected AI provider
- persist raw output and parsed output
- record failure details when execution breaks

Design rule:

- all query execution, whether from Cron or from a manual "run now" button, must go through the same runner

### 6.4 AI Provider Layer

Phase 1 uses one provider only, but the call site must not be hard-coded across the app.

Responsibilities:

- accept a normalized request
- call the configured provider
- return normalized text output and provider metadata

Phase 1 provider selection rule:

- provider and model are selected from server-side configuration
- tenant-level model selection is out of scope for this phase

Required interface shape:

- provider name
- model name
- prompt text
- output text
- latency or duration metadata when available

This keeps future multi-provider support additive instead of invasive.

### 6.5 Analyzer

Responsibilities:

- transform raw answers into dashboard metrics
- compute tenant-level snapshot data after each batch
- detect simple anomalies between recent snapshots

Phase 1 analysis outputs:

- mention rate
- average rank among mentions
- discovered competitors
- trend direction: up / flat / down
- anomaly flags such as sudden mention-rate drop or rank deterioration

### 6.6 Dashboard Readers

The dashboard should stop reading only cumulative manual records and instead read:

- latest tenant snapshot
- recent snapshots for trend lines
- latest query results per keyword
- unresolved failures or anomalies

This makes the product feel like a monitoring system, not a data-entry console.

## 7. Data Model Design

The current schema has `Tenant`, `User`, `Query`, and `Response`. That is enough for manual entry, but not for automated batch monitoring. Phase 1 should add explicit run-level models instead of overloading the existing manual shape.

### 7.1 Keep Existing Core Models

- `Tenant` stays the tenant boundary
- `Query` remains the monitoring keyword definition
- `Response` remains available for existing manual-entry history

This avoids a risky rewrite of the V1 shell.

### 7.2 New Models

#### `RunBatch`

Represents one automated monitoring run for one tenant.

Suggested fields:

- `id`
- `tenantId`
- `triggerType` (`cron` or `manual`)
- `status` (`pending`, `running`, `success`, `partial_failure`, `failed`)
- `startedAt`
- `finishedAt`
- `queryCount`
- `successCount`
- `failureCount`
- `errorSummary`

#### `QueryRun`

Represents one query execution attempt inside a batch.

Suggested fields:

- `id`
- `batchId`
- `queryId`
- `provider`
- `model`
- `status` (`pending`, `running`, `success`, `failed`)
- `prompt`
- `rawOutput`
- `mentioned`
- `rank`
- `competitors`
- `notes`
- `errorMessage`
- `startedAt`
- `finishedAt`

#### `InsightSnapshot`

Represents tenant-level aggregated metrics after a batch completes.

Suggested fields:

- `id`
- `tenantId`
- `batchId`
- `mentionRate`
- `averageRank`
- `competitorList`
- `trendDirection`
- `anomalyFlags`
- `createdAt`

### 7.3 Why Not Reuse Only `Response`

Using only `Response` would miss three critical needs:

- failed runs with no successful answer
- batch-level history and observability
- snapshot-based trend comparison

`Response` can remain for backward compatibility, but automated monitoring needs explicit operational records.

### 7.4 Migration Direction

Phase 1 should be additive:

- no destructive schema changes
- old manual data remains readable
- new dashboard widgets prefer automated records when present
- manual mode remains usable as fallback during rollout

## 8. Execution Flow

### 8.1 Scheduled Run

1. Vercel Cron hits the protected internal run endpoint
2. endpoint validates secret and calls batch orchestration service
3. service selects tenants with active queries
4. for each tenant, service creates a `RunBatch`
5. runner executes each active query
6. for each query, service creates a `QueryRun` and updates its status
7. after all query runs finish, analyzer creates an `InsightSnapshot`
8. dashboard reads the latest snapshot and recent query runs

### 8.2 Manual Run Now

1. user clicks "run now" in dashboard or queries page
2. UI hits a protected internal action/route
3. backend invokes the same orchestration path with `triggerType=manual`
4. result is stored exactly like scheduled runs

This guarantees that manual and scheduled execution do not drift apart behaviorally.

## 9. Prompting Strategy

Phase 1 should use one stable prompt template with lightweight brand context:

- tenant brand name
- industry
- region
- query text

The output target should be optimized for structured extraction, not prose beauty.

Prompt priorities:

1. preserve the original question intent
2. encourage ranked recommendations when possible
3. return answer text suitable for mention/rank/competitor parsing

The full provider request should be logged in `QueryRun.prompt` so debugging is possible later.

## 10. Parsing and Insight Rules

Phase 1 must use simple deterministic parsing first, with AI-generated reporting postponed.

### 10.1 Per-Query Parsing

For each query result, extract:

- whether the tenant brand is mentioned
- tenant rank if inferable
- competitor names
- optional notes when parsing is uncertain

If exact rank cannot be determined, store `null` rather than guessing.

### 10.2 Snapshot Metrics

Each snapshot should compute:

- `mentionRate = mentioned query runs / successful query runs`
- `averageRank = average of non-null ranks`
- `competitorList = deduplicated competitors from latest batch`
- `trendDirection` by comparing current snapshot against the previous one

### 10.3 Anomaly Rules

Phase 1 anomaly rules should be rule-based, not AI-generated:

- mention rate dropped beyond a defined threshold
- average rank worsened beyond a defined threshold
- query failure count exceeded a threshold
- a major competitor appeared in multiple results after not appearing previously

## 11. Dashboard Experience

Because dashboard-first value was prioritized, the UI should change meaningfully.

### 11.1 Dashboard Page

Show:

- last run time
- last run status
- mention rate
- average rank
- discovered competitors
- trend cards for recent runs
- anomaly banner when present

### 11.2 Queries Page

Show:

- active/inactive state per query
- last run result for each query
- run now action
- recent history for each query
- failure state if latest execution failed

### 11.3 Manual Entry Handling

Manual entry should remain available in Phase 1 but visually become secondary. The product direction should clearly shift toward auto-run first.

## 12. Error Handling and Safety

### 12.1 Scheduler Protection

- Cron endpoint must require a secret
- requests without the secret must fail immediately

### 12.2 Overlap Protection

- system must avoid running the same tenant batch twice concurrently
- if overlap is detected, the second invocation should skip with a clear status

### 12.3 Partial Failure Tolerance

- one failed query run must not invalidate the whole tenant batch
- a batch can finish as `partial_failure`

### 12.4 Output Preservation

- raw provider output must be stored whenever available
- parsing failure must not erase the raw answer

### 12.5 Runtime Limits

Because first execution is on Vercel:

- batch work should be bounded
- query execution may need sequential or low-concurrency processing
- long-term queueing is intentionally deferred

## 13. Testing Strategy

Phase 1 should ship with tests around the new logic boundaries.

### 13.1 Unit Tests

- prompt builder
- competitor parser
- mention/rank extraction helpers
- snapshot trend calculation
- anomaly rule evaluation

### 13.2 Integration Tests

- run endpoint auth validation
- batch orchestration with mocked provider output
- successful batch creation and snapshot generation
- partial-failure batch behavior

### 13.3 Manual Smoke Checks

- create active queries
- trigger manual run
- confirm batch, query runs, and snapshot persist
- verify dashboard updates
- verify scheduled invocation path with the same service layer

## 14. Rollout Strategy

Recommended rollout order:

1. add schema and backend services
2. enable manual "run now" first using the new runner
3. verify insight snapshots through manual runs
4. turn on scheduled execution in Vercel
5. keep manual fallback visible during early production

This reduces unknowns before introducing unattended execution.

## 15. Risks and Mitigations

### Risk 1: Vercel execution limits

Mitigation:

- keep provider count to one
- keep concurrency conservative
- keep batch logic portable so it can move to ECS later

### Risk 2: parsing instability

Mitigation:

- store raw output
- allow nullable structured fields
- use deterministic heuristics first

### Risk 3: operational blindness

Mitigation:

- add batch and query-run status tracking from the start
- show failures in the dashboard instead of hiding them

## 16. Phase 1 Success Criteria

Phase 1 is successful when:

1. a tenant can create active queries and run them automatically
2. each run produces auditable batch records
3. each query attempt is traceable with status and raw output
4. dashboard shows latest mention rate, rank, competitors, and trend
5. the same execution path works for both scheduled runs and manual "run now"
6. code boundaries allow future migration from Vercel Cron to ECS worker without rewriting business logic

## 17. Out of Scope for Phase 2 Planning Later

These should wait until after Phase 1 proves stable:

- multi-provider routing and provider comparison
- Redis/BullMQ queueing
- AI-written reports
- action recommendation engine
- tenant-configurable schedules
- alert delivery via email, Feishu, or WeChat

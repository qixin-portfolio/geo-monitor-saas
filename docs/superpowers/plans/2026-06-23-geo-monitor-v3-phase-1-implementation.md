# GEO Monitor V3 Phase 1 Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first real automated GEO monitoring loop: scheduled runs, one-provider execution, persisted run history, insight snapshots, and dashboard-first results.

**Architecture:** Keep the current Next.js SaaS shell intact and add a portable monitoring lane: Vercel Cron triggers a thin internal route, shared orchestration services run active tenant queries through one provider, query runs are persisted into new run-level tables, and dashboard read-models render snapshots plus recent activity. The same service layer powers both Cron-triggered runs and manual “run now” from the authenticated dashboard.

**Tech Stack:** Next.js App Router, Prisma + PostgreSQL, Clerk, OpenAI SDK, Vercel Cron, Vitest

---

## File Structure

**Create**

- `vitest.config.ts` — Vitest config with path alias support
- `src/lib/monitoring/build-monitoring-prompt.ts` — prompt builder for one query
- `src/lib/monitoring/build-monitoring-prompt.test.ts` — prompt builder tests
- `src/lib/monitoring/types.ts` — shared monitoring types and enums
- `src/lib/monitoring/parse-monitoring-output.ts` — deterministic parsing helpers
- `src/lib/monitoring/parse-monitoring-output.test.ts` — parsing tests
- `src/lib/monitoring/build-insight-snapshot.ts` — snapshot and anomaly calculators
- `src/lib/monitoring/build-insight-snapshot.test.ts` — snapshot tests
- `src/lib/monitoring/config.ts` — env readers for provider/model/cron secret
- `src/lib/monitoring/provider.ts` — provider interface
- `src/lib/monitoring/openai-provider.ts` — OpenAI adapter
- `src/lib/monitoring/run-query.ts` — single-query execution service
- `src/lib/monitoring/run-query.test.ts` — query runner tests
- `src/lib/monitoring/run-tenant-batch.ts` — one-tenant batch orchestration
- `src/lib/monitoring/run-all-tenants.ts` — all-tenant scheduled entry service
- `src/lib/monitoring/run-all-tenants.test.ts` — orchestration tests
- `src/lib/monitoring/read-models.ts` — dashboard/query page readers for automated data
- `src/lib/monitoring/read-models.test.ts` — read-model tests
- `src/components/run-now-button.tsx` — client button for manual runs
- `src/components/query-run-status-badge.tsx` — UI badge for run status
- `src/components/anomaly-banner.tsx` — dashboard anomaly banner
- `src/app/api/internal/monitoring/run/route.ts` — protected Vercel Cron endpoint
- `src/app/api/internal/monitoring/run/route.test.ts` — Cron auth tests
- `src/app/api/monitoring/run/route.ts` — authenticated manual “run now” endpoint
- `src/app/api/queries/[queryId]/route.ts` — toggle active/inactive per query
- `vercel.json` — Vercel Cron schedule

**Modify**

- `package.json` — add test scripts and required packages
- `prisma/schema.prisma` — add automated monitoring enums/models
- `README.md` — document automated monitoring setup and limits
- `.env.example` — add monitoring env vars
- `deploy/production.env.example` — add monitoring env vars for production
- `src/app/dashboard/page.tsx` — render latest snapshot + trends + run-now button
- `src/app/dashboard/queries/page.tsx` — render automated query monitoring state
- `src/components/query-manager.tsx` — add active toggle, latest run info, manual run button
- `src/lib/tenant.ts` — keep existing tenant bootstrap and expose only tenant identity utilities if needed

**Migration Output**

- `prisma/migrations/20260623190000_add_monitoring_runs/migration.sql` — generated schema migration

---

### Task 1: Add the Test Harness and Prompt Builder

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/monitoring/build-monitoring-prompt.ts`
- Test: `src/lib/monitoring/build-monitoring-prompt.test.ts`

- [ ] **Step 1: Write the failing prompt-builder test**

```ts
// src/lib/monitoring/build-monitoring-prompt.test.ts
import { describe, expect, it } from "vitest"

import { buildMonitoringPrompt } from "./build-monitoring-prompt"

describe("buildMonitoringPrompt", () => {
  it("injects tenant context and preserves the exact query", () => {
    const prompt = buildMonitoringPrompt({
      brandName: "晟景装饰",
      industry: "装修",
      region: "交城",
      queryText: "交城装修公司哪家靠谱？",
    })

    expect(prompt).toContain("晟景装饰")
    expect(prompt).toContain("装修")
    expect(prompt).toContain("交城")
    expect(prompt).toContain("交城装修公司哪家靠谱？")
    expect(prompt).toContain("请列出推荐名单")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run src/lib/monitoring/build-monitoring-prompt.test.ts
```

Expected: FAIL because Vitest and `build-monitoring-prompt.ts` do not exist yet.

- [ ] **Step 3: Add Vitest plus the minimal prompt builder**

```json
// package.json (scripts + deps excerpt)
{
  "scripts": {
    "dev": "next dev",
    "build": "next build --webpack",
    "postinstall": "prisma generate",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@clerk/nextjs": "^7.5.7",
    "@prisma/adapter-pg": "^7.8.0",
    "@prisma/client": "^7.8.0",
    "@stripe/stripe-js": "^9.8.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "dotenv": "^17.4.2",
    "lucide-react": "^1.21.0",
    "next": "^16.2.9",
    "openai": "^5.8.2",
    "pg": "^8.22.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "stripe": "^22.2.2",
    "tailwind-merge": "^3.6.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "prisma": "^7.8.0",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vite-tsconfig-paths": "^5.1.4",
    "vitest": "^2.1.8"
  }
}
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
  },
})
```

```ts
// src/lib/monitoring/build-monitoring-prompt.ts
type MonitoringPromptInput = {
  brandName: string
  industry: string | null
  region: string | null
  queryText: string
}

export function buildMonitoringPrompt({
  brandName,
  industry,
  region,
  queryText,
}: MonitoringPromptInput) {
  const context = [
    `品牌：${brandName}`,
    industry ? `行业：${industry}` : null,
    region ? `地区：${region}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  return [
    "你是一个本地推荐场景分析助手。",
    context,
    `用户问题：${queryText}`,
    "请列出推荐名单，并说明每个推荐对象的理由。",
    "如果适合排序，请给出明确顺序。",
  ].join("\n\n")
}
```

Then install deps:

```bash
npm install
```

- [ ] **Step 4: Run the targeted test to verify it passes**

Run:

```bash
npx vitest run src/lib/monitoring/build-monitoring-prompt.test.ts
```

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/monitoring/build-monitoring-prompt.ts src/lib/monitoring/build-monitoring-prompt.test.ts
git commit -m "test: add monitoring prompt builder foundation"
```

---

### Task 2: Implement Deterministic Parsing and Snapshot Calculators

**Files:**
- Create: `src/lib/monitoring/types.ts`
- Create: `src/lib/monitoring/parse-monitoring-output.ts`
- Create: `src/lib/monitoring/build-insight-snapshot.ts`
- Test: `src/lib/monitoring/parse-monitoring-output.test.ts`
- Test: `src/lib/monitoring/build-insight-snapshot.test.ts`

- [ ] **Step 1: Write failing parser and snapshot tests**

```ts
// src/lib/monitoring/parse-monitoring-output.test.ts
import { describe, expect, it } from "vitest"

import { parseMonitoringOutput } from "./parse-monitoring-output"

describe("parseMonitoringOutput", () => {
  it("detects mention, rank, and competitors", () => {
    const result = parseMonitoringOutput({
      brandName: "晟景装饰",
      answer: `1. 晟景装饰：本地案例多\n2. 交城宜家装饰：设计现代\n3. 星河装修：施工稳定`,
    })

    expect(result.mentioned).toBe(true)
    expect(result.rank).toBe(1)
    expect(result.competitors).toEqual(["交城宜家装饰", "星河装修"])
  })

  it("returns null rank when the answer is unstructured", () => {
    const result = parseMonitoringOutput({
      brandName: "晟景装饰",
      answer: "晟景装饰口碑不错，也可以再看看其他品牌。",
    })

    expect(result.mentioned).toBe(true)
    expect(result.rank).toBeNull()
  })
})
```

```ts
// src/lib/monitoring/build-insight-snapshot.test.ts
import { describe, expect, it } from "vitest"

import { buildInsightSnapshot } from "./build-insight-snapshot"

describe("buildInsightSnapshot", () => {
  it("computes mention rate, average rank, trend, and anomalies", () => {
    const snapshot = buildInsightSnapshot({
      previous: {
        mentionRate: 80,
        averageRank: 1.5,
        competitorList: ["交城宜家装饰"],
        trendDirection: "flat",
        anomalyFlags: [],
      },
      queryRuns: [
        { status: "success", mentioned: true, rank: 2, competitors: ["交城宜家装饰"] },
        { status: "success", mentioned: false, rank: null, competitors: ["星河装修"] },
      ],
    })

    expect(snapshot.mentionRate).toBe(50)
    expect(snapshot.averageRank).toBe(2)
    expect(snapshot.competitorList).toEqual(["交城宜家装饰", "星河装修"])
    expect(snapshot.trendDirection).toBe("down")
    expect(snapshot.anomalyFlags).toContain("mention-rate-drop")
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npx vitest run src/lib/monitoring/parse-monitoring-output.test.ts src/lib/monitoring/build-insight-snapshot.test.ts
```

Expected: FAIL because the implementation files do not exist yet.

- [ ] **Step 3: Implement the shared types, parser, and snapshot builder**

```ts
// src/lib/monitoring/types.ts
export type TrendDirection = "up" | "flat" | "down"

export type QueryRunStatus = "pending" | "running" | "success" | "failed"

export type ParsedMonitoringOutput = {
  mentioned: boolean
  rank: number | null
  competitors: string[]
  notes: string | null
}

export type SnapshotInput = {
  previous: {
    mentionRate: number
    averageRank: number | null
    competitorList: string[]
    trendDirection: TrendDirection
    anomalyFlags: string[]
  } | null
  queryRuns: Array<{
    status: QueryRunStatus
    mentioned: boolean
    rank: number | null
    competitors: string[]
  }>
}
```

```ts
// src/lib/monitoring/parse-monitoring-output.ts
import type { ParsedMonitoringOutput } from "./types"

type ParseInput = {
  brandName: string
  answer: string
}

const COMPETITOR_REGEX = /[\u4e00-\u9fa5A-Za-z0-9]{2,20}(装饰|装修|设计|家装)/g

export function parseMonitoringOutput({
  brandName,
  answer,
}: ParseInput): ParsedMonitoringOutput {
  const mentioned = answer.includes(brandName)
  const lines = answer.split("\n").map((line) => line.trim()).filter(Boolean)

  let rank: number | null = null
  for (const line of lines) {
    if (!line.includes(brandName)) continue
    const match = line.match(/^(\d+)[\.\、]/)
    if (match) {
      rank = Number(match[1])
      break
    }
  }

  const competitors = Array.from(new Set(answer.match(COMPETITOR_REGEX) ?? [])).filter(
    (name) => name !== brandName
  )

  return {
    mentioned,
    rank,
    competitors,
    notes: mentioned && rank === null ? "brand-mentioned-without-deterministic-rank" : null,
  }
}
```

```ts
// src/lib/monitoring/build-insight-snapshot.ts
import type { SnapshotInput, TrendDirection } from "./types"

export function buildInsightSnapshot({ previous, queryRuns }: SnapshotInput) {
  const successfulRuns = queryRuns.filter((run) => run.status === "success")
  const mentionedRuns = successfulRuns.filter((run) => run.mentioned)
  const ranks = mentionedRuns.map((run) => run.rank).filter((rank): rank is number => rank !== null)

  const mentionRate = successfulRuns.length
    ? Math.round((mentionedRuns.length / successfulRuns.length) * 100)
    : 0

  const averageRank = ranks.length
    ? Number((ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length).toFixed(1))
    : null

  const competitorList = Array.from(
    new Set(successfulRuns.flatMap((run) => run.competitors))
  ).sort()

  const trendDirection: TrendDirection =
    previous === null
      ? "flat"
      : mentionRate > previous.mentionRate
        ? "up"
        : mentionRate < previous.mentionRate
          ? "down"
          : "flat"

  const anomalyFlags: string[] = []

  if (previous && previous.mentionRate - mentionRate >= 20) {
    anomalyFlags.push("mention-rate-drop")
  }

  if (
    previous &&
    previous.averageRank !== null &&
    averageRank !== null &&
    averageRank - previous.averageRank >= 1
  ) {
    anomalyFlags.push("average-rank-worsened")
  }

  if (successfulRuns.length !== queryRuns.length) {
    anomalyFlags.push("query-run-failures")
  }

  return {
    mentionRate,
    averageRank,
    competitorList,
    trendDirection,
    anomalyFlags,
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npx vitest run src/lib/monitoring/parse-monitoring-output.test.ts src/lib/monitoring/build-insight-snapshot.test.ts
```

Expected: PASS with both suites green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/monitoring/types.ts src/lib/monitoring/parse-monitoring-output.ts src/lib/monitoring/parse-monitoring-output.test.ts src/lib/monitoring/build-insight-snapshot.ts src/lib/monitoring/build-insight-snapshot.test.ts
git commit -m "feat: add monitoring parsing and snapshot helpers"
```

---

### Task 3: Add Prisma Models for Automated Runs

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260623190000_add_monitoring_runs/migration.sql`

- [ ] **Step 1: Extend the Prisma schema with batch, query-run, and snapshot models**

```prisma
// prisma/schema.prisma (new enums + model additions)
enum RunTriggerType {
  CRON
  MANUAL
}

enum RunBatchStatus {
  PENDING
  RUNNING
  SUCCESS
  PARTIAL_FAILURE
  FAILED
}

enum QueryRunStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
}

enum TrendDirection {
  UP
  FLAT
  DOWN
}

model Tenant {
  id                     String             @id @default(cuid())
  name                   String
  industry               String?
  region                 String?
  brandName              String?
  plan                   Plan               @default(FREE)
  stripeCustomerId       String?
  stripeSubscriptionId   String?
  subscriptionStatus     SubscriptionStatus @default(NONE)
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
  users                  User[]
  queries                Query[]
  runBatches             RunBatch[]
  insightSnapshots       InsightSnapshot[]
}

model Query {
  id        String     @id @default(cuid())
  tenantId  String
  text      String
  platform  String     @default("manual")
  active    Boolean    @default(true)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  tenant    Tenant     @relation(fields: [tenantId], references: [id])
  responses Response[]
  queryRuns QueryRun[]
}

model RunBatch {
  id           String         @id @default(cuid())
  tenantId      String
  triggerType   RunTriggerType
  status        RunBatchStatus @default(PENDING)
  queryCount    Int            @default(0)
  successCount  Int            @default(0)
  failureCount  Int            @default(0)
  errorSummary  String?
  startedAt     DateTime?
  finishedAt    DateTime?
  createdAt     DateTime       @default(now())
  tenant        Tenant         @relation(fields: [tenantId], references: [id])
  queryRuns     QueryRun[]
  snapshot      InsightSnapshot?

  @@index([tenantId, createdAt])
  @@index([tenantId, status])
}

model QueryRun {
  id           String         @id @default(cuid())
  batchId       String
  queryId       String
  provider      String
  model         String
  status        QueryRunStatus @default(PENDING)
  prompt        String
  rawOutput     String?
  mentioned     Boolean        @default(false)
  rank          Int?
  competitors   String[]       @default([])
  notes         String?
  errorMessage  String?
  startedAt     DateTime?
  finishedAt    DateTime?
  createdAt     DateTime       @default(now())
  batch         RunBatch       @relation(fields: [batchId], references: [id])
  query         Query          @relation(fields: [queryId], references: [id])

  @@index([batchId, createdAt])
  @@index([queryId, createdAt])
  @@index([status])
}

model InsightSnapshot {
  id             String         @id @default(cuid())
  tenantId        String
  batchId         String         @unique
  mentionRate     Int
  averageRank     Float?
  competitorList  String[]       @default([])
  trendDirection  TrendDirection
  anomalyFlags    String[]       @default([])
  createdAt       DateTime       @default(now())
  tenant          Tenant         @relation(fields: [tenantId], references: [id])
  batch           RunBatch       @relation(fields: [batchId], references: [id])

  @@index([tenantId, createdAt])
}
```

- [ ] **Step 2: Validate the schema before generating a migration**

Run:

```bash
npx prisma format
npx prisma validate
```

Expected: PASS with `The schema at prisma/schema.prisma is valid`.

- [ ] **Step 3: Generate the migration and Prisma client**

Run:

```bash
npx prisma migrate dev --name add_monitoring_runs
npm run prisma:generate
```

Expected:

- new migration folder under `prisma/migrations/`
- regenerated Prisma client

Keep the generated SQL checked in. Do not hand-edit the SQL unless Prisma generates something broken.

- [ ] **Step 4: Smoke-check the new tables in Prisma Studio or SQL**

Run:

```bash
npx prisma studio
```

Expected: new `RunBatch`, `QueryRun`, and `InsightSnapshot` models appear in the sidebar.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations package.json package-lock.json
git commit -m "feat: add automated monitoring persistence models"
```

---

### Task 4: Implement Provider Configuration and the Single-Query Runner

**Files:**
- Create: `src/lib/monitoring/config.ts`
- Create: `src/lib/monitoring/provider.ts`
- Create: `src/lib/monitoring/openai-provider.ts`
- Create: `src/lib/monitoring/run-query.ts`
- Test: `src/lib/monitoring/run-query.test.ts`

- [ ] **Step 1: Write failing tests for successful and failed query execution**

```ts
// src/lib/monitoring/run-query.test.ts
import { describe, expect, it, vi } from "vitest"

import { runQuery } from "./run-query"

describe("runQuery", () => {
  it("stores parsed output when the provider succeeds", async () => {
    const provider = { call: vi.fn().mockResolvedValue({ provider: "openai", model: "gpt-4o-mini", output: "1. 晟景装饰：案例多", durationMs: 100 }) }

    const result = await runQuery({
      query: { id: "query_1", text: "交城装修公司哪家靠谱？" },
      tenant: { brandName: "晟景装饰", industry: "装修", region: "交城" },
      provider,
    })

    expect(result.status).toBe("success")
    expect(result.mentioned).toBe(true)
    expect(result.rank).toBe(1)
    expect(result.rawOutput).toContain("晟景装饰")
  })

  it("returns a failed result when the provider throws", async () => {
    const provider = { call: vi.fn().mockRejectedValue(new Error("provider-down")) }

    const result = await runQuery({
      query: { id: "query_1", text: "交城装修公司哪家靠谱？" },
      tenant: { brandName: "晟景装饰", industry: "装修", region: "交城" },
      provider,
    })

    expect(result.status).toBe("failed")
    expect(result.errorMessage).toContain("provider-down")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run src/lib/monitoring/run-query.test.ts
```

Expected: FAIL because the runner and provider files do not exist yet.

- [ ] **Step 3: Implement provider config, provider interface, and query runner**

```ts
// src/lib/monitoring/config.ts
export function getMonitoringConfig() {
  return {
    provider: "openai" as const,
    model: process.env.MONITORING_MODEL || "gpt-4o-mini",
    cronSecret: process.env.MONITORING_CRON_SECRET || "",
  }
}
```

```ts
// src/lib/monitoring/provider.ts
export type ProviderCallInput = {
  prompt: string
  model: string
}

export type ProviderCallResult = {
  provider: string
  model: string
  output: string
  durationMs: number | null
}

export interface MonitoringProvider {
  call(input: ProviderCallInput): Promise<ProviderCallResult>
}
```

```ts
// src/lib/monitoring/openai-provider.ts
import OpenAI from "openai"

import type { MonitoringProvider, ProviderCallInput, ProviderCallResult } from "./provider"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class OpenAIProvider implements MonitoringProvider {
  async call({ prompt, model }: ProviderCallInput): Promise<ProviderCallResult> {
    const startedAt = Date.now()

    const response = await client.responses.create({
      model,
      input: prompt,
    })

    return {
      provider: "openai",
      model,
      output: response.output_text,
      durationMs: Date.now() - startedAt,
    }
  }
}
```

```ts
// src/lib/monitoring/run-query.ts
import { buildMonitoringPrompt } from "./build-monitoring-prompt"
import { getMonitoringConfig } from "./config"
import { parseMonitoringOutput } from "./parse-monitoring-output"
import type { MonitoringProvider } from "./provider"

type RunQueryInput = {
  query: { id: string; text: string }
  tenant: { brandName: string | null; industry: string | null; region: string | null }
  provider: MonitoringProvider
}

export async function runQuery({ query, tenant, provider }: RunQueryInput) {
  const brandName = tenant.brandName?.trim() || "未设置品牌"
  const prompt = buildMonitoringPrompt({
    brandName,
    industry: tenant.industry,
    region: tenant.region,
    queryText: query.text,
  })

  try {
    const { model, output } = await provider.call({
      prompt,
      model: getMonitoringConfig().model,
    })

    const parsed = parseMonitoringOutput({
      brandName,
      answer: output,
    })

    return {
      status: "success" as const,
      provider: "openai",
      model,
      prompt,
      rawOutput: output,
      mentioned: parsed.mentioned,
      rank: parsed.rank,
      competitors: parsed.competitors,
      notes: parsed.notes,
      errorMessage: null,
    }
  } catch (error) {
    return {
      status: "failed" as const,
      provider: "openai",
      model: getMonitoringConfig().model,
      prompt,
      rawOutput: null,
      mentioned: false,
      rank: null,
      competitors: [],
      notes: null,
      errorMessage: error instanceof Error ? error.message : "unknown-provider-error",
    }
  }
}
```

- [ ] **Step 4: Run the query-runner test to verify it passes**

Run:

```bash
npx vitest run src/lib/monitoring/run-query.test.ts
```

Expected: PASS with both success and failure cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/monitoring/config.ts src/lib/monitoring/provider.ts src/lib/monitoring/openai-provider.ts src/lib/monitoring/run-query.ts src/lib/monitoring/run-query.test.ts
git commit -m "feat: add monitoring provider and query runner"
```

---

### Task 5: Build Batch Orchestration and the Cron/Manual Run Endpoints

**Files:**
- Create: `src/lib/monitoring/run-tenant-batch.ts`
- Create: `src/lib/monitoring/run-all-tenants.ts`
- Create: `src/app/api/internal/monitoring/run/route.ts`
- Create: `src/app/api/internal/monitoring/run/route.test.ts`
- Create: `src/app/api/monitoring/run/route.ts`
- Create: `vercel.json`
- Test: `src/lib/monitoring/run-all-tenants.test.ts`

- [ ] **Step 1: Write failing tests for Cron auth and partial-failure batch behavior**

```ts
// src/app/api/internal/monitoring/run/route.test.ts
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/monitoring/run-all-tenants", () => ({
  runAllTenants: vi.fn().mockResolvedValue({ processedTenants: 1 }),
}))

import { POST } from "./route"

describe("POST /api/internal/monitoring/run", () => {
  it("rejects requests without the cron secret", async () => {
    process.env.MONITORING_CRON_SECRET = "top-secret"

    const response = await POST(
      new Request("http://localhost/api/internal/monitoring/run", {
        method: "POST",
      })
    )

    expect(response.status).toBe(401)
  })
})
```

```ts
// src/lib/monitoring/run-all-tenants.test.ts
import { describe, expect, it, vi } from "vitest"

import { runTenantBatch } from "./run-tenant-batch"

vi.mock("./run-tenant-batch", () => ({
  runTenantBatch: vi.fn(),
}))

describe("runAllTenants", () => {
  it("continues when one tenant batch fails", async () => {
    vi.mocked(runTenantBatch)
      .mockResolvedValueOnce({ tenantId: "tenant_1", status: "success" })
      .mockRejectedValueOnce(new Error("tenant-2-failed"))

    const { runAllTenants } = await import("./run-all-tenants")

    const result = await runAllTenants({
      tenants: [{ id: "tenant_1" }, { id: "tenant_2" }],
    })

    expect(result.processedTenants).toBe(2)
    expect(result.failedTenants).toBe(1)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npx vitest run src/app/api/internal/monitoring/run/route.test.ts src/lib/monitoring/run-all-tenants.test.ts
```

Expected: FAIL because the orchestration and route files do not exist yet.

- [ ] **Step 3: Implement tenant-batch orchestration, all-tenant execution, and the two routes**

```ts
// src/lib/monitoring/run-tenant-batch.ts
import { getPrisma } from "@/lib/prisma"

import { buildInsightSnapshot } from "./build-insight-snapshot"
import { OpenAIProvider } from "./openai-provider"
import { runQuery } from "./run-query"

type RunTenantBatchInput = {
  tenantId: string
  triggerType: "CRON" | "MANUAL"
}

export async function runTenantBatch({ tenantId, triggerType }: RunTenantBatchInput) {
  const prisma = getPrisma()
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    include: {
      queries: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
      },
      insightSnapshots: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  if (tenant.queries.length === 0) {
    return { tenantId, status: "skipped-no-active-queries" as const }
  }

  const runningBatch = await prisma.runBatch.findFirst({
    where: {
      tenantId,
      status: { in: ["PENDING", "RUNNING"] },
    },
  })

  if (runningBatch) {
    return { tenantId, status: "skipped-overlap" as const }
  }

  const batch = await prisma.runBatch.create({
    data: {
      tenantId,
      triggerType,
      status: "RUNNING",
      queryCount: tenant.queries.length,
      startedAt: new Date(),
    },
  })

  const provider = new OpenAIProvider()
  const queryRunResults = []

  for (const query of tenant.queries) {
    const result = await runQuery({
      query,
      tenant,
      provider,
    })

    const queryRun = await prisma.queryRun.create({
      data: {
        batchId: batch.id,
        queryId: query.id,
        provider: result.provider,
        model: result.model,
        status: result.status === "success" ? "SUCCESS" : "FAILED",
        prompt: result.prompt,
        rawOutput: result.rawOutput,
        mentioned: result.mentioned,
        rank: result.rank,
        competitors: result.competitors,
        notes: result.notes,
        errorMessage: result.errorMessage,
        startedAt: batch.startedAt,
        finishedAt: new Date(),
      },
    })

    queryRunResults.push(queryRun)
  }

  const previous = tenant.insightSnapshots[0]
    ? {
        mentionRate: tenant.insightSnapshots[0].mentionRate,
        averageRank: tenant.insightSnapshots[0].averageRank,
        competitorList: tenant.insightSnapshots[0].competitorList,
        trendDirection: tenant.insightSnapshots[0].trendDirection.toLowerCase() as "up" | "flat" | "down",
        anomalyFlags: tenant.insightSnapshots[0].anomalyFlags,
      }
    : null

  const snapshot = buildInsightSnapshot({
    previous,
    queryRuns: queryRunResults.map((queryRun) => ({
      status: queryRun.status === "SUCCESS" ? "success" : "failed",
      mentioned: queryRun.mentioned,
      rank: queryRun.rank,
      competitors: queryRun.competitors,
    })),
  })

  await prisma.insightSnapshot.create({
    data: {
      tenantId,
      batchId: batch.id,
      mentionRate: snapshot.mentionRate,
      averageRank: snapshot.averageRank,
      competitorList: snapshot.competitorList,
      trendDirection: snapshot.trendDirection.toUpperCase() as "UP" | "FLAT" | "DOWN",
      anomalyFlags: snapshot.anomalyFlags,
    },
  })

  const successCount = queryRunResults.filter((item) => item.status === "SUCCESS").length
  const failureCount = queryRunResults.length - successCount

  await prisma.runBatch.update({
    where: { id: batch.id },
    data: {
      successCount,
      failureCount,
      finishedAt: new Date(),
      status:
        failureCount === 0 ? "SUCCESS" : successCount > 0 ? "PARTIAL_FAILURE" : "FAILED",
    },
  })

  return { tenantId, status: failureCount === 0 ? "success" : "partial_failure" }
}
```

```ts
// src/lib/monitoring/run-all-tenants.ts
import { getPrisma } from "@/lib/prisma"

import { runTenantBatch } from "./run-tenant-batch"

export async function runAllTenants({
  tenants,
}: {
  tenants?: Array<{ id: string }>
} = {}) {
  const prisma = getPrisma()
  const runnableTenants =
    tenants ??
    (await prisma.tenant.findMany({
      where: { queries: { some: { active: true } } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }))

  let failedTenants = 0

  for (const tenant of runnableTenants) {
    try {
      await runTenantBatch({
        tenantId: tenant.id,
        triggerType: "CRON",
      })
    } catch {
      failedTenants += 1
    }
  }

  return {
    processedTenants: runnableTenants.length,
    failedTenants,
  }
}
```

```ts
// src/app/api/internal/monitoring/run/route.ts
import { NextResponse } from "next/server"

import { getMonitoringConfig } from "@/lib/monitoring/config"
import { runAllTenants } from "@/lib/monitoring/run-all-tenants"

export async function POST(req: Request) {
  const secret = req.headers.get("x-monitoring-cron-secret")

  if (!secret || secret !== getMonitoringConfig().cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runAllTenants()
  return NextResponse.json(result)
}
```

```ts
// src/app/api/monitoring/run/route.ts
import { NextResponse } from "next/server"

import { getOrCreateTenant } from "@/lib/tenant"
import { runTenantBatch } from "@/lib/monitoring/run-tenant-batch"

export async function POST() {
  const tenant = await getOrCreateTenant()

  const result = await runTenantBatch({
    tenantId: tenant.id,
    triggerType: "MANUAL",
  })

  return NextResponse.json(result)
}
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/internal/monitoring/run",
      "schedule": "0 */12 * * *"
    }
  ]
}
```

- [ ] **Step 4: Run the route and orchestration tests**

Run:

```bash
npx vitest run src/app/api/internal/monitoring/run/route.test.ts src/lib/monitoring/run-all-tenants.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/monitoring/run-tenant-batch.ts src/lib/monitoring/run-all-tenants.ts src/lib/monitoring/run-all-tenants.test.ts src/app/api/internal/monitoring/run/route.ts src/app/api/internal/monitoring/run/route.test.ts src/app/api/monitoring/run/route.ts vercel.json
git commit -m "feat: add monitoring batch orchestration and run endpoints"
```

---

### Task 6: Build Read-Models and the Dashboard/Queries UI

**Files:**
- Create: `src/lib/monitoring/read-models.ts`
- Create: `src/lib/monitoring/read-models.test.ts`
- Create: `src/components/run-now-button.tsx`
- Create: `src/components/query-run-status-badge.tsx`
- Create: `src/components/anomaly-banner.tsx`
- Create: `src/app/api/queries/[queryId]/route.ts`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/queries/page.tsx`
- Modify: `src/components/query-manager.tsx`

- [ ] **Step 1: Write failing read-model tests for latest snapshot and latest query-run selection**

```ts
// src/lib/monitoring/read-models.test.ts
import { describe, expect, it } from "vitest"

import { mapDashboardSnapshot, mapQueryMonitoringRows } from "./read-models"

describe("mapDashboardSnapshot", () => {
  it("prefers automated snapshot data when it exists", () => {
    const result = mapDashboardSnapshot({
      tenantName: "晟景装饰",
      latestSnapshot: {
        mentionRate: 66,
        averageRank: 1.5,
        competitorList: ["交城宜家装饰"],
        anomalyFlags: ["mention-rate-drop"],
      },
      recentBatches: [{ status: "SUCCESS", createdAt: new Date("2026-06-23T10:00:00Z") }],
    })

    expect(result.mentionRate).toBe(66)
    expect(result.anomalyFlags).toContain("mention-rate-drop")
  })
})

describe("mapQueryMonitoringRows", () => {
  it("returns each query with its latest run", () => {
    const rows = mapQueryMonitoringRows([
      {
        id: "query_1",
        text: "交城装修公司哪家靠谱？",
        active: true,
        queryRuns: [
          { status: "SUCCESS", mentioned: true, rank: 1, createdAt: new Date("2026-06-23T10:00:00Z") },
        ],
      },
    ])

    expect(rows[0].latestRun?.status).toBe("SUCCESS")
    expect(rows[0].latestRun?.rank).toBe(1)
  })
})
```

- [ ] **Step 2: Run the read-model test to verify it fails**

Run:

```bash
npx vitest run src/lib/monitoring/read-models.test.ts
```

Expected: FAIL because the read-model file does not exist yet.

- [ ] **Step 3: Implement the read-models, active-toggle route, and UI components**

```ts
// src/lib/monitoring/read-models.ts
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export function mapDashboardSnapshot({
  tenantName,
  latestSnapshot,
  recentBatches,
}: {
  tenantName: string
  latestSnapshot: {
    mentionRate: number
    averageRank: number | null
    competitorList: string[]
    anomalyFlags: string[]
  } | null
  recentBatches: Array<{ status: string; createdAt: Date }>
}) {
  return {
    tenantName,
    mentionRate: latestSnapshot?.mentionRate ?? 0,
    averageRank: latestSnapshot?.averageRank ?? null,
    competitorList: latestSnapshot?.competitorList ?? [],
    anomalyFlags: latestSnapshot?.anomalyFlags ?? [],
    lastRunAt: recentBatches[0]?.createdAt ?? null,
    lastRunStatus: recentBatches[0]?.status ?? "NEVER_RUN",
  }
}

export function mapQueryMonitoringRows(
  queries: Array<{
    id: string
    text: string
    active: boolean
    queryRuns: Array<{
      status: string
      mentioned: boolean
      rank: number | null
      createdAt: Date
    }>
  }>
) {
  return queries.map((query) => ({
    id: query.id,
    text: query.text,
    active: query.active,
    latestRun: query.queryRuns[0] ?? null,
  }))
}

export async function getMonitoringDashboardData() {
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()

  const [latestSnapshot, recentBatches] = await Promise.all([
    prisma.insightSnapshot.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.runBatch.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
  ])

  const mapped = mapDashboardSnapshot({
    tenantName: tenant.name,
    latestSnapshot,
    recentBatches,
  })

  return {
    tenant,
    ...mapped,
    lastRunLabel: mapped.lastRunAt
      ? mapped.lastRunAt.toLocaleString("zh-CN", { hour12: false })
      : "还没有自动运行记录",
  }
}

export async function getQueryMonitoringPageData() {
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()

  const queries = await prisma.query.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: {
      queryRuns: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      responses: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return {
    tenant,
    queries: mapQueryMonitoringRows(queries),
  }
}
```

```ts
// src/app/api/queries/[queryId]/route.ts
import { NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const tenant = await getOrCreateTenant()
  const { queryId } = await params
  const body = await req.json()
  const prisma = getPrisma()

  const query = await prisma.query.findFirst({
    where: {
      id: queryId,
      tenantId: tenant.id,
    },
  })

  if (!query) {
    return NextResponse.json({ error: "关键词不存在" }, { status: 404 })
  }

  const updated = await prisma.query.update({
    where: { id: query.id },
    data: { active: Boolean(body.active) },
  })

  return NextResponse.json({ query: updated })
}
```

```tsx
// src/components/run-now-button.tsx
"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

export function RunNowButton() {
  const [running, setRunning] = useState(false)

  async function onRun() {
    setRunning(true)
    try {
      await fetch("/api/monitoring/run", { method: "POST" })
      window.location.reload()
    } finally {
      setRunning(false)
    }
  }

  return (
    <Button onClick={onRun} disabled={running}>
      {running ? "监测运行中..." : "立即运行本轮监测"}
    </Button>
  )
}
```

```tsx
// src/components/query-run-status-badge.tsx
export function QueryRunStatusBadge({ status }: { status: string }) {
  const label =
    status === "SUCCESS" ? "成功" : status === "FAILED" ? "失败" : status === "RUNNING" ? "运行中" : "未运行"

  return <span className="rounded-full border px-2 py-1 text-xs">{label}</span>
}
```

```tsx
// src/components/anomaly-banner.tsx
export function AnomalyBanner({ anomalyFlags }: { anomalyFlags: string[] }) {
  if (anomalyFlags.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      异常提醒：{anomalyFlags.join(" / ")}
    </div>
  )
}
```

```tsx
// src/app/dashboard/page.tsx (replace server load path and header actions)
import { AnomalyBanner } from "@/components/anomaly-banner"
import { RunNowButton } from "@/components/run-now-button"
import { getMonitoringDashboardData } from "@/lib/monitoring/read-models"

export default async function DashboardPage() {
  const dashboard = await getMonitoringDashboardData()

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold">{dashboard.tenant.name}</h1>
          <p className="mt-2 text-muted-foreground">
            最近一次运行：{dashboard.lastRunLabel}
          </p>
        </div>
        <RunNowButton />
      </header>

      <AnomalyBanner anomalyFlags={dashboard.anomalyFlags} />
    </div>
  )
}
```

```tsx
// src/app/dashboard/queries/page.tsx
import { RunNowButton } from "@/components/run-now-button"
import { QueryManager } from "@/components/query-manager"
import { getQueryMonitoringPageData } from "@/lib/monitoring/read-models"

export default async function QueriesPage() {
  const { tenant, queries } = await getQueryMonitoringPageData()

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">关键词监测</h1>
          <p className="mt-2 text-muted-foreground">
            这里展示自动监测状态，手动录入作为补充入口保留。
          </p>
        </div>
        <RunNowButton />
      </div>
      <QueryManager tenant={tenant} initialQueries={queries} />
    </div>
  )
}
```

```tsx
// src/components/query-manager.tsx (new query cards excerpt)
async function toggleQuery(queryId: string, active: boolean) {
  setSaving(true)
  setError(null)

  try {
    const res = await fetch(`/api/queries/${queryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "切换关键词状态失败")
      return
    }

    setQueries((current) =>
      current.map((query) =>
        query.id === queryId ? { ...query, active: data.query.active } : query
      )
    )
  } finally {
    setSaving(false)
  }
}

<div className="flex items-center justify-between gap-3">
  <div>
    <div className="font-medium">{query.text}</div>
    <div className="mt-1 flex items-center gap-2 text-muted-foreground">
      <QueryRunStatusBadge status={query.latestRun?.status ?? "NEVER_RUN"} />
      <span>{query.active ? "已启用自动监测" : "已暂停自动监测"}</span>
    </div>
  </div>
  <Button
    variant="outline"
    disabled={saving}
    onClick={() => toggleQuery(query.id, !query.active)}
  >
    {query.active ? "暂停" : "启用"}
  </Button>
</div>
```

- [ ] **Step 4: Run the read-model test, then lint the UI changes**

Run:

```bash
npx vitest run src/lib/monitoring/read-models.test.ts
npm run lint
```

Expected:

- read-model test PASS
- lint PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/monitoring/read-models.ts src/lib/monitoring/read-models.test.ts src/components/run-now-button.tsx src/components/query-run-status-badge.tsx src/components/anomaly-banner.tsx src/app/api/queries/[queryId]/route.ts src/app/dashboard/page.tsx src/app/dashboard/queries/page.tsx src/components/query-manager.tsx
git commit -m "feat: surface automated monitoring in dashboard and queries"
```

---

### Task 7: Document Env Setup, Cron Setup, and Manual Smoke Checks

**Files:**
- Modify: `.env.example`
- Modify: `deploy/production.env.example`
- Modify: `README.md`

- [ ] **Step 1: Add the monitoring env vars to both env templates**

```env
# .env.example and deploy/production.env.example
OPENAI_API_KEY=
MONITORING_MODEL=gpt-4o-mini
MONITORING_CRON_SECRET=
```

- [ ] **Step 2: Update the README with the automated monitoring setup**

~~~md
## Automated Monitoring (V3 Phase 1)

This project now supports scheduled GEO monitoring with one AI provider.

Required environment variables:

```text
OPENAI_API_KEY=
MONITORING_MODEL=gpt-4o-mini
MONITORING_CRON_SECRET=
```

Local verification flow:

1. Create at least one active query in the dashboard.
2. Click "立即运行本轮监测".
3. Confirm new `RunBatch`, `QueryRun`, and `InsightSnapshot` rows exist.
4. Confirm dashboard mention rate, average rank, and competitors update.

Vercel Cron:

- Route: `/api/internal/monitoring/run`
- Header: `x-monitoring-cron-secret`
- Schedule: `0 */12 * * *`

Long-term note:

The orchestration code is intentionally shared so the scheduler can move to ECS later without rewriting the monitoring core.
~~~

- [ ] **Step 3: Run the full smoke checklist**

Run:

```bash
npm run lint
npm test
npm run build
```

Then perform these manual checks:

1. Sign in and create one active query.
2. Set tenant brand, industry, and region.
3. Click `立即运行本轮监测`.
4. Verify the dashboard shows a non-empty last-run state.
5. Verify a failed provider call still creates a visible failed `QueryRun`.
6. Call the internal route manually with the secret header and confirm JSON success:

```bash
curl -X POST http://localhost:3000/api/internal/monitoring/run \
  -H "x-monitoring-cron-secret: $MONITORING_CRON_SECRET"
```
```

- [ ] **Step 4: Commit**

```bash
git add .env.example deploy/production.env.example README.md
git commit -m "docs: document automated monitoring setup"
```

---

### Task 8: Final Pre-Ship Verification

**Files:**
- Modify: none unless fixes are discovered
- Test: all suites and manual checks above

- [ ] **Step 1: Run the complete automated verification suite**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands PASS.

- [ ] **Step 2: Inspect the migration and changed files before merge**

Run:

```bash
git diff --stat
git diff -- prisma/schema.prisma
git diff -- src/lib/monitoring
```

Expected:

- monitoring changes are isolated to the new feature files
- no unrelated churn in billing/auth files

- [ ] **Step 3: Perform one final end-to-end manual run**

Manual checklist:

1. Run one successful manual batch.
2. Disable one query and confirm it is skipped on the next manual batch.
3. Trigger the Cron route with the correct secret and confirm a second batch appears.
4. Confirm the dashboard anomaly banner appears when a run introduces a lower mention rate or failure.

- [ ] **Step 4: Commit any follow-up fixes**

```bash
git add .
git commit -m "chore: finalize GEO monitoring phase 1 automation"
```

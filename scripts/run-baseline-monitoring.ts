import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config } from "dotenv"

import { analyzeQueryRun } from "../src/lib/analysis/analyze-query-run"
import { getProvider } from "../src/lib/ai/providers"
import {
  buildBaselineAnomalyFlags,
  buildBaselineMarkdownReport,
  calculateBaselineMetrics,
} from "../src/lib/monitoring/baseline-report"
import { parseMonitoringOutput } from "../src/lib/monitoring/parse-monitoring-output"

config({ path: ".env.local" })
config()

// ─────────────────────────────────────────────────────────
// WARNING: 本地开发 / QA 环境专用基线监测脚本
//
// 此脚本会触发真实的 AI Provider API 调用（消耗配额）
// 并向数据库写入监测结果（QueryRun、分析、快照）
//
// 默认在生产环境禁止运行。
// 如需在生产环境执行，请显式设置：
//   ALLOW_PRODUCTION_BASELINE_RUN=true
//
// 不会输出以下内容：
//   - API Key
//   - 完整 DATABASE_URL
//   - CRON_SECRET
//
// ─────────────────────────────────────────────────────────
const DEV_USER_ID = "dev-user-local"
const DEFAULT_LABEL = "晟景装饰上线前基线监测"

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured")
  }
  return process.env.DATABASE_URL
}

function formatError(error: unknown) {
  if (!(error instanceof Error)) return String(error)

  const detail = error as Error & {
    code?: string
    clientVersion?: string
    meta?: unknown
    cause?: unknown
  }

  return JSON.stringify(
    {
      name: error.name,
      message: error.message,
      code: detail.code,
      clientVersion: detail.clientVersion,
      meta: detail.meta,
      cause:
        detail.cause instanceof Error
          ? { name: detail.cause.name, message: detail.cause.message }
          : detail.cause,
    },
    null,
    2
  )
}

function parseArgs() {
  const args = process.argv.slice(2)
  const result: { email?: string; provider: string; source: string } = {
    provider: "deepseek",
    source: "geo-content-center-seed",
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--email") result.email = args[index + 1]
    if (arg === "--provider") result.provider = args[index + 1]
    if (arg === "--source") result.source = args[index + 1]
  }

  if (!result.email) throw new Error("--email is required")
  return result
}

async function main() {
  const { email, provider: providerId, source } = parseArgs()
  const isProduction = process.env.NODE_ENV === "production"
  if (isProduction && process.env.ALLOW_PRODUCTION_BASELINE_RUN !== "true") {
    throw new Error(
      "Baseline monitoring script is guarded for production. " +
      "Set ALLOW_PRODUCTION_BASELINE_RUN=true to override."
    )
  }
  const envLabel = isProduction ? "PRODUCTION" : "DEVELOPMENT"
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  })

  try {
    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: { include: { brandProfile: true } } },
    })

    if (!user) throw new Error(`User not found for email: ${email}`)
    if (user.clerkUserId === DEV_USER_ID) {
      throw new Error("Refusing to run baseline for dev user")
    }
    if (!user.tenant) {
      throw new Error(`Tenant not found for email: ${email}`)
    }

    const tenant = user.tenant
    const brandProfile = tenant.brandProfile
    const queries = await prisma.query.findMany({
      where: {
        tenantId: tenant.id,
        active: true,
        source,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })

    if (queries.length === 0) {
      throw new Error(`No active queries found for source: ${source}`)
    }

    const provider = getProvider(providerId)
    const startedAt = new Date()
    let successCount = 0
    let failureCount = 0

    let batch = await prisma.runBatch.create({
      data: {
        tenantId: tenant.id,
        triggerType: "MANUAL",
        source,
        label: DEFAULT_LABEL,
        status: "RUNNING",
        queryCount: queries.length,
        startedAt,
      },
    })

    for (const query of queries) {
      const queryStartedAt = new Date()
      const prompt = query.text.trim()

      try {
        const result = await provider.invoke({
          prompt,
          model: provider.defaultModel,
          temperature: 0.2,
          timeoutMs: 60_000,
        })
        const parsed = parseMonitoringOutput({
          brandName: brandProfile?.brandName ?? tenant.brandName ?? tenant.name,
          brandAliases: brandProfile?.brandAliases ?? [],
          answer: result.text,
        })

        const queryRun = await prisma.queryRun.create({
          data: {
            batchId: batch.id,
            queryId: query.id,
            provider: provider.id,
            model: provider.defaultModel,
            status: "SUCCESS",
            prompt,
            rawOutput: result.text,
            mentioned: parsed.mentioned,
            rank: parsed.rank,
            competitors: parsed.competitors,
            notes: parsed.notes,
            startedAt: queryStartedAt,
            finishedAt: new Date(),
          },
        })

        await prisma.providerAttempt.create({
          data: {
            queryRunId: queryRun.id,
            attemptNo: 1,
            provider: provider.id,
            model: provider.defaultModel,
            latencyMs: result.latencyMs,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            totalTokens: result.totalTokens,
            rawRequestJson: { prompt },
            rawResponseJson:
              result.rawJson === undefined
                ? undefined
                : JSON.parse(JSON.stringify(result.rawJson)),
          },
        })

        await analyzeQueryRun(queryRun.id)
        successCount += 1
      } catch (error) {
        await prisma.queryRun.create({
          data: {
            batchId: batch.id,
            queryId: query.id,
            provider: provider.id,
            model: provider.defaultModel,
            status: "FAILED",
            prompt,
            mentioned: false,
            competitors: [],
            errorMessage: error instanceof Error ? error.message : "unknown-error",
            startedAt: queryStartedAt,
            finishedAt: new Date(),
          },
        })
        failureCount += 1
      }
    }

    const finalStatus =
      failureCount === 0 ? "SUCCESS" : successCount > 0 ? "PARTIAL_FAILURE" : "FAILED"

    batch = await prisma.runBatch.update({
      where: { id: batch.id },
      data: {
        status: finalStatus,
        queryCount: queries.length,
        successCount,
        failureCount,
        finishedAt: new Date(),
      },
    })

    const runs = await prisma.queryRun.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: "asc" },
      include: {
        query: true,
        analysis: true,
        providerAttempts: {
          orderBy: { createdAt: "asc" },
        },
      },
    })
    const metrics = calculateBaselineMetrics(runs)
    const previousSnapshot = await prisma.insightSnapshot.findFirst({
      where: {
        tenantId: tenant.id,
        batchId: { not: batch.id },
      },
      orderBy: { createdAt: "desc" },
    })
    const trendDirection =
      previousSnapshot === null
        ? "FLAT"
        : metrics.naturalMentionRate > previousSnapshot.mentionRate
          ? "UP"
          : metrics.naturalMentionRate < previousSnapshot.mentionRate
            ? "DOWN"
            : "FLAT"

    const anomalyFlags = buildBaselineAnomalyFlags(runs)
    if (failureCount > 0) anomalyFlags.push("QUERY_RUN_FAILURES")

    const snapshot = await prisma.insightSnapshot.create({
      data: {
        tenantId: tenant.id,
        batchId: batch.id,
        mentionRate: metrics.naturalMentionRate,
        averageRank: metrics.averageRank,
        competitorList: metrics.competitorList,
        trendDirection,
        anomalyFlags,
      },
    })

    const generatedAt = new Date()
    const exportDir = path.resolve("exports/baseline")
    await mkdir(exportDir, { recursive: true })

    const markdownPath = path.join(exportDir, `baseline-${batch.id}.md`)
    const jsonPath = path.join(exportDir, `baseline-${batch.id}.json`)

    await writeFile(
      markdownPath,
      buildBaselineMarkdownReport({
        tenant,
        brandProfile,
        batch,
        runs,
        generatedAt,
      }),
      "utf8"
    )

    await writeFile(
      jsonPath,
      JSON.stringify(
        {
          tenant,
          brandProfile,
          batch,
          snapshot,
          runs,
          metrics,
          generatedAt,
        },
        null,
        2
      ),
      "utf8"
    )

    console.log(
      JSON.stringify(
        {
          environment: envLabel,
          tenantId: tenant.id,
          batchId: batch.id,
          markdownPath,
          jsonPath,
          naturalMentionRate: metrics.naturalMentionRate,
          brandAwarenessAccuracy: metrics.brandAwarenessAccuracy,
          competitorList: metrics.competitorList,
          successCount,
          failureCount,
          devTenantPollution: false,
        },
        null,
        2
      )
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(formatError(error))
  process.exit(1)
})

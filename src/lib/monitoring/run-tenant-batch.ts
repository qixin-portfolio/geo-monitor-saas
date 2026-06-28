import { createHash } from "node:crypto"

import { analyzeQueryRun } from "@/lib/analysis/analyze-query-run"
import { getPrisma } from "@/lib/prisma"

import { buildInsightSnapshot } from "./build-insight-snapshot"
import { buildMonitoringPrompt } from "./build-monitoring-prompt"
import { createProvider, getMonitoringConfig } from "./config"
import { runQuery } from "./run-query"

type RunTenantBatchInput = {
  tenantId: string
  triggerType: "CRON" | "MANUAL"
  batchId?: string
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown-monitoring-error"
}

function hashPrompt(prompt: string) {
  return createHash("sha256").update(prompt).digest("hex")
}

async function failActiveQueryRunsForFailedBatches(tenantId: string) {
  const prisma = getPrisma()
  await prisma.queryRun.updateMany({
    where: {
      status: { in: ["PENDING", "RUNNING"] },
      batch: {
        tenantId,
        status: "FAILED",
      },
    },
    data: {
      status: "FAILED",
      errorMessage: "Parent batch failed before this query run finished.",
      finishedAt: new Date(),
    },
  })
}

async function failActiveQueryRunsInBatch({
  batchId,
  errorMessage,
}: {
  batchId: string
  errorMessage: string
}) {
  const prisma = getPrisma()
  await prisma.queryRun.updateMany({
    where: {
      batchId,
      status: { in: ["PENDING", "RUNNING"] },
    },
    data: {
      status: "FAILED",
      errorMessage,
      finishedAt: new Date(),
    },
  })
}

export async function runTenantBatch({
  tenantId,
  triggerType,
  batchId,
}: RunTenantBatchInput) {
  const prisma = getPrisma()
  await failActiveQueryRunsForFailedBatches(tenantId)

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    include: {
      brandProfile: true,
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
    if (batchId) {
      await prisma.runBatch.update({
        where: { id: batchId },
        data: {
          status: "SUCCESS",
          queryCount: 0,
          successCount: 0,
          failureCount: 0,
          finishedAt: new Date(),
          errorSummary: "No active queries",
        },
      })
    }

    return { tenantId, status: "skipped-no-active-queries" as const }
  }

  const runningBatch = await prisma.runBatch.findFirst({
    where: {
      tenantId,
      status: { in: ["PENDING", "RUNNING"] },
    },
  })

  // If a batch is already running and it's not the one we just created, skip
  if (runningBatch && runningBatch.id !== batchId) {
    return { tenantId, status: "skipped-overlap" as const }
  }

  const startedAt = new Date()
  const batch = batchId
    ? await prisma.runBatch.update({
        where: { id: batchId },
        data: {
          status: "RUNNING",
          queryCount: tenant.queries.length,
          startedAt,
        },
      })
    : await prisma.runBatch.create({
        data: {
          tenantId,
          triggerType,
          status: "RUNNING",
          queryCount: tenant.queries.length,
          startedAt,
        },
      })

  const provider = createProvider()
  const config = getMonitoringConfig()
  const queryRunResults = []

  try {
    for (const query of tenant.queries) {
      const runStartedAt = new Date()
      const prompt = buildMonitoringPrompt({
        queryText: query.text,
      })
      const pendingQueryRun = await prisma.queryRun.create({
        data: {
          batchId: batch.id,
          queryId: query.id,
          provider: config.provider,
          model: config.model,
          status: "RUNNING",
          prompt,
          promptHash: hashPrompt(prompt),
          startedAt: runStartedAt,
        },
      })

      try {
        const result = await runQuery({
          query,
          tenant,
          provider,
          queryRunId: pendingQueryRun.id,
          prompt,
        })

        let queryRun = await prisma.queryRun.update({
          where: { id: pendingQueryRun.id },
          data: {
            provider: result.provider,
            model: result.model,
            status: result.status === "success" ? "SUCCESS" : "FAILED",
            rawOutput: result.rawOutput,
            mentioned: result.mentioned,
            rank: result.rank,
            competitors: result.competitors,
            notes: result.notes,
            errorMessage: result.errorMessage,
            finishedAt: new Date(),
          },
        })

        if (queryRun.status === "SUCCESS") {
          try {
            await analyzeQueryRun(queryRun.id)
            queryRun = await prisma.queryRun.findUniqueOrThrow({
              where: { id: queryRun.id },
            })
          } catch (error) {
            queryRun = await prisma.queryRun.update({
              where: { id: queryRun.id },
              data: {
                status: "FAILED",
                errorMessage: `Analysis failed: ${getErrorMessage(error)}`,
                finishedAt: new Date(),
              },
            })
          }
        }

        queryRunResults.push(queryRun)
      } catch (error) {
        const queryRun = await prisma.queryRun.update({
          where: { id: pendingQueryRun.id },
          data: {
            status: "FAILED",
            errorMessage: getErrorMessage(error),
            finishedAt: new Date(),
          },
        })
        queryRunResults.push(queryRun)
      }
    }
  const previousSnapshot = tenant.insightSnapshots[0]
    ? {
        mentionRate: tenant.insightSnapshots[0].mentionRate,
        averageRank: tenant.insightSnapshots[0].averageRank,
        competitorList: tenant.insightSnapshots[0].competitorList,
        trendDirection: tenant.insightSnapshots[0].trendDirection.toLowerCase() as
          | "up"
          | "flat"
          | "down",
        anomalyFlags: tenant.insightSnapshots[0].anomalyFlags,
      }
    : null

  const snapshot = buildInsightSnapshot({
    previous: previousSnapshot,
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
      trendDirection: snapshot.trendDirection.toUpperCase() as
        | "UP"
        | "FLAT"
        | "DOWN",
      anomalyFlags: snapshot.anomalyFlags,
    },
  })

  const successCount = queryRunResults.filter(
    (item) => item.status === "SUCCESS"
  ).length
  const failureCount = queryRunResults.length - successCount
  const finalStatus =
    failureCount === 0 ? "SUCCESS" : successCount > 0 ? "PARTIAL_FAILURE" : "FAILED"

  await prisma.runBatch.update({
    where: { id: batch.id },
    data: {
      successCount,
      failureCount,
      finishedAt: new Date(),
      status: finalStatus,
    },
  })

  return {
    tenantId,
    status:
      finalStatus === "SUCCESS"
        ? "success"
        : finalStatus === "PARTIAL_FAILURE"
          ? "partial_failure"
          : "failed",
  }
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    await failActiveQueryRunsInBatch({
      batchId: batch.id,
      errorMessage,
    })
    await prisma.runBatch.update({
      where: { id: batch.id },
      data: {
        status: "FAILED",
        errorSummary: errorMessage,
        finishedAt: new Date(),
      },
    })
    throw error
  }
}

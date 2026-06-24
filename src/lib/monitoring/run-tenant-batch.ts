import { getPrisma } from "@/lib/prisma"

import { buildInsightSnapshot } from "./build-insight-snapshot"
import { createProvider } from "./config"
import { runQuery } from "./run-query"

type RunTenantBatchInput = {
  tenantId: string
  triggerType: "CRON" | "MANUAL"
}

export async function runTenantBatch({
  tenantId,
  triggerType,
}: RunTenantBatchInput) {
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

  const startedAt = new Date()
  const batch = await prisma.runBatch.create({
    data: {
      tenantId,
      triggerType,
      status: "RUNNING",
      queryCount: tenant.queries.length,
      startedAt,
    },
  })

  const provider = createProvider()
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
        startedAt,
        finishedAt: new Date(),
      },
    })

    queryRunResults.push(queryRun)
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
}

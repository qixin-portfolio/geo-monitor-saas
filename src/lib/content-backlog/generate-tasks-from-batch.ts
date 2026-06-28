import { analyzeQueryRun } from "@/lib/analysis/analyze-query-run"
import { getPrisma } from "@/lib/prisma"

import { generateGeoContentTasksFromRun } from "./generate-tasks-from-run"
import type { GenerateResult } from "./types"

type GenerateBatchInput = {
  batchId: string
  tenantId?: string
}

export type GenerateBatchResult = GenerateResult & {
  batchId: string
  tenantId: string
  processedRuns: number
  skippedRuns: Array<{ id: string; reason: string }>
}

export async function generateGeoContentTasksFromBatch({
  batchId,
  tenantId,
}: GenerateBatchInput): Promise<GenerateBatchResult> {
  const prisma = getPrisma()
  const batch = await prisma.runBatch.findUnique({
    where: { id: batchId },
    include: {
      queryRuns: {
        orderBy: { createdAt: "asc" },
        include: {
          analysis: true,
        },
      },
    },
  })

  if (!batch) {
    throw new Error(`RunBatch ${batchId} not found`)
  }

  if (tenantId && batch.tenantId !== tenantId) {
    throw new Error("权限错误：该监测批次不属于当前租户")
  }

  const result: GenerateBatchResult = {
    batchId,
    tenantId: batch.tenantId,
    processedRuns: 0,
    skippedRuns: [],
    created: [],
    existing: [],
  }

  for (const run of batch.queryRuns) {
    if (run.status !== "SUCCESS") {
      result.skippedRuns.push({ id: run.id, reason: `status-${run.status}` })
      continue
    }

    if (!run.analysis) {
      try {
        await analyzeQueryRun(run.id)
      } catch (error) {
        result.skippedRuns.push({
          id: run.id,
          reason: error instanceof Error ? error.message : "analysis-failed",
        })
        continue
      }
    }

    const runResult = await generateGeoContentTasksFromRun({
      tenantId: batch.tenantId,
      queryRunId: run.id,
    })

    result.processedRuns += 1
    result.created.push(...runResult.created)
    result.existing.push(...runResult.existing)
  }

  return result
}

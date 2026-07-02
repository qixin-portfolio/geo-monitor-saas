import { NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"
import { runTenantBatch } from "@/lib/monitoring/run-tenant-batch"
import { getOrCreateTenant } from "@/lib/tenant"

async function finalizeCreatedBatchAsFailed({
  batchId,
  tenantId,
  reason,
}: {
  batchId: string
  tenantId: string
  reason: string
}) {
  const prisma = getPrisma()
  const batch = await prisma.runBatch.findFirst({
    where: { id: batchId, tenantId },
    select: {
      id: true,
      queryCount: true,
      successCount: true,
    },
  })

  if (!batch) return null

  const queryCount =
    batch.queryCount > 0
      ? batch.queryCount
      : await prisma.query.count({
          where: { tenantId, active: true },
        })

  await prisma.runBatch.updateMany({
    where: { id: batchId, tenantId },
    data: {
      status: "FAILED",
      queryCount,
      failureCount: Math.max(queryCount - batch.successCount, 0),
      errorSummary: reason,
      finishedAt: new Date(),
    },
  })

  return prisma.runBatch.findFirst({
    where: { id: batchId, tenantId },
    select: {
      id: true,
      status: true,
      queryCount: true,
      successCount: true,
      failureCount: true,
    },
  })
}

export async function POST() {
  const prisma = getPrisma()
  const tenant = await getOrCreateTenant()

  // Check for overlap: skip if a batch is already running
  const runningBatch = await prisma.runBatch.findFirst({
    where: {
      tenantId: tenant.id,
      status: { in: ["PENDING", "RUNNING"] },
    },
  })

  if (runningBatch) {
    return NextResponse.json({
      batchId: runningBatch.id,
      status: "already-running",
    })
  }

  const batch = await prisma.runBatch.create({
    data: {
      tenantId: tenant.id,
      triggerType: "MANUAL",
      status: "PENDING",
      queryCount: 0,
      startedAt: new Date(),
    },
  })

  let runnerResult: Awaited<ReturnType<typeof runTenantBatch>>

  try {
    runnerResult = await runTenantBatch({
      tenantId: tenant.id,
      triggerType: "MANUAL",
      batchId: batch.id,
    })
  } catch {
    const failedBatch = await finalizeCreatedBatchAsFailed({
      batchId: batch.id,
      tenantId: tenant.id,
      reason: "Manual monitoring runner failed.",
    })

    return NextResponse.json(
      {
        batchId: batch.id,
        status: failedBatch?.status ?? "FAILED",
        queryCount: failedBatch?.queryCount ?? 0,
        successCount: failedBatch?.successCount ?? 0,
        failureCount: failedBatch?.failureCount ?? 0,
        error: "Manual monitoring run failed.",
      },
      { status: 500 }
    )
  }

  if (runnerResult.status === "skipped-overlap") {
    const failedBatch = await finalizeCreatedBatchAsFailed({
      batchId: batch.id,
      tenantId: tenant.id,
      reason: "Skipped because another monitoring batch is already running.",
    })

    return NextResponse.json({
      batchId: batch.id,
      status: failedBatch?.status ?? "FAILED",
      queryCount: failedBatch?.queryCount ?? 0,
      successCount: failedBatch?.successCount ?? 0,
      failureCount: failedBatch?.failureCount ?? 0,
    })
  }

  try {
    const finishedBatch = await prisma.runBatch.findFirst({
      where: { id: batch.id, tenantId: tenant.id },
      select: {
        id: true,
        status: true,
        queryCount: true,
        successCount: true,
        failureCount: true,
      },
    })

    return NextResponse.json({
      batchId: batch.id,
      status: finishedBatch?.status ?? "UNKNOWN",
      queryCount: finishedBatch?.queryCount ?? 0,
      successCount: finishedBatch?.successCount ?? 0,
      failureCount: finishedBatch?.failureCount ?? 0,
    })
  } catch {
    return NextResponse.json(
      {
        batchId: batch.id,
        status: "UNKNOWN",
        error: "Manual monitoring run finished, but final status could not be read.",
      },
      { status: 500 }
    )
  }
}

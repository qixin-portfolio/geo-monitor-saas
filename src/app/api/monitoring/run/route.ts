import { NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"
import { runTenantBatch } from "@/lib/monitoring/run-tenant-batch"
import { getOrCreateTenant } from "@/lib/tenant"

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

  try {
    await runTenantBatch({
      tenantId: tenant.id,
      triggerType: "MANUAL",
      batchId: batch.id,
    })

    const finishedBatch = await prisma.runBatch.findUnique({
      where: { id: batch.id },
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
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown-monitoring-error"
    const failedBatch = await prisma.runBatch.update({
      where: { id: batch.id },
      data: {
        status: "FAILED",
        errorSummary: message,
        finishedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        queryCount: true,
        successCount: true,
        failureCount: true,
      },
    })

    return NextResponse.json(
      {
        batchId: failedBatch.id,
        status: failedBatch.status,
        queryCount: failedBatch.queryCount,
        successCount: failedBatch.successCount,
        failureCount: failedBatch.failureCount,
        error: "Manual monitoring run failed.",
      },
      { status: 500 }
    )
  }
}

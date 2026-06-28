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

  // Create a PENDING batch immediately and return
  const batch = await prisma.runBatch.create({
    data: {
      tenantId: tenant.id,
      triggerType: "MANUAL",
      status: "PENDING",
      queryCount: 0,
      startedAt: new Date(),
    },
  })

  // Fire-and-forget: run the batch in the background
  runTenantBatch({
    tenantId: tenant.id,
    triggerType: "MANUAL",
    batchId: batch.id,
  }).catch((err) => {
    console.error("[monitoring/run] Background batch failed:", err)
  })

  return NextResponse.json({
    batchId: batch.id,
    status: "started",
  })
}

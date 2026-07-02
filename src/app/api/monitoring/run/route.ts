import { NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export async function POST() {
  const prisma = getPrisma()
  const tenant = await getOrCreateTenant()

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

  const { batch, job } = await prisma.$transaction(async (tx) => {
    const batch = await tx.runBatch.create({
      data: {
        tenantId: tenant.id,
        triggerType: "MANUAL",
        status: "PENDING",
        queryCount: 0,
      },
    })

    const job = await tx.monitoringJob.create({
      data: {
        tenantId: tenant.id,
        batchId: batch.id,
        status: "PENDING",
        payload: {
          triggerType: "MANUAL",
        },
      },
    })

    return { batch, job }
  })

  return NextResponse.json({
    batchId: batch.id,
    jobId: job.id,
    status: "queued",
  })
}

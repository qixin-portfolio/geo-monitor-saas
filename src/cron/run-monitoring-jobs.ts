import { getPrisma } from "@/lib/prisma"
import { runTenantBatch } from "@/lib/monitoring/run-tenant-batch"

type MonitoringJobStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown-monitoring-job-error"
}

async function updateJobStatus({
  id,
  tenantId,
  fromStatus,
  toStatus,
}: {
  id: string
  tenantId: string
  fromStatus?: MonitoringJobStatus
  toStatus: MonitoringJobStatus
}) {
  const prisma = getPrisma()
  const where: {
    id: string
    tenantId: string
    status?: MonitoringJobStatus
  } = {
    id,
    tenantId,
  }

  if (fromStatus) where.status = fromStatus

  const result = await prisma.monitoringJob.updateMany({
    where,
    data: { status: toStatus },
  })

  return result.count === 1
}

async function failBatchIfActive({
  batchId,
  tenantId,
  errorSummary,
}: {
  batchId: string
  tenantId: string
  errorSummary: string
}) {
  const prisma = getPrisma()
  await prisma.runBatch.updateMany({
    where: {
      id: batchId,
      tenantId,
      status: { in: ["PENDING", "RUNNING"] },
    },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      errorSummary,
    },
  })
}

function getJobTerminalStatus(batchStatus: string) {
  return batchStatus === "FAILED" ? "FAILED" : "DONE"
}

async function runMonitoringJob(job: {
  id: string
  tenantId: string
  batchId: string
}) {
  const prisma = getPrisma()
  const claimed = await updateJobStatus({
    id: job.id,
    tenantId: job.tenantId,
    fromStatus: "PENDING",
    toStatus: "RUNNING",
  })

  if (!claimed) {
    return "skipped-claim-lost" as const
  }

  try {
    const batch = await prisma.runBatch.findFirst({
      where: {
        id: job.batchId,
        tenantId: job.tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        status: true,
        triggerType: true,
      },
    })

    if (!batch) {
      await updateJobStatus({
        id: job.id,
        tenantId: job.tenantId,
        fromStatus: "RUNNING",
        toStatus: "FAILED",
      })
      return "failed" as const
    }

    if (!["PENDING", "RUNNING"].includes(batch.status)) {
      await updateJobStatus({
        id: job.id,
        tenantId: job.tenantId,
        fromStatus: "RUNNING",
        toStatus: getJobTerminalStatus(batch.status),
      })
      return batch.status === "FAILED" ? ("failed" as const) : ("done" as const)
    }

    const result = await runTenantBatch({
      tenantId: job.tenantId,
      triggerType: batch.triggerType,
      batchId: batch.id,
    })

    if (result.status === "skipped-overlap") {
      await failBatchIfActive({
        batchId: batch.id,
        tenantId: job.tenantId,
        errorSummary: "Skipped because another monitoring batch is already running.",
      })
      await updateJobStatus({
        id: job.id,
        tenantId: job.tenantId,
        fromStatus: "RUNNING",
        toStatus: "FAILED",
      })
      return "failed" as const
    }

    await updateJobStatus({
      id: job.id,
      tenantId: job.tenantId,
      fromStatus: "RUNNING",
      toStatus: result.status === "failed" ? "FAILED" : "DONE",
    })

    return result.status === "failed" ? ("failed" as const) : ("done" as const)
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    await failBatchIfActive({
      batchId: job.batchId,
      tenantId: job.tenantId,
      errorSummary: errorMessage,
    })
    await updateJobStatus({
      id: job.id,
      tenantId: job.tenantId,
      fromStatus: "RUNNING",
      toStatus: "FAILED",
    })
    return "failed" as const
  }
}

export async function runMonitoringJobs({ limit = 10 }: { limit?: number } = {}) {
  const prisma = getPrisma()
  const pendingJobs = await prisma.monitoringJob.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      tenantId: true,
      batchId: true,
    },
  })

  let claimedJobs = 0
  let doneJobs = 0
  let failedJobs = 0

  for (const job of pendingJobs) {
    const status = await runMonitoringJob(job)

    if (status === "skipped-claim-lost") {
      continue
    }

    claimedJobs += 1
    if (status === "done") {
      doneJobs += 1
    } else {
      failedJobs += 1
    }
  }

  return {
    claimedJobs,
    doneJobs,
    failedJobs,
  }
}

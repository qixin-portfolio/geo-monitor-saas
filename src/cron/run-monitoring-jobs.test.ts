import { afterEach, describe, expect, it, vi } from "vitest"

const prismaMock = vi.hoisted(() => ({
  monitoringJob: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
  runBatch: {
    findFirst: vi.fn(),
    updateMany: vi.fn(),
  },
}))

const runTenantBatchMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => prismaMock,
}))

vi.mock("@/lib/monitoring/run-tenant-batch", () => ({
  runTenantBatch: runTenantBatchMock,
}))

import { runMonitoringJobs } from "./run-monitoring-jobs"

describe("runMonitoringJobs", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("runs pending monitoring jobs in created order", async () => {
    prismaMock.monitoringJob.findMany.mockResolvedValueOnce([])

    await runMonitoringJobs({ limit: 5 })

    expect(prismaMock.monitoringJob.findMany).toHaveBeenCalledWith({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: {
        id: true,
        tenantId: true,
        batchId: true,
      },
    })
  })

  it("marks a job DONE after a successful batch run", async () => {
    prismaMock.monitoringJob.findMany.mockResolvedValueOnce([
      { id: "job_1", tenantId: "tenant_1", batchId: "batch_1" },
    ])
    prismaMock.monitoringJob.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
    prismaMock.runBatch.findFirst.mockResolvedValueOnce({
      id: "batch_1",
      tenantId: "tenant_1",
      status: "PENDING",
      triggerType: "MANUAL",
    })
    runTenantBatchMock.mockResolvedValueOnce({
      tenantId: "tenant_1",
      status: "success",
    })

    const result = await runMonitoringJobs()

    expect(result).toEqual({
      claimedJobs: 1,
      doneJobs: 1,
      failedJobs: 0,
    })
    expect(prismaMock.monitoringJob.updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: "job_1",
        tenantId: "tenant_1",
        status: "PENDING",
      },
      data: { status: "RUNNING" },
    })
    expect(runTenantBatchMock).toHaveBeenCalledWith({
      tenantId: "tenant_1",
      triggerType: "MANUAL",
      batchId: "batch_1",
    })
    expect(prismaMock.monitoringJob.updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: "job_1",
        tenantId: "tenant_1",
        status: "RUNNING",
      },
      data: { status: "DONE" },
    })
  })

  it("skips a job when another worker already claimed it by status", async () => {
    prismaMock.monitoringJob.findMany.mockResolvedValueOnce([
      { id: "job_1", tenantId: "tenant_1", batchId: "batch_1" },
    ])
    prismaMock.monitoringJob.updateMany.mockResolvedValueOnce({ count: 0 })

    const result = await runMonitoringJobs()

    expect(result).toEqual({
      claimedJobs: 0,
      doneJobs: 0,
      failedJobs: 0,
    })
    expect(runTenantBatchMock).not.toHaveBeenCalled()
  })

  it("marks the job and active batch FAILED when the runner throws", async () => {
    prismaMock.monitoringJob.findMany.mockResolvedValueOnce([
      { id: "job_1", tenantId: "tenant_1", batchId: "batch_1" },
    ])
    prismaMock.monitoringJob.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
    prismaMock.runBatch.findFirst.mockResolvedValueOnce({
      id: "batch_1",
      tenantId: "tenant_1",
      status: "PENDING",
      triggerType: "MANUAL",
    })
    prismaMock.runBatch.updateMany.mockResolvedValueOnce({ count: 1 })
    runTenantBatchMock.mockRejectedValueOnce(new Error("runner failed"))

    const result = await runMonitoringJobs()

    expect(result.failedJobs).toBe(1)
    expect(prismaMock.runBatch.updateMany).toHaveBeenCalledWith({
      where: {
        id: "batch_1",
        tenantId: "tenant_1",
        status: { in: ["PENDING", "RUNNING"] },
      },
      data: {
        status: "FAILED",
        finishedAt: expect.any(Date),
        errorSummary: "runner failed",
      },
    })
    expect(prismaMock.monitoringJob.updateMany).toHaveBeenLastCalledWith({
      where: {
        id: "job_1",
        tenantId: "tenant_1",
        status: "RUNNING",
      },
      data: { status: "FAILED" },
    })
  })

  it("keeps missing batch fallback tenant-scoped", async () => {
    prismaMock.monitoringJob.findMany.mockResolvedValueOnce([
      { id: "job_1", tenantId: "tenant_1", batchId: "batch_1" },
    ])
    prismaMock.monitoringJob.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
    prismaMock.runBatch.findFirst.mockResolvedValueOnce(null)

    const result = await runMonitoringJobs()

    expect(result.failedJobs).toBe(1)
    expect(prismaMock.runBatch.findFirst).toHaveBeenCalledWith({
      where: {
        id: "batch_1",
        tenantId: "tenant_1",
      },
      select: {
        id: true,
        tenantId: true,
        status: true,
        triggerType: true,
      },
    })
    expect(prismaMock.monitoringJob.updateMany).toHaveBeenLastCalledWith({
      where: {
        id: "job_1",
        tenantId: "tenant_1",
        status: "RUNNING",
      },
      data: { status: "FAILED" },
    })
  })
})

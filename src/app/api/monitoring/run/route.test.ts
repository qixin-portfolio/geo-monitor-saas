import { afterEach, describe, expect, it, vi } from "vitest"

const findFirstMock = vi.hoisted(() => vi.fn())
const createBatchMock = vi.hoisted(() => vi.fn())
const createJobMock = vi.hoisted(() => vi.fn())
const transactionMock = vi.hoisted(() =>
  vi.fn((callback) =>
    callback({
      runBatch: {
        create: createBatchMock,
      },
      monitoringJob: {
        create: createJobMock,
      },
    })
  )
)
const getTenantMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    $transaction: transactionMock,
    runBatch: {
      findFirst: findFirstMock,
    },
  }),
}))

vi.mock("@/lib/tenant", () => ({
  getOrCreateTenant: getTenantMock,
}))

import { POST } from "./route"

describe("POST /api/monitoring/run", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns the active batch when monitoring is already queued or running", async () => {
    getTenantMock.mockResolvedValueOnce({ id: "tenant_1" })
    findFirstMock.mockResolvedValueOnce({ id: "batch_1" })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      batchId: "batch_1",
      status: "already-running",
    })
    expect(transactionMock).not.toHaveBeenCalled()
    expect(createBatchMock).not.toHaveBeenCalled()
    expect(createJobMock).not.toHaveBeenCalled()
  })

  it("creates a pending batch and monitoring job without executing the batch", async () => {
    getTenantMock.mockResolvedValueOnce({ id: "tenant_1" })
    findFirstMock.mockResolvedValueOnce(null)
    createBatchMock.mockResolvedValueOnce({ id: "batch_2" })
    createJobMock.mockResolvedValueOnce({ id: "job_1" })

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(transactionMock).toHaveBeenCalledOnce()
    expect(createBatchMock).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant_1",
        triggerType: "MANUAL",
        status: "PENDING",
        queryCount: 0,
      },
    })
    expect(createJobMock).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant_1",
        batchId: "batch_2",
        status: "PENDING",
        payload: {
          triggerType: "MANUAL",
        },
      },
    })
    expect(data).toEqual({
      batchId: "batch_2",
      jobId: "job_1",
      status: "queued",
    })
  })
})

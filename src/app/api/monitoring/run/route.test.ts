import { describe, expect, it, vi, afterEach } from "vitest"

const findFirstMock = vi.hoisted(() => vi.fn())
const createMock = vi.hoisted(() => vi.fn())
const findUniqueMock = vi.hoisted(() => vi.fn())
const updateMock = vi.hoisted(() => vi.fn())
const runTenantBatchMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    runBatch: {
      findFirst: findFirstMock,
      create: createMock,
      findUnique: findUniqueMock,
      update: updateMock,
    },
  }),
}))

vi.mock("@/lib/tenant", () => ({
  getOrCreateTenant: vi.fn().mockResolvedValue({ id: "tenant_1" }),
}))

vi.mock("@/lib/monitoring/run-tenant-batch", () => ({
  runTenantBatch: runTenantBatchMock,
}))

import { POST } from "./route"

describe("POST /api/monitoring/run", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("awaits the manual batch before returning final counts", async () => {
    let batchFinished = false
    findFirstMock.mockResolvedValueOnce(null)
    createMock.mockResolvedValueOnce({ id: "batch_1" })
    runTenantBatchMock.mockImplementationOnce(async () => {
      await Promise.resolve()
      batchFinished = true
      return { tenantId: "tenant_1", status: "failed" }
    })
    findUniqueMock.mockResolvedValueOnce({
      id: "batch_1",
      status: "FAILED",
      queryCount: 3,
      successCount: 0,
      failureCount: 3,
    })

    const response = await POST()
    const body = await response.json()

    expect(batchFinished).toBe(true)
    expect(runTenantBatchMock).toHaveBeenCalledWith({
      tenantId: "tenant_1",
      triggerType: "MANUAL",
      batchId: "batch_1",
    })
    expect(body).toMatchObject({
      batchId: "batch_1",
      status: "FAILED",
      queryCount: 3,
      successCount: 0,
      failureCount: 3,
    })
  })

  it("marks the created batch failed when the runner throws", async () => {
    findFirstMock.mockResolvedValueOnce(null)
    createMock.mockResolvedValueOnce({ id: "batch_1" })
    runTenantBatchMock.mockRejectedValueOnce(new Error("provider-down"))
    updateMock.mockResolvedValueOnce({
      id: "batch_1",
      status: "FAILED",
      queryCount: 1,
      successCount: 0,
      failureCount: 0,
    })

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "batch_1" },
        data: expect.objectContaining({
          status: "FAILED",
          errorSummary: "provider-down",
        }),
      })
    )
    expect(body.error).toBe("Manual monitoring run failed.")
    expect(body.status).toBe("FAILED")
  })
})

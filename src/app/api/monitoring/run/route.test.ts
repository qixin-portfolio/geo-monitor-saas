import { describe, expect, it, vi, afterEach } from "vitest"

const findFirstMock = vi.hoisted(() => vi.fn())
const createMock = vi.hoisted(() => vi.fn())
const updateManyMock = vi.hoisted(() => vi.fn())
const queryCountMock = vi.hoisted(() => vi.fn())
const runTenantBatchMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    query: {
      count: queryCountMock,
    },
    runBatch: {
      findFirst: findFirstMock,
      create: createMock,
      updateMany: updateManyMock,
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
    findFirstMock.mockResolvedValueOnce({
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

  it("finalizes the created batch when the runner skips for overlap", async () => {
    findFirstMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "batch_1",
        queryCount: 0,
        successCount: 0,
      })
      .mockResolvedValueOnce({
        id: "batch_1",
        status: "FAILED",
        queryCount: 3,
        successCount: 0,
        failureCount: 3,
      })
    queryCountMock.mockResolvedValueOnce(3)
    createMock.mockResolvedValueOnce({ id: "batch_1" })
    runTenantBatchMock.mockResolvedValueOnce({
      tenantId: "tenant_1",
      status: "skipped-overlap",
    })

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "batch_1", tenantId: "tenant_1" },
        data: expect.objectContaining({
          status: "FAILED",
          queryCount: 3,
          failureCount: 3,
          errorSummary: "Skipped because another monitoring batch is already running.",
        }),
      })
    )
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
      .mockResolvedValueOnce({
        id: "batch_1",
        queryCount: 1,
        successCount: 0,
      })
      .mockResolvedValueOnce({
        id: "batch_1",
        status: "FAILED",
        queryCount: 1,
        successCount: 0,
        failureCount: 1,
      })
    createMock.mockResolvedValueOnce({ id: "batch_1" })
    runTenantBatchMock.mockRejectedValueOnce(
      new Error("provider-down OPENAI_API_KEY=secret")
    )

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "batch_1", tenantId: "tenant_1" },
        data: expect.objectContaining({
          status: "FAILED",
          failureCount: 1,
        }),
      })
    )
    expect(body.error).toBe("Manual monitoring run failed.")
    expect(body.status).toBe("FAILED")
    expect(body.failureCount).toBe(1)
    expect(JSON.stringify(body)).not.toContain("OPENAI_API_KEY")
  })

  it("does not overwrite a finalized batch when the final read fails", async () => {
    findFirstMock.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("read-down"))
    createMock.mockResolvedValueOnce({ id: "batch_1" })
    runTenantBatchMock.mockResolvedValueOnce({
      tenantId: "tenant_1",
      status: "success",
    })

    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(updateManyMock).not.toHaveBeenCalled()
    expect(body).toMatchObject({
      batchId: "batch_1",
      status: "UNKNOWN",
      error: "Manual monitoring run finished, but final status could not be read.",
    })
  })
})

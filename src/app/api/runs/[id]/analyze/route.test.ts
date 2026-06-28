import { describe, expect, it, vi } from "vitest"

const findFirstMock = vi.hoisted(() => vi.fn())
const analyzeQueryRunMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    queryRun: {
      findFirst: findFirstMock,
    },
  }),
}))

vi.mock("@/lib/tenant", () => ({
  getOrCreateTenant: vi.fn().mockResolvedValue({ id: "tenant_1" }),
}))

vi.mock("@/lib/analysis/analyze-query-run", () => ({
  analyzeQueryRun: analyzeQueryRunMock,
}))

import { POST } from "./route"

describe("POST /api/runs/[id]/analyze", () => {
  it("does not allow analyzing a run from another tenant", async () => {
    findFirstMock.mockResolvedValueOnce(null)

    const response = await POST(
      new Request("http://localhost/api/runs/run_2/analyze", { method: "POST" }),
      { params: Promise.resolve({ id: "run_2" }) }
    )

    expect(response.status).toBe(404)
    expect(analyzeQueryRunMock).not.toHaveBeenCalled()
    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "run_2",
          query: { tenantId: "tenant_1" },
        }),
      })
    )
  })

  it("analyzes successful runs owned by the current tenant", async () => {
    findFirstMock.mockResolvedValueOnce({ id: "run_1", status: "SUCCESS" })
    analyzeQueryRunMock.mockResolvedValueOnce({ id: "analysis_1" })

    const response = await POST(
      new Request("http://localhost/api/runs/run_1/analyze", { method: "POST" }),
      { params: Promise.resolve({ id: "run_1" }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.analysis.id).toBe("analysis_1")
    expect(analyzeQueryRunMock).toHaveBeenCalledWith("run_1")
  })
})

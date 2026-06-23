import { describe, expect, it, vi } from "vitest"

import { runTenantBatch } from "./run-tenant-batch"

vi.mock("./run-tenant-batch", () => ({
  runTenantBatch: vi.fn(),
}))

describe("runAllTenants", () => {
  it("continues when one tenant batch fails", async () => {
    vi.mocked(runTenantBatch)
      .mockResolvedValueOnce({ tenantId: "tenant_1", status: "success" })
      .mockRejectedValueOnce(new Error("tenant-2-failed"))

    const { runAllTenants } = await import("./run-all-tenants")

    const result = await runAllTenants({
      tenants: [{ id: "tenant_1" }, { id: "tenant_2" }],
    })

    expect(result.processedTenants).toBe(2)
    expect(result.failedTenants).toBe(1)
  })
})

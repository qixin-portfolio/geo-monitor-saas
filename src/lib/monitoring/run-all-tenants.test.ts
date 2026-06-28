import { describe, expect, it, vi } from "vitest"

import { runTenantBatch } from "./run-tenant-batch"

const findManyMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    tenant: {
      findMany: findManyMock,
    },
  }),
}))

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

  it("skips the local dev tenant by default when discovering tenants", async () => {
    delete process.env.MONITORING_INCLUDE_DEV_TENANT
    findManyMock.mockResolvedValueOnce([{ id: "tenant_1" }])
    vi.mocked(runTenantBatch).mockResolvedValueOnce({
      tenantId: "tenant_1",
      status: "success",
    })

    const { runAllTenants } = await import("./run-all-tenants")

    const result = await runAllTenants()

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          queries: { some: { active: true } },
          users: { none: { clerkUserId: "dev-user-local" } },
        }),
      })
    )
    expect(result.processedTenants).toBe(1)
  })
})

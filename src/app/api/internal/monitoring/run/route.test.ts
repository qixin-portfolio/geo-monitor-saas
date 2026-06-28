import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/monitoring/run-all-tenants", () => ({
  runAllTenants: vi.fn().mockResolvedValue({ processedTenants: 1, failedTenants: 0 }),
}))

import { runAllTenants } from "@/lib/monitoring/run-all-tenants"

import { GET, POST } from "./route"

describe("POST /api/internal/monitoring/run", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET
    delete process.env.MONITORING_CRON_SECRET
    vi.clearAllMocks()
  })

  it("rejects requests without the cron secret", async () => {
    process.env.MONITORING_CRON_SECRET = "top-secret"

    const response = await POST(
      new Request("http://localhost/api/internal/monitoring/run", {
        method: "POST",
      })
    )

    expect(response.status).toBe(401)
  })

  it("accepts Vercel Cron GET requests with a bearer token", async () => {
    process.env.CRON_SECRET = "top-secret"

    const response = await GET(
      new Request("http://localhost/api/internal/monitoring/run", {
        method: "GET",
        headers: { authorization: "Bearer top-secret" },
      })
    )

    expect(response.status).toBe(200)
    expect(runAllTenants).toHaveBeenCalledOnce()
  })

  it("keeps the legacy local POST header working", async () => {
    process.env.MONITORING_CRON_SECRET = "top-secret"

    const response = await POST(
      new Request("http://localhost/api/internal/monitoring/run", {
        method: "POST",
        headers: { "x-monitoring-cron-secret": "top-secret" },
      })
    )

    expect(response.status).toBe(200)
    expect(runAllTenants).toHaveBeenCalledOnce()
  })
})

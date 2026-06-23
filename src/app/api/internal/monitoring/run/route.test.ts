import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/monitoring/run-all-tenants", () => ({
  runAllTenants: vi.fn().mockResolvedValue({ processedTenants: 1, failedTenants: 0 }),
}))

import { POST } from "./route"

describe("POST /api/internal/monitoring/run", () => {
  it("rejects requests without the cron secret", async () => {
    process.env.MONITORING_CRON_SECRET = "top-secret"

    const response = await POST(
      new Request("http://localhost/api/internal/monitoring/run", {
        method: "POST",
      })
    )

    expect(response.status).toBe(401)
  })
})

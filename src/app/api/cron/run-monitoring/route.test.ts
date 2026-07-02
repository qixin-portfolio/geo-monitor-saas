import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/cron/run-monitoring-jobs", () => ({
  runMonitoringJobs: vi.fn().mockResolvedValue({
    claimedJobs: 1,
    doneJobs: 1,
    failedJobs: 0,
  }),
}))

import { runMonitoringJobs } from "@/cron/run-monitoring-jobs"

import { GET, POST } from "./route"

describe("cron monitoring route", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET
    delete process.env.MONITORING_CRON_SECRET
    vi.clearAllMocks()
  })

  it("rejects requests without the cron secret", async () => {
    process.env.MONITORING_CRON_SECRET = "top-secret"

    const response = await POST(
      new Request("http://localhost/api/cron/run-monitoring", {
        method: "POST",
      })
    )

    expect(response.status).toBe(401)
  })

  it("accepts bearer token cron requests and runs the worker", async () => {
    process.env.CRON_SECRET = "top-secret"

    const response = await GET(
      new Request("http://localhost/api/cron/run-monitoring", {
        method: "GET",
        headers: { authorization: "Bearer top-secret" },
      })
    )

    expect(response.status).toBe(200)
    expect(runMonitoringJobs).toHaveBeenCalledOnce()
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})

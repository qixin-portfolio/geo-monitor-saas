import { afterEach, describe, expect, it, vi } from "vitest"

import { getMonitoringConfig } from "./config"

describe("getMonitoringConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("uses the Doubao Ark endpoint id as the default ark model", () => {
    vi.stubEnv("MONITORING_PROVIDER", "ark")
    vi.stubEnv("MONITORING_MODEL", "")

    expect(getMonitoringConfig()).toEqual(
      expect.objectContaining({
        provider: "ark",
        model: "doubao-seed-2-1-pro-260628",
      })
    )
  })
})

import { describe, expect, it } from "vitest"

import { parseMonitoringOutput } from "./parse-monitoring-output"

describe("parseMonitoringOutput", () => {
  it("detects mention, rank, and competitors", () => {
    const result = parseMonitoringOutput({
      brandName: "晟景装饰",
      answer: `1. 晟景装饰：本地案例多\n2. 交城宜家装饰：设计现代\n3. 星河装修：施工稳定`,
    })

    expect(result.mentioned).toBe(true)
    expect(result.rank).toBe(1)
    expect(result.competitors).toEqual(["交城宜家装饰", "星河装修"])
  })

  it("returns null rank when the answer is unstructured", () => {
    const result = parseMonitoringOutput({
      brandName: "晟景装饰",
      answer: "晟景装饰口碑不错，也可以再看看其他品牌。",
    })

    expect(result.mentioned).toBe(true)
    expect(result.rank).toBeNull()
  })
})

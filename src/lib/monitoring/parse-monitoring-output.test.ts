import { describe, expect, it } from "vitest"

import { parseMonitoringOutput } from "./parse-monitoring-output"

describe("parseMonitoringOutput", () => {
  it("detects mention, rank, and competitors", () => {
    const result = parseMonitoringOutput({
      brandName: "晟景装饰",
      answer: `1. 晟景装饰：本地案例多\n2. 交城宜家装饰：设计现代\n3. 星河装修公司：施工稳定`,
    })

    expect(result.mentioned).toBe(true)
    expect(result.rank).toBe(1)
    expect(result.competitors).toEqual(["交城宜家装饰", "星河装修公司"])
  })

  it("returns null rank when the answer is unstructured", () => {
    const result = parseMonitoringOutput({
      brandName: "晟景装饰",
      answer: "晟景装饰口碑不错，也可以再看看其他品牌。",
    })

    expect(result.mentioned).toBe(true)
    expect(result.rank).toBeNull()
  })

  it("detects brand mentions and rank through markdown formatting", () => {
    const result = parseMonitoringOutput({
      brandName: "晟景装饰",
      answer: `**第2名：晟景装饰**\n理由：透明工地更新稳定。`,
    })

    expect(result.mentioned).toBe(true)
    expect(result.rank).toBe(2)
  })

  it("does not treat generic renovation phrases as competitors", () => {
    const result = parseMonitoringOutput({
      brandName: "晟景装饰",
      answer: [
        "在交城选择靠谱的装修公司，建议先看平台口碑。",
        "1. 先看本地装修案例",
        "2. 免费设计不一定靠谱",
        "3. 0元设计后期可能收费",
        "4. 2024年刚装修的业主评价更可信",
        "5. 不太看重花哨设计",
        "6. 你家装修要看预算",
        "7. 里面经常有业主分享装修",
        "3. 交城宜家装饰：可以作为对比",
        "4. 今朝装饰：全国连锁，可了解",
      ].join("\n"),
    })

    expect(result.mentioned).toBe(false)
    expect(result.competitors).toEqual(["交城宜家装饰", "今朝装饰"])
  })
})

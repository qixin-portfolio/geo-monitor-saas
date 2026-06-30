import { describe, expect, it } from "vitest"

import { extractAnswerSources } from "./extract-answer-sources"

describe("extractAnswerSources", () => {
  it("extracts sources from citationsJson", () => {
    const sources = extractAnswerSources({
      citationsJson: [
        {
          url: "https://www.example.com/cases",
          title: "官网案例页",
          snippet: "官网展示透明工地案例",
        },
      ],
      ownedDomains: ["example.com"],
    })

    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatchObject({
      domain: "example.com",
      sourceType: "official_site",
      isOwned: true,
      extractionMethod: "citations_json",
    })
  })

  it("returns an empty list when there is no structured citation or URL", () => {
    expect(extractAnswerSources({ citationsJson: null, answer: "没有 URL 的回答" })).toEqual([])
  })

  it("extracts URL sources from answer text", () => {
    const sources = extractAnswerSources({
      answer: "参考 https://www.xiaohongshu.com/explore/abc 的笔记。",
    })

    expect(sources[0]).toMatchObject({
      domain: "xiaohongshu.com",
      sourceType: "xiaohongshu",
      extractionMethod: "answer_url",
    })
  })
})

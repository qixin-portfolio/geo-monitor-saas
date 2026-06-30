import { describe, expect, it } from "vitest"

import { extractAnswerSources } from "./extract-answer-sources"
import { realRunSamples } from "./fixtures/real-run-samples"

describe("extractAnswerSources", () => {
  it("extracts sources from citationsJson", () => {
    const sample = realRunSamples.citationsArray
    const sources = extractAnswerSources({
      citationsJson: sample.citationsJson,
      ownedDomains: sample.ownedDomains,
    })

    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatchObject({
      domain: "brand.example",
      sourceType: "official_site",
      isOwned: true,
      extractionMethod: "citations_json",
    })
  })

  it("extracts sources from stringified citationsJson", () => {
    const sample = realRunSamples.citationsStringified
    const sources = extractAnswerSources({
      citationsJson: sample.citationsJson,
      ownedDomains: sample.ownedDomains,
    })

    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatchObject({
      domain: "brand.example",
      sourceType: "official_site",
      extractionMethod: "citations_json",
    })
  })

  it("extracts sources from nested sourcesJson", () => {
    const sample = realRunSamples.sourcesJsonNested
    const sources = extractAnswerSources({
      citationsJson: sample.citationsJson,
      sourcesJson: sample.sourcesJson,
      ownedDomains: sample.ownedDomains,
    })

    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatchObject({
      domain: "brand.example",
      sourceType: "official_site",
      extractionMethod: "sources_json",
    })
  })

  it("falls back safely when citationsJson is invalid", () => {
    const sample = realRunSamples.citationsInvalidOrEmpty

    expect(
      extractAnswerSources({
        citationsJson: sample.citationsJson,
        answer: sample.answer,
      })
    ).toEqual([])
  })

  it("returns an empty list when there is no structured citation or URL", () => {
    expect(extractAnswerSources({ citationsJson: null, answer: "没有 URL 的回答" })).toEqual([])
  })

  it("extracts URL sources from answer text", () => {
    const sources = extractAnswerSources({
      answer: "参考 https://www.xiaohongshu.com/explore/abc。 的笔记。",
    })

    expect(sources[0]).toMatchObject({
      domain: "xiaohongshu.com",
      sourceType: "xiaohongshu",
      extractionMethod: "answer_url",
    })
  })

  it("classifies registry, local listing, and authority sources from real-run samples", () => {
    const sample = realRunSamples.brandMentionedQualitySources
    const sources = extractAnswerSources({
      citationsJson: sample.citationsJson,
      ownedDomains: sample.ownedDomains,
    })

    expect(sources.map((source) => source.sourceType)).toEqual([
      "official_site",
      "local_listing",
      "authority_media",
    ])
  })
})

import { REASON_TAG_RULES } from "./constants"
import { hasRecommendationKeyword } from "./extract-brand"

export type EvidenceSpan = {
  type: "brand" | "competitor" | "recommendation" | "reason"
  entity: string
  text: string
  start: number
  end: number
}

export function extractReasonTags(text: string) {
  return REASON_TAG_RULES
    .filter((rule) => text.includes(rule.keyword))
    .map((rule) => rule.tag)
}

function buildSnippet(rawOutput: string, start: number, end: number) {
  return rawOutput.slice(Math.max(0, start - 40), Math.min(rawOutput.length, end + 40))
}

function pushSpan({
  spans,
  rawOutput,
  type,
  entity,
  start,
  end,
}: {
  spans: EvidenceSpan[]
  rawOutput: string
  type: EvidenceSpan["type"]
  entity: string
  start: number
  end: number
}) {
  if (start < 0) return
  spans.push({
    type,
    entity,
    text: buildSnippet(rawOutput, start, end),
    start,
    end,
  })
}

export function extractEvidenceSpans({
  rawOutput,
  brandAliasesMatched,
  competitors,
  reasonTags,
}: {
  rawOutput: string
  brandAliasesMatched: string[]
  competitors: Array<{ name: string }>
  reasonTags: string[]
}) {
  const spans: EvidenceSpan[] = []

  for (const alias of brandAliasesMatched) {
    const start = rawOutput.indexOf(alias)
    pushSpan({
      spans,
      rawOutput,
      type: "brand",
      entity: alias,
      start,
      end: start + alias.length,
    })
  }

  for (const competitor of competitors.slice(0, 10)) {
    const start = rawOutput.indexOf(competitor.name)
    pushSpan({
      spans,
      rawOutput,
      type: "competitor",
      entity: competitor.name,
      start,
      end: start + competitor.name.length,
    })
  }

  for (const tag of reasonTags) {
    const rule = REASON_TAG_RULES.find((item) => item.tag === tag)
    if (!rule) continue
    const start = rawOutput.indexOf(rule.keyword)
    pushSpan({
      spans,
      rawOutput,
      type: "reason",
      entity: tag,
      start,
      end: start + rule.keyword.length,
    })
  }

  for (const line of rawOutput.split("\n")) {
    if (!hasRecommendationKeyword(line)) continue
    const start = rawOutput.indexOf(line)
    pushSpan({
      spans,
      rawOutput,
      type: "recommendation",
      entity: "推荐片段",
      start,
      end: start + line.length,
    })
  }

  return spans
}

export function extractCitations(rawOutput: string) {
  const urls = rawOutput.match(/https?:\/\/[^\s)\]}]+/g) ?? []
  return urls.map((url) => ({ url }))
}

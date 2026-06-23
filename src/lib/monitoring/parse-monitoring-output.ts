import type { ParsedMonitoringOutput } from "./types"

type ParseInput = {
  brandName: string
  answer: string
}

const COMPETITOR_REGEX = /[\u4e00-\u9fa5A-Za-z0-9]{2,20}(装饰|装修|设计|家装)/g

export function parseMonitoringOutput({
  brandName,
  answer,
}: ParseInput): ParsedMonitoringOutput {
  const mentioned = answer.includes(brandName)
  const lines = answer.split("\n").map((line) => line.trim()).filter(Boolean)

  let rank: number | null = null
  for (const line of lines) {
    if (!line.includes(brandName)) continue
    const match = line.match(/^(\d+)[\.\、]/)
    if (match) {
      rank = Number(match[1])
      break
    }
  }

  const competitors = Array.from(
    new Set(answer.match(COMPETITOR_REGEX) ?? [])
  ).filter((name) => name !== brandName)

  return {
    mentioned,
    rank,
    competitors,
    notes: mentioned && rank === null ? "brand-mentioned-without-deterministic-rank" : null,
  }
}

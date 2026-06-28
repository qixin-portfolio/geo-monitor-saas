import type { RankType } from "@prisma/client"

import { getLinesWithAlias, hasRecommendationKeyword, normalizeText } from "./extract-brand"

const CHINESE_RANK_MAP: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
}

export function parseRankFromLine(line: string) {
  const cleanLine = line.trim().replace(/^[>\s*-]+/, "").replace(/^\*+/, "")
  const numberMatch = cleanLine.match(/^第?\s*([0-9]+)\s*(?:名|位)?[\.\、\):：\s-]?/)
  if (numberMatch) return Number(numberMatch[1])

  const chineseMatch = cleanLine.match(/^第?\s*([一二三四五六七八九十])\s*(?:名|位)?[\.\、\):：\s-]?/)
  return chineseMatch ? CHINESE_RANK_MAP[chineseMatch[1]] : null
}

export function hasNumberedList(rawOutput: string) {
  return rawOutput
    .split("\n")
    .some((line) => parseRankFromLine(line) !== null)
}

export function extractRank({
  rawOutput,
  aliases,
}: {
  rawOutput: string
  aliases: string[]
}) {
  const aliasLines = getLinesWithAlias({ rawOutput, aliases })

  for (const line of aliasLines) {
    const rank = parseRankFromLine(line)
    if (rank !== null) {
      return {
        brandRank: rank,
        rankType: "EXPLICIT" as RankType,
        recommended: true,
        matchedLine: line,
      }
    }
  }

  if (aliasLines.length === 0) {
    return {
      brandRank: null,
      rankType: "NONE" as RankType,
      recommended: false,
      matchedLine: null,
    }
  }

  const recommendationLine = aliasLines.find(hasRecommendationKeyword)
  if (recommendationLine) {
    return {
      brandRank: null,
      rankType: "IMPLIED" as RankType,
      recommended: true,
      matchedLine: recommendationLine,
    }
  }

  const normalizedOutput = normalizeText(rawOutput)
  const appearsNearRecommendation = aliases.some((alias) => {
    const normalizedAlias = normalizeText(alias)
    const index = normalizedOutput.indexOf(normalizedAlias)
    if (index < 0) return false
    const start = Math.max(0, index - 30)
    const end = Math.min(normalizedOutput.length, index + normalizedAlias.length + 30)
    return hasRecommendationKeyword(normalizedOutput.slice(start, end))
  })

  return {
    brandRank: null,
    rankType: appearsNearRecommendation ? ("IMPLIED" as RankType) : ("UNRANKED" as RankType),
    recommended: appearsNearRecommendation,
    matchedLine: aliasLines[0] ?? null,
  }
}

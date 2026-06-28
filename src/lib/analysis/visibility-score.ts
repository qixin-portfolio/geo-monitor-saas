import type { MentionStatus } from "@prisma/client"

export function calculateVisibilityScore({
  brandMentioned,
  mentionStatus,
  brandRank,
}: {
  brandMentioned: boolean
  mentionStatus: MentionStatus
  brandRank: number | null
}) {
  if (!brandMentioned) return 0
  if (mentionStatus === "MENTIONED") return 25
  if (mentionStatus === "RECOMMENDED" && !brandRank) return 60
  if (brandRank === 1) return 100
  if (brandRank === 2) return 90
  if (brandRank === 3) return 80
  if (brandRank === 4) return 70
  if (brandRank === 5) return 60
  return 50
}

export function calculateParserConfidence({
  exactBrandMatched,
  hasNumberedList,
  hasRecommendationKeyword,
  competitorCount,
  rawOutputLength,
}: {
  exactBrandMatched: boolean
  hasNumberedList: boolean
  hasRecommendationKeyword: boolean
  competitorCount: number
  rawOutputLength: number
}) {
  const score =
    (exactBrandMatched ? 0.4 : 0) +
    (hasNumberedList ? 0.2 : 0) +
    (hasRecommendationKeyword ? 0.2 : 0) +
    (competitorCount > 0 ? 0.1 : 0) +
    (rawOutputLength > 50 ? 0.1 : 0)

  return Math.max(0.3, Math.min(1, Number(score.toFixed(2))))
}

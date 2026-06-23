import type { SnapshotInput, TrendDirection } from "./types"

export function buildInsightSnapshot({ previous, queryRuns }: SnapshotInput) {
  const successfulRuns = queryRuns.filter((run) => run.status === "success")
  const mentionedRuns = successfulRuns.filter((run) => run.mentioned)
  const ranks = mentionedRuns
    .map((run) => run.rank)
    .filter((rank): rank is number => rank !== null)

  const mentionRate = successfulRuns.length
    ? Math.round((mentionedRuns.length / successfulRuns.length) * 100)
    : 0

  const averageRank = ranks.length
    ? Number((ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length).toFixed(1))
    : null

  const competitorList = Array.from(
    new Set(successfulRuns.flatMap((run) => run.competitors))
  ).sort()

  const trendDirection: TrendDirection =
    previous === null
      ? "flat"
      : mentionRate > previous.mentionRate
        ? "up"
        : mentionRate < previous.mentionRate
          ? "down"
          : "flat"

  const anomalyFlags: string[] = []

  if (previous && previous.mentionRate - mentionRate >= 20) {
    anomalyFlags.push("mention-rate-drop")
  }

  if (
    previous &&
    previous.averageRank !== null &&
    averageRank !== null &&
    averageRank - previous.averageRank >= 1
  ) {
    anomalyFlags.push("average-rank-worsened")
  }

  if (successfulRuns.length !== queryRuns.length) {
    anomalyFlags.push("query-run-failures")
  }

  return {
    mentionRate,
    averageRank,
    competitorList,
    trendDirection,
    anomalyFlags,
  }
}

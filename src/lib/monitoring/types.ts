export type TrendDirection = "up" | "flat" | "down"

export type QueryRunStatus = "pending" | "running" | "success" | "failed"

export type ParsedMonitoringOutput = {
  mentioned: boolean
  rank: number | null
  competitors: string[]
  notes: string | null
}

export type SnapshotInput = {
  previous: {
    mentionRate: number
    averageRank: number | null
    competitorList: string[]
    trendDirection: TrendDirection
    anomalyFlags: string[]
  } | null
  queryRuns: Array<{
    status: QueryRunStatus
    mentioned: boolean
    rank: number | null
    competitors: string[]
  }>
}

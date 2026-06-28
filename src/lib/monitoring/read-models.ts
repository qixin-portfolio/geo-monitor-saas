import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant, getTenantWithStats } from "@/lib/tenant"
import {
  buildBaselineConclusions,
  calculateBaselineMetrics,
} from "@/lib/monitoring/baseline-report"

export function mapDashboardSnapshot({
  tenantName,
  latestSnapshot,
  recentBatches,
}: {
  tenantName: string
  latestSnapshot: {
    mentionRate: number
    averageRank: number | null
    competitorList: string[]
    anomalyFlags: string[]
  } | null
  recentBatches: Array<{ status: string; createdAt: Date }>
}) {
  return {
    tenantName,
    mentionRate: latestSnapshot?.mentionRate ?? 0,
    averageRank: latestSnapshot?.averageRank ?? null,
    competitorList: latestSnapshot?.competitorList ?? [],
    anomalyFlags: latestSnapshot?.anomalyFlags ?? [],
    lastRunAt: recentBatches[0]?.createdAt ?? null,
    lastRunStatus: recentBatches[0]?.status ?? "NEVER_RUN",
  }
}

export function mapQueryMonitoringRows(
  queries: Array<{
    id: string
    text: string
    platform: string
    active: boolean
    queryRuns: Array<{
      id: string
      status: string
      provider: string
      model: string
      mentioned: boolean
      rank: number | null
      competitors: string[]
      errorMessage: string | null
      rawOutput?: string | null
      createdAt: Date
      analysis?: {
        mentionStatus: string
        rankType: string
        brandMentioned: boolean
        brandRank: number | null
        visibilityScore: number
        parserConfidence: number
        competitorsJson: unknown
        summary: string | null
        impactLevel: string
      } | null
    }>
    responses: Array<{
      id: string
      platform: string
      answer: string
      mentioned: boolean
      rank: number | null
      competitors: string | null
      notes: string | null
      createdAt: Date
    }>
  }>
) {
  return queries.map((query) => ({
    id: query.id,
    text: query.text,
    platform: query.platform,
    active: query.active,
    queryRuns: query.queryRuns,
    latestRun: query.queryRuns[0] ?? null,
    responses: query.responses,
  }))
}

export async function getMonitoringDashboardData() {
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()
  const manualStats = await getTenantWithStats()

  const [
    queryCount,
    latestSnapshot,
    recentBatches,
    recentSnapshots,
    recentQueries,
    latestBaselineBatch,
    latestSuccessfulBatch,
    latestNonEmptyBatch,
  ] =
    await Promise.all([
      prisma.query.count({ where: { tenantId: tenant.id } }),
      prisma.insightSnapshot.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.runBatch.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
        take: 7,
      }),
      prisma.insightSnapshot.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.query.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          queryRuns: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          responses: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.runBatch.findFirst({
        where: { tenantId: tenant.id, source: "geo-content-center-seed" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.runBatch.findFirst({
        where: {
          tenantId: tenant.id,
          status: "SUCCESS",
          queryRuns: { some: {} },
        },
        orderBy: { createdAt: "desc" },
        include: {
          queryRuns: {
            orderBy: { createdAt: "asc" },
            include: {
              query: true,
              analysis: true,
            },
          },
        },
      }),
      prisma.runBatch.findFirst({
        where: {
          tenantId: tenant.id,
          queryRuns: { some: {} },
        },
        orderBy: { createdAt: "desc" },
        include: {
          queryRuns: {
            orderBy: { createdAt: "asc" },
            include: {
              query: true,
              analysis: true,
            },
          },
        },
      }),
    ])

  const mapped = mapDashboardSnapshot({
    tenantName: tenant.name,
    latestSnapshot,
    recentBatches,
  })

  return {
    tenant,
    queryCount,
    responseCount: latestSnapshot
      ? recentBatches[0]?.queryCount ?? manualStats.responseCount
      : manualStats.responseCount,
    mentionedCount: latestSnapshot
      ? Math.round(((latestSnapshot.mentionRate ?? 0) / 100) * (recentBatches[0]?.queryCount ?? 0))
      : manualStats.mentionedCount,
    recommendationRate: latestSnapshot?.mentionRate ?? manualStats.recommendationRate,
    averageRank: latestSnapshot?.averageRank ?? null,
    competitors: latestSnapshot?.competitorList ?? manualStats.competitors,
    anomalyFlags: mapped.anomalyFlags,
    lastRunStatus: mapped.lastRunStatus,
    lastRunLabel: mapped.lastRunAt
      ? mapped.lastRunAt.toLocaleString("zh-CN", { hour12: false })
      : "还没有自动运行记录",
    recentSnapshots,
    latestBaselineBatch,
    latestReportBatch: latestSuccessfulBatch ?? latestNonEmptyBatch,
    recentQueries: recentQueries.map((query) => ({
      id: query.id,
      text: query.text,
      latestRun: query.queryRuns[0] ?? null,
      latestResponse: query.responses[0] ?? null,
    })),
  }
}

export async function getQueryMonitoringPageData() {
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()
  const queries = await prisma.query.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: {
      queryRuns: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { analysis: true },
      },
      responses: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  })

  return {
    tenant,
    queries: mapQueryMonitoringRows(queries),
  }
}

export async function getBatchReportPageData(batchId: string) {
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()
  const batch = await prisma.runBatch.findFirst({
    where: { id: batchId, tenantId: tenant.id },
    include: {
      snapshot: true,
      queryRuns: {
        orderBy: { createdAt: "asc" },
        include: {
          query: true,
          analysis: true,
        },
      },
    },
  })

  if (!batch) return null

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { tenantId: tenant.id },
  })
  const metrics = calculateBaselineMetrics(batch.queryRuns)

  return {
    tenant,
    brandProfile,
    batch,
    metrics,
    conclusions: buildBaselineConclusions(batch.queryRuns),
  }
}

export async function getRunDetailPageData(runId: string) {
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()
  const run = await prisma.queryRun.findFirst({
    where: {
      id: runId,
      query: { tenantId: tenant.id },
    },
    include: {
      query: true,
      analysis: true,
      providerAttempts: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!run) return null

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { tenantId: tenant.id },
  })

  return {
    tenant,
    brandProfile,
    run,
  }
}

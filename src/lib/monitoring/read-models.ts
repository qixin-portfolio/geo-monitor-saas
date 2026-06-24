import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant, getTenantWithStats } from "@/lib/tenant"

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
      mentioned: boolean
      rank: number | null
      competitors: string[]
      errorMessage: string | null
      createdAt: Date
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

  const [queryCount, latestSnapshot, recentBatches, recentSnapshots, recentQueries] =
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

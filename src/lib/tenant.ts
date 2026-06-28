import { getPrisma } from "@/lib/prisma"
import { hasUsableClerkKey } from "@/lib/clerk-config"

const isDev = process.env.NODE_ENV === "development"

const DEV_USER_ID = "dev-user-local"

async function devGetOrCreateTenant() {
  const prisma = getPrisma()

  // Development-only fallback: prefer the tenant that owns the newest real
  // monitoring run so local demos show existing data. This must never be used
  // in production tenant resolution.
  // Keep this as simple lookups to avoid nested relation-filter issues in dev.
  const latestRun = await prisma.queryRun.findFirst({
    orderBy: { createdAt: "desc" },
    select: { queryId: true },
  })
  if (latestRun) {
    const query = await prisma.query.findUnique({
      where: { id: latestRun.queryId },
      select: { tenantId: true },
    })

    if (query) {
      const tenantWithData = await prisma.tenant.findUnique({
        where: { id: query.tenantId },
      })
      if (tenantWithData) return tenantWithData
    }
  }

  // Fallback: try the dev-user-local tenant.
  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: DEV_USER_ID },
    include: { tenant: true },
  })
  if (existingUser?.tenant) return existingUser.tenant

  // Last resort: create a new empty dev tenant.
  return prisma.tenant.create({
    data: {
      name: "开发企业空间",
      brandName: "未设置品牌",
      users: {
        create: {
          clerkUserId: DEV_USER_ID,
          email: "dev@local.test",
          name: "开发用户",
        },
      },
    },
  })
}

async function getClerkTenant() {
  const { auth, currentUser } = await import("@clerk/nextjs/server")
  const { userId } = await auth()
  if (!userId) return null

  const prisma = getPrisma()
  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { tenant: true },
  })
  if (existingUser?.tenant) return existingUser.tenant

  const clerkUser = await currentUser()
  const clerkEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null
  const clerkName = clerkUser?.fullName ?? clerkUser?.firstName ?? null

  // First login onboarding: create a tenant tied to the authenticated Clerk user.
  // This is production-safe because it is keyed by Clerk userId, not by demo data.
  return prisma.tenant.create({
    data: {
      name: clerkName ? `${clerkName} 的企业空间` : "我的企业空间",
      brandName: "未设置品牌",
      users: {
        create: {
          clerkUserId: userId,
          email: clerkEmail,
          name: clerkName,
        },
      },
    },
  })
}

export async function getOrCreateTenant() {
  // Production path: resolve tenant only through Clerk userId -> User -> Tenant.
  // If Clerk is unavailable or the user is not authenticated, do not fall back
  // to any monitoring-run tenant outside development.
  if (hasUsableClerkKey()) {
    try {
      const clerkTenant = await getClerkTenant()
      if (clerkTenant) return clerkTenant
    } catch (error) {
      if (!isDev) throw error
    }
  }

  if (isDev) return devGetOrCreateTenant()

  throw new Error("Unauthorized")
}

export async function getTenantWithStats() {
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()

  const [queryCount, responseCount, mentionedCount, recentQueries, responses] =
    await Promise.all([
      prisma.query.count({ where: { tenantId: tenant.id } }),
      prisma.response.count({ where: { query: { tenantId: tenant.id } } }),
      prisma.response.count({
        where: { mentioned: true, query: { tenantId: tenant.id } },
      }),
      prisma.query.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { responses: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
      prisma.response.findMany({
        where: { query: { tenantId: tenant.id } },
        select: { competitors: true },
      }),
    ])

  const competitors = responses
    .flatMap((response) => response.competitors?.split(",") ?? [])
    .map((name) => name.trim())
    .filter(Boolean)

  return {
    tenant,
    queryCount,
    responseCount,
    mentionedCount,
    recentQueries,
    competitors: Array.from(new Set(competitors)),
    recommendationRate: responseCount
      ? Math.round((mentionedCount / responseCount) * 100)
      : 0,
  }
}

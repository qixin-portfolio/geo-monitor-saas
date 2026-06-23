import { auth, currentUser } from "@clerk/nextjs/server"

import { getPrisma } from "@/lib/prisma"

export async function getOrCreateTenant() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  const prisma = getPrisma()
  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { tenant: true },
  })

  if (existingUser?.tenant) {
    return existingUser.tenant
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null
  const name = clerkUser?.fullName ?? clerkUser?.firstName ?? null

  return prisma.tenant.create({
    data: {
      name: name ? `${name} 的企业空间` : "我的企业空间",
      brandName: "未设置品牌",
      users: {
        create: {
          clerkUserId: userId,
          email,
          name,
        },
      },
    },
  })
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

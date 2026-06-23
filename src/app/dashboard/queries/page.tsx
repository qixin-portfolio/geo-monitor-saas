import { QueryManager } from "@/components/query-manager"
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export const dynamic = "force-dynamic"

export default async function QueriesPage() {
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()
  const queries = await prisma.query.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: { responses: { orderBy: { createdAt: "desc" } } },
  })

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-semibold">关键词监测</h1>
        <p className="mt-2 text-muted-foreground">
          V1 先手动录入 AI 回答，系统负责统计品牌提及、排名和竞品。
        </p>
      </div>
      <QueryManager tenant={tenant} initialQueries={queries} />
    </div>
  )
}

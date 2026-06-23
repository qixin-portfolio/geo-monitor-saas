import { getPrisma } from "@/lib/prisma"

import { runTenantBatch } from "./run-tenant-batch"

export async function runAllTenants({
  tenants,
}: {
  tenants?: Array<{ id: string }>
} = {}) {
  const prisma = getPrisma()
  const runnableTenants =
    tenants ??
    (await prisma.tenant.findMany({
      where: { queries: { some: { active: true } } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }))

  let failedTenants = 0

  for (const tenant of runnableTenants) {
    try {
      await runTenantBatch({
        tenantId: tenant.id,
        triggerType: "CRON",
      })
    } catch {
      failedTenants += 1
    }
  }

  return {
    processedTenants: runnableTenants.length,
    failedTenants,
  }
}

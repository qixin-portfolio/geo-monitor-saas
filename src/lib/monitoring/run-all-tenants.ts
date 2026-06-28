import { getPrisma } from "@/lib/prisma"

import { runTenantBatch } from "./run-tenant-batch"

const DEV_USER_ID = "dev-user-local"

export async function runAllTenants({
  tenants,
}: {
  tenants?: Array<{ id: string }>
} = {}) {
  const prisma = getPrisma()
  const includeDevTenant = process.env.MONITORING_INCLUDE_DEV_TENANT === "true"
  const runnableTenants =
    tenants ??
    (await prisma.tenant.findMany({
      where: {
        queries: { some: { active: true } },
        ...(includeDevTenant
          ? {}
          : { users: { none: { clerkUserId: DEV_USER_ID } } }),
      },
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

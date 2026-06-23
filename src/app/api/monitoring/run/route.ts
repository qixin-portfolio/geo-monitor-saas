import { NextResponse } from "next/server"

import { runTenantBatch } from "@/lib/monitoring/run-tenant-batch"
import { getOrCreateTenant } from "@/lib/tenant"

export async function POST() {
  const tenant = await getOrCreateTenant()

  const result = await runTenantBatch({
    tenantId: tenant.id,
    triggerType: "MANUAL",
  })

  return NextResponse.json(result)
}

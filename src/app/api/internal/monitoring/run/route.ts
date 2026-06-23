import { NextResponse } from "next/server"

import { getMonitoringConfig } from "@/lib/monitoring/config"
import { runAllTenants } from "@/lib/monitoring/run-all-tenants"

export async function POST(req: Request) {
  const secret = req.headers.get("x-monitoring-cron-secret")

  if (!secret || secret !== getMonitoringConfig().cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runAllTenants()
  return NextResponse.json(result)
}

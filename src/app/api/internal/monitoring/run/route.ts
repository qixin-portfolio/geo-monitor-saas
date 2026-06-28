import { NextResponse } from "next/server"

import { getMonitoringConfig } from "@/lib/monitoring/config"
import { runAllTenants } from "@/lib/monitoring/run-all-tenants"

export const dynamic = "force-dynamic"

function isAuthorizedCronRequest(req: Request) {
  const cronSecret = getMonitoringConfig().cronSecret
  if (!cronSecret) return false

  const authHeader = req.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null
  const legacySecret = req.headers.get("x-monitoring-cron-secret")

  return bearerToken === cronSecret || legacySecret === cronSecret
}

async function runMonitoring(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runAllTenants()
  return NextResponse.json(result)
}

export async function GET(req: Request) {
  return runMonitoring(req)
}

export async function POST(req: Request) {
  return runMonitoring(req)
}

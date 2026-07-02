import { NextResponse } from "next/server"

import { runMonitoringJobs } from "@/cron/run-monitoring-jobs"
import { getMonitoringConfig } from "@/lib/monitoring/config"

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

async function runCron(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await runMonitoringJobs()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: "Monitoring cron failed." },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  return runCron(req)
}

export async function POST(req: Request) {
  return runCron(req)
}

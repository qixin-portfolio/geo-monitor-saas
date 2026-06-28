import { NextRequest, NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export async function GET(req: NextRequest) {
  const tenant = await getOrCreateTenant()
  if (!tenant) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const prisma = getPrisma()
  const { searchParams } = new URL(req.url)

  const status = searchParams.get("status") as string | null
  const type = searchParams.get("type") as string | null
  const queryRunId = searchParams.get("queryRunId") as string | null

  const where: Record<string, unknown> = { tenantId: tenant.id }
  if (status) where.status = status
  if (type) where.type = type
  if (queryRunId) where.queryRunId = queryRunId

  const tasks = await prisma.geoContentTask.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json({ tasks })
}

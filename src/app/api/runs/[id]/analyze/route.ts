import { NextResponse } from "next/server"

import { analyzeQueryRun } from "@/lib/analysis/analyze-query-run"
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()
  const queryRun = await prisma.queryRun.findFirst({
    where: {
      id,
      query: {
        tenantId: tenant.id,
      },
    },
    select: {
      id: true,
      status: true,
    },
  })

  if (!queryRun) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 })
  }

  if (queryRun.status !== "SUCCESS") {
    return NextResponse.json(
      { error: "Only successful runs can be analyzed" },
      { status: 400 }
    )
  }

  const analysis = await analyzeQueryRun(queryRun.id)
  return NextResponse.json({ analysis })
}

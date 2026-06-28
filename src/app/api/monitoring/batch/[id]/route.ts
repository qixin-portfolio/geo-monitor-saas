import { NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()
  const batch = await prisma.runBatch.findFirst({
    where: { id, tenantId: tenant.id },
    select: {
      id: true,
      status: true,
      successCount: true,
      failureCount: true,
      queryCount: true,
      startedAt: true,
      finishedAt: true,
    },
  })

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 })
  }

  return NextResponse.json(batch)
}

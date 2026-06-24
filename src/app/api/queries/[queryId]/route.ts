import { NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const tenant = await getOrCreateTenant()
  const { queryId } = await params
  const body = await req.json()
  const prisma = getPrisma()

  const query = await prisma.query.findFirst({
    where: {
      id: queryId,
      tenantId: tenant.id,
    },
  })

  if (!query) {
    return NextResponse.json({ error: "关键词不存在" }, { status: 404 })
  }

  const updated = await prisma.query.update({
    where: { id: query.id },
    data: { active: Boolean(body.active) },
  })

  return NextResponse.json({ query: updated })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const tenant = await getOrCreateTenant()
  const { queryId } = await params
  const prisma = getPrisma()

  const query = await prisma.query.findFirst({
    where: {
      id: queryId,
      tenantId: tenant.id,
    },
  })

  if (!query) {
    return NextResponse.json({ error: "关键词不存在" }, { status: 404 })
  }

  // Delete related records first
  await prisma.$transaction([
    prisma.queryRun.deleteMany({ where: { queryId: query.id } }),
    prisma.response.deleteMany({ where: { queryId: query.id } }),
    prisma.query.delete({ where: { id: query.id } }),
  ])

  return NextResponse.json({ success: true })
}

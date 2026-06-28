import { NextRequest, NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

const ALLOWED_STATUS = [
  "TODO", "BRIEF_READY", "DRAFT_READY", "REVIEW_NEEDED", "APPROVED", "EXPORTED", "SKIPPED",
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tenant = await getOrCreateTenant()
  if (!tenant) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const prisma = getPrisma()
  const task = await prisma.geoContentTask.findUnique({ where: { id } })
  if (!task) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 })
  }
  if (task.tenantId !== tenant.id) {
    return NextResponse.json({ error: "权限错误" }, { status: 403 })
  }

  const body = await req.json()
  const updateData: Record<string, unknown> = {}

  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.includes(body.status)) {
      return NextResponse.json({ error: "无效状态" }, { status: 400 })
    }
    updateData.status = body.status
  }
  if (body.priority !== undefined) {
    const p = Number(body.priority)
    if (Number.isFinite(p) && p >= 0 && p <= 100) {
      updateData.priority = p
    }
  }

  const updated = await prisma.geoContentTask.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ task: updated })
}

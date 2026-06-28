import { NextResponse } from "next/server"

import { generateBriefForTask } from "@/lib/content-backlog/generate-brief"
import { generateDraftForTask } from "@/lib/content-backlog/generate-draft"
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tenant = await getOrCreateTenant()
  if (!tenant) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  try {
    const prisma = getPrisma()
    const task = await prisma.geoContentTask.findUnique({ where: { id } })

    // Auto-generate brief if missing
    if (task && !task.briefJson) {
      await generateBriefForTask({ tenantId: tenant.id, taskId: id })
    }

    const updated = await generateDraftForTask({ tenantId: tenant.id, taskId: id })
    return NextResponse.json({ task: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[draft] generate failed:", message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

import { NextResponse } from "next/server"

import { generateBriefForTask } from "@/lib/content-backlog/generate-brief"
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
    const task = await generateBriefForTask({ tenantId: tenant.id, taskId: id })
    return NextResponse.json({ task })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[brief] generate failed:", message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

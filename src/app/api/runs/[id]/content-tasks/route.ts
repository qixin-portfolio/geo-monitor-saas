import { NextResponse } from "next/server"

import { generateGeoContentTasksFromRun } from "@/lib/content-backlog/generate-tasks-from-run"
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

function toSafeErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : ""

  if (message === "Unauthorized") {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  if (message.includes("not found") || message.includes("不属于当前租户")) {
    return NextResponse.json({ error: "未找到该监测结果" }, { status: 404 })
  }

  return NextResponse.json(
    { error: "生成 GEO 修复任务失败，请稍后重试" },
    { status: 400 }
  )
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: queryRunId } = await params

  try {
    const tenant = await getOrCreateTenant()
    const prisma = getPrisma()

    const run = await prisma.queryRun.findFirst({
      where: {
        id: queryRunId,
        query: { tenantId: tenant.id },
      },
      select: { id: true },
    })

    if (!run) {
      return NextResponse.json({ error: "未找到该监测结果" }, { status: 404 })
    }

    const tasks = await prisma.geoContentTask.findMany({
      where: {
        tenantId: tenant.id,
        queryRunId,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        type: true,
        priority: true,
        status: true,
        targetKeyword: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ tasks })
  } catch (err) {
    console.error("[content-tasks] list failed:", err)
    return toSafeErrorResponse(err)
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: queryRunId } = await params

  try {
    const tenant = await getOrCreateTenant()
    const result = await generateGeoContentTasksFromRun({
      tenantId: tenant.id,
      queryRunId,
    })

    return NextResponse.json({
      createdCount: result.created.length,
      existingCount: result.existing.length,
      created: result.created,
      existing: result.existing,
    })
  } catch (err) {
    console.error("[content-tasks] generate failed:", err)
    return toSafeErrorResponse(err)
  }
}

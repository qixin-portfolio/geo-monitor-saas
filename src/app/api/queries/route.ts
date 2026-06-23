import { NextResponse } from "next/server"

import { canCreateQuery } from "@/lib/plans"
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export async function GET() {
  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()
  const queries = await prisma.query.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    include: { responses: { orderBy: { createdAt: "desc" } } },
  })

  return NextResponse.json({ queries })
}

export async function POST(req: Request) {
  const tenant = await getOrCreateTenant()
  const body = await req.json()
  const text = String(body.text ?? "").trim()

  if (!text) {
    return NextResponse.json({ error: "关键词不能为空" }, { status: 400 })
  }

  const prisma = getPrisma()
  const count = await prisma.query.count({ where: { tenantId: tenant.id } })

  if (!canCreateQuery(tenant.plan, count)) {
    return NextResponse.json(
      {
        error: "Plan limit reached",
        message: "当前套餐关键词数量已达上限，请升级套餐。",
      },
      { status: 403 }
    )
  }

  const query = await prisma.query.create({
    data: {
      tenantId: tenant.id,
      text,
      platform: body.platform || "manual",
    },
  })

  return NextResponse.json({ query })
}

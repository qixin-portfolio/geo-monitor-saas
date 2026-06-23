import { NextResponse } from "next/server"

import { parseCompetitors } from "@/lib/manual-analysis"
import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export async function POST(req: Request) {
  const tenant = await getOrCreateTenant()
  const body = await req.json()
  const prisma = getPrisma()

  const query = await prisma.query.findFirst({
    where: { id: String(body.queryId ?? ""), tenantId: tenant.id },
  })

  if (!query) {
    return NextResponse.json({ error: "关键词不存在" }, { status: 404 })
  }

  const answer = String(body.answer ?? "").trim()
  if (!answer) {
    return NextResponse.json({ error: "AI 回答不能为空" }, { status: 400 })
  }

  const rankValue = Number(body.rank)
  const response = await prisma.response.create({
    data: {
      queryId: query.id,
      platform: String(body.platform ?? "manual").trim() || "manual",
      answer,
      mentioned: Boolean(body.mentioned),
      rank: Number.isFinite(rankValue) && rankValue > 0 ? rankValue : null,
      competitors: parseCompetitors(String(body.competitors ?? "")) || null,
      notes: String(body.notes ?? "").trim() || null,
    },
  })

  return NextResponse.json({ response })
}

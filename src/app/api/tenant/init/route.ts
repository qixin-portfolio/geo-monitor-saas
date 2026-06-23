import { NextResponse } from "next/server"

import { getPrisma } from "@/lib/prisma"
import { getOrCreateTenant } from "@/lib/tenant"

export async function POST() {
  const tenant = await getOrCreateTenant()
  return NextResponse.json({ tenant })
}

export async function PATCH(req: Request) {
  const tenant = await getOrCreateTenant()
  const body = await req.json()
  const prisma = getPrisma()

  const updatedTenant = await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      brandName: body.brandName?.trim() || tenant.brandName,
      industry: body.industry?.trim() || null,
      region: body.region?.trim() || null,
    },
  })

  return NextResponse.json({ tenant: updatedTenant })
}

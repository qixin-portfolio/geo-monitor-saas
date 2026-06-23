import { Plan } from "@prisma/client"
import { NextResponse } from "next/server"

import { getPlanLimit, getStripePriceId } from "@/lib/plans"
import { getPrisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { getAppUrl } from "@/lib/app-url"
import { getOrCreateTenant } from "@/lib/tenant"

export async function POST(req: Request) {
  const { plan } = await req.json()
  const priceId = getStripePriceId(plan)

  if (!priceId || plan === "FREE") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  const tenant = await getOrCreateTenant()
  const prisma = getPrisma()
  const stripe = getStripe()
  let customerId = tenant.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: tenant.name,
      metadata: { tenantId: tenant.id },
    })
    customerId = customer.id
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const appUrl = getAppUrl(req)
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    metadata: {
      tenantId: tenant.id,
      plan,
      queryLimit: String(getPlanLimit(plan as Plan)),
    },
    subscription_data: {
      metadata: { tenantId: tenant.id, plan },
    },
  })

  return NextResponse.json({ url: session.url })
}

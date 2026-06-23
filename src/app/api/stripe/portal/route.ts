import { NextResponse } from "next/server"

import { getAppUrl } from "@/lib/app-url"
import { getStripe } from "@/lib/stripe"
import { getOrCreateTenant } from "@/lib/tenant"

export async function POST(req: Request) {
  const tenant = await getOrCreateTenant()

  if (!tenant.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer" }, { status: 400 })
  }

  const appUrl = getAppUrl(req)
  const session = await getStripe().billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  })

  return NextResponse.json({ url: session.url })
}

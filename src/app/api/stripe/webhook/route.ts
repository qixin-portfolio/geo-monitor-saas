import { Plan, SubscriptionStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import type Stripe from "stripe"

import { getPrisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"

function mapSubscriptionStatus(status: string) {
  if (status === "active") return SubscriptionStatus.ACTIVE
  if (status === "past_due") return SubscriptionStatus.PAST_DUE
  if (status === "canceled") return SubscriptionStatus.CANCELED
  if (status === "incomplete") return SubscriptionStatus.INCOMPLETE
  return SubscriptionStatus.NONE
}

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    )
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
  }

  const prisma = getPrisma()

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const tenantId = session.metadata?.tenantId
    const plan = session.metadata?.plan as Plan | undefined

    if (tenantId && plan) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan,
          stripeCustomerId: String(session.customer),
          stripeSubscriptionId: String(session.subscription),
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        },
      })
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription
    const tenantId = subscription.metadata?.tenantId
    const plan = subscription.metadata?.plan as Plan | undefined
    const status = mapSubscriptionStatus(subscription.status)

    if (tenantId) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: status === SubscriptionStatus.ACTIVE && plan ? plan : Plan.FREE,
          subscriptionStatus: status,
          stripeSubscriptionId: subscription.id,
        },
      })
    }
  }

  return NextResponse.json({ received: true })
}

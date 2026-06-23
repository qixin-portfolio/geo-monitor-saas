import Link from "next/link"

import { BillingPortalButton } from "@/components/billing-portal-button"
import { PlanBadge } from "@/components/plan-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getOrCreateTenant } from "@/lib/tenant"

export const dynamic = "force-dynamic"

export default async function BillingPage() {
  const tenant = await getOrCreateTenant()

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-semibold">订阅与账单</h1>
        <p className="mt-2 text-muted-foreground">
          查看当前套餐、订阅状态，并进入 Stripe Customer Portal。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            当前套餐 <PlanBadge plan={tenant.plan} />
          </CardTitle>
          <CardDescription>订阅状态：{tenant.subscriptionStatus}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/pricing">升级套餐</Link>
          </Button>
          {tenant.stripeCustomerId ? (
            <BillingPortalButton />
          ) : (
            <Button variant="outline" disabled>
              暂无 Stripe 客户
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

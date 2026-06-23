"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { hasUsableClerkKey } from "@/lib/clerk-config"

export function PricingCard({
  name,
  price,
  description,
  features,
  plan,
}: {
  name: string
  price: string
  description: string
  features: string[]
  plan: string
}) {
  const hasClerk = hasUsableClerkKey()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function checkout() {
    if (plan === "FREE") return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "创建支付失败")
        return
      }

      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="text-4xl font-semibold">{price}</div>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {features.map((feature) => (
            <li key={feature}>✓ {feature}</li>
          ))}
        </ul>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
      <CardFooter>
        {plan === "FREE" ? (
          hasClerk ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/sign-up">免费开始</Link>
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              预览模式
            </Button>
          )
        ) : (
          <Button
            className="w-full"
            disabled={loading || !hasClerk}
            onClick={checkout}
          >
            {!hasClerk ? "预览模式不可订阅" : loading ? "跳转中..." : `订阅 ${name}`}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

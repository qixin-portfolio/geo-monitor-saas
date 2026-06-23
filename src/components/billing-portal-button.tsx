"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openPortal() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "无法打开账单管理")
        return
      }

      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" disabled={loading} onClick={openPortal}>
        {loading ? "打开中..." : "管理账单"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

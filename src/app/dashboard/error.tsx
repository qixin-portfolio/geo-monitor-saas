"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", { digest: error.digest ?? "no-digest" })
  }, [error.digest])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 md:p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-semibold">页面加载失败</h1>
      <p className="max-w-md text-center text-muted-foreground">
        加载 Dashboard 数据时出错，请刷新页面重试。
      </p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground">错误编号：{error.digest}</p>
      ) : null}
      <div className="flex gap-3">
        <Button onClick={() => reset()}>重试</Button>
        <Button asChild variant="outline">
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </div>
  )
}

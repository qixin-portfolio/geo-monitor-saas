"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

export function AnalyzeRunButton({ runId }: { runId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle")
  const [message, setMessage] = useState("")

  async function analyze() {
    setStatus("running")
    setMessage("")

    try {
      const res = await fetch(`/api/runs/${runId}/analyze`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "生成分析失败")
        return
      }
      router.refresh()
    } catch {
      setStatus("error")
      setMessage("网络请求失败")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button disabled={status === "running"} onClick={analyze}>
        {status === "running" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        生成分析
      </Button>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Loader2, Play } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RunNowButton() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [message, setMessage] = useState("")

  async function onRun() {
    setStatus("running")
    setMessage("")

    try {
      const res = await fetch("/api/monitoring/run", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "运行失败，请检查 API Key 是否已配置")
        return
      }

      setStatus("done")
      setMessage(
        data.status === "success"
          ? `监测完成，共处理 ${data.processedTenants ?? 1} 个租户`
          : data.status === "skipped-no-active-queries"
            ? "暂无活跃关键词，跳过本轮"
            : `监测结束，状态：${data.status}`
      )
    } catch {
      setStatus("error")
      setMessage("网络请求失败，请检查网络连接")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={onRun} disabled={status === "running"}>
        {status === "running" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            监测运行中...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            立即运行本轮监测
          </>
        )}
      </Button>
      {message ? (
        <p
          className={`text-sm ${
            status === "error"
              ? "text-red-600"
              : status === "done"
                ? "text-emerald-600"
                : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}

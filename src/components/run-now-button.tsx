"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Play } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RunNowButton() {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [message, setMessage] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [])

  function pollBatch(batchId: string) {
    setStatus("running")
    setMessage("")

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/monitoring/batch/${batchId}`)
        const batch = await res.json()

        if (batch.status === "RUNNING" || batch.status === "PENDING") {
          const done = (batch.successCount ?? 0) + (batch.failureCount ?? 0)
          const total = batch.queryCount ?? 0
          setMessage(
            total > 0
              ? `监测运行中... ${done}/${total} 查询已完成`
              : "监测准备中..."
          )
          return
        }

        // Terminal state
        stopPolling()
        router.refresh()
        setStatus("done")

        if (batch.status === "SUCCESS") {
          setMessage(`监测完成，${batch.successCount} 个查询全部成功`)
        } else if (batch.status === "PARTIAL_FAILURE") {
          setMessage(
            `监测完成，${batch.successCount} 成功，${batch.failureCount} 失败`
          )
        } else if (batch.status === "FAILED") {
          setStatus("error")
          setMessage(`监测失败，${batch.failureCount} 个查询全部失败`)
        } else {
          setMessage(`监测结束，状态：${batch.status}`)
        }
      } catch {
        stopPolling()
        setStatus("error")
        setMessage("轮询状态失败，请刷新页面查看结果")
      }
    }, 3000)
  }

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

      if (data.status === "already-running" || (data.status === "started" && data.batchId)) {
        pollBatch(data.batchId)
        return
      }

      if (data.status === "SUCCESS") {
        setStatus("done")
        router.refresh()
        setMessage(`监测完成，${data.successCount} 个查询全部成功`)
        return
      }

      if (data.status === "PARTIAL_FAILURE") {
        setStatus("done")
        router.refresh()
        setMessage(`监测完成，${data.successCount} 成功，${data.failureCount} 失败`)
        return
      }

      if (data.status === "FAILED") {
        setStatus("error")
        router.refresh()
        setMessage(`监测失败，${data.failureCount} 个查询失败`)
        return
      }

      setStatus("done")
      router.refresh()
      setMessage(`监测已触发，状态：${data.status}`)
    } catch {
      setStatus("error")
      setMessage("网络请求失败，请检查网络连接")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={() => { stopPolling(); onRun(); }}
        disabled={status === "running"}
      >
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

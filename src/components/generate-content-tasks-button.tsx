"use client"

import Link from "next/link"
import { useState } from "react"
import { ClipboardList } from "lucide-react"

export function GenerateContentTasksButton({ runId }: { runId: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    createdCount: number
    existingCount: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/runs/${runId}/content-tasks`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={handleClick}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <ClipboardList className="h-4 w-4" />
          {loading ? "生成中..." : "生成 GEO 修复任务"}
        </button>
        {result && (
          <Link
            href="/dashboard/content-backlog"
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            查看修复任务
          </Link>
        )}
      </div>

      {result && (
        <p className="text-sm text-muted-foreground">
          已生成 {result.createdCount} 条新任务，已有 {result.existingCount} 条相关任务。
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

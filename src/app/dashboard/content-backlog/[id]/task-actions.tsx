"use client"

import { useState } from "react"
import { ClipboardList, FileCheck, Copy, CheckCircle, XCircle, Send } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  TODO: "待办",
  BRIEF_READY: "简报已就绪",
  DRAFT_READY: "草稿已就绪",
  REVIEW_NEEDED: "待审核",
  APPROVED: "已批准",
  EXPORTED: "已导出",
  SKIPPED: "已跳过",
}

export function TaskActions({
  taskId,
  currentStatus,
  showStatusActions = true,
}: {
  taskId: string
  currentStatus: string
  showStatusActions?: boolean
}) {
  const [status, setStatus] = useState(currentStatus)
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [generatingDraft, setGeneratingDraft] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  const generateBrief = async () => {
    setGeneratingBrief(true)
    setError(null)
    setResultMsg(null)
    try {
      const res = await fetch(`/api/content-tasks/${taskId}/brief`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus(data.task.status)
      setResultMsg("简报已生成")
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成简报失败")
    } finally {
      setGeneratingBrief(false)
    }
  }

  const generateDraft = async () => {
    setGeneratingDraft(true)
    setError(null)
    setResultMsg(null)
    try {
      const res = await fetch(`/api/content-tasks/${taskId}/draft`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus(data.task.status)
      setDraft(data.task.draftMarkdown)
      setResultMsg("草稿已生成")
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成草稿失败")
    } finally {
      setGeneratingDraft(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    setError(null)
    setResultMsg(null)
    try {
      const res = await fetch(`/api/content-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus(data.task.status)
      setResultMsg("状态已更新")
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新状态失败")
    }
  }

  const copyMarkdown = async () => {
    const text = draft || ""
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Generate Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={generateBrief}
          disabled={generatingBrief}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <ClipboardList className="h-4 w-4" />
          {generatingBrief ? "生成简报中..." : "生成编辑简报"}
        </button>

        <button
          onClick={generateDraft}
          disabled={generatingDraft}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <FileCheck className="h-4 w-4" />
          {generatingDraft ? "生成草稿中..." : "生成内容草稿"}
        </button>

        {draft && (
          <button
            onClick={copyMarkdown}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "已复制" : "复制 Markdown"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {resultMsg && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {resultMsg}
        </div>
      )}

      {showStatusActions ? (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">状态操作：</span>
          <button
            onClick={() => updateStatus("REVIEW_NEEDED")}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            标记为待审核
          </button>
          <button
            onClick={() => updateStatus("APPROVED")}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            已批准
          </button>
          <button
            onClick={() => updateStatus("EXPORTED")}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Send className="h-3.5 w-3.5" />
            已导出
          </button>
          <button
            onClick={() => updateStatus("SKIPPED")}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            <XCircle className="h-3.5 w-3.5" />
            跳过
          </button>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        当前状态: {STATUS_LABELS[status] || status}
      </p>
    </>
  )
}

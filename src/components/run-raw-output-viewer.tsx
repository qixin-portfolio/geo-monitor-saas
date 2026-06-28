"use client"

import { useMemo, useState } from "react"
import { Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

type Highlight = {
  text: string
  type: "brand" | "competitor" | "recommendation"
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function classForType(type: Highlight["type"]) {
  if (type === "brand") return "bg-emerald-100 text-emerald-900"
  if (type === "competitor") return "bg-amber-100 text-amber-900"
  return "bg-sky-100 text-sky-900"
}

export function RunRawOutputViewer({
  rawOutput,
  highlights,
}: {
  rawOutput: string
  highlights: Highlight[]
}) {
  const [copied, setCopied] = useState(false)
  const uniqueHighlights = useMemo(() => {
    const seen = new Set<string>()
    return highlights
      .filter((item) => item.text.trim())
      .sort((a, b) => b.text.length - a.text.length)
      .filter((item) => {
        const key = `${item.type}:${item.text}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }, [highlights])

  const pattern = uniqueHighlights.length
    ? new RegExp(`(${uniqueHighlights.map((item) => escapeRegExp(item.text)).join("|")})`, "g")
    : null

  async function copy() {
    await navigator.clipboard.writeText(rawOutput)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={copy}>
          <Copy className="mr-1 h-3.5 w-3.5" />
          {copied ? "已复制" : "复制完整回答"}
        </Button>
      </div>
      <div className="max-h-[620px] overflow-auto rounded-lg border bg-muted/20 p-4 text-sm leading-7 whitespace-pre-wrap">
        {rawOutput.split("\n").map((line, lineIndex) => {
          const parts = pattern ? line.split(pattern) : [line]
          return (
            <p key={`${lineIndex}-${line}`} className="min-h-6">
              {parts.map((part, index) => {
                const highlight = uniqueHighlights.find((item) => item.text === part)
                if (!highlight) return <span key={`${part}-${index}`}>{part}</span>
                return (
                  <mark
                    key={`${part}-${index}`}
                    className={`rounded px-1 ${classForType(highlight.type)}`}
                  >
                    {part}
                  </mark>
                )
              })}
            </p>
          )
        })}
      </div>
    </div>
  )
}

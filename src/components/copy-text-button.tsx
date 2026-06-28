"use client"

import { useState } from "react"
import { Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CopyTextButton({
  text,
  label = "复制",
}: {
  text: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      <Copy className="mr-1 h-3.5 w-3.5" />
      {copied ? "已复制" : label}
    </Button>
  )
}

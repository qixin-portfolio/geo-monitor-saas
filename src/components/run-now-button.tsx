"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

export function RunNowButton() {
  const [running, setRunning] = useState(false)

  async function onRun() {
    setRunning(true)

    try {
      await fetch("/api/monitoring/run", { method: "POST" })
      window.location.reload()
    } finally {
      setRunning(false)
    }
  }

  return (
    <Button onClick={onRun} disabled={running}>
      {running ? "监测运行中..." : "立即运行本轮监测"}
    </Button>
  )
}

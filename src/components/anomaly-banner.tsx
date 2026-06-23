export function AnomalyBanner({ anomalyFlags }: { anomalyFlags: string[] }) {
  if (anomalyFlags.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      异常提醒：{anomalyFlags.join(" / ")}
    </div>
  )
}

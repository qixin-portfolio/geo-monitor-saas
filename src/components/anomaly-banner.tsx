import { AlertTriangle } from "lucide-react"

export function AnomalyBanner({ anomalyFlags }: { anomalyFlags: string[] }) {
  if (anomalyFlags.length === 0) return null

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div>
        <p className="font-medium">异常提醒</p>
        <ul className="mt-1 list-disc pl-4 text-amber-700">
          {anomalyFlags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

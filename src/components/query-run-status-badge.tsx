const statusConfig: Record<string, { label: string; className: string }> = {
  SUCCESS: {
    label: "监测成功",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  FAILED: {
    label: "监测失败",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  RUNNING: {
    label: "运行中",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  PENDING: {
    label: "排队中",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
}

export function QueryRunStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: "未运行",
    className: "border-gray-200 bg-gray-50 text-gray-500",
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

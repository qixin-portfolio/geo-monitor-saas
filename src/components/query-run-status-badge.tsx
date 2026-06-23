export function QueryRunStatusBadge({ status }: { status: string }) {
  const label =
    status === "SUCCESS"
      ? "成功"
      : status === "FAILED"
        ? "失败"
        : status === "RUNNING"
          ? "运行中"
          : "未运行"

  return <span className="rounded-full border px-2 py-1 text-xs">{label}</span>
}

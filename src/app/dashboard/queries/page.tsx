import { QueryManager } from "@/components/query-manager"
import { RunNowButton } from "@/components/run-now-button"
import { getQueryMonitoringPageData } from "@/lib/monitoring/read-models"

export const dynamic = "force-dynamic"

export default async function QueriesPage() {
  const { tenant, queries } = await getQueryMonitoringPageData()

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">关键词监测</h1>
          <p className="mt-2 text-muted-foreground">
            自动监测优先，手动录入作为补充入口保留。
          </p>
        </div>
        <RunNowButton />
      </div>
      <QueryManager tenant={tenant} initialQueries={queries} />
    </div>
  )
}

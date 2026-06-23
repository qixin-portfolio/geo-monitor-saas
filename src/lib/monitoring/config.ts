export function getMonitoringConfig() {
  return {
    provider: "openai" as const,
    model: process.env.MONITORING_MODEL || "gpt-4o-mini",
    cronSecret: process.env.MONITORING_CRON_SECRET || "",
  }
}

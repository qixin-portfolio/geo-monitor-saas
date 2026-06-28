type MonitoringPromptInput = {
  queryText: string
}

export function buildMonitoringPrompt({
  queryText,
}: MonitoringPromptInput) {
  return queryText.trim()
}

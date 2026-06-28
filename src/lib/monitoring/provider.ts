export type ProviderCallInput = {
  prompt: string
  model: string
}

export type ProviderCallResult = {
  provider: string
  model: string
  output: string
  durationMs: number | null
  httpStatus?: number | null
  inputTokens?: number | null
  outputTokens?: number | null
  totalTokens?: number | null
  rawRequestJson?: unknown
  rawResponseJson?: unknown
}

export interface MonitoringProvider {
  call(input: ProviderCallInput): Promise<ProviderCallResult>
}

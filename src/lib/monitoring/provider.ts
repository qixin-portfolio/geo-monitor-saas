export type ProviderCallInput = {
  prompt: string
  model: string
}

export type ProviderCallResult = {
  provider: string
  model: string
  output: string
  durationMs: number | null
}

export interface MonitoringProvider {
  call(input: ProviderCallInput): Promise<ProviderCallResult>
}

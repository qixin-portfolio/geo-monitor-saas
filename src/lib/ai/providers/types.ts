export type AIProviderInvokeInput = {
  prompt: string
  model?: string
  temperature?: number
  timeoutMs?: number
  maxTokens?: number
}

export type AIProviderInvokeResult = {
  text: string
  rawJson?: unknown
  latencyMs?: number
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

export interface AIProviderAdapter {
  id: string
  name: string
  defaultModel: string
  invoke(input: AIProviderInvokeInput): Promise<AIProviderInvokeResult>
}

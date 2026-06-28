import { ArkAdapter } from "./ark"
import { DeepSeekAdapter } from "./deepseek"
import type { AIProviderAdapter } from "./types"

export function getProvider(providerId: string): AIProviderAdapter {
  if (providerId === "deepseek") return new DeepSeekAdapter()
  if (providerId === "ark") return new ArkAdapter()
  throw new Error(`Unsupported AI provider: ${providerId}`)
}

export type { AIProviderAdapter, AIProviderInvokeInput, AIProviderInvokeResult } from "./types"

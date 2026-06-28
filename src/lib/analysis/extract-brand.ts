import { RECOMMENDATION_KEYWORDS } from "./constants"

export function normalizeText(value: string) {
  return value.replace(/[\s*_\-—:：，,。.!！?？（）()[\]【】"'“”]/g, "")
}

export function getBrandAliases(brandName: string | null) {
  return [brandName?.trim()].filter((item): item is string => Boolean(item))
}

export function findBrandAliasesMatched({
  rawOutput,
  aliases,
}: {
  rawOutput: string
  aliases: string[]
}) {
  const normalizedOutput = normalizeText(rawOutput)
  return aliases.filter((alias) => normalizedOutput.includes(normalizeText(alias)))
}

export function hasRecommendationKeyword(text: string) {
  return RECOMMENDATION_KEYWORDS.some((keyword) => text.includes(keyword))
}

export function getLinesWithAlias({
  rawOutput,
  aliases,
}: {
  rawOutput: string
  aliases: string[]
}) {
  return rawOutput
    .split("\n")
    .map((line) => line.trim())
    .filter((line) =>
      aliases.some((alias) => normalizeText(line).includes(normalizeText(alias)))
    )
}

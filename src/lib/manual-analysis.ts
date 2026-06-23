export function parseCompetitors(input: string) {
  return input
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ")
}

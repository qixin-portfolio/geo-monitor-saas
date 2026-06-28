import type { ParsedMonitoringOutput } from "./types"

type ParseInput = {
  brandName: string
  brandAliases?: string[]
  answer: string
}

// Regex to extract candidate strings ending with an industry suffix.
const CANDIDATE_REGEX =
  /([\u4e00-\u9fa5A-Za-z0-9]{2,15}(装饰公司|装修公司|设计公司|家装公司|工程公司|装饰|装修|设计|家装))/g

/**
 * A real company name in this domain typically:
 *   - Starts with a place name (交城, 太原, 北京...) or unique brand word
 *   - Ends with an industry suffix (装饰, 装修, 设计, 家装, 工程)
 *   - Is 3-8 chars total (most real local company names are short)
 *   - Does NOT contain verbs, conjunctions, negations, numbers, or sentence words
 *
 * Strategy: whitelist the valid prefix patterns, reject everything else.
 * This is much more robust than blacklisting infinite generic phrases.
 */

// Characters that are NEVER the start of a real company name
const INVALID_START_CHARS = /^[0-9\s]/

// Words/particles that appear in sentence fragments but never at the start of company names
const SENTENCE_WORDS =
  /^(整体|免费|高端|中端|低端|专业|综合|全面|正规|靠谱|优秀|特色|独立|大型|小型|知名|老牌|著名|一流|顶级|经济|平价|豪华|实惠|优质|良好|不错|最好|更好|新|老|简|繁|古|旧|现|大|小|好|差|强|弱|快|慢|高|低|多|少|优|劣|精|粗|当地的?|本地的?|这家|那家|这家|那家|这家的|那家的|某|这|那|它|他|她|我|你|谁|别|请|祝|先|要|可|能|会|没|不|很|太|更|最|挺|蛮|颇|都|也|还|又|再|才|只|仅|就|却|但|而|且|或|和|与|及|把|被|让|给|在|从|到|去|来|过|着|了|的|地|得|吗|呢|吧|啊|呀|哦|哈|嘛|哎|喂|嗯|噢|喔|唉|哟|啦|喽|罢了|而已|便是|就是|正是|还是|只是|不是|可是|也是|总会|不会|才能|应该|需要|想要|打算|准备|计划|已经|正在|即将|一直|经常|通常|往往|比如|例如|此外|另外|同时|其次|最后|总之|一般来说|最重要|关键|首先|然后|接着|随后|总之|总而言之|综上|简单来说|具体来说|通常情况下|值得注意|需要注意|重要提示|温馨提示|友情提示|小贴士|总的来说|概括地说|换言之|也就是说|比如像|像是|就像|类似|类似的|像这种|那种|这种|各种|一些|很多|不少|多数|部分|个别|等等|诸如|以及|包括|或者|还有|也有|另外|此外|其中|那些|这些|因为|由于|所以|但是|然而|不过|而且|并且|虽然|即使|如果|假如|那么|里面|经常|业主|分享|追求|主打|清晰|应对|评价|了解|咨询|预约|考察|关注|追求|不同|某知名|例如搜索|最好有|判断一家|这是|祝您|简单装修|中档装修|高档装修|防水等|隐蔽工程|室内装饰|建筑装修|室内外|水电|墙面|春季|秋季|样板间)/

// Generic single/double-char adjectives that never start real company names
const GENERIC_ADJ_PREFIX =
  /^(整体|免费|高端|专业|综合|全面|正规|靠谱|特色|独立|大型|小型|知名|老牌|一流|顶级|经济|平价|豪华|实惠|优质|良好|不错|简单|高档|中档|低端|中端)/

// Words that, if found anywhere in the candidate, indicate sentence structure
const SENTENCE_BODY =
  /的|会|要|需|应|可以|可能|应该|需要|能够|必须|最好|建议|推荐|适合|选择|比较|考虑|注意|看看|去|来|到|在|从|通过|根据|对于|关于|因为|由于|所以|但是|不过|而且|或者|以及|虽然|即使|如果|那么|就|都|也|还|又|再|才|只|仅|不|没|未|很|太|更|最|非常|十分|特别|尤其|相当|极其|无比|追求|主打|不同|清晰|应对|评价|了解|咨询|预约|考察|关注|里面|经常|业主|分享|祝您|例如搜索|最好有|判断一家|这是|简单|中档|高档|防水等|隐蔽|室内|建筑|水电|墙面|春季|秋季|样板|如设计|如建筑/

function normalizeText(value: string) {
  return value.replace(/[\s*_\-—:：，,。.!！?？（）()[\]【】"'""《》]/g, "")
}

function stripLinePrefix(line: string) {
  return line
    .trim()
    .replace(/^[>\s*-]+/, "")
    .replace(/^\*+/, "")
    .replace(/^(?:第?\s*)?([0-9]+|[一二三四五六七八九十]+)\s*(?:名|位)?[\.\、\):：\s-]*/, "")
    .replace(/^\*+/, "")
    .trim()
}

function parseRankFromLine(line: string) {
  const cleanLine = line.trim().replace(/^[>\s*-]+/, "").replace(/^\*+/, "")
  const numberMatch = cleanLine.match(/^第?\s*([0-9]+)\s*(?:名|位)?[\.\、\):：\s-]?/)
  if (numberMatch) return Number(numberMatch[1])

  const chineseRankMap: Record<string, number> = {
    一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
    六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
  }
  const chineseMatch = cleanLine.match(
    /^第?\s*([一二三四五六七八九十])\s*(?:名|位)?[\.\、\):：\s-]?/
  )
  return chineseMatch ? chineseRankMap[chineseMatch[1]] : null
}

function isGenericCompetitorName(name: string): boolean {
  // Reject names starting with digits (e.g. "0元设计", "2024年刚装修")
  if (INVALID_START_CHARS.test(name)) return true

  // Reject if starts with sentence-starting words
  if (SENTENCE_WORDS.test(name)) return true

  // Reject if prefix before industry suffix is just generic adjectives
  const prefix = name.replace(
    /(装饰公司|装修公司|设计公司|家装公司|工程公司|装饰|装修|设计|家装)$/,
    ""
  )
  if (prefix.length === 0) return true
  if (GENERIC_ADJ_PREFIX.test(prefix)) return true

  // Reject if the prefix contains sentence-structure words anywhere
  if (SENTENCE_BODY.test(prefix)) return true

  // The name passes all checks — it looks like a real company name
  return false
}

function extractCompetitors({
  answer,
  brandName,
  brandAliases = [],
}: {
  answer: string
  brandName: string
  brandAliases?: string[]
}) {
  const normalizedBrandAliases = new Set(
    [brandName, ...brandAliases].map((alias) => normalizeText(alias)).filter(Boolean)
  )
  const competitors: string[] = []
  const seen = new Set<string>()

  for (const line of answer.split("\n")) {
    const strippedLine = stripLinePrefix(line)
    const candidates = strippedLine.match(CANDIDATE_REGEX) ?? []

    for (const rawName of candidates) {
      const name = rawName.trim()
      const normalizedName = normalizeText(name)
      if (!name) continue
      if (name.length < 3 || name.length > 15) continue
      if (!/(装饰|装修|设计|家装|工程)/.test(name)) continue
      if (normalizedBrandAliases.has(normalizedName)) continue
      if (isGenericCompetitorName(name)) continue
      if (seen.has(normalizedName)) continue
      seen.add(normalizedName)
      competitors.push(name)
    }
  }

  return competitors
}

export function parseMonitoringOutput({
  brandName,
  brandAliases = [],
  answer,
}: ParseInput): ParsedMonitoringOutput {
  const normalizedAliases = [brandName, ...brandAliases]
    .map((alias) => normalizeText(alias))
    .filter(Boolean)
  const normalizedAnswer = normalizeText(answer)
  const mentioned = normalizedAliases.some((alias) => normalizedAnswer.includes(alias))
  const lines = answer
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  let rank: number | null = null
  for (const line of lines) {
    const normalizedLine = normalizeText(line)
    if (!normalizedAliases.some((alias) => normalizedLine.includes(alias))) continue
    const parsedRank = parseRankFromLine(line)
    if (parsedRank !== null) {
      rank = parsedRank
      break
    }
  }

  const competitors = extractCompetitors({ answer, brandName, brandAliases })

  return {
    mentioned,
    rank,
    competitors,
    notes:
      mentioned && rank === null ? "brand-mentioned-without-deterministic-rank" : null,
  }
}

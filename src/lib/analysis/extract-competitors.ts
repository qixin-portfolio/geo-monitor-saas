import { COMPETITOR_BLACKLIST, COMPETITOR_SUFFIXES } from "./constants"
import { normalizeText, hasRecommendationKeyword } from "./extract-brand"
import { parseRankFromLine } from "./extract-rank"
import { extractReasonTags } from "./extract-evidence"

export type CompetitorInsight = {
  name: string
  rank: number | null
  recommended: boolean
  evidence: string
  reasonTags: string[]
}

const LEADING_NOISE =
  /^(?:如|例如|比如|推荐|可选择|可以选择|选择|寻找|找|考虑|可以考虑|优先考虑|重点考察|当地|本地|一些|大型|小型|正规|靠谱|知名|老牌|的?)/

const GENERIC_PATTERNS = [
  /^[0-9]/,
  /(XX|某家|很多|老牌|正规|住宅)/,
  /^(本地|当地|靠谱|正规|普通|大型|小型|知名)?(装修公司|装修方|装修团队|装修服务|装修市场|装修需求|装修预算)$/,
  /(免费|0元|整体|平台|施工队|工长|设计师|市场|预算|需求|服务|团队|避坑|合同|报价|案例|工地)/,
]

const SENTENCE_FRAGMENT_PATTERN =
  /(的|地|得|了|等|吗|呢|吧|啊|呀|哦|哈|嘛|与|和|或|及|但|而|且|为|是|有|无|不|没|未|免|要|需|可|能|会|在|从|到|对|把|被|让|给|以|关于|如何|怎么|哪家|哪些|哪里|是否|如果|由于|所以|通常|建议|注意|要求|明确|适合|看看|正在|最近|刚|需要|可以|咨询|了解|找到|筛选|公开|传统|不同|大量|靠谱|准确|家庭|室内外|熟人|一样|掌握|祝您|祝你|主打|独立|这家|那家|这类|那类)/

const GENERIC_CORE_PATTERN =
  /^(?:交城|交城县|吕梁|山西|本地|当地|多数|中小型|常见|口碑好|口碑好的|靠谱|正规|普通|基础|简易|简单|中档|高档|高端|高端型|经济型|舒适型|低端|中端|全屋|整体|半包|全包|整装)*(?:装修|装修公司|装饰|装饰公司|设计|设计公司|家装|家装公司|工程|工程公司|隐蔽工程|水电工程|防水工程|木工工程)$/

function stripPlacePrefix(name: string) {
  return name.replace(/^(?:山西|吕梁|交城县?|本地|当地)+/, "")
}

function normalizeCandidate(rawName: string) {
  let name = rawName
    .trim()
    .replace(/^[>\s*\-—、，,。.：:；;（）()【】[\]"“”']+/, "")
    .replace(/[，,。.；;：:）)】\]"“”']+$/, "")
    .trim()

  let previous = ""
  while (name !== previous) {
    previous = name
    name = name.replace(LEADING_NOISE, "").trim()
  }

  return name
}

function isGenericName(name: string) {
  if (!name || name.length < 3) return true
  if (COMPETITOR_BLACKLIST.has(name)) return true
  const coreName = stripPlacePrefix(name)
  if (COMPETITOR_BLACKLIST.has(coreName)) return true
  if (SENTENCE_FRAGMENT_PATTERN.test(name)) return true
  if (GENERIC_CORE_PATTERN.test(name) || GENERIC_CORE_PATTERN.test(coreName)) {
    return true
  }
  return GENERIC_PATTERNS.some((pattern) => pattern.test(name))
}

function buildCandidateRegex() {
  const suffixPattern = COMPETITOR_SUFFIXES
    .sort((a, b) => b.length - a.length)
    .map((suffix) => suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")

  return new RegExp(`[\\u4e00-\\u9fa5A-Za-z0-9]{2,24}(?:${suffixPattern})`, "g")
}

export function extractCompetitors({
  rawOutput,
  brandName,
  brandAliases = [],
}: {
  rawOutput: string
  brandName: string
  brandAliases?: string[]
}) {
  const normalizedBrandAliases = new Set(
    [brandName, ...brandAliases].map((alias) => normalizeText(alias)).filter(Boolean)
  )
  const seen = new Set<string>()
  const results: CompetitorInsight[] = []
  const candidateRegex = buildCandidateRegex()

  for (const line of rawOutput.split("\n")) {
    const rank = parseRankFromLine(line)
    const candidates = line.match(candidateRegex) ?? []

    for (const candidate of candidates) {
      const name = normalizeCandidate(candidate)
      if (isGenericName(name)) continue
      if (name.length > 15) continue
      if (normalizedBrandAliases.has(normalizeText(name))) continue
      if (seen.has(name)) continue

      seen.add(name)
      results.push({
        name,
        rank,
        recommended: rank !== null || hasRecommendationKeyword(line),
        evidence: line.trim(),
        reasonTags: extractReasonTags(line),
      })
    }
  }

  return results
}

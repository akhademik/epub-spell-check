import { getBaseWord, levenshteinDistance } from "./analysis-core"
import { isRepeatedUnit, validateDictionaryWord } from "./dict-validator"

export type DictName = "vn" | "names" | "non-vn" | "custom"

export interface GarbageFinding {
  word: string
  dictName: DictName
  tier: "A" | "B"
  reasons: string[]
}

export interface DuplicateClusterWord {
  word: string
  garbageScore: number
  suggestion: "keep" | "delete" | "neutral"
  reasons?: string[]
}

export interface DuplicateCluster {
  id: string
  words: DuplicateClusterWord[]
  confidence: "high" | "low"
}

export interface AuditResult {
  garbage: GarbageFinding[]
  duplicateClusters: DuplicateCluster[]
}

// Regex for garbage detection
const DIGIT_RE = /\d/
const FILE_URL_RE = /pdf|http|www\.|\.com|\.net|\.org/i
// 6+ consecutive consonants (or 5 for non-standard English/German clusters like thsch, tzsch, rschm)
// In instruction 1.1: "Chuỗi phụ âm liên tiếp >= 5 ký tự, loại trừ y" (vd KLwnN, Phbcnt, QKtsq, SVPSh)
// Common legitimate multi-consonant clusters in German/English: sch, tsch, chsch, tzsch, thsch, rschm
const FIVE_CONSONANTS_RE = /[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{5,}/
const COMMON_LEGIT_CLUSTERS = /(?:thsch|tzsch|rschm|chsch|kstr|ghts)/i

const TITLECASE_MERGE_RE = /^\p{Lu}\p{Ll}+\p{Lu}\p{Ll}+$/u
const VN_EXCLUSIVE_CHARS =
  "đơưăĐƠƯĂảạằắẳẵặầấẩẫậẻẽẹềếểễệỉĩịỏọồốổỗộờớởỡợủũụừứửữựỳýỷỹỵ" +
  "ẢẠẰẮẲẴẶẦẤẨẪẬẺẼẸỀẾỂỄỆỈĨỊỎỌỒỐỔỖỘỜỚỞỠỢỦŨỤỪỨỬỮỰỲÝỶỸỴ" +
  "àáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụ" +
  "ÀÁẢÃẠÈÉẺẼẸÌÍỈĨỊÒÓỎÕỌÙÚỦŨỤ"
const VN_EXCLUSIVE_RE = new RegExp(`[${VN_EXCLUSIVE_CHARS}]`)
const VOWELS_INCLUDING_Y_RE =
  /[aeiouyáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/gi

/**
 * Calculates vowel ratio in a word (including 'y' and Vietnamese diacritics).
 */
export function getVowelRatio(word: string): number {
  if (!word || word.length === 0) return 0
  const matches = word.match(VOWELS_INCLUDING_Y_RE)
  const vowelCount = matches ? matches.length : 0
  return vowelCount / word.length
}

/**
 * Scans a list of words in a given dictionary for garbage entries.
 */
export function scanDictionaryForGarbage(
  dictName: DictName,
  words: string[]
): GarbageFinding[] {
  const findings: GarbageFinding[] = []

  for (const rawWord of words) {
    const word = rawWord.trim()
    if (!word) continue

    const tierAReasons: string[] = []
    const tierBReasons: string[] = []

    // --- Tier A Checks ---
    if (DIGIT_RE.test(word)) {
      tierAReasons.push("Chứa chữ số")
    }

    if (FILE_URL_RE.test(word)) {
      tierAReasons.push(
        "Chứa chuỗi liên quan file/URL (pdf, http, www, .com, .net, .org)"
      )
    }

    if (FIVE_CONSONANTS_RE.test(word) && !COMMON_LEGIT_CLUSTERS.test(word)) {
      tierAReasons.push("Chứa 5 phụ âm liên tiếp trở lên")
    }

    if (isRepeatedUnit(word)) {
      tierAReasons.push("Chuỗi âm thanh lặp lại (tiếng cười/thán từ)")
    }

    if (word.length > 30) {
      tierAReasons.push("Độ dài bất thường (> 30 ký tự)")
    }

    if (word.length >= 6 && getVowelRatio(word) < 0.2) {
      tierAReasons.push("Tỉ lệ nguyên âm quá thấp (< 20%) trên toàn từ")
    }

    // --- Tier B Checks ---
    if (TITLECASE_MERGE_RE.test(word)) {
      if (VN_EXCLUSIVE_RE.test(word)) {
        tierAReasons.push(
          "Dính chữ dịch thuật / chú thích (vd SignorThưa, BonjourChào)"
        )
      } else {
        tierBReasons.push(
          "Cụm TitleCase dính liền (có thể là họ ghép hoặc lỗi merge)"
        )
      }
    }

    if (dictName === "vn") {
      const val = validateDictionaryWord("vn", word)
      if (val.status !== "valid" && val.reason) {
        tierBReasons.push(val.reason)
      }
    } else if (dictName === "non-vn") {
      if (VN_EXCLUSIVE_RE.test(word)) {
        tierBReasons.push(
          "Chứa ký tự/dấu đặc trưng tiếng Việt trong từ điển ngoại ngữ"
        )
      }
    }

    if (tierAReasons.length > 0) {
      findings.push({
        word,
        dictName,
        tier: "A",
        reasons: [...tierAReasons, ...tierBReasons]
      })
    } else if (tierBReasons.length > 0) {
      findings.push({
        word,
        dictName,
        tier: "B",
        reasons: tierBReasons
      })
    }
  }

  return findings
}

/**
 * Creates canonical pair key for ignored pairs (sorted lowercase joined with '|').
 */
export function createPairKey(w1: string, w2: string): string {
  const [a, b] = [w1.toLowerCase().trim(), w2.toLowerCase().trim()].sort()
  return `${a}|${b}`
}

/**
 * Detects fuzzy near-duplicate words within the same dictionary.
 */
export function detectFuzzyDuplicates(
  dictName: DictName,
  words: string[],
  ignoredPairs: Set<string> = new Set()
): DuplicateCluster[] {
  // Pre-calculate garbage findings for scoring
  const garbageList = scanDictionaryForGarbage(dictName, words)
  const garbageMap = new Map<string, GarbageFinding>()
  for (const g of garbageList) {
    garbageMap.set(g.word, g)
  }

  // Deduplicate and prepare word metadata
  const uniqueWords = Array.from(
    new Set(words.map((w) => w.trim()).filter(Boolean))
  )
  const wordEntries = uniqueWords.map((w) => {
    const lower = w.toLowerCase().normalize("NFC")
    const base = dictName === "vn" ? getBaseWord(lower) : lower
    return {
      raw: w,
      lower,
      base,
      len: w.length,
      garbage: garbageMap.get(w)
    }
  })

  // Bucketing by length
  const bucketMap = new Map<number, typeof wordEntries>()
  for (const entry of wordEntries) {
    const len = entry.len
    const bucket = bucketMap.get(len)
    if (!bucket) {
      bucketMap.set(len, [entry])
    } else {
      bucket.push(entry)
    }
  }

  // Union-Find data structure for clustering
  const parent = new Map<string, string>()
  function find(i: string): string {
    const p = parent.get(i)
    if (!p) {
      parent.set(i, i)
      return i
    }
    if (p !== i) {
      const root = find(p)
      parent.set(i, root)
      return root
    }
    return p
  }
  function union(i: string, j: string) {
    const rootI = find(i)
    const rootJ = find(j)
    if (rootI !== rootJ) {
      parent.set(rootI, rootJ)
    }
  }

  const pairMeta = new Map<string, { confidence: "high" | "low" }>()

  // Fast clustering: Compare candidates in same/adjacent length buckets
  // To avoid O(N^2) pairwise comparison on 50,000+ words, we partition words by first 1-2 characters
  const sortedLengths = Array.from(bucketMap.keys()).sort((a, b) => a - b)

  for (const lenA of sortedLengths) {
    const listA = bucketMap.get(lenA) || []
    const candidateLengths = [lenA, lenA + 1, lenA + 2]

    // Create prefix map for listA to speed up lookups
    for (const lenB of candidateLengths) {
      const listB = bucketMap.get(lenB) || []
      const isSameList = lenA === lenB

      for (let i = 0; i < listA.length; i++) {
        const entryA = listA[i]
        const charA0 = entryA.lower[0]
        const startJ = isSameList ? i + 1 : 0

        for (let j = startJ; j < listB.length; j++) {
          const entryB = listB[j]
          const charB0 = entryB.lower[0]

          // Fast pruning: If lengths are equal and first 2 characters differ completely,
          // Levenshtein distance >= 2 unless it's a 1-char edit at the very start
          // For Levenshtein <= 2, first chars must either match or be within 1 position
          if (
            entryA.len === entryB.len &&
            charA0 !== charB0 &&
            entryA.lower[1] !== entryB.lower[1] &&
            entryA.lower[1] !== charB0 &&
            entryB.lower[1] !== charA0
          ) {
            continue
          }

          if (entryA.lower === entryB.lower) continue

          const pairKey = createPairKey(entryA.raw, entryB.raw)
          if (ignoredPairs.has(pairKey)) continue

          const dist = levenshteinDistance(entryA.lower, entryB.lower, 2)
          if (dist >= 1 && dist <= 2) {
            union(entryA.raw, entryB.raw)

            const isAValid = !entryA.garbage
            const isBValid = !entryB.garbage
            const isBothLongAndValid =
              isAValid && isBValid && entryA.len >= 8 && entryB.len >= 8

            const confidence: "high" | "low" = isBothLongAndValid
              ? "low"
              : "high"
            pairMeta.set(pairKey, { confidence })
          }
        }
      }
    }
  }

  // Group connected components
  const clusterGroups = new Map<string, typeof wordEntries>()
  for (const entry of wordEntries) {
    if (parent.has(entry.raw)) {
      const root = find(entry.raw)
      const group = clusterGroups.get(root)
      if (!group) {
        clusterGroups.set(root, [entry])
      } else {
        group.push(entry)
      }
    }
  }

  const resultClusters: DuplicateCluster[] = []
  let clusterIdCounter = 1

  for (const [, entries] of clusterGroups) {
    if (entries.length < 2) continue

    // Determine confidence: if any pair is low, or all long valid
    let overallConfidence: "high" | "low" = "high"
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const pk = createPairKey(entries[i].raw, entries[j].raw)
        if (pairMeta.get(pk)?.confidence === "low") {
          overallConfidence = "low"
        }
      }
    }

    // Score entries
    const clusterWords: DuplicateClusterWord[] = entries.map((e) => {
      let score = 0
      let reasons: string[] | undefined
      if (e.garbage) {
        score = e.garbage.tier === "A" ? 100 : 40
        reasons = e.garbage.reasons
      }
      return {
        word: e.raw,
        garbageScore: score,
        suggestion: "neutral",
        reasons
      }
    })

    // Sort by garbageScore descending
    clusterWords.sort((a, b) => b.garbageScore - a.garbageScore)

    const maxScore = clusterWords[0].garbageScore
    const minScore = clusterWords[clusterWords.length - 1].garbageScore

    if (maxScore > 0 && maxScore > minScore) {
      for (const cw of clusterWords) {
        if (cw.garbageScore === maxScore) {
          cw.suggestion = "delete"
        } else if (cw.garbageScore === minScore) {
          cw.suggestion = "keep"
        } else {
          cw.suggestion = "neutral"
        }
      }
    }

    resultClusters.push({
      id: `cluster-${clusterIdCounter++}`,
      words: clusterWords,
      confidence: overallConfidence
    })
  }

  return resultClusters
}

/**
 * Runs a complete audit on a dictionary.
 */
export function auditDictionary(
  dictName: DictName,
  words: string[],
  ignoredPairs: Set<string> = new Set()
): AuditResult {
  return {
    garbage: scanDictionaryForGarbage(dictName, words),
    duplicateClusters: detectFuzzyDuplicates(dictName, words, ignoredPairs)
  }
}

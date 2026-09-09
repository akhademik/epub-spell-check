import { levenshteinDistance } from "./analysis-core"
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

export interface AuditTiming {
  garbageScanMs: number
  indexBuildMs: number
  candidateCount: number
  levenshteinCheckCount: number
  matchedPairCount: number
  clusterCount: number
  fuzzyScanMs: number
  totalMs: number
}

export interface AuditResult {
  garbage: GarbageFinding[]
  duplicateClusters: DuplicateCluster[]
  timing?: AuditTiming
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
 * Accepts precomputed garbageFindings to avoid redundant scanning.
 */
export function detectFuzzyDuplicates(
  dictName: DictName,
  words: string[],
  ignoredPairs: Set<string> = new Set(),
  precomputedGarbage?: GarbageFinding[],
  timingCollector?: Partial<AuditTiming>
): DuplicateCluster[] {
  const indexStart = performance.now()

  // Pre-calculate garbage findings for scoring (use precomputed if passed)
  const garbageList =
    precomputedGarbage ?? scanDictionaryForGarbage(dictName, words)
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
    return {
      raw: w,
      lower,
      len: lower.length,
      garbage: garbageMap.get(w)
    }
  })

  // 1. Build Inverted Index for Fast Candidate Retrieval (Edit distance <= 2)
  // For Levenshtein distance <= 2:
  // - Short words (len <= 4): use exact / length prefix signatures or 1-del
  // - Medium & Long words (len >= 3): 1-del signatures + sliding 3-grams within same length window (lenDiff <= 2)
  const signatureIndex = new Map<string, number[]>()

  function addSignature(sig: string, idx: number) {
    let list = signatureIndex.get(sig)
    if (!list) {
      list = []
      signatureIndex.set(sig, list)
    }
    list.push(idx)
  }

  for (let i = 0; i < wordEntries.length; i++) {
    const entry = wordEntries[i]
    const w = entry.lower
    const len = entry.len

    if (len < 3) {
      addSignature(`short:${w}`, i)
      continue
    }

    // 1-character deletion signatures (guarantees finding single insertion / deletion / substitution)
    if (len <= 25) {
      for (let pos = 0; pos < len; pos++) {
        const delSig = `del:${w.slice(0, pos)}${w.slice(pos + 1)}`
        addSignature(delSig, i)
      }
    }

    // 3-gram signatures partitioned by length window (len-2, len-1, len, len+1, len+2)
    // for catching 2-substitution cases without blowing up candidates across drastically different word lengths
    if (len >= 4 && len <= 25) {
      for (let pos = 0; pos <= len - 3; pos++) {
        const gram = w.slice(pos, pos + 3)
        addSignature(`g3:${len}:${gram}`, i)
      }
    }
  }

  if (timingCollector) {
    timingCollector.indexBuildMs = Math.round(performance.now() - indexStart)
  }

  const fuzzyStart = performance.now()
  let candidateCount = 0
  let levenshteinChecks = 0
  let matchedPairs = 0

  // Union-Find data structure with cluster-level confidence tracking
  const parent = new Map<string, string>()
  const clusterConfidence = new Map<string, "high" | "low">()

  function find(i: string): string {
    const p = parent.get(i)
    if (!p) {
      parent.set(i, i)
      clusterConfidence.set(i, "high")
      return i
    }
    if (p !== i) {
      const root = find(p)
      parent.set(i, root)
      return root
    }
    return p
  }

  function union(i: string, j: string, pairConfidence: "high" | "low") {
    const rootI = find(i)
    const rootJ = find(j)
    if (rootI !== rootJ) {
      parent.set(rootI, rootJ)
      const confI = clusterConfidence.get(rootI) ?? "high"
      const confJ = clusterConfidence.get(rootJ) ?? "high"
      const mergedConf: "high" | "low" =
        pairConfidence === "low" || confI === "low" || confJ === "low"
          ? "low"
          : "high"
      clusterConfidence.set(rootJ, mergedConf)
    } else if (pairConfidence === "low") {
      clusterConfidence.set(rootI, "low")
    }
  }

  // 2. Query Candidate Pairs from Inverted Index
  for (let i = 0; i < wordEntries.length; i++) {
    const entryA = wordEntries[i]
    const wA = entryA.lower
    const lenA = entryA.len

    // Collect candidate indices (only j > i so every pair is examined at most once)
    const candidateIndices = new Set<number>()

    if (lenA < 3) {
      const shortList = signatureIndex.get(`short:${wA}`)
      if (shortList) {
        for (const idx of shortList) if (idx > i) candidateIndices.add(idx)
      }
    } else {
      // Query 1-del signatures
      if (lenA <= 25) {
        for (let pos = 0; pos < lenA; pos++) {
          const delSig = `del:${wA.slice(0, pos)}${wA.slice(pos + 1)}`
          const delList = signatureIndex.get(delSig)
          if (delList) {
            for (const idx of delList) if (idx > i) candidateIndices.add(idx)
          }
        }
      }

      // Query length-partitioned 3-grams within window [lenA - 2, lenA + 2]
      if (lenA >= 4 && lenA <= 25) {
        for (let pos = 0; pos <= lenA - 3; pos++) {
          const gram = wA.slice(pos, pos + 3)
          for (
            let targetLen = Math.max(4, lenA - 2);
            targetLen <= Math.min(25, lenA + 2);
            targetLen++
          ) {
            const gList = signatureIndex.get(`g3:${targetLen}:${gram}`)
            if (gList) {
              for (const idx of gList) if (idx > i) candidateIndices.add(idx)
            }
          }
        }
      }
    }

    candidateCount += candidateIndices.size

    // 3. Verify candidates with Levenshtein Distance <= 2
    for (const j of candidateIndices) {
      const entryB = wordEntries[j]
      const lenB = entryB.len

      // Fast length-filter: length difference must be <= 2
      const lenDiff = Math.abs(lenA - lenB)
      if (lenDiff > 2) continue

      if (entryA.lower === entryB.lower) continue

      const pairKey = createPairKey(entryA.raw, entryB.raw)
      if (ignoredPairs.has(pairKey)) continue

      levenshteinChecks++

      const dist = levenshteinDistance(entryA.lower, entryB.lower, 2)
      if (dist >= 1 && dist <= 2) {
        matchedPairs++
        const isAValid = !entryA.garbage
        const isBValid = !entryB.garbage
        const isBothLongAndValid =
          isAValid && isBValid && entryA.len >= 8 && entryB.len >= 8

        const pairConfidence: "high" | "low" = isBothLongAndValid
          ? "low"
          : "high"

        union(entryA.raw, entryB.raw, pairConfidence)
      }
    }
  }

  if (timingCollector) {
    timingCollector.candidateCount = candidateCount
    timingCollector.levenshteinCheckCount = levenshteinChecks
    timingCollector.matchedPairCount = matchedPairs
    timingCollector.fuzzyScanMs = Math.round(performance.now() - fuzzyStart)
  }

  // 4. Group connected components
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

  for (const [root, entries] of clusterGroups) {
    if (entries.length < 2) continue

    const overallConfidence = clusterConfidence.get(root) ?? "high"

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

  if (timingCollector) {
    timingCollector.clusterCount = resultClusters.length
  }

  return resultClusters
}

/**
 * Runs a complete audit on a dictionary with single-pass garbage scan and performance metrics.
 */
export function auditDictionary(
  dictName: DictName,
  words: string[],
  ignoredPairs: Set<string> = new Set()
): AuditResult {
  const startTime = performance.now()
  const timingCollector: Partial<AuditTiming> = {}

  // 1. Single-pass Garbage Scan
  const garbageStart = performance.now()
  const garbage = scanDictionaryForGarbage(dictName, words)
  timingCollector.garbageScanMs = Math.round(performance.now() - garbageStart)

  // 2. Fuzzy Near-duplicate Detection (reusing garbage findings)
  const duplicateClusters = detectFuzzyDuplicates(
    dictName,
    words,
    ignoredPairs,
    garbage,
    timingCollector
  )

  timingCollector.totalMs = Math.round(performance.now() - startTime)

  return {
    garbage,
    duplicateClusters,
    timing: {
      garbageScanMs: timingCollector.garbageScanMs ?? 0,
      indexBuildMs: timingCollector.indexBuildMs ?? 0,
      candidateCount: timingCollector.candidateCount ?? 0,
      levenshteinCheckCount: timingCollector.levenshteinCheckCount ?? 0,
      matchedPairCount: timingCollector.matchedPairCount ?? 0,
      clusterCount: timingCollector.clusterCount ?? 0,
      fuzzyScanMs: timingCollector.fuzzyScanMs ?? 0,
      totalMs: timingCollector.totalMs ?? 0
    }
  }
}

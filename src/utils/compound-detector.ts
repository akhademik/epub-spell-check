import type { Dictionaries } from "../types/dictionary"
import type { ErrorInstance } from "../types/errors"
import {
  getAlternateToneStyle,
  getBaseWordWithoutD,
  levenshteinDistance
} from "./analysis-core"
import { CONFUSABLE_RULES } from "./context-confusion"
import { logger } from "./logger"

export interface CompoundIndex {
  exactSet: Set<string>
  byTokenCount: Map<number, Set<string>>
  byFirstToken: Map<string, string[]>
  byLastToken: Map<string, string[]>
  byTokenAndLength: Map<number, Map<string, string[]>>
}

let cachedCompoundIndex: CompoundIndex | null = null

/**
 * Builds an optimized multi-level index for fast compound matching.
 */
export function buildCompoundIndex(compounds: Iterable<string>): CompoundIndex {
  const exactSet = new Set<string>()
  const byTokenCount = new Map<number, Set<string>>()
  const byFirstToken = new Map<string, string[]>()
  const byLastToken = new Map<string, string[]>()
  const byTokenAndLength = new Map<number, Map<string, string[]>>()

  for (const raw of compounds) {
    const norm = raw.trim().toLowerCase().normalize("NFC")
    if (!norm?.includes(" ")) continue

    exactSet.add(norm)

    const tokens = norm.split(/\s+/)
    const count = tokens.length
    if (count < 2 || count > 4) continue

    let countSet = byTokenCount.get(count)
    if (!countSet) {
      countSet = new Set()
      byTokenCount.set(count, countSet)
    }
    countSet.add(norm)

    if (count === 2) {
      const first = tokens[0]
      const last = tokens[1]

      let firstList = byFirstToken.get(first)
      if (!firstList) {
        firstList = []
        byFirstToken.set(first, firstList)
      }
      firstList.push(norm)

      let lastList = byLastToken.get(last)
      if (!lastList) {
        lastList = []
        byLastToken.set(last, lastList)
      }
      lastList.push(norm)
    } else {
      let lenMap = byTokenAndLength.get(count)
      if (!lenMap) {
        lenMap = new Map()
        byTokenAndLength.set(count, lenMap)
      }
      for (const tok of tokens) {
        let tokList = lenMap.get(tok)
        if (!tokList) {
          tokList = []
          lenMap.set(tok, tokList)
        }
        tokList.push(norm)
      }
    }
  }

  return {
    exactSet,
    byTokenCount,
    byFirstToken,
    byLastToken,
    byTokenAndLength
  }
}

/**
 * Loads the Underthesea Vietnamese compound words dictionary and builds index.
 * Cached in memory during session.
 */
export async function loadCompoundIndex(): Promise<CompoundIndex> {
  if (cachedCompoundIndex && cachedCompoundIndex.exactSet.size > 0) {
    return cachedCompoundIndex
  }

  const compounds: string[] = []
  try {
    const res = await fetch("/underthesea-words.txt")
    if (res.ok) {
      const text = await res.text()
      const lines = text.split(/\r?\n/)
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed) compounds.push(trimmed)
      }
    }
  } catch (err) {
    logger.warn("Could not fetch /underthesea-words.txt:", err)
  }

  cachedCompoundIndex = buildCompoundIndex(compounds)
  return cachedCompoundIndex
}

/**
 * Checks if a token should be exempt from compound spell-check (names, foreign words, custom words).
 */
function isExemptToken(token: string, dictionaries?: Dictionaries): boolean {
  if (!dictionaries) return false
  const low = token.toLowerCase().normalize("NFC")
  const lowerStraight = low.replace(/’/g, "'")

  if (dictionaries.custom.has(token) || dictionaries.custom.has(low))
    return true
  if (
    dictionaries.names &&
    (dictionaries.names.has(token) || dictionaries.names.has(low))
  )
    return true
  if (
    dictionaries.nonVietnamese &&
    (dictionaries.nonVietnamese.has(low) ||
      dictionaries.nonVietnamese.has(lowerStraight))
  )
    return true

  return false
}

// Known Vietnamese phonetic / orthographic confusion patterns:
// 1. Initial consonants: s/x, d/gi/r, tr/ch, l/n, v/d
// 2. Final consonants / vowels: n/ng, m/n, c/t, ch/c, i/y, o/u
// 3. Tones: hỏi <-> ngã, sắc <-> nặng, no diacritics
function isPhoneticallyConfusable(wordA: string, wordB: string): boolean {
  if (wordA === wordB) return true
  const baseA = getBaseWordWithoutD(wordA)
  const baseB = getBaseWordWithoutD(wordB)

  // 1. Same base syllable (e.g. nghiên vs nghiêm -> 'nghien' vs 'nghiem' diff at end consonant, or tone diff)
  if (baseA === baseB) return true

  // 2. Common final consonant swaps in Vietnamese: n<->m, n<->ng, c<->t, ch<->t
  if (
    (baseA.endsWith("n") && baseB.endsWith("m")) ||
    (baseA.endsWith("m") && baseB.endsWith("n")) ||
    (baseA.endsWith("n") && baseB.endsWith("ng")) ||
    (baseA.endsWith("ng") && baseB.endsWith("n")) ||
    (baseA.endsWith("c") && baseB.endsWith("t")) ||
    (baseA.endsWith("t") && baseB.endsWith("c")) ||
    (baseA.endsWith("ch") && baseB.endsWith("c")) ||
    (baseA.endsWith("c") && baseB.endsWith("ch"))
  ) {
    const rootA = baseA.replace(/(ng|ch|n|m|c|t)$/, "")
    const rootB = baseB.replace(/(ng|ch|n|m|c|t)$/, "")
    if (rootA === rootB) return true
  }

  // 3. Common initial consonant swaps: s<->x, d<->gi, r<->d, tr<->ch, l<->n
  const initialPairs: [string, string][] = [
    ["s", "x"],
    ["x", "s"],
    ["d", "gi"],
    ["gi", "d"],
    ["r", "d"],
    ["d", "r"],
    ["tr", "ch"],
    ["ch", "tr"],
    ["l", "n"],
    ["n", "l"]
  ]
  for (const [from, to] of initialPairs) {
    if (baseA.startsWith(from) && baseB.startsWith(to)) {
      if (baseA.slice(from.length) === baseB.slice(to.length)) {
        return true
      }
    }
  }

  return false
}

// Common Vietnamese function words (particles, prepositions, copula, auxiliaries, classifiers)
const FUNCTION_WORDS = new Set([
  "là",
  "và",
  "của",
  "cho",
  "với",
  "ở",
  "để",
  "đã",
  "đang",
  "sẽ",
  "bị",
  "được",
  "một",
  "những",
  "các",
  "vào",
  "ra",
  "lên",
  "xuống",
  "qua",
  "lại",
  "thì",
  "mà",
  "nhưng",
  "hay",
  "hoặc",
  "do",
  "bởi",
  "tại",
  "vì",
  "nên",
  "nếu",
  "tuy",
  "dù",
  "rằng",
  "như",
  "trong",
  "ngoài",
  "trên",
  "dưới",
  "sau",
  "trước",
  "này",
  "đó",
  "kia",
  "nào",
  "đâu",
  "ai",
  "gì",
  "sao",
  "mỗi",
  "từng",
  "mọi",
  "rất",
  "quá",
  "lắm",
  "hơn",
  "nhất"
])

// Common Vietnamese pronouns & subject markers
const PRONOUNS = new Set([
  "tôi",
  "ta",
  "tao",
  "tớ",
  "mình",
  "chúng",
  "chúng_tôi",
  "chúng_ta",
  "bạn",
  "cậu",
  "mày",
  "anh",
  "chị",
  "em",
  "ông",
  "bà",
  "bác",
  "chú",
  "cô",
  "dì",
  "thím",
  "cháu",
  "con",
  "nó",
  "họ",
  "hắn",
  "gã",
  "y",
  "người",
  "ai",
  "đây",
  "đó",
  "kia"
])

/**
 * Computes grammatical/function-word penalty and contextual incompatibility score.
 * Looks at previous 2-4 tokens and next 2-4 tokens to verify if the original tokens
 * are acting as grammatical markers (e.g. "món ăn do ông thầy" -> 'do' is a preposition, not typo for 'dở').
 */
function getGrammaticalPenalty(
  phraseWords: string[],
  prevWords: string[],
  nextWords: string[]
): number {
  let penalty = 0

  // 1. Direct Pronoun + Function word patterns (e.g. "bạn là", "tôi là")
  if (phraseWords.length === 2) {
    const [w0, w1] = phraseWords
    if (PRONOUNS.has(w0) && FUNCTION_WORDS.has(w1)) penalty += 60
    if (FUNCTION_WORDS.has(w0) && PRONOUNS.has(w1)) penalty += 60
    if (FUNCTION_WORDS.has(w0) && FUNCTION_WORDS.has(w1)) penalty += 50
  }

  // 2. All tokens in phrase are function words / pronouns
  const allFunc = phraseWords.every(
    (w) => FUNCTION_WORDS.has(w) || PRONOUNS.has(w)
  )
  if (allFunc) penalty += 70

  // 3. Contextual inspection:
  // If adjacent previous/next word binds the token grammatically:
  // e.g. "món ăn" + "do" + "ông thầy" -> prevWord is 'ăn', nextWord is 'ông' (noun/agent)
  if (prevWords.length > 0) {
    const lastPrev = prevWords[prevWords.length - 1]
    // If preceded by preposition/particle connecting a clause
    if (FUNCTION_WORDS.has(lastPrev) && FUNCTION_WORDS.has(phraseWords[0])) {
      penalty += 30
    }
  }

  if (nextWords.length > 0) {
    const firstNext = nextWords[0]
    // If followed by pronoun or function word (e.g., phrase + "của", phrase + "tôi")
    if (FUNCTION_WORDS.has(firstNext) || PRONOUNS.has(firstNext)) {
      if (FUNCTION_WORDS.has(phraseWords[phraseWords.length - 1])) {
        penalty += 20
      }
    }
  }

  return penalty
}

const confusableWrongPhrases = new Set(
  CONFUSABLE_RULES.map((r) => r.wrongPhrase.toLowerCase().normalize("NFC"))
)

/**
 * Scans text for dynamic compound errors using Underthesea index and sliding window (2-4 words).
 * Precision-first: only flags phrases where a very strong candidate exists and individual typo cost is minimal.
 */
export function scanDynamicCompoundErrors(
  text: string,
  index: CompoundIndex,
  meta: {
    paragraphIndex: number
    chapterIndex?: number
    filePath?: string
    blockId?: string
  },
  dictionaries?: Dictionaries
): ErrorInstance[] {
  if (!text || text.length < 5) return []
  const normText = text.normalize("NFC")
  const errors: ErrorInstance[] = []

  // Tokenize preserving start & end offsets
  const tokenRegex = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu
  const tokens: { word: string; start: number; end: number }[] = []
  let match: RegExpExecArray | null

  while (true) {
    match = tokenRegex.exec(normText)
    if (match === null) break
    tokens.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length
    })
  }

  if (tokens.length < 2) return []

  // Sliding window: test 2-word, 3-word, and 4-word windows
  for (let windowSize = 2; windowSize <= 4; windowSize++) {
    for (let i = 0; i <= tokens.length - windowSize; i++) {
      const windowTokens = tokens.slice(i, i + windowSize)

      // Ensure tokens are contiguous (only whitespace between them)
      let isContiguous = true
      for (let j = 0; j < windowTokens.length - 1; j++) {
        const gap = normText.slice(
          windowTokens[j].end,
          windowTokens[j + 1].start
        )
        if (!/^\s+$/.test(gap)) {
          isContiguous = false
          break
        }
      }
      if (!isContiguous) continue

      // Check exemption for all tokens
      if (windowTokens.some((t) => isExemptToken(t.word, dictionaries))) {
        continue
      }

      // Ensure all tokens in window are valid recognized words (if dictionaries provided)
      if (dictionaries?.vietnamese && dictionaries.vietnamese.size > 0) {
        const allValid = windowTokens.every((t) => {
          const l = t.word.toLowerCase()
          return (
            dictionaries.vietnamese.has(l) ||
            dictionaries.vietnamese.has(getAlternateToneStyle(l) || "") ||
            dictionaries.custom?.has(t.word) ||
            dictionaries.names?.has(t.word) ||
            dictionaries.nonVietnamese?.has(l)
          )
        })
        if (!allValid) continue
      }

      const phraseWords = windowTokens.map((t) => t.word.toLowerCase())
      const phraseStr = phraseWords.join(" ")

      // 1. If phrase already exists in Underthesea compound lexicon -> valid, do not flag!
      if (index.exactSet.has(phraseStr)) {
        continue
      }

      // 2. If phrase is already covered by curated hard-coded CONFUSABLE_RULES -> skip here (curated wins)
      if (confusableWrongPhrases.has(phraseStr)) {
        continue
      }

      // 3. Extract surrounding context (prev 2-3 words and next 2-3 words)
      const prevWords = tokens
        .slice(Math.max(0, i - 3), i)
        .map((t) => t.word.toLowerCase())
      const nextWords = tokens
        .slice(i + windowSize, i + windowSize + 3)
        .map((t) => t.word.toLowerCase())

      const gramPenalty = getGrammaticalPenalty(
        phraseWords,
        prevWords,
        nextWords
      )
      if (gramPenalty >= 60) {
        continue
      }

      const phraseStart = windowTokens[0].start
      const phraseEnd = windowTokens[windowTokens.length - 1].end

      // 4. Candidate generation: gather candidate compounds with shared tokens
      const candidateMap = new Map<string, number>()

      if (windowSize === 2) {
        const [w0, w1] = phraseWords
        const candidatesByLast = index.byLastToken.get(w1) || []
        const candidatesByFirst = index.byFirstToken.get(w0) || []

        // Evaluate candidates where w1 matches (e.g. nghiên trọng -> [candidate] trọng)
        for (const cand of candidatesByLast) {
          const candTokens = cand.split(/\s+/)
          if (candTokens.length !== 2) continue
          const [candW0] = candTokens

          if (Math.abs(w0.length - candW0.length) > 1) continue
          if (!isPhoneticallyConfusable(w0, candW0)) continue

          const charDist = levenshteinDistance(w0, candW0, 1)
          if (charDist <= 1) {
            const baseDist = levenshteinDistance(
              getBaseWordWithoutD(w0),
              getBaseWordWithoutD(candW0),
              1
            )
            const score = 100 - charDist * 20 - baseDist * 10 - gramPenalty
            candidateMap.set(cand, Math.max(candidateMap.get(cand) || 0, score))
          }
        }

        // Evaluate candidates where w0 matches (e.g. nghiêm trọn -> nghiêm [candidate])
        for (const cand of candidatesByFirst) {
          const candTokens = cand.split(/\s+/)
          if (candTokens.length !== 2) continue
          const [, candW1] = candTokens

          if (Math.abs(w1.length - candW1.length) > 1) continue
          if (!isPhoneticallyConfusable(w1, candW1)) continue

          const charDist = levenshteinDistance(w1, candW1, 1)
          if (charDist <= 1) {
            const baseDist = levenshteinDistance(
              getBaseWordWithoutD(w1),
              getBaseWordWithoutD(candW1),
              1
            )
            const score = 100 - charDist * 20 - baseDist * 10 - gramPenalty
            candidateMap.set(cand, Math.max(candidateMap.get(cand) || 0, score))
          }
        }
      } else {
        // Window size >= 3: candidate must share at least (windowSize - 1) tokens
        const lenMap = index.byTokenAndLength?.get(windowSize)
        if (!lenMap) continue

        const candidateSet = new Set<string>()
        for (const tok of phraseWords) {
          const matched = lenMap.get(tok)
          if (matched) {
            for (const c of matched) {
              candidateSet.add(c)
            }
          }
        }

        for (const cand of candidateSet) {
          const candTokens = cand.split(/\s+/)
          if (candTokens.length !== windowSize) continue

          let matchCount = 0
          let diffIndex = -1
          for (let k = 0; k < windowSize; k++) {
            if (candTokens[k] === phraseWords[k]) {
              matchCount++
            } else {
              diffIndex = k
            }
          }

          if (matchCount === windowSize - 1 && diffIndex !== -1) {
            const originalDiff = phraseWords[diffIndex]
            const candDiff = candTokens[diffIndex]
            if (Math.abs(originalDiff.length - candDiff.length) > 1) continue
            if (!isPhoneticallyConfusable(originalDiff, candDiff)) continue

            const charDist = levenshteinDistance(originalDiff, candDiff, 1)
            if (charDist <= 1) {
              const baseDist = levenshteinDistance(
                getBaseWordWithoutD(originalDiff),
                getBaseWordWithoutD(candDiff),
                1
              )
              const score = 100 - charDist * 20 - baseDist * 10 - gramPenalty
              candidateMap.set(
                cand,
                Math.max(candidateMap.get(cand) || 0, score)
              )
            }
          }
        }
      }

      if (candidateMap.size > 0) {
        // Pick best candidates sorted by score
        const sortedCandidates = Array.from(candidateMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([cand]) => cand)

        const bestScore = candidateMap.get(sortedCandidates[0]) || 0
        // Policy: High confidence threshold >= 70
        if (bestScore >= 70) {
          const rawMatchedText = normText.slice(phraseStart, phraseEnd)
          const instanceId = `${meta.blockId || meta.paragraphIndex}-${phraseStart}-${phraseEnd}-cmp`

          errors.push({
            id: instanceId,
            word: rawMatchedText,
            originalWord: rawMatchedText,
            type: "ContextConfusion",
            reason: `Gợi ý từ ghép chuẩn: '${sortedCandidates[0]}'`,
            suggestions: sortedCandidates.slice(0, 3),
            context: {
              originalParagraph: normText,
              startIndex: phraseStart,
              endIndex: phraseEnd,
              matchIndex: phraseStart,
              chapterIndex: meta.chapterIndex ?? 0,
              paragraphIndex: meta.paragraphIndex,
              filePath: meta.filePath,
              blockId: meta.blockId
            }
          })
        }
      }
    }
  }

  return errors
}

/**
 * Resolves overlaps between token-level errors and compound / contextual errors.
 * Hierarchy:
 * 1. Curated ContextConfusion (from CONFUSABLE_RULES) wins highest priority.
 * 2. Dynamic Compound ContextConfusion (from Underthesea) wins over token errors.
 * 3. Token-level errors covered by any compound/contextual span are suppressed.
 */
export function resolveOverlappingErrors(
  errors: ErrorInstance[]
): ErrorInstance[] {
  if (errors.length <= 1) return errors

  // Separate compound/contextual errors vs token-level errors
  const contextErrors = errors.filter((e) => e.type === "ContextConfusion")
  const otherErrors = errors.filter((e) => e.type !== "ContextConfusion")

  if (contextErrors.length === 0) return errors

  // Deduplicate overlapping context errors (longer span or curated wins)
  const sortedContext = [...contextErrors].sort((a, b) => {
    const lenA = a.context.endIndex - a.context.startIndex
    const lenB = b.context.endIndex - b.context.startIndex
    return lenB - lenA
  })

  const keptContext: ErrorInstance[] = []
  for (const c of sortedContext) {
    const overlaps = keptContext.some((existing) => {
      if (
        c.context.paragraphIndex !== existing.context.paragraphIndex ||
        c.context.filePath !== existing.context.filePath
      ) {
        return false
      }
      return (
        c.context.startIndex < existing.context.endIndex &&
        c.context.endIndex > existing.context.startIndex
      )
    })
    if (!overlaps) {
      keptContext.push(c)
    }
  }

  // Filter other errors that overlap with any keptContext error
  const keptOther = otherErrors.filter((tok) => {
    const isCovered = keptContext.some((ctx) => {
      if (
        tok.context.paragraphIndex !== ctx.context.paragraphIndex ||
        tok.context.filePath !== ctx.context.filePath
      ) {
        return false
      }
      return (
        tok.context.startIndex >= ctx.context.startIndex &&
        tok.context.endIndex <= ctx.context.endIndex
      )
    })
    return !isCovered
  })

  // Return combined errors sorted by paragraph and startIndex
  return [...keptContext, ...keptOther].sort((a, b) => {
    if (a.context.paragraphIndex !== b.context.paragraphIndex) {
      return a.context.paragraphIndex - b.context.paragraphIndex
    }
    return a.context.startIndex - b.context.startIndex
  })
}

import {
  MAX_PRIMARY_SUGGESTION_COUNT,
  MAX_SECONDARY_SUGGESTION_COUNT,
  MAX_SUGGESTION_COUNT
} from "../constants"
import type { Dictionaries, IndexedDictionary } from "../types/dictionary"
import type {
  ErrorGroup,
  ErrorInstance,
  TieredSuggestions
} from "../types/errors"
import { getBaseWord, levenshteinDistance } from "./analysis-core"
import { buildIndexedDictionary } from "./dictionary"
import { getWordFrequency } from "./vn-frequency"

// In-session suggestion memoization cache
const suggestionCache = new Map<string, string[]>()
const tieredSuggestionCache = new Map<string, TieredSuggestions>()

export function clearSuggestionCache(): void {
  suggestionCache.clear()
  tieredSuggestionCache.clear()
}

// Common Vietnamese tone mark pairs (hỏi <-> ngã, sắc <-> nặng)
const VI_TONE_PAIRS: [string, string][] = [
  ["ả", "ã"],
  ["ẳ", "ẵ"],
  ["ẩ", "ẫ"],
  ["ẻ", "ẽ"],
  ["ể", "ễ"],
  ["ỉ", "ĩ"],
  ["ỏ", "õ"],
  ["ổ", "ỗ"],
  ["ở", "ỡ"],
  ["ủ", "ũ"],
  ["ử", "ữ"],
  ["ỷ", "ỹ"],
  ["á", "ạ"],
  ["ắ", "ặ"],
  ["ấ", "ậ"],
  ["é", "ẹ"],
  ["ế", "ệ"],
  ["í", "ị"],
  ["ó", "ọ"],
  ["ố", "ộ"],
  ["ớ", "ợ"],
  ["ú", "ụ"],
  ["ứ", "ự"],
  ["ý", "ỵ"]
]

/**
 * Returns tiered suggestions for a word:
 * - primary: high-confidence suggestions (exact tone swaps, edit distance <= 1 with identical base word)
 * - secondary: broader suggestions (edit distance <= 2, vowel/foreign spelling phonetic match, names like Hymalya -> Himalaya)
 */
export function findTieredSuggestions(
  word: string,
  dictionaries: Dictionaries
): TieredSuggestions {
  const normWord = word.normalize("NFC")
  const cached = tieredSuggestionCache.get(normWord)
  if (cached) {
    return cached
  }

  const low = normWord.toLowerCase()
  const baseLow = getBaseWord(low)
  const primarySet = new Set<string>()
  const secondarySet = new Set<string>()
  const seenLower = new Set<string>()

  const primaryCandidatesMap = new Map<
    string,
    { word: string; score: number }
  >()
  const secondaryCandidatesMap = new Map<
    string,
    { word: string; score: number }
  >()

  function addCandidate(
    map: Map<string, { word: string; score: number }>,
    candidateWord: string,
    score: number
  ) {
    const lowKey = candidateWord.toLowerCase()
    const existing = map.get(lowKey)
    if (!existing || score < existing.score) {
      map.set(lowKey, { word: candidateWord, score })
    }
  }

  // 1. Direct Vietnamese Tone Mark Swap (Highest confidence, e.g. chổ -> chỗ)
  if (dictionaries.vietnamese.size > 0) {
    for (const [a, b] of VI_TONE_PAIRS) {
      if (low.includes(a)) {
        const swapped = low.replace(a, b)
        if (dictionaries.vietnamese.has(swapped)) {
          addCandidate(primaryCandidatesMap, swapped, -20)
        }
      }
      if (low.includes(b)) {
        const swapped = low.replace(b, a)
        if (dictionaries.vietnamese.has(swapped)) {
          addCandidate(primaryCandidatesMap, swapped, -20)
        }
      }
    }
  }

  // 2. Candidate collection from all dictionaries with dynamic length bucketing
  const dictSources: {
    dict: Set<string>
    indexed?: IndexedDictionary
    priorityWeight: number
  }[] = [
    {
      dict: dictionaries.vietnamese,
      indexed: dictionaries.indexed?.vietnamese,
      priorityWeight: 0
    },
    {
      dict: dictionaries.names,
      indexed: dictionaries.indexed?.names,
      priorityWeight: 1
    },
    {
      dict: dictionaries.custom,
      indexed: dictionaries.indexed?.custom,
      priorityWeight: 2
    },
    {
      dict: dictionaries.nonVietnamese,
      indexed: dictionaries.indexed?.nonVietnamese,
      priorityWeight: 3
    }
  ]

  // Dynamic distance threshold based on word length to avoid garbage suggestions on short words
  const maxAllowedDistance = low.length <= 3 ? 1 : 2
  const minLen = Math.max(1, low.length - maxAllowedDistance)
  const maxLen = low.length + maxAllowedDistance

  for (const { dict, indexed, priorityWeight } of dictSources) {
    if (!dict || dict.size === 0) continue

    let candidateWords: string[]
    let baseWordCache: Map<string, string> | undefined

    if (indexed) {
      baseWordCache = indexed.baseWordCache
      const buckets: string[] = []
      for (let len = minLen; len <= maxLen; len++) {
        const bucket = indexed.byLength.get(len)
        if (bucket) buckets.push(...bucket)
      }
      candidateWords = buckets
    } else {
      const fallbackIndexed = buildIndexedDictionary(dict)
      baseWordCache = fallbackIndexed.baseWordCache
      const buckets: string[] = []
      for (let len = minLen; len <= maxLen; len++) {
        const bucket = fallbackIndexed.byLength.get(len)
        if (bucket) buckets.push(...bucket)
      }
      candidateWords = buckets
    }

    for (const dictWord of candidateWords) {
      const dictLow = dictWord.toLowerCase().normalize("NFC")
      if (dictLow === low) {
        if (dictWord !== word) {
          // Exact canonical case correction (e.g. ipad -> iPad, wechat -> WeChat, alexander -> Alexander)
          const score =
            priorityWeight === 2 ? -100 : priorityWeight === 1 ? -50 : -10
          addCandidate(primaryCandidatesMap, dictWord, score)
        }
        continue
      }

      const baseDictWord = baseWordCache?.get(dictWord) ?? getBaseWord(dictLow)

      // Calculate base distance
      const baseDistance = levenshteinDistance(
        baseLow,
        baseDictWord,
        maxAllowedDistance
      )

      // If base words are close (baseDistance <= 1, e.g. missing 'đ' or same base syllable),
      // allow fullDistance up to 4 so multi-tone and d->đ words are not prematurely discarded
      let fullDistance: number
      if (baseDistance <= 1) {
        fullDistance = levenshteinDistance(low, dictLow, 4)
      } else {
        fullDistance = levenshteinDistance(low, dictLow, maxAllowedDistance)
        if (fullDistance > maxAllowedDistance) {
          continue
        }
      }

      // Short words (length <= 3) filtering:
      // Strictly limit to baseDistance <= 1 and fullDistance <= 1, or same base word with fullDistance <= 2
      if (low.length <= 3) {
        if (baseDistance > 1) continue
        if (baseDistance === 1 && fullDistance > 1) continue
        if (fullDistance > 2) continue
      }

      // Filter out garbage suggestions for 4-5 char words with distance 2 and different base words
      if (low.length <= 5 && fullDistance >= 2 && baseDistance > 1) {
        continue
      }

      // Structured Scoring Hierarchy (Non-overlapping Tiers):
      // - Tier 1 (10..39): Same base word (baseDistance === 0)
      //     * fullDistance === 1: score 10..25 (Primary)
      //     * fullDistance >= 2: score 20..39 (Primary)
      // - Tier 2 (40..55): 1-char typo edit (baseDistance === 1 && fullDistance === 1) (Primary)
      // - Tier 3 (60..85): d<->đ and multi-tone candidates (baseDistance <= 1 && fullDistance >= 2) (Secondary)
      // - Tier 4 (100..150): Broader distance <= 2 with different base words (Secondary)
      if (baseDistance === 0 && fullDistance === 1) {
        const score = 10 + priorityWeight * 5
        addCandidate(primaryCandidatesMap, dictWord, score)
      } else if (baseDistance === 0 && fullDistance >= 2) {
        const score = 20 + priorityWeight * 5 + fullDistance
        addCandidate(primaryCandidatesMap, dictWord, score)
      } else if (baseDistance === 1 && fullDistance === 1) {
        const score = 40 + priorityWeight * 5
        addCandidate(primaryCandidatesMap, dictWord, score)
      } else if (baseDistance <= 1 && fullDistance >= 2) {
        const score = 60 + priorityWeight * 5 + fullDistance
        addCandidate(secondaryCandidatesMap, dictWord, score)
      } else if (fullDistance <= 2) {
        const score =
          100 + priorityWeight * 10 + baseDistance * 5 + fullDistance
        addCandidate(secondaryCandidatesMap, dictWord, score)
      }
    }
  }

  // Populate primary suggestions deterministically sorted by score, tie-broken by word frequency
  const sortedPrimary = Array.from(primaryCandidatesMap.values()).sort(
    (a, b) => {
      if (a.score !== b.score) return a.score - b.score
      const freqA = getWordFrequency(a.word)
      const freqB = getWordFrequency(b.word)
      if (freqA !== freqB) return freqB - freqA
      return a.word.localeCompare(b.word, "vi")
    }
  )
  for (const c of sortedPrimary) {
    if (primarySet.size >= MAX_PRIMARY_SUGGESTION_COUNT) break
    const cLow = c.word.toLowerCase()
    if (!seenLower.has(cLow)) {
      seenLower.add(cLow)
      primarySet.add(c.word)
    }
  }

  // Populate secondary suggestions deterministically sorted by score, tie-broken by word frequency
  const sortedSecondary = Array.from(secondaryCandidatesMap.values()).sort(
    (a, b) => {
      if (a.score !== b.score) return a.score - b.score
      const freqA = getWordFrequency(a.word)
      const freqB = getWordFrequency(b.word)
      if (freqA !== freqB) return freqB - freqA
      return a.word.localeCompare(b.word, "vi")
    }
  )
  for (const c of sortedSecondary) {
    if (secondarySet.size >= MAX_SECONDARY_SUGGESTION_COUNT) break
    const cLow = c.word.toLowerCase()
    if (!seenLower.has(cLow)) {
      seenLower.add(cLow)
      secondarySet.add(c.word)
    }
  }

  const result: TieredSuggestions = {
    primary: Array.from(primarySet),
    secondary: Array.from(secondarySet)
  }

  tieredSuggestionCache.set(normWord, result)
  return result
}

/**
 * Returns a flattened array of top suggestions for backward compatibility.
 */
export function findSuggestions(
  word: string,
  dictionaries: Dictionaries
): string[] {
  const normWord = word.normalize("NFC")
  if (suggestionCache.has(normWord)) {
    return suggestionCache.get(normWord) || []
  }

  const tiered = findTieredSuggestions(word, dictionaries)
  const combined = Array.from(
    new Set([...tiered.primary, ...tiered.secondary])
  ).slice(0, MAX_SUGGESTION_COUNT)

  suggestionCache.set(normWord, combined)
  return combined
}

export function groupErrors(errors: ErrorInstance[]): ErrorGroup[] {
  const errorMap = new Map<string, ErrorGroup>()

  for (const error of errors) {
    const groupId = `${error.word.toLowerCase()}-${error.type}`
    if (!errorMap.has(groupId)) {
      errorMap.set(groupId, {
        id: groupId,
        word: error.word,
        type: error.type,
        reason: error.reason || "Không rõ nguyên nhân",
        count: 0,
        contexts: []
      })
    }
    errorMap.get(groupId)?.contexts.push(error)
  }

  const groups = Array.from(errorMap.values())
  for (const group of groups) {
    group.count = group.contexts.length
  }
  groups.sort((a, b) => b.contexts.length - a.contexts.length)

  return groups
}

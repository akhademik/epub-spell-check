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
  const low = word.toLowerCase().normalize("NFC")
  if (tieredSuggestionCache.has(low)) {
    return tieredSuggestionCache.get(low)!
  }

  const baseLow = getBaseWord(low)
  const primarySet = new Set<string>()
  const secondarySet = new Set<string>()
  const seenLower = new Set<string>()

  // 1. Direct Vietnamese Tone Mark Swap (Highest confidence, e.g. chổ -> chỗ)
  if (dictionaries.vietnamese.size > 0) {
    for (const [a, b] of VI_TONE_PAIRS) {
      if (low.includes(a)) {
        const swapped = low.replace(a, b)
        if (dictionaries.vietnamese.has(swapped) && !seenLower.has(swapped)) {
          seenLower.add(swapped)
          primarySet.add(swapped)
        }
      }
      if (low.includes(b)) {
        const swapped = low.replace(b, a)
        if (dictionaries.vietnamese.has(swapped) && !seenLower.has(swapped)) {
          seenLower.add(swapped)
          primarySet.add(swapped)
        }
      }
    }
  }

  // 2. Candidate collection from all dictionaries with length bucketing
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

  const primaryCandidates: { word: string; score: number }[] = []
  const secondaryCandidates: { word: string; score: number }[] = []

  const LEVEN_LOOKUP_MAX = word.length < 5 ? 1 : 2
  const minLen = Math.max(1, low.length - LEVEN_LOOKUP_MAX)
  const maxLen = low.length + LEVEN_LOOKUP_MAX

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
      if (dictLow === low || seenLower.has(dictLow)) continue

      const baseDictWord = baseWordCache?.get(dictWord) ?? getBaseWord(dictLow)
      const baseDistance = levenshteinDistance(baseLow, baseDictWord)
      const fullDistance = levenshteinDistance(low, dictLow)

      // Primary criteria: close edit distance (baseDist <= 1 AND fullDist <= 1)
      if (baseDistance <= 1 && fullDistance <= 1) {
        const score = priorityWeight * 20 + baseDistance * 10 + fullDistance
        primaryCandidates.push({ word: dictWord, score })
      }
      // Secondary criteria: broader edit distance (fullDist <= 2 OR (baseDist <= 1 AND fullDist <= 2))
      else if (fullDistance <= 2 || (baseDistance <= 1 && fullDistance <= 2)) {
        const score = priorityWeight * 20 + baseDistance * 5 + fullDistance
        secondaryCandidates.push({ word: dictWord, score })
      }
    }
  }

  // Populate primary suggestions
  primaryCandidates.sort((a, b) => a.score - b.score)
  for (const c of primaryCandidates) {
    if (primarySet.size >= MAX_PRIMARY_SUGGESTION_COUNT) break
    const cLow = c.word.toLowerCase()
    if (!seenLower.has(cLow)) {
      seenLower.add(cLow)
      primarySet.add(c.word)
    }
  }

  // Populate secondary suggestions
  secondaryCandidates.sort((a, b) => a.score - b.score)
  for (const c of secondaryCandidates) {
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

  tieredSuggestionCache.set(low, result)
  return result
}

/**
 * Returns a flattened array of top suggestions for backward compatibility.
 */
export function findSuggestions(
  word: string,
  dictionaries: Dictionaries
): string[] {
  const low = word.toLowerCase().normalize("NFC")
  if (suggestionCache.has(low)) {
    return suggestionCache.get(low) || []
  }

  const tiered = findTieredSuggestions(word, dictionaries)
  const combined = Array.from(
    new Set([...tiered.primary, ...tiered.secondary])
  ).slice(0, MAX_SUGGESTION_COUNT)

  suggestionCache.set(low, combined)
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

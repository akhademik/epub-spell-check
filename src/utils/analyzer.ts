import { MAX_SUGGESTION_COUNT } from "../constants"
import type { Dictionaries, IndexedDictionary } from "../types/dictionary"
import type { ErrorGroup, ErrorInstance } from "../types/errors"
import { getBaseWord, levenshteinDistance } from "./analysis-core"
import { buildIndexedDictionary } from "./dictionary"

// In-session suggestion memoization cache
const suggestionCache = new Map<string, string[]>()

export function clearSuggestionCache(): void {
  suggestionCache.clear()
}

export function findSuggestions(
  word: string,
  dictionaries: Dictionaries
): string[] {
  const low = word.toLowerCase().normalize("NFC")
  if (suggestionCache.has(low)) {
    return suggestionCache.get(low) || []
  }

  const suggestionSet = new Set<string>()
  const LEVEN_MAX_DIST = word.length < 5 ? 1 : 2
  const baseLow = getBaseWord(low)

  const getTopSuggestions = (
    dictionary: Set<string>,
    indexedDict: IndexedDictionary | undefined,
    limit: number
  ): string[] => {
    if (limit <= 0) return []

    // 1. Collect candidate words using byLength bucket filtering if available
    let candidateWords: string[]
    let baseWordCache: Map<string, string> | undefined

    if (indexedDict) {
      baseWordCache = indexedDict.baseWordCache
      const buckets: string[] = []
      const minLen = Math.max(1, low.length - LEVEN_MAX_DIST)
      const maxLen = low.length + LEVEN_MAX_DIST
      for (let len = minLen; len <= maxLen; len++) {
        const bucket = indexedDict.byLength.get(len)
        if (bucket) {
          buckets.push(...bucket)
        }
      }
      candidateWords = buckets
    } else {
      // Fallback for non-indexed dictionaries (e.g. ad-hoc or tests)
      const fallbackIndexed = buildIndexedDictionary(dictionary)
      baseWordCache = fallbackIndexed.baseWordCache
      const buckets: string[] = []
      const minLen = Math.max(1, low.length - LEVEN_MAX_DIST)
      const maxLen = low.length + LEVEN_MAX_DIST
      for (let len = minLen; len <= maxLen; len++) {
        const bucket = fallbackIndexed.byLength.get(len)
        if (bucket) {
          buckets.push(...bucket)
        }
      }
      candidateWords = buckets
    }

    const candidates: { word: string; score: number }[] = []

    for (const dictWord of candidateWords) {
      const baseDictWord = baseWordCache.get(dictWord) ?? getBaseWord(dictWord)
      const baseDistance = levenshteinDistance(baseLow, baseDictWord)

      if (baseDistance <= 1) {
        const fullDistance = levenshteinDistance(low, dictWord)
        const score = baseDistance * 10 + fullDistance

        if (score > 0) {
          candidates.push({ word: dictWord, score })
        }
      }
    }

    // Top-k selection: insertion if large or standard sort if small
    if (candidates.length > 200) {
      // Bounded top-k list
      const topK: { word: string; score: number }[] = []
      for (const item of candidates) {
        if (topK.length < limit) {
          topK.push(item)
          topK.sort((a, b) => a.score - b.score)
        } else if (item.score < topK[topK.length - 1].score) {
          topK[topK.length - 1] = item
          topK.sort((a, b) => a.score - b.score)
        }
      }
      return topK.map((c) => c.word)
    }

    candidates.sort((a, b) => a.score - b.score)
    return candidates.slice(0, limit).map((c) => c.word)
  }

  // 1. Vietnamese suggestions
  if (dictionaries.vietnamese.size > 0) {
    const vnSuggestions = getTopSuggestions(
      dictionaries.vietnamese,
      dictionaries.indexed?.vietnamese,
      MAX_SUGGESTION_COUNT
    )
    for (const s of vnSuggestions) {
      suggestionSet.add(s)
    }
  }

  // 2. Names suggestions
  if (
    suggestionSet.size < MAX_SUGGESTION_COUNT &&
    dictionaries.names &&
    dictionaries.names.size > 0
  ) {
    const remaining = MAX_SUGGESTION_COUNT - suggestionSet.size
    const nameSuggestions = getTopSuggestions(
      dictionaries.names,
      dictionaries.indexed?.names,
      remaining
    )
    for (const s of nameSuggestions) {
      suggestionSet.add(s)
    }
  }

  // 3. Custom suggestions
  if (
    suggestionSet.size < MAX_SUGGESTION_COUNT &&
    dictionaries.custom.size > 0
  ) {
    const remaining = MAX_SUGGESTION_COUNT - suggestionSet.size
    const customSuggestions = getTopSuggestions(
      dictionaries.custom,
      dictionaries.indexed?.custom,
      remaining
    )
    for (const s of customSuggestions) {
      suggestionSet.add(s)
    }
  }

  // 4. Non-Vietnamese suggestions
  if (
    suggestionSet.size < MAX_SUGGESTION_COUNT &&
    dictionaries.nonVietnamese.size > 0
  ) {
    const remaining = MAX_SUGGESTION_COUNT - suggestionSet.size
    const foreignSuggestions = getTopSuggestions(
      dictionaries.nonVietnamese,
      dictionaries.indexed?.nonVietnamese,
      remaining
    )
    for (const s of foreignSuggestions) {
      suggestionSet.add(s)
    }
  }

  const result = Array.from(suggestionSet).slice(0, MAX_SUGGESTION_COUNT)
  suggestionCache.set(low, result)
  return result
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

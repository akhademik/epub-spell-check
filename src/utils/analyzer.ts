import { MAX_SUGGESTION_COUNT } from "../constants"
import type { Dictionaries } from "../types/dictionary"
import type { ErrorGroup, ErrorInstance } from "../types/errors"
import { getBaseWord, levenshteinDistance } from "./analysis-core"

export function findSuggestions(
  word: string,
  dictionaries: Dictionaries
): string[] {
  const low = word.toLowerCase().normalize("NFC")
  const suggestionSet = new Set<string>()
  const LEVEN_MAX_DIST = word.length < 5 ? 1 : 2

  const getTopSuggestions = (
    dictionary: Set<string>,
    limit: number
  ): string[] => {
    const candidates: { word: string; score: number }[] = []
    const baseLow = getBaseWord(low)

    for (const dictWord of dictionary) {
      if (Math.abs(dictWord.length - low.length) <= LEVEN_MAX_DIST) {
        const baseDictWord = getBaseWord(dictWord)
        const baseDistance = levenshteinDistance(baseLow, baseDictWord)

        if (baseDistance <= 1) {
          const fullDistance = levenshteinDistance(low, dictWord)
          const score = baseDistance * 10 + fullDistance

          if (score > 0) {
            candidates.push({ word: dictWord, score })
          }
        }
      }
    }
    candidates.sort((a, b) => a.score - b.score)
    return candidates.slice(0, limit).map((c) => c.word)
  }

  // 1. Vietnamese suggestions
  if (dictionaries.vietnamese.size > 0) {
    const vnSuggestions = getTopSuggestions(
      dictionaries.vietnamese,
      MAX_SUGGESTION_COUNT
    )
    for (const s of vnSuggestions) {
      suggestionSet.add(s)
    }
  }

  // 2. Custom suggestions
  if (
    suggestionSet.size < MAX_SUGGESTION_COUNT &&
    dictionaries.custom.size > 0
  ) {
    const remaining = MAX_SUGGESTION_COUNT - suggestionSet.size
    const customSuggestions = getTopSuggestions(dictionaries.custom, remaining)
    for (const s of customSuggestions) {
      suggestionSet.add(s)
    }
  }

  // 3. Non-Vietnamese suggestions
  if (
    suggestionSet.size < MAX_SUGGESTION_COUNT &&
    dictionaries.nonVietnamese.size > 0
  ) {
    const remaining = MAX_SUGGESTION_COUNT - suggestionSet.size
    const foreignSuggestions = getTopSuggestions(
      dictionaries.nonVietnamese,
      remaining
    )
    for (const s of foreignSuggestions) {
      suggestionSet.add(s)
    }
  }

  return Array.from(suggestionSet).slice(0, MAX_SUGGESTION_COUNT)
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

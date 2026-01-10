import { Dictionaries } from "../types/dictionary";
import { ErrorGroup, ErrorInstance } from "../types/errors";
import { MAX_SUGGESTION_COUNT } from "../constants";
import {
  TONE_MISPLACEMENT,
  CheckSettings,
  levenshteinDistance,
  getBaseWord,
} from "./analysis-core";


export type { CheckSettings };

export function findSuggestions(word: string, dictionaries: Dictionaries): string[] {
  const low = word.toLowerCase().normalize("NFC");
  const suggestions: string[] = [];

  for (const [wrong, right] of Object.entries(TONE_MISPLACEMENT)) {
    if (low.includes(wrong)) {
      suggestions.push(low.replace(new RegExp(wrong, 'g'), right));
    }
  }

  const suggestionSet = new Set(suggestions);

  const LEVEN_MAX_DIST = word.length < 5 ? 1 : 2;

  const getTopSuggestions = (dictionary: Set<string>, limit: number): string[] => {
    const candidates: { word: string; score: number }[] = [];
    const baseLow = getBaseWord(low);

    for (const dictWord of dictionary) {
      if (Math.abs(dictWord.length - low.length) <= LEVEN_MAX_DIST) {
        const baseDictWord = getBaseWord(dictWord);
        const baseDistance = levenshteinDistance(baseLow, baseDictWord);

        if (baseDistance <= 1) { // Only consider if base word is very similar
          const fullDistance = levenshteinDistance(low, dictWord);
          const score = baseDistance * 10 + fullDistance;
          
          if (score > 0) {
            candidates.push({ word: dictWord, score: score });
          }
        }
      }
    }
    candidates.sort((a, b) => a.score - b.score);
    return candidates.slice(0, limit).map(c => c.word);
  };

  // Prioritize Vietnamese suggestions
  if (dictionaries.vietnamese.size > 0) {
    const vnSuggestions = getTopSuggestions(dictionaries.vietnamese, MAX_SUGGESTION_COUNT);
    vnSuggestions.forEach(s => suggestionSet.add(s));
  }

  // If we still have space, fill with English suggestions
  if (suggestionSet.size < MAX_SUGGESTION_COUNT && dictionaries.english.size > 0) {
    const remainingLimit = MAX_SUGGESTION_COUNT - suggestionSet.size;
    if (remainingLimit > 0) {
      const enSuggestions = getTopSuggestions(dictionaries.english, remainingLimit);
      enSuggestions.forEach(s => suggestionSet.add(s));
    }
  }

  return Array.from(suggestionSet).slice(0, MAX_SUGGESTION_COUNT);
}

export function groupErrors(errors: ErrorInstance[]): ErrorGroup[] {
  const errorMap = new Map<string, ErrorGroup>();

  errors.forEach(error => {
    const groupId = `${error.word.toLowerCase()}-${error.type}`;
    if (!errorMap.has(groupId)) {
      errorMap.set(groupId, {
        id: groupId,
        word: error.word,
        type: error.type,
        reason: error.reason || 'No specific reason',
        count: 0,
        contexts: [],
      });
    }
    errorMap.get(groupId)!.contexts.push(error);
  });

  const groups = Array.from(errorMap.values());
  groups.forEach(group => {
    group.count = group.contexts.length;
  });
  groups.sort((a, b) => b.contexts.length - a.contexts.length);

  return groups;
}

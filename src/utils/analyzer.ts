import { Dictionaries } from "../types/dictionary";
import { ErrorGroup, ErrorInstance } from "../types/errors";
// Import from analysis-core
import {
  TONE_MISPLACEMENT,
  CheckSettings,
  levenshteinDistance,
} from "./analysis-core";


export type { CheckSettings }; // Re-export CheckSettings from analysis-core

export function findSuggestions(word: string, dictionaries: Dictionaries): string[] {
  const low = word.toLowerCase().normalize("NFC");
  const suggestions: string[] = [];

  for (const [wrong, right] of Object.entries(TONE_MISPLACEMENT)) {
    if (low.includes(wrong)) {
      suggestions.push(low.replace(new RegExp(wrong, 'g'), right));
    }
  }

  if (dictionaries.vietnamese.size > 0) {
    const LEVEN_MAX_DIST = word.length < 4 ? 1 : 2;
    const LEVEN_SUGGESTION_COUNT = 5;
    const topLevenSuggestions: { word: string; dist: number }[] = [];

    for (const dictWord of dictionaries.vietnamese) {
        if (Math.abs(dictWord.length - low.length) <= LEVEN_MAX_DIST) {
            const d = levenshteinDistance(low, dictWord);
            if (d <= LEVEN_MAX_DIST && d > 0) {
                let inserted = false;
                for (let i = 0; i < topLevenSuggestions.length; i++) {
                    if (d < topLevenSuggestions[i].dist) {
                        topLevenSuggestions.splice(i, 0, { word: dictWord, dist: d });
                        inserted = true;
                        break;
                    }
                }
                if (!inserted && topLevenSuggestions.length < LEVEN_SUGGESTION_COUNT) {
                    topLevenSuggestions.push({ word: dictWord, dist: d });
                }
                if (topLevenSuggestions.length > LEVEN_SUGGESTION_COUNT) {
                    topLevenSuggestions.pop();
                }
            }
        }
    }
    suggestions.push(...topLevenSuggestions.map(s => s.word));
  }

  return Array.from(new Set(suggestions)).slice(0, 7);
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

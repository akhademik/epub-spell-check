// src/utils/analyzer.ts
import { Dictionaries } from "../types/dictionary";
import { ErrorGroup, ErrorInstance, ErrorType } from "../types/errors";
import { TextContentBlock } from "../types/epub";
 

// --- Constants ---
const TONE_MISPLACEMENT: Record<string, string> = {
  oá: "óa", oà: "òa", oả: "ỏa", oã: "õa", oạ: "ọa",
  oé: "óe", oè: "òe", oẻ: "ỏe", oẽ: "õe", oẹ: "ọe",
  uý: "úy", uỳ: "ùy", uỷ: "ủy", uỹ: "ũy", uỵ: "ụy",
};
const WORD_REGEX = /[\p{L}\p{M}]+/gu;
const ANALYSIS_CHUNK_SIZE = 50;

export interface CheckSettings {
  dictionary: boolean;
  uppercase: boolean;
  tone: boolean;
  foreign: boolean;
}

const isFrontVowel = (c: string) => {
    if (!c) return false;
    const normalized = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return ["i", "e", "ê"].includes(normalized);
};

const isY = (c: string) => {
    if (!c) return false;
    return c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "y";
};


function getErrorType(word: string, dictionaries: Dictionaries, settings: CheckSettings): {type: ErrorType, reason: string} | null {
    const lower = word.toLowerCase().normalize("NFC");
    const isCapitalized = /^[A-Z\u00C0-\u00DE]/.test(word);

    if (dictionaries.vietnamese.has(lower)) {
        return null; // It's a valid word, no error.
    }
    
    // From this point, the word is NOT in the main dictionary.
    if (settings.uppercase) {
        const upperCount = (word.match(/[A-Z\u00C0-\u00DE]/g) || []).length;
        if (upperCount >= 2) return { type: 'Uppercase', reason: 'Lỗi viết hoa (Nhiều ký tự hoa)' };
    }

    if (settings.tone) {
        for (const [wrong, _right] of Object.entries(TONE_MISPLACEMENT)) {
            if (lower.includes(wrong)) return { type: 'Tone', reason: 'Sai vị trí dấu (Chuẩn cũ/mới)' };
        }
    }
    
    if (settings.foreign) {
        if (/[fjwz]/i.test(lower)) return { type: 'Foreign', reason: 'Từ lạ / Tiếng nước ngoài' };
        if (/(aa|ee|oo|uu|ii|dd|js|kx|wt)$/i.test(lower)) return { type: 'Typo', reason: 'Lỗi gõ máy (Typo)' };

        // Vietnamese Grammar Rules (only for non-capitalized words not in the dictionary)
        if (!isCapitalized) {
            if (lower.startsWith("ngh") && lower.length > 3 && !isFrontVowel(lower[3])) return { type: 'Spelling', reason: 'Sai quy tắc ngh' };
            if (lower.startsWith("ng") && lower.length > 2 && isFrontVowel(lower[2])) return { type: 'Spelling', reason: 'Sai quy tắc ng' };
            if (lower.startsWith("gh") && lower.length > 2 && !isFrontVowel(lower[2])) return { type: 'Spelling', reason: 'Sai quy tắc gh' };
            if (lower.startsWith("g") && !lower.startsWith("gi") && !lower.startsWith("gh")) {
                const charAfterG = lower[1];
                if (charAfterG && ["e", "ê"].includes(charAfterG.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) return { type: 'Spelling', reason: 'Sai quy tắc g' };
            }
            if (lower.startsWith("k") && !lower.startsWith("kh") && lower.length > 1 && !isFrontVowel(lower[1]) && !isY(lower[1])) return { type: 'Spelling', reason: 'Sai quy tắc k' };
            if (lower.startsWith("c") && !lower.startsWith("ch") && lower.length > 1 && (isFrontVowel(lower[1]) || isY(lower[1]))) return { type: 'Spelling', reason: 'Sai quy tắc c' };
        }
    }

    if (isCapitalized) return null;

    if (settings.dictionary) {
        return { type: 'Dictionary', reason: 'Không có trong từ điển' };
    }

    return null;
}

function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment along the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

export function findSuggestions(word: string, dictionaries: Dictionaries): string[] {
    const low = word.toLowerCase().normalize("NFC");
    const suggestions: string[] = [];

    // 1. Check for tone misplacement suggestions
    for (const [wrong, right] of Object.entries(TONE_MISPLACEMENT)) {
        if (low.includes(wrong)) {
            suggestions.push(low.replace(new RegExp(wrong, 'g'), right));
        }
    }

    // 2. Check for Levenshtein distance suggestions from the Vietnamese dictionary
    if (dictionaries.vietnamese.size > 0) {
        const maxDist = word.length < 4 ? 1 : 2; // Shorter words need less distance
        const possibleSuggestions: { word: string; dist: number }[] = [];

        dictionaries.vietnamese.forEach(dictWord => {
            if (Math.abs(dictWord.length - low.length) <= maxDist) {
                const d = levenshteinDistance(low, dictWord);
                if (d <= maxDist && d > 0) { // d > 0 to avoid suggesting the same word
                    possibleSuggestions.push({ word: dictWord, dist: d });
                }
            }
        });

        possibleSuggestions.sort((a, b) => a.dist - b.dist);
        suggestions.push(...possibleSuggestions.slice(0, 5).map(s => s.word));
    }
    
    // Remove duplicates and limit to a reasonable number (e.g., 5-7 unique suggestions)
    return Array.from(new Set(suggestions)).slice(0, 7);
}


export async function analyzeText(
  textBlocks: TextContentBlock[],
  dictionaries: Dictionaries,
  settings: CheckSettings,
  onProgress: (progress: number, message: string) => void
): Promise<{ errors: ErrorInstance[], totalWords: number }> {

  let totalWords = 0;
  const allErrors: ErrorInstance[] = [];
  const totalBlocks = textBlocks.length;
  const analysisCache = new Map<string, { type: ErrorType; reason: string } | null>();

  const checkWord = (word: string): { type: ErrorType; reason: string } | null => {
      if (analysisCache.has(word)) {
          return analysisCache.get(word)!;
      }
  
      if (word.length < 2 || dictionaries.custom.has(word)) {
          analysisCache.set(word, null);
          return null;
      }
  
      const error = getErrorType(word, dictionaries, settings);
      analysisCache.set(word, error);
      return error;
  };


  for (let i = 0; i < totalBlocks; i++) {
    const block = textBlocks[i];
    let match;
    while ((match = WORD_REGEX.exec(block.text)) !== null) {
      const word = match[0];
      totalWords++;

      const error = checkWord(word);

      if (error) {
        allErrors.push({
          word,
          originalWord: word,
          type: error.type,
          reason: error.reason,
          context: {
            originalParagraph: block.text,
            startIndex: match.index,
            endIndex: match.index + word.length,
            chapterIndex: i, // Assuming i is the chapter/block index
            paragraphIndex: i, // Assuming i is also the paragraph index
            matchIndex: match.index,
          },
        });
      }
    }

    if (i % ANALYSIS_CHUNK_SIZE === 0) {
      const percentage = (i / totalBlocks) * 40;
      const message = `Đang hoàn tất phân tích...`;
      onProgress(60 + percentage, message);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return { errors: allErrors, totalWords };
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
        reason: error.reason || 'No specific reason', // Provide a default if undefined
        count: 0, // Initialize count
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

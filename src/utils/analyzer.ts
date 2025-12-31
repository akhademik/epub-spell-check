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


export async function analyzeText(
  textBlocks: TextContentBlock[],
  dictionaries: Dictionaries,
  settings: CheckSettings,
  onProgress: (progress: number, message: string) => void
): Promise<{ errors: ErrorInstance[], totalWords: number }> {

  let totalWords = 0;
  const allErrors: ErrorInstance[] = [];
  const totalBlocks = textBlocks.length;


  for (let i = 0; i < totalBlocks; i++) {
    const block = textBlocks[i];
    let match;
    while ((match = WORD_REGEX.exec(block.text)) !== null) {
      const word = match[0];
      totalWords++;

      if (word.length < 2 || dictionaries.custom.has(word)) {
        continue;
      }
      
      const error = getErrorType(word, dictionaries, settings);

      if (error) {
        allErrors.push({
          word,
          type: error.type,
          reason: error.reason,
          context: {
            paragraphIndex: i,
            matchIndex: match.index,
            originalParagraph: block.text,
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
        reason: error.reason,
        contexts: [],
      });
    }
    errorMap.get(groupId)!.contexts.push(error.context);
  });
  
  const groups = Array.from(errorMap.values());
  groups.sort((a, b) => b.contexts.length - a.contexts.length);

  return groups;
}

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
      const message = `Đang phân tích đoạn ${i + 1}/${totalBlocks}`;
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

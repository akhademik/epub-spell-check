import { Dictionaries } from "../types/dictionary";
import { ErrorGroup, ErrorInstance, ErrorType } from "../types/errors";
import { TextContentBlock } from "../types/epub";


const TONE_MISPLACEMENT: Record<string, string> = {
  oá: "óa", oà: "òa", oả: "ỏa", oã: "õa", oạ: "ọa",
  oé: "óe", oè: "òe", oẻ: "ỏe", oẽ: "õe", oẹ: "ọe",
  uý: "úy", uỳ: "ùy", uỷ: "ủy", uỹ: "ũy", uỵ: "ụy",
  aó: "áo", eó: "éo",
};

const VIETNAMESE_TONE_REGEX = /^(?:(?<![a-zđ])(q)([ùúụủũ])([a-yơâêi]+)|([a-zđ]*)(o[àáạảã]|o[èéẹẻẽ]|(?<!q)u[ỳýỵỷỹ])|([a-zđ]*)([òóọỏõ])([ae])([a-zđ]+)|([a-zđ]*)(a)([òóọỏõ]))$/igu;

const TONE_MAP: Record<string, number> = {
  'ù': 0, 'ú': 1, 'ụ': 2, 'ủ': 3, 'ũ': 4, 'ò': 0, 'ó': 1, 'ọ': 2, 'ỏ': 3, 'õ': 4,
  'Ù': 0, 'Ú': 1, 'Ụ': 2, 'Ủ': 3, 'Ũ': 4, 'Ò': 0, 'Ó': 1, 'Ọ': 2, 'Ỏ': 3, 'Õ': 4
};

const VOWEL_TABLE: Record<string, string> = {
  'a': 'àáạảã', 'e': 'èéẹẻẽ', 'y': 'ỳýỵỷỹ', 'ê': 'ềếệểễ', 'ơ': 'ờớợởỡ', 'o': 'òóọỏõ',
  'A': 'ÀÁẠẢÃ', 'E': 'ÈÉẸẺẼ', 'Y': 'ỲÝỴỶỸ', 'Ê': 'ỀẾỆỄ', 'Ơ': 'ỜỚỢỞỠ', 'O': 'ÒÓỌỎÕ'
};

function transferTone(charSrc: string, charDest: string): [string, string] | null {
  if (!(charSrc in TONE_MAP)) return null;
  const idx = TONE_MAP[charSrc];

  let cleanSrc = '';
  // Determine the base character of charSrc without its tone
  if ('ùúụủũÙÚỤỦŨ'.includes(charSrc)) {
    cleanSrc = charSrc.toUpperCase() === charSrc ? 'U' : 'u';
  } else if ('òóọỏõÒÓỌỎÕ'.includes(charSrc)) {
    cleanSrc = charSrc.toUpperCase() === charSrc ? 'O' : 'o';
  } else {
    // This case should ideally not be reached if TONE_MAP only contains u/o with tones
    return null;
  }

  // Apply tone to charDest
  const baseDest = charDest.toLowerCase();
  if (baseDest in VOWEL_TABLE) {
    let row = VOWEL_TABLE[baseDest];
    if (charDest.toUpperCase() === charDest) { // If original charDest was uppercase
      // Use the uppercase row if available, otherwise fallback to lowercase row
      const upperBaseDest = baseDest.toUpperCase();
      if (VOWEL_TABLE[upperBaseDest]) {
        row = VOWEL_TABLE[upperBaseDest];
      }
    }

    const newDest = row[idx];
    return [cleanSrc, newDest];
  }
  return null;
}

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

function checkVietnameseTonePlacement(word: string): { type: ErrorType, reason: string } | null {

  const lowerWord = word.toLowerCase().normalize("NFC");

  VIETNAMESE_TONE_REGEX.lastIndex = 0;

  const match = VIETNAMESE_TONE_REGEX.exec(lowerWord);



  if (!match) {

    return null;

  }



  let reason = "Sai vị trí dấu (Quy tắc chung)"; // Default reason



  // === CASE 1: LỖI QU (qùa -> quà) ===

  if (match[1]) { // Group 1 captures 'q'

    const uBad = match[2];

    const rest = match[3];



    if (rest && rest.length > 0) {

      const vHead = rest[0];

      const trans = transferTone(uBad, vHead);

      if (trans) { // If a tone transfer is possible, it's an error

        reason = "Lỗi 'qu' và dấu (qùa -> quà)";

        return { type: 'Tone', reason };

      }

    }

  }

  // === CASE 2: DẤU MỞ KIỂU CŨ (hoà -> hòa) ===

  else if (match[5]) { // Group 5 captures the old_vowel (e.g., 'oà')

    const oldVowel = match[5];

    if (TONE_MISPLACEMENT[oldVowel]) {

      reason = "Dấu mở kiểu cũ (hoà -> hòa)";

      return { type: 'Tone', reason };

    }

  }

  // === CASE 3: DẤU ĐÓNG SAI VỊ TRÍ (hóan -> hoán) ===

  else if (match[7]) { // Group 7 captures o_bad (e.g., 'ó')

    const oBad = match[7];

    const vowel2 = match[8]; // 'a' or 'e'

    const trans = transferTone(oBad, vowel2);

    if (trans) { // If a tone transfer is possible, it's an error

      reason = "Dấu đóng sai vị trí (hóan -> hoán)";

      return { type: 'Tone', reason };

    }

  }

  // === CASE 4: LỖI aó (baó -> báo) ===

  else if (match[12]) { // Group 12 captures char_o_bad (e.g., 'ó')

    const charA = match[11]; // 'a'

    const charOBad = match[12]; // 'ó'

    const trans = transferTone(charOBad, charA);

    if (trans) { // If a tone transfer is possible, it's an error

      reason = "Lỗi 'aó' (baó -> báo)";

      return { type: 'Tone', reason };

    }

  }



  return null;

}


function getErrorType(word: string, dictionaries: Dictionaries, settings: CheckSettings): { type: ErrorType, reason: string } | null {
  const lower = word.toLowerCase().normalize("NFC");
  const isCapitalized = /^[A-Z\u00C0-\u00DE]/.test(word);

  if (dictionaries.vietnamese.has(lower)) {
    return null;
  }

  if (settings.uppercase) {
    const upperCount = (word.match(/[A-Z\u00C0-\u00DE]/g) || []).length;
    if (upperCount >= 2) return { type: 'Uppercase', reason: 'Lỗi viết hoa (Nhiều ký tự hoa)' };
  }

  if (settings.tone) {
    // Check using the new comprehensive tone placement rules
    const comprehensiveToneError = checkVietnameseTonePlacement(word);
    if (comprehensiveToneError) {
      return comprehensiveToneError;
    }

    // Existing TONE_MISPLACEMENT check (for cases not caught by the comprehensive regex)
    for (const [wrong, right] of Object.entries(TONE_MISPLACEMENT)) {
      if (lower.includes(wrong)) {
        const correctedWord = lower.replace(wrong, right);
        if (dictionaries.vietnamese.has(correctedWord)) {
          return { type: 'Tone', reason: 'Sai vị trí dấu (Chuẩn cũ/mới)' };
        }
      }
    }
  }

  if (settings.foreign) {
    if (/[fjwz]/i.test(lower)) return { type: 'Foreign', reason: 'Từ lạ / Tiếng nước ngoài' };
    if (/(aa|ee|oo|uu|ii|dd|js|kx|wt)$/i.test(lower)) return { type: 'Typo', reason: 'Lỗi gõ máy (Typo)' };

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

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function findSuggestions(word: string, dictionaries: Dictionaries): string[] {
  const low = word.toLowerCase().normalize("NFC");
  const suggestions: string[] = [];

  for (const [wrong, right] of Object.entries(TONE_MISPLACEMENT)) {
    if (low.includes(wrong)) {
      suggestions.push(low.replace(new RegExp(wrong, 'g'), right));
    }
  }

  if (dictionaries.vietnamese.size > 0) {
    const LEVEN_MAX_DIST = word.length < 4 ? 1 : 2; // Keep existing logic for max distance
    const LEVEN_SUGGESTION_COUNT = 5; // Target number of dictionary-based suggestions
    const topLevenSuggestions: { word: string; dist: number }[] = [];

    // Prioritize words with lower distance and fewer suggestions
    // Iterate through dictionary, collecting suggestions up to LEVEN_SUGGESTION_COUNT
    for (const dictWord of dictionaries.vietnamese) {
        if (Math.abs(dictWord.length - low.length) <= LEVEN_MAX_DIST) {
            const d = levenshteinDistance(low, dictWord);
            if (d <= LEVEN_MAX_DIST && d > 0) {
                // Keep the list sorted by distance to easily manage top N
                // Insert into sorted array
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
                // If we have more than the desired count, remove the highest distance one
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
            chapterIndex: i,
            paragraphIndex: i,
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
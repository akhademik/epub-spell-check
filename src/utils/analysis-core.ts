// src/utils/analysis-core.ts

import { Dictionaries } from "../types/dictionary";
import { ErrorType } from "../types/errors";



export const TONE_MISPLACEMENT: Record<string, string> = {
  oá: "óa", oà: "òa", oả: "ỏa", oã: "õa", oạ: "ọa",
  oé: "óe", oè: "òe", oẻ: "ỏe", oẽ: "õe", oẹ: "ọe",
  uý: "úy", uỳ: "ùy", uỷ: "ủy", uỹ: "ũy", uỵ: "ụy",
  aó: "áo", eó: "éo",
};

export const VIETNAMESE_TONE_REGEX = /^(?:(?<![a-zđ])(q)([ùúụủũ])([a-yơâêi]+)|([a-zđ]*)(o[àáạảã]|o[èéẹẻẽ]|(?<!q)u[ỳýỵỷỹ])|([a-zđ]*)([òóọỏõ])([ae])([a-zđ]+)|([a-zđ]*)(a)([òóọỏõ]))$/igu;

export const TONE_MAP: Record<string, number> = {
  'ù': 0, 'ú': 1, 'ụ': 2, 'ủ': 3, 'ũ': 4, 'ò': 0, 'ó': 1, 'ọ': 2, 'ỏ': 3, 'õ': 4,
  'Ù': 0, 'Ú': 1, 'Ụ': 2, 'Ủ': 3, 'Ũ': 4, 'Ò': 0, 'Ó': 1, 'Ọ': 2, 'Ỏ': 3, 'Õ': 4
};

export const VOWEL_TABLE: Record<string, string> = {
  'a': 'àáạảã', 'e': 'èéẹẻẽ', 'y': 'ỳýỵỷỹ', 'ê': 'ềếệểễ', 'ơ': 'ờớợởỡ', 'o': 'òóọỏõ',
  'A': 'ÀÁẠẢÃ', 'E': 'ÈÉẸẺẼ', 'Y': 'ỲÝỴỶỸ', 'Ê': 'ỀẾỆỄ', 'Ơ': 'ỜỚỢỞỠ', 'O': 'ÒÓỌỎÕ'
};

export function transferTone(charSrc: string, charDest: string): [string, string] | null {
  if (!(charSrc in TONE_MAP)) return null;
  const idx = TONE_MAP[charSrc];

  let cleanSrc = '';
  if ('ùúụủũÙÚỤỦŨ'.includes(charSrc)) {
    cleanSrc = charSrc.toUpperCase() === charSrc ? 'U' : 'u';
  } else if ('òóọỏõÒÓỌỎÕ'.includes(charSrc)) {
    cleanSrc = charSrc.toUpperCase() === charSrc ? 'O' : 'o';
  } else {
    return null;
  }

  const baseDest = charDest.toLowerCase();
  if (baseDest in VOWEL_TABLE) {
    let row = VOWEL_TABLE[baseDest];
    if (charDest.toUpperCase() === charDest) {
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

export const WORD_REGEX = /[\p{L}\p{M}]+/gu;
export const ANALYSIS_CHUNK_SIZE = 50;

export type CheckSettings = {
  dictionary: boolean;
  uppercase: boolean;
  tone: boolean;
  foreign: boolean;
};

export const isFrontVowel = (c: string) => {
  if (!c) return false;
  const normalized = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return ["i", "e", "ê"].includes(normalized);
};

export const isY = (c: string) => {
  if (!c) return false;
  return c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "y";
};

export function checkVietnameseTonePlacement(word: string): { type: ErrorType, reason: string } | null {
  const lowerWord = word.toLowerCase().normalize("NFC");
  VIETNAMESE_TONE_REGEX.lastIndex = 0;
  const match = VIETNAMESE_TONE_REGEX.exec(lowerWord);

  if (!match) {
    return null;
  }

  let reason = "Sai vị trí dấu (Quy tắc chung)";

  if (match[1]) {
    const uBad = match[2];
    const rest = match[3];

    if (rest && rest.length > 0) {
      const vHead = rest[0];
      const trans = transferTone(uBad, vHead);
      if (trans) {
        reason = "Lỗi 'qu' và dấu (qùa -> quà)";
        return { type: 'Tone', reason };
      }
    }
  } else if (match[5]) {
    const oldVowel = match[5];
    if (TONE_MISPLACEMENT[oldVowel]) {
      reason = "Dấu mở kiểu cũ (hoà -> hòa)";
      return { type: 'Tone', reason };
    }
  } else if (match[7]) {
    const oBad = match[7];
    const vowel2 = match[8];
    const trans = transferTone(oBad, vowel2);
    if (trans) {
      reason = "Dấu đóng sai vị trí (hóan -> hoán)";
      return { type: 'Tone', reason };
    }
  } else if (match[12]) {
    const charA = match[11];
    const charOBad = match[12];
    const trans = transferTone(charOBad, charA);
    if (trans) {
      reason = "Lỗi 'aó' (baó -> báo)";
      return { type: 'Tone', reason };
    }
  }

  return null;
}

export function getErrorType(word: string, dictionaries: Dictionaries, settings: CheckSettings): { type: ErrorType, reason: string } | null {
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
    const comprehensiveToneError = checkVietnameseTonePlacement(word);
    if (comprehensiveToneError) {
      return comprehensiveToneError;
    }

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

export function levenshteinDistance(a: string, b: string): number {
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
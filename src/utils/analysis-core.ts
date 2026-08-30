import type { CheckSettings } from "../types/analysis"
import type { Dictionaries } from "../types/dictionary"
import type { ErrorType } from "../types/errors"

export const WORD_REGEX = /[\p{L}\p{M}]+/gu
export const ANALYSIS_CHUNK_SIZE = 50

export const TONE_STYLE_PAIRS: [string, string][] = [
  ["oà", "òa"],
  ["oá", "óa"],
  ["oả", "ỏa"],
  ["oã", "õa"],
  ["oạ", "ọa"],
  ["oè", "òe"],
  ["oé", "óe"],
  ["oẻ", "ỏe"],
  ["oẽ", "õe"],
  ["oẹ", "ọe"],
  ["uỳ", "ùy"],
  ["uý", "úy"],
  ["uỷ", "ủy"],
  ["uỹ", "ũy"],
  ["uỵ", "ụy"]
]

export function getAlternateToneStyle(word: string): string | null {
  for (const [a, b] of TONE_STYLE_PAIRS) {
    if (word.includes(a)) return word.replace(a, b)
    if (word.includes(b)) return word.replace(b, a)
  }
  return null
}

export const isFrontVowel = (c: string) => {
  if (!c) return false
  const normalized = c
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
  return ["i", "e", "ê"].includes(normalized)
}

export const isY = (c: string) => {
  if (!c) return false
  return (
    c
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") === "y"
  )
}

export function getErrorType(
  word: string,
  dictionaries: Dictionaries,
  checkSettings: CheckSettings = {
    vietnamese: true,
    nonVietnamese: true
  }
): { type: ErrorType; reason: string } | null {
  const lower = word.toLowerCase().normalize("NFC")
  const isCapitalized = /^\p{Lu}/u.test(word)

  // 1. Custom Dictionary (Always active): Abbreviations & custom terms (ATM, VIP, DNA, FBI) are never errors
  if (dictionaries.custom.has(word) || dictionaries.custom.has(lower)) {
    return null
  }

  // 2. Non-Vietnamese Dictionary (Always active): Recognized English/French/foreign words are valid
  const isKnownForeign = dictionaries.nonVietnamese.has(lower)
  if (isKnownForeign) {
    return null
  }

  // 3. Vietnamese Dictionary (Always active): Recognized standard Vietnamese words (Both old and new tone styles)
  let isKnownVietnamese = dictionaries.vietnamese.has(lower)
  if (!isKnownVietnamese) {
    const altToneWord = getAlternateToneStyle(lower)
    if (altToneWord && dictionaries.vietnamese.has(altToneWord)) {
      isKnownVietnamese = true
    }
  }

  if (isKnownVietnamese) {
    if (checkSettings.vietnamese) {
      const hasInternalUpper = /\p{Ll}\p{Lu}/u.test(word)
      const upperCount = (word.match(/\p{Lu}/gu) || []).length
      if (hasInternalUpper || (upperCount > 1 && upperCount < word.length)) {
        return {
          type: "Uppercase",
          reason: "Lỗi viết hoa bất thường"
        }
      }
    }
    return null
  }

  // 4. Foreign letters check (f, j, w, z)
  if (/[fjwz]/i.test(lower)) {
    if (checkSettings.nonVietnamese) {
      return {
        type: "NonVietnamese",
        reason: "Từ lạ / Ngoại ngữ chưa có trong từ điển"
      }
    }
    return null
  }

  // 5. Vietnamese Typo & Spelling Rules & Vocabulary
  if (checkSettings.vietnamese) {
    if (/(aa|ee|oo|uu|ii|dd|js|kx|wt)$/i.test(lower)) {
      return { type: "Typo", reason: "Lỗi gõ máy (Typo)" }
    }

    if (!isCapitalized) {
      if (
        lower.startsWith("ngh") &&
        lower.length > 3 &&
        !isFrontVowel(lower[3])
      )
        return { type: "Spelling", reason: "Sai quy tắc ngh" }
      if (lower.startsWith("ng") && lower.length > 2 && isFrontVowel(lower[2]))
        return { type: "Spelling", reason: "Sai quy tắc ng" }
      if (lower.startsWith("gh") && lower.length > 2 && !isFrontVowel(lower[2]))
        return { type: "Spelling", reason: "Sai quy tắc gh" }
      if (
        lower.startsWith("g") &&
        !lower.startsWith("gi") &&
        !lower.startsWith("gh")
      ) {
        const charAfterG = lower[1]
        if (
          charAfterG &&
          ["e", "ê"].includes(
            charAfterG
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
          )
        )
          return { type: "Spelling", reason: "Sai quy tắc g" }
      }
      if (
        lower.startsWith("k") &&
        !lower.startsWith("kh") &&
        lower.length > 1 &&
        !isFrontVowel(lower[1]) &&
        !isY(lower[1])
      )
        return { type: "Spelling", reason: "Sai quy tắc k" }
      if (
        lower.startsWith("c") &&
        !lower.startsWith("ch") &&
        lower.length > 1 &&
        (isFrontVowel(lower[1]) || isY(lower[1]))
      )
        return { type: "Spelling", reason: "Sai quy tắc c" }
    }

    const hasInternalUpper = /\p{Ll}\p{Lu}/u.test(word)
    const upperCount = (word.match(/\p{Lu}/gu) || []).length
    if (hasInternalUpper || upperCount > 1) {
      return {
        type: "Uppercase",
        reason: "Lỗi viết hoa bất thường"
      }
    }

    return { type: "Dictionary", reason: "Không có trong từ điển tiếng Việt" }
  }

  return null
}

export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export function getBaseWord(word: string): string {
  return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

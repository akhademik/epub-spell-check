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
  const upperCount = (word.match(/\p{Lu}/gu) || []).length
  const hasInternalUpper = /\p{Ll}\p{Lu}/u.test(word)

  // 1. Words with 2+ uppercase letters (e.g. VIP, ATM, tÔi, PHARAOH) or camelCase
  // Must exist in custom / abbreviation dictionary to be exempt, otherwise flagged as Uppercase error
  if (upperCount >= 2 || hasInternalUpper) {
    if (dictionaries.custom.has(word) || dictionaries.custom.has(lower)) {
      return null
    }
    if (checkSettings.vietnamese) {
      return {
        type: "Uppercase",
        reason: "Viết hoa bất thường"
      }
    }
  }

  // 2. Custom / Abbreviation Dictionary (Always active)
  if (dictionaries.custom.has(word) || dictionaries.custom.has(lower)) {
    return null
  }

  // 3. Names Dictionary (Case-insensitive: Alexander, alexander, Jeans, jeans, Olive, olive)
  if (
    dictionaries.names &&
    (dictionaries.names.has(word) || dictionaries.names.has(lower))
  ) {
    return null
  }

  // 4. Non-Vietnamese Dictionary (Case-insensitive foreign words)
  const isKnownForeign = dictionaries.nonVietnamese.has(lower)
  if (isKnownForeign) {
    return null
  }

  // 5. Vietnamese Dictionary (Case-insensitive standard Vietnamese words, supporting old/new tone styles)
  let isKnownVietnamese = dictionaries.vietnamese.has(lower)
  if (!isKnownVietnamese) {
    const altToneWord = getAlternateToneStyle(lower)
    if (altToneWord && dictionaries.vietnamese.has(altToneWord)) {
      isKnownVietnamese = true
    }
  }

  if (isKnownVietnamese) {
    return null
  }

  // 6. Foreign letters check (f, j, w, z)
  if (/[fjwz]/i.test(lower)) {
    if (checkSettings.nonVietnamese) {
      return {
        type: "NonVietnamese",
        reason: "Không có trong Non-VN dict"
      }
    }
    return null
  }

  // 7. Vietnamese Typo & Spelling Rules & Vocabulary
  if (checkSettings.vietnamese) {
    if (/(aa|ee|oo|uu|ii|dd|js|kx|wt)$/i.test(lower)) {
      return { type: "Typo", reason: "Gõ máy (Typo)" }
    }

    const isCapitalized = /^\p{Lu}/u.test(word)
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

    return { type: "Dictionary", reason: "Không có trong VN dict" }
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

/**
 * Adapt the casing of replacementWord to match the casing style of originalWord:
 * - ALL UPPERCASE: "HELLO" -> "WORLD"
 * - TitleCase: "Hello" -> "World"
 * - lowercase: "hello" -> "world"
 */
export function matchCase(
  originalWord: string,
  replacementWord: string
): string {
  if (!originalWord || !replacementWord) return replacementWord

  const isUpper =
    originalWord === originalWord.toUpperCase() &&
    originalWord !== originalWord.toLowerCase()
  if (isUpper) {
    return replacementWord.toUpperCase()
  }

  const isTitle =
    originalWord.length > 0 &&
    originalWord[0] === originalWord[0].toUpperCase() &&
    originalWord.slice(1) === originalWord.slice(1).toLowerCase()
  if (isTitle) {
    return (
      replacementWord.charAt(0).toUpperCase() +
      replacementWord.slice(1).toLowerCase()
    )
  }

  return replacementWord
}

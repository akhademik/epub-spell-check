import type { CheckSettings } from "../types/analysis"
import type { Dictionaries } from "../types/dictionary"
import type { ErrorGroup } from "../types/errors"

export function getFilteredErrors(
  allDetectedErrors: ErrorGroup[],
  whitelist: string[] | string,
  checkSettings: CheckSettings,
  dictionaries: Dictionaries
): ErrorGroup[] {
  const whitelistArray = Array.isArray(whitelist)
    ? whitelist
    : whitelist.split(/[\s,]+/).filter(Boolean)

  const whitelistSet = new Set(
    whitelistArray.map((w) => w.toLowerCase().trim()).filter(Boolean)
  )

  return allDetectedErrors.filter((group) => {
    const lowerWord = group.word.toLowerCase()

    // 1. Whitelist filter (always filters out ignored words)
    if (whitelistSet.has(lowerWord)) return false

    // 2. Custom dictionary & Names dictionary (always filters out valid custom abbreviations & names)
    if (
      dictionaries.custom.has(group.word) ||
      dictionaries.custom.has(lowerWord) ||
      (dictionaries.names &&
        (dictionaries.names.has(group.word) ||
          dictionaries.names.has(lowerWord)))
    ) {
      return false
    }

    // 3. Non-Vietnamese error toggle
    if (!checkSettings.nonVietnamese && group.type === "NonVietnamese") {
      return false
    }

    // 4. Vietnamese error toggle (covers Dictionary, Uppercase, Typo, Spelling, SpecialCharacter)
    if (!checkSettings.vietnamese && group.type !== "NonVietnamese") {
      return false
    }

    return true
  })
}

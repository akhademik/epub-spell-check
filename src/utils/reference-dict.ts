import referenceJson from "../data/reference-vn.json"
import { logger } from "./logger"

const REMOTE_REFERENCE_URL =
  "https://raw.githubusercontent.com/1ec5/hunspell-vi/main/dictionaries/vi-DauMoi.dic"

let cachedReferenceWords: Set<string> | null = null

/**
 * Loads the Vietnamese reference dictionary.
 * Resolution strategy:
 * 1. Returns in-memory cache if already loaded in this session.
 * 2. Attempts to fetch from remote GitHub repository.
 * 3. Falls back to bundled reference dataset in src/data/reference-vn.json.
 * Cached in-memory during the session and can be cleared at any time.
 */
export async function loadReferenceDictionary(): Promise<Set<string>> {
  if (cachedReferenceWords && cachedReferenceWords.size > 0) {
    return cachedReferenceWords
  }

  const wordsSet = new Set<string>()

  // 1. Try remote fetch
  try {
    const res = await fetch(REMOTE_REFERENCE_URL)
    if (res.ok) {
      const text = await res.text()
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line || (i === 0 && /^\d+$/.test(line))) continue
        const word = line.split("/")[0].trim().normalize("NFC")
        if (word) wordsSet.add(word)
      }
    }
  } catch (err) {
    logger.warn(
      "Remote reference dict fetch failed, using bundled dataset:",
      err
    )
  }

  // 2. Fallback / merge with local bundled dataset
  if (wordsSet.size === 0 && Array.isArray(referenceJson)) {
    for (const w of referenceJson) {
      if (typeof w === "string" && w.trim()) {
        wordsSet.add(w.trim().normalize("NFC"))
      }
    }
  }

  cachedReferenceWords = wordsSet
  return wordsSet
}

/**
 * Clears the session cache so that temporary additions/deletions don't leave residual state.
 */
export function clearReferenceDictionaryCache(): void {
  cachedReferenceWords = null
}

/**
 * Returns the bundled reference dictionary synchronously (useful as candidate pool).
 */
export function getBundledReferenceDictionarySync(): Set<string> {
  if (cachedReferenceWords && cachedReferenceWords.size > 0) {
    return cachedReferenceWords
  }
  const wordsSet = new Set<string>()
  if (Array.isArray(referenceJson)) {
    for (const w of referenceJson) {
      if (typeof w === "string" && w.trim()) {
        wordsSet.add(w.trim().normalize("NFC"))
      }
    }
  }
  return wordsSet
}

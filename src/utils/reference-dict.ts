import referenceJson from "../data/reference-vn.json"

let cachedReferenceWords: Set<string> | null = null

/**
 * Loads the curated Vietnamese reference dictionary.
 * Uses the local bundled dataset in src/data/reference-vn.json.
 * Cached in-memory during the session and can be cleared at any time.
 */
export async function loadReferenceDictionary(): Promise<Set<string>> {
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

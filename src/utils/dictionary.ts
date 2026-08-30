import { DICTIONARY_VERSION } from "../constants"
import type { Dictionaries, DictionaryStatus } from "../types/dictionary"
import { getCache, setCache } from "./indexed-db"
import { logger } from "./logger"

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000

async function fetchLocalDict(localFilename: string): Promise<string> {
  const localRes = await fetch(`/${localFilename}`)
  if (!localRes.ok) {
    throw new Error(
      `Failed to load local file ${localFilename}, status: ${localRes.status}`
    )
  }
  const contentType = localRes.headers.get("content-type")
  if (contentType?.includes("text/html")) {
    throw new Error(
      `Failed to load expected text file ${localFilename}. Server returned HTML fallback.`
    )
  }
  return await localRes.text()
}

async function getDictionary(
  dictName: "vn" | "non-vn" | "custom" | "names"
): Promise<string> {
  const isDev = Boolean(import.meta.env?.DEV)
  const cacheKey = `dict-${dictName}-${DICTIONARY_VERSION}`
  if (!isDev) {
    try {
      const cached = await getCache<{ timestamp: number; data: string }>(
        cacheKey
      )
      if (cached && Date.now() - cached.timestamp < TWENTY_FOUR_HOURS_IN_MS) {
        logger.info(`Using cached dictionary for ${dictName}`)
        return cached.data
      }
    } catch (_e) {
      logger.warn(`Failed reading IndexedDB cache for ${dictName}:`, _e)
    }
  } else {
    logger.info(
      `Dev mode active: Bypassing IndexedDB cache for fresh ${dictName} dict`
    )
  }

  logger.info(`Fetching fresh dictionary for ${dictName}`)
  const filename = `${dictName}-dict.txt`
  const data = await fetchLocalDict(filename)
  try {
    await setCache(cacheKey, { timestamp: Date.now(), data })
  } catch (_e) {
    logger.warn(`Failed setting IndexedDB cache for ${dictName}:`, _e)
  }
  return data
}

export async function loadDictionaries(): Promise<{
  dictionaries: Dictionaries
  status: DictionaryStatus
}> {
  const dictionaries: Dictionaries = {
    vietnamese: new Set<string>(),
    nonVietnamese: new Set<string>(),
    custom: new Set<string>(),
    names: new Set<string>()
  }
  const status: DictionaryStatus = {
    isVietnameseLoaded: false,
    isNonVietnameseLoaded: false,
    isCustomLoaded: false,
    isNamesLoaded: false,
    vietnameseWordCount: 0,
    nonVietnameseWordCount: 0,
    customWordCount: 0,
    namesWordCount: 0
  }

  const [vnRes, nonVnRes, customRes, namesRes] = await Promise.all([
    getDictionary("vn"),
    getDictionary("non-vn"),
    getDictionary("custom"),
    getDictionary("names")
  ])

  // 1. Process Vietnamese Dictionary
  for (const line of vnRes.split("\n")) {
    let word = line.trim()
    if (!word) continue
    if (word.startsWith("{") && word.endsWith("}")) {
      try {
        word = JSON.parse(word).text
      } catch (_e) {
        /* intentional no-op */
      }
    }
    const cleanWord = word.toLowerCase().normalize("NFC")
    if (cleanWord) {
      for (const p of cleanWord.split(/\s+/)) {
        dictionaries.vietnamese.add(p)
      }
    }
  }
  status.isVietnameseLoaded = true
  status.vietnameseWordCount = dictionaries.vietnamese.size

  // 2. Process Non-Vietnamese (English, French, Italian, Spanish, German, etc.) Dictionary
  for (const word of nonVnRes.split(/\r?\n/)) {
    const cleanWord = word.trim().toLowerCase()
    if (cleanWord) {
      dictionaries.nonVietnamese.add(cleanWord)
    }
  }
  status.isNonVietnameseLoaded = true
  status.nonVietnameseWordCount = dictionaries.nonVietnamese.size

  // 3. Process Custom Dictionary (Abbreviations, terms)
  for (const word of customRes.split(/\r?\n/)) {
    const cleanWord = word.trim()
    if (cleanWord) {
      dictionaries.custom.add(cleanWord)
    }
  }
  status.isCustomLoaded = true
  status.customWordCount = dictionaries.custom.size

  // 4. Process Names Dictionary (Proper names, historical figures, places)
  for (const word of namesRes.split(/\r?\n/)) {
    const cleanWord = word.trim()
    if (cleanWord) {
      dictionaries.names.add(cleanWord)
      dictionaries.names.add(cleanWord.toLowerCase())
    }
  }
  status.isNamesLoaded = true
  status.namesWordCount = namesRes.split(/\r?\n/).filter((w) => w.trim()).length

  return { dictionaries, status }
}

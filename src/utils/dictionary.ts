import { DICTIONARY_VERSION } from "../constants"
import type {
  Dictionaries,
  DictionaryStatus,
  IndexedDictionary
} from "../types/dictionary"
import { getBaseWordWithoutD } from "./analysis-core"
import { getCache, setCache } from "./indexed-db"
import { logger } from "./logger"

export function buildIndexedDictionary(
  words: Iterable<string>
): IndexedDictionary {
  const wordsArr = Array.from(words)
  const byLength = new Map<number, string[]>()
  const baseWordCache = new Map<string, string>()

  for (const word of wordsArr) {
    const len = word.length
    let bucket = byLength.get(len)
    if (!bucket) {
      bucket = []
      byLength.set(len, bucket)
    }
    bucket.push(word)
    baseWordCache.set(word, getBaseWordWithoutD(word))
  }

  return {
    words: wordsArr,
    byLength,
    baseWordCache
  }
}

// Dictionary content can now change at any time via the /api/dict admin
// endpoint (backed by Cloudflare KV), so we cache much more briefly than
// before (was 1 hour) to keep newly-added words showing up quickly.
const DICT_CACHE_TTL_MS = 10 * 60 * 1000

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

function dictCacheKey(dictName: string): string {
  return `dict-${dictName}-${DICTIONARY_VERSION}`
}

/**
 * Fetches dictionary content, preferring the live KV-backed API so that
 * words added through the admin panel show up without a rebuild/redeploy.
 * Falls back to the bundled `public/*.txt` file if the API is unreachable
 * (e.g. plain `vite` dev server, or the Cloudflare Function/KV is down).
 */
async function fetchDictContent(
  dictName: "vn" | "non-vn" | "custom" | "names"
): Promise<string> {
  try {
    const apiRes = await fetch(`/api/dict/${dictName}`)
    if (apiRes.ok) {
      const contentType = apiRes.headers.get("content-type")
      if (!contentType?.includes("text/html")) {
        return await apiRes.text()
      }
    } else {
      logger.warn(
        `Dict API returned ${apiRes.status} for ${dictName}, falling back to bundled file`
      )
    }
  } catch (_e) {
    logger.warn(
      `Dict API unreachable for ${dictName}, falling back to bundled file:`,
      _e
    )
  }

  return await fetchLocalDict(`${dictName}-dict.txt`)
}

async function getDictionary(
  dictName: "vn" | "non-vn" | "custom" | "names"
): Promise<string> {
  const isDev = Boolean(import.meta.env?.DEV)
  const cacheKey = dictCacheKey(dictName)
  if (!isDev) {
    try {
      const cached = await getCache<{ timestamp: number; data: string }>(
        cacheKey
      )
      if (cached && Date.now() - cached.timestamp < DICT_CACHE_TTL_MS) {
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
  const data = await fetchDictContent(dictName)
  try {
    await setCache(cacheKey, { timestamp: Date.now(), data })
  } catch (_e) {
    logger.warn(`Failed setting IndexedDB cache for ${dictName}:`, _e)
  }
  return data
}

/**
 * Forces a fresh fetch of one dictionary and refreshes its IndexedDB cache,
 * bypassing the TTL. Used right after the admin panel adds/removes words so
 * a subsequent `loadDictionaries()` call sees the new content immediately.
 */
export async function refreshDictionaryCache(
  dictName: "vn" | "non-vn" | "custom" | "names"
): Promise<void> {
  const data = await fetchDictContent(dictName)
  try {
    await setCache(dictCacheKey(dictName), { timestamp: Date.now(), data })
  } catch (_e) {
    logger.warn(`Failed setting IndexedDB cache for ${dictName}:`, _e)
  }
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

  const [vnResult, nonVnResult, customResult, namesResult] =
    await Promise.allSettled([
      getDictionary("vn"),
      getDictionary("non-vn"),
      getDictionary("custom"),
      getDictionary("names")
    ])

  const vnRes = vnResult.status === "fulfilled" ? vnResult.value : ""
  const nonVnRes = nonVnResult.status === "fulfilled" ? nonVnResult.value : ""
  const customRes =
    customResult.status === "fulfilled" ? customResult.value : ""
  const namesRes = namesResult.status === "fulfilled" ? namesResult.value : ""

  if (vnResult.status === "rejected") {
    logger.warn("Failed loading VN dictionary:", vnResult.reason)
  }
  if (nonVnResult.status === "rejected") {
    logger.warn("Failed loading Non-VN dictionary:", nonVnResult.reason)
  }
  if (customResult.status === "rejected") {
    logger.warn("Failed loading Custom dictionary:", customResult.reason)
  }
  if (namesResult.status === "rejected") {
    logger.warn("Failed loading Names dictionary:", namesResult.reason)
  }

  // 1. Process Vietnamese Dictionary
  if (vnRes) {
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
  }

  // 2. Process Non-Vietnamese (English, French, Italian, Spanish, German, etc.) Dictionary
  if (nonVnRes) {
    for (const word of nonVnRes.split(/\r?\n/)) {
      const cleanWord = word.trim().toLowerCase()
      if (cleanWord) {
        dictionaries.nonVietnamese.add(cleanWord)
      }
    }
    status.isNonVietnameseLoaded = true
    status.nonVietnameseWordCount = dictionaries.nonVietnamese.size
  }

  // 3. Process Custom Dictionary (Abbreviations, terms)
  if (customRes) {
    for (const word of customRes.split(/\r?\n/)) {
      const cleanWord = word.trim()
      if (cleanWord) {
        dictionaries.custom.add(cleanWord)
      }
    }
    status.isCustomLoaded = true
    status.customWordCount = dictionaries.custom.size
  }

  // 4. Process Names Dictionary (Proper names, historical figures, places)
  if (namesRes) {
    for (const word of namesRes.split(/\r?\n/)) {
      const cleanWord = word.trim()
      if (cleanWord) {
        dictionaries.names.add(cleanWord)
        dictionaries.names.add(cleanWord.toLowerCase())
      }
    }
    status.isNamesLoaded = true
    status.namesWordCount = namesRes
      .split(/\r?\n/)
      .filter((w) => w.trim()).length
  }

  dictionaries.indexed = {
    vietnamese: buildIndexedDictionary(dictionaries.vietnamese),
    nonVietnamese: buildIndexedDictionary(dictionaries.nonVietnamese),
    custom: buildIndexedDictionary(dictionaries.custom),
    names: buildIndexedDictionary(dictionaries.names)
  }

  return { dictionaries, status }
}

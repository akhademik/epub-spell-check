/**
 * Maximum file size limit for uploads in megabytes.
 */
export const FILE_SIZE_LIMIT_MB = 50

/**
 * Current version for dictionary files (incremented to bust stale IndexedDB cache).
 */
export const DICTIONARY_VERSION = "v13"

/**
 * Maximum file size limit for uploads in bytes.
 */
export const FILE_SIZE_LIMIT_BYTES = FILE_SIZE_LIMIT_MB * 1024 * 1024

/**
 * Maximum number of words allowed in the whitelist.
 */
export const WHITELIST_WORD_COUNT_LIMIT = 10000

/**
 * Maximum length of a single word in the whitelist.
 */
export const WHITELIST_WORD_LENGTH_LIMIT = 50

/**
 * Maximum font size for the reader view in rem units.
 */
export const FONT_SIZE_MAX_REM = 3

/**
 * Minimum font size for the reader view in rem units.
 */
export const FONT_SIZE_MIN_REM = 0.8

/**
 * The required file extension for EPUB files.
 */
export const EPUB_FILE_EXTENSION = ".epub"

/**
 * Allowed file extensions for whitelist import.
 */
export const WHITELIST_FILE_EXTENSIONS = ["txt", "md"]

/**
 * Number of characters to show before and after a target word in the context view.
 */
export const CONTEXT_LENGTH_CHARS = 120

/**
 * Maximum number of suggestions to display for a misspelled word.
 */
export const MAX_SUGGESTION_COUNT = 4

/**
 * Maximum number of toast notifications displayed at once.
 */
export const MAX_TOASTS_DISPLAYED = 2

/**
 * Time in milliseconds before a toast notification automatically dismisses.
 */
export const TOAST_AUTO_DISMISS_MS = 3000

/**
 * A palette of Tailwind CSS color classes for the whitelist tags.
 */
export const TAG_COLORS = [
  "bg-rose-600",
  "bg-pink-600",
  "bg-fuchsia-600",
  "bg-purple-600",
  "bg-violet-600",
  "bg-indigo-600",
  "bg-blue-600",
  "bg-sky-600",
  "bg-cyan-600",
  "bg-teal-600",
  "bg-emerald-600"
]

/**
 * Regex to detect words containing special characters.
 */
export const SPECIAL_CHARACTER_REGEX =
  /[^\p{L}\p{M}\s0-9.,!?:;"'()[\]{}–—\-/\\«»…\n\r\t]+/gu

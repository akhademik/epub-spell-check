/**
 * Debounce delay in milliseconds for expensive operations like re-filtering errors after whitelist input.
 */
export const DEBOUNCE_DELAY_MS = 500;
/**
 * Maximum file size limit for uploads in megabytes.
 */
export const FILE_SIZE_LIMIT_MB = 1;
/**
 * Maximum file size limit for uploads in bytes.
 */
export const FILE_SIZE_LIMIT_BYTES = FILE_SIZE_LIMIT_MB * 1024 * 1024;
/**
 * Maximum number of words allowed in the whitelist.
 */
export const WHITELIST_WORD_COUNT_LIMIT = 10000;
/**
 * Maximum length of a single word in the whitelist.
 */
export const WHITELIST_WORD_LENGTH_LIMIT = 50;
/**
 * Maximum font size for the reader view in rem units.
 */
export const FONT_SIZE_MAX_REM = 3;
/**
 * Minimum font size for the reader view in rem units.
 */
export const FONT_SIZE_MIN_REM = 0.8;
/**
 * Short debounce delay in milliseconds for settings re-filter operations.
 */
export const SETTINGS_FILTER_DEBOUNCE_MS = 50;

/**
 * The required file extension for EPUB files.
 */
export const EPUB_FILE_EXTENSION = ".epub";
/**
 * Allowed file extensions for whitelist import.
 */
export const WHITELIST_FILE_EXTENSIONS = ["txt", "md"];

/**
 * Number of characters to show before and after a target word in the context view.
 */
export const CONTEXT_LENGTH_CHARS = 30;
/**
 * Maximum number of suggestions to display for a misspelled word.
 */
export const MAX_SUGGESTION_COUNT = 3;
/**
 * Maximum number of toast notifications displayed at once.
 */
export const MAX_TOASTS_DISPLAYED = 3;
/**
 * Time in milliseconds before a toast notification automatically dismisses.
 */
export const TOAST_AUTO_DISMISS_MS = 3000;

/**
 * The CSS class used to hide elements.
 */
export const HIDDEN_CLASS = "hidden";
/**
 * CSS classes to make the processing UI header visible.
 */
export const FLEX_CLASS_VISIBLE = [
  "flex",
  "items-end",
  "justify-between",
  "mb-4",
];
/**
 * CSS classes to make the results section visible.
 */
export const RESULTS_SECTION_VISIBLE = ["flex", "flex-col", "gap-6"];
/**
 * CSS classes to make buttons visible.
 */
export const BUTTON_VISIBLE = ["flex", "items-center", "gap-2"];
/**
 * CSS classes to make overlays visible.
 */
export const OVERLAY_VISIBLE = ["flex", "items-center", "justify-center"];

# Optimization and Cleanup Plan

This document outlines potential areas for optimizing and cleaning up the project, focusing on improving performance, maintainability, and code quality.

## 1. Performance Optimizations

### 1.1 Dictionary Management (`src/utils/dictionary.ts`)

*   **Current State:** Dictionaries are loaded concurrently into `Set` objects using `Promise.all`. Hardcoded Vietnamese words are present.
*   **Potential Optimization:**
    *   **Large Dictionary Handling:** For extremely large dictionaries, consider alternative data structures (e.g., specialized trie implementations) that offer better memory efficiency or faster lookups than `Set`s, especially if dictionary size becomes a performance bottleneck. (Low priority for now, given current scope)
    *   **Consolidate Dictionary Source:** The project currently processes Vietnamese words from `public/vn-dict.txt`, which can include specially formatted entries. Ensure that `public/vn-dict.txt` remains the single, well-maintained source of truth for the Vietnamese dictionary, avoiding any direct word embedding in the TypeScript code.

### 1.2 Text Analysis (`src/utils/analyzer.ts`)

*   **Current State:** Uses `analysisCache` and Levenshtein distance for suggestions. Iterates through text blocks and words.
*   **Potential Optimization:**
    *   **Levenshtein Optimization:** The Levenshtein distance calculation can be computationally expensive.
        *   **Limit Suggestions:** Limit the number of suggestions generated per error.
        *   **Thresholding:** Apply a maximum Levenshtein distance threshold to avoid generating suggestions for words that are too dissimilar.
        *   **Early Exit:** Optimize the suggestion generation process to exit early if enough good suggestions are found.
    *   **Pre-processing Text:** Ensure text normalization (e.g., `NFC`) and cleaning are efficient and only performed once per text block.
    *   **Web Workers:** For very large EPUBs, consider offloading the `analyzeText` function to a Web Worker to prevent blocking the main thread and keep the UI responsive during analysis. This would involve refactoring how `analyzeText` reports progress and results.

### 1.3 UI Responsiveness

*   **Current State:** `updateProgress` is used in `epub-parser.ts` and `analyzer.ts`.
*   **Potential Optimization:**
    *   **Debounce/Throttle UI Updates:** Ensure that frequent `updateProgress` calls or other UI updates (e.g., rendering error lists) are debounced or throttled to prevent excessive re-renders and maintain UI fluidity. The project already uses `DEBOUNCE_DELAY_MS` in `constants.ts`, ensure it's applied effectively where needed.
    *   **Virtualization:** For very long error lists or context views, consider UI virtualization techniques to render only visible items, significantly improving performance and memory usage.

## 2. Code Quality and Maintainability

### 2.1 Consistent Error Handling

*   **Current State:** `epub-parser.ts` throws errors, `dictionary.ts` logs and handles errors.
*   **Potential Improvement:**
    *   **Centralized Error Reporting:** Implement a more centralized and consistent error handling strategy. This could involve:
        *   Using `notifications.ts` to display user-friendly error messages for critical failures.
        *   Standardizing error objects or classes.
        *   Potentially integrating with a simple error tracking mechanism if needed for debugging.

### 2.2 Refine Constants (`src/constants.ts`)

*   **Current State:** Centralizes various constants.
*   **Potential Improvement:**
    *   **Documentation:** Add JSDoc comments to all constants explaining their purpose and usage.
    *   **Grouping:** Ensure related constants are logically grouped.

### 2.3 JSDoc / Type Comments

*   **Current State:** TypeScript is used, but extensive JSDoc or type comments for functions, parameters, and complex types might be missing.
*   **Potential Improvement:** Add comprehensive JSDoc comments to all public functions, interfaces, and complex types to improve code readability, maintainability, and tooling support. This aligns with the "clean up" aspect by making the codebase easier to understand for new developers.

### 2.4 Modularization and Separation of Concerns

*   **Current State:** Modules like `ui-render.ts` and `ui-utils.ts` handle UI logic.
*   **Potential Improvement:** Review modules for overly large functions or files. Break down complex functions into smaller, more focused units. Ensure a clear separation of concerns between UI logic, business logic, and data handling.

## 3. Configuration and Tooling

### 3.1 ESLint Rules

*   **Current State:** `.eslintrc.cjs` is present.
*   **Potential Improvement:** Review and potentially tighten ESLint rules to enforce stricter code style and identify potential issues earlier. Consider adding rules for complexity, unused variables (if not already strict), and other best practices.

## Conclusion

The project demonstrates a solid foundation with modern technologies. The suggestions above aim to further enhance its performance, robustness, and long-term maintainability. I recommend prioritizing Web Workers for text analysis and UI responsiveness if performance becomes an issue with larger EPUB files. Consolidating hardcoded dictionary words and improving JSDoc comments would be good starting points for code quality improvements.

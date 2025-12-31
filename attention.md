# Codebase Attention Areas

This document highlights parts of the codebase that appear to be unused, redundant, or otherwise candidates for optimization. These findings are based on a comprehensive scan and should be further investigated for confirmation and impact assessment.

## Summary of Findings

The codebase originally contained several areas for potential optimization. The most prominent findings included an unused file (`src/counter.ts`) and duplicated logic in the form of an `updateProgress` function. **These two items have been addressed and optimized.** The duplicated whitelist parsing logic in `src/main.ts` has also been extracted into a dedicated utility. An in-depth scan of `src/utils/analyzer.ts` and `src/utils/ui-render.ts` revealed no unused internal code. The previously noted `src/typescript.svg` file does not exist in the project, and `index.html` contains no references to it. No unused production dependencies were found. A full analysis still requires checking all type definitions and remaining assets in the `public` directory. The findings so far provide a strong starting point for ongoing optimization.

## Relevant Locations for Optimization

### `src/counter.ts` (Status: Completed)

*   **Reasoning:** This file (`src/counter.ts`) and its exported function `setupCounter` appeared to be leftover template code from a Vite installation. It was not imported or used anywhere in the application.
*   **Action Taken:** The file `src/counter.ts` has been safely deleted.
*   **Key Symbols:** `setupCounter`

### `src/utils/epub-parser.ts` (Duplicated `updateProgress` function) (Status: Completed)

*   **Reasoning:** This file contained a local, non-exported function named `updateProgress`, which was a duplicate of the one already exported from `src/utils/ui-render.ts` and correctly used in `main.ts`. This created duplicated logic and an unnecessary local implementation.
*   **Action Taken:** The local `updateProgress` function in `epub-parser.ts` has been removed. The exported version from `ui-render.ts` is now imported and used instead, centralizing the functionality and improving maintainability.
*   **Key Symbols:** `updateProgress`

## Review of `src/main.ts` - Refactoring Opportunities

A detailed review of `src/main.ts` identified the following areas for potential refactoring and improvement:

*   **Duplicated Whitelist Parsing Logic (Status: Completed)**: The logic for splitting and trimming whitelist input (e.g., `currentWhitelistRaw.split(/[,;"]+/).map((t: any) => t.trim().filter(Boolean)`) was repeated in `quickIgnore()`, `quickIgnoreWordFromList()`, `exportWhitelist()`, and `filterAndRenderErrors()`.
    *   **Improvement**: This has been extracted into a dedicated helper function (`parseWhitelistInput(inputString: string): Set<string>`) in `src/utils/whitelist-parser.ts` to improve reusability and maintainability, and reduce the need for `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.
*   **Centralized UI Toggling for Complex Components**: The visibility and display-mode toggling for components like `processingUi` and `processingUiHeader` (and potentially `loadingOverlay`, `resultsSection`) are currently handled by individual `if (UI.element) UI.element.classList.add/remove(...)` calls spread across `resetApp()` and `handleFile()`.
    *   **Improvement**: Create dedicated helper functions (e.g., `showProcessingUI(ui: UIElements)`, `hideProcessingUI(ui: UIElements)`) that encapsulate all related class manipulations for these groups of elements. This would make the main functions cleaner and reduce the chance of inconsistencies. These helper functions could be placed in `src/utils/ui-utils.ts` or similar.
*   **Alert Dialogs**: The use of `alert()` for user feedback (e.g., in `performExport()` and `handleFile()`) is generally not ideal for modern UIs as it's blocking and unstyled.
    *   **Improvement**: Implement a more integrated, non-blocking notification system (e.g., a toast component or custom modal) to provide feedback to the user. This would involve creating new UI elements and logic for managing them, possibly within `src/utils/ui-render.ts` or a new `src/utils/notifications.ts` module.

## Further Investigation Needed

To complete the optimization assessment, the following areas require more detailed investigation:

*   **Scanning all files in `src/` (e.g., `analyzer.ts`, `ui-render.ts`) for unused internal functions and variables beyond what was found in the initial trace.**
    *   **Update:** A detailed review of `src/utils/analyzer.ts` and `src/utils/ui-render.ts` was conducted. All internal (non-exported) functions and variables in these modules are actively used by their respective exported functions. **No unused internal code was identified in these files.**
*   Checking all type definitions in `src/types/` for any unused or redundant declarations.
*   **Thoroughly analyzing the `public` directory for unreferenced assets (e.g., `custom-dict.txt`, `en-dict.txt`, `vn-dict.txt`, `typescript.svg`).**
    *   **Update:** A search of the entire project confirms that the file `src/typescript.svg` **does not exist** in the codebase. The `index.html` file also contains no references to it. The concern about this file is unfounded. Remaining assets in `public/` still need verification.
*   A deeper analysis of project dependencies to ensure all are actively used and necessary.
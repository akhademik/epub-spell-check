# Codebase Attention Areas

This document highlights parts of the codebase that appear to be unused, redundant, or otherwise candidates for optimization. These findings are based on a comprehensive scan and should be further investigated for confirmation and impact assessment.

## Summary of Findings

The codebase originally contained several areas for potential optimization. The most prominent findings included an unused file (`src/counter.ts`) and duplicated logic in the form of an `updateProgress` function. **These two items have been addressed and optimized.** The duplicated whitelist parsing logic in `src/main.ts` has also been extracted into a dedicated utility, UI toggling for complex components has been centralized, and blocking `alert()` dialogs have been replaced with a non-blocking toast notification system. An in-depth scan of `src/utils/analyzer.ts` and `src/utils/ui-render.ts` revealed no unused internal code. The previously noted `src/typescript.svg` file does not exist in the project, and `index.html` contains no references to it. Additionally, unused type definition files (`src/types/errors.d.ts`, `src/types/state.d.ts`, and the `ProgressUpdate` interface in `src/types/epub.d.ts`) have been identified and removed. No unused production dependencies were found. A full analysis still requires checking remaining assets in the `public` directory. The findings so far provide a strong starting point for ongoing optimization.

A recent code review has identified several new areas for improvement, which are detailed in the "Code Review Findings" section.

## Relevant Locations for Optimization

### `src/counter.ts` (Status: Completed)

*   **Reasoning:** This file (`src/counter.ts`) and its exported function `setupCounter` appeared to be leftover template code from a Vite installation. It was not imported or used anywhere in the application.
*   **Action Taken:** The file `src/counter.ts` has been safely deleted.
*   **Key Symbols:** `setupCounter`

### `src/utils/epub-parser.ts` (Duplicated `updateProgress` function) (Status: Completed)

*   **Reasoning:** This file contained a local, non-exported function named `updateProgress`, which was a duplicate of the one already exported from `src/utils/ui-render.ts` and correctly used in `main.ts`. This created duplicated logic and an unnecessary local implementation.
*   **Action Taken:** The local `updateProgress` function in `epub-parser.ts` has been removed. The exported version from `ui-render.ts` is now imported and used instead, centralizing the functionality and improving maintainability.
*   **KeySymbols:** `updateProgress`

### `src/types/errors.d.ts` (Status: Completed)

*   **Reasoning:** This file contained multiple type definitions (`ErrorType`, `ErrorContext`, `ErrorInstance`, `ErrorGroup`). Investigation concluded that none of these types were used anywhere in the codebase.
*   **Action Taken:** The file `src/types/errors.d.ts` has been safely deleted.
*   **Key Symbols:** `ErrorType`, `ErrorContext`, `ErrorInstance`, `ErrorGroup`

### `src/types/state.d.ts` (Status: Completed)

*   **Reasoning:** This file defined types for application state management (`ReaderSettings`, `GlobalState`). Investigation concluded that these types were not used, suggesting they were remnants of a planned or abandoned feature.
*   **Action Taken:** The file `src/types/state.d.ts` has been safely deleted.
*   **Key Symbols:** `ReaderSettings`, `GlobalState`

### `ProgressUpdate` interface in `src/types/epub.d.ts` (Status: Completed)

*   **Reasoning:** The `ProgressUpdate` interface was defined but not used anywhere in the codebase.
*   **Action Taken:** The `ProgressUpdate` interface has been removed from `src/types/epub.d.ts`.
*   **Key Symbols:** `ProgressUpdate`

## Review of `src/main.ts` - Refactoring Opportunities

A detailed review of `src/main.ts` identified the following areas for potential refactoring and improvement:

*   **Duplicated Whitelist Parsing Logic (Status: Completed)**: The logic for splitting and trimming whitelist input (e.g., `currentWhitelistRaw.split(/[,;"]+/).map((t: any) => t.trim().filter(Boolean)`) was repeated in `quickIgnore()`, `quickIgnoreWordFromList()`, `exportWhitelist()`, and `filterAndRenderErrors()`.
    *   **Improvement**: This has been extracted into a dedicated helper function (`parseWhitelistInput(inputString: string): Set<string>`) in `src/utils/whitelist-parser.ts` to improve reusability and maintainability, and reduce the need for `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.
*   **Centralized UI Toggling for Complex Components (Status: Completed)**: The visibility and display-mode toggling for components like `processingUi` and `processingUiHeader` (and potentially `loadingOverlay`, `resultsSection`) were handled by individual `if (UI.element) UI.element.classList.add/remove(...)` calls spread across `resetApp()` and `handleFile()`.
    *   **Improvement**: Dedicated helper functions (`showProcessingUI(ui: UIElements)`, `hideProcessingUI(ui: UIElements)`, `showResultsUI(ui: UIElements)`, `showLoadingOverlay(ui: UIElements)`, `hideLoadingOverlay(ui: UIElements)`) have been created in `src/utils/ui-utils.ts` to encapsulate all related class manipulations for these groups of elements. This makes the main functions cleaner and reduces the chance of inconsistencies.
*   **Alert Dialogs (Status: Completed)**: The use of `alert()` for user feedback (e.g., in `performExport()` and `handleFile()`) was generally not ideal for modern UIs as it's blocking and unstyled.
    *   **Action Taken**: All `alert()` calls have been replaced with calls to a new non-blocking toast notification system implemented in `src/utils/notifications.ts`. This improves the user experience.

## Code Review Findings

Based on a recent code review, the following issues and opportunities for improvement have been identified.

### High Priority

*   **Memory Leak in Cover Handling:** Object URLs for cover images are not revoked when a new book is loaded, only when the application is reset. This can lead to a memory leak over time.
*   **Race Condition in Debouncing:** The `debounceTimer` in `src/main.ts` is not cleared on component unmount (e.g., page unload), which could lead to unexpected behavior.
*   **Input Validation:** The whitelist textarea does not have explicit validation, which could lead to unexpected behavior if the user inputs malformed data.
*   **Undo/Redo for Whitelist:** The review suggests adding undo/redo functionality for whitelist changes to improve user experience.

### Medium Priority

*   **Scattered State Management:** The application's state is managed across a global `state` object, `localStorage`, and direct DOM element state. This could be centralized for better maintainability.
*   **Imperative UI Updates:** The code directly manipulates the DOM for UI updates. A more reactive pattern could improve code clarity and reduce potential for bugs.
*   **Broad Function Responsibilities:** The `handleFile` function in `src/main.ts` has many responsibilities and could be broken down into smaller, more focused functions.
*   **Inconsistent Modal State Toggling:** Different modals use different patterns for showing and hiding, which should be standardized.
*   **Event Listener Leak:** The global `keydown` event listener is never removed, which can lead to memory leaks and unexpected behavior in more complex applications.
*   **Excessive Filtering:** The `filterAndRenderErrors` function re-calculates the filtered error list on every change, which could be optimized by caching the results.
*   **DOM Thrashing:** There are several places where `classList` is called sequentially on the same element, which can be optimized to reduce DOM reflows.
*   **Virtual Scrolling for Error List:** For books with a large number of errors, the error list could become a performance bottleneck. Implementing virtual scrolling would improve performance.
*   **Keyboard Shortcuts Help:** The application has keyboard shortcuts, but there is no easy way for the user to discover them.

### Low Priority

*   **Accessibility (ARIA):** The application could be improved by adding ARIA labels to provide better accessibility for screen readers.
*   **Theme Toggle:** A dark/light theme toggle could be implemented.
*   **Export Format Options:** The export functionality could be extended to support other formats like JSON or CSV.
*   **Cache Dictionary Lookups:** Dictionary lookups could be cached to improve performance.
*   **Progress Persistence:** The application could save its state to allow users to resume their sessions.

## Further Investigation Needed

To complete the optimization assessment, the following areas require more detailed investigation:

*   **Thoroughly analyzing the `public` directory for unreferenced assets (e.g., `custom-dict.txt`, `en-dict.txt`, `vn-dict.txt`).**
*   **A deeper analysis of project dependencies to ensure all are actively used and necessary.**
*   **Investigate the claim of unnecessary re-renders in `renderContextView()` to confirm if it's a valid issue.**

## Code Review Findings

Based on a recent code review, the following issues and opportunities for improvement have been identified.

### High Priority

- **Race Condition in Debouncing:** The `debounceTimer` in `src/main.ts` is now cleared on `beforeunload` event, preventing unexpected behavior when the component unmounts. **[Addressed]**
- **Undo/Redo for Whitelist:** The review suggests adding undo/redo functionality for whitelist changes to improve user experience.
- **Memory Leaks in State:** The `resetApp` function re-assigns arrays (`loadedTextContent`, `allDetectedErrors`) instead of clearing them (e.g., `array.length = 0`), which can be less efficient for garbage collection.
- **Improved Error Boundaries:** The main `handleFile` function has a generic `catch` block. It should be improved to handle specific errors (e.g., parsing errors, malformed EPUBs) to provide better user feedback.

### Medium Priority

- **Scattered State Management:** The application's state is managed across a global `state` object, `localStorage`, and direct DOM element state. This should be centralized into a state manager for better maintainability.
- **Imperative UI Updates & Tight Coupling:** The code directly manipulates the DOM for UI updates, and business logic is tightly coupled with UI code (e.g., in `quickIgnore`). A more reactive, decoupled pattern would improve code clarity.
- **Broad Function Responsibilities / High Complexity:** Functions like `handleFile` and `quickIgnore` have too many responsibilities and should be broken down into smaller, more focused functions.
- **Inefficient Filtering & Rendering:** `filterAndRenderErrors` is called frequently. Its performance could be improved with memoization to avoid re-calculating the filtered list unnecessarily.
- **Inconsistent Modal State Toggling:** Different modals use different patterns for showing and hiding, which should be standardized into helper functions.
- **Event Listener Leak:** The global `keydown` event listener is never removed, which can lead to memory leaks and unexpected behavior in more complex applications.
- **DOM Query Selectors in Loops / DOM Thrashing:** The code frequently uses `querySelectorAll` inside functions that are called often. These selectors should be cached. There are also several places where `classList` is called sequentially, which can be optimized.
- **Event Delegation for Error List:** Instead of adding an event listener to every item in the error list, a single listener on the parent container (`error-list`) should be used to handle events for all items (event delegation).
- **Magic Numbers and Strings:** The code uses "magic" numbers and strings directly in the logic (e.g., for file size limits, debounce delays). These should be extracted into named constants for better readability and maintainability.

### Low Priority

- **Refactor Whitelist Input Validation:** The input validation logic in `handleImportWhitelist` should be extracted into its own `validateWhitelistWord` function to improve modularity and reusability.
- **Type Safety:** The code could be made more type-safe by using more specific types (e.g., a `ModalType` for modal identifiers).
- **Virtual Scrolling for Error List:** For books with a large number of errors, the error list could become a performance bottleneck. Implementing virtual scrolling would improve performance.
- **Keyboard Shortcuts Help:** The application has keyboard shortcuts, but there is no easy way for the user to discover them.
- **Accessibility (ARIA):** The application could be improved by adding ARIA labels to provide better accessibility for screen readers.
- **Theme Toggle:** A dark/light theme toggle could be implemented.
- **Export Format Options:** The export functionality could be extended to support other formats like JSON or CSV.
- **Cache Dictionary Lookups:** Dictionary lookups could be cached to improve performance.
- **Progress Persistence:** The application could save its state to allow users to resume their sessions.
- **Inconsistent Null Checks:** The code uses a mix of `if (element)` and optional chaining `?.`. A consistent style should be adopted.

## Further Investigation Needed

To complete the optimization assessment, the following areas require more detailed investigation:

- **Thoroughly analyzing the `public` directory for unreferenced assets (e.g., `custom-dict.txt`, `en-dict.txt`, `vn-dict.txt`).**
- **A deeper analysis of project dependencies to ensure all are actively used and necessary.**
- **Investigate the claim of unnecessary re-renders in `renderContextView()` to confirm if it's a valid issue.**
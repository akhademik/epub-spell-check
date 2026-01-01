## Code Review Findings

Based on a recent code review, the following issues and opportunities for improvement have been identified.

### Medium Priority

- ✅ ~~**Scattered State Management:** The application's state is managed across a global `state` object, `localStorage`, and direct DOM element state. This should be centralized into a state manager for better maintainability.~~
- 🟡 **Imperative UI Updates & Tight Coupling:** The code directly manipulates the DOM for UI updates, and business logic is tightly coupled with UI code (e.g., in `quickIgnore`). A more reactive, decoupled pattern would improve code clarity. (Partially done, `quickIgnore` refactored)
- ✅ ~~**Broad Function Responsibilities / High Complexity:** Functions like `handleFile` and `quickIgnore` have too many responsibilities and should be broken down into smaller, more focused functions. (Partially done, `quickIgnore` and `handleFile` refactored)~~
- ✅ ~~**Inefficient Filtering & Rendering:** `filterAndRenderErrors` is called frequently. Its performance could be improved with memoization to avoid re-calculating the filtered list unnecessarily.~~
- ✅ ~~**Inconsistent Modal State Toggling:** Different modals use different patterns for showing and hiding, which should be standardized into helper functions.~~
- ✅ **Event Listener Leak:** The global `keydown` event listener was not removed, which could lead to memory leaks. This has been fixed by ensuring the listener is removed during app reset.
- ✅ **DOM Query Selectors in Loops / DOM Thrashing:** Optimized by caching the selected error element in `state` to prevent repeated `querySelectorAll` calls for styling. `classList` operations in UI utility functions have been refactored for more atomic and declarative class management.
- ✅ **Event Delegation for Error List:** Implemented event delegation for the error list by adding a single click listener to the parent container (`#error-list`), eliminating individual listeners on each error item and handling interactions more efficiently.
- ✅ **Magic Numbers and Strings:** Extracted magic numbers and strings into named constants within `src/constants.ts` to improve readability and maintainability.

### Low Priority

- **Refactor Whitelist Input Validation:** The input validation logic in `handleImportWhitelist` should be extracted into its own `validateWhitelistWord` function to improve modularity and reusability.
- ✅ **Type Safety:** Enhanced type safety for modal handling by introducing a `ModalKey` union type and refactoring `openModal`/`closeModal` functions and their calls to use this type, improving clarity and reducing potential errors.
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

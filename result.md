# Project Analysis: EPUB Spell Checker

This document outlines the current progress of the EPUB Spell Checker project by comparing its implementation against the `sample.htm` reference application.

## Overall Status

The project has a strong foundation with a well-organized file structure (Vite + TypeScript) and a near-complete UI skeleton in `index.html`. The core modules for parsing EPUBs and loading dictionaries are robust. The main gaps are in the spell-checking logic's sophistication and the implementation of UI interactivity. The application is **not currently runnable** in a way that produces a usable result, as the UI is not fully wired up.

---

## ✅ What's Done

### 1. Project Structure & Setup
- **Build System:** The project is correctly set up using Vite, providing a modern and efficient development environment.
- **TypeScript:** The codebase is written in TypeScript, ensuring type safety and better maintainability.
- **Modular Code:** The logic is well-organized into modules (`analyzer.ts`, `dictionary.ts`, `epub-parser.ts`, `ui-render.ts`), which is a significant improvement over the single-script approach in `sample.htm`.
- **Dependencies:** `JSZip` is correctly included as a dependency for EPUB file processing.

### 2. Core Logic
- **EPUB Parsing (`epub-parser.ts`):**
  - Successfully unzips and reads `.epub` files.
  - Correctly parses `META-INF/container.xml` and the `.opf` file.
  - Extracts book metadata (title, author).
  - Extracts the book cover image and creates a local URL for display.
  - Extracts and compiles text content from all relevant sections of the book.
- **Dictionary Loading (`dictionary.ts`):**
  - Implements the dictionary loading logic with a robust fallback system (tries local `public/` directory first, then fetches from remote URLs).
  - Loads all three dictionaries: Vietnamese, English, and the custom whitelist.
  - Updates the UI to show the status of dictionary loading (counts, success/fail status).
- **Basic State Management (`main.ts`):**
  - A central `state` object is defined to manage the application's data.
  - Persistence of settings, whitelist, and the English filter toggle to `localStorage` is implemented (`loadSettings`, `saveSettings`, etc.).

### 3. UI Shell (`index.html`)
- **Complete HTML Structure:** The `index.html` file contains all the necessary HTML elements found in `sample.htm`, including the header, upload section, processing UI, results section, and all modals (Help, Settings, Export).
- **Templates:** The `<template id="error-item-template">` is present and ready for use.
- **Styling:** The UI is styled with Tailwind CSS, matching the look and feel of the reference sample.

---

## ❌ What's Missing

### 1. Core Spell-Checking Logic (`analyzer.ts`)
- **Incomplete Analysis Rules:** The current `getErrorType` function is a simplified version of the logic in `sample.htm`. It is critically missing:
  - **Vietnamese-specific grammar rules:** Checks for `ng`/`ngh`, `g`/`gh`, and `c`/`k` are not implemented. This is a major gap.
  - **Heuristics:** Advanced typo detection like `(aa|ee|oo|dd|js|kx|wt)$` is missing.
- **No Suggestions:** The logic to find and suggest corrections for misspelled words (`findSuggestions` in `sample.htm`) is completely absent.

### 2. UI Interactivity & Rendering
- **Event Handling (`main.ts`):**
  - Most UI event listeners have not been wired up. This includes:
    - Opening and closing the Help, Settings, and Export modals.
    - Keyboard navigation (Arrow keys to move between errors, `Delete`/`I` to ignore).
    - Context navigation buttons (`Prev`/`Next` for error instances).
    - Reader controls for font size and family.
- **Context View Rendering (`ui-render.ts`):**
  - The `renderContextView` function is basic. It displays the text but is missing:
    - The formatted "Suggestions" block.
    - The link to look up the word on Wiktionary.
    - The polished header showing the error type and dot indicator.
- **User Feedback:**
  - There are no **toast notifications** (e.g., for "Copied to clipboard" or "Whitelist imported").
  - The "copy to clipboard" functionality is not implemented.

### 3. Feature Gaps
- **Export Functionality:** While the export modal exists in the HTML, the logic to generate and download the error files (`performExport` in `sample.htm`) is missing from `main.ts`.
- **Error Group Selection:** The visual feedback for selecting an error in the list (highlighting the selected item) is not fully implemented. `selectGroup` exists but the corresponding CSS classes and handling seem incomplete.
- **Application Reset:** The `resetApp` function is implemented but may be missing some cleanup steps compared to the original, and needs to be thoroughly tested.

---

## Conclusion & Next Steps

The project is off to a great start with a solid architectural foundation. The immediate priority should be to **bridge the gaps in the core analysis logic** and then to **progressively wire up the UI elements** to make the application interactive and usable.

1.  **Enhance `analyzer.ts`:** Implement the missing Vietnamese grammar rules and typo-detection heuristics.
2.  **Implement Suggestions:** Create the `findSuggestions` logic (using Levenshtein distance) and integrate it into `ui-render.ts`.
3.  **Wire Up UI:** Add all missing event listeners in `main.ts` for modals, keyboard navigation, and context controls.
4.  **Implement Export:** Add the `performExport` logic to `main.ts`.
5.  **Refine UI Rendering:** Improve `renderContextView` to match the `sample.htm` output and add toast notifications.

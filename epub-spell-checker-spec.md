# EPUB Spell Checker - Application Specification

## Overview
A Vietnamese spell-checking application for EPUB files that detects and highlights various types of errors in Vietnamese text, with support for whitelisting and customizable checking rules.

---

## Core Features

### 1. File Processing
- **Upload EPUB files** via drag-and-drop or file picker
- **Parse EPUB structure**:
  - Read `META-INF/container.xml` to locate content
  - Extract OPF file for metadata
  - Parse spine for reading order
  - Extract all text from paragraphs, headings, lists, divs
- **Display book metadata**:
  - Title
  - Author
  - Cover image (with fallback placeholder)

### 2. Dictionary System
- **Three dictionary sources**:
  - Vietnamese dictionary (primary validation)
  - English dictionary (optional filtering)
  - Custom dictionary (additional whitelist)
- **Dictionary loading**:
  - Load from local files first, fallback to remote URLs
  - Parse both plain text and JSON format `{text: "word"}`
  - Display loading status with indicators (loading/success/error)
  - Show word counts for loaded dictionaries

### 3. Error Detection Types

#### Dictionary Errors
- Words not found in Vietnamese dictionary
- Configurable via settings toggle

#### Uppercase Errors
- Words with 2+ uppercase characters (e.g., "tÔI")
- Configurable via settings toggle

#### Tone Placement Errors
- Wrong tone position (old vs new standard)
- Examples: `oá→óa`, `oà→òa`, `oả→ỏa`, `oã→õa`, `oạ→ọa`, `oé→óe`, etc.
- Configurable via settings toggle

#### Foreign/Structure Errors
- Words containing unusual characters: `f, j, w, z`
- Structural rule violations:
  - `ngh` followed by non-front vowels
  - `ng` followed by front vowels (should be `ngh`)
  - `gh` followed by non-front vowels (should be `g`)
  - `g` followed by `e/ê` (should be `gh`)
  - `k` without `h` followed by non-front vowels
  - `c` followed by front vowels (should be `k`)
- Typo patterns: `aa`, `ee`, `oo`, `dd`, `js`, `kx`, `wt`
- Configurable via settings toggle

### 4. Error Display & Navigation

#### Error List (Left Panel)
- Group errors by word + error type
- Show error count per group
- Color-coded dots by error type:
  - **Red**: Structure/uppercase/typo errors
  - **Orange**: Tone placement errors
  - **Pink**: Foreign words/unknown characters
  - **Blue**: Dictionary errors
- Sort by frequency (highest first)
- Click to select and view context
- Ignore button per item (adds to whitelist)

#### Context View (Right Panel)
- Display error in surrounding context (60 chars before/after)
- Highlight error word with color-coded styling
- Show error type badge
- Navigation for multiple instances (prev/next buttons)
- Instance counter (e.g., "1/5")
- **Reader settings toolbar**:
  - Font toggle (Serif/Sans)
  - Font size increase/decrease
  - Settings persist to localStorage
- Suggestion system:
  - Auto-suggest corrections using Levenshtein distance
  - Click to copy suggestions
- Wiktionary link for each error word

### 5. Whitelist Management
- **Text input area** for whitelist words
- Supports multiple formats:
  - Comma-separated
  - Space-separated
  - Line-separated
- **Import whitelist** from `.txt` file (merges with existing)
- **Export whitelist** to `.txt` file (unique words, one per line, timestamped filename)
- Auto-save to localStorage
- Real-time filtering when whitelist changes

### 6. English Word Filtering
- **Optional toggle** to filter out valid English words
- Shows loading indicator when English dictionary loads
- Only affects display, not core detection
- Persists filter state

### 7. Settings Modal
- **Four configurable toggles**:
  1. Dictionary errors
  2. Uppercase errors
  3. Tone placement errors
  4. Foreign/structure errors
- Settings persist to localStorage
- Re-analyze on settings change with loading overlay
- Keyboard shortcuts reminder display

### 8. Export Functionality
- **Export modal** with two formats:
  1. **VCTVEGROUP format**: `word ==>\n\n`
  2. **Normal format**: `word\n`
- Exports only currently filtered errors
- Filename: `loi-{sanitized-book-title}.txt`
- Download as `.txt` file

### 9. Statistics Display
- **Three stat cards**:
  1. Total words scanned
  2. Total errors detected (sum of all instances)
  3. Unique error groups
- Updates in real-time with filtering

### 10. Keyboard Shortcuts
- **Arrow Up/Down**: Navigate between error groups
- **Delete or I**: Quick ignore (add to whitelist)
- Disabled when input focused or modals open

### 11. Progress Tracking
- Progress bar during EPUB processing
- Stage indicators:
  - Extracting (10%)
  - Reading structure (30%)
  - Reading chapters (30-60%)
  - Analyzing (60%)
- Percentage and status text updates

---

## UI/UX Requirements

### Layout
- **Dark theme** (slate colors)
- **Sticky header** with:
  - Logo and title
  - Help button (opens help modal)
  - Settings button (opens settings dropdown)
  - Export button (visible after analysis)
  - Reset button (visible after analysis)
  - Dictionary status indicator
- **Three-column layout** in results:
  - Error list (1/3 width)
  - Context view (2/3 width)
- **Footer** with version/credit

### Visual Feedback
- Loading overlays for async operations
- Animated progress bars
- Toast notifications for copy actions
- Hover states on interactive elements
- Color-coded error indicators
- Smooth animations (fade-in, transitions)

### Modals
1. **Help Modal**: Usage instructions, shortcuts, features
2. **Settings Modal**: Toggle switches for error types
3. **Export Modal**: Choose export format

---

## Data Flow

### 1. Initialization
```
Load dictionaries → Load whitelist → Load settings → Load reader settings → Setup listeners
```

### 2. File Upload
```
Select EPUB → Parse → Extract text → Analyze → Display results
```

### 3. Analysis
```
For each word:
  - Check if in custom dictionary → skip
  - Check if in whitelist → skip
  - Check if in English dictionary (if filter enabled) → skip
  - Apply enabled error checks
  - Group by word + error type
  - Store contexts
```

### 4. Filtering
```
Apply whitelist → Apply English filter → Re-render list → Update stats
```

---

## Technical Details

### Key Libraries/APIs Used
- **JSZip**: Parse EPUB (ZIP) files
- **DOMParser**: Parse XML/HTML
- **Tailwind CSS**: Styling (via CDN)
- **localStorage**: Persist whitelist, settings, reader preferences

### Regular Expressions
- Word extraction: `/[\p{L}\p{M}]+/gu`
- Unicode normalization: `normalize("NFC")`

### Helper Functions Needed
- `levenshteinDistance(a, b)`: Calculate edit distance
- `sanitizeFilename(name)`: Clean filename for export
- `getContext(text, index, length)`: Extract surrounding text
- `escapeHtml(text)`: Prevent XSS
- `findSuggestions(word)`: Generate correction suggestions
- `getErrorHighlights(type)`: Return color scheme for error type

### State Management
- Global state object tracking:
  - All detected errors
  - Filtered errors
  - Current selected group
  - Current instance index
  - Dictionary sets
  - Check settings
  - Reader settings
  - Book metadata

---

## Error States & Handling

### File Upload Errors
- Non-EPUB files rejected
- Missing container.xml throws error
- Parse errors show alert

### Dictionary Errors
- Fallback from local to remote
- Show error status in UI if all sources fail
- Allow operation with partial dictionaries

### Empty States
- No file selected: Upload prompt
- No errors found: Success message
- No context selected: Instruction message

---

## Performance Considerations
- Process large EPUBs in chunks
- Update progress every 5 chapters
- Use `requestAnimationFrame` for UI updates
- Debounce whitelist input changes
- Store only necessary context (120 chars total)

---

## Browser Compatibility
- Modern browsers with ES6+ support
- LocalStorage API
- Fetch API
- FileReader API
- Clipboard API (with fallback)

---

## Future Enhancement Ideas
- Batch processing multiple EPUBs
- Advanced filtering (by error type, frequency)
- Custom dictionary editor UI
- Undo/redo for whitelist changes
- Context editing capabilities
- More export formats (JSON, CSV)
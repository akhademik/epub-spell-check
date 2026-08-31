# Graph Report - .  (2026-08-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 328 nodes · 560 edges · 19 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a87c80b8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analysis-core.ts
- state.svelte.ts
- EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION
- AppStateModel
- biome.json
- devDependencies
- compilerOptions
- epub-parser.ts
- scripts
- utils/dictionary.ts
- 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)
- knip.json
- Soát lỗi chính tả EPUB (Tiếng Việt)

## God Nodes (most connected - your core abstractions)
1. `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` - 32 edges
2. `AppStateModel` - 28 edges
3. `Dictionaries` - 17 edges
4. `compilerOptions` - 14 edges
5. `scripts` - 14 edges
6. `CheckSettings` - 13 edges
7. `Logger` - 11 edges
8. `getErrorType()` - 9 edges
9. `saveStorage()` - 8 edges
10. `parseEpub()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `parseEpub()` --references--> `jszip`  [EXTRACTED]
  src/utils/epub-parser.ts → package.json
- `applyFixesAndRepack()` --references--> `jszip`  [EXTRACTED]
  src/utils/epub-writer.ts → package.json
- `AppState` --references--> `CheckSettings`  [EXTRACTED]
  src/types/state.ts → src/types/analysis.ts
- `AppState` --references--> `Dictionaries`  [EXTRACTED]
  src/types/state.ts → src/types/dictionary.ts
- `AppState` --references--> `DictionaryStatus`  [EXTRACTED]
  src/types/state.ts → src/types/dictionary.ts

## Import Cycles
- None detected.

## Communities (19 total, 0 thin omitted)

### Community 0 - "analysis-core.ts"
Cohesion: 0.16
Nodes (28): CheckSettings, Dictionaries, Dictionary, DictionaryStatus, IndexedDictionary, TextContentBlock, ErrorGroup, ErrorInstance (+20 more)

### Community 1 - "state.svelte.ts"
Cohesion: 0.07
Nodes (22): contextSegments, currentAppliedWord, customFixInput, isCurrentInstanceResolved, suggestions, CONTEXT_LENGTH_CHARS, EPUB_FILE_EXTENSION, FILE_SIZE_LIMIT_BYTES (+14 more)

### Community 2 - "EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION"
Cohesion: 0.05
Nodes (41): 10. PDF → EPUB USER FLOW, 11. EPUB EDITOR E2E, 12. EPUB CLEANER E2E, 13. EPUB VALIDATOR E2E, 14. IMAGE PROCESSING E2E, 15. WORKER TESTING, 16. REGRESSION TEST, 17. OUTPUT FILE VALIDATION (+33 more)

### Community 3 - "AppStateModel"
Cohesion: 0.13
Nodes (4): AppStateModel, sanitizeFilename(), saveStorage(), clearSuggestionCache()

### Community 4 - "biome.json"
Cohesion: 0.07
Nodes (27): noSvgWithoutTitle, source, assist, actions, files, includes, formatter, enabled (+19 more)

### Community 5 - "devDependencies"
Cohesion: 0.08
Nodes (25): autoprefixer, @biomejs/biome, jsdom, devDependencies, autoprefixer, @biomejs/biome, jsdom, knip (+17 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2022, src/**/*.d.ts, src/**/*.js, src/**/*.svelte, src/**/*.ts, compilerOptions (+15 more)

### Community 7 - "epub-parser.ts"
Cohesion: 0.18
Nodes (15): jszip, dependencies, jszip, BookMetadata, EpubContent, extractLeafTextElements(), LEAF_BLOCK_SELECTOR, parseEpub() (+7 more)

### Community 8 - "scripts"
Cohesion: 0.11
Nodes (18): name, private, scripts, build, check, dev, format, format:check (+10 more)

### Community 9 - "utils/dictionary.ts"
Cohesion: 0.22
Nodes (8): DICTIONARY_VERSION, fetchLocalDict(), getDictionary(), loadDictionaries(), getCache(), openDB(), setCache(), Logger

### Community 10 - "🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)"
Cohesion: 0.15
Nodes (12): 🔒 1. Quy tắc Quản lý Gói (Package Manager Rule), 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy), 🎯 3. Ma Trận Hướng Dẫn: "Sửa Gì - Chạy Test Gì?" (Test Decision Matrix), 🔄 4. Chu trình Chỉnh Sửa Code Chuẩn (Standard Quality Gate Flow), ⚡ 5. Bảng Tra Cứu Lệnh Nhanh (Cheat Sheet), Chi tiết các bước Quality Gates:, 📋 QUY TRÌNH PHÁT TRIỂN & HỆ THỐNG KIỂM THỬ (DEVELOPMENT & TESTING WORKFLOW), 🔹 Tầng 1: Smoke Tests (`pnpm test:smoke`) (+4 more)

### Community 11 - "knip.json"
Cohesion: 0.20
Nodes (10): entry, ignore, ignoreExportsUsedInFile, project, $schema, src/constants.ts, src/**/*.{ts,svelte}, src/types/state.ts (+2 more)

### Community 12 - "Soát lỗi chính tả EPUB (Tiếng Việt)"
Cohesion: 0.50
Nodes (3): Cấu trúc từ điển, Soát lỗi chính tả EPUB (Tiếng Việt), Tính năng chính

## Knowledge Gaps
- **138 isolated node(s):** `$schema`, `**/*`, `!dist`, `!graphify-out`, `!src/style.css` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `epub-parser.ts` to `scripts`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `$schema`, `**/*`, `!dist` to the rest of the system?**
  _138 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `state.svelte.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07084785133565621 - nodes in this community are weakly interconnected._
- **Should `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `AppStateModel` be split into smaller, more focused modules?**
  _Cohesion score 0.12903225806451613 - nodes in this community are weakly interconnected._
- **Should `biome.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
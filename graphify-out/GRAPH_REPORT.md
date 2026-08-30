# Graph Report - epub-spell-check  (2026-08-30)

## Corpus Check
- 48 files · ~42,407 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 296 nodes · 479 edges · 19 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0fe2eab1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- state.svelte.ts
- analysis-core.ts
- biome.json
- AppStateModel
- compilerOptions
- devDependencies
- scripts
- utils/dictionary.ts
- EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION
- 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)
- Soát lỗi chính tả EPUB (Tiếng Việt)
- knip.json

## God Nodes (most connected - your core abstractions)
1. `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` - 32 edges
2. `AppStateModel` - 23 edges
3. `Dictionaries` - 17 edges
4. `CheckSettings` - 15 edges
5. `scripts` - 14 edges
6. `compilerOptions` - 14 edges
7. `Logger` - 10 edges
8. `getErrorType()` - 9 edges
9. `saveStorage()` - 8 edges
10. `ErrorGroup` - 8 edges

## Surprising Connections (you probably didn't know these)
- `parseEpub()` --references--> `jszip`  [EXTRACTED]
  src/utils/epub-parser.ts → package.json
- `WorkerMessage` --references--> `TextContentBlock`  [EXTRACTED]
  src/workers/analysis.worker.ts → src/types/epub.ts
- `AppState` --references--> `CheckSettings`  [EXTRACTED]
  src/types/state.ts → src/types/analysis.ts
- `WorkerMessage` --references--> `CheckSettings`  [EXTRACTED]
  src/workers/analysis.worker.ts → src/types/analysis.ts
- `AppState` --references--> `Dictionaries`  [EXTRACTED]
  src/types/state.ts → src/types/dictionary.ts

## Import Cycles
- None detected.

## Communities (19 total, 0 thin omitted)

### Community 0 - "state.svelte.ts"
Cohesion: 0.08
Nodes (19): contextSegments, CONTEXT_LENGTH_CHARS, EPUB_FILE_EXTENSION, FILE_SIZE_LIMIT_BYTES, FILE_SIZE_LIMIT_MB, FONT_SIZE_MAX_REM, FONT_SIZE_MIN_REM, MAX_SUGGESTION_COUNT (+11 more)

### Community 1 - "analysis-core.ts"
Cohesion: 0.21
Nodes (21): CheckSettings, Dictionaries, Dictionary, DictionaryStatus, ErrorGroup, ErrorInstance, ErrorType, AppState (+13 more)

### Community 2 - "biome.json"
Cohesion: 0.07
Nodes (27): noSvgWithoutTitle, source, assist, actions, files, includes, formatter, enabled (+19 more)

### Community 3 - "AppStateModel"
Cohesion: 0.15
Nodes (3): AppStateModel, sanitizeFilename(), saveStorage()

### Community 4 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2022, src/**/*.d.ts, src/**/*.js, src/**/*.svelte, src/**/*.ts, compilerOptions (+15 more)

### Community 5 - "devDependencies"
Cohesion: 0.09
Nodes (23): autoprefixer, @biomejs/biome, devDependencies, autoprefixer, @biomejs/biome, knip, postcss, svelte (+15 more)

### Community 6 - "scripts"
Cohesion: 0.09
Nodes (22): jszip, dependencies, jszip, name, private, scripts, build, check (+14 more)

### Community 7 - "utils/dictionary.ts"
Cohesion: 0.17
Nodes (11): DICTIONARY_VERSION, BookMetadata, EpubContent, TextContentBlock, fetchLocalDict(), getDictionary(), loadDictionaries(), getCache() (+3 more)

### Community 8 - "EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION"
Cohesion: 0.05
Nodes (41): 10. PDF → EPUB USER FLOW, 11. EPUB EDITOR E2E, 12. EPUB CLEANER E2E, 13. EPUB VALIDATOR E2E, 14. IMAGE PROCESSING E2E, 15. WORKER TESTING, 16. REGRESSION TEST, 17. OUTPUT FILE VALIDATION (+33 more)

### Community 14 - "🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)"
Cohesion: 0.15
Nodes (12): 🔒 1. Quy tắc Quản lý Gói (Package Manager Rule), 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy), 🎯 3. Ma Trận Hướng Dẫn: "Sửa Gì - Chạy Test Gì?" (Test Decision Matrix), 🔄 4. Chu trình Chỉnh Sửa Code Chuẩn (Standard Quality Gate Flow), ⚡ 5. Bảng Tra Cứu Lệnh Nhanh (Cheat Sheet), Chi tiết các bước Quality Gates:, 📋 QUY TRÌNH PHÁT TRIỂN & HỆ THỐNG KIỂM THỬ (DEVELOPMENT & TESTING WORKFLOW), 🔹 Tầng 1: Smoke Tests (`pnpm test:smoke`) (+4 more)

### Community 15 - "Soát lỗi chính tả EPUB (Tiếng Việt)"
Cohesion: 0.50
Nodes (3): Cấu trúc từ điển, Soát lỗi chính tả EPUB (Tiếng Việt), Tính năng chính

### Community 18 - "knip.json"
Cohesion: 0.20
Nodes (10): entry, ignore, ignoreExportsUsedInFile, tests/**/*.ts, project, $schema, src/constants.ts, src/**/*.{ts,svelte} (+2 more)

## Knowledge Gaps
- **130 isolated node(s):** `$schema`, `**/*`, `!dist`, `!graphify-out`, `!src/style.css` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `parseEpub()` connect `scripts` to `state.svelte.ts`, `AppStateModel`, `utils/dictionary.ts`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **What connects `$schema`, `**/*`, `!dist` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `state.svelte.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._
- **Should `biome.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
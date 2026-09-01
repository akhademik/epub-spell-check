# Graph Report - epub-spell-check  (2026-09-01)

## Corpus Check
- 57 files · ~56,800 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 353 nodes · 601 edges · 22 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5b91292`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyzer.ts
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
- merge-dicts.ts
- MERGE_DICTS_WORKFLOW.md

## God Nodes (most connected - your core abstractions)
1. `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` - 32 edges
2. `AppStateModel` - 28 edges
3. `Dictionaries` - 17 edges
4. `CheckSettings` - 15 edges
5. `scripts` - 14 edges
6. `compilerOptions` - 14 edges
7. `Logger` - 11 edges
8. `ErrorInstance` - 10 edges
9. `ErrorGroup` - 9 edges
10. `getErrorType()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `parseEpub()` --references--> `jszip`  [EXTRACTED]
  src/utils/epub-parser.ts → package.json
- `applyFixesAndRepack()` --references--> `jszip`  [EXTRACTED]
  src/utils/epub-writer.ts → package.json
- `AppState` --references--> `CheckSettings`  [EXTRACTED]
  src/types/state.ts → src/types/analysis.ts
- `WorkerMessage` --references--> `CheckSettings`  [EXTRACTED]
  src/workers/analysis.worker.ts → src/types/analysis.ts
- `AppState` --references--> `Dictionaries`  [EXTRACTED]
  src/types/state.ts → src/types/dictionary.ts

## Import Cycles
- None detected.

## Communities (22 total, 0 thin omitted)

### Community 0 - "analyzer.ts"
Cohesion: 0.15
Nodes (28): CheckSettings, Dictionaries, Dictionary, DictionaryStatus, TextContentBlock, ErrorGroup, ErrorType, TieredSuggestions (+20 more)

### Community 1 - "state.svelte.ts"
Cohesion: 0.06
Nodes (25): contextSegments, currentAppliedWord, customFixInput, isCurrentInstanceResolved, tieredSuggestions, CONTEXT_LENGTH_CHARS, EPUB_FILE_EXTENSION, FILE_SIZE_LIMIT_BYTES (+17 more)

### Community 2 - "EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION"
Cohesion: 0.05
Nodes (41): 10. PDF → EPUB USER FLOW, 11. EPUB EDITOR E2E, 12. EPUB CLEANER E2E, 13. EPUB VALIDATOR E2E, 14. IMAGE PROCESSING E2E, 15. WORKER TESTING, 16. REGRESSION TEST, 17. OUTPUT FILE VALIDATION (+33 more)

### Community 3 - "AppStateModel"
Cohesion: 0.12
Nodes (6): WHITELIST_FILE_EXTENSIONS, AppStateModel, sanitizeFilename(), saveStorage(), ErrorInstance, clearSuggestionCache()

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
Cohesion: 0.20
Nodes (9): DICTIONARY_VERSION, IndexedDictionary, fetchLocalDict(), getDictionary(), loadDictionaries(), getCache(), openDB(), setCache() (+1 more)

### Community 10 - "🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)"
Cohesion: 0.15
Nodes (12): 🔒 1. Quy tắc Quản lý Gói (Package Manager Rule), 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy), 🎯 3. Ma Trận Hướng Dẫn: "Sửa Gì - Chạy Test Gì?" (Test Decision Matrix), 🔄 4. Chu trình Chỉnh Sửa Code Chuẩn (Standard Quality Gate Flow), ⚡ 5. Bảng Tra Cứu Lệnh Nhanh (Cheat Sheet), Chi tiết các bước Quality Gates:, 📋 QUY TRÌNH PHÁT TRIỂN & HỆ THỐNG KIỂM THỬ (DEVELOPMENT & TESTING WORKFLOW), 🔹 Tầng 1: Smoke Tests (`pnpm test:smoke`) (+4 more)

### Community 11 - "knip.json"
Cohesion: 0.20
Nodes (10): entry, ignore, ignoreExportsUsedInFile, tests/**/*.ts, project, $schema, src/constants.ts, src/**/*.{ts,svelte} (+2 more)

### Community 12 - "Soát lỗi chính tả EPUB (Tiếng Việt)"
Cohesion: 0.40
Nodes (4): Cấu trúc từ điển (`public/`), Phát triển & Kiểm thử, Soát lỗi chính tả EPUB (Tiếng Việt), Tính năng chính

### Community 19 - "merge-dicts.ts"
Cohesion: 0.36
Nodes (8): deduplicateAndSort(), formatMergeStats(), mergeDictFiles(), MergeStats, mergeWords(), parseDictMarkdown(), SECTION_TO_FILE, SectionMap

### Community 20 - "MERGE_DICTS_WORKFLOW.md"
Cohesion: 0.29
Nodes (6): 1. Công cụ tiện ích tự động (Automated Script), 2. Quy tắc xử lý chi tiết (Implementation Rules), 3. Báo cáo sau khi xử lý xong, 4. Commit, Các bước thực thi:, Lệnh chạy:

## Knowledge Gaps
- **148 isolated node(s):** `$schema`, `**/*`, `!dist`, `!graphify-out`, `!src/style.css` (+143 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `epub-parser.ts` to `scripts`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `$schema`, `**/*`, `!dist` to the rest of the system?**
  _148 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `state.svelte.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06363636363636363 - nodes in this community are weakly interconnected._
- **Should `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `AppStateModel` be split into smaller, more focused modules?**
  _Cohesion score 0.12298387096774194 - nodes in this community are weakly interconnected._
- **Should `biome.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
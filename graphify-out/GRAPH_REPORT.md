# Graph Report - epub-spell-check  (2026-09-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 420 nodes · 722 edges · 27 communities (18 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2736cb5e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- state.svelte.ts
- EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION
- constants.ts
- AppStateModel
- biome.json
- App.svelte
- devDependencies
- epub-parser.ts
- compilerOptions
- scripts
- merge-dicts.ts
- [name].ts
- 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)
- utils/dictionary.ts
- knip.json
- auth-status.ts
- MERGE_DICTS_WORKFLOW.md
- AnalysisWorkerManager
- Soát lỗi chính tả EPUB (Tiếng Việt)
- login.ts
- seed-kv.sh

## God Nodes (most connected - your core abstractions)
1. `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` - 32 edges
2. `AppStateModel` - 29 edges
3. `Dictionaries` - 17 edges
4. `CheckSettings` - 14 edges
5. `compilerOptions` - 14 edges
6. `scripts` - 14 edges
7. `ErrorInstance` - 12 edges
8. `Logger` - 12 edges
9. `ErrorGroup` - 9 edges
10. `getErrorType()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `applyFixesAndRepack()` --references--> `jszip`  [EXTRACTED]
  src/utils/epub-writer.ts → package.json
- `tieredSuggestions` --calls--> `findTieredSuggestions()`  [EXTRACTED]
  src/components/ContextView.svelte → src/utils/analyzer.ts
- `AppState` --references--> `CheckSettings`  [EXTRACTED]
  src/types/state.ts → src/types/analysis.ts
- `AppState` --references--> `Dictionaries`  [EXTRACTED]
  src/types/state.ts → src/types/dictionary.ts
- `AppState` --references--> `DictionaryStatus`  [EXTRACTED]
  src/types/state.ts → src/types/dictionary.ts

## Import Cycles
- None detected.

## Communities (27 total, 3 thin omitted)

### Community 0 - "state.svelte.ts"
Cohesion: 0.12
Nodes (37): appState, PersistedContainer, STORAGE_KEYS, CheckSettings, Dictionaries, Dictionary, DictionaryStatus, BookMetadata (+29 more)

### Community 1 - "EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION"
Cohesion: 0.05
Nodes (41): 10. PDF → EPUB USER FLOW, 11. EPUB EDITOR E2E, 12. EPUB CLEANER E2E, 13. EPUB VALIDATOR E2E, 14. IMAGE PROCESSING E2E, 15. WORKER TESTING, 16. REGRESSION TEST, 17. OUTPUT FILE VALIDATION (+33 more)

### Community 2 - "constants.ts"
Cohesion: 0.07
Nodes (24): contextSegments, currentAppliedWord, customFixInput, isCurrentInstanceResolved, isTitleCase(), isUpperCase(), tieredSuggestions, CONTEXT_LENGTH_CHARS (+16 more)

### Community 3 - "AppStateModel"
Cohesion: 0.13
Nodes (3): AppStateModel, sanitizeFilename(), saveStorage()

### Community 4 - "biome.json"
Cohesion: 0.07
Nodes (27): noSvgWithoutTitle, source, assist, actions, files, includes, formatter, enabled (+19 more)

### Community 5 - "App.svelte"
Cohesion: 0.09
Nodes (12): AuthStatusResponse, DictDetailResponse, DictSourceName, DictUpdateResult, updateDictionaryWords(), isRepeatedUnit(), parseSectionedText(), SectionParsedWords (+4 more)

### Community 6 - "devDependencies"
Cohesion: 0.08
Nodes (25): autoprefixer, @biomejs/biome, jsdom, devDependencies, autoprefixer, @biomejs/biome, jsdom, knip (+17 more)

### Community 7 - "epub-parser.ts"
Cohesion: 0.16
Nodes (12): EpubContent, extractLeafTextElements(), LEAF_BLOCK_SELECTOR, parseEpub(), parseHtmlOrXml(), applyFixesAndRepack(), applyFixesToDocument(), FixInstruction (+4 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2022, src/**/*.d.ts, src/**/*.js, src/**/*.svelte, src/**/*.ts, compilerOptions (+15 more)

### Community 9 - "scripts"
Cohesion: 0.09
Nodes (21): jszip, dependencies, jszip, name, private, scripts, build, check (+13 more)

### Community 10 - "merge-dicts.ts"
Cohesion: 0.21
Nodes (13): deduplicateAndSort(), formatMergeStats(), mergeDictFiles(), MergeStats, mergeWords(), parseDictMarkdown(), repeatedUnitSpan(), SECTION_TO_FILE (+5 more)

### Community 11 - "[name].ts"
Cohesion: 0.29
Nodes (11): ALLOWED_NAMES, contentKey(), Env, isAuthenticated(), jsonResponse(), KVNamespace, onRequestGet(), onRequestPost() (+3 more)

### Community 12 - "🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)"
Cohesion: 0.15
Nodes (12): 🔒 1. Quy tắc Quản lý Gói (Package Manager Rule), 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy), 🎯 3. Ma Trận Hướng Dẫn: "Sửa Gì - Chạy Test Gì?" (Test Decision Matrix), 🔄 4. Chu trình Chỉnh Sửa Code Chuẩn (Standard Quality Gate Flow), ⚡ 5. Bảng Tra Cứu Lệnh Nhanh (Cheat Sheet), Chi tiết các bước Quality Gates:, 📋 QUY TRÌNH PHÁT TRIỂN & HỆ THỐNG KIỂM THỬ (DEVELOPMENT & TESTING WORKFLOW), 🔹 Tầng 1: Smoke Tests (`pnpm test:smoke`) (+4 more)

### Community 13 - "utils/dictionary.ts"
Cohesion: 0.35
Nodes (10): IndexedDictionary, dictCacheKey(), fetchDictContent(), fetchLocalDict(), getDictionary(), loadDictionaries(), refreshDictionaryCache(), getCache() (+2 more)

### Community 14 - "knip.json"
Cohesion: 0.20
Nodes (10): entry, ignore, ignoreExportsUsedInFile, tests/**/*.ts, project, $schema, src/constants.ts, src/**/*.{ts,svelte} (+2 more)

### Community 15 - "auth-status.ts"
Cohesion: 0.32
Nodes (5): Env, jsonResponse(), KVNamespace, onRequestGet(), RequestContext

### Community 16 - "MERGE_DICTS_WORKFLOW.md"
Cohesion: 0.25
Nodes (7): 0. Ở bước phân loại trước đó (`*-corrected-dict.md`), 1. Công cụ tiện ích tự động (Automated Script), 2. Quy tắc xử lý chi tiết (Implementation Rules), 3. Báo cáo sau khi xử lý xong, 4. Commit, Các bước thực thi:, Lệnh chạy:

### Community 18 - "Soát lỗi chính tả EPUB (Tiếng Việt)"
Cohesion: 0.40
Nodes (4): Cấu trúc từ điển (`public/`), Phát triển & Kiểm thử, Soát lỗi chính tả EPUB (Tiếng Việt), Tính năng chính

## Knowledge Gaps
- **165 isolated node(s):** `Dictionary`, `PersistedContainer`, `AnalysisProgressCallback`, `WorkerMessage`, `MergeStats` (+160 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 190 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `applyFixesAndRepack()` connect `epub-parser.ts` to `state.svelte.ts`, `scripts`, `AppStateModel`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `jszip` connect `scripts` to `epub-parser.ts`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **What connects `Dictionary`, `PersistedContainer`, `AnalysisProgressCallback` to the rest of the system?**
  _165 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `state.svelte.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11883116883116883 - nodes in this community are weakly interconnected._
- **Should `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06854838709677419 - nodes in this community are weakly interconnected._
- **Should `AppStateModel` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
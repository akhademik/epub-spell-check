# Graph Report - epub-spell-check  (2026-09-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 492 nodes · 847 edges · 34 communities (24 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a307f69`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyzer.ts
- EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION
- dict-quality.ts
- AppStateModel
- devDependencies
- biome.json
- scripts
- compilerOptions
- epub-parser.ts
- constants.ts
- utils/dictionary.ts
- merge-dicts.ts
- state.svelte.ts
- [name].ts
- audit.ts
- 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)
- dict-admin.ts
- knip.json
- DictAuditPanel.svelte
- ContextView.svelte
- auth-status.ts
- MERGE_DICTS_WORKFLOW.md
- pull-dicts-from-kv.ts
- AnalysisWorkerManager
- Soát lỗi chính tả EPUB (Tiếng Việt)
- login.ts
- seed-kv.sh

## God Nodes (most connected - your core abstractions)
1. `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` - 32 edges
2. `AppStateModel` - 31 edges
3. `Dictionaries` - 17 edges
4. `scripts` - 17 edges
5. `CheckSettings` - 14 edges
6. `compilerOptions` - 14 edges
7. `Logger` - 12 edges
8. `saveStorage()` - 10 edges
9. `ErrorInstance` - 9 edges
10. `getErrorType()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `applyFixesAndRepack()` --references--> `jszip`  [EXTRACTED]
  src/utils/epub-writer.ts → package.json
- `CliOptions` --references--> `DictName`  [EXTRACTED]
  scripts/clean-dicts.ts → src/utils/dict-quality.ts
- `main()` --calls--> `auditDictionary()`  [EXTRACTED]
  scripts/clean-dicts.ts → src/utils/dict-quality.ts
- `detectFuzzyDuplicates()` --calls--> `getBaseWord()`  [EXTRACTED]
  src/utils/dict-quality.ts → src/utils/analysis-core.ts
- `detectFuzzyDuplicates()` --calls--> `levenshteinDistance()`  [EXTRACTED]
  src/utils/dict-quality.ts → src/utils/analysis-core.ts

## Import Cycles
- None detected.

## Communities (34 total, 3 thin omitted)

### Community 0 - "analyzer.ts"
Cohesion: 0.13
Nodes (33): CheckSettings, Dictionaries, Dictionary, DictionaryStatus, IndexedDictionary, TextContentBlock, ErrorGroup, ErrorInstance (+25 more)

### Community 1 - "EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION"
Cohesion: 0.05
Nodes (41): 10. PDF → EPUB USER FLOW, 11. EPUB EDITOR E2E, 12. EPUB CLEANER E2E, 13. EPUB VALIDATOR E2E, 14. IMAGE PROCESSING E2E, 15. WORKER TESTING, 16. REGRESSION TEST, 17. OUTPUT FILE VALIDATION (+33 more)

### Community 2 - "dict-quality.ts"
Cohesion: 0.12
Nodes (29): ALL_DICTS, backupAndWrite(), CliOptions, DICT_TO_FILE, getNamespaceIdFromWrangler(), main(), parseArgs(), readDictContent() (+21 more)

### Community 3 - "AppStateModel"
Cohesion: 0.12
Nodes (3): AppStateModel, sanitizeFilename(), saveStorage()

### Community 4 - "devDependencies"
Cohesion: 0.07
Nodes (29): autoprefixer, @biomejs/biome, jsdom, knip, devDependencies, autoprefixer, @biomejs/biome, jsdom (+21 more)

### Community 5 - "biome.json"
Cohesion: 0.07
Nodes (27): noSvgWithoutTitle, source, assist, actions, files, includes, formatter, enabled (+19 more)

### Community 6 - "scripts"
Cohesion: 0.07
Nodes (26): jszip, dependencies, jszip, name, private, scripts, build, check (+18 more)

### Community 7 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2022, src/**/*.d.ts, src/**/*.js, src/**/*.svelte, src/**/*.ts, compilerOptions (+15 more)

### Community 8 - "epub-parser.ts"
Cohesion: 0.22
Nodes (12): BookMetadata, EpubContent, extractLeafTextElements(), LEAF_BLOCK_SELECTOR, parseEpub(), parseHtmlOrXml(), applyFixesAndRepack(), applyFixesToDocument() (+4 more)

### Community 9 - "constants.ts"
Cohesion: 0.11
Nodes (17): CONTEXT_LENGTH_CHARS, DICTIONARY_VERSION, EPUB_FILE_EXTENSION, FILE_SIZE_LIMIT_BYTES, FILE_SIZE_LIMIT_MB, FONT_SIZE_MAX_REM, FONT_SIZE_MIN_REM, MAX_PRIMARY_SUGGESTION_COUNT (+9 more)

### Community 10 - "utils/dictionary.ts"
Cohesion: 0.22
Nodes (10): dictCacheKey(), fetchDictContent(), fetchLocalDict(), getDictionary(), loadDictionaries(), refreshDictionaryCache(), getCache(), openDB() (+2 more)

### Community 11 - "merge-dicts.ts"
Cohesion: 0.21
Nodes (13): deduplicateAndSort(), formatMergeStats(), mergeDictFiles(), MergeStats, mergeWords(), parseDictMarkdown(), repeatedUnitSpan(), SECTION_TO_FILE (+5 more)

### Community 12 - "state.svelte.ts"
Cohesion: 0.18
Nodes (6): ALL_ERROR_TYPES, appState, PersistedContainer, STORAGE_KEYS, ReaderSettings, ToastNotification

### Community 13 - "[name].ts"
Cohesion: 0.29
Nodes (11): ALLOWED_NAMES, contentKey(), Env, isAuthenticated(), jsonResponse(), KVNamespace, onRequestGet(), onRequestPost() (+3 more)

### Community 14 - "audit.ts"
Cohesion: 0.29
Nodes (11): ALLOWED_NAMES, contentKey(), Env, ignoredPairsKey(), isAuthenticated(), jsonResponse(), KVNamespace, onRequestGet() (+3 more)

### Community 15 - "🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)"
Cohesion: 0.15
Nodes (12): 🔒 1. Quy tắc Quản lý Gói (Package Manager Rule), 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy), 🎯 3. Ma Trận Hướng Dẫn: "Sửa Gì - Chạy Test Gì?" (Test Decision Matrix), 🔄 4. Chu trình Chỉnh Sửa Code Chuẩn (Standard Quality Gate Flow), ⚡ 5. Bảng Tra Cứu Lệnh Nhanh (Cheat Sheet), Chi tiết các bước Quality Gates:, 📋 QUY TRÌNH PHÁT TRIỂN & HỆ THỐNG KIỂM THỬ (DEVELOPMENT & TESTING WORKFLOW), 🔹 Tầng 1: Smoke Tests (`pnpm test:smoke`) (+4 more)

### Community 16 - "dict-admin.ts"
Cohesion: 0.20
Nodes (8): AuthStatusResponse, DictAuditResponse, DictDetailResponse, DictSourceName, DictUpdateResult, fetchDictionaryAudit(), fetchDictionaryDetails(), updateDictionaryWords()

### Community 17 - "knip.json"
Cohesion: 0.20
Nodes (10): entry, ignore, ignoreExportsUsedInFile, tests/**/*.ts, project, $schema, src/constants.ts, src/**/*.{ts,svelte} (+2 more)

### Community 18 - "DictAuditPanel.svelte"
Cohesion: 0.22
Nodes (8): activeClusters, handleDeleteSingleWord(), handleDeleteTierA(), handleIgnoreCluster(), runAudit(), tierAFindings, tierBFindings, ignoreDuplicatePair()

### Community 19 - "ContextView.svelte"
Cohesion: 0.28
Nodes (7): contextSegments, currentAppliedWord, customFixInput, isCurrentInstanceResolved, isTitleCase(), isUpperCase(), tieredSuggestions

### Community 20 - "auth-status.ts"
Cohesion: 0.32
Nodes (5): Env, jsonResponse(), KVNamespace, onRequestGet(), RequestContext

### Community 21 - "MERGE_DICTS_WORKFLOW.md"
Cohesion: 0.25
Nodes (7): 0. Ở bước phân loại trước đó (`*-corrected-dict.md`), 1. Công cụ tiện ích tự động (Automated Script), 2. Quy tắc xử lý chi tiết (Implementation Rules), 3. Báo cáo sau khi xử lý xong, 4. Commit, Các bước thực thi:, Lệnh chạy:

### Community 22 - "pull-dicts-from-kv.ts"
Cohesion: 0.33
Nodes (6): ALL_DICTS, DICT_TO_FILE, DictName, getNamespaceId(), main(), IMPORTANT: Non-blocking design! If network or credentials fail,

### Community 24 - "Soát lỗi chính tả EPUB (Tiếng Việt)"
Cohesion: 0.40
Nodes (4): Cấu trúc từ điển (`public/`), Phát triển & Kiểm thử, Soát lỗi chính tả EPUB (Tiếng Việt), Tính năng chính

## Knowledge Gaps
- **190 isolated node(s):** `Dictionary`, `AnalysisProgressCallback`, `WorkerMessage`, `MergeStats`, `SectionMap` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 218 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `applyFixesAndRepack()` connect `epub-parser.ts` to `AppStateModel`, `state.svelte.ts`, `scripts`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `jszip` connect `scripts` to `epub-parser.ts`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `Dictionary`, `AnalysisProgressCallback`, `WorkerMessage` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyzer.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12979591836734694 - nodes in this community are weakly interconnected._
- **Should `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
- **Should `dict-quality.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11586452762923351 - nodes in this community are weakly interconnected._
- **Should `AppStateModel` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
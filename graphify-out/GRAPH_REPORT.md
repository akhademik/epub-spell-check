# Graph Report - epub-spell-check  (2026-09-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 543 nodes · 960 edges · 28 communities (21 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a63477ff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyzer.ts
- dict-quality.ts
- state.svelte.ts
- EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION
- AppStateModel
- devDependencies
- biome.json
- scripts
- compilerOptions
- epub-parser.ts
- utils/dictionary.ts
- audit.ts
- merge-dicts.ts
- CrossDictAuditPanel.svelte
- DictAuditPanel.svelte
- [name].ts
- 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)
- knip.json
- auth-status.ts
- pull-dicts-from-kv.ts
- Soát lỗi chính tả EPUB (Tiếng Việt)
- login.ts
- seed-kv.sh

## God Nodes (most connected - your core abstractions)
1. `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` - 32 edges
2. `AppStateModel` - 31 edges
3. `Dictionaries` - 18 edges
4. `scripts` - 18 edges
5. `CheckSettings` - 14 edges
6. `compilerOptions` - 14 edges
7. `Logger` - 12 edges
8. `onRequestGet()` - 12 edges
9. `auditDictionary()` - 11 edges
10. `ErrorInstance` - 10 edges

## Surprising Connections (you probably didn't know these)
- `CliOptions` --references--> `DictName`  [EXTRACTED]
  scripts/clean-dicts.ts → src/utils/dict-quality.ts
- `onRequestGet()` --calls--> `auditDictionary()`  [EXTRACTED]
  functions/api/dict/[name]/audit.ts → src/utils/dict-quality.ts
- `applyFixesAndRepack()` --references--> `jszip`  [EXTRACTED]
  src/utils/epub-writer.ts → package.json
- `main()` --calls--> `auditDictionary()`  [EXTRACTED]
  scripts/clean-dicts.ts → src/utils/dict-quality.ts
- `scanDictionaryCrossReference()` --calls--> `getAlternateToneStyle()`  [EXTRACTED]
  src/utils/dict-quality.ts → src/utils/analysis-core.ts

## Import Cycles
- None detected.

## Communities (28 total, 2 thin omitted)

### Community 0 - "analyzer.ts"
Cohesion: 0.08
Nodes (45): MAX_PRIMARY_SUGGESTION_COUNT, MAX_SECONDARY_SUGGESTION_COUNT, MAX_SUGGESTION_COUNT, CheckSettings, Dictionaries, Dictionary, DictionaryStatus, TextContentBlock (+37 more)

### Community 1 - "dict-quality.ts"
Cohesion: 0.06
Nodes (50): ALL_DICTS, backupAndWrite(), CliOptions, DICT_TO_FILE, getNamespaceIdFromWrangler(), main(), parseArgs(), readDictContent() (+42 more)

### Community 2 - "state.svelte.ts"
Cohesion: 0.06
Nodes (27): contextSegments, currentAppliedWord, customFixInput, isCurrentInstanceResolved, isTitleCase(), isUpperCase(), tieredSuggestions, CONTEXT_LENGTH_CHARS (+19 more)

### Community 3 - "EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION"
Cohesion: 0.05
Nodes (41): 10. PDF → EPUB USER FLOW, 11. EPUB EDITOR E2E, 12. EPUB CLEANER E2E, 13. EPUB VALIDATOR E2E, 14. IMAGE PROCESSING E2E, 15. WORKER TESTING, 16. REGRESSION TEST, 17. OUTPUT FILE VALIDATION (+33 more)

### Community 4 - "AppStateModel"
Cohesion: 0.12
Nodes (3): AppStateModel, sanitizeFilename(), saveStorage()

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (29): autoprefixer, @biomejs/biome, jsdom, knip, devDependencies, autoprefixer, @biomejs/biome, jsdom (+21 more)

### Community 6 - "biome.json"
Cohesion: 0.07
Nodes (27): noSvgWithoutTitle, source, assist, actions, files, includes, formatter, enabled (+19 more)

### Community 7 - "scripts"
Cohesion: 0.07
Nodes (27): jszip, dependencies, jszip, name, private, scripts, build, check (+19 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2022, src/**/*.d.ts, src/**/*.js, src/**/*.svelte, src/**/*.ts, compilerOptions (+15 more)

### Community 9 - "epub-parser.ts"
Cohesion: 0.18
Nodes (15): BookMetadata, EpubContent, extractLeafTextElements(), LEAF_BLOCK_SELECTOR, parseEpub(), parseHtmlOrXml(), applyFixesAndRepack(), applyFixesToDocument() (+7 more)

### Community 10 - "utils/dictionary.ts"
Cohesion: 0.18
Nodes (12): DICTIONARY_VERSION, IndexedDictionary, dictCacheKey(), fetchDictContent(), fetchLocalDict(), getDictionary(), loadDictionaries(), refreshDictionaryCache() (+4 more)

### Community 11 - "audit.ts"
Cohesion: 0.24
Nodes (14): ALLOWED_NAMES, auditCacheKey(), auditVersionKey(), contentKey(), Env, ignoredPairsKey(), isAuthenticated(), jsonResponse() (+6 more)

### Community 12 - "merge-dicts.ts"
Cohesion: 0.21
Nodes (13): deduplicateAndSort(), formatMergeStats(), mergeDictFiles(), MergeStats, mergeWords(), parseDictMarkdown(), repeatedUnitSpan(), SECTION_TO_FILE (+5 more)

### Community 13 - "CrossDictAuditPanel.svelte"
Cohesion: 0.12
Nodes (4): handleSyncCrossDeletions(), runCrossAudit(), totalStagedCount, visibleFindings

### Community 14 - "DictAuditPanel.svelte"
Cohesion: 0.14
Nodes (6): activeClusters, handleSyncToCloudflare(), runAudit(), tierAFindings, tierBFindings, tierCFindings

### Community 15 - "[name].ts"
Cohesion: 0.29
Nodes (11): ALLOWED_NAMES, contentKey(), Env, isAuthenticated(), jsonResponse(), KVNamespace, onRequestGet(), onRequestPost() (+3 more)

### Community 16 - "🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy)"
Cohesion: 0.15
Nodes (12): 🔒 1. Quy tắc Quản lý Gói (Package Manager Rule), 🧱 2. Kiến trúc Hệ Thống Kiểm Thử 4 Tầng (4-Tier Testing Strategy), 🎯 3. Ma Trận Hướng Dẫn: "Sửa Gì - Chạy Test Gì?" (Test Decision Matrix), 🔄 4. Chu trình Chỉnh Sửa Code Chuẩn (Standard Quality Gate Flow), ⚡ 5. Bảng Tra Cứu Lệnh Nhanh (Cheat Sheet), Chi tiết các bước Quality Gates:, 📋 QUY TRÌNH PHÁT TRIỂN & HỆ THỐNG KIỂM THỬ (DEVELOPMENT & TESTING WORKFLOW), 🔹 Tầng 1: Smoke Tests (`pnpm test:smoke`) (+4 more)

### Community 17 - "knip.json"
Cohesion: 0.20
Nodes (10): entry, ignore, ignoreExportsUsedInFile, tests/**/*.ts, project, $schema, src/constants.ts, src/**/*.{ts,svelte} (+2 more)

### Community 18 - "auth-status.ts"
Cohesion: 0.32
Nodes (5): Env, jsonResponse(), KVNamespace, onRequestGet(), RequestContext

### Community 19 - "pull-dicts-from-kv.ts"
Cohesion: 0.33
Nodes (6): ALL_DICTS, DICT_TO_FILE, DictName, getNamespaceId(), main(), IMPORTANT: Non-blocking design! If network or credentials fail,

### Community 20 - "Soát lỗi chính tả EPUB (Tiếng Việt)"
Cohesion: 0.40
Nodes (4): Cấu trúc từ điển (`public/`), Phát triển & Kiểm thử, Soát lỗi chính tả EPUB (Tiếng Việt), Tính năng chính

## Knowledge Gaps
- **196 isolated node(s):** `Dictionary`, `ConfusableRule`, `AnalysisProgressCallback`, `WorkerMessage`, `AuthStatusResponse` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 242 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `applyFixesAndRepack()` connect `epub-parser.ts` to `state.svelte.ts`, `AppStateModel`, `scripts`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `jszip` connect `scripts` to `epub-parser.ts`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **What connects `Dictionary`, `ConfusableRule`, `AnalysisProgressCallback` to the rest of the system?**
  _196 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyzer.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08296751536435469 - nodes in this community are weakly interconnected._
- **Should `dict-quality.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061016949152542375 - nodes in this community are weakly interconnected._
- **Should `state.svelte.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05957767722473605 - nodes in this community are weakly interconnected._
- **Should `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
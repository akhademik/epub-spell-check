# Graph Report - epub-spell-check  (2026-10-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 543 nodes · 1001 edges · 28 communities (21 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `55ba3dbb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dict-quality.ts
- state.svelte.ts
- analysis-core.ts
- EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION
- package.json
- AppStateModel
- biome.json
- epub-parser.ts
- compilerOptions
- utils/dictionary.ts
- audit.ts
- merge-dicts.ts
- CrossDictAuditPanel.svelte
- devDependencies
- DictAuditPanel.svelte
- [name].ts
- knip.json
- pull-dicts-from-kv.ts
- auth-status.ts
- login.ts
- AnalysisWorkerManager
- Soát lỗi chính tả EPUB (Tiếng Việt)
- seed-kv.sh

## God Nodes (most connected - your core abstractions)
1. `AppStateModel` - 34 edges
2. `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` - 32 edges
3. `Dictionaries` - 19 edges
4. `scripts` - 18 edges
5. `CheckSettings` - 15 edges
6. `compilerOptions` - 14 edges
7. `ErrorInstance` - 13 edges
8. `Logger` - 12 edges
9. `auditDictionary()` - 12 edges
10. `onRequestGet()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `CliOptions` --references--> `DictName`  [EXTRACTED]
  scripts/clean-dicts.ts → src/utils/dict-quality.ts
- `onRequestGet()` --calls--> `auditDictionary()`  [EXTRACTED]
  functions/api/dict/[name]/audit.ts → src/utils/dict-quality.ts
- `main()` --calls--> `auditDictionary()`  [EXTRACTED]
  scripts/clean-dicts.ts → src/utils/dict-quality.ts
- `includes` --extends--> `svelte`  [EXTRACTED]
  biome.json → package.json
- `findTieredSuggestions()` --calls--> `getBundledReferenceDictionarySync()`  [EXTRACTED]
  src/utils/analyzer.ts → src/utils/reference-dict.ts

## Import Cycles
- None detected.

## Communities (28 total, 7 thin omitted)

### Community 0 - "dict-quality.ts"
Cohesion: 0.06
Nodes (51): ALL_DICTS, backupAndWrite(), CliOptions, DICT_TO_FILE, getNamespaceIdFromWrangler(), main(), parseArgs(), readDictContent() (+43 more)

### Community 1 - "state.svelte.ts"
Cohesion: 0.05
Nodes (42): contextSegments, currentAppliedWord, customFixInput, isCurrentInstanceResolved, isTitleCase(), isUpperCase(), tieredSuggestions, CONTEXT_LENGTH_CHARS (+34 more)

### Community 2 - "analysis-core.ts"
Cohesion: 0.12
Nodes (33): vitest, CheckSettings, Dictionaries, Dictionary, DictionaryStatus, TextContentBlock, ErrorGroup, ErrorInstance (+25 more)

### Community 3 - "EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION"
Cohesion: 0.05
Nodes (41): 10. PDF → EPUB USER FLOW, 11. EPUB EDITOR E2E, 12. EPUB CLEANER E2E, 13. EPUB VALIDATOR E2E, 14. IMAGE PROCESSING E2E, 15. WORKER TESTING, 16. REGRESSION TEST, 17. OUTPUT FILE VALIDATION (+33 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (38): dependencies, jszip, name, private, scripts, build, check, dev (+30 more)

### Community 5 - "AppStateModel"
Cohesion: 0.11
Nodes (5): AppStateModel, sanitizeFilename(), saveStorage(), DictSourceName, updateDictionaryWords()

### Community 6 - "biome.json"
Cohesion: 0.07
Nodes (27): noSvgWithoutTitle, source, assist, actions, files, includes, formatter, enabled (+19 more)

### Community 7 - "epub-parser.ts"
Cohesion: 0.17
Nodes (17): jszip, BookMetadata, EpubContent, extractLeafTextElements(), LEAF_BLOCK_SELECTOR, parseEpub(), parseHtmlOrXml(), applyFixesAndRepack() (+9 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2022, src/**/*.d.ts, src/**/*.js, src/**/*.svelte, src/**/*.ts, compilerOptions (+15 more)

### Community 9 - "utils/dictionary.ts"
Cohesion: 0.18
Nodes (12): DICTIONARY_VERSION, IndexedDictionary, dictCacheKey(), fetchDictContent(), fetchLocalDict(), getDictionary(), loadDictionaries(), refreshDictionaryCache() (+4 more)

### Community 10 - "audit.ts"
Cohesion: 0.24
Nodes (14): ALLOWED_NAMES, auditCacheKey(), auditVersionKey(), contentKey(), Env, ignoredPairsKey(), isAuthenticated(), jsonResponse() (+6 more)

### Community 11 - "merge-dicts.ts"
Cohesion: 0.21
Nodes (13): deduplicateAndSort(), formatMergeStats(), mergeDictFiles(), MergeStats, mergeWords(), parseDictMarkdown(), repeatedUnitSpan(), SECTION_TO_FILE (+5 more)

### Community 12 - "CrossDictAuditPanel.svelte"
Cohesion: 0.12
Nodes (4): handleSyncCrossDeletions(), runCrossAudit(), totalStagedCount, visibleFindings

### Community 13 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, @biomejs/biome, jsdom, knip, postcss, simple-git-hooks, svelte (+7 more)

### Community 14 - "DictAuditPanel.svelte"
Cohesion: 0.14
Nodes (6): activeClusters, handleSyncToCloudflare(), runAudit(), tierAFindings, tierBFindings, tierCFindings

### Community 15 - "[name].ts"
Cohesion: 0.29
Nodes (11): ALLOWED_NAMES, contentKey(), Env, isAuthenticated(), jsonResponse(), KVNamespace, onRequestGet(), onRequestPost() (+3 more)

### Community 16 - "knip.json"
Cohesion: 0.20
Nodes (10): entry, ignore, ignoreExportsUsedInFile, tests/**/*.ts, project, $schema, src/constants.ts, src/**/*.{ts,svelte} (+2 more)

### Community 17 - "pull-dicts-from-kv.ts"
Cohesion: 0.22
Nodes (9): ref_node_child_process, ref_node_fs, ref_node_path, ALL_DICTS, DICT_TO_FILE, DictName, getNamespaceId(), main() (+1 more)

### Community 18 - "auth-status.ts"
Cohesion: 0.32
Nodes (5): Env, jsonResponse(), KVNamespace, onRequestGet(), RequestContext

### Community 19 - "login.ts"
Cohesion: 0.47
Nodes (3): onRequestGet(), RequestContext, sanitizeRedirectUrl()

### Community 21 - "Soát lỗi chính tả EPUB (Tiếng Việt)"
Cohesion: 0.40
Nodes (4): Cấu trúc từ điển (`public/`), Phát triển & Kiểm thử, Soát lỗi chính tả EPUB (Tiếng Việt), Tính năng chính

## Knowledge Gaps
- **202 isolated node(s):** `SectionParsedWords`, `WordValidationResult`, `AuthStatusResponse`, `CrossDictAuditResponse`, `DictAuditResponse` (+197 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 251 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `analysis-core.ts` to `dict-quality.ts`, `login.ts`, `package.json`, `epub-parser.ts`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `svelte` connect `biome.json` to `package.json`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `SectionParsedWords`, `WordValidationResult`, `AuthStatusResponse` to the rest of the system?**
  _202 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dict-quality.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06246799795186892 - nodes in this community are weakly interconnected._
- **Should `state.svelte.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05017921146953405 - nodes in this community are weakly interconnected._
- **Should `analysis-core.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11840120663650075 - nodes in this community are weakly interconnected._
- **Should `EBOOK-TOOLS — FULL REGRESSION TESTING INSTRUCTION` be split into smaller, more focused modules?**
  _Cohesion score 0.047619047619047616 - nodes in this community are weakly interconnected._
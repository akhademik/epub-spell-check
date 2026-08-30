# Graph Report - .  (2026-08-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 219 nodes · 400 edges · 14 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f77c81c8`
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
- epub-parser.ts

## God Nodes (most connected - your core abstractions)
1. `AppStateModel` - 23 edges
2. `Dictionaries` - 16 edges
3. `compilerOptions` - 14 edges
4. `scripts` - 13 edges
5. `CheckSettings` - 13 edges
6. `Logger` - 10 edges
7. `getErrorType()` - 9 edges
8. `saveStorage()` - 8 edges
9. `groupErrors()` - 7 edges
10. `ErrorInstance` - 7 edges

## Surprising Connections (you probably didn't know these)
- `parseEpub()` --references--> `jszip`  [EXTRACTED]
  src/utils/epub-parser.ts → package.json
- `getDictionary()` --calls--> `setCache()`  [EXTRACTED]
  src/utils/dictionary.ts → src/utils/indexed-db.ts
- `AppState` --references--> `CheckSettings`  [EXTRACTED]
  src/types/state.ts → src/types/analysis.ts
- `AppState` --references--> `Dictionaries`  [EXTRACTED]
  src/types/state.ts → src/types/dictionary.ts
- `AppState` --references--> `DictionaryStatus`  [EXTRACTED]
  src/types/state.ts → src/types/dictionary.ts

## Import Cycles
- None detected.

## Communities (14 total, 0 thin omitted)

### Community 0 - "state.svelte.ts"
Cohesion: 0.08
Nodes (18): contextSegments, CONTEXT_LENGTH_CHARS, EPUB_FILE_EXTENSION, FILE_SIZE_LIMIT_BYTES, FILE_SIZE_LIMIT_MB, FONT_SIZE_MAX_REM, FONT_SIZE_MIN_REM, MAX_SUGGESTION_COUNT (+10 more)

### Community 1 - "analysis-core.ts"
Cohesion: 0.20
Nodes (21): CheckSettings, Dictionaries, Dictionary, DictionaryStatus, ErrorGroup, ErrorInstance, ErrorType, AppState (+13 more)

### Community 2 - "biome.json"
Cohesion: 0.07
Nodes (27): noSvgWithoutTitle, source, assist, actions, files, includes, formatter, enabled (+19 more)

### Community 3 - "AppStateModel"
Cohesion: 0.15
Nodes (4): WHITELIST_FILE_EXTENSIONS, AppStateModel, sanitizeFilename(), saveStorage()

### Community 4 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2022, src/**/*.d.ts, src/**/*.js, src/**/*.svelte, src/**/*.ts, tests/**/*.ts (+15 more)

### Community 5 - "devDependencies"
Cohesion: 0.10
Nodes (20): autoprefixer, @biomejs/biome, devDependencies, autoprefixer, @biomejs/biome, postcss, svelte, svelte-check (+12 more)

### Community 6 - "scripts"
Cohesion: 0.11
Nodes (17): name, private, scripts, build, check, dev, format, format:check (+9 more)

### Community 7 - "utils/dictionary.ts"
Cohesion: 0.22
Nodes (7): fetchLocalDict(), getDictionary(), loadDictionaries(), getCache(), openDB(), setCache(), Logger

### Community 8 - "epub-parser.ts"
Cohesion: 0.31
Nodes (7): jszip, dependencies, jszip, BookMetadata, EpubContent, TextContentBlock, parseEpub()

## Knowledge Gaps
- **74 isolated node(s):** `FILE_SIZE_LIMIT_MB`, `FILE_SIZE_LIMIT_BYTES`, `EPUB_FILE_EXTENSION`, `CONTEXT_LENGTH_CHARS`, `TAG_COLORS` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `parseEpub()` connect `epub-parser.ts` to `state.svelte.ts`, `AppStateModel`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **Why does `dependencies` connect `epub-parser.ts` to `scripts`?**
  _High betweenness centrality (0.243) - this node is a cross-community bridge._
- **What connects `FILE_SIZE_LIMIT_MB`, `FILE_SIZE_LIMIT_BYTES`, `EPUB_FILE_EXTENSION` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `state.svelte.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08258258258258258 - nodes in this community are weakly interconnected._
- **Should `biome.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `AppStateModel` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
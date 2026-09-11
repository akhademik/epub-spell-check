<script lang="ts">
  import {
    fetchCrossDictAudit,
    type CrossDictAuditResponse,
    type DictSourceName
  } from "../../utils/dict-admin"
  import { appState } from "../../state.svelte"
  import type { CrossDictDuplicateFinding } from "../../utils/dict-quality"

  let {
    onAuditApplied
  }: {
    onAuditApplied?: () => void
  } = $props()

  let auditData = $state<CrossDictAuditResponse | null>(null)
  let isAuditing = $state(false)
  let isSyncing = $state(false)
  let rawSearchInput = $state("")
  let searchQuery = $state("")
  let matchTypeFilter = $state<"all" | "exact" | "case_variation">("all")
  let dictPairFilter = $state<string>("all")
  let ignoredWords = $state<Set<string>>(new Set())
  let stagedDeletions = $state<Map<DictSourceName, Set<string>>>(
    new Map([
      ["vn", new Set()],
      ["names", new Set()],
      ["non-vn", new Set()],
      ["custom", new Set()]
    ])
  )
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement
    rawSearchInput = target.value
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      searchQuery = rawSearchInput.trim().toLowerCase()
    }, 200)
  }

  async function runCrossAudit() {
    isAuditing = true
    ignoredWords = new Set()
    stagedDeletions = new Map([
      ["vn", new Set()],
      ["names", new Set()],
      ["non-vn", new Set()],
      ["custom", new Set()]
    ])
    try {
      auditData = await fetchCrossDictAudit(appState.dictAdminToken)
      appState.showToast(
        `Đã quét xong: tìm thấy ${auditData.findings.length} từ trùng lặp giữa các từ điển.`,
        "success"
      )
    } catch (err) {
      appState.showToast(
        err instanceof Error ? err.message : "Lỗi khi quét trùng lặp chéo.",
        "error"
      )
    } finally {
      isAuditing = false
    }
  }

  const totalStagedCount = $derived.by(() => {
    let count = 0
    for (const set of stagedDeletions.values()) {
      count += set.size
    }
    return count
  })

  const visibleFindings = $derived.by(() => {
    if (!auditData) return []
    let list = auditData.findings.filter((f) => !ignoredWords.has(f.lowerWord))

    // Filter out items whose all-but-one duplicates have been resolved in staging
    list = list.filter((f) => {
      const activeOccurrences = f.occurrences.filter(
        (occ) => !stagedDeletions.get(occ.dictName)?.has(occ.exactWord)
      )
      return activeOccurrences.length >= 2
    })

    if (matchTypeFilter !== "all") {
      list = list.filter((f) => f.matchType === matchTypeFilter)
    }

    if (dictPairFilter !== "all") {
      const [d1, d2] = dictPairFilter.split(":")
      list = list.filter((f) => {
        const dicts = new Set(f.occurrences.map((o) => o.dictName))
        return dicts.has(d1 as DictSourceName) && dicts.has(d2 as DictSourceName)
      })
    }

    if (searchQuery) {
      list = list.filter(
        (f) =>
          f.lowerWord.includes(searchQuery) ||
          f.word.toLowerCase().includes(searchQuery)
      )
    }

    return list
  })

  function stageDeleteFromDict(dictName: DictSourceName, exactWord: string) {
    const nextMap = new Map(stagedDeletions)
    const set = new Set(nextMap.get(dictName))
    set.add(exactWord)
    nextMap.set(dictName, set)
    stagedDeletions = nextMap
    appState.showToast(`Đã xếp xóa "${exactWord}" khỏi từ điển [${dictName.toUpperCase()}].`, "info")
  }

  function keepOnlyInDict(finding: CrossDictDuplicateFinding, keepDict: DictSourceName) {
    const nextMap = new Map(stagedDeletions)
    for (const occ of finding.occurrences) {
      if (occ.dictName !== keepDict) {
        const set = new Set(nextMap.get(occ.dictName))
        set.add(occ.exactWord)
        nextMap.set(occ.dictName, set)
      }
    }
    stagedDeletions = nextMap
    appState.showToast(`Chỉ giữ "${finding.word}" trong [${keepDict.toUpperCase()}], xếp xóa ở các từ điển khác.`, "info")
  }

  function ignoreFinding(lowerWord: string) {
    const next = new Set(ignoredWords)
    next.add(lowerWord)
    ignoredWords = next
    appState.showToast(`Đã bỏ qua từ "${lowerWord}".`, "info")
  }

  function discardAllStaged() {
    stagedDeletions = new Map([
      ["vn", new Set()],
      ["names", new Set()],
      ["non-vn", new Set()],
      ["custom", new Set()]
    ])
    appState.showToast("Đã hủy bỏ toàn bộ thay đổi chưa lưu.", "info")
  }

  async function handleSyncCrossDeletions() {
    if (totalStagedCount === 0) return
    isSyncing = true
    try {
      for (const [dictName, wordsSet] of stagedDeletions.entries()) {
        if (wordsSet.size > 0) {
          const words = Array.from(wordsSet)
          await appState.addWordsToDictionary(
            dictName,
            words.join("\n"),
            appState.dictAdminToken,
            "remove"
          )
        }
      }
      stagedDeletions = new Map([
        ["vn", new Set()],
        ["names", new Set()],
        ["non-vn", new Set()],
        ["custom", new Set()]
      ])
      await runCrossAudit()
      onAuditApplied?.()
    } finally {
      isSyncing = false
    }
  }

  function dictBadgeColor(dictName: DictSourceName): string {
    switch (dictName) {
      case "vn":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
      case "names":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30"
      case "non-vn":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30"
      case "custom":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30"
    }
  }

  function dictLabel(dictName: DictSourceName): string {
    switch (dictName) {
      case "vn":
        return "1. Tiếng Việt"
      case "names":
        return "2. Tên riêng"
      case "non-vn":
        return "3. Ngoại ngữ"
      case "custom":
        return "4. Tuỳ chỉnh"
    }
  }
</script>

<div class="flex flex-col space-y-6">
  <!-- Action Header -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
    <div>
      <h3 class="text-base font-bold text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span>Kiểm Tra Trùng Lặp Chéo (Cross-Dict Duplicates Audit)</span>
      </h3>
      <p class="text-xs text-slate-400 mt-1">
        Phát hiện và dọn dẹp các từ xuất hiện đồng thời ở nhiều hơn 1 từ điển (ví dụ: vừa có ở Tên riêng vừa có ở Ngoại ngữ).
      </p>
    </div>

    <div class="flex items-center gap-3">
      {#if auditData}
        <div class="hidden sm:flex flex-col text-right font-mono text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <div class="flex items-center gap-2 justify-end">
            <span class="text-slate-300 font-bold">Tổng quét: {auditData.totalWordsScanned.toLocaleString()} từ</span>
            <span class="text-slate-600">|</span>
            <span class="text-indigo-400 font-bold">{auditData.findings.length} từ trùng lặp</span>
            <span class="text-slate-600">|</span>
            <span>{auditData.timingMs} ms</span>
          </div>
          <div class="text-[10px] text-slate-500">
            VN: {auditData.dictCounts.vn.toLocaleString()} &bull; NAMES: {auditData.dictCounts.names.toLocaleString()} &bull; NON-VN: {auditData.dictCounts["non-vn"].toLocaleString()} &bull; CUSTOM: {auditData.dictCounts.custom.toLocaleString()}
          </div>
        </div>
      {/if}

      <button
        type="button"
        disabled={isAuditing}
        onclick={runCrossAudit}
        class="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2 shrink-0"
      >
        {#if isAuditing}
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Đang quét 4 từ điển...</span>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{auditData ? "Quét lại toàn bộ" : "Bắt đầu quét trùng lặp chéo"}</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Staging Action Bar -->
  {#if totalStagedCount > 0}
    <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-500/50 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-indigo-400 animate-ping"></span>
          <h4 class="text-sm font-bold text-white">
            Đang xếp xóa {totalStagedCount} lượt từ (Staging):
          </h4>
        </div>
        <div class="flex items-center gap-2 flex-wrap text-xs text-indigo-200/90">
          {#if stagedDeletions.get("vn")?.size}
            <span class="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              VN: -{stagedDeletions.get("vn")?.size}
            </span>
          {/if}
          {#if stagedDeletions.get("names")?.size}
            <span class="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
              NAMES: -{stagedDeletions.get("names")?.size}
            </span>
          {/if}
          {#if stagedDeletions.get("non-vn")?.size}
            <span class="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300">
              NON-VN: -{stagedDeletions.get("non-vn")?.size}
            </span>
          {/if}
          {#if stagedDeletions.get("custom")?.size}
            <span class="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300">
              CUSTOM: -{stagedDeletions.get("custom")?.size}
            </span>
          {/if}
        </div>
      </div>

      <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
        <button
          type="button"
          disabled={isSyncing}
          onclick={discardAllStaged}
          class="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all border border-slate-700"
        >
          Hủy bỏ thay đổi
        </button>
        <button
          type="button"
          disabled={isSyncing}
          onclick={handleSyncCrossDeletions}
          class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-indigo-900/50 flex items-center gap-2"
        >
          {#if isSyncing}
            <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Đang lưu lên Cloudflare KV...</span>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Lưu & Đồng bộ {totalStagedCount} thay đổi</span>
          {/if}
        </button>
      </div>
    </div>
  {/if}

  {#if !auditData && !isAuditing}
    <div class="text-center py-20 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <p class="text-sm font-medium text-slate-300">Chưa có kết quả kiểm tra trùng lặp chéo</p>
      <p class="text-xs text-slate-500">Bấm nút "Bắt đầu quét trùng lặp chéo" ở trên để quét đồng thời cả 4 từ điển.</p>
    </div>
  {:else if auditData}
    <!-- Filters & Search Bar -->
    <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <!-- Search -->
        <div class="relative w-full sm:w-80">
          <input
            type="text"
            value={rawSearchInput}
            oninput={handleSearchInput}
            placeholder={`Tìm trong ${auditData.findings.length.toLocaleString()} từ trùng lặp...`}
            class="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 absolute left-3 top-3 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Filter Segmented Control -->
        <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onclick={() => (matchTypeFilter = "all")}
            class="px-3 py-1.5 rounded-lg font-medium transition-all {matchTypeFilter === 'all'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'}"
          >
            Tất cả ({auditData.findings.length})
          </button>
          <button
            type="button"
            onclick={() => (matchTypeFilter = "exact")}
            class="px-3 py-1.5 rounded-lg font-medium transition-all {matchTypeFilter === 'exact'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'}"
          >
            Trùng chính xác ({auditData.findings.filter((f) => f.matchType === 'exact').length})
          </button>
          <button
            type="button"
            onclick={() => (matchTypeFilter = "case_variation")}
            class="px-3 py-1.5 rounded-lg font-medium transition-all {matchTypeFilter === 'case_variation'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'}"
          >
            Khác hoa/thường ({auditData.findings.filter((f) => f.matchType === 'case_variation').length})
          </button>
        </div>
      </div>

      <!-- Dict Pair Filter Pills -->
      <div class="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-800/80">
        <span class="text-slate-500 font-semibold">Cặp từ điển:</span>
        <button
          type="button"
          onclick={() => (dictPairFilter = "all")}
          class="px-2.5 py-1 rounded-lg transition-colors {dictPairFilter === 'all'
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
            : 'text-slate-400 hover:bg-slate-800 border border-transparent'}"
        >
          Tất cả cặp
        </button>
        <button
          type="button"
          onclick={() => (dictPairFilter = "vn:non-vn")}
          class="px-2.5 py-1 rounded-lg transition-colors {dictPairFilter === 'vn:non-vn'
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
            : 'text-slate-400 hover:bg-slate-800 border border-transparent'}"
        >
          VN ⟷ NON-VN
        </button>
        <button
          type="button"
          onclick={() => (dictPairFilter = "names:non-vn")}
          class="px-2.5 py-1 rounded-lg transition-colors {dictPairFilter === 'names:non-vn'
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
            : 'text-slate-400 hover:bg-slate-800 border border-transparent'}"
        >
          NAMES ⟷ NON-VN
        </button>
        <button
          type="button"
          onclick={() => (dictPairFilter = "custom:names")}
          class="px-2.5 py-1 rounded-lg transition-colors {dictPairFilter === 'custom:names'
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
            : 'text-slate-400 hover:bg-slate-800 border border-transparent'}"
        >
          CUSTOM ⟷ NAMES
        </button>
        <button
          type="button"
          onclick={() => (dictPairFilter = "custom:non-vn")}
          class="px-2.5 py-1 rounded-lg transition-colors {dictPairFilter === 'custom:non-vn'
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
            : 'text-slate-400 hover:bg-slate-800 border border-transparent'}"
        >
          CUSTOM ⟷ NON-VN
        </button>
        <button
          type="button"
          onclick={() => (dictPairFilter = "custom:vn")}
          class="px-2.5 py-1 rounded-lg transition-colors {dictPairFilter === 'custom:vn'
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
            : 'text-slate-400 hover:bg-slate-800 border border-transparent'}"
        >
          CUSTOM ⟷ VN
        </button>
      </div>
    </div>

    <!-- Findings Cards List -->
    <div class="rounded-2xl bg-slate-900 border border-indigo-900/40 shadow-xl overflow-hidden">
      <div class="p-4 bg-indigo-950/30 border-b border-indigo-900/40 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          <h4 class="text-sm font-bold text-indigo-200">
            Danh Sách Từ Trùng Lặp Chéo — {visibleFindings.length} từ hiển thị
          </h4>
        </div>
        <span class="text-xs text-slate-400">Chọn từ điển chuẩn để dọn dẹp các từ điển còn lại</span>
      </div>

      <div class="p-4 max-h-[700px] overflow-y-auto space-y-3 font-mono text-sm">
        {#if visibleFindings.length === 0}
          <div class="text-center py-12 text-emerald-400 font-sans space-y-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 mx-auto text-emerald-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <p class="font-bold">Không còn từ trùng lặp nào theo bộ lọc hiện tại!</p>
            <p class="text-xs text-slate-400">Tất cả từ điển đã được phân loại rõ ràng và không bị trùng lặp chéo.</p>
          </div>
        {:else}
          {#each visibleFindings.slice(0, 150) as finding (finding.lowerWord)}
            <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-colors">
              <div class="flex-1 min-w-0 space-y-1.5">
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="font-sans text-[22px] font-bold text-white leading-tight">{finding.word}</span>
                  <span class="px-2 py-0.5 text-[11px] font-sans rounded-md {finding.matchType === 'exact'
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}">
                    {finding.matchType === 'exact' ? 'Trùng chính xác' : 'Biến thể hoa/thường'}
                  </span>

                  <!-- Occurrences Badges -->
                  <div class="flex items-center gap-1.5 flex-wrap">
                    {#each finding.occurrences as occ (occ.dictName + occ.exactWord)}
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-sans rounded-lg border {dictBadgeColor(occ.dictName)}">
                        <strong>{dictLabel(occ.dictName)}</strong>: "{occ.exactWord}"
                        <button
                          type="button"
                          onclick={() => stageDeleteFromDict(occ.dictName, occ.exactWord)}
                          class="ml-1 text-rose-400 hover:text-rose-200 font-bold"
                          title={`Xóa riêng khỏi ${occ.dictName.toUpperCase()}`}
                        >
                          ✕
                        </button>
                      </span>
                    {/each}
                  </div>
                </div>

                {#if finding.suggestion}
                  <p class="text-xs text-indigo-300/90 font-sans flex items-center gap-1.5 pt-0.5">
                    <span>💡</span>
                    <span><strong>Gợi ý:</strong> {finding.suggestion.reason}</span>
                  </p>
                {/if}
              </div>

              <!-- Quick Action Resolution Buttons -->
              <div class="flex items-center gap-2 flex-wrap shrink-0">
                <span class="text-xs text-slate-500 font-sans mr-1">Chỉ giữ ở:</span>
                {#each finding.occurrences as occ (occ.dictName)}
                  <button
                    type="button"
                    onclick={() => keepOnlyInDict(finding, occ.dictName)}
                    class="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all hover:scale-105 shadow-sm {dictBadgeColor(occ.dictName)}"
                    title={`Chỉ giữ lại ở ${dictLabel(occ.dictName)} và xóa khỏi các từ điển khác`}
                  >
                    ✓ {occ.dictName.toUpperCase()}
                  </button>
                {/each}
                <button
                  type="button"
                  onclick={() => ignoreFinding(finding.lowerWord)}
                  class="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 border border-slate-700/80 rounded-lg hover:bg-slate-800 transition-colors font-sans"
                  title="Bỏ qua từ này (cho phép tồn tại ở cả 2)"
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          {/each}

          {#if visibleFindings.length > 150}
            <div class="p-3 text-center text-xs text-slate-500 border-t border-slate-800/80 mt-2 font-sans">
              Đang hiển thị 150 / {visibleFindings.length.toLocaleString()} từ trùng lặp. Hãy dùng ô tìm kiếm hoặc bộ lọc cặp từ điển ở trên để thu hẹp phạm vi.
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>

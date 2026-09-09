<script lang="ts">
  import {
    fetchDictionaryAudit,
    ignoreDuplicatePair,
    type DictAuditResponse,
    type DictSourceName
  } from "../../utils/dict-admin"
  import { appState } from "../../state.svelte"
  import { createPairKey } from "../../utils/dict-quality"

  let {
    activeDict = "vn",
    onAuditApplied
  }: {
    activeDict: DictSourceName
    onAuditApplied?: () => void
  } = $props()

  let auditData = $state<DictAuditResponse | null>(null)
  let isAuditing = $state(false)
  let selectedTierAWords = $state<Set<string>>(new Set())
  let isDeletingTierA = $state(false)
  let ignoredClusterIds = $state<Set<string>>(new Set())

  const tierAFindings = $derived(
    auditData?.garbage.filter((g) => g.tier === "A") ?? []
  )
  const tierBFindings = $derived(
    auditData?.garbage.filter((g) => g.tier === "B") ?? []
  )
  const activeClusters = $derived(
    auditData?.duplicateClusters.filter((c) => !ignoredClusterIds.has(c.id)) ?? []
  )

  async function runAudit() {
    isAuditing = true
    ignoredClusterIds = new Set()
    try {
      auditData = await fetchDictionaryAudit(
        activeDict,
        appState.dictAdminToken
      )
      // Default select all Tier A words
      const tierAWords = (auditData.garbage.filter((g) => g.tier === "A") || []).map(
        (g) => g.word
      )
      selectedTierAWords = new Set(tierAWords)
      appState.showToast("Đã hoàn tất quét kiểm tra chất lượng từ điển.", "success")
    } catch (err) {
      appState.showToast(
        err instanceof Error ? err.message : "Lỗi khi quét từ điển.",
        "error"
      )
    } finally {
      isAuditing = false
    }
  }

  function toggleTierAWord(word: string) {
    const next = new Set(selectedTierAWords)
    if (next.has(word)) {
      next.delete(word)
    } else {
      next.add(word)
    }
    selectedTierAWords = next
  }

  function toggleAllTierA() {
    if (selectedTierAWords.size === tierAFindings.length) {
      selectedTierAWords = new Set()
    } else {
      selectedTierAWords = new Set(tierAFindings.map((g) => g.word))
    }
  }

  async function handleDeleteTierA() {
    if (selectedTierAWords.size === 0) return
    isDeletingTierA = true
    try {
      const words = Array.from(selectedTierAWords)
      const success = await appState.addWordsToDictionary(
        activeDict,
        words.join("\n"),
        appState.dictAdminToken,
        "remove"
      )
      if (success) {
        selectedTierAWords = new Set()
        await runAudit()
        onAuditApplied?.()
      }
    } finally {
      isDeletingTierA = false
    }
  }

  async function handleDeleteSingleWord(word: string) {
    const success = await appState.addWordsToDictionary(
      activeDict,
      word,
      appState.dictAdminToken,
      "remove"
    )
    if (success) {
      await runAudit()
      onAuditApplied?.()
    }
  }

  async function handleIgnoreCluster(cluster: DictAuditResponse["duplicateClusters"][0]) {
    if (cluster.words.length >= 2) {
      const pairKey = createPairKey(cluster.words[0].word, cluster.words[1].word)
      await ignoreDuplicatePair(activeDict, pairKey, appState.dictAdminToken)
    }
    const next = new Set(ignoredClusterIds)
    next.add(cluster.id)
    ignoredClusterIds = next
    appState.showToast("Đã bỏ qua cụm từ trùng lặp này.", "info")
  }
</script>

<div class="flex flex-col space-y-6">
  <!-- Action Header -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
    <div>
      <h3 class="text-base font-bold text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Kiểm Tra Chất Lượng & Dọn Rác Từ Điển</span>
      </h3>
      <p class="text-xs text-slate-400 mt-1">
        Phát hiện rác OCR, lỗi chú thích dịch thuật, ký tự lạ và các cụm từ trùng lặp mờ (fuzzy near-duplicates).
      </p>
    </div>

    <div class="flex items-center gap-3">
      {#if auditData?.timing}
        <div class="hidden sm:flex flex-col text-right font-mono text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <div class="flex items-center gap-2 justify-end">
            <span class="text-slate-300 font-bold">Tổng: {auditData.timing.totalMs} ms</span>
            <span class="text-slate-600">|</span>
            <span>Rác: {auditData.timing.garbageScanMs} ms</span>
            <span class="text-slate-600">|</span>
            <span>Fuzzy: {auditData.timing.fuzzyScanMs} ms</span>
          </div>
          <div class="text-[10px] text-slate-500">
            {auditData.timing.candidateCount.toLocaleString()} cặp ứng viên &bull; {auditData.timing.levenshteinCheckCount.toLocaleString()} phép Levenshtein
          </div>
        </div>
      {/if}

      <button
        type="button"
        disabled={isAuditing}
        onclick={runAudit}
        class="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-amber-900/30 flex items-center gap-2 shrink-0"
      >
        {#if isAuditing}
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Đang quét...</span>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>{auditData ? "Quét lại" : "Bắt đầu quét kiểm tra"}</span>
        {/if}
      </button>
    </div>
  </div>

  {#if !auditData && !isAuditing}
    <div class="text-center py-20 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
      <p class="text-sm font-medium text-slate-300">Chưa có kết quả kiểm tra</p>
      <p class="text-xs text-slate-500">Bấm nút "Bắt đầu quét kiểm tra" ở trên để hệ thống phân tích từ điển "{activeDict}".</p>
    </div>
  {:else if auditData}
    <div class="grid grid-cols-1 gap-6">
      <!-- Khối 1: Tier A (Rác độ tin cậy rất cao) -->
      <div class="rounded-2xl bg-slate-900 border border-rose-900/40 shadow-xl overflow-hidden">
        <div class="p-4 bg-rose-950/30 border-b border-rose-900/40 flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <h4 class="text-sm font-bold text-rose-200">
              Khối 1: Rác Độ Tin Cậy Rất Cao (Tier A) — {tierAFindings.length} từ
            </h4>
          </div>

          {#if tierAFindings.length > 0}
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={toggleAllTierA}
                class="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
              >
                {selectedTierAWords.size === tierAFindings.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
              <button
                type="button"
                disabled={isDeletingTierA || selectedTierAWords.size === 0}
                onclick={handleDeleteTierA}
                class="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-lg transition-colors shadow"
              >
                Xóa {selectedTierAWords.size} từ đã chọn
              </button>
            </div>
          {/if}
        </div>

        <div class="p-4 max-h-80 overflow-y-auto divide-y divide-slate-800/60 font-mono text-sm">
          {#if tierAFindings.length === 0}
            <div class="text-center py-6 text-emerald-400 font-sans">
              ✓ Tuyệt vời! Không phát hiện từ rác Tier A nào trong từ điển.
            </div>
          {:else}
            {#each tierAFindings as finding (finding.word)}
              <div class="py-2.5 flex items-center justify-between gap-3">
                <label class="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedTierAWords.has(finding.word)}
                    onchange={() => toggleTierAWord(finding.word)}
                    class="w-4 h-4 rounded border-slate-700 text-rose-600 focus:ring-0 bg-slate-950"
                  />
                  <span class="font-sans text-[20px] font-semibold text-rose-300 leading-tight truncate">{finding.word}</span>
                  <span class="text-xs text-slate-400 font-sans truncate">
                    ({finding.reasons.join(", ")})
                  </span>
                </label>
                <button
                  type="button"
                  onclick={() => handleDeleteSingleWord(finding.word)}
                  class="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-200 border border-rose-900/60 rounded-lg hover:bg-rose-950/40 transition-colors"
                >
                  Xóa
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Khối 2: Tier B (Cần xem lại) -->
      <div class="rounded-2xl bg-slate-900 border border-amber-900/40 shadow-xl overflow-hidden">
        <div class="p-4 bg-amber-950/20 border-b border-amber-900/40 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h4 class="text-sm font-bold text-amber-200">
              Khối 2: Cần Xem Lại Thủ Công (Tier B) — {tierBFindings.length} từ
            </h4>
          </div>
          <span class="text-xs text-slate-400">Xem xét và xóa thủ công từng từ</span>
        </div>

        <div class="p-4 max-h-80 overflow-y-auto divide-y divide-slate-800/60 font-mono text-sm">
          {#if tierBFindings.length === 0}
            <div class="text-center py-6 text-slate-400 font-sans">
              Không có từ nào thuộc danh sách nghi vấn Tier B.
            </div>
          {:else}
            {#each tierBFindings as finding (finding.word)}
              <div class="py-2.5 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5 flex-1 min-w-0">
                  <span class="font-sans text-[20px] font-semibold text-amber-300 leading-tight truncate">{finding.word}</span>
                  <span class="text-xs text-slate-400 font-sans truncate">
                    ({finding.reasons.join(", ")})
                  </span>
                </div>
                <button
                  type="button"
                  onclick={() => handleDeleteSingleWord(finding.word)}
                  class="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-200 border border-rose-900/60 rounded-lg hover:bg-rose-950/40 transition-colors shrink-0"
                >
                  Xóa từ này
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Khối 3: Trùng lặp mờ (Fuzzy Near-Duplicates) -->
      <div class="rounded-2xl bg-slate-900 border border-blue-900/40 shadow-xl overflow-hidden">
        <div class="p-4 bg-blue-950/20 border-b border-blue-900/40 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h4 class="text-sm font-bold text-blue-200">
              Khối 3: Nghi Trùng Lặp Mờ (Fuzzy Near-Duplicates) — {activeClusters.length} cụm
            </h4>
          </div>
          <span class="text-xs text-slate-400">Viền xanh = Gợi ý đúng, Viền đỏ = Gợi ý lỗi</span>
        </div>

        <div class="p-4 max-h-96 overflow-y-auto space-y-3">
          {#if activeClusters.length === 0}
            <div class="text-center py-8 text-slate-400 text-xs">
              Không phát hiện cụm từ trùng lặp mờ nào cần xử lý.
            </div>
          {:else}
            {#each activeClusters as cluster (cluster.id)}
              <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div class="flex items-center gap-2 flex-wrap">
                  {#each cluster.words as cw (cw.word)}
                    <button
                      type="button"
                      onclick={() => handleDeleteSingleWord(cw.word)}
                      title={`Bấm để xóa từ "${cw.word}"`}
                      class="px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 {cw.suggestion === 'keep'
                        ? 'border border-emerald-500/60 text-emerald-300 bg-emerald-950/30'
                        : cw.suggestion === 'delete'
                        ? 'border border-rose-500/60 text-rose-300 bg-rose-950/30'
                        : 'border border-slate-700 text-slate-300 bg-slate-900'}"
                    >
                      <span class="font-sans text-[20px] font-semibold leading-tight">{cw.word}</span>
                      {#if cw.suggestion === "keep"}
                        <span class="text-xs text-emerald-400 font-sans">✓ giữ</span>
                      {:else if cw.suggestion === "delete"}
                        <span class="text-xs text-rose-400 font-sans">✕ xóa</span>
                      {/if}
                    </button>
                  {/each}
                </div>

                <button
                  type="button"
                  onclick={() => handleIgnoreCluster(cluster)}
                  class="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 border border-slate-700/80 rounded-lg transition-colors shrink-0"
                >
                  Không phải trùng, bỏ qua
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

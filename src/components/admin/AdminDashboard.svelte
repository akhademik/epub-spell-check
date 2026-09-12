<script lang="ts">
  import { onMount } from "svelte"
  import {
    checkAuthStatus,
    fetchDictionaryDetails,
    type DictSourceName,
    type AuthStatusResponse,
    type DictDetailResponse
  } from "../../utils/dict-admin"
  import { appState } from "../../state.svelte"
  import AddWordsForm from "./AddWordsForm.svelte"
  import DictAuditPanel from "./DictAuditPanel.svelte"
  import CrossDictAuditPanel from "./CrossDictAuditPanel.svelte"

  const DICT_TABS: { id: DictSourceName; label: string; badge: string; color: string; bg: string }[] = [
    { id: "vn", label: "1. Tiếng Việt", badge: "VN", color: "text-emerald-400 border-emerald-500", bg: "bg-emerald-500/10 text-emerald-300" },
    { id: "names", label: "2. Tên riêng & Địa danh", badge: "NAMES", color: "text-amber-400 border-amber-500", bg: "bg-amber-500/10 text-amber-300" },
    { id: "non-vn", label: "3. Ngoại ngữ & Từ mượn", badge: "NON-VN", color: "text-blue-400 border-blue-500", bg: "bg-blue-500/10 text-blue-300" },
    { id: "custom", label: "4. Viết tắt & Tuỳ chỉnh", badge: "CUSTOM", color: "text-purple-400 border-purple-500", bg: "bg-purple-500/10 text-purple-300" }
  ]

  let mainSection = $state<"manage" | "audit">("manage")
  let auditMode = $state<"single" | "cross">("single")
  let activeTab = $state<DictSourceName>("vn")
  let authStatus = $state<AuthStatusResponse>({
    authenticated: false,
    authType: "none",
    email: null,
    hasTokenConfigured: false
  })

  let isCheckingAuth = $state(true)
  let isLoading = $state(true)
  let rawSearchInput = $state("")
  let searchQuery = $state("")
  let currentDictData = $state<DictDetailResponse | null>(null)
  let selectedWords = $state<Set<string>>(new Set())
  let isDeleting = $state(false)
  let deleteConfirmWord = $state<string | null>(null)
  let tokenInput = $state(appState.dictAdminToken)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function normalizeSearchTerm(str: string): string {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Strip diacritics
      .replace(/[đĐ]/g, (m) => (m === "đ" ? "d" : "D")) // Normalize đ/Đ
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'<>@+[\]\\]/g, "") // Strip punctuation
      .toLowerCase()
      .trim()
  }

  function handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement
    rawSearchInput = target.value
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      searchQuery = rawSearchInput
    }, 250)
  }

  async function loadAuth() {
    isCheckingAuth = true
    authStatus = await checkAuthStatus(appState.dictAdminToken)
    isCheckingAuth = false
    if (authStatus.authenticated) {
      loadDictionaryWords(activeTab)
    }
  }

  async function loadDictionaryWords(dict: DictSourceName) {
    isLoading = true
    selectedWords = new Set()
    deleteConfirmWord = null
    try {
      currentDictData = await fetchDictionaryDetails(dict, appState.dictAdminToken)
    } catch (err) {
      appState.showToast(
        err instanceof Error ? err.message : "Lỗi khi tải danh sách từ",
        "error"
      )
    } finally {
      isLoading = false
    }
  }

  onMount(() => {
    loadAuth()
  })

  function handleTabChange(tab: DictSourceName) {
    activeTab = tab
    rawSearchInput = ""
    searchQuery = ""
    loadDictionaryWords(tab)
  }

  function handleSaveToken() {
    appState.dictAdminToken = tokenInput.trim()
    loadAuth()
    if (appState.dictAdminToken) {
      appState.showToast("Đã cập nhật token quản trị cho phiên hiện tại", "success")
    }
  }

  let filteredWords = $derived.by(() => {
    if (!currentDictData) return []
    const rawQuery = searchQuery.trim()
    let words = currentDictData.words

    if (rawQuery) {
      const normalizedQuery = normalizeSearchTerm(rawQuery)
      if (normalizedQuery) {
        words = words.filter((w) => {
          const normW = normalizeSearchTerm(w)
          return normW.includes(normalizedQuery) || w.toLowerCase().includes(rawQuery.toLowerCase())
        })
      }
    }

    // Sort by Vietnamese collation
    return [...words].sort((a, b) =>
      a.localeCompare(b, "vi", { sensitivity: "base" })
    )
  })

  function toggleSelectWord(word: string) {
    const next = new Set(selectedWords)
    if (next.has(word)) {
      next.delete(word)
    } else {
      next.add(word)
    }
    selectedWords = next
  }

  function toggleSelectAll() {
    if (selectedWords.size === filteredWords.length) {
      selectedWords = new Set()
    } else {
      selectedWords = new Set(filteredWords)
    }
  }

  async function handleDeleteWords(wordsToDelete: string[]) {
    if (wordsToDelete.length === 0) return
    isDeleting = true
    try {
      const success = await appState.addWordsToDictionary(
        activeTab,
        wordsToDelete.join("\n"),
        appState.dictAdminToken,
        "remove"
      )
      if (success) {
        selectedWords = new Set()
        deleteConfirmWord = null
        await loadDictionaryWords(activeTab)
      }
    } finally {
      isDeleting = false
    }
  }

  function handleWordsAdded() {
    loadDictionaryWords(activeTab)
  }
</script>

<div class="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 py-4 space-y-6">
  <!-- Top Navigation & Auth Status Bar -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
    <div class="flex items-center gap-3">
      <button
        type="button"
        onclick={() => (appState.currentView = "main")}
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Quay lại Soát Sách
      </button>
      <div class="h-4 w-px bg-slate-700"></div>
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <span>Admin Dashboard: Quản Lý Từ Điển</span>
      </h2>
    </div>

    <!-- Auth Badge -->
    <div class="flex items-center gap-2 text-xs">
      {#if authStatus.authenticated}
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Đã xác thực Token</span>
        </div>
      {/if}
    </div>
  </div>

  {#if isCheckingAuth}
    <!-- Loading Auth State -->
    <div class="flex flex-col items-center justify-center py-28 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <div class="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span class="text-sm text-slate-400">Đang kiểm tra xác thực...</span>
    </div>
  {:else if !authStatus.authenticated}
    <!-- Auth Gate / Login Screen -->
    <div class="max-w-lg w-full mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <div class="space-y-2">
        <h3 class="text-xl font-bold text-white">Yêu Cầu Mã Token Quản Trị</h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          Vui lòng nhập mã <strong>ADMIN_TOKEN</strong> bí mật để mở khóa bảng điều khiển quản lý và chỉnh sửa từ điển.
        </p>
      </div>

      <!-- Token Form -->
      <div class="space-y-3 text-left">
        <label for="admin-token-input" class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Mã ADMIN_TOKEN (lưu tạm trong phiên):
        </label>
        <div class="flex gap-2">
          <input
            id="admin-token-input"
            type="password"
            bind:value={tokenInput}
            placeholder="Nhập mã ADMIN_TOKEN..."
            class="flex-1 px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            onkeydown={(e) => { if (e.key === "Enter") handleSaveToken() }}
          />
          <button
            type="button"
            onclick={handleSaveToken}
            class="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-900/30"
          >
            Mở khóa
          </button>
        </div>
        <p class="text-[11px] text-slate-500 italic">
          * Token chỉ lưu trong bộ nhớ RAM của phiên làm việc hiện tại và sẽ tự động xóa khi tải lại trang.
        </p>
      </div>
    </div>
  {:else}
    <!-- Sub Navigation Tabs: Quản lý từ & Kiểm tra chất lượng -->
    <div class="flex items-center gap-2 border-b border-slate-800 pb-2">
      <button
        type="button"
        onclick={() => (mainSection = "manage")}
        class="px-4 py-2 text-xs font-bold rounded-xl transition-all {mainSection === 'manage'
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
      >
        1. Quản Lý Từ Vựng & Thêm Mới
      </button>
      <button
        type="button"
        onclick={() => (mainSection = "audit")}
        class="px-4 py-2 text-xs font-bold rounded-xl transition-all {mainSection === 'audit'
          ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
      >
        2. Kiểm Tra Chất Lượng & Dọn Rác (Audit)
      </button>
    </div>

    {#if mainSection === "audit"}
      <div class="space-y-4">
        <!-- Audit Mode Sub-Tabs -->
        <div class="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs w-fit">
          <button
            type="button"
            onclick={() => (auditMode = "single")}
            class="px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 {auditMode === 'single'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
              : 'text-slate-400 hover:text-slate-200'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Kiểm Tra Từng Từ Điển (Single-Dict)</span>
          </button>
          <button
            type="button"
            onclick={() => (auditMode = "cross")}
            class="px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 {auditMode === 'cross'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
              : 'text-slate-400 hover:text-slate-200'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Kiểm Tra Trùng Lặp Chéo (Cross-Dict Overlap)</span>
          </button>
        </div>

        {#if auditMode === "single"}
          <!-- Dict Tabs for Single Audit -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {#each DICT_TABS as tab (tab.id)}
              <button
                type="button"
                onclick={() => handleTabChange(tab.id)}
                class="flex flex-col items-start p-3 rounded-2xl border text-left transition-all {activeTab === tab.id
                  ? `${tab.color} bg-slate-900 shadow-lg`
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'}"
              >
                <span class="text-xs font-bold tracking-wider uppercase mb-1">{tab.badge}</span>
                <span class="text-sm font-semibold text-slate-100">{tab.label.split(". ")[1]}</span>
              </button>
            {/each}
          </div>

          <DictAuditPanel
            activeDict={activeTab}
            onAuditApplied={() => loadDictionaryWords(activeTab)}
          />
        {:else}
          <!-- Cross-Dict Audit Panel (All 4 Dicts) -->
          <CrossDictAuditPanel
            onAuditApplied={() => loadDictionaryWords(activeTab)}
          />
        {/if}
      </div>
    {:else}
      <!-- Main 2-Column Layout (Streamlined List Layout) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Left Column: Word Explorer & Dict Tabs (7 Cols) -->
      <div class="lg:col-span-7 flex flex-col space-y-4">
        <!-- Dict Tabs -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {#each DICT_TABS as tab (tab.id)}
            <button
              type="button"
              onclick={() => handleTabChange(tab.id)}
              class="flex flex-col items-start p-3 rounded-2xl border text-left transition-all {activeTab === tab.id
                ? `${tab.color} bg-slate-900 shadow-lg`
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'}"
            >
              <span class="text-xs font-bold tracking-wider uppercase mb-1">{tab.badge}</span>
              <span class="text-sm font-semibold text-slate-100">{tab.label.split(". ")[1]}</span>
              <span class="text-[11px] text-slate-500 mt-1">
                {#if activeTab === tab.id && currentDictData}
                  {currentDictData.totalCount.toLocaleString()} từ
                {:else}
                  Xem từ điển
                {/if}
              </span>
            </button>
          {/each}
        </div>

        <!-- Word Explorer Card (Clean List) -->
        <div class="flex-1 flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden min-h-[500px]">
          <!-- Search & Action Bar -->
          <div class="p-4 border-b border-slate-800 bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-72">
              <input
                type="text"
                value={rawSearchInput}
                oninput={handleSearchInput}
                placeholder={`Tìm trong ${currentDictData ? currentDictData.totalCount.toLocaleString() : '...'} từ...`}
                class="w-full pl-9 pr-4 py-2 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
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

            <!-- Bulk Actions -->
            <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {#if selectedWords.size > 0}
                <button
                  type="button"
                  disabled={isDeleting}
                  onclick={() => handleDeleteWords(Array.from(selectedWords))}
                  class="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Xóa {selectedWords.size} từ đã chọn
                </button>
              {/if}
              <button
                type="button"
                onclick={toggleSelectAll}
                class="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
              >
                {selectedWords.size === filteredWords.length && filteredWords.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>
          </div>

          <!-- Words List (Single-Column Streamlined List) -->
          <div class="flex-1 p-3.5 overflow-y-auto max-h-[600px] space-y-1.5 font-mono text-base divide-y divide-slate-800/40">
            {#if isLoading}
              <div class="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-sm">Đang tải danh sách từ...</span>
              </div>
            {:else if filteredWords.length === 0}
              <div class="text-center py-16 text-slate-500 text-sm">
                {searchQuery ? `Không tìm thấy từ nào khớp với "${searchQuery}"` : "Từ điển hiện chưa có từ nào."}
              </div>
            {:else}
              {#each filteredWords.slice(0, 500) as word (word)}
                <div
                  class="flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors {selectedWords.has(word)
                    ? 'bg-blue-500/10 text-blue-200 font-semibold'
                    : 'text-slate-200 hover:bg-slate-800/50'}"
                >
                  <label class="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedWords.has(word)}
                      onchange={() => toggleSelectWord(word)}
                      class="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                    />
                    <span class="truncate font-sans text-[20px] font-semibold text-slate-100 leading-tight">{word}</span>
                  </label>

                  {#if deleteConfirmWord === word}
                    <div class="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onclick={() => handleDeleteWords([word])}
                        class="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow"
                      >
                        Xóa
                      </button>
                      <button
                        type="button"
                        onclick={() => (deleteConfirmWord = null)}
                        class="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Hủy
                      </button>
                    </div>
                  {:else}
                    <button
                      type="button"
                      onclick={() => (deleteConfirmWord = word)}
                      class="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors shrink-0"
                      title="Xóa từ này khỏi từ điển"
                      aria-label="Xóa từ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  {/if}
                </div>
              {/each}

              {#if filteredWords.length > 500}
                <div class="p-3 text-center text-xs text-slate-500 border-t border-slate-800/80 mt-2">
                  Đang hiển thị 500 / {filteredWords.length.toLocaleString()} từ. Hãy dùng ô tìm kiếm ở trên để lọc từ cụ thể.
                </div>
              {/if}
            {/if}
          </div>
        </div>
      </div>

      <!-- Right Column: Smart Add Words Form (5 Cols) -->
      <div class="lg:col-span-5">
        <AddWordsForm
          activeDict={activeTab}
          onWordsAdded={handleWordsAdded}
        />
      </div>
    </div>
    {/if}
  {/if}
</div>

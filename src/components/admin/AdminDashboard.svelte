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

  const DICT_TABS: { id: DictSourceName; label: string; badge: string; color: string; bg: string }[] = [
    { id: "vn", label: "1. Tiếng Việt", badge: "VN", color: "text-emerald-400 border-emerald-500", bg: "bg-emerald-500/10 text-emerald-300" },
    { id: "names", label: "2. Tên riêng & Địa danh", badge: "NAMES", color: "text-amber-400 border-amber-500", bg: "bg-amber-500/10 text-amber-300" },
    { id: "non-vn", label: "3. Ngoại ngữ & Từ mượn", badge: "NON-VN", color: "text-blue-400 border-blue-500", bg: "bg-blue-500/10 text-blue-300" },
    { id: "custom", label: "4. Viết tắt & Tuỳ chỉnh", badge: "CUSTOM", color: "text-purple-400 border-purple-500", bg: "bg-purple-500/10 text-purple-300" }
  ]

  let activeTab = $state<DictSourceName>("vn")
  let authStatus = $state<AuthStatusResponse>({
    authenticated: false,
    authType: "none",
    email: null,
    hasTokenConfigured: false
  })

  let isCheckingAuth = $state(true)
  let isLoading = $state(true)
  let searchQuery = $state("")
  let currentDictData = $state<DictDetailResponse | null>(null)
  let selectedWords = $state<Set<string>>(new Set())
  let isDeleting = $state(false)
  let deleteConfirmWord = $state<string | null>(null)
  let tokenInput = $state(appState.dictAdminToken)

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
      currentDictData = await fetchDictionaryDetails(dict)
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
    searchQuery = ""
    loadDictionaryWords(tab)
  }

  function handleSaveToken() {
    appState.dictAdminToken = tokenInput.trim()
    localStorage.setItem("spell-check:dict-admin-token", appState.dictAdminToken)
    loadAuth()
    appState.showToast("Đã lưu token quản trị", "success")
  }

  function triggerCloudflareLogin() {
    // Navigating directly to /api/dict/vn triggers the Cloudflare Access Google login wall
    window.location.href = "/api/dict/vn"
  }

  let filteredWords = $derived.by(() => {
    if (!currentDictData) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return currentDictData.words
    return currentDictData.words.filter((w) => w.toLowerCase().includes(q))
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
      {#if authStatus.authType === "cloudflare-access"}
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Gmail: <strong>{authStatus.email ?? 'Cloudflare Access'}</strong></span>
        </div>
      {:else if authStatus.authType === "token"}
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium">
          <span class="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>Admin Token (Hợp lệ)</span>
        </div>
      {/if}
    </div>
  </div>

  {#if isCheckingAuth}
    <!-- Loading Auth State -->
    <div class="flex flex-col items-center justify-center py-28 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <div class="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span class="text-sm text-slate-400">Đang kiểm tra xác thực quyền quản trị...</span>
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
        <h3 class="text-xl font-bold text-white">Yêu Cầu Xác Thực Quản Trị</h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          Khu vực này được bảo vệ bởi <strong>Cloudflare Zero Trust</strong>. Bạn cần đăng nhập bằng tài khoản Gmail được cấp quyền để xem và chỉnh sửa từ điển.
        </p>
      </div>

      <!-- Cloudflare Login Button -->
      <button
        type="button"
        onclick={triggerCloudflareLogin}
        class="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        <span>Đăng nhập bằng Gmail (Cloudflare Access)</span>
      </button>

      <!-- Token Fallback (Accordion / Subdued) -->
      <div class="pt-4 border-t border-slate-800 text-left space-y-2">
        <span class="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Hoặc sử dụng ADMIN_TOKEN bí mật:
        </span>
        <div class="flex gap-2">
          <input
            type="password"
            bind:value={tokenInput}
            placeholder="Nhập ADMIN_TOKEN"
            class="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            type="button"
            onclick={handleSaveToken}
            class="px-4 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  {:else}
    <!-- Main 2-Column Layout (Only shown after successful login) -->
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

        <!-- Word Explorer Card -->
        <div class="flex-1 flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden min-h-[500px]">
          <!-- Search & Action Bar -->
          <div class="p-4 border-b border-slate-800 bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="relative w-full sm:w-72">
              <input
                type="text"
                bind:value={searchQuery}
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

          <!-- Words List (Scrollable) -->
          <div class="flex-1 p-4 overflow-y-auto max-h-[600px] space-y-1 font-mono text-sm">
            {#if isLoading}
              <div class="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
                <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Đang tải danh sách từ...</span>
              </div>
            {:else if filteredWords.length === 0}
              <div class="text-center py-16 text-slate-500">
                {searchQuery ? `Không tìm thấy từ nào khớp với "${searchQuery}"` : "Từ điển hiện chưa có từ nào."}
              </div>
            {:else}
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {#each filteredWords.slice(0, 500) as word (word)}
                  <div
                    class="flex items-center justify-between px-3 py-1.5 rounded-lg border transition-colors {selectedWords.has(word)
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-200'
                      : 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'}"
                  >
                    <label class="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedWords.has(word)}
                        onchange={() => toggleSelectWord(word)}
                        class="rounded border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-900"
                      />
                      <span class="truncate">{word}</span>
                    </label>

                    {#if deleteConfirmWord === word}
                      <div class="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onclick={() => handleDeleteWords([word])}
                          class="px-2 py-0.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors"
                        >
                          Xóa
                        </button>
                        <button
                          type="button"
                          onclick={() => (deleteConfirmWord = null)}
                          class="px-1.5 py-0.5 text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          Hủy
                        </button>
                      </div>
                    {:else}
                      <button
                        type="button"
                        onclick={() => (deleteConfirmWord = word)}
                        class="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors shrink-0"
                        title="Xóa từ này khỏi từ điển"
                        aria-label="Xóa từ"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>

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
</div>

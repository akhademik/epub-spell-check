<script lang="ts">
  import { TAG_COLORS } from "../constants"
  import { appState } from "../state.svelte"

  let newWordInput = $state("")
  let importFileInput: HTMLInputElement | undefined = $state()

  function simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash)
  }

  function getTagColor(word: string): string {
    const idx = simpleHash(word) % TAG_COLORS.length
    return TAG_COLORS[idx]
  }

  function handleAddWord(event: Event) {
    event.preventDefault()
    if (newWordInput.trim()) {
      if (appState.addWhitelistWord(newWordInput.trim())) {
        appState.showToast(`Đã thêm "${newWordInput.trim()}" vào danh sách bỏ qua.`, "success")
        newWordInput = ""
      } else {
        appState.showToast(`Từ "${newWordInput.trim()}" đã có trong danh sách.`, "info")
      }
    }
  }

  function handleFileImport(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      appState.importWhitelist(file)
      target.value = ""
    }
  }
</script>

<div class="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div class="flex items-center gap-2">
      <div class="p-1.5 bg-slate-800 rounded-lg text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h3 class="text-sm font-bold text-slate-100">Danh sách từ bỏ soát lỗi (Whitelist)</h3>
        <p class="text-xs text-slate-400">Các từ trong danh sách này sẽ không bao giờ bị báo lỗi ({appState.whitelist.length} từ)</p>
      </div>
    </div>

    <!-- Actions: Import, Export, Clear -->
    <div class="flex items-center gap-2">
      <input
        bind:this={importFileInput}
        type="file"
        accept=".txt,.md"
        class="hidden"
        onchange={handleFileImport}
      />
      <button
        type="button"
        onclick={() => importFileInput?.click()}
        class="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
        title="Nhập danh sách từ file .txt / .md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>Nhập file</span>
      </button>

      <button
        type="button"
        onclick={() => appState.exportWhitelist()}
        class="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
        title="Tải về danh sách từ bỏ qua"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Tải về</span>
      </button>

      {#if appState.whitelist.length > 0}
        <button
          type="button"
          onclick={() => appState.openModal("clear-whitelist")}
          class="px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 rounded-xl border border-rose-800/60 transition-colors"
          title="Xoá toàn bộ danh sách"
        >
          Xoá hết
        </button>
      {/if}
    </div>
  </div>

  <!-- Add word form -->
  <form onsubmit={handleAddWord} class="flex gap-2">
    <input
      type="text"
      bind:value={newWordInput}
      placeholder="Nhập từ muốn bỏ qua rồi bấm Enter hoặc Thêm..."
      class="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
    />
    <button
      type="submit"
      class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-colors shadow-md shadow-blue-900/20"
    >
      Thêm từ
    </button>
  </form>

  <!-- Tags Container -->
  {#if appState.whitelist.length === 0}
    <div class="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
      Chưa có từ nào trong danh sách bỏ qua. Nhấn nút Bỏ qua bên cạnh từ lỗi hoặc thêm từ ở trên.
    </div>
  {:else}
    <div class="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
      {#each appState.whitelist as word (word)}
        <div
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm {getTagColor(word)} transition-transform hover:scale-105"
        >
          <span>{word}</span>
          <button
            type="button"
            onclick={() => appState.removeWhitelistWord(word)}
            class="opacity-70 hover:opacity-100 transition-opacity ml-0.5 text-sm font-bold leading-none"
            title="Xóa '{word}' khỏi danh sách bỏ qua"
            aria-label="Xóa từ"
          >
            &times;
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<script lang="ts">
  import { appState } from "../state.svelte"
  import type { ErrorGroup, ErrorType } from "../types/errors"

  let searchQuery = $state("")
  let sortMode = $state<"count" | "az" | "za">("count")
  let typeFilter = $state<"all" | ErrorType>("all")
  let visibleCount = $state(30)

  function getDotColor(type: string): string {
    switch (type) {
      case "Dictionary":
        return "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
      case "NonVietnamese":
        return "bg-blue-500 shadow-[0_0_8px_#3b82f6]"
      case "Uppercase":
        return "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
      case "Typo":
        return "bg-orange-500 shadow-[0_0_8px_#f97316]"
      case "Spelling":
        return "bg-purple-500 shadow-[0_0_8px_#a855f7]"
      case "SpecialCharacter":
        return "bg-pink-500 shadow-[0_0_8px_#ec4899]"
      default:
        return "bg-slate-400 shadow-[0_0_8px_#94a3b8]"
    }
  }

  function getBadgeLabel(type: string): string {
    switch (type) {
      case "Dictionary":
        return "Từ điển VN"
      case "NonVietnamese":
        return "Ngoại ngữ"
      case "Uppercase":
        return "Viết hoa"
      case "Typo":
        return "Typo"
      case "Spelling":
        return "Chính tả"
      default:
        return "Ký tự lạ"
    }
  }

  const filteredList = $derived.by(() => {
    let list = [...appState.currentFilteredErrors]

    // Type filter
    if (typeFilter !== "all") {
      list = list.filter((g) => g.type === typeFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (g) =>
          g.word.toLowerCase().includes(q) || g.reason.toLowerCase().includes(q)
      )
    }

    // Sort order
    if (sortMode === "az") {
      list.sort((a, b) =>
        a.word.localeCompare(b.word, "vi", { sensitivity: "base" })
      )
    } else if (sortMode === "za") {
      list.sort((a, b) =>
        b.word.localeCompare(a.word, "vi", { sensitivity: "base" })
      )
    } else {
      // Default sort by frequency count descending
      list.sort((a, b) => b.count - a.count)
    }

    return list
  })

  // Lazy loaded slice capped at visibleCount
  const displayedErrors = $derived(filteredList.slice(0, visibleCount))

  function handleScroll(e: Event) {
    const target = e.target as HTMLElement
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 60) {
      if (visibleCount < filteredList.length) {
        visibleCount += 30
      }
    }
  }

  function handleSelect(group: ErrorGroup) {
    appState.selectGroup(group)
    appState.copyText(group.word)
  }

  function handleIgnore(event: MouseEvent, group: ErrorGroup) {
    event.stopPropagation()
    appState.ignoreAndAdvance(group.word, group.id)
  }
</script>

<div class="flex flex-col h-full max-h-full min-h-0 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
  <!-- Search, Filter & Sort Controls Header -->
  <div class="p-3 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-2 shrink-0">
    <div class="flex items-center gap-2">
      <!-- Search Input -->
      <div class="relative flex-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          oninput={() => (visibleCount = 30)}
          placeholder="Tìm từ lỗi..."
          class="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <!-- Count Badge -->
      <span class="text-xs font-mono px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl shrink-0 border border-slate-700 font-semibold">
        {filteredList.length} từ
      </span>
    </div>

    <!-- Category filter tags & Sort controls -->
    <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80 flex-wrap gap-2">
      <!-- Category Filter Pills -->
      <div class="flex items-center gap-1 flex-wrap overflow-x-auto py-0.5">
        <button
          type="button"
          onclick={() => { typeFilter = "all"; visibleCount = 30; }}
          class="px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors {typeFilter === 'all'
            ? 'bg-slate-700 text-white font-bold'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
        >
          Tất cả
        </button>
        <button
          type="button"
          onclick={() => { typeFilter = "Dictionary"; visibleCount = 30; }}
          class="px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors {typeFilter === 'Dictionary'
            ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60 font-bold'
            : 'text-slate-400 hover:text-rose-300'}"
          title="Lỗi không có trong từ điển tiếng Việt"
        >
          Từ điển VN
        </button>
        <button
          type="button"
          onclick={() => { typeFilter = "NonVietnamese"; visibleCount = 30; }}
          class="px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors {typeFilter === 'NonVietnamese'
            ? 'bg-blue-900/60 text-blue-300 border border-blue-700/60 font-bold'
            : 'text-slate-400 hover:text-blue-300'}"
          title="Lỗi ngoại ngữ / từ lạ"
        >
          Ngoại ngữ
        </button>
        <button
          type="button"
          onclick={() => { typeFilter = "Uppercase"; visibleCount = 30; }}
          class="px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors {typeFilter === 'Uppercase'
            ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60 font-bold'
            : 'text-slate-400 hover:text-amber-300'}"
          title="Lỗi viết hoa"
        >
          Viết hoa
        </button>
        <button
          type="button"
          onclick={() => { typeFilter = "Typo"; visibleCount = 30; }}
          class="px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors {typeFilter === 'Typo'
            ? 'bg-orange-900/60 text-orange-300 border border-orange-700/60 font-bold'
            : 'text-slate-400 hover:text-orange-300'}"
          title="Lỗi gõ máy typo"
        >
          Typo
        </button>
        <button
          type="button"
          onclick={() => { typeFilter = "Spelling"; visibleCount = 30; }}
          class="px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors {typeFilter === 'Spelling'
            ? 'bg-purple-900/60 text-purple-300 border border-purple-700/60 font-bold'
            : 'text-slate-400 hover:text-purple-300'}"
          title="Sai quy tắc ngữ âm chính tả"
        >
          Chính tả
        </button>
      </div>

      <!-- Sort buttons -->
      <div class="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 ml-auto">
        <button
          type="button"
          onclick={() => { sortMode = "count"; visibleCount = 30; }}
          class="px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors {sortMode === 'count'
            ? 'bg-blue-600 text-white font-bold'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
          title="Sắp xếp theo số lần xuất hiện giảm dần"
        >
          Số lần
        </button>
        <button
          type="button"
          onclick={() => { sortMode = "az"; visibleCount = 30; }}
          class="px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors {sortMode === 'az'
            ? 'bg-blue-600 text-white font-bold'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
          title="Sắp xếp theo thứ tự A → Z"
        >
          A → Z
        </button>
        <button
          type="button"
          onclick={() => { sortMode = "za"; visibleCount = 30; }}
          class="px-2 py-0.5 rounded-md font-medium text-[11px] transition-colors {sortMode === 'za'
            ? 'bg-blue-600 text-white font-bold'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}"
          title="Sắp xếp theo thứ tự Z → A"
        >
          Z → A
        </button>
      </div>
    </div>
  </div>

  <!-- Error Items List with Strictly Bounded Height, Soft Scrolling, and Bottom Padding -->
  <div
    class="flex-1 min-h-0 overflow-y-auto p-3 pb-8 space-y-2 overscroll-contain"
    onscroll={handleScroll}
    tabindex="-1"
  >
    {#if displayedErrors.length === 0}
      <div class="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
        <svg class="w-12 h-12 mb-3 opacity-30 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-base font-semibold text-slate-300">Tuyệt vời!</p>
        <p class="text-xs mt-1 text-slate-500">Không tìm thấy lỗi chính tả nào.</p>
      </div>
    {:else}
      {#each displayedErrors as group (group.id)}
        {@const isSelected = appState.currentGroup?.id === group.id}
        <div
          class="flex items-stretch w-full rounded-xl transition-all duration-150 border {isSelected
            ? 'bg-blue-950/60 border-blue-600 shadow-md shadow-blue-950/50'
            : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'}"
        >
          <!-- Select Button -->
          <button
            type="button"
            onclick={() => handleSelect(group)}
            class="flex items-center justify-between flex-grow px-3 py-2.5 text-left rounded-l-xl focus:outline-none min-w-0"
          >
            <div class="w-full overflow-hidden">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full shrink-0 {getDotColor(group.type)}"></span>
                <span class="font-serif text-base font-bold truncate {isSelected ? 'text-blue-200' : 'text-slate-200'}">
                  {group.word}
                </span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-700/60 shrink-0 font-medium">
                  {getBadgeLabel(group.type)}
                </span>
                <span class="ml-auto bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {group.contexts.length}
                </span>
              </div>
              {#if typeFilter === "all"}
                <div class="mt-0.5 text-[11px] truncate text-slate-400">
                  {group.reason}
                </div>
              {/if}
            </div>
          </button>

          <!-- Ignore (Whitelist) Button -->
          <button
            type="button"
            onclick={(e) => handleIgnore(e, group)}
            class="flex items-center justify-center px-2.5 transition-colors rounded-r-xl text-slate-500 hover:text-emerald-400 hover:bg-slate-800"
            title="Bỏ qua từ này (Whitelist)"
            aria-label="Bỏ qua"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>
          </button>
        </div>
      {/each}

      {#if visibleCount < filteredList.length}
        <div class="py-3 text-center text-xs text-slate-500">
          Đang hiển thị {displayedErrors.length} / {filteredList.length} từ (Cuộn xuống để xem thêm)
        </div>
      {/if}
      <div class="h-4"></div>
    {/if}
  </div>
</div>

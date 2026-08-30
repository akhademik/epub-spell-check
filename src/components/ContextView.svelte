<script lang="ts">
  import { CONTEXT_LENGTH_CHARS } from "../constants"
  import { appState } from "../state.svelte"
  import { findSuggestions } from "../utils/analyzer"

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

  function getHighlightStyle(type: string) {
    switch (type) {
      case "Dictionary":
        return "bg-rose-500/20 text-rose-300 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
      case "NonVietnamese":
        return "bg-blue-500/20 text-blue-300 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
      case "Uppercase":
        return "bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
      case "Typo":
        return "bg-orange-500/20 text-orange-300 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]"
      case "Spelling":
        return "bg-purple-500/20 text-purple-300 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
      case "SpecialCharacter":
        return "bg-pink-500/20 text-pink-300 border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.3)]"
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500"
    }
  }

  const group = $derived(appState.currentGroup)
  const currentInstanceIndex = $derived(
    Math.min(appState.currentInstanceIndex, (group?.contexts.length || 1) - 1)
  )
  const currentContext = $derived(
    group && group.contexts.length > 0
      ? group.contexts[currentInstanceIndex >= 0 ? currentInstanceIndex : 0]
      : null
  )

  const contextSegments = $derived.by(() => {
    if (!group) return null

    if (!currentContext?.context?.originalParagraph) {
      return { prefix: "", target: group.word, suffix: "" }
    }

    const text = currentContext.context.originalParagraph
    let matchIndex = currentContext.context.matchIndex
    const wordLen = group.word.length

    if (
      matchIndex === undefined ||
      matchIndex < 0 ||
      text.substring(matchIndex, matchIndex + wordLen) !== group.word
    ) {
      matchIndex = text.indexOf(group.word)
    }

    if (matchIndex < 0) {
      return { prefix: "", target: group.word, suffix: "" }
    }

    const start = Math.max(0, matchIndex - CONTEXT_LENGTH_CHARS)
    const end = Math.min(
      text.length,
      matchIndex + wordLen + CONTEXT_LENGTH_CHARS
    )

    let prefix = text.substring(start, matchIndex)
    const target = text.substring(matchIndex, matchIndex + wordLen)
    let suffix = text.substring(matchIndex + wordLen, end)

    if (start > 0) prefix = `... ${prefix}`
    if (end < text.length) suffix = `${suffix} ...`

    return { prefix, target, suffix }
  })

  function isUpperCase(str: string): boolean {
    return str === str.toUpperCase() && str !== str.toLowerCase()
  }

  function isTitleCase(str: string): boolean {
    return (
      str.length > 0 &&
      str[0] === str[0].toUpperCase() &&
      str.slice(1) === str.slice(1).toLowerCase()
    )
  }

  const suggestions = $derived.by(() => {
    if (!group) return []
    const raw = findSuggestions(group.word, appState.dictionaries)

    const isUpper = isUpperCase(group.word)
    const isTitle = isTitleCase(group.word)

    return raw.map((s) => {
      if (isUpper) return s.toUpperCase()
      if (isTitle) return s.charAt(0).toUpperCase() + s.slice(1)
      return s
    })
  })
</script>

<div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
  <!-- Reader Top Control Bar -->
  <div class="p-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between flex-wrap gap-2 shrink-0">
    <!-- Font styling toggles -->
    <div class="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
      <button
        type="button"
        onclick={() => appState.toggleFontFamily()}
        class="px-2.5 py-1 rounded-lg transition-colors {appState.readerSettings.fontFamily === 'serif'
          ? 'bg-blue-600 text-white font-serif font-bold'
          : 'text-slate-400 hover:text-white font-sans'}"
        title="Đổi font chữ (Serif / Sans-serif)"
      >
        Serif
      </button>
      <div class="h-4 w-px bg-slate-800"></div>
      <button
        type="button"
        onclick={() => appState.setFontSize(-0.25)}
        class="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-mono font-bold"
        title="Giảm cỡ chữ"
      >
        A-
      </button>
      <span class="px-1 font-mono text-slate-400 text-[11px]">
        {appState.readerSettings.fontSize}rem
      </span>
      <button
        type="button"
        onclick={() => appState.setFontSize(0.25)}
        class="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-mono font-bold"
        title="Tăng cỡ chữ"
      >
        A+
      </button>
    </div>

    <!-- Instance pagination navigation (e.g. 1/5) -->
    {#if group && group.contexts.length > 0}
      <div class="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          type="button"
          onclick={() => appState.navigateInstance("prev")}
          disabled={group.contexts.length <= 1}
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Vị trí trước"
          aria-label="Vị trí trước"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span class="px-2 font-mono font-semibold text-slate-300">
          {currentInstanceIndex + 1}/{group.contexts.length}
        </span>

        <button
          type="button"
          onclick={() => appState.navigateInstance("next")}
          disabled={group.contexts.length <= 1}
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Vị trí kế tiếp"
          aria-label="Vị trí kế tiếp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    {/if}
  </div>

  <!-- Context Content Area -->
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center text-center">
    {#if !group || !contextSegments}
      <div class="p-6 sm:p-8 text-center text-slate-500">
        <svg class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 opacity-20 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-base sm:text-lg font-medium text-slate-300">Không có lỗi được chọn</p>
        <p class="text-xs text-slate-500 mt-1">Chọn một từ lỗi ở danh sách bên trên / bên trái để xem ngữ cảnh</p>
      </div>
    {:else}
      <div class="w-full max-w-4xl animate-fadeIn space-y-4 sm:space-y-5">
        <!-- 1. Top: Error Reason Badge with matching dot color -->
        <div class="flex items-center justify-center">
          <div class="px-3.5 py-1.5 bg-slate-950/80 text-slate-200 rounded-xl text-xs border border-slate-800 shadow-md flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full shrink-0 {getDotColor(group.type)}"></span>
            <span class="font-semibold text-slate-300">{group.reason}</span>
          </div>
        </div>

        <!-- 2. Middle: Paragraph reader box (Spacious Context) -->
        <div
          class="w-full p-5 sm:p-8 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-inner relative leading-relaxed tracking-normal text-slate-100 transition-all text-left sm:text-justify select-text"
          style="font-size: {appState.readerSettings.fontSize}rem; font-family: {appState.readerSettings.fontFamily === 'serif' ? '\"Noto Serif\", serif' : '\"Noto Sans\", sans-serif'}; line-height: 1.9;"
        >
          <span>{contextSegments.prefix}</span>
          <span
            class="px-1.5 py-0.5 rounded-lg font-bold border underline decoration-2 underline-offset-4 {getHighlightStyle(group.type)}"
          >
            {contextSegments.target}
          </span>
          <span>{contextSegments.suffix}</span>
        </div>

        <!-- 3. Below Context: Search tools (Wiktionary & Google) -->
        <div class="flex flex-wrap items-center justify-center gap-3">
          <!-- Wiktionary lookup -->
          <a
            href="https://vi.wiktionary.org/wiki/{encodeURIComponent(group.word)}"
            target="_blank"
            rel="noopener noreferrer"
            title="Tra cứu trên Wiktionary"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-400 bg-slate-800/90 hover:bg-blue-600 hover:text-white rounded-xl border border-slate-700 transition-colors shadow-md"
          >
            <img src="/piece.ico" alt="Wiktionary" class="w-4 h-4 rounded-sm" />
            <span>Wiktionary</span>
          </a>

          <!-- Google Search lookup -->
          <a
            href="https://www.google.com/search?q={encodeURIComponent(group.word)}"
            target="_blank"
            rel="noopener noreferrer"
            title="Tìm kiếm trên Google"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 bg-slate-800/90 hover:bg-emerald-600 hover:text-white rounded-xl border border-slate-700 transition-colors shadow-md"
          >
            <img src="https://www.gstatic.com/images/branding/searchlogo/ico/favicon.ico" alt="Google" class="w-4 h-4" />
            <span>Google</span>
          </a>
        </div>

        <!-- 4. Bottom: Suggestions list (click to copy) -->
        {#if suggestions.length > 0}
          <div class="pt-3 border-t border-slate-800/80">
            <div class="text-xs text-slate-400 mb-2">Gợi ý sửa từ (Nhấp để sao chép):</div>
            <div class="flex flex-wrap items-center justify-center gap-2">
              {#each suggestions as sugg}
                <button
                  type="button"
                  onclick={() => appState.copyText(sugg)}
                  class="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 rounded-xl text-sm font-semibold transition-all hover:scale-105 shadow-md"
                  title="Nhấp để sao chép '{sugg}'"
                >
                  {sugg}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

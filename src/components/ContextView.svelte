<script lang="ts">
  import { CONTEXT_LENGTH_CHARS } from "../constants"
  import { appState } from "../state.svelte"
  import { findTieredSuggestions } from "../utils/analyzer"

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

  const tieredSuggestions = $derived.by(() => {
    if (!group) return { primary: [], secondary: [] }
    const raw = findTieredSuggestions(group.word, appState.dictionaries)

    const isUpper = isUpperCase(group.word)
    const isTitle = isTitleCase(group.word)

    const formatWord = (s: string) => {
      if (isUpper) return s.toUpperCase()
      if (isTitle) return s.charAt(0).toUpperCase() + s.slice(1)
      return s
    }

    return {
      primary: raw.primary.map(formatWord),
      secondary: raw.secondary.map(formatWord)
    }
  })
  let customFixInput = $state("")

  const isCurrentInstanceResolved = $derived.by(() => {
    if (!currentContext) return false
    const key = appState.getInstanceKey(currentContext)
    return currentContext.resolved || appState.appliedFixes.has(key)
  })

  const currentAppliedWord = $derived.by(() => {
    if (!currentContext) return null
    const key = appState.getInstanceKey(currentContext)
    return appState.appliedFixes.get(key) || null
  })

  function handleCustomFix(isAll: boolean) {
    if (!customFixInput.trim()) return
    if (isAll && group) {
      appState.applyFixToAllInstances(group, customFixInput.trim())
    } else if (currentContext) {
      appState.applyFixToInstance(currentContext, customFixInput.trim())
    }
    customFixInput = ""
  }
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
      <div class="w-full max-w-4xl animate-fadeIn space-y-5">
        <!-- 1. Top Header Row: Left-aligned Error Reason Badge & Resolved Status, Right-aligned Wiktionary & Google Search tools -->
        <div class="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-3">
          <!-- Left: Error Reason & Fix Status -->
          <div class="flex items-center gap-2 flex-wrap">
            <div class="px-3.5 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs border border-slate-700 shadow-md flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full shrink-0 ml-0.5 {getDotColor(group.type)}"></span>
              <span class="font-medium text-slate-200">{group.reason}</span>
            </div>

            {#if isCurrentInstanceResolved}
              <div class="px-3 py-1.5 bg-emerald-950/80 text-emerald-300 rounded-xl text-xs border border-emerald-700/80 shadow-md flex items-center gap-2 font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Đã sửa → "{currentAppliedWord}"</span>
                {#if currentContext}
                  <button
                    type="button"
                    onclick={() => appState.undoFix(currentContext)}
                    class="ml-1 text-slate-400 hover:text-white underline text-[11px]"
                    title="Hoàn tác sửa từ này"
                  >
                    Hoàn tác
                  </button>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Right: Search Tools (Wiktionary & Google) -->
          <div class="flex items-center gap-2 ml-auto">
            <a
              href="https://vi.wiktionary.org/wiki/{encodeURIComponent(group.word)}"
              target="_blank"
              rel="noopener noreferrer"
              title="Tra cứu trên Wiktionary"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-blue-400 bg-slate-800 hover:bg-blue-600 hover:text-white rounded-xl border border-slate-700 transition-colors shadow-sm"
            >
              <img src="/piece.ico" alt="Wiktionary" class="w-3.5 h-3.5 rounded-sm" />
              <span>Wiktionary</span>
            </a>

            <a
              href="https://www.google.com/search?q={encodeURIComponent(group.word)}"
              target="_blank"
              rel="noopener noreferrer"
              title="Tìm kiếm trên Google"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-400 bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-xl border border-slate-700 transition-colors shadow-sm"
            >
              <img src="https://www.gstatic.com/images/branding/searchlogo/ico/favicon.ico" alt="Google" class="w-3.5 h-3.5" />
              <span>Google</span>
            </a>
          </div>
        </div>

        <!-- 2. Middle: Paragraph reader box (Context) -->
        <div
          class="w-full p-6 sm:p-8 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-inner relative leading-relaxed text-slate-200 transition-all text-left sm:text-justify select-text"
          style="font-size: {appState.readerSettings.fontSize}rem; font-family: {appState.readerSettings.fontFamily === 'serif' ? '\"Noto Serif\", serif' : '\"Noto Sans\", sans-serif'}; line-height: 1.8;"
        >
          <span>{contextSegments.prefix}</span>
          <span
            class="px-1.5 py-0.5 rounded-lg font-bold border underline decoration-2 underline-offset-4 {isCurrentInstanceResolved ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : getHighlightStyle(group.type)}"
          >
            {isCurrentInstanceResolved && currentAppliedWord ? currentAppliedWord : contextSegments.target}
          </span>
          <span>{contextSegments.suffix}</span>
        </div>

        <!-- 3. Bottom: Tiered Suggestion Replacement & Custom Word Fix actions -->
        <div class="pt-2 border-t border-slate-800/80 space-y-3 text-left sm:text-center">
          <!-- Tier 1: High Confidence Suggestions -->
          {#if tieredSuggestions.primary.length > 0}
            <div class="space-y-1.5">
              <div class="text-[11px] text-emerald-400/90 font-semibold flex items-center justify-center gap-1">
                <span>Khả năng cao:</span>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-2">
                {#each tieredSuggestions.primary as sugg}
                  <div class="inline-flex items-stretch rounded-xl border border-emerald-600/70 bg-emerald-950/50 overflow-hidden shadow-md">
                    <!-- Main Action: Replace single instance -->
                    <button
                      type="button"
                      onclick={() => currentContext && appState.applyFixToInstance(currentContext, sugg)}
                      class="px-3 py-1.5 text-emerald-200 hover:bg-emerald-800/70 text-sm font-semibold transition-colors flex items-center gap-1.5"
                      title="Thay từ này thành '{sugg}'"
                    >
                      <span>{sugg}</span>
                    </button>

                    <!-- Secondary Action: Replace all occurrences in book -->
                    {#if group.contexts.length > 1}
                      <button
                        type="button"
                        onclick={() => appState.applyFixToAllInstances(group, sugg)}
                        class="px-2 py-1.5 text-[11px] font-medium text-emerald-300 hover:text-white hover:bg-emerald-700/60 border-l border-emerald-600/50 transition-colors"
                        title="Thay tất cả {group.contexts.length} lần xuất hiện thành '{sugg}'"
                      >
                        all
                      </button>
                    {/if}

                    <!-- Copy button -->
                    <button
                      type="button"
                      onclick={() => appState.copyText(sugg)}
                      class="px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 border-l border-emerald-600/50 transition-colors"
                      title="Sao chép '{sugg}' vào clipboard"
                      aria-label="Sao chép"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Tier 2: Broader Suggestions (Names, related terms) -->
          {#if tieredSuggestions.secondary.length > 0}
            <div class="space-y-1.5 {tieredSuggestions.primary.length > 0 ? 'pt-1' : ''}">
              <div class="text-[11px] text-cyan-400/80 font-medium flex items-center justify-center gap-1">
                <span>Khả năng thấp:</span>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-2">
                {#each tieredSuggestions.secondary as sugg}
                  <div class="inline-flex items-stretch rounded-xl border border-cyan-800/60 bg-cyan-950/30 overflow-hidden shadow-sm">
                    <!-- Main Action: Replace single instance -->
                    <button
                      type="button"
                      onclick={() => currentContext && appState.applyFixToInstance(currentContext, sugg)}
                      class="px-3 py-1.5 text-cyan-300 hover:bg-cyan-900/50 text-sm font-semibold transition-colors flex items-center gap-1.5"
                      title="Thay từ này thành '{sugg}'"
                    >
                      <span>{sugg}</span>
                    </button>

                    <!-- Secondary Action: Replace all occurrences in book -->
                    {#if group.contexts.length > 1}
                      <button
                        type="button"
                        onclick={() => appState.applyFixToAllInstances(group, sugg)}
                        class="px-2 py-1.5 text-[11px] font-medium text-cyan-400/80 hover:text-cyan-200 hover:bg-cyan-800/50 border-l border-cyan-800/50 transition-colors"
                        title="Thay tất cả {group.contexts.length} lần xuất hiện thành '{sugg}'"
                      >
                        all
                      </button>
                    {/if}

                    <!-- Copy button -->
                    <button
                      type="button"
                      onclick={() => appState.copyText(sugg)}
                      class="px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 border-l border-cyan-800/50 transition-colors"
                      title="Sao chép '{sugg}' vào clipboard"
                      aria-label="Sao chép"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if tieredSuggestions.primary.length === 0 && tieredSuggestions.secondary.length === 0}
            <div class="text-xs text-slate-500 italic text-center">Không có gợi ý tự động phù hợp trong từ điển.</div>
          {/if}

          <!-- Custom Replace Word Input -->
          <div class="pt-2 flex items-center justify-center gap-2 max-w-md mx-auto">
            <input
              type="text"
              bind:value={customFixInput}
              onkeydown={(e) => { if (e.key === "Enter") handleCustomFix(false); }}
              placeholder="Nhập từ thay thế khác..."
              class="flex-1 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="button"
              onclick={() => handleCustomFix(false)}
              disabled={!customFixInput.trim()}
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors shrink-0 shadow-md"
              title="Thay đúng vị trí này"
            >
              Thay từ này
            </button>
            {#if group.contexts.length > 1}
              <button
                type="button"
                onclick={() => handleCustomFix(true)}
                disabled={!customFixInput.trim()}
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors shrink-0 shadow-md"
                title="Thay tất cả {group.contexts.length} lần xuất hiện"
              >
                Thay tất cả ({group.contexts.length})
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

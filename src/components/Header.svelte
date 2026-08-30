<script lang="ts">
  import { appState } from "../state.svelte"
</script>

<header class="sticky top-0 z-30 border-b shadow-md bg-slate-900/95 backdrop-blur border-slate-800">
  <div class="flex flex-wrap items-center justify-between max-w-7xl gap-4 px-4 py-3 mx-auto">
    <!-- Logo & Title -->
    <div class="flex items-center gap-3">
      <div class="p-2 text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-900/30">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-6 h-6 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          Soát Lỗi Chính Tả        
        </h1>
        <div class="text-xs font-medium text-slate-400">EPUB tiếng Việt</div>
      </div>
    </div>

    <!-- Actions & Quick Controls (Desktop: inline; Mobile: flex container with stats and action buttons) -->
    <div class="flex items-center gap-2 sm:gap-3 flex-wrap justify-between sm:justify-end w-full sm:w-auto">
      <!-- Active Dictionaries Indicator (Mobile: compact centered numbers; Desktop: labeled stats) -->
      <div
        class="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] sm:text-xs font-mono text-slate-300 mx-auto sm:mx-0"
        title="4 tầng từ điển đang hoạt động đồng thời (Tiếng Việt + Tên riêng + Ngoại ngữ + Viết tắt)"
      >
        <span class="flex items-center gap-1 text-emerald-400">
          <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
          <span><span class="hidden sm:inline">VN: </span>{appState.dictionaryStatus.vietnameseWordCount > 0 ? `${(appState.dictionaryStatus.vietnameseWordCount / 1000).toFixed(0)}k` : '...'}</span>
        </span>
        <span class="text-slate-600">|</span>
        <span class="text-amber-400">
          <span class="hidden sm:inline">Tên: </span>{appState.dictionaryStatus.namesWordCount > 0 ? `${(appState.dictionaryStatus.namesWordCount / 1000).toFixed(1)}k` : '...'}
        </span>
        <span class="text-slate-600">|</span>
        <span class="text-blue-400">
          <span class="hidden sm:inline">Ngoại ngữ: </span>{appState.dictionaryStatus.nonVietnameseWordCount > 0 ? `${(appState.dictionaryStatus.nonVietnameseWordCount / 1000).toFixed(1)}k` : '...'}
        </span>
        <span class="text-slate-600">|</span>
        <span class="text-purple-400">
          <span class="hidden sm:inline">Viết tắt: </span>{appState.dictionaryStatus.customWordCount}
        </span>
      </div>

      <!-- Action Buttons Container -->
      <div class="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">

      <!-- Help Button -->
      <button
        type="button"
        onclick={() => appState.openModal("help")}
        class="p-2 transition-colors rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        title="Hướng dẫn sử dụng"
        aria-label="Hướng dẫn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <!-- Settings Button -->
      <button
        type="button"
        onclick={() => appState.openModal("settings")}
        class="p-2 transition-colors rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 relative"
        title="Cấu hình soát lỗi"
        aria-label="Cấu hình"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {#if appState.loadedTextContent.length > 0}
        <!-- Direct 1-Click Export Errors Button (Clean text list) -->
        <button
          type="button"
          onclick={() => appState.exportErrors()}
          class="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white transition-colors rounded-xl shadow-lg bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
          title="Tải về danh sách tất cả các từ lỗi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span class="hidden sm:inline">Xuất lỗi</span>
        </button>

        <!-- Reset Button -->
        <button
          type="button"
          onclick={() => appState.resetApp()}
          class="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-xl shadow-lg hover:bg-blue-500 shadow-blue-900/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">File khác</span>
        </button>
      {/if}
      </div>
    </div>
  </div>
</header>

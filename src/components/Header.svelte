<script lang="ts">
  import { appState } from "../state.svelte"

  let fileInputElement: HTMLInputElement | undefined = $state()

  function handleFileSelected(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      appState.handleFile(file)
    }
    target.value = ""
  }
</script>

<input
  bind:this={fileInputElement}
  type="file"
  accept=".epub,.txt,.md,.markdown"
  class="hidden"
  onchange={handleFileSelected}
/>

<header class="sticky top-0 z-30 border-b shadow-md bg-slate-900/95 backdrop-blur border-slate-800">
  <div class="flex items-center justify-between max-w-7xl gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 mx-auto">
    <!-- Logo & Title (Hidden on mobile < sm, icon only on sm, full title on md+) -->
    <div class="hidden sm:flex items-center gap-3 shrink-0">
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
      <div class="hidden md:block">
        <h1 class="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          Soát Lỗi Chính Tả        
        </h1>      
      </div>
    </div>

    <!-- Actions & Quick Controls (Mobile: stats left, action buttons right; Desktop: inline right) -->
    <div class="flex items-center justify-between md:justify-end gap-2 sm:gap-3 flex-1 md:flex-initial min-w-0">
      <!-- Active Dictionaries Indicator (Mobile/Medium <= 768px: color dots + counts only; Desktop md+: labeled stats) -->
      <div
        class="flex items-center justify-start gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[10px] sm:text-xs font-mono text-slate-300 shrink-0"
        title="4 tầng từ điển đang hoạt động đồng thời (Tiếng Việt + Tên riêng + Ngoại ngữ + Viết tắt)"
      >
        <span class="flex items-center gap-1 text-emerald-400">
          <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
          <span><span class="hidden md:inline">VN: </span>{appState.dictionaryStatus.vietnameseWordCount > 0 ? `${(appState.dictionaryStatus.vietnameseWordCount / 1000).toFixed(0)}k` : '...'}</span>
        </span>
        <span class="text-slate-600">|</span>
        <span class="text-amber-400">
          <span class="hidden md:inline">Tên: </span>{appState.dictionaryStatus.namesWordCount > 0 ? `${(appState.dictionaryStatus.namesWordCount / 1000).toFixed(1)}k` : '...'}
        </span>
        <span class="text-slate-600">|</span>
        <span class="text-blue-400">
          <span class="hidden md:inline">Ngoại ngữ: </span>{appState.dictionaryStatus.nonVietnameseWordCount > 0 ? `${(appState.dictionaryStatus.nonVietnameseWordCount / 1000).toFixed(1)}k` : '...'}
        </span>
        <span class="text-slate-600">|</span>
        <span class="text-purple-400">
          <span class="hidden md:inline">Viết tắt: </span>{appState.dictionaryStatus.customWordCount}
        </span>
      </div>

      <!-- Action Buttons Container (Mobile: align right / flex-end, icon-only) -->
      <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">

      <!-- Help Button -->
      <button
        type="button"
        onclick={() => appState.openModal("help")}
        class="p-1.5 sm:p-2 transition-colors rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        title="Hướng dẫn sử dụng"
        aria-label="Hướng dẫn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <!-- Admin Dashboard Toggle Button (Desktop 768px+ only) -->
      <button
        type="button"
        onclick={() => (appState.currentView = appState.currentView === "admin" ? "main" : "admin")}
        class="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all {appState.currentView === 'admin'
          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
          : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border-slate-700'}"
        title="Mở bảng điều khiển Admin"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span>{appState.currentView === "admin" ? "Admin Page" : "Admin"}</span>
      </button>

      {#if appState.loadedTextContent.length > 0}
        <!-- Export Fixed Document Button -->
        {#if appState.appliedFixes.size > 0}
          <button
            type="button"
            onclick={() => appState.exportFixedEpub()}
            class="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-white transition-all rounded-xl shadow-md bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 shadow-emerald-900/30 animate-pulse hover:animate-none shrink-0"
            title={`Tải về tệp ${appState.fileType} đã được sửa các lỗi chính tả`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="hidden sm:inline">Xuất {appState.fileType} </span><span>({appState.appliedFixes.size})</span>
          </button>
        {/if}

        <!-- Direct 1-Click Export Errors Button (Clean text list) -->
        <button
          type="button"
          onclick={() => appState.exportErrors()}
          class="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 shrink-0"
          title="Tải về danh sách tất cả các từ lỗi"
          aria-label="Xuất lỗi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span class="hidden sm:inline">Xuất lỗi</span>
        </button>

        <!-- Choose Another File Button (Direct File Browser) -->
        <button
          type="button"
          onclick={() => fileInputElement?.click()}
          class="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-white transition-colors bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md border border-blue-500 shadow-blue-900/30 shrink-0"
          title="Chọn tệp khác để soát lỗi"
          aria-label="File khác"
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

<script lang="ts">
  import { appState } from "../state.svelte"
  import ContextView from "./ContextView.svelte"
  import ErrorList from "./ErrorList.svelte"
  import WhitelistSection from "./WhitelistSection.svelte"
</script>

<div class="w-full max-w-7xl mx-auto flex flex-col gap-5 animate-fadeIn">
  <!-- 1. Book Metadata & Stats Header Card -->
  <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
    <!-- Left: Book cover & Title/Author -->
    <div class="flex items-center gap-4 min-w-0">
      {#if appState.currentCoverUrl}
        <img
          src={appState.currentCoverUrl}
          alt={appState.currentBookTitle}
          class="w-12 h-16 object-cover rounded-lg shadow-md border border-slate-700 shrink-0"
        />
      {:else}
        <div class="w-12 h-16 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      {/if}

      <div class="min-w-0">
        <h2 class="text-lg font-bold text-slate-100 truncate" title={appState.currentBookTitle}>
          {appState.currentBookTitle || "Không rõ tên sách"}
        </h2>
        <p class="text-xs text-slate-400 truncate" title={appState.currentBookAuthor}>
          Tác giả: {appState.currentBookAuthor || "Không rõ tác giả"}
        </p>
      </div>
    </div>

    <!-- Right: Stats Counter Chips -->
    <div class="flex items-center gap-3 sm:gap-4 flex-wrap">
      <div class="px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-center">
        <div class="text-[11px] text-slate-400">Tổng số từ</div>
        <div class="text-base font-bold font-mono text-slate-200">
          {appState.totalWords.toLocaleString()}
        </div>
      </div>

      <div class="px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-center">
        <div class="text-[11px] text-slate-400">Số vị trí lỗi</div>
        <div class="text-base font-bold font-mono text-rose-400">
          {appState.totalErrorInstances.toLocaleString()}
        </div>
      </div>

      <div class="px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-center">
        <div class="text-[11px] text-slate-400">Nhóm từ lỗi</div>
        <div class="text-base font-bold font-mono text-amber-400">
          {appState.totalErrorGroups.toLocaleString()}
        </div>
      </div>
    </div>
  </div>

  <!-- 2. Fixed Whitelist / Ignore Words Section directly below Book Info Card -->
  <WhitelistSection />

  <!-- 3. Two-Column Layout: Error List (5 cols) & Context View (7 cols) -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch h-[600px] max-h-[600px] min-h-0">
    <!-- Left Column: Error List with bounded height -->
    <div class="lg:col-span-5 h-full max-h-full flex flex-col min-h-0 overflow-hidden">
      <ErrorList />
    </div>

    <!-- Right Column: Context View with bounded height -->
    <div class="lg:col-span-7 h-full max-h-full flex flex-col min-h-0 overflow-hidden">
      <ContextView />
    </div>
  </div>
</div>

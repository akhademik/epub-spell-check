<script lang="ts">
  import { appState } from "../../state.svelte"
</script>

{#if appState.activeModal === "settings"}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-title"
  >
    <button
      type="button"
      class="fixed inset-0 w-full h-full cursor-default bg-transparent border-0 p-0 m-0"
      onclick={() => appState.closeModal()}
      aria-label="Đóng cài đặt"
      tabindex="-1"
    ></button>

    <div
      class="relative z-10 w-full max-w-lg overflow-hidden border shadow-2xl bg-slate-900 border-slate-700 rounded-2xl max-h-[90vh] flex flex-col"
    >
      <div
        class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50 shrink-0"
      >
        <div class="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 id="settings-title" class="text-lg font-bold text-white">Cấu hình soát lỗi</h3>
        </div>
        <button
          type="button"
          onclick={() => appState.closeModal()}
          class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6 space-y-6 overflow-y-auto">
        <!-- Section: Active Dictionaries Info -->
        <div>
          <h4 class="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Từ điển đang sử dụng (4 tầng đồng thời)
          </h4>

          <div class="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300">
            <div class="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span class="text-emerald-400 font-medium">1. Từ điển Tiếng Việt</span>
              <span class="font-mono text-slate-400">{appState.dictionaryStatus.vietnameseWordCount.toLocaleString()} từ</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span class="text-amber-400 font-medium">2. Từ điển Tên riêng & Địa danh</span>
              <span class="font-mono text-slate-400">{appState.dictionaryStatus.namesWordCount.toLocaleString()} từ</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span class="text-blue-400 font-medium">3. Từ điển Ngoại ngữ (Anh, Pháp...)</span>
              <span class="font-mono text-slate-400">{appState.dictionaryStatus.nonVietnameseWordCount.toLocaleString()} từ</span>
            </div>
            <div class="flex items-center justify-between py-1">
              <span class="text-purple-400 font-medium">4. Từ điển Viết tắt & Tuỳ chỉnh (ATM, VIP...)</span>
              <span class="font-mono text-slate-400">{appState.dictionaryStatus.customWordCount.toLocaleString()} từ</span>
            </div>
          </div>
          <p class="text-[11px] text-slate-500 mt-2 italic">
            * Cả 4 từ điển luôn được nạp và áp dụng tự động. Hệ thống đã loại bỏ việc bắt lỗi dấu thanh kiểu mới / kiểu cũ (hòa/hoà, hóa/hoá,...).
          </p>
        </div>
      </div>

      <div class="p-4 border-t border-slate-800 bg-slate-800/50 flex justify-end shrink-0">
        <button
          type="button"
          onclick={() => appState.closeModal()}
          class="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          Xong
        </button>
      </div>
    </div>
  </div>
{/if}

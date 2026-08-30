<script lang="ts">
  import { appState } from "../../state.svelte"
</script>

{#if appState.activeModal === "help"}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    role="dialog"
    aria-modal="true"
    aria-labelledby="help-title"
  >
    <button
      type="button"
      class="fixed inset-0 w-full h-full cursor-default bg-transparent border-0 p-0 m-0"
      onclick={() => appState.closeModal()}
      aria-label="Đóng hướng dẫn"
      tabindex="-1"
    ></button>

    <div
      class="relative z-10 w-full max-w-lg overflow-hidden border shadow-2xl bg-slate-900 border-slate-700 rounded-2xl max-h-[90vh] flex flex-col"
    >
      <div
        class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50 shrink-0"
      >
        <h3 id="help-title" class="text-lg font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Hướng dẫn sử dụng
        </h3>
        <button
          type="button"
          onclick={() => appState.closeModal()}
          class="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
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

      <div class="p-6 space-y-4 overflow-y-auto text-sm text-slate-300">
        <div>
          <h4 class="font-bold text-white mb-1">1. Tải lên tệp EPUB</h4>
          <p class="text-slate-400">Kéo thả tệp .epub hoặc nhấp chuột vào vùng tải tệp để bắt đầu quét toàn bộ nội dung sách.</p>
        </div>

        <div>
          <h4 class="font-bold text-white mb-1">2. Phím tắt tiện ích</h4>
          <ul class="list-disc list-inside space-y-1 text-slate-400">
            <li><kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">↑</kbd> / <kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">↓</kbd>: Chuyển qua lại giữa các từ bị lỗi</li>
            <li><kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">Delete</kbd> hoặc <kbd class="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-xs">I</kbd>: Bỏ qua từ hiện tại (thêm vào danh sách trắng) và tự động chuyển sang từ kế tiếp</li>
          </ul>
        </div>

        <div>
          <h4 class="font-bold text-white mb-1">3. Quản lý Từ điển & Bỏ qua (Whitelist)</h4>
          <p class="text-slate-400">
            Ứng dụng hỗ trợ 3 tầng từ điển linh hoạt: Từ điển Tiếng Việt, Từ điển Ngoại ngữ (Anh, Pháp,...), và Từ điển Viết tắt / Từ riêng (ATM, VIP, ...). Bạn có thể bật/tắt từng từ điển trong phần Cấu hình.
          </p>
        </div>

        <div>
          <h4 class="font-bold text-white mb-1">4. Sao chép gợi ý</h4>
          <p class="text-slate-400">Nhấp chuột trực tiếp vào bất kỳ từ gợi ý nào (màu xanh lá) để tự động sao chép từ đó vào Clipboard.</p>
        </div>
      </div>

      <div class="p-4 border-t border-slate-800 bg-slate-800/50 flex justify-end shrink-0">
        <button
          type="button"
          onclick={() => appState.closeModal()}
          class="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  </div>
{/if}

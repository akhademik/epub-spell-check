<script lang="ts">
  import { appState } from "../../state.svelte"
</script>

{#if appState.activeModal === "clear-whitelist"}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    role="dialog"
    aria-modal="true"
    aria-labelledby="clear-title"
  >
    <button
      type="button"
      class="fixed inset-0 w-full h-full cursor-default bg-transparent border-0 p-0 m-0"
      onclick={() => appState.closeModal()}
      aria-label="Đóng xác nhận"
      tabindex="-1"
    ></button>

    <div
      class="relative z-10 w-full max-w-sm overflow-hidden border shadow-2xl bg-slate-900 border-slate-700 rounded-2xl"
    >
      <div
        class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50"
      >
        <h3 id="clear-title" class="text-lg font-bold text-rose-400 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Xác nhận xóa
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

      <div class="p-6">
        <p class="text-sm text-slate-300">
          Bạn có chắc chắn muốn xóa toàn bộ ({appState.whitelist.length}) từ trong danh sách bỏ qua không?
        </p>
      </div>

      <div class="p-4 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-3">
        <button
          type="button"
          onclick={() => appState.closeModal()}
          class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
        >
          Hủy
        </button>
        <button
          type="button"
          onclick={() => appState.clearWhitelist()}
          class="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-lg shadow-rose-900/20"
        >
          Xóa toàn bộ
        </button>
      </div>
    </div>
  </div>
{/if}

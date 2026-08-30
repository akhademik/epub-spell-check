<script lang="ts">
  import { appState } from "../state.svelte"
</script>

<div
  class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
  aria-live="polite"
>
  {#each appState.toasts as toast (toast.id)}
    <div
      class="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300 text-sm font-medium animate-fadeIn {toast.type === 'success'
        ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
        : toast.type === 'error'
          ? 'bg-rose-950/90 border-rose-700 text-rose-200'
          : 'bg-slate-900/90 border-slate-700 text-slate-200'}"
    >
      <div class="flex items-center gap-2">
        {#if toast.type === "success"}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        {:else if toast.type === "error"}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {/if}
        <span>{toast.message}</span>
      </div>
      <button
        type="button"
        onclick={() => appState.removeToast(toast.id)}
        class="opacity-60 hover:opacity-100 transition-opacity ml-2"
        aria-label="Đóng thông báo"
      >
        &times;
      </button>
    </div>
  {/each}
</div>

<style>
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fadeIn {
    animation: fadeIn 0.25s ease-out;
  }
</style>

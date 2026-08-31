<script lang="ts">
  import { appState } from "../state.svelte"
</script>

<div
  class="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5 pointer-events-none max-w-xs w-full"
  aria-live="polite"
>
  {#each appState.toasts as toast (toast.id)}
    <div
      class="pointer-events-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg shadow-lg border backdrop-blur-md transition-all duration-200 text-xs font-medium animate-fadeIn {toast.type === 'success'
        ? 'bg-emerald-950/90 border-emerald-700/80 text-emerald-300'
        : toast.type === 'error'
          ? 'bg-rose-950/90 border-rose-700/80 text-rose-300'
          : 'bg-slate-900/90 border-slate-700/80 text-slate-300'}"
    >
      <div class="flex items-center gap-1.5 min-w-0">
        {#if toast.type === "success"}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        {:else if toast.type === "error"}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        {/if}
        <span class="truncate">{toast.message}</span>
      </div>
      <button
        type="button"
        onclick={() => appState.removeToast(toast.id)}
        class="opacity-50 hover:opacity-100 transition-opacity ml-1.5 text-sm leading-none shrink-0"
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

<script lang="ts">
  import { appState } from "../state.svelte"
</script>

<div class="w-full max-w-xl mx-auto my-auto py-16 px-4 animate-fadeIn">
  <div class="flex flex-col items-center p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center">
    <div class="relative w-16 h-16 mb-6">
      <svg
        class="w-16 h-16 text-blue-500 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <div class="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-blue-300">
        {appState.progressPercent}%
      </div>
    </div>

    <h3 class="text-xl font-bold text-slate-100 mb-2">Đang phân tích sách điện tử</h3>
    <p class="text-sm text-slate-400 mb-6 font-mono">{appState.progressStatus}</p>

    <!-- Progress Bar -->
    <div class="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
      <div
        class="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full transition-all duration-300 shadow-md shadow-blue-500/30"
        style="width: {appState.progressPercent}%"
      ></div>
    </div>
  </div>
</div>

<script lang="ts">
  import type { DictSourceName } from "../../utils/dict-admin"
  import { appState } from "../../state.svelte"

  const DICT_OPTIONS: { value: DictSourceName; label: string; color: string }[] = [
    { value: "vn", label: "1. Tiếng Việt", color: "text-emerald-400" },
    { value: "names", label: "2. Tên riêng & Địa danh", color: "text-amber-400" },
    { value: "non-vn", label: "3. Ngoại ngữ & Từ mượn", color: "text-blue-400" },
    { value: "custom", label: "4. Viết tắt & Tuỳ chỉnh", color: "text-purple-400" }
  ]

  let selectedDict = $state<DictSourceName>("vn")
  let action = $state<"add" | "remove">("add")
  let wordsInput = $state("")
  let token = $state(appState.dictAdminToken)

  async function handleSubmit() {
    const success = await appState.addWordsToDictionary(
      selectedDict,
      wordsInput,
      token,
      action
    )
    if (success) {
      wordsInput = ""
    }
  }
</script>

{#if appState.activeModal === "dict"}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dict-admin-title"
  >
    <button
      type="button"
      class="fixed inset-0 w-full h-full cursor-default bg-transparent border-0 p-0 m-0"
      onclick={() => appState.closeModal()}
      aria-label="Đóng"
      tabindex="-1"
    ></button>

    <div
      class="relative z-10 w-full max-w-lg overflow-hidden border shadow-2xl bg-slate-900 border-slate-700 rounded-2xl max-h-[90vh] flex flex-col"
    >
      <div
        class="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50 shrink-0"
      >
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 id="dict-admin-title" class="text-lg font-bold text-white">Cập nhật từ điển</h3>
        </div>
        <button
          type="button"
          onclick={() => appState.closeModal()}
          class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6 space-y-5 overflow-y-auto">
        <p class="text-xs text-slate-400">
          Thêm hoặc xóa từ trực tiếp trên máy chủ (Cloudflare KV) — từ điển cập nhật ngay,
          không cần commit hay build lại app. Cần <span class="font-mono text-slate-300">Mã truy cập</span>
          đã cấu hình ở biến môi trường <span class="font-mono text-slate-300">ADMIN_TOKEN</span>.
        </p>

        <!-- Dictionary picker -->
        <div>
          <span class="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Chọn từ điển
          </span>
          <div class="grid grid-cols-1 gap-2">
            {#each DICT_OPTIONS as opt (opt.value)}
              <button
                type="button"
                onclick={() => (selectedDict = opt.value)}
                class="flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-colors {selectedDict === opt.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}"
              >
                <span class="{opt.color} font-medium">{opt.label}</span>
                {#if selectedDict === opt.value}
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <!-- Add / remove toggle -->
        <div class="flex items-center gap-2 text-sm">
          <button
            type="button"
            onclick={() => (action = "add")}
            class="flex-1 px-3 py-2 rounded-xl border transition-colors {action === 'add'
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'}"
          >
            + Thêm từ
          </button>
          <button
            type="button"
            onclick={() => (action = "remove")}
            class="flex-1 px-3 py-2 rounded-xl border transition-colors {action === 'remove'
              ? 'border-rose-500 bg-rose-500/10 text-rose-300'
              : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'}"
          >
            − Xóa từ
          </button>
        </div>

        <!-- Words textarea -->
        <div>
          <label for="dict-words" class="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Danh sách từ (mỗi từ 1 dòng)
          </label>
          <textarea
            id="dict-words"
            bind:value={wordsInput}
            rows="6"
            placeholder={"ví dụ:\nchằng chịt\nngoằn ngoèo"}
            class="w-full px-3 py-2 text-sm bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          ></textarea>
        </div>

        <!-- Token -->
        <div>
          <label for="dict-token" class="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Mã truy cập (ADMIN_TOKEN)
          </label>
          <input
            id="dict-token"
            type="password"
            bind:value={token}
            placeholder="Nhập token quản trị"
            class="w-full px-3 py-2 text-sm bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <p class="text-[11px] text-slate-500 mt-1.5 italic">
            Token được lưu trên trình duyệt này để lần sau không cần nhập lại.
          </p>
        </div>
      </div>

      <div class="p-4 border-t border-slate-800 bg-slate-800/50 flex justify-end gap-2 shrink-0">
        <button
          type="button"
          onclick={() => appState.closeModal()}
          class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-xl transition-colors"
        >
          Đóng
        </button>
        <button
          type="button"
          disabled={appState.isUpdatingDictionary}
          onclick={handleSubmit}
          class="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-blue-900/20"
        >
          {appState.isUpdatingDictionary ? "Đang lưu..." : action === "add" ? "Thêm vào từ điển" : "Xóa khỏi từ điển"}
        </button>
      </div>
    </div>
  </div>
{/if}

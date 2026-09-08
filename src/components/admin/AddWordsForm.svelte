<script lang="ts">
  import { validateBatchWords } from "../../utils/dict-validator"
  import type { DictSourceName } from "../../utils/dict-admin"
  import { appState } from "../../state.svelte"

  interface Props {
    activeDict: DictSourceName
    onWordsAdded?: () => void
  }

  const { activeDict, onWordsAdded }: Props = $props()

  const DICT_NAMES_MAP: Record<DictSourceName, string> = {
    vn: "Tiếng Việt (vn-dict)",
    names: "Tên riêng & Địa danh (names-dict)",
    "non-vn": "Ngoại ngữ & Từ mượn (non-vn-dict)",
    custom: "Viết tắt & Tuỳ chỉnh (custom-dict)"
  }

  let wordsInput = $state("")
  let isSaving = $state(false)
  let confirmWarnings = $state(false)

  // Real-time analysis of the input textarea
  let rawWordsList = $derived.by(() => {
    return wordsInput
      .split(/\r?\n/)
      .map((w) => w.trim())
      .filter(Boolean)
  })

  let validationSummary = $derived.by(() => {
    if (rawWordsList.length === 0) {
      return { valid: [], warnings: [], rejected: [] }
    }
    return validateBatchWords(activeDict, rawWordsList)
  })

  async function handleAddWords() {
    if (validationSummary.valid.length === 0) {
      appState.showToast("Không có từ hợp lệ nào để thêm.", "error")
      return
    }

    if (validationSummary.warnings.length > 0 && !confirmWarnings) {
      appState.showToast(
        "Vui lòng tích xác nhận đồng ý các từ cảnh báo trước khi lưu.",
        "info"
      )
      return
    }

    isSaving = true
    try {
      const success = await appState.addWordsToDictionary(
        activeDict,
        validationSummary.valid.join("\n"),
        appState.dictAdminToken,
        "add"
      )

      if (success) {
        wordsInput = ""
        confirmWarnings = false
        onWordsAdded?.()
      }
    } finally {
      isSaving = false
    }
  }
</script>

<div class="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full space-y-4 p-5">
  <div class="border-b border-slate-800 pb-3 flex items-center justify-between">
    <div>
      <h3 class="text-base font-bold text-white flex items-center gap-2">
        <span>+ Thêm Từ Mới</span>
      </h3>
      <p class="text-xs text-slate-400 mt-0.5">
        Đang thêm vào: <strong class="text-blue-400">{DICT_NAMES_MAP[activeDict]}</strong>
      </p>
    </div>
    {#if rawWordsList.length > 0}
      <span class="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
        {rawWordsList.length} từ đã nhập
      </span>
    {/if}
  </div>

  <!-- Textarea Input -->
  <div class="space-y-2">
    <label for="admin-add-words" class="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
      Danh sách từ (mỗi từ một dòng)
    </label>
    <textarea
      id="admin-add-words"
      bind:value={wordsInput}
      rows="7"
      placeholder={`Dán danh sách từ vào đây, ví dụ:\nchằng chịt\nngoằn ngoèo\nkhúc khuỷu`}
      class="w-full px-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    ></textarea>
  </div>

  <!-- Live Validation & Analysis Report -->
  {#if rawWordsList.length > 0}
    <div class="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
      <div class="flex items-center justify-between text-slate-300 font-sans font-semibold">
        <span>Kết quả phân tích kiểm tra từ:</span>
        <div class="flex items-center gap-3 text-[11px]">
          <span class="text-emerald-400">✓ {validationSummary.valid.length} Hợp lệ</span>
          {#if validationSummary.warnings.length > 0}
            <span class="text-amber-400">⚠ {validationSummary.warnings.length} Cảnh báo</span>
          {/if}
          {#if validationSummary.rejected.length > 0}
            <span class="text-rose-400">✕ {validationSummary.rejected.length} Bị loại</span>
          {/if}
        </div>
      </div>

      <!-- Rejected List -->
      {#if validationSummary.rejected.length > 0}
        <div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
          <div class="font-bold flex items-center gap-1.5 font-sans">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            Từ bị loại bỏ (Không lưu vào từ điển):
          </div>
          <div class="space-y-0.5 max-h-24 overflow-y-auto pl-5">
            {#each validationSummary.rejected as rej (rej.word)}
              <div>
                <strong>{rej.word}</strong>: <span class="text-rose-400/80">{rej.reason}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Warnings List -->
      {#if validationSummary.warnings.length > 0}
        <div class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
          <div class="font-bold flex items-center gap-1.5 font-sans">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            Từ cảnh báo nghi vấn (Cần xác nhận):
          </div>
          <div class="space-y-0.5 max-h-24 overflow-y-auto pl-5">
            {#each validationSummary.warnings as warn (warn.word)}
              <div>
                <strong>{warn.word}</strong>: <span class="text-amber-400/80">{warn.reason}</span>
              </div>
            {/each}
          </div>

          <label class="flex items-center gap-2 pt-1 border-t border-amber-500/20 cursor-pointer font-sans text-[11px] text-amber-200">
            <input
              type="checkbox"
              bind:checked={confirmWarnings}
              class="rounded border-amber-500 text-amber-500 bg-slate-900 focus:ring-0"
            />
            <span>Tôi xác nhận các từ cảnh báo trên là từ chính xác và muốn lưu.</span>
          </label>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Action Button -->
  <div class="pt-2">
    <button
      type="button"
      disabled={isSaving || rawWordsList.length === 0 || validationSummary.valid.length === 0 || (validationSummary.warnings.length > 0 && !confirmWarnings)}
      onclick={handleAddWords}
      class="w-full py-2.5 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
    >
      {#if isSaving}
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Đang lưu vào Cloudflare KV...</span>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Lưu {validationSummary.valid.length} Từ Vào Từ Điển</span>
      {/if}
    </button>
  </div>
</div>

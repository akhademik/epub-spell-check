<script lang="ts">
  import {
    parseSectionedText,
    validateBatchWords,
    type SectionParsedWords
  } from "../../utils/dict-validator"
  import type { DictSourceName } from "../../utils/dict-admin"
  import { appState } from "../../state.svelte"

  interface Props {
    activeDict: DictSourceName
    onWordsAdded?: () => void
  }

  const { activeDict, onWordsAdded }: Props = $props()

  const DICT_NAMES_MAP: Record<DictSourceName, string> = {
    vn: "1. Tiếng Việt (VN)",
    names: "2. Tên riêng & Địa danh (NAMES)",
    "non-vn": "3. Ngoại ngữ & Từ mượn (NON-VN)",
    custom: "4. Viết tắt & Tuỳ chỉnh (CUSTOM)"
  }

  let wordsInput = $state("")
  let isSaving = $state(false)
  let confirmWarnings = $state(false)
  let importMode = $state<"single" | "sectioned">("single")
  let fileInputRef: HTMLInputElement | null = null

  // Check if the input contains section headers (e.g. ---NAMES---, ---VN---)
  $effect(() => {
    if (/(?:\\---|---)[A-Za-z0-9_-]+(?:\\---|---)?/.test(wordsInput)) {
      importMode = "sectioned"
    }
  })

  // Parse according to mode
  let sectionedData = $derived.by(() => {
    if (importMode === "sectioned") {
      return parseSectionedText(wordsInput)
    }
    const lines = wordsInput.split(/\r?\n/).map((w) => w.trim()).filter(Boolean)
    const result: SectionParsedWords = { vn: [], names: [], "non-vn": [], custom: [] }
    result[activeDict] = lines
    return result
  })

  // Validation report per section
  let validationReports = $derived.by(() => {
    return {
      vn: validateBatchWords("vn", sectionedData.vn),
      names: validateBatchWords("names", sectionedData.names),
      "non-vn": validateBatchWords("non-vn", sectionedData["non-vn"]),
      custom: validateBatchWords("custom", sectionedData.custom)
    }
  })

  let totalValidCount = $derived(
    validationReports.vn.valid.length +
    validationReports.names.valid.length +
    validationReports["non-vn"].valid.length +
    validationReports.custom.valid.length
  )

  let totalWarningCount = $derived(
    validationReports.vn.warnings.length +
    validationReports.names.warnings.length +
    validationReports["non-vn"].warnings.length +
    validationReports.custom.warnings.length
  )

  let totalRejectedCount = $derived(
    validationReports.vn.rejected.length +
    validationReports.names.rejected.length +
    validationReports["non-vn"].rejected.length +
    validationReports.custom.rejected.length
  )

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      wordsInput = text
      appState.showToast(`Đã nạp file: ${file.name}`, "info")
    } catch {
      appState.showToast("Không thể đọc tệp văn bản này.", "error")
    } finally {
      if (fileInputRef) fileInputRef.value = ""
    }
  }

  async function handleAddWords() {
    if (totalValidCount === 0) {
      appState.showToast("Không có từ hợp lệ nào để thêm.", "error")
      return
    }

    if (totalWarningCount > 0 && !confirmWarnings) {
      appState.showToast(
        "Vui lòng xác nhận đồng ý các từ cảnh báo trước khi lưu.",
        "info"
      )
      return
    }

    isSaving = true
    try {
      const sectionsToSave: DictSourceName[] = ["vn", "names", "non-vn", "custom"]
      let savedAny = false

      for (const key of sectionsToSave) {
        const words = validationReports[key].valid
        if (words.length > 0) {
          const success = await appState.addWordsToDictionary(
            key,
            words.join("\n"),
            appState.dictAdminToken,
            "add"
          )
          if (success) savedAny = true
        }
      }

      if (savedAny) {
        wordsInput = ""
        confirmWarnings = false
        importMode = "single"
        onWordsAdded?.()
      }
    } finally {
      isSaving = false
    }
  }
</script>

<div class="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full space-y-4 p-5">
  <!-- Header & Import Controls -->
  <div class="border-b border-slate-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
    <div>
      <h3 class="text-base font-bold text-white flex items-center gap-2">
        <span>+ Thêm Từ Vào Từ Điển</span>
      </h3>
      <p class="text-xs text-slate-400 mt-0.5">
        {#if importMode === "sectioned"}
          Chế độ đa từ điển: <span class="text-amber-400 font-medium">Tự động phân loại theo header (---VN---, ---NAMES---...)</span>
        {:else}
          Đang thêm vào: <strong class="text-blue-400">{DICT_NAMES_MAP[activeDict]}</strong>
        {/if}
      </p>
    </div>

    <!-- File Upload Button -->
    <div class="flex items-center gap-2">
      <input
        type="file"
        accept=".txt,.md"
        bind:this={fileInputRef}
        onchange={handleFileUpload}
        class="hidden"
      />
      <button
        type="button"
        onclick={() => fileInputRef?.click()}
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
        title="Nhập file .txt/.md chứa header phân loại"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>Nhập File .txt / .md</span>
      </button>
    </div>
  </div>

  <!-- Textarea Input -->
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label for="admin-add-words" class="block text-xs font-semibold tracking-wider text-slate-400 uppercase">
        Danh sách từ hoặc dán tệp có header:
      </label>
      <span class="text-[11px] text-slate-500 font-mono">
        Hỗ trợ: ---VN---, ---NAMES---, ---NON-VN---, ---CUSTOM---
      </span>
    </div>
    <textarea
      id="admin-add-words"
      bind:value={wordsInput}
      rows="7"
      placeholder={`Dán từ đơn giản (mỗi dòng 1 từ) HOẶC dán định dạng có phân loại:\n\n---NAMES---\nAlexander\nHà Nội\n\n---VN---\nchằng chịt\nngoằn ngoèo\n\n---NON-VN---\ninternet\nsmartphone\n\n---CUSTOM---\nAI\nVIP`}
      class="w-full px-3.5 py-2.5 text-sm bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    ></textarea>
  </div>

  <!-- Live Validation & Analysis Report -->
  {#if wordsInput.trim().length > 0}
    <div class="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
      <div class="flex items-center justify-between text-slate-300 font-sans font-semibold border-b border-slate-800 pb-2">
        <span>Báo cáo phân tích từ:</span>
        <div class="flex items-center gap-3 text-[11px]">
          <span class="text-emerald-400">✓ {totalValidCount} Hợp lệ</span>
          {#if totalWarningCount > 0}
            <span class="text-amber-400">⚠ {totalWarningCount} Cảnh báo</span>
          {/if}
          {#if totalRejectedCount > 0}
            <span class="text-rose-400">✕ {totalRejectedCount} Bị loại</span>
          {/if}
        </div>
      </div>

      <!-- Section Breakdown -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] py-1">
        <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
          <span class="block font-bold text-emerald-400">VN</span>
          <span class="text-slate-300">{validationReports.vn.valid.length} từ</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
          <span class="block font-bold text-amber-400">NAMES</span>
          <span class="text-slate-300">{validationReports.names.valid.length} từ</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
          <span class="block font-bold text-blue-400">NON-VN</span>
          <span class="text-slate-300">{validationReports['non-vn'].valid.length} từ</span>
        </div>
        <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
          <span class="block font-bold text-purple-400">CUSTOM</span>
          <span class="text-slate-300">{validationReports.custom.valid.length} từ</span>
        </div>
      </div>

      <!-- Rejected List -->
      {#if totalRejectedCount > 0}
        <div class="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
          <div class="font-bold flex items-center gap-1.5 font-sans">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            Từ bị loại bỏ (Không hợp lệ):
          </div>
          <div class="space-y-0.5 max-h-24 overflow-y-auto pl-5">
            {#each [...validationReports.vn.rejected, ...validationReports.names.rejected, ...validationReports['non-vn'].rejected, ...validationReports.custom.rejected] as rej (rej.word)}
              <div>
                <strong>{rej.word}</strong>: <span class="text-rose-400/80">{rej.reason}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Warnings List -->
      {#if totalWarningCount > 0}
        <div class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
          <div class="font-bold flex items-center gap-1.5 font-sans">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            Từ cảnh báo nghi vấn (Cần xác nhận):
          </div>
          <div class="space-y-0.5 max-h-24 overflow-y-auto pl-5">
            {#each [...validationReports.vn.warnings, ...validationReports.names.warnings, ...validationReports['non-vn'].warnings, ...validationReports.custom.warnings] as warn (warn.word)}
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
      disabled={isSaving || totalValidCount === 0 || (totalWarningCount > 0 && !confirmWarnings)}
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
        <span>Lưu {totalValidCount} Từ Vào Từ Điển</span>
      {/if}
    </button>
  </div>
</div>

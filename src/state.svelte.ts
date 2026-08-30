import {
  FONT_SIZE_MAX_REM,
  FONT_SIZE_MIN_REM,
  MAX_TOASTS_DISPLAYED,
  TOAST_AUTO_DISMISS_MS,
  WHITELIST_FILE_EXTENSIONS,
  WHITELIST_WORD_COUNT_LIMIT,
  WHITELIST_WORD_LENGTH_LIMIT
} from "./constants"
import type { CheckSettings } from "./types/analysis"
import type { Dictionaries, DictionaryStatus } from "./types/dictionary"
import type { EpubContent } from "./types/epub"
import type { ErrorGroup, ErrorInstance } from "./types/errors"
import type { ReaderSettings, ToastNotification } from "./types/state"
import { groupErrors } from "./utils/analyzer"
import { loadDictionaries } from "./utils/dictionary"
import { parseEpub } from "./utils/epub-parser"
import { getFilteredErrors } from "./utils/filter"
import { logger } from "./utils/logger"
import AnalysisWorker from "./workers/analysis.worker?worker"

const STORAGE_KEYS = {
  READER: "spell-check:reader-settings",
  WHITELIST: "spell-check:whitelist",
  CHECK_SETTINGS: "spell-check:check-settings-v2"
}

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    if (!item) return fallback
    return JSON.parse(item) as T
  } catch {
    return fallback
  }
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function sanitizeFilename(name: string): string {
  const sanitized = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .trim()
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Control characters are intentionally removed for filename sanitization
  return sanitized.replace(/[\u0000-\u001f]/g, "")
}

export class AppStateModel {
  // Dictionaries & Status (All 3 always loaded and active simultaneously)
  dictionaries = $state<Dictionaries>({
    vietnamese: new Set(),
    nonVietnamese: new Set(),
    custom: new Set()
  })

  dictionaryStatus = $state<DictionaryStatus>({
    isVietnameseLoaded: false,
    isNonVietnameseLoaded: false,
    isCustomLoaded: false,
    vietnameseWordCount: 0,
    nonVietnameseWordCount: 0,
    customWordCount: 0
  })

  // Error Check Toggles (Vietnamese Check & Non-Vietnamese Check)
  checkSettings = $state<CheckSettings>(
    loadStorage<CheckSettings>(STORAGE_KEYS.CHECK_SETTINGS, {
      vietnamese: true,
      nonVietnamese: true
    })
  )

  readerSettings = $state<ReaderSettings>(
    loadStorage<ReaderSettings>(STORAGE_KEYS.READER, {
      fontSize: 1.25,
      fontFamily: "serif"
    })
  )

  whitelist = $state<string[]>(
    loadStorage<string[]>(STORAGE_KEYS.WHITELIST, [])
  )

  // Loaded Book Data
  currentBookTitle = $state<string>("")
  currentBookAuthor = $state<string>("")
  currentCoverUrl = $state<string | null>(null)
  loadedTextContent = $state<{ text: string }[]>([])
  totalWords = $state<number>(0)
  allDetectedErrors = $state<ErrorGroup[]>([])

  // Selection & Navigation
  selectedGroupId = $state<string | null>(null)
  currentInstanceIndex = $state<number>(0)

  // UI State
  isProcessing = $state<boolean>(false)
  progressPercent = $state<number>(0)
  progressStatus = $state<string>("")
  activeModal = $state<"settings" | "help" | "clear-whitelist" | "dict" | null>(
    null
  )
  toasts = $state<ToastNotification[]>([])

  // Derived Values
  currentFilteredErrors = $derived(
    getFilteredErrors(
      this.allDetectedErrors,
      this.whitelist,
      this.checkSettings,
      this.dictionaries
    )
  )

  currentGroup = $derived.by(() => {
    if (this.currentFilteredErrors.length === 0) return null
    if (this.selectedGroupId) {
      const match = this.currentFilteredErrors.find(
        (g) => g.id === this.selectedGroupId
      )
      if (match) return match
    }
    return this.currentFilteredErrors[0]
  })

  totalErrorInstances = $derived(
    this.currentFilteredErrors.reduce(
      (sum, g) => sum + (g.contexts?.length || 0),
      0
    )
  )

  totalErrorGroups = $derived(this.currentFilteredErrors.length)

  // Methods
  async init() {
    try {
      const { dictionaries, status } = await loadDictionaries()
      this.dictionaries = dictionaries
      this.dictionaryStatus = status
      logger.info("Dictionaries loaded successfully:", status)
    } catch (err) {
      logger.error("Failed to load dictionaries:", err)
      this.showToast("Lỗi tải từ điển. Vui lòng tải lại trang.", "error")
    }
  }

  showToast(message: string, type: "info" | "error" | "success" = "info") {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const newToast: ToastNotification = { id, message, type }

    if (this.toasts.length >= MAX_TOASTS_DISPLAYED) {
      this.toasts = [...this.toasts.slice(1), newToast]
    } else {
      this.toasts = [...this.toasts, newToast]
    }

    setTimeout(() => {
      this.removeToast(id)
    }, TOAST_AUTO_DISMISS_MS)
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
  }

  openModal(modal: "settings" | "help" | "clear-whitelist" | "dict") {
    this.activeModal = modal
  }

  closeModal() {
    this.activeModal = null
  }

  toggleCheckSetting(key: keyof CheckSettings) {
    this.checkSettings[key] = !this.checkSettings[key]
    saveStorage(STORAGE_KEYS.CHECK_SETTINGS, this.checkSettings)
  }

  setFontSize(delta: number) {
    const newSize =
      Math.round((this.readerSettings.fontSize + delta) * 100) / 100
    if (newSize >= FONT_SIZE_MIN_REM && newSize <= FONT_SIZE_MAX_REM) {
      this.readerSettings.fontSize = newSize
      saveStorage(STORAGE_KEYS.READER, this.readerSettings)
    }
  }

  toggleFontFamily() {
    this.readerSettings.fontFamily =
      this.readerSettings.fontFamily === "serif" ? "sans-serif" : "serif"
    saveStorage(STORAGE_KEYS.READER, this.readerSettings)
  }

  selectGroup(group: ErrorGroup) {
    this.selectedGroupId = group.id
    this.currentInstanceIndex = 0
  }

  navigateGroup(direction: "up" | "down") {
    const errors = this.currentFilteredErrors
    if (errors.length === 0) return

    let currentIndex = -1
    if (this.selectedGroupId) {
      currentIndex = errors.findIndex((g) => g.id === this.selectedGroupId)
    }

    let nextIndex: number
    if (direction === "down") {
      nextIndex =
        currentIndex === -1 || currentIndex >= errors.length - 1
          ? 0
          : currentIndex + 1
    } else {
      nextIndex = currentIndex <= 0 ? errors.length - 1 : currentIndex - 1
    }

    const nextGroup = errors[nextIndex]
    if (nextGroup) {
      this.selectGroup(nextGroup)
    }
  }

  navigateInstance(direction: "prev" | "next") {
    const group = this.currentGroup
    if (!group?.contexts || group.contexts.length <= 1) return

    const numInstances = group.contexts.length
    if (direction === "next") {
      this.currentInstanceIndex = (this.currentInstanceIndex + 1) % numInstances
    } else {
      this.currentInstanceIndex =
        (this.currentInstanceIndex - 1 + numInstances) % numInstances
    }
  }

  addWhitelistWord(word: string): boolean {
    const trimmed = word.trim()
    if (!trimmed) return false

    const lower = trimmed.toLowerCase()
    if (this.whitelist.some((w) => w.toLowerCase() === lower)) {
      return false
    }

    this.whitelist = [...this.whitelist, trimmed]
    saveStorage(STORAGE_KEYS.WHITELIST, this.whitelist)
    return true
  }

  removeWhitelistWord(wordToRemove: string) {
    this.whitelist = this.whitelist.filter(
      (w) => w.toLowerCase() !== wordToRemove.toLowerCase()
    )
    saveStorage(STORAGE_KEYS.WHITELIST, this.whitelist)
  }

  clearWhitelist() {
    this.whitelist = []
    saveStorage(STORAGE_KEYS.WHITELIST, this.whitelist)
    this.closeModal()
    this.showToast("Đã xóa hết danh sách bỏ qua.", "info")
  }

  async importWhitelist(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!WHITELIST_FILE_EXTENSIONS.includes(ext || "")) {
      this.showToast("Lỗi: Tệp phải là tệp văn bản (.txt, .md)", "error")
      return
    }

    const text = await file.text()
    const importedWords = text.split(/[\s,]+/).filter(Boolean)

    if (importedWords.length > WHITELIST_WORD_COUNT_LIMIT) {
      this.showToast(
        `Lỗi: Danh sách không được chứa quá ${WHITELIST_WORD_COUNT_LIMIT} từ`,
        "error"
      )
      return
    }

    const validWordRegex = /^[a-zA-Z\p{L}-]+$/u
    const validWords: string[] = []
    const invalidWords: string[] = []

    for (const w of importedWords) {
      if (w.length > WHITELIST_WORD_LENGTH_LIMIT) {
        invalidWords.push(w)
      } else if (validWordRegex.test(w)) {
        validWords.push(w)
      } else {
        invalidWords.push(w)
      }
    }

    if (invalidWords.length > 0) {
      this.showToast(
        `Các từ không hợp lệ đã bị loại bỏ: ${invalidWords.slice(0, 5).join(", ")}...`,
        "info"
      )
    }

    const map = new Map<string, string>()
    for (const w of this.whitelist) map.set(w.toLowerCase(), w)
    for (const w of validWords) map.set(w.toLowerCase(), w)

    this.whitelist = Array.from(map.values())
    saveStorage(STORAGE_KEYS.WHITELIST, this.whitelist)
    this.showToast(
      `Đã nhập ${validWords.length} từ vào danh sách bỏ qua.`,
      "success"
    )
  }

  exportWhitelist() {
    if (this.whitelist.length === 0) {
      this.showToast("Danh sách trống!", "info")
      return
    }
    const blob = new Blob([this.whitelist.join("\n")], {
      type: "text/plain;charset=utf-8"
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `whitelist-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  ignoreAndAdvance(wordToIgnore: string, groupId: string) {
    const errors = this.currentFilteredErrors
    const currentIndex = errors.findIndex((g) => g.id === groupId)

    if (this.addWhitelistWord(wordToIgnore)) {
      const remaining = errors.filter((g) => g.id !== groupId)
      if (remaining.length > 0) {
        const nextIndex = Math.min(currentIndex, remaining.length - 1)
        this.selectedGroupId = remaining[nextIndex >= 0 ? nextIndex : 0].id
      } else {
        this.selectedGroupId = null
      }
      this.showToast(`Đã bỏ qua: "${wordToIgnore}"`, "success")
    }
  }

  quickIgnore() {
    const group = this.currentGroup
    if (!group) return
    this.ignoreAndAdvance(group.word, group.id)
  }

  exportErrors() {
    const errors = this.currentFilteredErrors
    if (errors.length === 0) {
      this.showToast("Không có lỗi nào để xuất!", "info")
      return
    }

    const content = errors.map((g) => g.word).join("\n")
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const fileName = this.currentBookTitle
      ? `danh-sach-loi-${sanitizeFilename(this.currentBookTitle)}.txt`
      : "danh-sach-loi.txt"

    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    this.showToast(`Đã xuất ${errors.length} từ lỗi thành công.`, "success")
  }

  async copyText(text: string) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement("textarea")
        ta.value = text
        ta.style.position = "fixed"
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      }
      this.showToast(`Đã copy: "${text}"`, "success")
    } catch (_e) {
      this.showToast("Lỗi sao chép.", "error")
    }
  }

  resetApp() {
    if (this.currentCoverUrl) {
      URL.revokeObjectURL(this.currentCoverUrl)
    }
    this.currentBookTitle = ""
    this.currentBookAuthor = ""
    this.currentCoverUrl = null
    this.loadedTextContent = []
    this.totalWords = 0
    this.allDetectedErrors = []
    this.selectedGroupId = null
    this.currentInstanceIndex = 0
    this.isProcessing = false
    this.progressPercent = 0
    this.progressStatus = ""
    this.closeModal()
  }

  async handleFile(file: File) {
    if (!file.name.endsWith(".epub")) {
      this.showToast("Vui lòng chọn file .epub", "error")
      return
    }

    this.resetApp()
    this.isProcessing = true
    this.progressPercent = 5
    this.progressStatus = "Đang đọc tệp EPUB..."

    try {
      const epubContent: EpubContent = await parseEpub(
        file,
        (progress, status) => {
          this.progressPercent = progress
          this.progressStatus = status
        }
      )

      this.currentBookTitle = epubContent.metadata.title
      this.currentBookAuthor = epubContent.metadata.author
      this.currentCoverUrl = epubContent.metadata.coverUrl
      this.loadedTextContent = epubContent.textBlocks

      this.progressPercent = 60
      this.progressStatus = "Đang khởi tạo bộ phân tích chính tả..."

      // Unproxy reactive state proxies for Structured Clone Algorithm (Worker postMessage)
      const rawDicts: Dictionaries = {
        vietnamese: new Set($state.snapshot(this.dictionaries.vietnamese)),
        nonVietnamese: new Set(
          $state.snapshot(this.dictionaries.nonVietnamese)
        ),
        custom: new Set($state.snapshot(this.dictionaries.custom))
      }
      const rawCheckSettings: CheckSettings = {
        ...$state.snapshot(this.checkSettings)
      }

      // Run analysis in Web Worker
      const worker = new AnalysisWorker()
      const analysisPromise = new Promise<{
        errors: ErrorInstance[]
        totalWords: number
      }>((resolve, reject) => {
        worker.onmessage = (event) => {
          const { type, progress, message, errors, totalWords } = event.data
          if (type === "progress") {
            this.progressPercent = 60 + Math.round(progress * 0.4)
            this.progressStatus = message
          } else if (type === "complete") {
            resolve({ errors, totalWords })
            worker.terminate()
          }
        }

        worker.onerror = (error) => {
          logger.error("Analysis worker error:", error)
          reject(new Error("Lỗi trong quá trình phân tích văn bản."))
          worker.terminate()
        }

        worker.postMessage({
          textBlocks: epubContent.textBlocks,
          dictionaries: rawDicts,
          checkSettings: rawCheckSettings,
          chapterStartIndex: 0
        })
      })

      const { errors, totalWords } = await analysisPromise
      this.allDetectedErrors = groupErrors(errors)
      this.totalWords = totalWords
      this.isProcessing = false

      if (this.currentFilteredErrors.length > 0) {
        this.selectedGroupId = this.currentFilteredErrors[0].id
        this.showToast("Đã tải xong sách và phát hiện các lỗi.", "success")
      } else {
        this.showToast(
          "Tuyệt vời! Không phát hiện lỗi chính tả nào.",
          "success"
        )
      }
    } catch (err: unknown) {
      this.isProcessing = false
      logger.error("Error processing EPUB file:", err)
      let errorMessage = "Có lỗi xảy ra trong quá trình xử lý tệp EPUB."
      if (err instanceof Error) {
        errorMessage = err.message
      }
      this.showToast(errorMessage, "error")
    }
  }
}

export const appState = new AppStateModel()

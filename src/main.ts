import "./style.css";
import { state, loadStateFromLocalStorage, loadWhitelist as loadWhitelistFromState, saveWhitelist, resetState, loadReaderSettingsFromLocalStorage, saveReaderSettings } from "./state";
import { UIElements } from "./types/ui";
import { initializeUI, loadAppData, loadUserPreferences } from "./utils/setup";
import { registerUIEventListeners } from "./utils/ui-events";
import { logger } from "./utils/logger";
import { groupErrors, CheckSettings } from "./utils/analyzer";
import { ErrorGroup, ErrorInstance } from "./types/errors";
import { renderErrorList, renderContextView, updateStats, updateProgress, copyToClipboard } from "./utils/ui-render";
import { getFilteredErrors } from "./utils/filter";
import { showProcessingUI, hideProcessingUI, showResultsUI, showLoadingOverlay, hideLoadingOverlay, updateUIWhitelistInput } from "./utils/ui-utils";
import { showToast } from "./utils/notifications";
import { closeModal } from "./utils/modal";
import { updateWhitelist } from "./utils/whitelist-manager";
import AnalysisWorker from "./workers/analysis.worker?worker";
import { parseEpub } from "./utils/epub-parser";
import { EpubContent } from "./types/epub";
import { SETTINGS_FILTER_DEBOUNCE_MS, EPUB_FILE_EXTENSION } from "./constants";

const UI: UIElements = {
    dictStatus: document.getElementById("dict-status"),
    dictDot: document.getElementById("dict-dot"),
    dictText: document.getElementById("dict-text"),
    fileInput: document.getElementById("file-input") as HTMLInputElement,
    uploadSection: document.getElementById("upload-section"),
    processingUi: document.getElementById("processing-ui"),
    progressBar: document.getElementById("progress-bar"),
    progressPercent: document.getElementById("progress-percent"),
    statusText: document.getElementById("status-text"),
    resetBtn: document.getElementById("reset-btn"),
    exportBtn: document.getElementById("export-btn"),
    loadingOverlay: document.getElementById("loading-overlay"),
    processingUiHeader: document.getElementById("processing-ui-header"),
  
    metaTitle: document.getElementById("meta-title"),
    metaAuthor: document.getElementById("meta-author"),
    metaCover: document.getElementById("meta-cover") as HTMLImageElement,
    metaCoverPlaceholder: document.getElementById("meta-cover-placeholder"),
  
    settingsBtn: document.getElementById("settings-btn"),
    settingsModal: document.getElementById("settings-modal"),
    closeSettingsBtn: document.getElementById("close-settings-btn"),
  
    helpBtn: document.getElementById("help-btn"),
    helpModal: document.getElementById("help-modal"),
    helpModalContent: document.getElementById("help-modal-content"),
    closeHelpBtn: document.getElementById("close-help-btn"),
  
    exportModal: document.getElementById("export-modal"),
    closeExportBtn: document.getElementById("close-export-btn"),
    exportVctveBtn: document.getElementById("export-vctve-btn"),
    exportNormalBtn: document.getElementById("export-normal-btn"),
  
    clearWhitelistModal: document.getElementById("clear-whitelist-modal"),
    closeClearWhitelistBtn: document.getElementById("close-clear-whitelist-btn") as HTMLButtonElement,
    cancelClearWhitelistBtn: document.getElementById("cancel-clear-whitelist-btn") as HTMLButtonElement,
    confirmClearWhitelistBtn: document.getElementById("confirm-clear-whitelist-btn") as HTMLButtonElement,
  
    fontToggleBtn: document.getElementById("font-toggle-btn"),
    sizeUpBtn: document.getElementById("size-up-btn"),
    sizeDownBtn: document.getElementById("size-down-btn"),
    contextNavControls: document.getElementById("context-nav-controls"),
  
    settingToggles: {
      dict: document.getElementById("set-dict") as HTMLInputElement,
      case: document.getElementById("set-case") as HTMLInputElement,
      tone: document.getElementById("set-tone") as HTMLInputElement,
      struct: document.getElementById("set-struct") as HTMLInputElement,
    },
    whitelistInput: document.getElementById("whitelist-input") as HTMLTextAreaElement,
    importWhitelistBtn: document.getElementById("import-whitelist-btn"),
    exportWhitelistBtn: document.getElementById("export-whitelist-btn"),
    clearWhitelistBtn: document.getElementById("clear-whitelist-btn") as HTMLButtonElement,
    whitelistImportFile: document.getElementById("whitelist-import-file") as HTMLInputElement,
    engFilterCheckbox: document.getElementById("eng-filter-checkbox") as HTMLInputElement,
    engLoading: document.getElementById("eng-loading"),
    resultsSection: document.getElementById("results-section"),
    toastContainer: document.getElementById("toast-container"),
    statTotalWords: document.getElementById("stat-total-words"),
    statErrors: document.getElementById("stat-errors"),
    statGroups: document.getElementById("stat-groups"),
    statErrorsMobileCount: document.getElementById("stat-errors-mobile-count"),
    errorList: document.getElementById("error-list"),
    contextView: document.getElementById("context-view"),
    errorItemTemplate: document.getElementById("error-item-template") as HTMLTemplateElement,
    btnPrev: document.getElementById("btn-prev") as HTMLButtonElement,
    btnNext: document.getElementById("btn-next") as HTMLButtonElement,
    navIndicator: document.getElementById("nav-indicator"),
};

let isUpdating = false;

function clearContextView() {
    const contextView = document.getElementById("context-view");
    const contextNav = document.getElementById("context-nav");
    if (contextView)
      contextView.innerHTML =
        '<div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl"><p class="text-lg mb-2">Tuyệt vời!</p><p class="text-sm opacity-60">Đã xử lý hết lỗi.</p></div>';
    contextNav?.classList.add("hidden");
    state.currentGroup = null;
}

function selectNextError(wordToIgnoreId: string, originalIndex: number) {
    const errorList = document.getElementById("error-list");
  
    if (state.currentFilteredErrors.length > 0) {
      let targetIndex;
      const reFoundIndex = state.currentFilteredErrors.findIndex(
        (_g: ErrorGroup) => _g.id === wordToIgnoreId
      );
  
      if (reFoundIndex !== -1) {
        targetIndex = reFoundIndex;
      } else {
        targetIndex = Math.min(
          originalIndex,
          state.currentFilteredErrors.length - 1
        );
        if (targetIndex < 0) targetIndex = 0;
      }
  
      const nextGroup = state.currentFilteredErrors[targetIndex];
      const nextElementInList = errorList?.querySelector(
        `[data-group-id="${nextGroup.id}"]`
      ) as HTMLElement | null;
      if (nextElementInList) {
        selectGroup(nextGroup, nextElementInList);
        nextElementInList.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    } else {
      clearContextView();
    }
}

function ignoreAndAdvance(
    wordToIgnore: string,
    wordToIgnoreId: string,
    originalIndex: number
) {
    if (updateWhitelist(wordToIgnore, UI, saveWhitelist)) {
        updateAndRenderErrors();
        selectNextError(wordToIgnoreId, originalIndex);
    }
}

function quickIgnore() {
    if (!state.currentGroup) {
      logger.info("No current error group to ignore.");
      return;
    }
  
    const wordToIgnore = state.currentGroup.word;
    const wordToIgnoreId = state.currentGroup.id;
    const originalIndex = state.currentFilteredErrors.findIndex(
      (_g: ErrorGroup) => _g.id === wordToIgnoreId
    );
    ignoreAndAdvance(wordToIgnore, wordToIgnoreId, originalIndex);
}

async function updateAndRenderErrors() {
    if (!UI.whitelistInput || isUpdating) return;
  
    isUpdating = true;
    try {
      state.currentFilteredErrors = getFilteredErrors(
        state.allDetectedErrors,
        UI.whitelistInput.value,
        state.isEngFilterEnabled,
        state.checkSettings,
        state.dictionaries.english
      );
      const totalErrorInstances = state.currentFilteredErrors.reduce(
        (_acc: number, _g: ErrorGroup) => _acc + _g.contexts.length,
        0
      );
      updateStats(
        UI,
        state.totalWords,
        totalErrorInstances,
        state.currentFilteredErrors.length
      );
      renderErrorList(UI, state.currentFilteredErrors);
    } finally {
      isUpdating = false;
    }
}

function saveSettings() {
    state.checkSettings = {
      dictionary: UI.settingToggles.dict?.checked ?? true,
      uppercase: UI.settingToggles.case?.checked ?? true,
      tone: UI.settingToggles.tone?.checked ?? true,
      foreign: UI.settingToggles.struct?.checked ?? true,
    };
  
    if (state.loadedTextContent.length > 0) {
      showLoadingOverlay(UI);
  
      setTimeout(() => {
        updateAndRenderErrors();
        hideLoadingOverlay(UI);
        logger.info("Filtering complete after settings change.");
      }, SETTINGS_FILTER_DEBOUNCE_MS);
    }
}

function sanitizeFilename(name: string): string {
    const sanitized = name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .trim();
    // eslint-disable-next-line no-control-regex
    return sanitized.replace(/[ -]/g, "");
}

function performExport(type: "vctve" | "normal") {
    if (state.currentFilteredErrors.length === 0) {
      showToast(UI, "Không có lỗi nào để xuất!", "info");
      closeModal(UI, "export");
      return;
    }
  
    let content = "";
    if (type === "vctve") {
      content = state.currentFilteredErrors
        .map((_g: ErrorGroup) => `${_g.word} ==>`)
        .join("\n\n");
    } else {
      content = state.currentFilteredErrors
        .map((_g: ErrorGroup) => _g.word)
        .join("\n");
    }
  
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const fileName = state.currentBookTitle
      ? `loi-${sanitizeFilename(state.currentBookTitle)}.txt`
      : "loi-khong-ro-ten.txt";
  
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    closeModal(UI, "export");
}

function navigateErrors(direction: "up" | "down") {
    if (state.currentFilteredErrors.length === 0) {
      state.currentGroup = null;
      const contextView = document.getElementById("context-view");
      const contextNav = UI.contextNavControls;
      if (contextView)
        contextView.innerHTML =
          '<div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl"><p class="text-lg mb-2">Tuyệt vời!</p><p class="text-sm opacity-60">Đã xử lý hết lỗi.</p></div>';
      contextNav?.classList.add("hidden");
      return;
    }
  
    let currentIndex = -1;
    if (state.currentGroup) {
      currentIndex = state.currentFilteredErrors.findIndex(
        (_g: ErrorGroup) => _g.id === state.currentGroup?.id
      );
    }
  
    let nextIndex;
  
    if (direction === "down") {
      if (
        currentIndex === -1 ||
        currentIndex >= state.currentFilteredErrors.length - 1
      ) {
        nextIndex = 0;
      } else {
        nextIndex = currentIndex + 1;
      }
    } else {
      if (currentIndex === -1 || currentIndex === 0) {
        nextIndex = state.currentFilteredErrors.length - 1;
      } else {
        nextIndex = currentIndex - 1;
      }
    }
  
    const nextGroup = state.currentFilteredErrors[nextIndex];
    if (nextGroup) {
      const errorList = document.getElementById("error-list");
      const nextElement = errorList?.querySelector(
        `[data-group-id="${nextGroup.id}"]`
      ) as HTMLElement;
      if (nextElement) {
        selectGroup(nextGroup, nextElement);
        copyToClipboard(nextGroup.word, UI);
        nextElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
}

function handleGlobalKeydown(e: KeyboardEvent) {
    const activeElement = document.activeElement;
    if (activeElement && ["TEXTAREA", "INPUT"].includes(activeElement.tagName)) {
      return;
    }
  
    if (state.currentFilteredErrors.length === 0) return;
  
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        navigateErrors("down");
        break;
      case "ArrowUp":
        e.preventDefault();
        navigateErrors("up");
        break;
      case "Delete":
      case "i":
        if (state.currentGroup) {
          e.preventDefault();
          quickIgnore();
        }
        break;
    }
}

function selectGroup(group: ErrorGroup, element: HTMLElement) {
    state.selectedErrorElement?.classList.remove(
      "bg-blue-900/30",
      "border-blue-700/50",
      "ring-1",
      "ring-blue-500/50"
    );
  
    state.currentGroup = group;
    state.currentInstanceIndex = 0;
  
    element.classList.add(
      "bg-blue-900/30",
      "border-blue-700/50",
      "ring-1",
      "ring-blue-500/50"
    );
  
    state.selectedErrorElement = element;
    renderContextView(UI, group, state.currentInstanceIndex, state.dictionaries);
    updateNavButtons();
}

function updateNavButtons() {
    const btnPrev = document.getElementById("btn-prev") as HTMLButtonElement;
    const btnNext = document.getElementById("btn-next") as HTMLButtonElement;
    if (!btnPrev || !btnNext || !state.currentGroup) return;
  
    const numInstances = state.currentGroup.contexts.length;
    const isDisabled = numInstances <= 1;
  
    btnPrev.disabled = isDisabled;
    btnNext.disabled = isDisabled;
}

function navigateInstance(direction: "prev" | "next") {
    if (!state.currentGroup) return;
  
    const numInstances = state.currentGroup.contexts.length;
  
    if (numInstances === 0) {
      state.currentInstanceIndex = 0;
    } else if (direction === "next") {
      state.currentInstanceIndex =
        (state.currentInstanceIndex + 1) % numInstances;
    } else if (direction === "prev") {
      state.currentInstanceIndex =
        (state.currentInstanceIndex - 1 + numInstances) % numInstances;
    }
  
    renderContextView(
      UI,
      state.currentGroup,
      state.currentInstanceIndex,
      state.dictionaries
    );
    updateNavButtons();
}

function resetApp() {
    hideProcessingUI(UI);
    if (UI.fileInput) UI.fileInput.value = "";
    if (UI.whitelistImportFile) UI.whitelistImportFile.value = "";
    if (UI.engFilterCheckbox) UI.engFilterCheckbox.checked = true;
  
    resetState();
  
    if (UI.settingToggles.dict) UI.settingToggles.dict.checked = true;
    if (UI.settingToggles.case) UI.settingToggles.case.checked = true;
    if (UI.settingToggles.tone) UI.settingToggles.tone.checked = true;
    if (UI.settingToggles.struct) UI.settingToggles.struct.checked = true;
  
    if (state.currentCoverUrl) {
      URL.revokeObjectURL(state.currentCoverUrl);
      state.currentCoverUrl = null;
    }
    const errorList = document.getElementById("error-list");
    const contextView = document.getElementById("context-view");
    const contextNav = document.getElementById("context-nav-controls");
    if (errorList) errorList.innerHTML = "";
    if (contextView)
      contextView.innerHTML =
        '<div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl"><p class="text-lg mb-2">Chưa chọn lỗi nào</p><p class="text-sm opacity-60">Chọn một mục từ danh sách bên trái</p></div>';
    contextNav?.classList.add("hidden");
    if (UI.metaTitle) UI.metaTitle.innerText = "Đang tải...";
    if (UI.metaAuthor) UI.metaAuthor.innerText = "Đang tải...";
    if (UI.metaCover) {
      UI.metaCover.src = "";
      UI.metaCover.classList.add("hidden");
    }
    UI.metaCoverPlaceholder?.classList.remove("hidden");
    UI.dictStatus?.classList.add("hidden");
    UI.dictStatus?.classList.remove("md:flex", "items-center", "gap-3");
    updateStats(UI, 0, 0, 0);
    logger.info("App reset.");
}

function closeAllModals() {
    closeModal(UI, "settings");
    closeModal(UI, "help");
    closeModal(UI, "export");
    closeModal(UI, "clear-whitelist");
}

function prepareForNewFile(): boolean {
    resetApp();
    loadReaderSettingsFromLocalStorage();
    if (!state.dictionaryStatus.isVietnameseLoaded) {
      showToast(UI, "Đang tải dữ liệu từ điển, vui lòng đợi giây lát...", "info");
      return false;
    }
    return true;
}

function updateBookMetadata(epubContent: EpubContent) {
    state.loadedTextContent = epubContent.textBlocks;
    state.currentBookTitle = epubContent.metadata.title;
  
    if (UI.metaTitle) UI.metaTitle.innerText = epubContent.metadata.title;
    if (UI.metaAuthor) UI.metaAuthor.innerText = epubContent.metadata.author;
    if (epubContent.metadata.coverUrl && UI.metaCover) {
      state.currentCoverUrl = epubContent.metadata.coverUrl;
      UI.metaCover.src = epubContent.metadata.coverUrl;
      UI.metaCover.classList.remove("hidden");
      UI.metaCoverPlaceholder?.classList.add("hidden");
    }
}

async function runAnalysis(epubContent: EpubContent) {
    const fullCheckSettings: CheckSettings = {
      dictionary: true,
      uppercase: true,
      tone: true,
      foreign: true,
    };
    showProcessingUI(UI);
    updateProgress(UI, 0, "Khởi tạo phân tích...");
  
    const worker = new AnalysisWorker();
    const analysisPromise = new Promise<{ 
      errors: ErrorInstance[];
      totalWords: number;
    }>((resolve, reject) => {
      worker.onmessage = (event) => {
        const { type, progress, message, errors, totalWords } = event.data;
        if (type === "progress") {
          updateProgress(UI, 60 + progress * 0.4, message);
        } else if (type === "complete") {
          resolve({ errors, totalWords });
          worker.terminate();
        }
      };
  
      worker.onerror = (error) => {
        logger.error("Worker error:", error);
        reject(new Error("Lỗi trong quá trình phân tích văn bản."));
        worker.terminate();
      };
  
      worker.postMessage({
        textBlocks: epubContent.textBlocks,
        dictionaries: state.dictionaries,
        settings: fullCheckSettings,
        chapterStartIndex: 0,
      });
    });
  
    try {
      const { errors, totalWords } = await analysisPromise;
  
      state.allDetectedErrors = groupErrors(errors);
      state.totalWords = totalWords;
  
      updateProgress(UI, 100, "Hoàn tất");
  
      updateAndRenderErrors();
  
      if (state.currentFilteredErrors.length > 0) {
        const firstErrorGroup = state.currentFilteredErrors[0];
        const errorList = document.getElementById("error-list");
        const firstErrorElement = errorList?.querySelector(
          `[data-group-id="${firstErrorGroup.id}"]`
        ) as HTMLElement;
        if (firstErrorElement) {
          selectGroup(firstErrorGroup, firstErrorElement);
          firstErrorElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
        logger.info("Book loaded and first error selected.");
      } else {
        const contextView = document.getElementById("context-view");
        const contextNav = UI.contextNavControls;
        if (contextView) {
          contextView.innerHTML = `
                      <div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                          <p class="text-lg mb-2">Tuyệt vời!</p>
                          <p class="text-sm opacity-60">Cuốn sách này không có lỗi nào.</p>
                      </div>`;
        }
        contextNav?.classList.add("hidden");
        state.currentGroup = null;
        logger.info("Book loaded. No errors found.");
      }
  
      UI.processingUi?.classList.add("hidden");
      if (UI.processingUiHeader) {
        UI.processingUiHeader.classList.remove(
          "flex",
          "items-end",
          "justify-between",
          "mb-4"
        );
        UI.processingUiHeader.classList.add("hidden");
      }
      showResultsUI(UI);
    } catch (error) {
      logger.error("Analysis failed:", error);
      showToast(UI, "Lỗi phân tích văn bản.", "error");
      hideProcessingUI(UI);
      throw error; // Re-throw to be caught by handleFile
    }
}

async function handleFile(file: File) {
    if (!file.name.endsWith(EPUB_FILE_EXTENSION)) {
      showToast(UI, "Vui lòng chọn file .epub", "error");
      return;
    }
  
    closeAllModals();
    if (!prepareForNewFile()) return;
  
    if (state.currentCoverUrl) {
      URL.revokeObjectURL(state.currentCoverUrl);
      state.currentCoverUrl = null;
    }
  
    try {
      showProcessingUI(UI);
      const epubContent: EpubContent = await parseEpub(file, UI);
      updateBookMetadata(epubContent);
      await runAnalysis(epubContent);
    } catch (err: unknown) {
      logger.error("Error processing EPUB file:", err);
      let errorMessage = "Có lỗi xảy ra trong quá trình xử lý tệp EPUB.";
      if (err instanceof Error) {
        if (err.message.includes("EPUB không hợp lệ")) {
          errorMessage = err.message;
        } else if (err.message.includes("Zip is not a valid zip file")) {
          errorMessage = "Tệp EPUB bị hỏng hoặc không đúng định dạng Zip.";
        } else {
          errorMessage = `Lỗi không xác định: ${err.message}`;
        }
      }
      showToast(UI, errorMessage, "error");
      resetApp();
    }
}

async function main() {
    initializeUI(UI);
    loadStateFromLocalStorage();
    loadReaderSettingsFromLocalStorage();
    await loadAppData(UI, state);
    loadUserPreferences(UI, state, loadWhitelistFromState);

    const mainFunctions = {
        handleFile,
        resetApp,
        updateAndRenderErrors,
        saveSettings,
        performExport,
        navigateInstance,
        handleGlobalKeydown,
        ignoreAndAdvance,
        selectGroup,
        copyToClipboard,
        updateUIWhitelistInput,
        showToast,
        saveReaderSettings,
        saveWhitelist,
    };

    registerUIEventListeners(UI, state, mainFunctions);
}

document.addEventListener("DOMContentLoaded", main);

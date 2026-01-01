// src/main.ts
import './style.css';
import { loadDictionaries } from './utils/dictionary';
import { logger } from './utils/logger';
import { parseEpub } from './utils/epub-parser';
import { EpubContent } from './types/epub';
import { UIElements } from './types/ui';
import { GlobalState } from './types/state';
import { analyzeText, groupErrors, CheckSettings } from './utils/analyzer';
import { ErrorGroup } from './types/errors';
import { renderErrorList, renderContextView, updateStats, updateProgress } from './utils/ui-render';
import { parseWhitelistWithOriginalCase } from './utils/whitelist-parser';
import { showProcessingUI, hideProcessingUI, showResultsUI, showLoadingOverlay, hideLoadingOverlay } from './utils/ui-utils';
import { showToast } from './utils/notifications';

const SETTINGS_KEY = "vn_spell_settings";
const WHITELIST_KEY = "vn_spell_whitelist";
const ENG_FILTER_KEY = "vn_spell_eng_filter";
const READER_SETTINGS_KEY = "vn_spell_reader";
let debounceTimer: number;

// --- 2. DOM ELEMENTS & STATE ---
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

  fontToggleBtn: document.getElementById("font-toggle-btn"),
  sizeUpBtn: document.getElementById("size-up-btn"),
  sizeDownBtn: document.getElementById("size-down-btn"),
  contextNavControls: document.getElementById("context-nav-controls"), // New reference

  settingToggles: {
      dict: document.getElementById("set-dict") as HTMLInputElement,
      case: document.getElementById("set-case") as HTMLInputElement,
      tone: document.getElementById("set-tone") as HTMLInputElement,
      struct: document.getElementById("set-struct") as HTMLInputElement,
  },
  whitelistInput: document.getElementById("whitelist-input") as HTMLTextAreaElement,
  importWhitelistBtn: document.getElementById("import-whitelist-btn"),
  exportWhitelistBtn: document.getElementById("export-whitelist-btn"),
  whitelistImportFile: document.getElementById("whitelist-import-file") as HTMLInputElement,
  engFilterCheckbox: document.getElementById("eng-filter-checkbox") as HTMLInputElement,
  engLoading: document.getElementById("eng-loading"), // Add engLoading here
  resultsSection: document.getElementById("results-section"), 
};

interface AppState extends GlobalState {
    allDetectedErrors: ErrorGroup[];
    currentFilteredErrors: ErrorGroup[];
    currentGroup: ErrorGroup | null;
    currentInstanceIndex: number;
    checkSettings: CheckSettings;
    isEngFilterEnabled: boolean;
}

const state: AppState = {
  dictionaries: { vietnamese: new Set(), english: new Set(), custom: new Set() },
  dictionaryStatus: { isVietnameseLoaded: false, isEnglishLoaded: false, isCustomLoaded: false, vietnameseWordCount: 0, englishWordCount: 0, customWordCount: 0 },
  currentBookTitle: '',
  loadedTextContent: [],
  currentCoverUrl: null,
  totalWords: 0, // Initialize totalWords here
  allDetectedErrors: [],
  currentFilteredErrors: [],
  currentGroup: null,
  currentInstanceIndex: 0,
  checkSettings: { dictionary: true, uppercase: true, tone: true, foreign: true },
  isEngFilterEnabled: false,
  readerSettings: { fontSize: 1.25, fontFamily: "serif" },
};

// --- Whitelist & Filter Logic ---
function quickIgnore() {
    if (!UI.whitelistInput || !state.currentGroup) {
        logger.log("No current error group to ignore.");
        return;
    }

    const wordToIgnore = state.currentGroup.word;
    const wordToIgnoreId = state.currentGroup.id; // Store ID before filtering
    const originalIndex = state.currentFilteredErrors.findIndex(g => g.id === wordToIgnoreId); // Store original index
    
    const { display, check } = parseWhitelistWithOriginalCase(UI.whitelistInput.value);

    if (check.has(wordToIgnore.toLowerCase())) {
        logger.log(`'${wordToIgnore}' is already in the whitelist.`);
        // Even if already in whitelist, re-filter in case state changed
        filterAndRenderErrors();
        return;
    }

    display.push(wordToIgnore);
    UI.whitelistInput.value = display.join(", ");
    saveWhitelist();
    filterAndRenderErrors();

    const errorList = document.getElementById('error-list');

    // After filtering, check if the current group still exists or select a new one
    if (state.currentFilteredErrors.length > 0) {
        let targetIndex;
        // Try to find the *original* currentGroup in the *newly filtered* list
        const reFoundIndex = state.currentFilteredErrors.findIndex(g => g.id === wordToIgnoreId); // Use stored ID

        if (reFoundIndex !== -1) {
            // If the original group is still present (unlikely after ignoring it, but good for robustness), select it
            targetIndex = reFoundIndex;
        } else {
            // The original group was ignored and is no longer in the list.
            // Try to select the error at the *original position*, or the last one if out of bounds.
            targetIndex = Math.min(originalIndex, state.currentFilteredErrors.length - 1);
            if (targetIndex < 0) targetIndex = 0; // Ensure index is not negative if list became very small
        }
        
        const nextGroup = state.currentFilteredErrors[targetIndex];
        const nextElementInList = errorList?.querySelector(`[data-group-id="${nextGroup.id}"]`) as HTMLElement | null;
        if (nextElementInList) {
            selectGroup(nextGroup, nextElementInList);
            nextElementInList.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    } else {
        // No more filtered errors, clear context view
        const contextView = document.getElementById('context-view');
        const contextNav = document.getElementById('context-nav');
        if (contextView) contextView.innerHTML = '<div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl"><p class="text-lg mb-2">Tuyệt vời!</p><p class="text-sm opacity-60">Đã xử lý hết lỗi.</p></div>';
        if (contextNav) contextNav.classList.add('hidden');
        state.currentGroup = null;
    }
}

function quickIgnoreWordFromList(word: string) { // Renamed original quickIgnore to avoid confusion and for specific use case
    if (!UI.whitelistInput) return;
    const { display, check } = parseWhitelistWithOriginalCase(UI.whitelistInput.value);

    if (check.has(word.toLowerCase())) {
        logger.log(`'${word}' is already in the whitelist.`);
        filterAndRenderErrors();
        return;
    }

    display.push(word);
    UI.whitelistInput.value = display.join(", ");
    saveWhitelist();
    filterAndRenderErrors();
}

function loadWhitelist() {
    const stored = localStorage.getItem(WHITELIST_KEY);
    if (stored && UI.whitelistInput) UI.whitelistInput.value = stored;
}

function saveWhitelist() {
    if(UI.whitelistInput) localStorage.setItem(WHITELIST_KEY, UI.whitelistInput.value);
}

function exportWhitelist() {
    if (!UI.whitelistInput?.value.trim()) {
        showToast("Danh sách trống!", "info");
        return;
    }
    const { display } = parseWhitelistWithOriginalCase(UI.whitelistInput.value);
    const blob = new Blob([display.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whitelist-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function handleImportWhitelist(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file || !UI.whitelistInput) return;

    // --- Input Validation ---
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== "txt" && fileExtension !== "md") {
        showToast("Lỗi: Tệp phải là tệp văn bản (.txt, .md)", "error");
        fileInput.value = '';
        return;
    }

    if (file.size > 1024 * 1024) { // 1MB limit
        showToast("Lỗi: Kích thước tệp không được vượt quá 1MB", "error");
        fileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const newContent = e.target?.result as string;
        
        const { display: importedDisplay } = parseWhitelistWithOriginalCase(newContent);

        if (importedDisplay.length > 10000) {
            showToast("Lỗi: Danh sách trắng không được chứa nhiều hơn 10,000 từ", "error");
            fileInput.value = '';
            return;
        }

        const validWordRegex = /^[a-zA-Z\p{L}-]+$/u;
        const validWords: string[] = [];
        const invalidWords: string[] = [];

        for (const word of importedDisplay) {
            if (word.length > 50) {
                invalidWords.push(word);
            } else if (validWordRegex.test(word)) {
                validWords.push(word);
            } else {
                invalidWords.push(word);
            }
        }

        if (invalidWords.length > 0) {
            showToast(`Các từ không hợp lệ đã bị loại bỏ: ${invalidWords.join(", ")}`, "info");
        }

        const currentContent = UI.whitelistInput!.value;
        const { display: currentDisplay } = parseWhitelistWithOriginalCase(currentContent);
        
        const finalWhitelistMap = new Map<string, string>();

        for (const word of currentDisplay) {
            finalWhitelistMap.set(word.toLowerCase(), word);
        }

        for (const word of validWords) {
            finalWhitelistMap.set(word.toLowerCase(), word);
        }
        
        const finalDisplay = Array.from(finalWhitelistMap.values());

        UI.whitelistInput!.value = finalDisplay.join(", ") + (finalDisplay.length > 0 ? ", " : "");
        saveWhitelist();
        filterAndRenderErrors();

        // Reset file input to allow re-importing the same file
        fileInput.value = '';
    };
    reader.readAsText(file);
}

function loadEngFilter() {
    const stored = localStorage.getItem(ENG_FILTER_KEY);
    state.isEngFilterEnabled = stored === 'true';
    if(UI.engFilterCheckbox) UI.engFilterCheckbox.checked = state.isEngFilterEnabled;
}

function saveEngFilter() {
    state.isEngFilterEnabled = UI.engFilterCheckbox?.checked ?? false;
    localStorage.setItem(ENG_FILTER_KEY, String(state.isEngFilterEnabled));
    filterAndRenderErrors();
}

// --- Filtering and Rendering ---
function filterAndRenderErrors() {
    if (!UI.whitelistInput) return;
    const { check } = parseWhitelistWithOriginalCase(UI.whitelistInput.value);
    
    state.currentFilteredErrors = state.allDetectedErrors.filter(group => {
        const lowerWord = group.word.toLowerCase();
        if (check.has(lowerWord)) return false;
        if (state.isEngFilterEnabled && state.dictionaries.english.has(lowerWord)) return false;

        // Add filtering based on checkSettings
        const settings = state.checkSettings;
        if (!settings.dictionary && group.type === 'Dictionary') return false;
        if (!settings.uppercase && group.type === 'Uppercase') return false;
        if (!settings.tone && group.type === 'Tone') return false;
        // The 'foreign' setting in the UI corresponds to multiple error types
        if (!settings.foreign && ['Foreign', 'Typo', 'Spelling'].includes(group.type)) return false;
        
        return true;
    });

    const totalErrorInstances = state.currentFilteredErrors.reduce((acc, g) => acc + g.contexts.length, 0);
    
    updateStats(UI, state.totalWords, totalErrorInstances, state.currentFilteredErrors.length);
    renderErrorList(UI, state.currentFilteredErrors, selectGroup, quickIgnoreWordFromList);
}

// --- Settings Logic ---
function saveSettings() {
    state.checkSettings = {
        dictionary: UI.settingToggles.dict?.checked ?? true,
        uppercase: UI.settingToggles.case?.checked ?? true,
        tone: UI.settingToggles.tone?.checked ?? true,
        foreign: UI.settingToggles.struct?.checked ?? true, // This now controls multiple rule types
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.checkSettings));
    
    // Instead of re-analyzing, just filter and re-render
    if (state.loadedTextContent.length > 0) {
        showLoadingOverlay(UI);
        
        // Use a short timeout to allow the UI to update (e.g., show overlay) before filtering
        setTimeout(() => {
            filterAndRenderErrors();
            hideLoadingOverlay(UI);
            logger.log('Filtering complete after settings change.');
        }, 50);
    }
}

function loadSettings() {
    try {
        const s = localStorage.getItem(SETTINGS_KEY);
        if (s) state.checkSettings = JSON.parse(s);
    } catch (e) { logger.error("Failed to load settings", e); }

    if(UI.settingToggles.dict) UI.settingToggles.dict.checked = state.checkSettings.dictionary;
    if(UI.settingToggles.case) UI.settingToggles.case.checked = state.checkSettings.uppercase;
    if(UI.settingToggles.tone) UI.settingToggles.tone.checked = state.checkSettings.tone;
    if(UI.settingToggles.struct) UI.settingToggles.struct.checked = state.checkSettings.foreign;
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

function performExport(type: 'vctve' | 'normal') {
    if (state.currentFilteredErrors.length === 0) {
        showToast("Không có lỗi nào để xuất!", "info");
        if (UI.exportModal) UI.exportModal.classList.add("hidden");
        return;
    }

    let content = "";
    if (type === 'vctve') {
        content = state.currentFilteredErrors.map((g) => `${g.word} ==>`).join("\n\n");
    } else {
        content = state.currentFilteredErrors.map((g) => g.word).join("\n");
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const fileName = state.currentBookTitle ? `loi-${sanitizeFilename(state.currentBookTitle)}.txt` : "loi-khong-ro-ten.txt";
    
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (UI.exportModal) UI.exportModal.classList.add("hidden");
}


// --- Reader Settings Logic ---
function applyReaderStyles() {
    const contextView = document.getElementById('context-view');
    if (contextView) {
        const fontStyle = state.readerSettings.fontFamily === 'serif' ? '"Noto Serif", serif' : '"Noto Sans", sans-serif';
        const fontSize = `${state.readerSettings.fontSize}rem`;
        contextView.style.setProperty('--reader-font', fontStyle);
        contextView.style.setProperty('--reader-size', fontSize);
    }
}

function loadReaderSettings() {
    try {
        const s = localStorage.getItem(READER_SETTINGS_KEY);
        if (s) state.readerSettings = JSON.parse(s);
    } catch (e) {
        logger.error("Failed to load reader settings", e);
        state.readerSettings = { fontSize: 1.25, fontFamily: "serif" }; // Default value
    }
    applyReaderStyles();
}

function saveReaderSettings() {
    localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(state.readerSettings));
    applyReaderStyles();
    if (state.currentGroup) {
        renderContextView(UI, state.currentGroup, state.currentInstanceIndex, state.dictionaries);
    }
}

// --- UI Interaction Logic ---
function navigateErrors(direction: 'up' | 'down') {
    if (state.currentFilteredErrors.length === 0) {
        // If no errors, clear current group and context view
        state.currentGroup = null;
        const contextView = document.getElementById('context-view');
        const contextNav = UI.contextNavControls; // Use the UI reference
        if (contextView) contextView.innerHTML = '<div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl"><p class="text-lg mb-2">Tuyệt vời!</p><p class="text-sm opacity-60">Đã xử lý hết lỗi.</p></div>';
        if (contextNav) contextNav.classList.add('hidden');
        return;
    }

    let currentIndex = -1;
    if (state.currentGroup) {
        currentIndex = state.currentFilteredErrors.findIndex(g => g.id === state.currentGroup?.id);
    }
    
    let nextIndex;

    if (direction === 'down') {
        if (currentIndex === -1 || currentIndex >= state.currentFilteredErrors.length - 1) {
            nextIndex = 0; // Wrap around to the beginning or start from beginning if current not found
        } else {
            nextIndex = currentIndex + 1;
        }
    } else { // direction === 'up'
        if (currentIndex === -1 || currentIndex === 0) {
            nextIndex = state.currentFilteredErrors.length - 1; // Wrap around to the end or start from end if current not found
        } else {
            nextIndex = currentIndex - 1;
        }
    }

    const nextGroup = state.currentFilteredErrors[nextIndex];
    if (nextGroup) {
        const errorList = document.getElementById('error-list');
        const nextElement = errorList?.querySelector(`[data-group-id="${nextGroup.id}"]`) as HTMLElement;
        if (nextElement) {
            const selectBtn = nextElement.querySelector('.select-btn') as HTMLButtonElement;
            if(selectBtn) selectBtn.click();
            nextElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
}

function selectGroup(group: ErrorGroup, element: HTMLElement) {
    state.currentGroup = group;
    state.currentInstanceIndex = 0;
    document.querySelectorAll('#error-list > div').forEach(div => {
        div.classList.remove('bg-blue-900/30', 'border-blue-700/50', 'ring-1', 'ring-blue-500/50');
    });
    element.classList.add('bg-blue-900/30', 'border-blue-700/50', 'ring-1', 'ring-blue-500/50');
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function navigateInstance(direction: 'prev' | 'next') {
    if (!state.currentGroup) return;

    const numInstances = state.currentGroup.contexts.length;

    if (numInstances === 0) {
        state.currentInstanceIndex = 0;
    } else if (direction === 'next') {
        state.currentInstanceIndex = (state.currentInstanceIndex + 1) % numInstances;
    } else if (direction === 'prev') {
        state.currentInstanceIndex = (state.currentInstanceIndex - 1 + numInstances) % numInstances;
    }

    renderContextView(UI, state.currentGroup, state.currentInstanceIndex, state.dictionaries);
    updateNavButtons();
}

function resetApp() {
  hideProcessingUI(UI); // Centralized hiding of processing UI, results, and action buttons.
  if (UI.fileInput) UI.fileInput.value = "";
  if (UI.whitelistImportFile) UI.whitelistImportFile.value = "";
  state.currentBookTitle = "";
  state.loadedTextContent.length = 0; // Modified
  state.totalWords = 0;
  state.allDetectedErrors.length = 0; // Modified
  state.currentFilteredErrors.length = 0; // Modified
  state.currentGroup = null;
  state.currentInstanceIndex = 0;
  if (state.currentCoverUrl) {
    URL.revokeObjectURL(state.currentCoverUrl);
    state.currentCoverUrl = null;
  }
  const errorList = document.getElementById('error-list');
  const contextView = document.getElementById('context-view');
  const contextNav = document.getElementById('context-nav-controls');
  if (errorList) errorList.innerHTML = '';
  if (contextView) contextView.innerHTML = '<div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl"><p class="text-lg mb-2">Chưa chọn lỗi nào</p><p class="text-sm opacity-60">Chọn một mục từ danh sách bên trái</p></div>';
  if (contextNav) contextNav.classList.add('hidden');
  if (UI.metaTitle) UI.metaTitle.innerText = "Đang tải...";
  if (UI.metaAuthor) UI.metaAuthor.innerText = "Đang tải...";
  if (UI.metaCover) {
      UI.metaCover.src = "";
      UI.metaCover.classList.add("hidden");
  }
  if (UI.metaCoverPlaceholder) UI.metaCoverPlaceholder.classList.remove("hidden");
  if (UI.dictStatus) { UI.dictStatus.classList.add("hidden"); UI.dictStatus.classList.remove("md:flex", "items-center", "gap-3"); }
  updateStats(UI, 0,0,0);
  logger.log('App reset.');
}

async function handleFile(file: File) {
    if (!file.name.endsWith(".epub")) { showToast("Vui lòng chọn file .epub", "error"); return; }
    // Close any open modals when a new file is uploaded
    UI.settingsModal?.classList.add('hidden');
    if (UI.helpModal) { UI.helpModal.classList.add('hidden'); UI.helpModal.classList.remove('flex', 'items-center', 'justify-center'); }
    if (UI.exportModal) { UI.exportModal.classList.add('hidden'); UI.exportModal.classList.remove('flex', 'items-center', 'justify-center'); }
    hideLoadingOverlay(UI); // Ensure loading overlay is hidden

    resetApp();
    if (!state.dictionaryStatus.isVietnameseLoaded) { showToast("Đang tải dữ liệu từ điển, vui lòng đợi giây lát...", "info"); return; }

    showProcessingUI(UI);

    // Explicitly revoke the old cover URL to prevent memory leaks
    if (state.currentCoverUrl) {
        URL.revokeObjectURL(state.currentCoverUrl);
        state.currentCoverUrl = null;
    }

    try {
        const epubContent: EpubContent = await parseEpub(file, UI);
        state.loadedTextContent = epubContent.textBlocks;
        state.currentBookTitle = epubContent.metadata.title;

        if (UI.metaTitle) UI.metaTitle.innerText = epubContent.metadata.title;
        if (UI.metaAuthor) UI.metaAuthor.innerText = epubContent.metadata.author;
        if (epubContent.metadata.coverUrl && UI.metaCover) {
            state.currentCoverUrl = epubContent.metadata.coverUrl;
            UI.metaCover.src = epubContent.metadata.coverUrl;
            UI.metaCover.classList.remove("hidden");
            if (UI.metaCoverPlaceholder) UI.metaCoverPlaceholder.classList.add("hidden");
        }

        // Always run the initial analysis with all checks enabled to get a master list
        const fullCheckSettings: CheckSettings = { dictionary: true, uppercase: true, tone: true, foreign: true };
        const { errors, totalWords } = await analyzeText(state.loadedTextContent, state.dictionaries, fullCheckSettings, (p: number, m: string) => updateProgress(UI, p, m));
        
        state.allDetectedErrors = groupErrors(errors);
        state.totalWords = totalWords; // Store totalWords in state
        
        updateProgress(UI, 100, 'Hoàn tất');
        
        // Now, filter this master list based on the user's current settings
        filterAndRenderErrors();

        if (state.currentFilteredErrors.length > 0) {
            const firstErrorGroup = state.currentFilteredErrors[0];
            // Find the corresponding DOM element for the first error group
            const errorList = document.getElementById('error-list');
            const firstErrorElement = errorList?.querySelector(`[data-group-id="${firstErrorGroup.id}"]`) as HTMLElement;
            if (firstErrorElement) {
                selectGroup(firstErrorGroup, firstErrorElement);
                firstErrorElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
            logger.log('Book loaded and first error selected.');
        } else {
            // No errors found, display a message in the context view
            const contextView = document.getElementById('context-view');
            const contextNav = UI.contextNavControls;
            if (contextView) {
                contextView.innerHTML = `
                    <div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                        <p class="text-lg mb-2">Tuyệt vời!</p>
                        <p class="text-sm opacity-60">Cuốn sách này không có lỗi nào.</p>
                    </div>`;
            }
            if (contextNav) contextNav.classList.add('hidden');
            state.currentGroup = null; // Clear current group state
            logger.log('Book loaded. No errors found.');
        }

        if (UI.processingUi) UI.processingUi.classList.add("hidden"); // Explicitly hide processing UI if it was shown
        if (UI.processingUiHeader) { // Explicitly hide processing header if it was shown
            UI.processingUiHeader.classList.remove('flex', 'items-end', 'justify-between', 'mb-4');
            UI.processingUiHeader.classList.add('hidden');
        }
        showResultsUI(UI);

    } catch (err) {
        logger.error("Error processing EPUB file:", err);
        showToast("Có lỗi xảy ra: " + (err instanceof Error ? err.message : String(err)), "error");
        resetApp();
    }
}

// --- 5. INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', async () => {
    // Ensure elements that start hidden are indeed hidden after removing 'hidden' from HTML
    UI.exportBtn?.classList.add('hidden');
    UI.resetBtn?.classList.add('hidden');
    UI.dictStatus?.classList.add('hidden');
    hideLoadingOverlay(UI); // Use helper for loading overlay
    UI.exportModal?.classList.add('hidden');
    UI.helpModal?.classList.add('hidden');
    UI.settingsModal?.classList.add('hidden');
    // Call hideProcessingUI which internally handles processingUi, processingUiHeader, resultsSection, etc.
    hideProcessingUI(UI); 
    UI.engLoading?.classList.add('hidden');
   const { dictionaries, status } = await loadDictionaries(UI);  state.dictionaries = dictionaries;
  state.dictionaryStatus = status;
  logger.log('Dictionaries Loaded:', state.dictionaryStatus);
  
  loadSettings();
  loadWhitelist();
  loadEngFilter();
  loadReaderSettings();

  // Event Listeners
  UI.fileInput?.addEventListener('change', (e) => (e.target as HTMLInputElement).files?.[0] && handleFile((e.target as HTMLInputElement).files![0]));
  UI.uploadSection?.addEventListener('click', () => UI.fileInput?.click());
  UI.resetBtn?.addEventListener('click', resetApp);
  
  (document.getElementById("btn-prev") as HTMLButtonElement)?.addEventListener('click', () => navigateInstance('prev'));
  (document.getElementById("btn-next") as HTMLButtonElement)?.addEventListener('click', () => navigateInstance('next'));

  UI.settingsBtn?.addEventListener('click', () => UI.settingsModal?.classList.remove('hidden'));
  UI.closeSettingsBtn?.addEventListener('click', () => UI.settingsModal?.classList.add('hidden'));

  UI.helpBtn?.addEventListener('click', () => { if (UI.helpModal) { UI.helpModal.classList.remove('hidden'); UI.helpModal.classList.add('flex', 'items-center', 'justify-center'); } });
  UI.closeHelpBtn?.addEventListener('click', () => { if (UI.helpModal) { UI.helpModal.classList.add('hidden'); UI.helpModal.classList.remove('flex', 'items-center', 'justify-center'); } });

  UI.exportBtn?.addEventListener('click', (e) => { e.stopPropagation(); if (UI.exportModal) { UI.exportModal.classList.remove('hidden'); UI.exportModal.classList.add('flex', 'items-center', 'justify-center'); } });
  UI.closeExportBtn?.addEventListener('click', () => { if (UI.exportModal) { UI.exportModal.classList.add('hidden'); UI.exportModal.classList.remove('flex', 'items-center', 'justify-center'); } });
  UI.exportVctveBtn?.addEventListener('click', () => performExport('vctve'));
  UI.exportNormalBtn?.addEventListener('click', () => performExport('normal'));

  UI.fontToggleBtn?.addEventListener('click', () => {
    state.readerSettings.fontFamily = state.readerSettings.fontFamily === 'serif' ? 'sans-serif' : 'serif';
    saveReaderSettings();
  });
  UI.sizeUpBtn?.addEventListener('click', () => {
    if (state.readerSettings.fontSize < 3) {
      state.readerSettings.fontSize = Math.round((state.readerSettings.fontSize + 0.25) * 100) / 100;
      saveReaderSettings();
    }
  });
  UI.sizeDownBtn?.addEventListener('click', () => {
    if (state.readerSettings.fontSize > 0.8) {
      state.readerSettings.fontSize = Math.round((state.readerSettings.fontSize - 0.25) * 100) / 100;
      saveReaderSettings();
    }
  });

  Object.values(UI.settingToggles).forEach((toggle: HTMLInputElement | null) => toggle?.addEventListener('change', saveSettings));
  
  UI.whitelistInput?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
          saveWhitelist();
          filterAndRenderErrors();
      }, 500);
  });
  UI.exportWhitelistBtn?.addEventListener('click', exportWhitelist);
  UI.importWhitelistBtn?.addEventListener('click', () => UI.whitelistImportFile?.click());
  UI.whitelistImportFile?.addEventListener('change', handleImportWhitelist);

  UI.engFilterCheckbox?.addEventListener('change', saveEngFilter);

  UI.uploadSection?.addEventListener('dragover', (_e) => { _e.preventDefault(); _e.stopPropagation(); UI.uploadSection?.classList.add('border-blue-500/50', 'bg-slate-800/50'); });
  UI.uploadSection?.addEventListener('dragleave', (_e) => { _e.preventDefault(); _e.stopPropagation(); UI.uploadSection?.classList.remove('border-blue-500/50', 'bg-slate-800/50'); });
  UI.uploadSection?.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); UI.uploadSection?.classList.remove('border-blue-500/50', 'bg-slate-800/50'); if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]); });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
      const activeElement = document.activeElement;
      if (activeElement && ['TEXTAREA', 'INPUT'].includes(activeElement.tagName)) {
          return;
      }

      if (state.currentFilteredErrors.length === 0) return;

      switch (e.key) {
          case 'ArrowDown':
              e.preventDefault();
              navigateErrors('down');
              break;
          case 'ArrowUp':
              e.preventDefault();
              navigateErrors('up');
              break;
          case 'Delete':
          case 'i':
              if (state.currentGroup) {
                  e.preventDefault();
                  quickIgnore();
              }
              break;
      }
  });

  // Global click handler to close modals when clicking outside
  document.addEventListener('click', (e) => {
      // Settings Modal
      if (UI.settingsModal && !UI.settingsModal.classList.contains('hidden') &&
          !UI.settingsModal.contains(e.target as Node) &&
          !UI.settingsBtn?.contains(e.target as Node)) {
          UI.settingsModal.classList.add('hidden');
      }
      // Help Modal
      if (UI.helpModal && !UI.helpModal.classList.contains('hidden') &&
          !UI.helpModalContent?.contains(e.target as Node) &&
          !UI.helpBtn?.contains(e.target as Node)) {
          UI.helpModal.classList.add('hidden');
          UI.helpModal.classList.remove('flex', 'items-center', 'justify-center');
      }
      // Export Modal
      if (UI.exportModal && !UI.exportModal.classList.contains('hidden') &&
          !UI.exportModal.contains(e.target as Node) &&
          !UI.exportBtn?.contains(e.target as Node)) {
          UI.exportModal.classList.add('hidden');
          UI.exportModal.classList.remove('flex', 'items-center', 'justify-center');
      }
  });

  // Clear debounce timer on page unload
  window.addEventListener('beforeunload', () => {
    clearTimeout(debounceTimer);
  });
});
import './style.css';
import { loadDictionaries } from './utils/dictionary';
import { logger } from './utils/logger';
import { parseEpub } from './utils/epub-parser';
import { EpubContent } from './types/epub';
import { UIElements } from './types/ui';
import { state, loadStateFromLocalStorage, saveWhitelist, saveReaderSettings, loadWhitelist as loadWhitelistFromState, resetState } from './state';
import { analyzeText, groupErrors, CheckSettings } from './utils/analyzer';
import { ErrorGroup } from './types/errors';
import { renderErrorList, renderContextView, updateStats, updateProgress, copyToClipboard } from './utils/ui-render';
import { parseWhitelistWithOriginalCase } from './utils/whitelist-parser';
import { getFilteredErrors } from './utils/filter';
import { showProcessingUI, hideProcessingUI, showResultsUI, showLoadingOverlay, hideLoadingOverlay, updateUIWhitelistInput } from './utils/ui-utils';
import { showToast } from './utils/notifications';
import { openModal, closeModal } from './utils/modal';
import { DEBOUNCE_DELAY_MS, FILE_SIZE_LIMIT_BYTES, WHITELIST_WORD_COUNT_LIMIT, WHITELIST_WORD_LENGTH_LIMIT, FONT_SIZE_MAX_REM, FONT_SIZE_MIN_REM, SETTINGS_FILTER_DEBOUNCE_MS, EPUB_FILE_EXTENSION, WHITELIST_FILE_EXTENSIONS } from './constants';

let debounceTimer: number;



let isUpdating = false;

const handleGlobalKeydown = (e: KeyboardEvent) => {
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
};

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
};



// --- Whitelist & Filter Logic ---
function clearContextView() {
    const contextView = document.getElementById('context-view');
    const contextNav = document.getElementById('context-nav');
    if (contextView) contextView.innerHTML = '<div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl"><p class="text-lg mb-2">Tuyệt vời!</p><p class="text-sm opacity-60">Đã xử lý hết lỗi.</p></div>';
    contextNav?.classList.add('hidden');
    state.currentGroup = null;
}

function selectNextError(wordToIgnoreId: string, originalIndex: number) {
    const errorList = document.getElementById('error-list');

    if (state.currentFilteredErrors.length > 0) {
        let targetIndex;
        const reFoundIndex = state.currentFilteredErrors.findIndex((_g: ErrorGroup) => _g.id === wordToIgnoreId);

        if (reFoundIndex !== -1) {
            targetIndex = reFoundIndex;
        } else {
            targetIndex = Math.min(originalIndex, state.currentFilteredErrors.length - 1);
            if (targetIndex < 0) targetIndex = 0;
        }

        const nextGroup = state.currentFilteredErrors[targetIndex];
        const nextElementInList = errorList?.querySelector(`[data-group-id="${nextGroup.id}"]`) as HTMLElement | null;
        if (nextElementInList) {
            selectGroup(nextGroup, nextElementInList);
            nextElementInList.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    } else {
        clearContextView();
    }
}

function quickIgnore() {
    if (!state.currentGroup) {
        logger.info("No current error group to ignore.");
        return;
    }

    const wordToIgnore = state.currentGroup.word;
    const wordToIgnoreId = state.currentGroup.id;
    const originalIndex = state.currentFilteredErrors.findIndex((_g: ErrorGroup) => _g.id === wordToIgnoreId);

    if (updateWhitelist(wordToIgnore)) {
        updateAndRenderErrors();
        selectNextError(wordToIgnoreId, originalIndex);
    }
}

function updateWhitelist(word: string): boolean {
    if (!UI.whitelistInput) return false;

    const { display, check } = parseWhitelistWithOriginalCase(UI.whitelistInput.value);

    if (check.has(word.toLowerCase())) {
        logger.info(`'${word}' is already in the whitelist.`);
        return false;
    }

    display.push(word);
    updateUIWhitelistInput(UI, display.join(", "));
    saveWhitelist(UI.whitelistInput.value);
    return true;
}

function quickIgnoreWordFromList(word: string) {
    if (updateWhitelist(word)) {
        updateAndRenderErrors();
    }
}

function clearWhitelist() {
    if (!UI.whitelistInput) return;
    if (UI.whitelistInput.value.trim() === "") {
        showToast("Danh sách đã trống.", "info");
        return;
    }
    openModal(UI, 'clear-whitelist');
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
    if (!WHITELIST_FILE_EXTENSIONS.includes(fileExtension || "")) {
        showToast("Lỗi: Tệp phải là tệp văn bản (.txt, .md)", "error");
        fileInput.value = '';
        return;
    }

    if (file.size > FILE_SIZE_LIMIT_BYTES) {
        showToast("Lỗi: Kích thước tệp không được vượt quá 1MB", "error");
        fileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const newContent = e.target?.result as string;

        const { display: importedDisplay } = parseWhitelistWithOriginalCase(newContent);

        if (importedDisplay.length > WHITELIST_WORD_COUNT_LIMIT) {
            showToast("Lỗi: Danh sách trắng không được chứa nhiều hơn 10,000 từ", "error");
            fileInput.value = '';
            return;
        }

        const validWordRegex = /^[a-zA-Z\p{L}-]+$/u;
        const validWords: string[] = [];
        const invalidWords: string[] = [];

        for (const word of importedDisplay) {
            if (word.length > WHITELIST_WORD_LENGTH_LIMIT) {
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

        updateUIWhitelistInput(UI, finalDisplay.join(", ") + (finalDisplay.length > 0 ? ", " : ""));
        saveWhitelist(UI.whitelistInput!.value);
        updateAndRenderErrors();

        fileInput.value = '';
    };
    reader.readAsText(file);
}





// --- Filtering and Rendering ---
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
        updateStats(UI, state.totalWords, totalErrorInstances, state.currentFilteredErrors.length);
        renderErrorList(UI, state.currentFilteredErrors);
    } finally {
        isUpdating = false;
    }
}

// --- Settings Logic ---
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
            logger.info('Filtering complete after settings change.');
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
    return sanitized.replace(/[\u0000-\u001F]/g, "");
}

function performExport(type: 'vctve' | 'normal') {
    if (state.currentFilteredErrors.length === 0) {
        showToast("Không có lỗi nào để xuất!", "info");
        closeModal(UI, 'export');
        return;
    }

    let content = "";
    if (type === 'vctve') {
        content = state.currentFilteredErrors.map((_g: ErrorGroup) => `${_g.word} ==>`).join("\n\n");
    } else {
        content = state.currentFilteredErrors.map((_g: ErrorGroup) => _g.word).join("\n");
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

    closeModal(UI, 'export');
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



// --- UI Interaction Logic ---
function navigateErrors(direction: 'up' | 'down') {
    if (state.currentFilteredErrors.length === 0) {
        state.currentGroup = null;
        const contextView = document.getElementById('context-view');
        const contextNav = UI.contextNavControls;
        if (contextView) contextView.innerHTML = '<div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl"><p class="text-lg mb-2">Tuyệt vời!</p><p class="text-sm opacity-60">Đã xử lý hết lỗi.</p></div>';
        contextNav?.classList.add('hidden');
        return;
    }

    let currentIndex = -1;
    if (state.currentGroup) {
        currentIndex = state.currentFilteredErrors.findIndex((_g: ErrorGroup) => _g.id === state.currentGroup?.id);
    }

    let nextIndex;

    if (direction === 'down') {
        if (currentIndex === -1 || currentIndex >= state.currentFilteredErrors.length - 1) {
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
        const errorList = document.getElementById('error-list');
        const nextElement = errorList?.querySelector(`[data-group-id="${nextGroup.id}"]`) as HTMLElement;
        if (nextElement) {
            selectGroup(nextGroup, nextElement);
            copyToClipboard(nextGroup.word);
            nextElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
}

function selectGroup(group: ErrorGroup, element: HTMLElement) {
    state.selectedErrorElement?.classList.remove('bg-blue-900/30', 'border-blue-700/50', 'ring-1', 'ring-blue-500/50');

    state.currentGroup = group;
    state.currentInstanceIndex = 0;

    element.classList.add('bg-blue-900/30', 'border-blue-700/50', 'ring-1', 'ring-blue-500/50');

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
    hideProcessingUI(UI);
    if (UI.fileInput) UI.fileInput.value = "";
    if (UI.whitelistImportFile) UI.whitelistImportFile.value = "";
    if (UI.engFilterCheckbox) UI.engFilterCheckbox.checked = false;

    resetState();

    if (UI.settingToggles.dict) UI.settingToggles.dict.checked = state.checkSettings.dictionary;
    if (UI.settingToggles.case) UI.settingToggles.case.checked = state.checkSettings.uppercase;
    if (UI.settingToggles.tone) UI.settingToggles.tone.checked = state.checkSettings.tone;
    if (UI.settingToggles.struct) UI.settingToggles.struct.checked = state.checkSettings.foreign;

    if (state.currentCoverUrl) {
        URL.revokeObjectURL(state.currentCoverUrl);
        state.currentCoverUrl = null;
    }
    const errorList = document.getElementById('error-list');
    const contextView = document.getElementById('context-view');
    const contextNav = document.getElementById('context-nav-controls');
    if (errorList) errorList.innerHTML = '';
    if (contextView) contextView.innerHTML = '<div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl"><p class="text-lg mb-2">Chưa chọn lỗi nào</p><p class="text-sm opacity-60">Chọn một mục từ danh sách bên trái</p></div>';
    contextNav?.classList.add('hidden');
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
    logger.info('App reset.');
}

function closeAllModals() {
    closeModal(UI, 'settings');
    closeModal(UI, 'help');
    closeModal(UI, 'export');
    closeModal(UI, 'clear-whitelist');
}

function prepareForNewFile(): boolean {
    resetApp();
    if (!state.dictionaryStatus.isVietnameseLoaded) {
        showToast("Đang tải dữ liệu từ điển, vui lòng đợi giây lát...", "info");
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
    const fullCheckSettings: CheckSettings = { dictionary: true, uppercase: true, tone: true, foreign: true };
    const { errors, totalWords } = await analyzeText(epubContent.textBlocks, state.dictionaries, fullCheckSettings, (p: number, m: string) => updateProgress(UI, p, m));

    state.allDetectedErrors = groupErrors(errors);
    state.totalWords = totalWords;

    updateProgress(UI, 100, 'Hoàn tất');

    updateAndRenderErrors();

    if (state.currentFilteredErrors.length > 0) {
        const firstErrorGroup = state.currentFilteredErrors[0];
        const errorList = document.getElementById('error-list');
        const firstErrorElement = errorList?.querySelector(`[data-group-id="${firstErrorGroup.id}"]`) as HTMLElement;
        if (firstErrorElement) {
            selectGroup(firstErrorGroup, firstErrorElement);
            firstErrorElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        logger.info('Book loaded and first error selected.');
    } else {
        const contextView = document.getElementById('context-view');
        const contextNav = UI.contextNavControls;
        if (contextView) {
            contextView.innerHTML = `
                <div class="text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                    <p class="text-lg mb-2">Tuyệt vời!</p>
                    <p class="text-sm opacity-60">Cuốn sách này không có lỗi nào.</p>
                </div>`;
        }
        contextNav?.classList.add('hidden');
        state.currentGroup = null;
        logger.info('Book loaded. No errors found.');
    }

    UI.processingUi?.classList.add("hidden");
    if (UI.processingUiHeader) {
        UI.processingUiHeader.classList.remove('flex', 'items-end', 'justify-between', 'mb-4');
        UI.processingUiHeader.classList.add('hidden');
    }
    showResultsUI(UI);
}

async function handleFile(file: File) {
    if (!file.name.endsWith(EPUB_FILE_EXTENSION)) {
        showToast("Vui lòng chọn file .epub", "error");
        return;
    }

    closeAllModals();
    if (!prepareForNewFile()) return;

    showProcessingUI(UI);

    if (state.currentCoverUrl) {
        URL.revokeObjectURL(state.currentCoverUrl);
        state.currentCoverUrl = null;
    }

    try {
        const epubContent: EpubContent = await parseEpub(file, UI);
        updateBookMetadata(epubContent);
        await runAnalysis(epubContent);
    } catch (err) {
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
        showToast(errorMessage, "error");
        resetApp();
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    document.body.removeAttribute('hidden');
    UI.exportBtn?.classList.add('hidden');
    UI.resetBtn?.classList.add('hidden');
    UI.dictStatus?.classList.add('hidden');
    hideLoadingOverlay(UI);
    closeModal(UI, 'export');
    closeModal(UI, 'help');
    closeModal(UI, 'settings');
    closeModal(UI, 'clear-whitelist');
    hideProcessingUI(UI);
    UI.engLoading?.classList.add('hidden');
    try {
        const { dictionaries, status } = await loadDictionaries(UI);
        state.dictionaries = dictionaries;
        state.dictionaryStatus = status;
        logger.info('Dictionaries Loaded:', state.dictionaryStatus);
    } catch (error) {
        logger.error('Failed to load dictionaries:', error);
        showToast('Lỗi tải từ điển. Vui lòng tải lại trang.', 'error');
        UI.fileInput?.setAttribute('disabled', 'true');
        UI.uploadSection?.classList.add('opacity-50', 'pointer-events-none');
    }


    loadStateFromLocalStorage();

    updateUIWhitelistInput(UI, loadWhitelistFromState());
    if (UI.engFilterCheckbox) UI.engFilterCheckbox.checked = state.isEngFilterEnabled;
    applyReaderStyles();


    UI.fileInput?.addEventListener('change', (e) => (e.target as HTMLInputElement).files?.[0] && handleFile((e.target as HTMLInputElement).files![0]));
    UI.uploadSection?.addEventListener('click', () => UI.fileInput?.click());
    UI.resetBtn?.addEventListener('click', resetApp);

    (document.getElementById("btn-prev") as HTMLButtonElement)?.addEventListener('click', () => navigateInstance('prev'));
    (document.getElementById("btn-next") as HTMLButtonElement)?.addEventListener('click', () => navigateInstance('next'));

    UI.settingsBtn?.addEventListener('click', () => { openModal(UI, 'settings'); });
    UI.closeSettingsBtn?.addEventListener('click', () => { closeModal(UI, 'settings'); });

    UI.helpBtn?.addEventListener('click', () => { openModal(UI, 'help'); });
    UI.closeHelpBtn?.addEventListener('click', () => { closeModal(UI, 'help'); });

    UI.exportBtn?.addEventListener('click', (e) => { e.stopPropagation(); openModal(UI, 'export'); });
    UI.closeExportBtn?.addEventListener('click', () => { closeModal(UI, 'export'); });
    UI.exportVctveBtn?.addEventListener('click', () => performExport('vctve'));
    UI.exportNormalBtn?.addEventListener('click', () => performExport('normal'));

    UI.fontToggleBtn?.addEventListener('click', () => {
        state.readerSettings.fontFamily = state.readerSettings.fontFamily === 'serif' ? 'sans-serif' : 'serif';
        saveReaderSettings();
        applyReaderStyles();
    });
    UI.sizeUpBtn?.addEventListener('click', () => {
        if (state.readerSettings.fontSize < FONT_SIZE_MAX_REM) {
            state.readerSettings.fontSize = Math.round((state.readerSettings.fontSize + 0.25) * 100) / 100;
            saveReaderSettings();
            applyReaderStyles();
        }
    });
    UI.sizeDownBtn?.addEventListener('click', () => {
        if (state.readerSettings.fontSize > FONT_SIZE_MIN_REM) {
            state.readerSettings.fontSize = Math.round((state.readerSettings.fontSize - 0.25) * 100) / 100;
            saveReaderSettings();
            applyReaderStyles();
        }
    });

    Object.values(UI.settingToggles).forEach((toggle: HTMLInputElement | null) => toggle?.addEventListener('change', saveSettings));

    UI.whitelistInput?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
            saveWhitelist(UI.whitelistInput!.value);
            updateAndRenderErrors();
        }, DEBOUNCE_DELAY_MS);
    });
    UI.exportWhitelistBtn?.addEventListener('click', exportWhitelist);
    UI.importWhitelistBtn?.addEventListener('click', () => UI.whitelistImportFile?.click());
    UI.clearWhitelistBtn?.addEventListener('click', clearWhitelist);
    UI.whitelistImportFile?.addEventListener('change', handleImportWhitelist);

    UI.closeClearWhitelistBtn?.addEventListener('click', () => closeModal(UI, 'clear-whitelist'));
    UI.cancelClearWhitelistBtn?.addEventListener('click', () => closeModal(UI, 'clear-whitelist'));
    UI.confirmClearWhitelistBtn?.addEventListener('click', () => {
        updateUIWhitelistInput(UI, "");
        saveWhitelist("");
        updateAndRenderErrors();
        closeModal(UI, 'clear-whitelist');
        showToast("Đã xoá hết danh sách bỏ qua.", "info");
    });

    UI.engFilterCheckbox?.addEventListener('change', () => {
        state.isEngFilterEnabled = UI.engFilterCheckbox?.checked ?? false;
        updateAndRenderErrors();
    });

    UI.uploadSection?.addEventListener('dragover', (_e) => { _e.preventDefault(); _e.stopPropagation(); UI.uploadSection?.classList.add('border-blue-500/50', 'bg-slate-800/50'); });
    UI.uploadSection?.addEventListener('dragleave', (_e) => { _e.preventDefault(); _e.stopPropagation(); UI.uploadSection?.classList.remove('border-blue-500/50', 'bg-slate-800/50'); });
    UI.uploadSection?.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); UI.uploadSection?.classList.remove('border-blue-500/50', 'bg-slate-800/50'); if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]); });



    document.addEventListener('keydown', handleGlobalKeydown as EventListener);

    const errorListElement = document.getElementById("error-list");
    if (errorListElement) {
        errorListElement.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const errorItem = target.closest('[data-group-id]') as HTMLElement;
            if (!errorItem) return;

            const groupId = errorItem.dataset.groupId;
            const group = state.currentFilteredErrors.find(g => g.id === groupId);
            if (!group) return;

            // Handle ignore button
            if (target.closest('.ignore-btn')) {
                e.stopPropagation();
                quickIgnoreWordFromList(group.word);
                return;
            }

            // Handle select button or item click
            selectGroup(group, errorItem);
            copyToClipboard(group.word);
        });
    }

    document.addEventListener('click', (e) => {
        if (UI.settingsModal && !UI.settingsModal.contains(e.target as Node) && !UI.settingsBtn?.contains(e.target as Node)) {
            closeModal(UI, 'settings');
        }
        if (UI.helpModal && !UI.helpModalContent?.contains(e.target as Node) && !UI.helpBtn?.contains(e.target as Node)) {
            closeModal(UI, 'help');
        }
        if (UI.exportModal && !UI.exportModal.contains(e.target as Node) && !UI.exportBtn?.contains(e.target as Node)) {
            closeModal(UI, 'export');
        }
        if (UI.clearWhitelistModal && !UI.clearWhitelistModal.contains(e.target as Node) && !UI.clearWhitelistBtn?.contains(e.target as Node)) {
            closeModal(UI, 'clear-whitelist');
        }
    });

    window.addEventListener('beforeunload', () => {
        clearTimeout(debounceTimer);
    });
});

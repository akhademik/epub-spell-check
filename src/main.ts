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

const SETTINGS_KEY = "vn_spell_settings";
const WHITELIST_KEY = "vn_spell_whitelist";
const ENG_FILTER_KEY = "vn_spell_eng_filter";
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
  
  metaTitle: document.getElementById("meta-title"),
  metaAuthor: document.getElementById("meta-author"),
  metaCover: document.getElementById("meta-cover") as HTMLImageElement,
  metaCoverPlaceholder: document.getElementById("meta-cover-placeholder"),

  settingsBtn: document.getElementById("settings-btn"),
  settingsModal: document.getElementById("settings-modal"),
  closeSettingsBtn: document.getElementById("close-settings-btn"),
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
};

// --- Whitelist & Filter Logic ---
function quickIgnore(word: string) {
    if (!UI.whitelistInput) return;
    const currentWhitelist = UI.whitelistInput.value;
    const newWhitelist = currentWhitelist ? `${currentWhitelist}, ${word}` : `${word}, `;
    UI.whitelistInput.value = newWhitelist;
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
        alert("Danh sách trống!");
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueTokens = [...new Set(UI.whitelistInput.value.split(/[,;"]+/).map((t: any) => t.trim()).filter(Boolean))];
    const blob = new Blob([uniqueTokens.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whitelist-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function handleImportWhitelist(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !UI.whitelistInput) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const newContent = e.target?.result as string;
        const currentContent = UI.whitelistInput!.value;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const combined = [...new Set((currentContent + " " + newContent).split(/[,;"]+/).map((t: any) => t.trim()).filter(Boolean))];
        UI.whitelistInput!.value = combined.join(", ") + (combined.length > 0 ? ", " : "");
        saveWhitelist();
        filterAndRenderErrors();
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userWhitelist = new Set(UI.whitelistInput.value.split(/[,;"]+/).map((t: any) => t.trim().toLowerCase()).filter(Boolean));
    
    state.currentFilteredErrors = state.allDetectedErrors.filter(group => {
        const lowerWord = group.word.toLowerCase();
        if (userWhitelist.has(lowerWord)) return false;
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
    renderErrorList(UI, state.currentFilteredErrors, selectGroup, quickIgnore);
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
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) loadingOverlay.classList.remove('hidden');
        
        // Use a short timeout to allow the UI to update (e.g., show overlay) before filtering
        setTimeout(() => {
            filterAndRenderErrors();
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
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

// --- UI Interaction Logic ---
function selectGroup(group: ErrorGroup, element: HTMLElement) {
    state.currentGroup = group;
    state.currentInstanceIndex = 0;
    document.querySelectorAll('#error-list > div').forEach(div => {
        div.classList.remove('bg-blue-900/30', 'border-blue-700/50', 'ring-1', 'ring-blue-500/50');
    });
    element.classList.add('bg-blue-900/30', 'border-blue-700/50', 'ring-1', 'ring-blue-500/50');
    renderContextView(UI, group, state.currentInstanceIndex);
    updateNavButtons();
}

function updateNavButtons() {
    const btnPrev = document.getElementById("btn-prev") as HTMLButtonElement;
    const btnNext = document.getElementById("btn-next") as HTMLButtonElement;
    if (!btnPrev || !btnNext || !state.currentGroup) return;

    btnPrev.disabled = state.currentInstanceIndex === 0;
    btnNext.disabled = state.currentInstanceIndex >= state.currentGroup.contexts.length - 1;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function navigateInstance(direction: 'prev' | 'next') {
    if (!state.currentGroup) return;

    if (direction === 'next' && state.currentInstanceIndex < state.currentGroup.contexts.length - 1) {
        state.currentInstanceIndex++;
    } else if (direction === 'prev' && state.currentInstanceIndex > 0) {
        state.currentInstanceIndex--;
    }

    renderContextView(UI, state.currentGroup, state.currentInstanceIndex);
    updateNavButtons();
}

function resetApp() {
  if (UI.resultsSection) UI.resultsSection.classList.add("hidden");
  if (UI.resetBtn) UI.resetBtn.classList.add("hidden");
  if (UI.exportBtn) UI.exportBtn.classList.add("hidden");
  if (UI.uploadSection) UI.uploadSection.classList.remove("hidden");
  if (UI.fileInput) UI.fileInput.value = "";
  state.currentBookTitle = "";
  state.loadedTextContent = [];
  state.totalWords = 0;
  state.allDetectedErrors = [];
  state.currentFilteredErrors = [];
  state.currentGroup = null;
  state.currentInstanceIndex = 0;
  if (state.currentCoverUrl) {
    URL.revokeObjectURL(state.currentCoverUrl);
    state.currentCoverUrl = null;
  }
  const errorList = document.getElementById('error-list');
  const contextView = document.getElementById('context-view');
  const contextNav = document.getElementById('nav-indicator');
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
  updateStats(UI, 0,0,0);
  logger.log('App reset.');
}

async function handleFile(file: File) {
    if (!file.name.endsWith(".epub")) { alert("Vui lòng chọn file .epub"); return; }
    // Close any open modals when a new file is uploaded
    UI.settingsModal?.classList.add('hidden');
    // UI.helpModal and UI.exportModal are not yet in the UI object, but will be added later.
    // For now, only handle settingsModal.
    resetApp();
    if (!state.dictionaryStatus.isVietnameseLoaded) { alert("Đang tải dữ liệu từ điển, vui lòng đợi giây lát..."); return; }

    if (UI.uploadSection) UI.uploadSection.classList.add("hidden");
    if (UI.processingUi) UI.processingUi.classList.remove("hidden");

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

        if (UI.processingUi) UI.processingUi.classList.add("hidden");
        if (UI.resultsSection) UI.resultsSection.classList.remove("hidden");
        if (UI.resetBtn) UI.resetBtn.classList.remove("hidden");
        if (UI.exportBtn) UI.exportBtn.classList.remove("hidden");

    } catch (err) {
        logger.error("Error processing EPUB file:", err);
        alert("Có lỗi xảy ra: " + (err instanceof Error ? err.message : String(err)));
        resetApp();
    }
}

// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  const { dictionaries, status } = await loadDictionaries(UI);
  state.dictionaries = dictionaries;
  state.dictionaryStatus = status;
  logger.log('Dictionaries Loaded:', state.dictionaryStatus);
  
  loadSettings();
  loadWhitelist();
  loadEngFilter();

  // Event Listeners
  UI.fileInput?.addEventListener('change', (e) => (e.target as HTMLInputElement).files?.[0] && handleFile((e.target as HTMLInputElement).files![0]));
  UI.uploadSection?.addEventListener('click', () => UI.fileInput?.click());
  UI.resetBtn?.addEventListener('click', resetApp);
  
  (document.getElementById("btn-prev") as HTMLButtonElement)?.addEventListener('click', () => navigateInstance('prev'));
  (document.getElementById("btn-next") as HTMLButtonElement)?.addEventListener('click', () => navigateInstance('next'));

  UI.settingsBtn?.addEventListener('click', () => UI.settingsModal?.classList.remove('hidden'));
  UI.closeSettingsBtn?.addEventListener('click', () => UI.settingsModal?.classList.add('hidden'));
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

  // Global click handler to close modals when clicking outside
  document.addEventListener('click', (e) => {
      // Settings Modal
      if (UI.settingsModal && !UI.settingsModal.classList.contains('hidden') &&
          !UI.settingsModal.contains(e.target as Node) &&
          !UI.settingsBtn?.contains(e.target as Node)) {
          UI.settingsModal.classList.add('hidden');
      }
      // Help Modal and Export Modal will be added here once their UI elements are defined in main.ts
  });
});
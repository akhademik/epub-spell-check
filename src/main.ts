// src/main.ts
import './style.css';
import { loadDictionaries } from './utils/dictionary';
import { logger } from './utils/logger';
import { parseEpub } from './utils/epub-parser';
import { EpubContent } from './types/epub';
import { UIElements } from './types/ui';
import { GlobalState } from './types/state';


// --- 2. DOM ELEMENTS & STATE ---
const UI: UIElements = {
  dictStatus: document.getElementById("dict-status"),
  dictDot: document.getElementById("dict-dot"),
  dictText: document.getElementById("dict-text"),
  fileInput: document.getElementById("file-input") as HTMLInputElement,
  uploadSection: document.getElementById("upload-section"),
  processingUi: document.getElementById("processing-ui"),
  resultsSection: document.getElementById("results-section"),
  metaTitle: document.getElementById("meta-title"),
  metaAuthor: document.getElementById("meta-author"),
  metaCover: document.getElementById("meta-cover") as HTMLImageElement,
  metaCoverPlaceholder: document.getElementById("meta-cover-placeholder"),
  progressBar: document.getElementById("progress-bar"),
  progressPercent: document.getElementById("progress-percent"),
  statusText: document.getElementById("status-text"),
  resetBtn: document.getElementById("reset-btn"),
  exportBtn: document.getElementById("export-btn"),
};

const state: GlobalState = {
  dictionaries: {
    vietnamese: new Set(),
    english: new Set(),
    custom: new Set(),
  },
  dictionaryStatus: {
    isVietnameseLoaded: false,
    isEnglishLoaded: false,
    isCustomLoaded: false,
    vietnameseWordCount: 0,
    englishWordCount: 0,
    customWordCount: 0,
  },
  currentBookTitle: '',
  loadedTextContent: [],
  currentCoverUrl: null,
};

// --- Helper Functions ---
function resetApp() {
  if (UI.resultsSection) UI.resultsSection.classList.add("hidden");
  if (UI.resetBtn) UI.resetBtn.classList.add("hidden");
  if (UI.exportBtn) UI.exportBtn.classList.add("hidden");
  if (UI.uploadSection) UI.uploadSection.classList.remove("hidden");
  if (UI.fileInput) UI.fileInput.value = "";

  state.currentBookTitle = "";
  state.loadedTextContent = [];

  if (state.currentCoverUrl) {
    URL.revokeObjectURL(state.currentCoverUrl);
    state.currentCoverUrl = null;
  }

  if (UI.metaTitle) UI.metaTitle.innerText = "Đang tải...";
  if (UI.metaAuthor) UI.metaAuthor.innerText = "Đang tải...";
  if (UI.metaCover) UI.metaCover.src = "";
  if (UI.metaCover) UI.metaCover.classList.add("hidden");
  if (UI.metaCoverPlaceholder) UI.metaCoverPlaceholder.classList.remove("hidden");

  logger.log('App reset.');
}

// --- Main File Handler ---
async function handleFile(file: File) {
  if (!file.name.endsWith(".epub")) {
    alert("Vui lòng chọn file .epub");
    logger.warn('Non-EPUB file selected.');
    return;
  }

  if (state.currentCoverUrl) {
    URL.revokeObjectURL(state.currentCoverUrl);
    state.currentCoverUrl = null;
  }

  if (!state.dictionaryStatus.isVietnameseLoaded) {
    alert("Đang tải dữ liệu từ điển, vui lòng đợi giây lát...");
    logger.warn('Attempted file upload before dictionaries loaded.');
    return;
  }

  // UI state for processing
  if (UI.uploadSection) UI.uploadSection.classList.add("hidden");
  if (UI.resultsSection) UI.resultsSection.classList.add("hidden");
  if (UI.processingUi) UI.processingUi.classList.remove("hidden");

  if (UI.metaTitle) UI.metaTitle.innerText = "Đang tải...";
  if (UI.metaAuthor) UI.metaAuthor.innerText = "Đang tải...";
  if (UI.metaCover) UI.metaCover.src = "";
  if (UI.metaCover) UI.metaCover.classList.add("hidden");
  if (UI.metaCoverPlaceholder) UI.metaCoverPlaceholder.classList.remove("hidden");


  try {
    const epubContent: EpubContent = await parseEpub(file, UI);

    state.loadedTextContent = epubContent.textBlocks;
    state.currentBookTitle = epubContent.metadata.title;

    if (UI.metaTitle) UI.metaTitle.innerText = epubContent.metadata.title;
    if (UI.metaAuthor) UI.metaAuthor.innerText = epubContent.metadata.author;

    if (epubContent.metadata.coverUrl) {
      state.currentCoverUrl = epubContent.metadata.coverUrl;
      if (UI.metaCover) UI.metaCover.src = epubContent.metadata.coverUrl;
      if (UI.metaCover) UI.metaCover.classList.remove("hidden");
      if (UI.metaCoverPlaceholder) UI.metaCoverPlaceholder.classList.add("hidden");
    }

    // TODO: Initiate analysis after EPUB processing is complete
    logger.log('EPUB processed:', epubContent.metadata.title);

    if (UI.processingUi) UI.processingUi.classList.add("hidden");
    if (UI.resultsSection) UI.resultsSection.classList.remove("hidden");
    if (UI.resetBtn) UI.resetBtn.classList.remove("hidden");
    if (UI.exportBtn) UI.exportBtn.classList.remove("hidden");


  } catch (err) {
    logger.error("Error processing EPUB file:", err);
    alert("Có lỗi xảy ra: " + (err instanceof Error ? err.message : String(err)));
    if (UI.processingUi) UI.processingUi.classList.add("hidden");
    if (UI.uploadSection) UI.uploadSection.classList.remove("hidden");
  }
}

// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  const { dictionaries, status } = await loadDictionaries(UI);
  state.dictionaries = dictionaries;
  state.dictionaryStatus = status;

  logger.log('Dictionaries Loaded:', state.dictionaryStatus);
  logger.log('Vietnamese words:', state.dictionaries.vietnamese.size);
  logger.log('English words:', state.dictionaries.english.size);
  logger.log('Custom words:', state.dictionaries.custom.size);

  // Event Listeners for File Upload
  if (UI.fileInput) {
    UI.fileInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        handleFile(target.files[0]);
      }
    });
  }

  if (UI.uploadSection) {
    UI.uploadSection.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (UI.uploadSection) UI.uploadSection.classList.add('border-blue-500/50', 'bg-slate-800/50');
    });

    UI.uploadSection.addEventListener('dragleave', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (UI.uploadSection) UI.uploadSection.classList.remove('border-blue-500/50', 'bg-slate-800/50');
    });

    UI.uploadSection.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (UI.uploadSection) UI.uploadSection.classList.remove('border-blue-500/50', 'bg-slate-800/50');
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    });

    UI.uploadSection.addEventListener('click', () => {
      UI.fileInput?.click();
    });
  }

  if (UI.resetBtn) {
    UI.resetBtn.addEventListener('click', resetApp);
  }
});

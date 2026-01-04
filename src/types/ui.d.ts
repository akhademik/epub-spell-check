interface BaseUI {
  dictStatus: HTMLElement | null;
  dictDot: HTMLElement | null;
  dictText: HTMLElement | null;
  fileInput: HTMLInputElement | null;
  uploadSection: HTMLElement | null;
  processingUi: HTMLElement | null;
  progressBar: HTMLElement | null;
  progressPercent: HTMLElement | null;
  statusText: HTMLElement | null;
  resultsSection: HTMLElement | null;
  resetBtn: HTMLElement | null;
  exportBtn: HTMLElement | null;
  loadingOverlay: HTMLElement | null;
  processingUiHeader: HTMLElement | null;
  metaTitle: HTMLElement | null;
  metaAuthor: HTMLElement | null;
  metaCover: HTMLImageElement | null;
  metaCoverPlaceholder: HTMLElement | null;
  toastContainer: HTMLElement | null;
}

interface StatsUI {
  statTotalWords: HTMLElement | null;
  statErrors: HTMLElement | null;
  statGroups: HTMLElement | null;
  statErrorsMobileCount: HTMLElement | null;
}

interface ResultsAreaUI {
  errorList: HTMLElement | null;
  contextView: HTMLElement | null;
  errorItemTemplate: HTMLTemplateElement | null;
}

interface SettingsUI {
  settingsBtn: HTMLElement | null;
  settingsModal: HTMLElement | null;
  closeSettingsBtn: HTMLElement | null;
  settingToggles: {
    dict: HTMLInputElement | null;
    case: HTMLInputElement | null;
    tone: HTMLInputElement | null;
    struct: HTMLInputElement | null;
  }
}

interface WhitelistUI {
  whitelistInput: HTMLInputElement | null;
  whitelistTagsContainer: HTMLElement | null;
  importWhitelistBtn: HTMLElement | null;
  exportWhitelistBtn: HTMLElement | null;
  whitelistImportFile: HTMLInputElement | null;
  clearWhitelistBtn: HTMLButtonElement | null;
}

interface EngFilterUI {
  engFilterCheckbox: HTMLInputElement | null;
  engLoading: HTMLElement | null;
}

interface HelpUI {
  helpBtn: HTMLElement | null;
  helpModal: HTMLElement | null;
  helpModalContent: HTMLElement | null;
  closeHelpBtn: HTMLElement | null;
}

interface ExportUI {
  exportModal: HTMLElement | null;
  closeExportBtn: HTMLElement | null;
  exportVctveBtn: HTMLElement | null;
  exportNormalBtn: HTMLElement | null;
}

interface ReaderUI {
  fontToggleBtn: HTMLElement | null;
  sizeUpBtn: HTMLElement | null;
  sizeDownBtn: HTMLElement | null;
}

interface NavigationUI {
  contextNavControls: HTMLElement | null;
  btnPrev: HTMLButtonElement | null;
  btnNext: HTMLButtonElement | null;
  navIndicator: HTMLElement | null;
}

interface ClearWhitelistModalUI {
  clearWhitelistModal: HTMLElement | null;
  closeClearWhitelistBtn: HTMLButtonElement | null;
  cancelClearWhitelistBtn: HTMLButtonElement | null;
  confirmClearWhitelistBtn: HTMLButtonElement | null;
}

export type ModalKey = 'settings' | 'help' | 'export' | 'clear-whitelist';

export type UIElements = BaseUI & StatsUI & ResultsAreaUI & SettingsUI & WhitelistUI & EngFilterUI & Partial<ExportUI> & Partial<HelpUI> & Partial<ReaderUI> & Partial<NavigationUI> & Partial<ClearWhitelistModalUI>;
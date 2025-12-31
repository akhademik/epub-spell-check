// src/types/ui.d.ts

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
  metaTitle: HTMLElement | null;
  metaAuthor: HTMLElement | null;
  metaCover: HTMLImageElement | null;
  metaCoverPlaceholder: HTMLElement | null;
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
  whitelistInput: HTMLTextAreaElement | null;
  importWhitelistBtn: HTMLElement | null;
  exportWhitelistBtn: HTMLElement | null;
  whitelistImportFile: HTMLInputElement | null;
}

interface EngFilterUI {
  engFilterCheckbox: HTMLInputElement | null;
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

// The main UIElements type is a composition of all feature-specific UI interfaces.
// ExportUI is marked as Partial because its elements are not yet implemented.
export type UIElements = BaseUI & SettingsUI & WhitelistUI & EngFilterUI & Partial<ExportUI> & Partial<HelpUI> & Partial<ReaderUI>;
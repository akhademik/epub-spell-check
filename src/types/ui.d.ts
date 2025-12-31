// src/types/ui.d.ts

export interface UIElements {
  // Dictionary status
  dictStatus: HTMLElement | null;
  dictDot: HTMLElement | null;
  dictText: HTMLElement | null;

  // File Upload
  fileInput: HTMLInputElement | null;
  uploadSection: HTMLElement | null;

  // Processing UI
  processingUi: HTMLElement | null;
  progressBar: HTMLElement | null;
  progressPercent: HTMLElement | null;
  statusText: HTMLElement | null;

  // Results UI
  resultsSection: HTMLElement | null;
  resetBtn: HTMLElement | null;
  exportBtn: HTMLElement | null;
  
  // Metadata display
  metaTitle: HTMLElement | null;
  metaAuthor: HTMLElement | null;
  metaCover: HTMLImageElement | null;
  metaCoverPlaceholder: HTMLElement | null;

  // Settings Modal
  settingsBtn: HTMLElement | null;
  settingsModal: HTMLElement | null;
  closeSettingsBtn: HTMLElement | null;
  settingToggles: {
    dict: HTMLInputElement | null;
    case: HTMLInputElement | null;
    tone: HTMLInputElement | null;
    struct: HTMLInputElement | null;
  }

  // Whitelist
  whitelistInput: HTMLTextAreaElement | null;
  importWhitelistBtn: HTMLElement | null;
  exportWhitelistBtn: HTMLElement | null;
  whitelistImportFile: HTMLInputElement | null;

  // English Filter
  engFilterCheckbox: HTMLInputElement | null;
}
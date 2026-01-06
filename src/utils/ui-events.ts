
import {
    FONT_SIZE_MAX_REM,
    FONT_SIZE_MIN_REM,
  } from "../constants";
  import { $appState, $readerSettings } from "../store";
  import { ErrorGroup } from "../types/errors";
  import { UIElements } from "../types/ui";
  import { closeModal, openModal } from "./modal";
  import {
    clearWhitelist,
    confirmClearWhitelist,
    exportWhitelist,
    handleImportWhitelist,
  } from "./whitelist-manager";
import { applyReaderStyles } from "./reader-styles";

  
  // These functions are still in main.ts, they will be passed in.
  interface MainFunctions {
    handleFile: (file: File) => void;
    resetApp: () => void;
    updateAndRenderErrors: () => void;
    saveSettings: () => void;
    performExport: (type: "vctve" | "normal") => void;
    navigateInstance: (direction: "prev" | "next") => void;
    handleGlobalKeydown: (e: KeyboardEvent) => void;
    ignoreAndAdvance: (
      wordToIgnore: string,
      wordToIgnoreId: string,
      originalIndex: number
    ) => void;
    selectGroup: (group: ErrorGroup, element: HTMLElement) => void;
    copyToClipboard: (text: string, ui: UIElements) => void;
    showToast: (ui: UIElements, message: string, type: "info" | "error" | "success") => void;
    saveWhitelist: (value: string) => void;
  }
  
  export function registerUIEventListeners(
    UI: UIElements,
    mainFunctions: MainFunctions
  ) {
    const debounceTimer: number = 0;
  
    UI.fileInput?.addEventListener(
      "change",
      (e) =>
        (e.target as HTMLInputElement).files?.[0] &&
        mainFunctions.handleFile((e.target as HTMLInputElement).files![0])
    );
    UI.uploadSection?.addEventListener("click", () => UI.fileInput?.click());
    UI.resetBtn?.addEventListener("click", mainFunctions.resetApp);
  
    UI.btnPrev?.addEventListener(
      "click",
      () => mainFunctions.navigateInstance("prev")
    );
    UI.btnNext?.addEventListener(
      "click",
      () => mainFunctions.navigateInstance("next")
    );
  
    UI.settingsBtn?.addEventListener("click", () => {
      openModal(UI, "settings");
    });
    UI.closeSettingsBtn?.addEventListener("click", () => {
      closeModal(UI, "settings");
    });
  
    UI.helpBtn?.addEventListener("click", () => {
      openModal(UI, "help");
    });
    UI.closeHelpBtn?.addEventListener("click", () => {
      closeModal(UI, "help");
    });
  
    UI.exportBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(UI, "export");
    });
    UI.closeExportBtn?.addEventListener("click", () => {
      closeModal(UI, "export");
    });
    UI.exportVctveBtn?.addEventListener("click", () =>
      mainFunctions.performExport("vctve")
    );
    UI.exportNormalBtn?.addEventListener("click", () =>
      mainFunctions.performExport("normal")
    );
  
    UI.fontToggleBtn?.addEventListener("click", () => {
      const currentSettings = $readerSettings.get();
      $readerSettings.set({ ...currentSettings, fontFamily: currentSettings.fontFamily === "serif" ? "sans-serif" : "serif" });
      applyReaderStyles($readerSettings.get(), UI);
    });
    UI.sizeUpBtn?.addEventListener("click", () => {
        const currentSettings = $readerSettings.get();
      const newSize = Math.round((currentSettings.fontSize + 0.25) * 100) / 100;
      $readerSettings.set({ ...currentSettings, fontSize: Math.min(FONT_SIZE_MAX_REM, newSize) });
      applyReaderStyles($readerSettings.get(), UI);
    });
    UI.sizeDownBtn?.addEventListener("click", () => {
        const currentSettings = $readerSettings.get();
      const newSize = Math.round((currentSettings.fontSize - 0.25) * 100) / 100;
      $readerSettings.set({ ...currentSettings, fontSize: Math.max(FONT_SIZE_MIN_REM, newSize) });
      applyReaderStyles($readerSettings.get(), UI);
    });
  
    Object.values(UI.settingToggles).forEach((toggle: HTMLInputElement | null) =>
      toggle?.addEventListener("change", mainFunctions.saveSettings)
    );
  


    UI.exportWhitelistBtn?.addEventListener("click", () => exportWhitelist(UI));
    UI.importWhitelistBtn?.addEventListener("click", () =>
      UI.whitelistImportFile?.click()
    );
    UI.clearWhitelistBtn?.addEventListener("click", () => clearWhitelist(UI));
    UI.whitelistImportFile?.addEventListener("change", (e) =>
      handleImportWhitelist(
        e,
        UI,
        mainFunctions.updateAndRenderErrors,
        mainFunctions.saveWhitelist
      )
    );
  
    UI.closeClearWhitelistBtn?.addEventListener("click", () =>
      closeModal(UI, "clear-whitelist")
    );
    UI.cancelClearWhitelistBtn?.addEventListener("click", () =>
      closeModal(UI, "clear-whitelist")
    );
    UI.confirmClearWhitelistBtn?.addEventListener("click", () => {
        confirmClearWhitelist(UI, mainFunctions.saveWhitelist, mainFunctions.updateAndRenderErrors);
        closeModal(UI, "clear-whitelist");
        mainFunctions.showToast(UI, "Đã xoá hết danh sách bỏ qua.", "info");
    });
  
    UI.engFilterCheckbox?.addEventListener("change", () => {
        $appState.setKey("isEngFilterEnabled", UI.engFilterCheckbox?.checked ?? false);
        mainFunctions.updateAndRenderErrors();
    });
  
    UI.uploadSection?.addEventListener("dragover", (_e) => {
      _e.preventDefault();
      _e.stopPropagation();
      UI.uploadSection?.classList.add("border-blue-500/50", "bg-slate-800/50");
    });
    UI.uploadSection?.addEventListener("dragleave", (_e) => {
      _e.preventDefault();
      _e.stopPropagation();
      UI.uploadSection?.classList.remove("border-blue-500/50", "bg-slate-800/50");
    });
    UI.uploadSection?.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      UI.uploadSection?.classList.remove("border-blue-500/50", "bg-slate-800/50");
      if (e.dataTransfer?.files?.[0])
        mainFunctions.handleFile(e.dataTransfer.files[0]);
    });
  
    document.addEventListener("keydown", mainFunctions.handleGlobalKeydown as EventListener);
  
    if (UI.errorList) {
      UI.errorList.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const errorItem = target.closest("[data-group-id]") as HTMLElement;
        if (!errorItem) return;
  
        const groupId = errorItem.dataset.groupId;
        const group = $appState.get().currentFilteredErrors.find((g: ErrorGroup) => g.id === groupId);
        if (!group) return;
  
        if (target.closest(".ignore-btn")) {
          e.stopPropagation();
          const originalIndex = $appState.get().currentFilteredErrors.findIndex(
            (_g: ErrorGroup) => _g.id === group.id
          );
          mainFunctions.ignoreAndAdvance(group.word, group.id, originalIndex);
          return;
        }
  
        mainFunctions.selectGroup(group, errorItem);
        mainFunctions.copyToClipboard(group.word, UI);
      });
    }
  
    document.addEventListener("click", (e) => {
      if (
        UI.settingsModal &&
        !UI.settingsModal.contains(e.target as Node) &&
        !UI.settingsBtn?.contains(e.target as Node)
      ) {
        closeModal(UI, "settings");
      }
      if (
        UI.helpModal &&
        !UI.helpModalContent?.contains(e.target as Node) &&
        !UI.helpBtn?.contains(e.target as Node)
      ) {
        closeModal(UI, "help");
      }
      if (
        UI.exportModal &&
        !UI.exportModal.contains(e.target as Node) &&
        !UI.exportBtn?.contains(e.target as Node)
      ) {
        closeModal(UI, "export");
      }
      if (
        UI.clearWhitelistModal &&
        !UI.clearWhitelistModal.contains(e.target as Node) &&
        !UI.clearWhitelistBtn?.contains(e.target as Node)
      ) {
        closeModal(UI, "clear-whitelist");
      }
    });
  
    window.addEventListener("beforeunload", () => {
      clearTimeout(debounceTimer);
    });
  }
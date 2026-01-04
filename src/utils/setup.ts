import { $readerSettings, $whitelist } from "../store";
import { AppState } from "../types/state";
import { UIElements } from "../types/ui";
import { loadDictionaries } from "./dictionary";
import { logger } from "./logger";
import { closeModal } from "./modal";
import { showToast } from "./notifications";
import { applyReaderStyles } from "./reader-styles";
import { hideLoadingOverlay, hideProcessingUI } from "./ui-utils";
import { renderWhitelistTags } from "./whitelist-tags-manager";

export function initializeUI(UI: UIElements) {
    document.body.removeAttribute("hidden");
    UI.exportBtn?.classList.add("hidden");
    UI.resetBtn?.classList.add("hidden");
    UI.dictStatus?.classList.add("hidden");
    hideLoadingOverlay(UI);
    closeModal(UI, "export");
    closeModal(UI, "help");
    closeModal(UI, "settings");
    closeModal(UI, "clear-whitelist");
    hideProcessingUI(UI);
    UI.engLoading?.classList.add("hidden");
}

export async function loadAppData(UI: UIElements, state: AppState) {
    try {
        const { dictionaries, status } = await loadDictionaries(UI);
        state.dictionaries = dictionaries;
        state.dictionaryStatus = status;
        logger.info("Dictionaries Loaded:", state.dictionaryStatus);
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error("Failed to load dictionaries:", error.message);
        } else {
            logger.error("Failed to load dictionaries:", String(error));
        }
        showToast(UI, "Lỗi tải từ điển. Vui lòng tải lại trang.", "error");
        UI.fileInput?.setAttribute("disabled", "true");
        UI.uploadSection?.classList.add("opacity-50", "pointer-events-none");
    }
}

export function loadUserPreferences(UI: UIElements, state: AppState, loadWhitelist: () => string, saveWhitelist: (value: string) => void, updateAndRenderErrors: () => void) {
    const words = loadWhitelist().split(/[\s,]+/).filter(Boolean);
    const onRemove = (wordToRemove: string) => {
        const currentWords = $whitelist.get().split(/[\s,]+/).filter(Boolean);
        const newWords = currentWords.filter(w => w.toLowerCase() !== wordToRemove.toLowerCase());
        renderWhitelistTags(UI, newWords, onRemove);
        saveWhitelist(newWords.join(", "));
        updateAndRenderErrors();
    };
    renderWhitelistTags(UI, words, onRemove);

    if (UI.engFilterCheckbox)
      UI.engFilterCheckbox.checked = state.isEngFilterEnabled;
    applyReaderStyles($readerSettings.get(), UI);
}

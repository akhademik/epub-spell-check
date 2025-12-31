// src/utils/ui-utils.ts
import { UIElements } from "../types/ui";

/**
 * Shows the processing UI and hides the upload section.
 * @param ui The UIElements object.
 */
export function showProcessingUI(ui: UIElements) {
    if (ui.uploadSection) ui.uploadSection.classList.add("hidden");
    if (ui.processingUi) ui.processingUi.classList.remove("hidden");
    if (ui.processingUiHeader) {
        ui.processingUiHeader.classList.remove('hidden');
        ui.processingUiHeader.classList.add('flex', 'items-end', 'justify-between', 'mb-4');
    }
}

/**
 * Hides the processing UI and shows the upload section.
 * Also hides other UI elements related to results and actions.
 * @param ui The UIElements object.
 */
export function hideProcessingUI(ui: UIElements) {
    if (ui.processingUi) ui.processingUi.classList.add("hidden");
    if (ui.processingUiHeader) {
        ui.processingUiHeader.classList.remove('flex', 'items-end', 'justify-between', 'mb-4');
        ui.processingUiHeader.classList.add('hidden');
    }
    // These are reset related, but directly tied to processing/results view
    if (ui.resultsSection) { ui.resultsSection.classList.add("hidden"); ui.resultsSection.classList.remove('flex', 'flex-col', 'gap-6'); }
    if (ui.resetBtn) { ui.resetBtn.classList.add("hidden"); ui.resetBtn.classList.remove('flex', 'items-center', 'gap-2'); }
    if (ui.exportBtn) { ui.exportBtn.classList.add("hidden"); ui.exportBtn.classList.remove('flex', 'items-center', 'gap-2'); }
    if (ui.uploadSection) ui.uploadSection.classList.remove("hidden"); // Show upload again
}

/**
 * Shows the results section along with related buttons.
 * @param ui The UIElements object.
 */
export function showResultsUI(ui: UIElements) {
    if (ui.resultsSection) { ui.resultsSection.classList.remove("hidden"); ui.resultsSection.classList.add('flex', 'flex-col', 'gap-6'); }
    if (ui.resetBtn) { ui.resetBtn.classList.remove("hidden"); ui.resetBtn.classList.add('flex', 'items-center', 'gap-2'); }
    if (ui.exportBtn) { ui.exportBtn.classList.remove("hidden"); ui.exportBtn.classList.add('flex', 'items-center', 'gap-2'); }
}

/**
 * Shows a loading overlay.
 * @param ui The UIElements object.
 */
export function showLoadingOverlay(ui: UIElements) {
    if (ui.loadingOverlay) {
        ui.loadingOverlay.classList.remove('hidden');
        ui.loadingOverlay.classList.add('flex', 'items-center', 'justify-center');
    }
}

/**
 * Hides a loading overlay.
 * @param ui The UIElements object.
 */
export function hideLoadingOverlay(ui: UIElements) {
    if (ui.loadingOverlay) {
        ui.loadingOverlay.classList.add('hidden');
        ui.loadingOverlay.classList.remove('flex', 'items-center', 'justify-center');
    }
}

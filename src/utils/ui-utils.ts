// src/utils/ui-utils.ts
import { UIElements } from "../types/ui";

const RESULTS_SECTION_VISIBLE_CLASSES = ['flex', 'flex-col', 'gap-6'];
const BUTTON_VISIBLE_CLASSES = ['flex', 'items-center', 'gap-2'];
const HEADER_VISIBLE_CLASSES = ['flex', 'items-end', 'justify-between', 'mb-4'];
const OVERLAY_VISIBLE_CLASSES = ['flex', 'items-center', 'justify-center'];

const HIDDEN_CLASS = 'hidden';

/**
 * Shows the processing UI and hides the upload section.
 * @param ui The UIElements object.
 */
export function showProcessingUI(ui: UIElements) {
    if (ui.uploadSection) ui.uploadSection.classList.add(HIDDEN_CLASS);
    if (ui.processingUi) ui.processingUi.classList.remove(HIDDEN_CLASS);
    if (ui.processingUiHeader) {
        ui.processingUiHeader.classList.remove(HIDDEN_CLASS);
        ui.processingUiHeader.classList.add(...HEADER_VISIBLE_CLASSES);
    }
}

/**
 * Hides the processing UI and shows the upload section.
 * Also hides other UI elements related to results and actions.
 * @param ui The UIElements object.
 */
export function hideProcessingUI(ui: UIElements) {
    if (ui.processingUi) ui.processingUi.classList.add(HIDDEN_CLASS);
    if (ui.processingUiHeader) {
        ui.processingUiHeader.classList.remove(...HEADER_VISIBLE_CLASSES);
        ui.processingUiHeader.classList.add(HIDDEN_CLASS);
    }
    // These are reset related, but directly tied to processing/results view
    if (ui.resultsSection) {
        ui.resultsSection.classList.remove(...RESULTS_SECTION_VISIBLE_CLASSES);
        ui.resultsSection.classList.add(HIDDEN_CLASS);
    }
    if (ui.resetBtn) {
        ui.resetBtn.classList.remove(...BUTTON_VISIBLE_CLASSES);
        ui.resetBtn.classList.add(HIDDEN_CLASS);
    }
    if (ui.exportBtn) {
        ui.exportBtn.classList.remove(...BUTTON_VISIBLE_CLASSES);
        ui.exportBtn.classList.add(HIDDEN_CLASS);
    }
    if (ui.uploadSection) ui.uploadSection.classList.remove(HIDDEN_CLASS); // Show upload again
}

/**
 * Shows the results section along with related buttons.
 * @param ui The UIElements object.
 */
export function showResultsUI(ui: UIElements) {
    if (ui.resultsSection) {
        ui.resultsSection.classList.remove(HIDDEN_CLASS);
        ui.resultsSection.classList.add(...RESULTS_SECTION_VISIBLE_CLASSES);
    }
    if (ui.resetBtn) {
        ui.resetBtn.classList.remove(HIDDEN_CLASS);
        ui.resetBtn.classList.add(...BUTTON_VISIBLE_CLASSES);
    }
    if (ui.exportBtn) {
        ui.exportBtn.classList.remove(HIDDEN_CLASS);
        ui.exportBtn.classList.add(...BUTTON_VISIBLE_CLASSES);
    }
}

/**
 * Shows a loading overlay.
 * @param ui The UIElements object.
 */
export function showLoadingOverlay(ui: UIElements) {
    if (ui.loadingOverlay) {
        ui.loadingOverlay.classList.remove(HIDDEN_CLASS);
        ui.loadingOverlay.classList.add(...OVERLAY_VISIBLE_CLASSES);
    }
}

/**
 * Hides a loading overlay.
 * @param ui The UIElements object.
 */
export function hideLoadingOverlay(ui: UIElements) {
    if (ui.loadingOverlay) {
        ui.loadingOverlay.classList.remove(...OVERLAY_VISIBLE_CLASSES);
        ui.loadingOverlay.classList.add(HIDDEN_CLASS);
    }
}

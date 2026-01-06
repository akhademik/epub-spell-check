import { UIElements } from "../types/ui";
import { HIDDEN_CLASS, BUTTON_VISIBLE, FLEX_CLASS_VISIBLE, RESULTS_SECTION_VISIBLE, OVERLAY_VISIBLE } from '../constants';

export function showProcessingUI(ui: UIElements) {
    ui.uploadSection?.classList.add(HIDDEN_CLASS);
    ui.processingUi?.classList.remove(HIDDEN_CLASS);
    ui.processingUiHeader?.classList.remove(HIDDEN_CLASS);
    ui.processingUiHeader?.classList.add(...FLEX_CLASS_VISIBLE);
}


export function hideProcessingUI(ui: UIElements) {
    ui.processingUi?.classList.add(HIDDEN_CLASS);
    ui.processingUiHeader?.classList.remove(...FLEX_CLASS_VISIBLE);
    ui.processingUiHeader?.classList.add(HIDDEN_CLASS);
    ui.resultsSection?.classList.remove(...RESULTS_SECTION_VISIBLE);
    ui.resultsSection?.classList.add(HIDDEN_CLASS);
    ui.resetBtn?.classList.remove(...BUTTON_VISIBLE);
    ui.resetBtn?.classList.add(HIDDEN_CLASS);
    ui.exportBtn?.classList.remove(...BUTTON_VISIBLE);
    ui.exportBtn?.classList.add(HIDDEN_CLASS);
    ui.uploadSection?.classList.remove(HIDDEN_CLASS);
}


export function showResultsUI(ui: UIElements) {
    ui.resultsSection?.classList.remove(HIDDEN_CLASS);
    ui.resultsSection?.classList.add(...RESULTS_SECTION_VISIBLE);
    ui.resetBtn?.classList.remove(HIDDEN_CLASS);
    ui.resetBtn?.classList.add(...BUTTON_VISIBLE);
    ui.exportBtn?.classList.remove(HIDDEN_CLASS);
    ui.exportBtn?.classList.add(...BUTTON_VISIBLE);
}


export function showLoadingOverlay(ui: UIElements) {
    ui.loadingOverlay?.classList.remove(HIDDEN_CLASS);
    ui.loadingOverlay?.classList.add(...OVERLAY_VISIBLE);
}


export function hideLoadingOverlay(ui: UIElements) {
    ui.loadingOverlay?.classList.remove(...OVERLAY_VISIBLE);
    ui.loadingOverlay?.classList.add(HIDDEN_CLASS);
}


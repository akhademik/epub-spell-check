// src/utils/modal.ts


import { UIElements, ModalKey } from "../types/ui";
import { HIDDEN_CLASS } from "../constants"; // Import HIDDEN_CLASS

function getModalElement(ui: UIElements, modalKey: ModalKey): HTMLElement | null {
    switch (modalKey) {
        case 'settings':
            return ui.settingsModal || null;
        case 'help':
            return ui.helpModal || null;
        case 'export':
            return ui.exportModal || null;
        default:
            return null;
    }
}

export function openModal(ui: UIElements, modalKey: ModalKey) {
    const modal = getModalElement(ui, modalKey);
    modal?.classList.remove(HIDDEN_CLASS);
    if (modal && !modal.classList.contains('settings-modal-aligned')) { // Specific to settings modal alignment
        modal.classList.add('flex', 'items-center', 'justify-center');
    }
}

export function closeModal(ui: UIElements, modalKey: ModalKey) {
    const modal = getModalElement(ui, modalKey);
    modal?.classList.add(HIDDEN_CLASS);
    if (modal && !modal.classList.contains('settings-modal-aligned')) {
        modal.classList.remove('flex', 'items-center', 'justify-center');
    }
}
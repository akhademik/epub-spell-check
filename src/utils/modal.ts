// src/utils/modal.ts


export function openModal(modal: HTMLElement | null) {
    if (modal) {
        modal.classList.remove('hidden');
        if (!modal.classList.contains('settings-modal-aligned')) {
            modal.classList.add('flex', 'items-center', 'justify-center');
        }
    }
}

export function closeModal(modal: HTMLElement | null) {
    if (modal) {
        modal.classList.add('hidden');
        if (!modal.classList.contains('settings-modal-aligned')) {
            modal.classList.remove('flex', 'items-center', 'justify-center');
        }
    }
}

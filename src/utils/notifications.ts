import { logger } from './logger';
import { UIElements } from '../types/ui';

const MAX_TOASTS = 3;
const activeToasts: HTMLElement[] = [];

export function showToast(ui: UIElements, message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (!ui.toastContainer) {
        logger.warn(`Toast container not found. Toast will not be displayed.`);
        return;
    }

    while (ui.toastContainer.children.length >= MAX_TOASTS) {
        ui.toastContainer.firstChild?.remove();
    }

    const toast = document.createElement('div');
    let bgColor, textColor, icon;

    switch (type) {
        case 'success':
            bgColor = 'bg-green-600';
            textColor = 'text-white';
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`;
            break;
        case 'error':
            bgColor = 'bg-red-600';
            textColor = 'text-white';
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
            break;
        case 'info':
        default:
            bgColor = 'bg-blue-600';
            textColor = 'text-white';
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
            break;
    }

    toast.className = `toast-item relative px-4 py-3 rounded-lg shadow-xl z-[70] text-sm font-medium flex items-center gap-2 mt-2 ${bgColor} ${textColor} transition-all duration-500 ease-out transform translate-y-full opacity-0`;
    toast.innerHTML = `${icon}<span>${message}</span>`;
    
    ui.toastContainer.prepend(toast);
    activeToasts.push(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-full', 'opacity-0');
    });

    if (activeToasts.length > MAX_TOASTS) {
        const oldestToast = activeToasts.shift();
        oldestToast?.classList.add('opacity-0');
        oldestToast?.addEventListener('transitionend', () => oldestToast.remove(), {
            once: true,
        });
    }

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-full');
        toast.addEventListener('transitionend', () => {
            toast.remove();
            const index = activeToasts.indexOf(toast);
            if (index > -1) {
                activeToasts.splice(index, 1);
            }
        }, { once: true });
    }, 5000);
}
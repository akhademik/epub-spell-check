// src/utils/notifications.ts

import { logger } from './logger';

const TOAST_CONTAINER_ID = 'toast-container';
const MAX_TOASTS = 3; // Maximum number of toasts to show at once

/**
 * Displays a non-blocking toast notification.
 * @param message The message to display.
 * @param type The type of toast (e.g., 'success', 'error', 'info').
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) {
        logger.warn(`Toast container with ID '${TOAST_CONTAINER_ID}' not found. Toast will not be displayed.`);
        return;
    }

    // Remove oldest toast if max limit is reached
    while (container.children.length >= MAX_TOASTS) {
        container.firstChild?.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification p-3 mb-2 rounded-lg shadow-md text-sm transition-all duration-300 ease-in-out transform scale-95 opacity-0`;
    toast.textContent = message;

    // Apply type-specific styling
    switch (type) {
        case 'success':
            toast.classList.add('bg-green-600', 'text-white');
            break;
        case 'error':
            toast.classList.add('bg-red-600', 'text-white');
            break;
        case 'info':
        default:
            toast.classList.add('bg-blue-600', 'text-white');
            break;
    }

    // Append to container
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'scale-95');
        toast.classList.add('opacity-100', 'scale-100');
    });

    // Animate out and remove after a delay
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'scale-100');
        toast.classList.add('opacity-0', 'scale-95');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 5000); // 5 seconds
}

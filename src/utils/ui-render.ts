// src/utils/ui-render.ts
import { ErrorGroup } from "../types/errors";
import { UIElements } from "../types/ui";
import { logger } from "./logger";

// --- Helper Functions ---

export function updateProgress(ui: UIElements, percentage: number, message: string) {
    const roundedPercentage = Math.round(percentage);
    // logger.log(`Progress: ${roundedPercentage}% - ${message}`); // Too noisy for console
    if (ui.progressBar) ui.progressBar.style.width = roundedPercentage + '%';
    if (ui.progressPercent) ui.progressPercent.innerText = roundedPercentage + '%';
    if (ui.statusText) ui.statusText.innerText = message;
}

function getErrorHighlights(type: string): { dot: string; text: string; bg: string; border: string } {
    let style = {
        dot: "bg-sky-500",
        text: "text-sky-400",
        bg: "bg-sky-500/20",
        border: "border-sky-500",
    };
    if (!type) return style;
    if (type.startsWith("Sai quy tắc") || type.includes("Lỗi gõ máy") || type.includes("Lỗi viết hoa")) {
        style = { dot: "bg-red-500", text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500" };
    } else if (type.includes("Sai vị trí dấu")) {
        style = { dot: "bg-orange-500", text: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500" };
    } else if (type.includes("Từ lạ") || type.includes("ký tự lạ")) {
        style = { dot: "bg-pink-500", text: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500" };
    }
    return style;
}

function getContext(text: string, index: number, length: number) {
    const contextLength = 60; // Characters before and after
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + length + contextLength);

    let prefix = text.substring(start, index);
    let suffix = text.substring(index + length, end);

    if (start > 0) prefix = "..." + prefix;
    if (end < text.length) suffix = suffix + "...";
    
    return {
        prefix: prefix,
        target: text.substr(index, length),
        suffix: suffix,
    };
}

function escapeHtml(text: string): string {
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
}

// --- Main Rendering Functions ---

export function updateStats(ui: UIElements, totalWords: number, totalErrors: number, totalGroups: number) {
    const statWords = ui.metaTitle?.ownerDocument.getElementById("stat-total-words");
    const statErrors = ui.metaTitle?.ownerDocument.getElementById("stat-errors");
    const statGroups = ui.metaTitle?.ownerDocument.getElementById("stat-groups");

    if (statWords) statWords.innerText = totalWords.toLocaleString();
    if (statErrors) statErrors.innerText = totalErrors.toLocaleString();
    if (statGroups) statGroups.innerText = totalGroups.toLocaleString();
}

export function renderErrorList(
    ui: UIElements,
    groups: ErrorGroup[],
    onSelectGroup: (group: ErrorGroup, element: HTMLElement) => void,
    onIgnoreWord: (word: string) => void
) {
    const errorList = ui.metaTitle?.ownerDocument.getElementById("error-list");
    if (!errorList) {
        logger.error("UI element #error-list not found.");
        return;
    }
    
    errorList.innerHTML = ""; 

    if (groups.length === 0) {
        errorList.innerHTML = `
            <div class="p-10 text-center text-slate-600 flex flex-col items-center">
                <svg class="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-lg font-medium">Tuyệt vời!</p>
                <p class="text-sm mt-1">Không tìm thấy lỗi nào.</p>
            </div>`;
        return;
    }

    const template = ui.metaTitle?.ownerDocument.getElementById("error-item-template") as HTMLTemplateElement;
    if (!template) {
        logger.error("Template #error-item-template not found.");
        return;
    }

    groups.forEach((group) => {
        const clone = template.content.cloneNode(true) as DocumentFragment;
        const wordEl = clone.querySelector(".error-word");
        const reasonEl = clone.querySelector(".error-reason");
        const countEl = clone.querySelector(".error-count");
        const dotEl = clone.querySelector(".status-dot");
        const buttonContainer = clone.querySelector("div") as HTMLElement;
        const selectBtn = clone.querySelector(".select-btn") as HTMLButtonElement;
        const ignoreBtn = clone.querySelector(".ignore-btn") as HTMLButtonElement;

        if (wordEl) wordEl.textContent = group.word;
        if (reasonEl) reasonEl.textContent = group.reason;
        if (countEl) countEl.textContent = String(group.contexts.length);
        
        if (dotEl) {
            const style = getErrorHighlights(group.type);
            dotEl.classList.add(style.dot);
        }

        if (selectBtn) {
            selectBtn.onclick = () => {
                onSelectGroup(group, buttonContainer);
            };
        }
        
        if (ignoreBtn) {
            ignoreBtn.onclick = (e) => {
                e.stopPropagation();
                onIgnoreWord(group.word);
            };
        }

        errorList.appendChild(clone);
    });
}

export function renderContextView(
    ui: UIElements,
    group: ErrorGroup,
    instanceIndex: number
) {
    const contextView = ui.metaTitle?.ownerDocument.getElementById("context-view");
    const navIndicator = ui.metaTitle?.ownerDocument.getElementById("nav-indicator");
    const contextNav = ui.metaTitle?.ownerDocument.getElementById("nav-indicator"); // This one should be contextNav

    if (!contextView || !navIndicator || !contextNav) {
        logger.error("Context view UI elements not found.");
        return;
    }

    const context = group.contexts[instanceIndex];
    const { prefix, target, suffix } = getContext(context.originalParagraph, context.matchIndex, group.word.length);
    const style = getErrorHighlights(group.type);

    contextView.innerHTML = `
        <div class="reader-content text-slate-300 leading-loose">
            ${escapeHtml(prefix)}<span class="rounded ${style.bg} ${style.text} px-1 py-0.5 font-bold">${escapeHtml(target)}</span>${escapeHtml(suffix)}
        </div>
        <div class="mt-auto pt-4 border-t border-slate-800">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold ${style.text}">${group.type}</span>
                    <span class="text-xs text-slate-500">${group.reason}</span>
                </div>
                <a href="https://vi.wiktionary.org/wiki/${group.word}" target="_blank" class="text-xs text-blue-400 hover:underline">
                    Tra trên Wiktionary
                </a>
            </div>
            <!-- TODO: Add suggestions here -->
        </div>
    `;

    navIndicator.textContent = `${instanceIndex + 1}/${group.contexts.length}`;
    contextNav.classList.remove("hidden");
}

import { ErrorGroup } from "../types/errors";
import { UIElements } from "../types/ui";
import { logger } from "./logger";
import { findSuggestions } from "./analyzer";
import { Dictionaries } from "../types/dictionary";
import {
  CONTEXT_LENGTH_CHARS,
  MAX_TOASTS_DISPLAYED,
  TOAST_AUTO_DISMISS_MS,
} from "../constants";

const activeToasts: HTMLElement[] = [];

/**
 * Updates the progress bar and status text in the UI.
 * @param ui - A reference to the UI elements collection.
 * @param percentage - The progress percentage (0-100).
 * @param message - The message to display as the status.
 */
export function updateProgress(
  ui: UIElements,
  percentage: number,
  message: string
) {
  const roundedPercentage = Math.round(percentage);

  ui.progressBar?.style.setProperty("width", roundedPercentage + "%");
  if (ui.progressPercent)
    ui.progressPercent.innerText = roundedPercentage + "%";
  if (ui.statusText) ui.statusText.innerText = message;
}

const COLOR_PALETTE = [
  {
    dot: "bg-blue-500",
    text: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500",
  },
  {
    dot: "bg-red-500",
    text: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500",
  },
  {
    dot: "bg-green-500",
    text: "text-green-400",
    bg: "bg-green-500/20",
    border: "border-green-500",
  },
  {
    dot: "bg-yellow-500",
    text: "text-yellow-400",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500",
  },
  {
    dot: "bg-indigo-500",
    text: "text-indigo-400",
    bg: "bg-indigo-500/20",
    border: "border-indigo-500",
  },
  {
    dot: "bg-purple-500",
    text: "text-purple-400",
    bg: "bg-purple-500/20",
    border: "border-purple-500",
  },
  {
    dot: "bg-pink-500",
    text: "text-pink-400",
    bg: "bg-pink-500/20",
    border: "border-pink-500",
  },
  {
    dot: "bg-teal-500",
    text: "text-teal-400",
    bg: "bg-teal-500/20",
    border: "border-teal-500",
  },
];

const FIXED_ERROR_COLORS: Record<string, number> = {
  Dictionary: 1,
  Typo: 0,
  Foreign: 2,
  Uppercase: 3,
  Tone: 4,
  Spelling: 5,
};

function getErrorHighlights(type: string): {
  dot: string;
  text: string;
  bg: string;
  border: string;
} {
  if (
    !type ||
    !Object.prototype.hasOwnProperty.call(FIXED_ERROR_COLORS, type)
  ) {
    return COLOR_PALETTE[COLOR_PALETTE.length - 1];
  }

  return COLOR_PALETTE[FIXED_ERROR_COLORS[type]];
}

function getContext(text: string, index: number, length: number) {
  const contextLength = CONTEXT_LENGTH_CHARS;
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + length + contextLength);

  let prefix = text.substring(start, index);
  let suffix = text.substring(index + length, end);

  if (start > 0) prefix = "... " + prefix;
  if (end < text.length) suffix = suffix + " ...";

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

/**
 * Displays a short-lived toast notification on the screen.
 * @param msg - The message to display in the toast.
 */
export function showToast(msg: string) {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    logger.error("Toast container #toast-container not found.");
    return;
  }

  const n = document.createElement("div");
  n.className =
    "toast-item relative px-4 py-3 rounded-lg shadow-xl z-[70] text-sm font-medium flex items-center gap-2 mt-2 " +
    "bg-slate-800 text-green-400 border border-slate-700 " +
    "transition-all duration-500 ease-out transform translate-y-full opacity-0";
  n.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg><span>${msg}</span>`;

  toastContainer.prepend(n);
  activeToasts.push(n);

  requestAnimationFrame(() => {
    n.classList.remove("translate-y-full", "opacity-0");
  });

  if (activeToasts.length > MAX_TOASTS_DISPLAYED) {
    const oldestToast = activeToasts.shift();
    oldestToast?.classList.add("opacity-0");
    oldestToast?.addEventListener("transitionend", () => oldestToast.remove(), {
      once: true,
    });
  }

  setTimeout(() => {
    n.classList.add("opacity-0", "translate-y-full");
    n.addEventListener(
      "transitionend",
      () => {
        n.remove();
        const index = activeToasts.indexOf(n);
        if (index > -1) {
          activeToasts.splice(index, 1);
        }
      },
      { once: true }
    );
  }, TOAST_AUTO_DISMISS_MS);
}

/**
 * Copies a given string to the user's clipboard.
 * @param text - The text to copy.
 */
export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      () => {
        showToast(`Đã copy: "${text}"`);
      },
      (err) => {
        logger.error("Could not copy text: ", err);
      }
    );
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      showToast(`Đã copy: "${text}"`);
    } catch (err) {
      logger.error("Could not copy text (fallback): ", err);
    }
    document.body.removeChild(textarea);
  }
}

/**
 * Updates the statistics display in the UI.
 * @param ui - A reference to the UI elements collection.
 * @param totalWords - The total number of words scanned.
 * @param totalErrors - The total number of individual errors found.
 * @param totalGroups - The total number of grouped errors.
 */
export function updateStats(
  ui: UIElements,
  totalWords: number,
  totalErrors: number,
  totalGroups: number
) {
  const statWords =
    ui.metaTitle?.ownerDocument.getElementById("stat-total-words");
  const statErrors = ui.metaTitle?.ownerDocument.getElementById("stat-errors");
  const statGroups = ui.metaTitle?.ownerDocument.getElementById("stat-groups");

  if (statWords) statWords.innerText = totalWords.toLocaleString();
  if (statErrors) statErrors.innerText = totalErrors.toLocaleString();
  const statErrorsMobileCount = ui.metaTitle?.ownerDocument.getElementById(
    "stat-errors-mobile-count"
  );
  if (statErrorsMobileCount)
    statErrorsMobileCount.innerText = totalErrors.toLocaleString();
  if (statGroups) statGroups.innerText = totalGroups.toLocaleString();
}

/**
 * Renders the list of grouped errors in the sidebar.
 * @param ui - A reference to the UI elements collection.
 * @param groups - An array of error groups to render.
 */
export function renderErrorList(ui: UIElements, groups: ErrorGroup[]) {
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

  const template = ui.metaTitle?.ownerDocument.getElementById(
    "error-item-template"
  ) as HTMLTemplateElement;
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
    if (buttonContainer) {
      buttonContainer.dataset.groupId = group.id;
      buttonContainer.dataset.groupWord = group.word;
    }

    if (wordEl) wordEl.textContent = group.word;
    if (reasonEl) reasonEl.textContent = group.reason;
    if (countEl) countEl.textContent = String(group.contexts.length);

    const style = getErrorHighlights(group.type);
    dotEl?.classList.add(style.dot);
    errorList.appendChild(clone);
  });
}

function isUpperCase(str: string): boolean {
  return str === str.toUpperCase() && str !== str.toLowerCase();
}

function isTitleCase(str: string): boolean {
  return str.length > 0 && str[0] === str[0].toUpperCase() && str.slice(1) === str.slice(1).toLowerCase();
}

/**
 * Renders the context view for a selected error, including the surrounding text and suggestions.
 * @param ui - A reference to the UI elements collection.
 * @param group - The error group to display.
 * @param instanceIndex - The index of the specific error instance within the group to display.
 * @param dictionaries - A reference to the loaded dictionaries for generating suggestions.
 */
export function renderContextView(
  ui: UIElements,
  group: ErrorGroup,
  instanceIndex: number,
  dictionaries: Dictionaries
) {
  logger.debug("renderContextView called with:", { group, instanceIndex });
  const contextView =
    ui.metaTitle?.ownerDocument.getElementById("context-view");
  const navIndicator =
    ui.metaTitle?.ownerDocument.getElementById("nav-indicator");
  const contextNavControls = ui.contextNavControls;

  if (!contextView || !navIndicator || !contextNavControls) {
    logger.error("Context view UI elements not found.");
    return;
  }

  const context = group.contexts[instanceIndex];
  const { prefix, target, suffix } = getContext(
    context.context.originalParagraph,
    context.context.matchIndex,
    group.word.length
  );
  const style = getErrorHighlights(group.type);

  const suggestions = findSuggestions(group.word, dictionaries);

  const isOriginalUpperCase = isUpperCase(group.word);
  const isOriginalTitleCase = isTitleCase(group.word);

  const casedSuggestions = suggestions.map(s => {
    if (isOriginalUpperCase) {
      return s.toUpperCase();
    }
    if (isOriginalTitleCase) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    return s;
  });

  const suggHTML =
    casedSuggestions.length > 0
      ? `<div class="mt-4 flex flex-wrap justify-center gap-2"><span class="text-base text-slate-400 mr-1 self-center">Có thể là từ:</span>${casedSuggestions
          .map(
            (s) =>
              `<span class="suggestion-word cursor-pointer bg-green-900/30 text-green-400 border border-green-700/50 px-2 py-1 rounded text-xl">${s}</span>`
          )
          .join("")}</div>`
      : "";

  contextView.innerHTML = `
        <div class="max-w-2xl text-center w-full animate-fadeIn">
            <div class="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-inner relative">
                <div class="reader-content">
                    ${escapeHtml(prefix)}<span class="rounded ${style.bg} ${
    style.text
  } px-1 py-0.5 font-bold">${escapeHtml(target)}</span>${escapeHtml(suffix)}
                </div>
            </div>
            <div class="mt-8 flex flex-col items-center justify-center gap-4">
                <div class="flex items-center gap-3"> <!-- New flex container for error type and links -->
                    <div class="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm border border-slate-700 shadow-lg flex items-center gap-3">
                        <span class="w-3 h-3 rounded-full ${
                          style.dot
                        } shadow-[0_0_8px_currentColor]"></span>
                        <span class="text-slate-200 font-normal">${
                          group.reason
                        }</span>
                    </div>
                    <a href="https://vi.wiktionary.org/wiki/${encodeURIComponent(
                      group.word
                    )}" target="_blank" title="Tra cứu trên Wiktionary"
                       class="inline-flex items-center justify-center p-2 text-blue-400 transition-colors rounded-lg bg-slate-800 hover:text-white hover:bg-blue-600">
                        <img src="https://vi.wiktionary.org/static/favicon/piece.ico" alt="Wiktionary" class="w-5 h-5">
                    </a>
                    <a href="https://www.google.com/search?q=${encodeURIComponent(
                      group.word
                    )}" target="_blank" title="Tìm kiếm trên Google"
                       class="inline-flex items-center justify-center p-2 text-green-400 transition-colors rounded-lg bg-slate-800 hover:text-white hover:bg-green-600">
                        <img src="https://www.gstatic.com/images/branding/searchlogo/ico/favicon.ico" alt="Google" class="w-5 h-5">
                    </a>
                </div>
                ${suggHTML}
            </div>
        </div>
    `;

  // Attach event listeners to the suggestion words
  if (contextView) {
    const suggestionWords =
      contextView.querySelectorAll<HTMLSpanElement>(".suggestion-word");
    suggestionWords.forEach((span) => {
      span.addEventListener("click", (e) => {
        const target = e.target as HTMLSpanElement;
        if (target.textContent) {
          copyToClipboard(target.textContent);
        }
      });
    });
  }

  navIndicator.textContent = `${instanceIndex + 1}/${group.contexts.length}`;
  contextNavControls.classList.remove("hidden");
}

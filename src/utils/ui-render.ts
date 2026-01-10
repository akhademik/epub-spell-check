import { ErrorGroup } from "../types/errors";
import { UIElements } from "../types/ui";
import { logger } from "./logger";
import { findSuggestions } from "./analyzer";
import { Dictionaries } from "../types/dictionary";
import {
  CONTEXT_LENGTH_CHARS,
} from "../constants";

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

import { showToast } from "./notifications";

/**
 * Copies a given string to the user's clipboard.
 * @param text - The text to copy.
 */
export function copyToClipboard(text: string, ui: UIElements) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      () => {
        showToast(ui, `Đã copy: "${text}"`, "success");
      },
      (err) => {
        logger.error("Could not copy text: ", err);
        showToast(ui, "Lỗi sao chép.", "error");
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
      showToast(ui, `Đã copy: "${text}"`, "success");
    } catch (err) {
      logger.error("Could not copy text (fallback): ", err);
      showToast(ui, "Lỗi sao chép.", "error");
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
  if (ui.statTotalWords) ui.statTotalWords.innerText = totalWords.toLocaleString();
  if (ui.statErrors) ui.statErrors.innerText = totalErrors.toLocaleString();
  if (ui.statErrorsMobileCount)
    ui.statErrorsMobileCount.innerText = totalErrors.toLocaleString();
  if (ui.statGroups) ui.statGroups.innerText = totalGroups.toLocaleString();
}

import { SimpleVirtualScroll } from "./virtual-scroll";

/**
 * Renders the list of grouped errors in the sidebar.
 * @param ui - A reference to the UI elements collection.
 * @param groups - An array of error groups to render.
 */
export function renderErrorList(ui: UIElements, groups: ErrorGroup[]) {
    if (!ui.errorList) {
        logger.error("UI element #error-list not found.");
        return;
    }


    if (groups.length === 0) {
        ui.errorList.innerHTML = `
      <div class="p-10 text-center text-slate-600 flex flex-col items-center">
        <svg class="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-medium">Tuyệt vời!</p>
        <p class="text-sm mt-1">Không tìm thấy lỗi nào.</p>
      </div>`;
        return;
    }

    // Clear existing content
    ui.errorList.innerHTML = "";

    // Destroy previous instance if it exists
    if (ui.virtualizedErrorList) {
        if (typeof ui.virtualizedErrorList.destroy === 'function') {
            ui.virtualizedErrorList.destroy();
        }
    }

    const rowHeight = 72; // Height of one item, from template py-3 -> 12px * 2, plus other elements, lets say 72px is enough

    requestAnimationFrame(() => {
        const containerHeight = ui.errorList!.clientHeight;


        if (containerHeight === 0) {
            logger.error("Container height is 0!");
            return;
        }

        ui.virtualizedErrorList = new SimpleVirtualScroll(
            ui.errorList!,
            groups,
            rowHeight,
            (group: ErrorGroup) => {
                const style = getErrorHighlights(group.type);

                const element = document.createElement('div');
                element.className = 'flex items-stretch w-full mb-1 transition-all border border-transparent rounded-lg hover:bg-slate-800 group bg-slate-900 hover:border-slate-700';
                element.style.height = `${rowHeight}px`;
                element.dataset.groupId = group.id;
                element.dataset.groupWord = group.word;

                const selectBtn = document.createElement('button');
                selectBtn.className = 'flex items-center justify-between flex-grow px-4 py-3 text-left border-r rounded-l-lg select-btn focus:outline-none border-slate-800/50 group-hover:border-slate-700';

                const contentDiv = document.createElement('div');
                contentDiv.className = 'w-full overflow-hidden';

                const topRow = document.createElement('div');
                topRow.className = 'flex items-center gap-2';
                
                const dotSpan = document.createElement('span');
                dotSpan.className = `status-dot w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_5px_rgba(0,0,0,0.5)] ${style.dot}`;
                
                const wordSpan = document.createElement('span');
                wordSpan.className = 'font-serif text-lg font-bold truncate text-slate-200 error-word';
                wordSpan.textContent = group.word;

                const countSpan = document.createElement('span');
                countSpan.className = 'bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full error-count flex-shrink-0';
                countSpan.textContent = String(group.contexts.length);

                topRow.append(dotSpan, wordSpan, countSpan);

                const reasonDiv = document.createElement('div');
                reasonDiv.className = 'mt-1 text-xs truncate text-slate-500 error-reason';
                reasonDiv.textContent = group.reason;

                contentDiv.append(topRow, reasonDiv);
                selectBtn.appendChild(contentDiv);

                const ignoreBtn = document.createElement('button');
                ignoreBtn.className = 'flex items-center justify-center px-3 transition-colors rounded-r-lg ignore-btn text-slate-600 hover:text-green-400 hover:bg-slate-800/50';
                ignoreBtn.title = 'Bỏ qua (Whitelist)';
                ignoreBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                `;

                element.append(selectBtn, ignoreBtn);
                
                return element;
            }
        );


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

  if (!ui.contextView || !ui.navIndicator || !ui.contextNavControls) {
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

  ui.contextView.innerHTML = `
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
  if (ui.contextView) {
    const suggestionWords =
      ui.contextView.querySelectorAll<HTMLSpanElement>(".suggestion-word");
    suggestionWords.forEach((span) => {
      span.addEventListener("click", (e) => {
        const target = e.target as HTMLSpanElement;
        if (target.textContent) {
          copyToClipboard(target.textContent, ui);
        }
      });
    });
  }

  ui.navIndicator.textContent = `${instanceIndex + 1}/${group.contexts.length}`;
  ui.contextNavControls.classList.remove("hidden");
}

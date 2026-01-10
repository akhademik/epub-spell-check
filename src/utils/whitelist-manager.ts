import {
  FILE_SIZE_LIMIT_BYTES,
  WHITELIST_FILE_EXTENSIONS,
  WHITELIST_WORD_COUNT_LIMIT,
  WHITELIST_WORD_LENGTH_LIMIT,
} from "../constants";
import { UIElements } from "../types/ui";
import { logger } from "./logger";
import { openModal } from "./modal";
import { showToast } from "./notifications";
import { getWordsFromTags, renderWhitelistTags } from "./whitelist-tags-manager";


type UpdateAndRenderFn = () => void;
type SaveWhitelistFn = (value: string) => void;

function getWhitelistWords(UI: UIElements): string[] {
    return getWordsFromTags(UI);
}

function setAndSaveWhitelist(UI: UIElements, words: string[], saveWhitelist: SaveWhitelistFn, updateAndRenderErrors: UpdateAndRenderFn) {
    const onRemove = (wordToRemove: string) => {
        const currentWords = getWhitelistWords(UI);
        const newWords = currentWords.filter(w => w.toLowerCase() !== wordToRemove.toLowerCase());
        setAndSaveWhitelist(UI, newWords, saveWhitelist, updateAndRenderErrors);
    };

    renderWhitelistTags(UI, words, onRemove);
    saveWhitelist(words.join(", "));
    updateAndRenderErrors();
}

export function addWordToWhitelist(word: string, UI: UIElements, saveWhitelist: SaveWhitelistFn, updateAndRenderErrors: UpdateAndRenderFn): boolean {
    if (!UI.whitelistTagsContainer) return false;

    const currentWords = getWhitelistWords(UI);
    const lowercasedWords = new Set(currentWords.map(w => w.toLowerCase()));

    if (lowercasedWords.has(word.toLowerCase())) {
        logger.info(`'${word}' is already in the whitelist.`);
        return false;
    }

    const newWords = [...currentWords, word];
    setAndSaveWhitelist(UI, newWords, saveWhitelist, updateAndRenderErrors);
    return true;
}

export function clearWhitelist(UI: UIElements) {
    if (getWhitelistWords(UI).length === 0) {
        showToast(UI, "Danh sách đã trống.", "info");
        return;
    }
    openModal(UI, "clear-whitelist");
}

export function confirmClearWhitelist(UI: UIElements, saveWhitelist: SaveWhitelistFn, updateAndRenderErrors: UpdateAndRenderFn) {
    setAndSaveWhitelist(UI, [], saveWhitelist, updateAndRenderErrors);
}

export function exportWhitelist(UI: UIElements) {
    const words = getWhitelistWords(UI);
    if (words.length === 0) {
        showToast(UI, "Danh sách trống!", "info");
        return;
    }
    const blob = new Blob([words.join("\n")], {
        type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whitelist-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

export function handleImportWhitelist(
    event: Event,
    UI: UIElements,
    updateAndRenderErrors: UpdateAndRenderFn,
    saveWhitelist: SaveWhitelistFn
) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file || !UI.whitelistTagsContainer) return;

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!WHITELIST_FILE_EXTENSIONS.includes(fileExtension || "")) {
        showToast(UI, "Lỗi: Tệp phải là tệp văn bản (.txt, .md)", "error");
        fileInput.value = "";
        return;
    }

    if (file.size > FILE_SIZE_LIMIT_BYTES) {
        showToast(UI, "Lỗi: Kích thước tệp không được vượt quá 1MB", "error");
        fileInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const newContent = e.target?.result as string;
        const importedDisplay = newContent.split(/[\s,]+/).filter(Boolean);

        if (importedDisplay.length > WHITELIST_WORD_COUNT_LIMIT) {
            showToast(UI, `Lỗi: Danh sách trắng không được chứa nhiều hơn ${WHITELIST_WORD_COUNT_LIMIT} từ`, "error");
            fileInput.value = "";
            return;
        }

        const validWordRegex = /^[a-zA-Z\p{L}-]+$/u;
        const validWords: string[] = [];
        const invalidWords: string[] = [];

        for (const word of importedDisplay) {
            if (word.length > WHITELIST_WORD_LENGTH_LIMIT) {
                invalidWords.push(word);
            } else if (validWordRegex.test(word)) {
                validWords.push(word);
            } else {
                invalidWords.push(word);
            }
        }

        if (invalidWords.length > 0) {
            showToast(UI, `Các từ không hợp lệ đã bị loại bỏ: ${invalidWords.join(", ")}`, "info");
        }

        const currentWords = getWhitelistWords(UI);
        const finalWhitelistMap = new Map<string, string>();

        for (const word of currentWords) {
            finalWhitelistMap.set(word.toLowerCase(), word);
        }

        for (const word of validWords) {
            finalWhitelistMap.set(word.toLowerCase(), word);
        }

        const finalDisplay = Array.from(finalWhitelistMap.values());
        setAndSaveWhitelist(UI, finalDisplay, saveWhitelist, updateAndRenderErrors);

        fileInput.value = "";
    };
    reader.readAsText(file);
}
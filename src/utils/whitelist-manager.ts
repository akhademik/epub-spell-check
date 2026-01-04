
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
import { updateUIWhitelistInput } from "./ui-utils";
import { parseWhitelistWithOriginalCase } from "./whitelist-parser";

type UpdateAndRenderFn = () => void;

export function updateWhitelist(
  word: string,
  UI: UIElements,
  saveWhitelist: (value: string) => void
): boolean {
  if (!UI.whitelistInput) return false;

  const { display, check } = parseWhitelistWithOriginalCase(
    UI.whitelistInput.value
  );

  if (check.has(word.toLowerCase())) {
    logger.info(`'${word}' is already in the whitelist.`);
    return false;
  }

  display.push(word);
  updateUIWhitelistInput(UI, display.join(", "));
  saveWhitelist(UI.whitelistInput.value);
  return true;
}

export function clearWhitelist(UI: UIElements) {
  if (!UI.whitelistInput) return;
  if (UI.whitelistInput.value.trim() === "") {
    showToast("Danh sách đã trống.", "info");
    return;
  }
  openModal(UI, "clear-whitelist");
}

export function exportWhitelist(UI: UIElements) {
  if (!UI.whitelistInput?.value.trim()) {
    showToast("Danh sách trống!", "info");
    return;
  }
  const { display } = parseWhitelistWithOriginalCase(UI.whitelistInput.value);
  const blob = new Blob([display.join("\n")], {
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
  saveWhitelist: (value: string) => void
) {
  const fileInput = event.target as HTMLInputElement;
  const file = fileInput.files?.[0];
  if (!file || !UI.whitelistInput) return;

  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (!WHITELIST_FILE_EXTENSIONS.includes(fileExtension || "")) {
    showToast("Lỗi: Tệp phải là tệp văn bản (.txt, .md)", "error");
    fileInput.value = "";
    return;
  }

  if (file.size > FILE_SIZE_LIMIT_BYTES) {
    showToast("Lỗi: Kích thước tệp không được vượt quá 1MB", "error");
    fileInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const newContent = e.target?.result as string;

    const { display: importedDisplay } =
      parseWhitelistWithOriginalCase(newContent);

    if (importedDisplay.length > WHITELIST_WORD_COUNT_LIMIT) {
      showToast(
        "Lỗi: Danh sách trắng không được chứa nhiều hơn 10,000 từ",
        "error"
      );
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
      showToast(
        `Các từ không hợp lệ đã bị loại bỏ: ${invalidWords.join(", ")}`,
        "info"
      );
    }

    const currentContent = UI.whitelistInput!.value;
    const { display: currentDisplay } =
      parseWhitelistWithOriginalCase(currentContent);

    const finalWhitelistMap = new Map<string, string>();

    for (const word of currentDisplay) {
      finalWhitelistMap.set(word.toLowerCase(), word);
    }

    for (const word of validWords) {
      finalWhitelistMap.set(word.toLowerCase(), word);
    }

    const finalDisplay = Array.from(finalWhitelistMap.values());

    updateUIWhitelistInput(
      UI,
      finalDisplay.join(", ") + (finalDisplay.length > 0 ? ", " : "")
    );
    saveWhitelist(UI.whitelistInput!.value);
    updateAndRenderErrors();

    fileInput.value = "";
  };
  reader.readAsText(file);
}

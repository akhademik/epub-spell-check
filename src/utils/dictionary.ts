// src/utils/dictionary.ts
import { Dictionaries, DictionaryStatus } from '../types/dictionary';
import { logger } from './logger';

import { UIElements } from '../types/ui';


// Helper to fetch dictionary content with local fallback
async function fetchLocalDict(localFilename: string): Promise<string | null> {
  try {
    const localRes = await fetch(`/${localFilename}`);
    if (localRes.ok) {
      return await localRes.text();
    } else {
        logger.warn(`Local file ${localFilename} not found, status: ${localRes.status}`);
        return null; // Explicitly return null if local file not found
    }
  } catch (e) {
    logger.error(`Failed to load local file ${localFilename}:`, e);
    return null;
  }
}

// Load all dictionaries
export async function loadDictionaries(ui: UIElements): Promise<{
  dictionaries: Dictionaries;
  status: DictionaryStatus;
}> {
  const dictionaries: Dictionaries = {
    vietnamese: new Set<string>(),
    english: new Set<string>(),
    custom: new Set<string>(),
  };
  const status: DictionaryStatus = {
    isVietnameseLoaded: false,
    isEnglishLoaded: false,
    isCustomLoaded: false,
    vietnameseWordCount: 0,
    englishWordCount: 0,
    customWordCount: 0,
  };

  if (ui.dictStatus) {
    ui.dictStatus.classList.remove("hidden");
    ui.dictStatus.classList.add("md:flex", "items-center", "gap-3");
  }
  if (ui.dictText) ui.dictText.innerText = "Đang tải dữ liệu...";
  if (ui.dictDot) {
    ui.dictDot.classList.remove("bg-green-500", "bg-red-500");
    ui.dictDot.classList.add("bg-yellow-500", "animate-pulse");
  }

  try {
    // Show engLoading indicator when starting English dictionary fetch
    if (ui.engLoading) {
        ui.engLoading.classList.remove("hidden");
        ui.engLoading.classList.add("flex"); // Ensure flex is present for display
    }

    const [vnRes, enRes, customRes] = await Promise.all([
      fetchLocalDict("vn-dict.txt"),
      fetchLocalDict("en-dict.txt"),
      fetchLocalDict("custom-dict.txt"),
    ]);

    // Hide engLoading indicator once English dictionary fetch is complete
    if (ui.engLoading) {
        ui.engLoading.classList.add("hidden");
        ui.engLoading.classList.remove("flex");
    }


    // Process Vietnamese Dictionary
    if (vnRes) {
      vnRes.split("\n").forEach((line) => {
        let word = line.trim();
        if (!word) return;
        // Handle potential JSON format {text: "word"}
        if (word.startsWith("{") && word.endsWith("}")) {
          try {
            word = JSON.parse(word).text;
          } catch (_e) { /* ignore parse errors */ }
        }
        const cleanWord = word.toLowerCase().normalize("NFC");
        if (cleanWord) {
          cleanWord.split(/\s+/).forEach((p) => dictionaries.vietnamese.add(p));
        }
      });
      // Add common Vietnamese words/pronouns from sample.htm
      [
        "kỹ", "mỹ", "kì", "lí", "qui", "có", "hắn", "y", "gã", "thị",
        "nó", "ta", "ngươi", "chư", "mỗ", "tại", "bị", "bởi", "chăng",
      ].forEach((w) => dictionaries.vietnamese.add(w.toLowerCase().normalize("NFC")));
      status.isVietnameseLoaded = true;
      status.vietnameseWordCount = dictionaries.vietnamese.size;
    }

    // Process English Dictionary
    if (enRes) {
      enRes.split(/\r?\n/).forEach((word) => {
        const cleanWord = word.trim().toLowerCase();
        if (cleanWord) dictionaries.english.add(cleanWord);
      });
      status.isEnglishLoaded = true;
      status.englishWordCount = dictionaries.english.size;
    }

    // Process Custom Dictionary
    if (customRes) {
      customRes.split(/\r?\n/).forEach((word) => {
        const cleanWord = word.trim();
        if (cleanWord) dictionaries.custom.add(cleanWord);
      });
      status.isCustomLoaded = true;
      status.customWordCount = dictionaries.custom.size;
    }

    // Update UI
    if (ui.dictDot) ui.dictDot.classList.remove("bg-yellow-500", "animate-pulse");
    if (status.isVietnameseLoaded) {
      if (ui.dictDot) ui.dictDot.classList.add("bg-green-500");
      if (ui.dictText) {
        ui.dictText.innerHTML = `
          <div class="flex flex-col items-start leading-snug">
            <span>VN: ${status.vietnameseWordCount.toLocaleString()} từ</span>
            <span>EN: ${status.englishWordCount.toLocaleString()} từ</span>
          </div>
        `;
      }
    } else {
      if (ui.dictDot) ui.dictDot.classList.add("bg-red-500");
      if (ui.dictText) ui.dictText.innerText = "Lỗi tải dữ liệu";
    }
  } catch (err) {
    logger.error("Error loading dictionaries:", err);
    if (ui.dictDot) {
      ui.dictDot.classList.remove("bg-yellow-500", "animate-pulse");
      ui.dictDot.classList.add("bg-red-500");
    }
    if (ui.dictText) ui.dictText.innerText = "Lỗi kết nối";
  }

  return { dictionaries, status };
}

import { Dictionaries, DictionaryStatus } from '../types/dictionary';


import { UIElements } from '../types/ui';


async function fetchLocalDict(localFilename: string): Promise<string> {
  const localRes = await fetch(`/${localFilename}`);
  if (!localRes.ok) {
    throw new Error(`Failed to load local file ${localFilename}, status: ${localRes.status}`);
  }
  const contentType = localRes.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error(`Failed to load expected text file ${localFilename}. Server returned HTML fallback.`);
  }
  return await localRes.text();
}


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

  ui.dictStatus?.classList.remove("hidden");
  ui.dictStatus?.classList.add("md:flex", "items-center", "gap-3");
  if (ui.dictText) ui.dictText.innerText = "Đang tải dữ liệu...";
  ui.dictDot?.classList.remove("bg-green-500", "bg-red-500");
  ui.dictDot?.classList.add("bg-yellow-500", "animate-pulse");

  ui.engLoading?.classList.remove("hidden");
  ui.engLoading?.classList.add("flex");

  const [vnRes, enRes, customRes] = await Promise.all([
    fetchLocalDict("vn-dict.txt"),
    fetchLocalDict("en-dict.txt"),
    fetchLocalDict("custom-dict.txt"),
  ]);

  ui.engLoading?.classList.add("hidden");
  ui.engLoading?.classList.remove("flex");

  // Process Vietnamese Dictionary
  vnRes.split("\n").forEach((line) => {
    let word = line.trim();
    if (!word) return;
    if (word.startsWith("{") && word.endsWith("}")) {
      try {
        word = JSON.parse(word).text;
      } catch (_e) { /* intentional no-op */ }
    }
    const cleanWord = word.toLowerCase().normalize("NFC");
    if (cleanWord) {
      cleanWord.split(/\s+/).forEach((p) => dictionaries.vietnamese.add(p));
    }
  });

  status.isVietnameseLoaded = true;
  status.vietnameseWordCount = dictionaries.vietnamese.size;

  // Process English Dictionary
  enRes.split(/\r?\n/).forEach((word) => {
    const cleanWord = word.trim().toLowerCase();
    if (cleanWord) dictionaries.english.add(cleanWord);
  });
  status.isEnglishLoaded = true;
  status.englishWordCount = dictionaries.english.size;

  // Process Custom Dictionary
  customRes.split(/\r?\n/).forEach((word) => {
    const cleanWord = word.trim();
    if (cleanWord) dictionaries.custom.add(cleanWord);
  });
  status.isCustomLoaded = true;
  status.customWordCount = dictionaries.custom.size;

  ui.dictDot?.classList.remove("bg-yellow-500", "animate-pulse");
  ui.dictDot?.classList.add("bg-green-500"); // Always green if no error propagated
  if (ui.dictText) {
    ui.dictText.innerHTML = `
      <div class="flex flex-col items-start leading-snug">
        <span>VN: ${status.vietnameseWordCount.toLocaleString()} từ</span>
        <span>EN: ${status.englishWordCount.toLocaleString()} từ</span>
      </div>
    `;
  }

  return { dictionaries, status };
}
// src/main.ts
import './style.css';
import { loadDictionaries } from './utils/dictionary';
import { Dictionaries, DictionaryStatus } from './types/dictionary';

import { logger } from './utils/logger';

// --- 2. DOM ELEMENTS & STATE ---
interface UI_Elements {
  dictStatus: HTMLElement | null;
  dictDot: HTMLElement | null;
  dictText: HTMLElement | null;
  // Add other UI elements as needed for future steps
}

const UI: UI_Elements = {
  dictStatus: document.getElementById("dict-status"),
  dictDot: document.getElementById("dict-dot"),
  dictText: document.getElementById("dict-text"),
};

interface GlobalState {
  dictionaries: Dictionaries;
  dictionaryStatus: DictionaryStatus;
  // Add other state properties as needed for future steps
}

const state: GlobalState = {
  dictionaries: {
    vietnamese: new Set(),
    english: new Set(),
    custom: new Set(),
  },
  dictionaryStatus: {
    isVietnameseLoaded: false,
    isEnglishLoaded: false,
    isCustomLoaded: false,
    vietnameseWordCount: 0,
    englishWordCount: 0,
    customWordCount: 0,
  },
};

// --- 5. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  const { dictionaries, status } = await loadDictionaries(UI);
  state.dictionaries = dictionaries;
  state.dictionaryStatus = status;

  logger.log('Dictionaries Loaded:', state.dictionaryStatus);
  logger.log('Vietnamese words:', state.dictionaries.vietnamese.size);
  logger.log('English words:', state.dictionaries.english.size);
  logger.log('Custom words:', state.dictionaries.custom.size);
});

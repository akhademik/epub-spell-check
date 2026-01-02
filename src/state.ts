import { AppState, ReaderSettings } from './types/state';

import { logger } from './utils/logger';

const WHITELIST_KEY = "vn_spell_whitelist";
const READER_SETTINGS_KEY = "vn_spell_reader";

const initialState: AppState = {
  dictionaries: { vietnamese: new Set(), english: new Set(), custom: new Set() },
  dictionaryStatus: { isVietnameseLoaded: false, isEnglishLoaded: false, isCustomLoaded: false, vietnameseWordCount: 0, englishWordCount: 0, customWordCount: 0 },
  currentBookTitle: '',
  loadedTextContent: [],
  currentCoverUrl: null,
  totalWords: 0,
  allDetectedErrors: [],
  currentFilteredErrors: [],
  currentGroup: null,
  currentInstanceIndex: 0,
  checkSettings: { dictionary: true, uppercase: true, tone: true, foreign: true },
  isEngFilterEnabled: false,
  readerSettings: { fontSize: 1.25, fontFamily: "serif" },
  selectedErrorElement: null,
};

export const state: AppState = { ...initialState };

export function resetState() {
  const { dictionaries, dictionaryStatus } = state;
  const newState = { ...initialState, dictionaries, dictionaryStatus };
  Object.assign(state, newState);
}

export function loadStateFromLocalStorage() {
  const whitelist = localStorage.getItem(WHITELIST_KEY);
  if (whitelist) {
    // This will be handled by the UI component, but we could store it here if we want
  }



  try {
    const readerSettings = localStorage.getItem(READER_SETTINGS_KEY);
    if (readerSettings) {
      state.readerSettings = JSON.parse(readerSettings);
    }
  } catch (e) {
    logger.error("Failed to load reader settings", e);
  }
}



export function saveWhitelist(whitelist: string) {
  localStorage.setItem(WHITELIST_KEY, whitelist);
}

export function loadWhitelist(): string {
  return localStorage.getItem(WHITELIST_KEY) || '';
}



export function saveReaderSettings() {
  localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(state.readerSettings));
}

export function getReaderSettings(): ReaderSettings {
  try {
    const s = localStorage.getItem(READER_SETTINGS_KEY);
    if (s) return JSON.parse(s);
  } catch (e) {
    logger.error("Failed to load reader settings", e);
  }
  return { fontSize: 1.25, fontFamily: "serif" };
}
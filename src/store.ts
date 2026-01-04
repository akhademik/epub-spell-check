
import { map } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { AppState, ReaderSettings } from './types/state';

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
  isEngFilterEnabled: true,
  selectedErrorElement: null,
};

export const $appState = map<AppState>(initialState);

export const $readerSettings = persistentAtom<ReaderSettings>('spell-check:reader-settings', {
    fontSize: 1.25,
    fontFamily: 'serif',
}, {
    encode: JSON.stringify,
    decode: JSON.parse
});

export const $whitelist = persistentAtom<string>('spell-check:whitelist', '');

export function resetState() {
    const { dictionaries, dictionaryStatus } = $appState.get();
    $appState.set({ ...initialState, dictionaries, dictionaryStatus });
}

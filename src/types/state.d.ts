// src/types/state.d.ts
import { Dictionaries, DictionaryStatus } from './dictionary';
import { TextContentBlock } from './epub';

export interface ReaderSettings {
  fontSize: number;
  fontFamily: 'serif' | 'sans-serif';
}

export interface GlobalState {
  dictionaries: Dictionaries;
  dictionaryStatus: DictionaryStatus;
  currentBookTitle: string;
  loadedTextContent: TextContentBlock[];
  currentCoverUrl: string | null;
  totalWords: number; // Added totalWords
  readerSettings: ReaderSettings;
}
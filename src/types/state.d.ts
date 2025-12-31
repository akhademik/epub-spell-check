// src/types/state.d.ts
import { Dictionaries, DictionaryStatus } from "./dictionary";

export interface ReaderSettings {
    fontSize: number;
    fontFamily: "serif" | "sans-serif";
}

export interface GlobalState {
    dictionaries: Dictionaries;
    dictionaryStatus: DictionaryStatus;
    currentBookTitle: string;
    loadedTextContent: { text: string }[];
    currentCoverUrl: string | null;
    totalWords: number;
    readerSettings: ReaderSettings;
}

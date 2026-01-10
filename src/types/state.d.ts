import { Dictionaries, DictionaryStatus } from "./dictionary";
import { ErrorGroup } from './errors';
import { CheckSettings } from '../utils/analyzer';

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
}

export interface AppState extends GlobalState {
    allDetectedErrors: ErrorGroup[];
    currentFilteredErrors: ErrorGroup[];
    currentGroup: ErrorGroup | null;
    currentInstanceIndex: number;
    checkSettings: CheckSettings;
    isEngFilterEnabled: boolean;
    selectedErrorElement: HTMLElement | null;
}

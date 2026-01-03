
export type ErrorType = 'Dictionary' | 'Uppercase' | 'Tone' | 'Foreign' | 'Typo' | 'Spelling';

export interface ErrorInstance {
    word: string;
    originalWord: string;
    context: {
        originalParagraph: string;
        startIndex: number;
        endIndex: number;
        matchIndex: number;
        chapterIndex: number;
        paragraphIndex: number;
    };
    type: ErrorType;
    reason?: string;
    suggestions?: string[];
}

export interface ErrorGroup {
    id: string;
    word: string;
    type: ErrorType;
    reason: string;
    count: number;
    contexts: ErrorInstance[];
    suggestions?: string[];
}
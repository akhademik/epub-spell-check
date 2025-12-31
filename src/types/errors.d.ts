// src/types/errors.d.ts

export type ErrorType = 'Dictionary' | 'Uppercase' | 'Tone' | 'Foreign' | 'Typo' | 'Spelling';

// This interface defines the properties of a single instance of an error found in text.
export interface ErrorInstance {
    word: string; // The word identified as an error in this specific instance.
    originalWord: string; // The original word from the text (before normalization, if any).
    // The context is now an object for richer information
    context: {
        originalParagraph: string; // The full paragraph text where the error was found.
        startIndex: number; // The start index of the error word within the originalParagraph.
        endIndex: number; // The end index of the error word within the originalParagraph.
        matchIndex: number; // The index of the match within the paragraph (if multiple matches exist for the same word).
        chapterIndex: number; // The chapter index where the error was found.
        paragraphIndex: number; // The paragraph index within the chapter.
    };
    type: ErrorType; // The type of error for this specific instance.
    reason?: string; // Optional reason/description for this error instance.
    suggestions?: string[]; // Optional suggestions for correction.
}

// This interface defines a group of identical errors.
export interface ErrorGroup {
    id: string; // Unique ID for the error group (e.g., lowercase word + type).
    word: string; // The word identified as an error (common to all instances in this group).
    type: ErrorType; // The type of error (common to all instances in this group).
    reason: string; // The primary reason/description for this error group.
    count: number; // Number of occurrences (instances) of this error.
    contexts: ErrorInstance[]; // Array of all specific instances of this error.
    suggestions?: string[]; // Optional suggestions for correction (common to the group).
}
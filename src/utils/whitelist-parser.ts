// src/utils/whitelist-parser.ts

/**
 * Parses a raw string containing whitelist words (separated by commas, semicolons, quotes, spaces, or newlines)
 * and returns a Set of unique, trimmed, non-empty, lowercase words.
 * @param inputString The raw string to parse.
 * @returns A Set of unique whitelist words.
 */
export function parseWhitelistInput(inputString: string): Set<string> {
    const words: string[] = [];

    // Split by newlines/carriage returns first to handle multi-line inputs
    inputString.split(/[\r\n]+/).forEach(line => {
        // Then split each line by commas, semicolons, spaces, and quotes
        // Filter out empty strings and trim whitespace
        words.push(...line.split(/\s*[,;\s"]+\s*/).map(t => t.trim()).filter(Boolean));
    });
    
    // Remove duplicates and convert to lowercase
    return new Set(words.map(word => word.toLowerCase()).filter(Boolean));
}

/**
 * Parses a raw string containing whitelist words and returns the words
 * with their original casing, as well as a Set of lowercase words for checking.
 * @param inputString The raw string to parse.
 * @returns An object with the display words and the check set.
 */
export function parseWhitelistWithOriginalCase(inputString: string): { display: string[], check: Set<string> } {
    const words: string[] = [];

    // Split by newlines/carriage returns first to handle multi-line inputs
    inputString.split(/[\r\n]+/).forEach(line => {
        // Then split each line by commas, semicolons, spaces, and quotes
        // Filter out empty strings and trim whitespace
        words.push(...line.split(/\s*[,;\s"]+\s*/).map(t => t.trim()).filter(Boolean));
    });

    const display: string[] = [];
    const check = new Set<string>();

    for (const word of words) {
        const lower = word.toLowerCase();
        if (!check.has(lower)) {
            display.push(word);
            check.add(lower);
        }
    }

    return { display, check };
}

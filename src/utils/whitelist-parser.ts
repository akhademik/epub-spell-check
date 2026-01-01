
export function parseWhitelistInput(inputString: string): Set<string> {
    const words: string[] = [];

    inputString.split(/[\r\n]+/).forEach(line => {
        words.push(...line.split(/\s*[,;\s"]+\s*/).map(t => t.trim()).filter(Boolean));
    });

    return new Set(words.map(word => word.toLowerCase()).filter(Boolean));
}


export function parseWhitelistWithOriginalCase(inputString: string): { display: string[], check: Set<string> } {
    const words: string[] = [];

    inputString.split(/[\r\n]+/).forEach(line => {
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

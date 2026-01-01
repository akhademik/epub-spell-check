import { ErrorGroup } from '../types/errors';
import { AppState } from '../types/state';
import { memoize } from './memoize';
import { parseWhitelistWithOriginalCase } from './whitelist-parser';

function filterErrors(
    allDetectedErrors: ErrorGroup[],
    whitelistValue: string,
    isEngFilterEnabled: boolean,
    checkSettings: AppState['checkSettings'],
    englishDictionary: Set<string>
): ErrorGroup[] {
    const { check } = parseWhitelistWithOriginalCase(whitelistValue);

    return allDetectedErrors.filter(group => {
        const lowerWord = group.word.toLowerCase();
        if (check.has(lowerWord)) return false;
        if (isEngFilterEnabled && englishDictionary.has(lowerWord)) return false;

        const settings = checkSettings;
        if (!settings.dictionary && group.type === 'Dictionary') return false;
        if (!settings.uppercase && group.type === 'Uppercase') return false;
        if (!settings.tone && group.type === 'Tone') return false;
        if (!settings.foreign && ['Foreign', 'Typo', 'Spelling'].includes(group.type)) return false;

        return true;
    });
}

export const getFilteredErrors = memoize(filterErrors);
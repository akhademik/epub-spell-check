import { TAG_COLORS } from "../constants";
import { UIElements } from "../types/ui";

export function createWhitelistTag(word: string, onRemove: (word:string) => void, index: number): HTMLElement {
    const tag = document.createElement("div");
    const colorIndex = index % TAG_COLORS.length;
    const color = TAG_COLORS[colorIndex];
    tag.className = `whitelist-tag ${color}`;
    tag.dataset.word = word;

    const wordSpan = document.createElement("span");
    wordSpan.textContent = word;
    tag.appendChild(wordSpan);

    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "&times;";
    removeBtn.className = "whitelist-tag-remove";
    removeBtn.onclick = () => onRemove(word);
    tag.appendChild(removeBtn);

    return tag;
}

export function getWordsFromTags(UI: UIElements): string[] {
    if (!UI.whitelistTagsContainer) return [];
    const tags = UI.whitelistTagsContainer.querySelectorAll(".whitelist-tag");
    return Array.from(tags).map(tag => (tag as HTMLElement).dataset.word || "").filter(Boolean);
}

export function renderWhitelistTags(UI: UIElements, words: string[], onRemove: (word: string) => void) {
    if (!UI.whitelistTagsContainer) return;
    UI.whitelistTagsContainer.innerHTML = "";
    words.forEach((word, index) => {
        const tag = createWhitelistTag(word, onRemove, index);
        UI.whitelistTagsContainer!.appendChild(tag);
    });
}

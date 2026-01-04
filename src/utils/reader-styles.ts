
import { ReaderSettings } from "../types/state";
import { UIElements } from "../types/ui";

export function applyReaderStyles(readerSettings: ReaderSettings, ui: UIElements) {
  if (ui.contextView) {
    const fontStyle =
      readerSettings.fontFamily === "serif"
        ? '"Noto Serif", serif'
        : '"Noto Sans", sans-serif';
    const fontSize = `${readerSettings.fontSize}rem`;
    ui.contextView.style.setProperty("--reader-font", fontStyle);
    ui.contextView.style.setProperty("--reader-size", fontSize);
  }
}

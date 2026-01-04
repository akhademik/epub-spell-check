
import { ReaderSettings } from "../types/state";

export function applyReaderStyles(readerSettings: ReaderSettings) {
  const contextView = document.getElementById("context-view");
  if (contextView) {
    const fontStyle =
      readerSettings.fontFamily === "serif"
        ? '"Noto Serif", serif'
        : '"Noto Sans", sans-serif';
    const fontSize = `${readerSettings.fontSize}rem`;
    contextView.style.setProperty("--reader-font", fontStyle);
    contextView.style.setProperty("--reader-size", fontSize);
  }
}

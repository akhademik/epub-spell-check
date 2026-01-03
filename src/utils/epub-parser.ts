import JSZip from 'jszip';
import { BookMetadata, TextContentBlock, EpubContent } from '../types/epub';

import { UIElements } from '../types/ui';
import { updateProgress } from './ui-render';
import { logger } from './logger';



export async function parseEpub(
  file: File,
  ui: UIElements
): Promise<EpubContent> {
  updateProgress(ui, 10, 'Đang giải nén tệp...');
  const zip = await JSZip.loadAsync(file);

  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) {
    throw new Error("File EPUB không hợp lệ: thiếu META-INF/container.xml");
  }
  const cData = await containerFile.async("string");

  const parser = new DOMParser();
  const cXml = parser.parseFromString(cData, "application/xml");
  const rootPath = cXml
    .querySelector("rootfile")
    ?.getAttribute("full-path");

  if (!rootPath) {
    throw new Error("EPUB không hợp lệ: không tìm thấy OPF rootfile");
  }

  const opfData = await zip.file(rootPath)?.async("string");
  if (!opfData) {
    throw new Error("EPUB không hợp lệ: không tìm thấy OPF file");
  }
  const opfXml = parser.parseFromString(opfData, "application/xml");
  const opfDir = rootPath.substring(0, rootPath.lastIndexOf("/"));
  const resolvePath = (p: string) => (opfDir ? opfDir + "/" + p : p);

  const metadata: BookMetadata = {
    title:
      opfXml.getElementsByTagName("dc:title")[0]?.textContent ||
      opfXml.querySelector("title")?.textContent ||
      "Không rõ tên sách",
    author:
      opfXml.getElementsByTagName("dc:creator")[0]?.textContent ||
      opfXml.querySelector("creator")?.textContent ||
      "Không rõ tác giả",
    coverUrl: null,
  };


  try {
    let coverHref: string | null = null;
    const coverMeta = opfXml.querySelector('meta[name="cover"]');
    if (coverMeta) {
      const coverId = coverMeta.getAttribute("content");
      const coverItem = opfXml.querySelector(
        `manifest item[id="${coverId}"]`
      );
      if (coverItem) coverHref = coverItem.getAttribute("href");
    }
    if (!coverHref) {
      const coverItem = opfXml.querySelector(
        'manifest item[properties*="cover-image"]'
      );
      if (coverItem) coverHref = coverItem.getAttribute("href");
    }
    if (coverHref) {
      const fullCoverPath = resolvePath(coverHref);
      const coverFile = zip.file(fullCoverPath);
      if (coverFile) {
        const coverBlob = await coverFile.async("blob");
        metadata.coverUrl = URL.createObjectURL(coverBlob);
      }
    }
  } catch (_e) {
    logger.warn("Could not extract cover image.", _e);
  }

  updateProgress(ui, 30, 'Đang đọc cấu trúc sách...');

  const spine = Array.from(
    opfXml.querySelectorAll("spine itemref")
  ).map((ref) => ref.getAttribute("idref"));

  const textBlocks: TextContentBlock[] = [];
  for (let i = 0; i < spine.length; i++) {
    const id = spine[i];
    const item = Array.from(
      opfXml.querySelectorAll("manifest item")
    ).find((it) => it.getAttribute("id") === id);

    if (item) {
      const href = item.getAttribute("href");
      if (!href) continue;

      const fullPath = resolvePath(href);
      const chapterFile = zip.file(fullPath);

      if (chapterFile) {
        const html = await chapterFile.async("string");
        const doc = parser.parseFromString(html, "text/html");
        const paras = Array.from(
          doc.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, div")
        )
          .map((el) => el.textContent?.trim() || "")
          .filter((text) => text.length > 0)
          .map((text) => ({ text }));

        textBlocks.push(...paras);
      }
    }
    if (i % 5 === 0) {
      updateProgress(
        ui,
        30 + Math.round((i / spine.length) * 30),
        `Đang đọc chương ${i + 1}/${spine.length}`
      );
    }
  }

  return { metadata, textBlocks };
}

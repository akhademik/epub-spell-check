// src/types/epub.d.ts

export interface BookMetadata {
  title: string;
  author: string;
  coverUrl: string | null;
}

export interface TextContentBlock {
  text: string;
  // Potentially add more context like chapter, paragraph index, etc.
}

export interface EpubContent {
  metadata: BookMetadata;
  textBlocks: TextContentBlock[];
}

export interface ProgressUpdate {
  percentage: number;
  message: string;
}

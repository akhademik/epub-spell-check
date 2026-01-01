
export interface BookMetadata {
  title: string;
  author: string;
  coverUrl: string | null;
}

export interface TextContentBlock {
  text: string;
}

export interface EpubContent {
  metadata: BookMetadata;
  textBlocks: TextContentBlock[];
}


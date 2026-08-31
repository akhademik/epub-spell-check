export interface BookMetadata {
  title: string
  author: string
  coverUrl: string | null
}

export interface TextContentBlock {
  id: string
  filePath: string
  text: string
}

export interface EpubContent {
  metadata: BookMetadata
  textBlocks: TextContentBlock[]
}

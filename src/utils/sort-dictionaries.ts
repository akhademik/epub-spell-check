
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';

async function sortDictionaryFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Split into words, trim, filter out empty lines
    const originalWords = content.split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);
    const originalCount = originalWords.length;

    // Deduplicate and sort
    const sortedWords = Array.from(new Set(originalWords)).sort();
    const uniqueCount = sortedWords.length;
    const duplicatesRemoved = originalCount - uniqueCount;

    await fs.writeFile(filePath, sortedWords.join('\n'), 'utf-8');
    logger.info(`Successfully sorted and deduplicated words in ${path.basename(filePath)}. Original: ${originalCount}, Unique: ${uniqueCount}, Duplicates removed: ${duplicatesRemoved}`);

  } catch (error) {
    logger.error(`Error processing file ${filePath}:`, error);
  }
}

async function sortAllDictionaries() {
  const projectRoot = process.cwd();
  const publicDir = path.join(projectRoot, 'public');

  const filesToSort = [
    path.join(publicDir, 'en-dict.txt'),
    path.join(publicDir, 'vn-dict.txt'),
    path.join(publicDir, 'custom-dict.txt'),
  ];

  for (const filePath of filesToSort) {
    await sortDictionaryFile(filePath);
  }

  logger.info('All specified dictionary files have been sorted.');
}

sortAllDictionaries();

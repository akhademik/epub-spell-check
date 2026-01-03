
import fs from 'fs/promises';
import path from 'path';

async function sortDictionaryFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Split into words, trim, filter out empty lines, deduplicate, and sort
    const sortedWords = Array.from(new Set(
      content.split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0)
    )).sort();

    await fs.writeFile(filePath, sortedWords.join('\n'), 'utf-8');
    console.log(`Successfully sorted and deduplicated words in ${filePath}`);

  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
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

  console.log('All specified dictionary files have been sorted.');
}

sortAllDictionaries();

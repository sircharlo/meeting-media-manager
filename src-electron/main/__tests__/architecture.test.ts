import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'upath';
import { describe, expect, it } from 'vitest';

const SRC_ELECTRON_DIR = join(process.cwd(), 'src-electron');
const ALLOWED_SRC_SUBDIRS = ['types', 'constants', 'shared'];

async function getAllFiles(dir: string, fileList: string[] = []) {
  const files = await readdir(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    if ((await stat(filePath)).isDirectory()) {
      if (file !== '__tests__') {
        await getAllFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.ts') && !filePath.endsWith('.test.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

describe('Architecture: Electron Main Process Imports', () => {
  it('should not have forbidden imports from src', async () => {
    const files = await getAllFiles(SRC_ELECTRON_DIR);
    const allForbiddenImports: string[] = [];

    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      const relativePath = relative(process.cwd(), file);

      const forbiddenImports: string[] = [];

      // Regex to find imports from 'src/...'
      // Matches: import ... from 'src/...' or import('src/...')
      const importRegex =
        /from\s+['"]src\/([^'"]+)['"]|import\(['"]src\/([^'"]+)['"]\)/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1] || match[2];
        if (!importPath) {
          continue;
        }

        const subDir = importPath.split('/')[0];
        if (!subDir) {
          continue;
        }

        if (!ALLOWED_SRC_SUBDIRS.includes(subDir)) {
          const line = content.substring(0, match.index).split('\n').length;

          const allowedDirs = ALLOWED_SRC_SUBDIRS.map((s) => `"src/${s}"`).join(
            ', ',
          );

          const message =
            `Forbidden import found in ${relativePath}:${line}\n` +
            `Import: "src/${importPath}"\n` +
            `Only imports from ${allowedDirs} are allowed in src-electron.`;

          forbiddenImports.push(message);
        }
      }

      allForbiddenImports.push(...forbiddenImports);
    }

    expect(allForbiddenImports).toEqual([]);
  });
});

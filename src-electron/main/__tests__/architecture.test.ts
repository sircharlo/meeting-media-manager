import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ELECTRON_DIR = join(process.cwd(), 'src-electron');
const ALLOWED_SRC_SUBDIRS = ['types', 'constants'];

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  files.forEach((file) => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      if (file !== '__tests__') {
        getAllFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.ts') && !filePath.endsWith('.test.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

describe('Architecture: Electron Main Process Imports', () => {
  const files = getAllFiles(SRC_ELECTRON_DIR);

  it.each(files)('should not have forbidden imports from src in %s', (file) => {
    const content = readFileSync(file, 'utf-8');
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
        forbiddenImports.push(
          `Forbidden import found in ${relativePath}:${line}\n` +
            `Import: "src/${importPath}"\n` +
            `Only imports from ${ALLOWED_SRC_SUBDIRS.map((s) => `"src/${s}"`).join(', ')} are allowed in src-electron.`,
        );
      }
    }

    expect(forbiddenImports).toEqual([]);
  });
});

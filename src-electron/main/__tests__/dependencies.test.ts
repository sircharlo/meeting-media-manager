import { readdir, readFile, stat } from 'node:fs/promises';
import { log } from 'src/shared/vanilla';
import { extname, join, resolve } from 'upath';
import { describe, expect, it } from 'vitest';

import { dependencies } from '../../../package.json';
import { dependencies as electronDependencies } from '../../package.json';

const projectRoot = resolve(__dirname, '../../..');
const srcElectronDir = resolve(projectRoot, 'src-electron');

async function getAllFiles(
  dir: string,
  extensions: string[] = ['.ts', '.js'],
): Promise<string[]> {
  let results: string[] = [];
  const list = await readdir(dir);
  for (const file of list) {
    const filePath = join(dir, file);
    const fileStat = await stat(filePath);
    if (fileStat?.isDirectory()) {
      if (file === 'node_modules') continue;
      results = results.concat(await getAllFiles(filePath, extensions));
    } else {
      if (filePath.includes('__tests__')) continue;
      if (/\.(spec|test)\.[jt]s$/.test(filePath)) continue;
      if (extensions.includes(extname(file))) {
        results.push(filePath);
      }
    }
  }
  // Dedupe using a Set
  results = [...new Set(results)];
  return results;
}

function getElectronDepsFromConfig() {
  return new Set(Object.keys(electronDependencies));
}

async function getImportsFromFile(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, 'utf-8');
  const imports: string[] = [];

  // Match import ... from '...'
  const importMatches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    if (match[1]) imports.push(match[1]);
  }

  // Match require('...')
  const requireMatches = content.matchAll(/require\(['"]([^'"]+)['"]\)/g);
  for (const match of requireMatches) {
    if (match[1]) imports.push(match[1]);
  }

  // Match import('...')
  const dynamicImportMatches = content.matchAll(/import\(['"]([^'"]+)['"]\)/g);
  for (const match of dynamicImportMatches) {
    if (match[1]) imports.push(match[1]);
  }

  return imports;
}

function getProductionDependencies() {
  return Object.keys(dependencies);
}

describe('Electron Dependencies', () => {
  it('should list all used dependencies in electronDeps in quasar.config.ts', async () => {
    const prodDeps = getProductionDependencies();
    const whitelistedDeps = getElectronDepsFromConfig();
    const files = await getAllFiles(srcElectronDir);

    const usedDeps = new Set<string>();

    const transitiveDeps = new Set<string>();

    for (const file of files) {
      const imports = await getImportsFromFile(file);
      for (const imp of imports) {
        // Skip dependencies that are internal import, not external packages
        if (imp.startsWith('app/')) continue;
        if (imp.startsWith('preload/')) continue;
        if (imp.startsWith('src/')) continue;
        if (imp.startsWith('src-electron/')) continue;

        // Skip electron dependencies
        if (imp === 'electron') continue;
        if (imp === 'electron/renderer') continue;

        // Skip virtual Quasar CLI aliases (not real npm packages)
        if (imp.startsWith('#q-app')) continue;

        // Skip built-in node dependencies
        if (imp.startsWith('node:')) continue;

        // Check if import starts with a production dependency name
        // e.g. 'fs-extra' or 'fs-extra/esm' matches 'fs-extra'
        // e.g. '@sentry/electron' matches '@sentry/electron'
        const matchingDep = prodDeps.find(
          (dep) => imp === dep || imp.startsWith(`${dep}/`),
        );
        if (matchingDep) {
          usedDeps.add(matchingDep);
        } else {
          transitiveDeps.add(imp);
        }
      }
    }

    const missingDeps: string[] = [];
    usedDeps.forEach((dep) => {
      if (!whitelistedDeps.has(dep)) {
        missingDeps.push(dep);
      }
    });
    missingDeps.sort((a, b) => a.localeCompare(b));

    if (missingDeps.length > 0) {
      log(
        'The following dependencies are used in src-electron but not whitelisted in quasar.config.ts:',
        'electronDependencies',
        'error',
        missingDeps,
      );
    }

    const undeclaredDeps: string[] = [];
    transitiveDeps.forEach((dep) => {
      if (!whitelistedDeps.has(dep)) {
        undeclaredDeps.push(dep);
      }
    });
    undeclaredDeps.sort((a, b) => a.localeCompare(b));

    if (undeclaredDeps.length > 0) {
      log(
        'The following dependencies are used in src-electron but missing from package.json:',
        'electronDependencies',
        'error',
        undeclaredDeps,
      );
    }

    expect(missingDeps.concat(undeclaredDeps)).toEqual([]);
  });
});

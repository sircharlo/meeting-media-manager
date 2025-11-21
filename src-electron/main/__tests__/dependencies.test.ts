import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import packageJson from '../../../package.json';

const projectRoot = path.resolve(__dirname, '../../..');
const srcElectronDir = path.resolve(projectRoot, 'src-electron');
const quasarConfigPath = path.resolve(projectRoot, 'quasar.config.ts');

function getAllFiles(
  dir: string,
  extensions: string[] = ['.ts', '.js'],
): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, extensions));
    } else {
      if (filePath.includes('__tests__')) continue;
      if (extensions.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

function getElectronDepsFromConfig() {
  const configContent = fs.readFileSync(quasarConfigPath, 'utf-8');
  const match = configContent.match(
    /const electronDeps = new Set\(\[([\s\S]*?)\]\);/,
  );
  if (!match || !match[1]) {
    throw new Error('Could not find electronDeps Set in quasar.config.ts');
  }
  const depsContent = match[1];
  const deps = depsContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith("'") || line.startsWith('"'))
    .map((line) => line.replace(/['",]/g, ''));
  return new Set(deps);
}

function getImportsFromFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
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
  return Object.keys(packageJson.dependencies);
}

describe('Electron Dependencies', () => {
  it('should list all used dependencies in electronDeps in quasar.config.ts', () => {
    const prodDeps = getProductionDependencies();
    const whitelistedDeps = getElectronDepsFromConfig();
    const files = getAllFiles(srcElectronDir);

    const usedDeps = new Set<string>();

    const transitiveDeps = new Set<string>();

    files.forEach((file) => {
      const imports = getImportsFromFile(file);
      for (const imp of imports) {
        // Skip dependencies that are internal import, not external packages
        if (imp.startsWith('app/')) continue;
        if (imp.startsWith('main/')) continue;
        if (imp.startsWith('preload/')) continue;
        if (imp.startsWith('src/')) continue;
        if (imp.startsWith('src-electron/')) continue;

        // Skip electron dependencies
        if (imp === 'electron') continue;
        if (imp === 'electron/renderer') continue;

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
    });

    const missingDeps: string[] = [];
    usedDeps.forEach((dep) => {
      if (!whitelistedDeps.has(dep)) {
        missingDeps.push(dep);
      }
    });

    if (missingDeps.length > 0) {
      console.error(
        'The following dependencies are used in src-electron but not whitelisted in quasar.config.ts:',
        missingDeps,
      );
    }

    const undeclaredDeps: string[] = [];
    transitiveDeps.forEach((dep) => {
      if (!whitelistedDeps.has(dep)) {
        undeclaredDeps.push(dep);
      }
    });

    if (undeclaredDeps.length > 0) {
      console.error(
        'The following dependencies are used in src-electron but missing from package.json:',
        undeclaredDeps,
      );
    }

    expect(missingDeps.concat(undeclaredDeps)).toEqual([]);
  });
});

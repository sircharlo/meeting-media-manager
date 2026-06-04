#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('node:child_process');
const { access } = require('node:fs/promises');

async function main() {
  // Skip in CI environments or if no .git directory
  if (
    process.env.CI ||
    process.env.NODE_ENV === 'production' ||
    !(await pathExists('.git'))
  ) {
    console.log(
      'Skipping Husky installation (CI/production environment or no .git)',
    );
  } else if (await pathExists('.husky/install.mjs')) {
    await runCommand(
      'node',
      ['.husky/install.mjs'],
      'Husky install (custom script)',
    );
  } else {
    await runCommand('npx', ['husky', 'install'], 'Husky install (default)');
  }

  // Run other build commands
  await runCommand('yarn', ['quasar', 'prepare'], 'Quasar preparation');
  await runCommand('yarn', ['generate:icons'], 'Icon generation');
  await runCommand('yarn', ['electron-rebuild'], 'Electron rebuild');

  console.log('✓ Post-install completed successfully');
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function runCommand(command, args, description) {
  return new Promise((resolve) => {
    console.log(`Running: ${description}`);
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: true,
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      console.warn(`⚠ ${description} failed:`, error.message);
      resolve();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ ${description} completed`);
      } else {
        console.warn(`⚠ ${description} failed with exit code ${code}`);
      }
      resolve();
    });
  });
}

main().catch((error) => {
  console.error('Post-install failed:', error);
  process.exitCode = 1;
});

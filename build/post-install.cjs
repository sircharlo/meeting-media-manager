#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const { existsSync } = require('fs');

function main() {
  // Skip in CI environments or if no .git directory
  if (
    process.env.CI ||
    process.env.NODE_ENV === 'production' ||
    !existsSync('.git')
  ) {
    console.log(
      'Skipping Husky installation (CI/production environment or no .git)',
    );
  } else {
    // Try to install Husky
    if (existsSync('.husky/install.mjs')) {
      runCommand('node .husky/install.mjs', 'Husky install (custom script)');
    } else {
      runCommand('npx husky install', 'Husky install (default)');
    }
  }

  // Run other build commands
  runCommand('yarn quasar prepare', 'Quasar preparation');
  runCommand('yarn generate:icons', 'Icon generation');
  runCommand('yarn electron-rebuild', 'Electron rebuild');

  console.log('✓ Post-install completed successfully');
}

function runCommand(command, description) {
  try {
    console.log(`Running: ${description}`);
    execSync(command, { cwd: process.cwd(), stdio: 'inherit' });
    console.log(`✓ ${description} completed`);
  } catch (error) {
    console.warn(`⚠ ${description} failed:`, error.message);
    // Don't throw - continue with other commands
  }
}

main();

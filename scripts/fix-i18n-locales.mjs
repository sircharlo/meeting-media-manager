#!/usr/bin/env node
import { baseCompile } from '@intlify/message-compiler';
import fsx from 'fs-extra';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { readdir, readFile, writeFile } = fsx;

const I18N_DIR = resolve(__dirname, '../src/i18n');
const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const verbose = args.has('--verbose');

const TYPOGRAPHIC_QUOTE_CLASS = '\'"‘’‚‛“”„‟';
const PLACEHOLDER_MARKER = '\u0000';

function compiles(message) {
  try {
    baseCompile(message, {
      jit: true,
      location: false,
      onError: (error) => {
        throw error;
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Repair known-recurring Crowdin corruption of vue-i18n linked-message
 * syntax (`@:key` / `@:{'key'}`). Crowdin re-introduces the same mangled
 * output whenever a translator re-submits a string through its web editor
 * (see 535970092, "repair broken Estonian strings that crashed the
 * Settings page" - a hand fix that Crowdin promptly undid), so this runs
 * on every test/build instead of being a one-off patch to the JSON.
 * Corruption is also repaired at the source by scripts/cleanup-crowdin.mjs
 * (hourly + on demand); this fixer is the local safety net.
 */
function fixLinkedMessageSyntax(message) {
  if (!message.includes('@:')) return message;

  let fixed = message;

  // `@:{‘key’}` / `@:{“key”}` / `@:{„key“}` -> `@:{'key'}` - typographic
  // quotes around the linked key instead of straight ones (compiler error
  // code 2, "Invalid token in placeholder").
  fixed = fixed.replace(
    new RegExp(
      String.raw`@:\{\s*[${TYPOGRAPHIC_QUOTE_CLASS}]([^{}${TYPOGRAPHIC_QUOTE_CLASS}]*)[${TYPOGRAPHIC_QUOTE_CLASS}]\s*\}`,
      'g',
    ),
    "@:{'$1'}",
  );

  // `@:  key` -> `@:key` - stray whitespace between `@:` and a bare linked
  // key (compiler error code 10, "Invalid linked format").
  fixed = fixed.replace(/@:[ \t]+(?=[\p{L}\p{N}_-])/gu, '@:');

  // A stray closing quote+brace left over from a mangled `@:{'key'}`
  // (compiler error code 6, "Unbalanced closing brace"). Protect the
  // now-canonical `@:{'key'}` occurrences behind a placeholder that can't
  // collide with real text, then drop any orphaned `'}`/"}` left behind in
  // what remains before restoring the protected occurrences.
  const placeholders = [];
  const protectedText = fixed.replace(/@:\{'[^']*'\}/g, (match) => {
    placeholders.push(match);
    return `${PLACEHOLDER_MARKER}${placeholders.length - 1}${PLACEHOLDER_MARKER}`;
  });
  const strippedText = protectedText.replace(/['"]\}/g, '');
  fixed = strippedText.replace(
    new RegExp(
      String.raw`${PLACEHOLDER_MARKER}(\d+)${PLACEHOLDER_MARKER}`,
      'g',
    ),
    (_, i) => placeholders[Number(i)],
  );

  return fixed;
}

async function main() {
  try {
    const files = (await readdir(I18N_DIR)).filter((f) => f.endsWith('.json'));
    let totalFixed = 0;
    const totalUnfixable = [];

    // Locale files are independent: read them concurrently, then fix and log
    // them in directory order so the console output stays deterministic.
    const locales = await Promise.all(
      files.map(async (file) => {
        const path = resolve(I18N_DIR, file);
        const messages = JSON.parse(await readFile(path, 'utf-8'));
        return { file, messages, path };
      }),
    );
    const pendingWrites = [];

    for (const { file, messages, path } of locales) {
      const totals = { fixed: 0, unfixable: [] };
      walkAndFix(messages, totals);

      if (totals.fixed > 0) {
        totalFixed += totals.fixed;
        console.log(
          `[i18n] ${file}: fixed ${totals.fixed} message${totals.fixed === 1 ? '' : 's'}`,
        );
        if (!checkOnly) pendingWrites.push({ messages, path });
      }
      for (const failure of totals.unfixable) {
        totalUnfixable.push({ file, ...failure });
      }
    }

    // Each fixed locale is written to its own file, so order doesn't matter.
    await Promise.all(
      pendingWrites.map(({ messages, path }) =>
        writeFile(path, `${JSON.stringify(messages, null, 2)}\n`, 'utf-8'),
      ),
    );

    if (totalUnfixable.length > 0) {
      console.warn(
        `[i18n] ${totalUnfixable.length} message${totalUnfixable.length === 1 ? '' : 's'} could not be auto-repaired:`,
      );
      for (const { file, key, value } of totalUnfixable) {
        console.warn(`  ${file}: ${key}: ${JSON.stringify(value)}`);
      }
    }

    console.log(
      `Done. ${checkOnly ? 'Found' : 'Fixed'} ${totalFixed} message${totalFixed === 1 ? '' : 's'}.`,
    );

    if (checkOnly && (totalFixed > 0 || totalUnfixable.length > 0)) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

function walkAndFix(obj, totals) {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      if (!value.includes('@:') || compiles(value)) continue;
      const fixed = fixLinkedMessageSyntax(value);
      if (fixed !== value && compiles(fixed)) {
        obj[key] = fixed;
        totals.fixed += 1;
        if (verbose) {
          console.log(
            `  ${key}: ${JSON.stringify(value)} -> ${JSON.stringify(fixed)}`,
          );
        }
      } else {
        totals.unfixable.push({ key, value });
      }
    } else if (value && typeof value === 'object') {
      walkAndFix(value, totals);
    }
  }
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

export { compiles, fixLinkedMessageSyntax };

if (isMain) {
  await main();
}

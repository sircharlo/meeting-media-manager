// Writes Flathub's copy of the Flatpak manifest: this folder's, with M³'s own
// source as a release's tag and commit (type git) instead of the checkout it
// sits in (type dir). Flathub builds from that, plus the generated-sources.json
// made from the same release's lockfiles (see README.md and
// .github/workflows/store-release.yml).
//
//   node build/flatpak/flathub-manifest.mjs <tag> <commit> <output file>
//
// No YAML library: the manifest keeps its comments, and the one block that
// changes is replaced as text. If the manifest no longer has exactly that
// block, this fails rather than guess.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ID = 'io.github.sircharlo.meeting-media-manager';
const REPOSITORY = 'https://github.com/sircharlo/meeting-media-manager.git';

/**
 * Flathub's manifest, from this folder's.
 * @param {string} manifest The manifest's text.
 * @param {string} tag The release's tag, e.g. v26.11.4.
 * @param {string} commit The full SHA the tag points to.
 * @returns {string} The manifest, building that tag.
 */
export const toFlathubManifest = (manifest, tag, commit) => {
  if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
    throw new Error(`Not a release tag: "${tag}" (expected vYY.M.N)`);
  }
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`Not a full commit SHA: "${commit}"`);
  }
  // The local source: its comment, `type: dir`, `path` and `skip` list, each
  // line at the source's own indentation (\1), so that the next source isn't
  // taken for one of its skipped paths.
  const localSource =
    /( *)# Flathub's copy:[^\n]*\n(?:\1#[^\n]*\n)*\1- type: dir\n\1 {2}path: \.\.\/\.\.\n\1 {2}skip:\n(?:\1 {4}- [^\n]+\n)+/g;
  const matches = manifest.match(localSource) ?? [];
  if (matches.length !== 1) {
    throw new Error(
      `Expected one local (type: dir) source for M³ in the manifest, found ${matches.length}`,
    );
  }
  return manifest.replace(localSource, (_block, indent) =>
    [
      `${indent}- type: git`,
      `${indent}  url: ${REPOSITORY}`,
      `${indent}  tag: ${tag}`,
      `${indent}  commit: ${commit}`,
      '',
    ].join('\n'),
  );
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [tag, commit, output] = process.argv.slice(2);
  if (!tag || !commit || !output) {
    throw new Error('Usage: flathub-manifest.mjs <tag> <commit> <output file>');
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const manifest = readFileSync(join(here, `${APP_ID}.yml`), 'utf8');
  writeFileSync(output, toFlathubManifest(manifest, tag, commit));
  console.log(`Wrote ${output} for ${tag} (${commit})`);
}

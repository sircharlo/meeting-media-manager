import { promises as fs } from 'node:fs';
import { join } from 'upath';

const sourceDir = join('.', 'build', 'icons');
const outputDir = join('.', 'src', 'css');
const inputDirPattern = sourceDir;
const outputDirPattern = outputDir;
const fontName = 'mmm-icons';
const cssOutput = join(outputDir, 'mmm-icons.css');

const cssBanner = `@font-face {
    font-family: ${fontName};
    src: url("${fontName}.woff2") format("woff2");
    font-weight: normal;
    font-style: normal;
}

.pw-msk, .pw-msk input[type=text] {
    font-family: '${fontName}';
}

.pw-msk::placeholder, .pw-msk input[type=text]::placeholder {
    font-family: initial;
}

[class^="mmm"]::before, [class*=" mmm"]::before {
    font-family: '${fontName}';
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-style: normal;
}
`;

const toUnicode = (codepoint) => `\\${codepoint.toString(16)}`;

async function main() {
  // HACK: Patch fantasticon behavior until PR 611 is merged
  // This fixes the 'No SVGs found' error on Windows.
  if (process.platform === 'win32') {
    const distDir = join('.', 'node_modules', 'fantasticon', 'dist');
    try {
      const files = await fs.readdir(distDir);
      const chunkFile = files.find(
        (f) => f.startsWith('chunk-') && f.endsWith('.js'),
      );
      if (chunkFile) {
        const chunkPath = join(distDir, chunkFile);
        let chunkContent = await fs.readFile(chunkPath, 'utf8');
        if (chunkContent.includes('await glob(globPath, {})')) {
          chunkContent = chunkContent.replace(
            'await glob(globPath, {})',
            'await glob(globPath, { windowsPathsNoEscape: true, posix: true })',
          );
          await fs.writeFile(chunkPath, chunkContent, 'utf8');
          console.log('Fantasticon patch applied successfully');
        }
      }
    } catch (e) {
      console.warn('Could not apply fantasticon patch:', e.message);
    }
  }

  const { generateFonts } = await import('fantasticon');

  const { codepoints } = await generateFonts({
    fontsUrl: '.',
    fontTypes: ['woff2'],
    inputDir: inputDirPattern,
    name: fontName,
    normalize: true,
    outputDir: outputDirPattern,
    prefix: 'mmm',
  });

  const iconRules = Object.entries(codepoints)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([iconName, codepoint]) => {
      return `\n.mmm-${iconName}::before {\n    content: "${toUnicode(codepoint)}";\n}\n`;
    })
    .join('');

  await fs.writeFile(cssOutput, `${cssBanner}${iconRules}`, 'utf8');

  const metadataPath = join(outputDir, `${fontName}.json`);
  await fs.rm(metadataPath, { force: true });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

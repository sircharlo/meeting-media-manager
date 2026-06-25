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
  try {
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
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

await main();

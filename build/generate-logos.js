import { promises as fs } from 'node:fs';
import * as png2icons from 'png2icons';
import sharp from 'sharp';
import { dirname, join } from 'upath';

const profilesDir = join('.', 'build', 'profiles');

async function generateFromProfile(profilePath) {
  const profile = JSON.parse(await fs.readFile(profilePath, 'utf8'));
  const sourceBuffer = await fs.readFile(profile.params.icon);

  for (const asset of profile.assets) {
    switch (asset.generator) {
      case 'icns':
        await generateIcns(sourceBuffer, asset);
        break;
      case 'ico':
        await generateIco(sourceBuffer, asset);
        break;
      case 'png':
        await generatePng(sourceBuffer, asset);
        break;
      default:
        throw new Error(`Unknown icon generator: ${asset.generator}`);
    }
  }
}

async function generateIcns(sourceBuffer, asset) {
  const buffer = png2icons.createICNS(sourceBuffer, png2icons.BICUBIC2, 0);
  await writeFile(join(asset.folder, asset.name), buffer);
}

async function generateIco(sourceBuffer, asset) {
  const buffer = png2icons.createICO(sourceBuffer, png2icons.BICUBIC2, 0, true);
  await writeFile(join(asset.folder, asset.name), buffer);
}

async function generatePng(sourceBuffer, asset) {
  for (const size of asset.sizes) {
    const name = asset.name.replaceAll('{size}', size);
    const buffer = await sharp(sourceBuffer)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toBuffer();
    await writeFile(join(asset.folder, name), buffer);
  }
}

async function main() {
  try {
    const profileFiles = (await fs.readdir(profilesDir)).filter((file) =>
      file.endsWith('.json'),
    );

    for (const file of profileFiles) {
      await generateFromProfile(join(profilesDir, file));
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

async function writeFile(path, buffer) {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, buffer);
}

await main();

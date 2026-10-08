#!/usr/bin/env node
// Compares two screenshots and exits 0 if they're the "same" (within a small
// tolerance for rendering jitter — sub-pixel/anti-aliasing rounding differs
// by a pixel or two between otherwise-identical runs even with fully
// deterministic demo data), or 1 if they meaningfully differ. Used by the
// screenshot-refresh workflow to skip opening a PR when nothing changed.
import sharp from 'sharp';

// A handful of ±1-per-channel pixels near card edges is normal rasterization
// jitter, not a real change; real content changes (a moved/resized/recolored
// element) affect far more pixels than this.
const MAX_CHANNEL_DELTA = 4;
const MAX_DIFFERING_PIXELS = 200;

const [, , oldPath, newPath] = process.argv;

if (!oldPath || !newPath) {
  console.error('Usage: compare-screenshot.mjs <old.png> <new.png>');
  process.exit(2);
}

async function loadRaw(path) {
  return sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function main() {
  const [{ data: oldData, info: oldInfo }, { data: newData, info: newInfo }] =
    await Promise.all([loadRaw(oldPath), loadRaw(newPath)]);

  if (oldInfo.width !== newInfo.width || oldInfo.height !== newInfo.height) {
    console.log(
      `Dimensions changed: ${oldInfo.width}x${oldInfo.height} -> ${newInfo.width}x${newInfo.height}`,
    );
    process.exit(1);
  }

  const channels = newInfo.channels;
  let differingPixels = 0;
  for (let i = 0; i < newData.length; i += channels) {
    let maxDelta = 0;
    for (let c = 0; c < channels; c++) {
      maxDelta = Math.max(maxDelta, Math.abs(oldData[i + c] - newData[i + c]));
    }
    if (maxDelta > MAX_CHANNEL_DELTA) differingPixels++;
  }

  const changed = differingPixels > MAX_DIFFERING_PIXELS;
  console.log(
    `${differingPixels} pixel(s) differ by more than ${MAX_CHANNEL_DELTA}/channel (threshold: ${MAX_DIFFERING_PIXELS}) -> ${changed ? 'CHANGED' : 'unchanged'}`,
  );
  process.exit(changed ? 1 : 0);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(2);
}

// Declarative list of screenshots to capture in demo mode. Today this only
// covers the README preview, but it's the extension point for a future docs
// screenshot gallery: add an entry, reusing the same demo-mode app/data.
export const targets = [
  {
    name: 'readme-preview',
    outputPath: 'docs/src/assets/m3-preview.png',
    prepare: async (window) => {
      await window
        .getByText('Sample TGW song')
        .waitFor({ state: 'visible', timeout: 60000 });
      // Start background music (demo-mode audio, no network) so the footer
      // music button is captured in its playing state, then give playback a
      // moment to settle before the final capture.
      await window.evaluate(() =>
        globalThis.dispatchEvent(new CustomEvent('toggleMusic')),
      );
      await window.waitForTimeout(3000);
    },
  },
];

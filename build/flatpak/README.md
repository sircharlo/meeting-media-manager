# M³'s Flatpak

This folder builds M³ as a Flatpak, from source and offline, the way
Flathub would. M³ isn't on Flathub: its submission is on hold (see below).

The app's AppStream metadata and desktop file are in `build/linux`, because
Flathub wants them in the app's own repository.

## Flathub: on hold

[Flathub's Generative AI policy](https://docs.flathub.org/docs/for-app-authors/requirements)
accepts no manifest with AI-generated or AI-assisted content, even
disclosed. It also forbids AI tools from opening or automating submission
pull requests, or writing their text or replies, and asks for disclosure of
AI-generated code in the app. This folder's manifest was written with AI, so
it can't be submitted as it is. M³ on Flathub would need a manifest and a
submission written by hand.

When a release is published on GitHub, the Store Release workflow
(`.github/workflows/store-release.yml`) still makes the files a Flathub
build uses, and keeps them as the run's artifact, but sends nothing to
Flathub:

- the manifest, from `flathub-manifest.mjs`: this folder's, with M³'s source
  as the release's tag and commit;
- `generated-sources.json`, from the release's lockfiles (flatpak-node-generator);
- `flathub.json`, for x86_64 only.

## Build it locally

You need Linux (or WSL) with `flatpak`, `flatpak-builder` and `pipx`.

1. Install the runtimes and tools:

   ```sh
   flatpak install flathub org.freedesktop.Platform//26.08 org.freedesktop.Sdk//26.08 \
     org.freedesktop.Sdk.Extension.node24//26.08 org.electronjs.Electron2.BaseApp//26.08 \
     org.flatpak.Builder
   pipx install "git+https://github.com/flatpak/flatpak-builder-tools.git#subdirectory=node"
   ```

2. In a clean clone (the manifest builds the checkout it's in, without its
   `node_modules`), generate the offline sources for both lockfiles:

   ```sh
   flatpak-node-generator yarn -r yarn.lock -R yarn.lock -R src-electron/yarn.lock \
     --electron-node-headers -o build/flatpak/generated-sources.json
   ```

3. Build and install it:

   ```sh
   cd build/flatpak
   flatpak-builder --force-clean --user --install builddir io.github.sircharlo.meeting-media-manager.yml
   flatpak run io.github.sircharlo.meeting-media-manager
   ```

4. Lint it the way Flathub does:

   ```sh
   flatpak run --command=flatpak-builder-lint org.flatpak.Builder manifest io.github.sircharlo.meeting-media-manager.yml
   ```

The first build takes a while: it compiles FFmpeg, x264 and zimg. Later ones
reuse them.

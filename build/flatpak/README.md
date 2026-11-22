# M³'s Flatpak

Flathub builds M³ from source and offline, from its own repository,
`flathub/io.github.sircharlo.meeting-media-manager`. That repository holds a
copy of this folder's manifest, whose M³ source is a release's tag and
commit, plus the `generated-sources.json` made from that release's lockfiles.

The app's AppStream metadata and desktop file are in `build/linux`, because
Flathub wants them in the app's own repository.

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

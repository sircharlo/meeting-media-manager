# FFmpeg

Meeting Media Manager (M³) ships [FFmpeg](https://ffmpeg.org), which it uses to
convert media: videos this computer can't play, and pictures or audio files
turned into videos. FFmpeg is a separate program by the FFmpeg developers,
licensed under the GNU General Public License, version 3 (see
`COPYING.GPLv3`).

The version shipped is **FFmpeg 9.0.2**, built by:

| Platform                                          | Build                                                                                                                                                           | Its source                                                                                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows (x64)                                     | gyan.dev, `ffmpeg-9.0.2-essentials_build` ([gyan.dev](https://www.gyan.dev/ffmpeg/builds/), [release](https://github.com/GyanD/codexffmpeg/releases/tag/9.0.2)) | FFmpeg commit [946fcce07b](https://github.com/FFmpeg/FFmpeg/commit/946fcce07b); the libraries and configuration are listed on gyan.dev                                |
| macOS (Apple Silicon and Intel, as one universal) | Martin Riedl's release builds ([ffmpeg.martin-riedl.de](https://ffmpeg.martin-riedl.de/))                                                                       | Build scripts: [git.martin-riedl.de/ffmpeg/build-script](https://git.martin-riedl.de/ffmpeg/build-script)                                                             |
| Linux (x64)                                       | BtbN's FFmpeg-Builds, `ffmpeg-n9.0.2-39-g7adfbe40dc-linux64-gpl-9.0` ([release](https://github.com/BtbN/FFmpeg-Builds/releases/tag/autobuild-2026-10-31-12-59)) | FFmpeg commit [7adfbe40dc](https://github.com/FFmpeg/FFmpeg/commit/7adfbe40dc); build scripts: [github.com/BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds) |

FFmpeg 9.0.2's own source: <https://ffmpeg.org/releases/ffmpeg-9.0.2.tar.xz>.

`scripts/fetch-ffmpeg.mjs` downloads these builds when M³ is built, checking
each against a pinned SHA-256.

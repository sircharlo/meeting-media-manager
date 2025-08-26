<!-- markdownlint-disable no-duplicate-heading -->

# 업데이트 내역

버전별 전체 변경 사항은, GitHub 의 CHANGELOG.md 파일을 확인해주세요.

## v25.8.3

### ✨ 새로운 기능

- ✨ **Media Window Fade Transitions**: Added a new advanced setting to make the media window fade in and out, providing smoother visual transitions.
- ✨ **Image Duration Control and Progress Tracking**: Added image duration control and progress tracking capabilities for repeated sections.

## v25.8.1

### ✨ 새로운 기능

- ✨ **Custom Media Sections**: Complete system for creating, editing, and managing custom media sections with color customization and drag-and-drop reordering.
- ✨ **Media Dividers**: Add titled dividers within media lists for better organization with top/bottom positioning options.
- ✨ **Section Repeat Mode**: Enable continuous playback within specific sections for seamless media loops.
- ✨ **Zoom Integration**: Automatic screen sharing start/stop coordination with media playback.

### 🛠️ 개선 및 변경

- 🛠️ **Enhanced Section Headers**: New three-dots menu system with color picker, move up/down controls, repeat options, and delete functionality.
- ✨ **Inline Title Editing**: Edit media item titles directly in the interface without opening separate dialogs.
- 🛠️ **Improved Navigation**: Better keyboard shortcuts with scroll-to-selected functionality and enhanced media navigation.
- 🛠️ **Visual Enhancements**: Animation support during sorting operations and improved drag-and-drop visual feedback.

## 25.6.0

### ✨ 새로운 기능

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

### 🛠️ 개선 및 변경

- 🛠️ **Better mime type handling**: Improved support for MIME types for better media compatibility.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Linux compatibility**: Forced GTK 3 usage on Linux to prevent UI and launch issues.

## 25.5.0

### ✨ 새로운 기능

- 🖼️ **OBS Delay Option for Images**: Add an OBS Studio setting to delay scene changes when displaying images, improving transitions.
- 🔊 **Support for `.m4a` Audio Format**: Add compatibility for `.m4a` audio files to expand supported media types.

### 🛠️ 개선 및 변경

- 🔍 **Restore Zoom with `Ctrl` + `Scroll`**: Re-enable immediate zooming with the control + scroll gesture for easier navigation.
- 👤 **Hide Unused CO Media**: Hide rather than skip unused media for Circuit Overseer visits to maintain a cleaner presentation.
- 🎵 **Improve Duplicate Song Indicator**: Enhance the visual cue for duplicate songs to make them easier to identify.

## 25.4.3

### 🛠️ 개선 및 변경

- ➕ **Clean Up Media From v25.4.x**: Automatically clean up orphaned or misplaced media from v25.4.1 to v25.4.2 to ensure no media is missing or in the wrong place in the media list.

## 25.4.2

### 🛠️ 개선 및 변경

- ➕ **Prevent Duplicate Media**: Avoid adding some media items multiple times to the media list.

## 25.4.1

### 🛠️ 개선 및 변경

- 🎬 **Fix Custom Start/End Time Assignment**: Prevent custom start and end times from being incorrectly applied to the wrong video.
- 📝 **Allow Mismatched Subtitles**: Enable use of subtitles even when they do not perfectly match the media file.
- 🪟 **Disable Rounded Corners on Windows**: Remove rounded corners for the media window on Windows.
- 🖼 **Include Non-Referenced Images in Media List**: Ensure all non-referenced images are added to the media list for completeness.
- ➕ **Prevent Duplicate Media Sections**: Avoid creating multiple media sections for the same media item.
- 📥 **Preserve Playlist Order on Import**: Maintain the original order of JWL playlists during the import process.

## 25.4.0

### ✨ 새로운 기능

- 🇵🇭 **New Language: Tagalog**: Added support for Tagalog, expanding the app's multilingual capabilities.
- 🎞 **Support for `.m4v` Video Format**: Now supports playback of `.m4v` files to improve media compatibility.

### 🛠️ 개선 및 변경

- 🎬 **Multiple Start/End Times for Single Video**: Allow a single video to appear in the media list multiple times with different custom start/end times.
- 📤 **자동 내보내기에 그룹화된 미디어 포함**: 다른 항목과 함께 그룹화된 미디어 항목을 자동으로 내보냅니다.
- 📡 **Correct `.m4v` Fetching from JW API**: Ensure `.m4v` files are correctly fetched from the JW API.

## 25.3.1

### ✨ 새로운 기능

- 🌏 **새 언어 지원: 한국어**: 안녕하세요! 더 많은 사용자가 쉽게 사용할 수 있도록 한국어 지원을 추가하였습니다.

### 🛠️ 개선 및 변경

- ⚡ **성능 및 CPU 사용량 개선**: 성능을 최적화하여 CPU 사용량을 줄이고 효율성을 높였습니다.
- 🔄 **동기화 및 충돌 오류 수정**: 다양한 동기화 관련 및 안정성 문제를 수정하여 안정성을 높였습니다.
- 📜 **기존 회중에만 업데이트 내역 표시**: 이미 애플리케이션을 사용중인 회중을 대상으로만 업데이트 내역을 표시하도록 하였습니다.

## 25.3.0

### ✨ 새로운 기능

- 🎵 **동영상 재생 중 배경 음악 재생**: 동영상을 재생중일 때에도 배경 음악을 계속 재생하도록 하였습니다.
- 🎥 **수어 미디어를 위한 카메라 화면 표시**: 수어 사용자를 위해 미디어가 재생중일 때에도 카메라 화면을 표시할 수 있는 기능을 추가하였습니다.
- 📅 **기념식 배경 화면 자동 적용**: 기념식 일자를 자동으로 확인해 당일 기념식 배경 화면을 자동 적용하도록 하였습니다.
- 📜 **애플리케이션 내 업데이트 내역 표시**: 애플리케이션 내에 업데이트 내역을 바로 표시하여 사용자가 변경사항을 쉽게 확인할 수 있도록 하였습니다.

### 🛠️ 개선 및 변경

- ⚡ **스마트 캐시 정리 최적화**: 스마트 캐시 정리 방식을 개선하여 성능과 효율성을 향상하였습니다.
- 📂 **순회 감독자 미디어 변경 수정**: 순회 감독자 미디어가 올바른 위치에 배치되도록 수정하였습니다.
- 📅 **기념식 일반 집회 미디어 제외**: 오류를 막기 위해 기념식이 있는 기간에는 일반 집회 미디어를 처리하지 않도록 하였습니다.
- 📅 **기념식 당일 일반 집회 섹션 표시 제외**: 깔끔한 레이아웃을 제공하기 위해 기념식 당일에는 불필요한 집회 섹션 표시를 제거하였습니다.
- 📖 **수어 성경 동영상 다운로드 수정**: JWL 재생 목록에서 올바른 수어 성경 동영상을 다운로드하도록 수정하였습니다.

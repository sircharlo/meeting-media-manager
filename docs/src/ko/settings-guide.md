# 설정 가이드 {#settings-guide}

이 종합 가이드에서는 M³에서 사용할 수 있는 모든 설정을 카테고리별로 설명합니다. 이 설정을 이해하면 회중의 필요에 꼭 맞게 M³를 구성할 수 있습니다.

## 일반 {#application-configuration}

### 표시 언어 {#display-language}

<!-- **Setting**: `localAppLang` -->

M³ 인터페이스에 사용할 언어를 선택합니다. 이 설정은 미디어를 다운로드할 때 사용하는 언어와는 별개입니다.

**옵션**: 사용 가능한 모든 인터페이스 언어(영어, 스페인어, 프랑스어 등)

**기본값**: 영어

### 다크 모드 {#dark-mode}

<!-- **Setting**: `darkMode` -->

M³의 화면 테마를 설정합니다.

**옵션**:

- 시스템 설정에 따라 자동으로 전환
- 항상 다크 모드 사용
- 항상 라이트 모드 사용

**기본값**: 자동

### 일주일의 시작 요일 {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

달력 보기에서 한 주의 첫째 날로 사용할 요일을 설정합니다.

**옵션**: 일요일~토요일

**기본값**: 일요일

### 날짜 형식 {#date-format}

<!-- **Setting**: `localDateFormat` -->

앱에서 날짜를 표시할 때 사용하는 형식입니다.

**예**: D MMMM YYYY

**기본값**: D MMMM YYYY

### 로그인 시 자동 실행 {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

컴퓨터가 시작될 때 M³를 자동으로 실행합니다.

**기본값**: `false`

## 회중 집회 {#congregation-meetings}

### 회중 이름 {#congregation-name}

<!-- **Setting**: `congregationName` -->

회중의 이름입니다. 프로필을 정리하고 화면에 표시하는 데 사용됩니다.

**기본값**: 비어 있음(초기 설정 시 지정해야 함)

### 집회 언어 {#meeting-language}

<!-- **Setting**: `lang` -->

미디어를 다운로드할 때 사용하는 기본 언어입니다. 회중의 집회에서 사용하는 언어와 같아야 합니다.

**옵션**: 여호와의 증인 공식 웹사이트에서 제공하는 모든 언어

**기본값**: 영어(E)

### 대체 언어 {#fallback-language}

<!-- **Setting**: `langFallback` -->

기본 언어로 미디어가 제공되지 않을 때 사용할 보조 언어입니다.

**옵션**: 여호와의 증인 공식 웹사이트에서 제공하는 모든 언어

**기본값**: 없음

### 평일 집회 요일 {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

평일 집회가 열리는 요일입니다.

**옵션**: 일요일~토요일

**기본값**: 없음(초기 설정 시 지정해야 함)

### 평일 집회 시간 {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

평일 집회의 시작 시간입니다.

**형식**: HH:MM(24시간 형식)

**기본값**: 없음(초기 설정 시 지정해야 함)

### 공개 집회 요일 {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

공개 집회가 열리는 요일입니다.

**옵션**: 일요일~토요일

**기본값**: 없음(초기 설정 시 지정해야 함)

### 공개 집회 시간 {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

공개 집회의 시작 시간입니다.

**형식**: HH:MM(24시간 형식)

**기본값**: 없음(초기 설정 시 지정해야 함)

### 순회 감독자 방문 주 {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

다음 순회 감독자 방문 주간입니다.

**형식**: MM/DD/YYYY

**기본값**: 없음

### 기념식 날짜 {#memorial-date}

<!-- **Setting**: `memorialDate` -->

다음 기념식 날짜입니다.

**형식**: MM/DD/YYYY

**기본값**: 주기적으로 자동으로 가져옴

### 집회 일정 변경 {#meeting-schedule-changes}

이 설정을 사용하여 집회 일정의 일시적인 변경 사항을 구성할 수 있습니다.

- **집회 일정 변경일**: 변경 사항이 적용되는 날짜
- **일주일만 일정 변경**: 영구적인 변경인지 일시적인 변경인지 여부
- **변경되는 평일 집회 요일**: 평일 집회의 새 요일
- **변경되는 평일 집회 시간**: 평일 집회의 새 시간
- **변경되는 공개 집회 요일**: 공개 집회의 새 요일
- **변경되는 공개 집회 시간**: 공개 집회의 새 시간

### 집회 일정 자동 업데이트 {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

활성화하면 M³가 여호와의 증인 공식 웹사이트에서 집회 요일과 시간이 변경되었는지 주기적으로 확인하고 현재 프로필을 자동으로 업데이트합니다.

이 기능은 회중 검색으로 추가했으며 회중 이름을 직접 변경하지 않은 프로필에서만 작동합니다. 회중 이름이 변경되어 동기화가 비활성화된 경우 **일정 동기화 활성화**를 사용하여 프로필을 다시 연결하십시오.

#### 일정 동기화 활성화 {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

현재 프로필을 회중 검색에 다시 연결하여 집회 요일과 시간의 자동 업데이트가 재개되도록 합니다. 회중 이름을 직접 변경하면 연결이 끊어지므로, 이 버튼은 회중 이름을 직접 변경한 경우에만 표시됩니다.

#### 집회 일정 새로 고침 {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

현재 및 향후 집회 일정을 공식 웹사이트의 정보와 직접 동기화합니다.

## 미디어 및 재생 {#media-retrieval-and-playback}

### 데이터 사용 제한 {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

데이터 사용량이 제한된 연결을 사용하는 경우 이 설정을 활성화하여 대역폭 사용량을 줄이십시오.

**기본값**: `false`

### 미디어 표시 {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

미디어 표시 기능을 활성화합니다. 두 번째 모니터에 미디어를 표시하려면 이 기능이 필요합니다.

**기본값**: `false`

#### 미디어 미리 보기 활성화 {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

이미지나 동영상이 표시되는 동안 미디어 창의 실시간 미리 보기를 표시합니다.

**기본값**: `true`

#### 일시 정지 상태로 재생 시작 {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

재생을 시작할 때 동영상을 일시 정지된 상태로 시작합니다.

**기본값**: `false`

### 배경 음악 {#settings-guide-background-music}

#### 음악 활성화 {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

배경 음악 기능을 활성화합니다.

**기본값**: `true`

#### 음악 자동 시작 {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

적절한 경우 M³를 실행할 때 배경 음악을 자동으로 시작합니다.

**기본값**: `true`

#### 집회 전 음악 중지 시간 {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

집회 시작 몇 초 전에 배경 음악을 중지할지 설정합니다.

**범위**: 0~300초

**기본값**: 60초

#### 음악 볼륨 {#music-volume}

<!-- **Setting**: `musicVolume` -->

배경 음악의 볼륨입니다(1~100%).

**기본값**: 100%

### 재생 및 다운로드 옵션 {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### 미디어 창 페이드 전환 활성화 {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

미디어 창을 표시하거나 숨길 때 페이드 인/아웃 전환을 활성화합니다.

**기본값**: `true`

#### 재생 속도 변경 활성화 {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

미디어 항목의 컨텍스트 메뉴에서 오디오 및 동영상의 재생 속도를 조정할 수 있게 합니다.

**기본값**: `false`

#### 미디어 로고 숨기기 {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

미디어 창에서 로고를 숨깁니다.

**기본값**: `false`

#### 최대 해상도 {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

다운로드하는 미디어 파일의 최대 해상도입니다.

**옵션**: 240p, 360p, 480p, 720p, 1080p

**기본값**: 720p

#### 인쇄판 미디어 포함 {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

인쇄판 출판물의 미디어도 함께 다운로드합니다.

**기본값**: `true`

#### 각주 제외 {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

가능한 경우 각주에 있는 이미지를 미디어 다운로드에서 제외합니다.

**기본값**: `false`

#### 「파수대」 연구 추가 동영상 제외 {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

「파수대」 연구의 각 항에서 참조하는 추가 동영상을 제외합니다.

**기본값**: `false`

#### 회중 성서 연구 동영상 제외 {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

회중 성서 연구 중에 참조 동영상을 표시하지 않을 출판물을 선택합니다. 출판물 제목이나 기호로 검색할 수 있습니다.

**기본값**: Walk Courageously With God (`wcg`)

#### 가르치는 기술 팜플렛의 미디어 제외 {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

가르치는 기술(th) 팜플렛의 미디어를 미디어 다운로드에서 제외합니다.

**기본값**: `true`

### 자막 {#subtitles}

#### 자막 활성화 {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

미디어 재생 시 자막 지원을 활성화합니다.

**기본값**: `false`

#### 자막 언어 {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

자막에 사용할 언어입니다(미디어 언어와 다르게 설정할 수 있음).

**옵션**: 여호와의 증인 공식 웹사이트에서 제공하는 모든 언어

**기본값**: 없음

### 캐시 관리 {#cache-management}

#### 노래책 동영상 미리 저장 {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

성능을 높이기 위해 노래책의 모든 동영상을 미리 저장합니다. 이 경우 미디어 캐시의 크기가 늘어난다는 점에 유의하십시오.

**기본값**: `false`

#### 캐시 폴더 {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

캐시된 미디어 파일을 저장할 위치를 직접 지정합니다.

**기본값**: 시스템 기본 위치

#### 자동 캐시 정리 사용 {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

디스크 공간을 절약하기 위해 오래된 캐시 파일을 자동으로 삭제합니다.

**기본값**: `true`

### 병음 노래 제목 {#pinyin-song-titles}

#### 병음 노래 우선 사용 {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

병음 노래 폴더에서 집회 노래의 병음 버전을 찾으면 일반 노래 대신 사용합니다.

**기본값**: `false`

#### 병음 노래 폴더 {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

병음 동영상 노래가 들어 있는 폴더입니다(예: `sjjm_s-Pi_CHS_066_r720P.mp4`). 집회 노래 번호와 일치하는 병음 파일을 찾으면 일반 노래 대신 재생합니다.

**기본값**: 비어 있음

### 미디어 내보내기 {#settings-guide-media-export}

#### 미디어 자동 내보내기 활성화 {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

미디어 파일을 지정한 폴더로 자동으로 내보냅니다.

**기본값**: `false`

#### 미디어 내보내기 폴더 {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

미디어 파일을 자동으로 내보낼 폴더 경로입니다.

**기본값**: 비어 있음

#### MP4로 파일 변환 {#convert-files-to-mp4}

**설정**: `convertFilesToMp4`

호환성을 높이기 위해 내보낸 미디어 파일을 MP4 형식으로 변환합니다.

**기본값**: `false`

### 공유 폴더(Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

이 설정은 **연동 기능** 카테고리에 있습니다.

M³는 Dropbox, OneDrive, iCloud Drive, Google Drive와 같은 클라우드 저장소 앱으로 동기화되는 폴더에서 집회에 미디어를 추가할 수 있습니다. 다른 사람들이 자신이 맡은 파트에 사용할 미디어를 준비해서 공유해 줄 때나 여러 대의 컴퓨터에서 M³를 사용할 때 유용합니다. 이 컴퓨터나 네트워크에 있는 폴더도 사용할 수 있습니다.

M³는 공유 폴더 안에 예정된 집회마다 폴더를 만들고, 집회 날짜를 연-월-일 형식으로 적어 이름을 붙입니다(예: `2026-03-25`). 사진, 동영상, 오디오 파일 또는 JW 라이브러리 재생 목록을 집회 폴더에 넣으면 해당 집회의 미디어 목록에 자동으로 추가됩니다. 다른 날짜에 파일을 추가하려면 같은 방식으로 이름을 붙인 폴더를 만드십시오. 공유 폴더에 있는 그 밖의 항목은 무시됩니다.

:::tip 참고

‘집회 미디어’처럼 이 용도로만 사용할 새 폴더를 만들고, 집회가 시작되기 전에 파일이 준비되어 있도록 클라우드 저장소 앱에서 이 폴더를 항상 이 컴퓨터에 유지하도록 설정하십시오(보통 ‘오프라인 사용 가능’이라고 합니다).

:::

#### 공유 폴더에서 미디어 추가 {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

공유 폴더에 넣은 파일을 해당 집회에 자동으로 추가합니다.

**기본값**: `false`

#### 공유 폴더 {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

미디어를 추가할 폴더입니다. 초기 설정 마법사에서도 이 폴더를 설정할 수 있습니다.

**기본값**: 비어 있음

#### 지난 집회 폴더 삭제 {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

한 주가 지나면 공유 폴더를 깔끔하게 유지하기 위해 그 주의 날짜별 폴더와 그 안의 파일을 삭제합니다. 공유된 폴더이므로 이 폴더를 사용하는 다른 모든 사람에게서도 삭제됩니다. 폴더를 보관하려면 이 설정을 끄십시오.

**기본값**: `true`

## 집회 타이머 {#meeting-timer}

### 집회 타이머 활성화 {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

집회 파트의 시간을 측정하는 별도의 타이머 창을 활성화합니다. 베타 기능이므로 현지에서 사용 승인을 받은 경우에만 활성화해야 합니다.

**기본값**: `false`

### 타이머 창 동작 {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

타이머 창을 자동으로 열지, 참여자 타이머를 기본적으로 카운트업할지 카운트다운할지, 시계에 12시간제와 24시간제 중 무엇을 사용할지, 작업 아일랜드의 타이머 버튼에 현재 타이머 값을 표시할지를 설정합니다.

### 타이머 빠른 접근 {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

메인 창에서 타이머에 접근하는 방법을 선택합니다.

- **타이머 버튼에 마우스를 올리면 빠른 제어 표시**: 작업 아일랜드의 타이머 버튼에 마우스를 올리면 전체 타이머 팝업을 열지 않아도 시간을 측정 중인 파트와 함께 ‘시작’, ‘일시 정지’, ‘중지’, ‘다음 파트’ 버튼이 표시됩니다. 기본적으로 켜져 있습니다.
- **메인 창에 타이머 패널 표시**: 전체 집회 파트 목록과 타이머 제어를 메인 창 오른쪽에 고정된 패널에 항상 보이도록 표시합니다. 창 및 디스플레이 설정에 필요한 전체 팝업은 작업 아일랜드에서 계속 사용할 수 있습니다.

### 원격 타이머 {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemoteFocusLayout`, `timerRemotePort` -->

이 기능을 켜면 M³가 연단에 있는 태블릿이나 휴대폰에서 볼 수 있도록 타이머 화면을 읽기 전용 웹 페이지로 로컬 네트워크에 제공합니다. 연사는 남은 시간을 볼 수 있지만, 이 시간은 회중이 보는 화면이나 Zoom 공유 화면에는 표시되지 않습니다. 이 페이지는 집회 시작 전 카운트다운, 시계, 시간 초과 색상, 손 들기 알림을 포함하여 타이머를 실시간으로 따라가며, 모든 제어는 그대로 M³에서 합니다.

With **Focus layout for the timer remote** on, the page shows the time in a large progress ring instead: teal while there's time to spare, yellow in the last minute, then red with the amount of overtime (`+02:18`). The Zoom participants whose hand is raised are listed beside it, in the order they raised them, with the first four by name and a count of the rest, and each new hand flashes a "Hand raised" banner for a few seconds while the hands stay listed. The default display remains the plain large time.

While the page is open, it keeps the device's screen awake, so a tablet at the lectern doesn't lock or dim mid-part. Where the browser doesn't allow that on the page's plain-HTTP address, it plays a silent video to hold the screen on instead.

기기에서 열 주소는 복사 버튼과 함께 타이머 팝업에 표시됩니다. 다른 프로그램이 이미 포트를 사용하고 있는 경우에만 포트를 변경하십시오. 이 기능이 켜져 있는 동안에는 같은 네트워크에 있는 누구나 이 페이지를 열 수 있지만, 페이지에는 타이머만 표시됩니다.

**기본값**: `false`, 포트 `8787`

### 타이머 표시 형식 {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

현재 시간과 카운트다운 타이머의 표시 형식을 아날로그와 디지털 중에서 선택합니다. 카운트다운 경고 표시를 사용하면 마지막 1분 동안 아날로그 카운트다운 링이 점차 경고 색상으로 바뀝니다.

**시간 원호가 표시되는 아날로그 시계** 카운트다운 형식은 파트의 남은 시간을 아날로그 시계 문자판 위에 분침부터 예정 종료 시점까지 부채꼴로 표시하므로, 현재 시각과 남은 시간을 한눈에 확인할 수 있습니다. 초과 시간은 시간 초과 색상의 두 번째 부채꼴로 표시됩니다. 이 형식은 집회 시작 전 카운트다운에도 적용되며 카운트업 모드에서도 작동합니다.

### 집회 시작 카운트다운 및 진행 상태 {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

예정된 집회 전에 카운트다운을 표시하고, 필요에 따라 집회가 예정보다 빠르게 또는 늦게 진행되고 있는지 표시합니다. 집회 시작 카운트다운은 타이머 화면에만 표시되며 기본 미디어 화면에는 표시되지 않습니다.

### 타이머 모양 및 시간 초과 {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

타이머의 글자 크기와 색상을 사용자 지정하고, 다른 색상, 깜박임, 카운트업 모드에서 초과 시간만 표시하기 등 시간 초과 표시 방식을 설정합니다.

## 연동 기능 {#integrations}

이 카테고리에는 Dropbox, OneDrive, iCloud Drive 또는 Google Drive에서 미디어를 추가하는 [공유 폴더](#settings-guide-folder-monitoring) 설정도 있습니다.

### Zoom 연동 {#settings-guide-zoom-integration}

#### Zoom 활성화 {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Zoom 회의 연동 기능을 활성화합니다.

**기본값**: `false`

#### 화면 공유 단축키 {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Zoom 화면 공유를 실행하는 키보드 단축키입니다.

**기본값**: 없음

#### 미디어 창 자동 포커스 {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Zoom 화면 공유가 시작된 후 미디어 창에 자동으로 포커스를 맞춥니다. 보통은 필요하지 않지만, 화면 공유가 시작된 후 미디어 창의 포커스가 자주 사라지는 일부 시스템에서는 도움이 될 수 있습니다.

**기본값**: `false`

### Zoom 회의 관리자 {#zoom-meeting-manager}

Zoom 회의 관리자(베타, Windows 전용)는 매 집회 전후에 Zoom 데스크톱 앱을 대신 조작합니다. 이 기능을 켤 때 제공되는 설정 도우미가 각 자동화 기능을 단계별로 안내합니다.

#### M³가 Zoom을 조작하는 동안 {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom에는 제대로 된 자동화 인터페이스가 없으므로 M³는 Zoom의 접근성 인터페이스를 통해 Zoom 앱을 조작합니다. 이 방식은 Zoom이 도구 모음을 숨긴 상태에서도 마우스를 움직이지 않고 작동합니다. 그래도 M³가 Zoom의 버튼을 누르면 Zoom이 잠시 자기 창을 앞으로 가져오며, 마우스는 Zoom이 다른 모든 방법에 반응하지 않을 때에만 최후의 수단으로 움직입니다. M³는 Zoom을 조작할 때마다 진행 중인 작업을 알려 주는 ‘M³이 Zoom을 실행 중입니다’ 알림으로 자체 창을 덮고, **이 자동화 취소** 버튼을 함께 표시합니다. 설정 도우미의 확인 과정과 자체 테스트 중에도 같은 알림이 표시됩니다. 자동화가 실행되는 동안에만 활성화되는 전역 키보드 단축키(기본값 `Ctrl+Alt+Escape`)를 사용하면 Zoom에 포커스가 있을 때도 어디서든 자동화를 취소할 수 있습니다. 취소하면 M³가 즉시 중지되며, Zoom이 작업 도중의 상태로 남을 수 있으므로 Zoom을 확인하십시오.

**기본값**: `Ctrl+Alt+Escape`

#### 손 들기 도우미 {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert` -->

집회 중에 M³가 Zoom의 참여자 목록에서 손을 든 참여자가 있는지 확인합니다. 누군가 손을 들면 M³에 알림이 표시되어 클릭 한 번으로 해당 참여자의 **음소거를 해제**할 수 있고, 말을 마치면 다시 클릭 한 번으로 **다시 음소거하고 손을 내릴** 수 있습니다. 작업 아일랜드의 Zoom 버튼에도 손을 든 참여자가 같은 버튼과 함께 표시됩니다. 모든 작업은 정확한 이름을 기준으로 Zoom에서 해당 참여자의 행에만 적용되며, 같은 이름을 가진 참여자가 두 명이면 M³는 두 사람 모두 건드리지 않습니다.

[집회 타이머](#meeting-timer)가 활성화되어 있으면 사회자를 위해 타이머 화면에도 참여자의 이름과 함께 큰 손 모양이 표시되며, 타이머 팝업과 Zoom 팝업의 **손 들기 알림** 버튼으로 직접 표시할 수도 있습니다. 이 기능에는 타이머 화면이 필요하지만, 알림과 버튼은 타이머 화면 없이도 작동합니다.

Zoom은 사용하는 언어로 손 든 참여자를 표시하므로 M³가 먼저 그 표시 방식을 학습해야 합니다. Zoom에서 회의를 연 상태로 **Zoom의 손 들기 표시 방식 학습**을 클릭하십시오. M³가 사용자의 손을 들고, Zoom이 참여자 목록에서 이를 어떻게 표시하는지와 어떤 메뉴 항목으로 손을 내리는지 읽은 다음, 다시 손을 내립니다. 설정 도우미에서도 이 단계를 진행할 수 있습니다.

**기본값**: `false`

#### 창 배치 {#zoom-meeting-manager-window-layout}

<!-- **Setting**: `zoomMeetingManagerWindowLayout` -->

M³는 Zoom 회의 창과 자체 기본 창을 화면의 원하는 위치에 배치할 수 있습니다. 설정 도우미에서 두 단계에 걸쳐 위치를 묻습니다. 여기 있는 **배치 선택** 버튼으로 언제든지 이 단계를 다시 열 수 있습니다.

1. 실제 배치대로 표시된 화면 지도에서 Zoom 회의를 표시할 화면을 선택합니다. 미디어 창이 차지하는 화면은 선택할 수 없습니다. Zoom 화면이 M³가 있는 화면이 아니면, Zoom이 그 화면을 단독으로 사용할지 M³와 함께 사용할지 선택합니다(함께 사용하면 M³도 그 화면으로 옮겨집니다).
2. 실제 비율로 그려진 그 화면에서 구분선을 끌어 M³와 Zoom이 화면을 나누어 쓰도록 조정합니다. 구분선은 자주 쓰는 비율(2분의 1, 3분의 1, 4분의 1 등)에 맞춰집니다. 자유롭게 끌려면 `Alt` 키를 누른 채로 끕니다. 구분선은 어떤 창도 최소 크기보다 작아지지 않게 합니다. 참가자 목록이 열려 있으면 Zoom에 더 많은 공간이 필요합니다. 세로 방향 화면에서는 두 창이 위아래로 배치됩니다.

회의가 열리면 M³는 요청한 경우 Zoom 참가자 목록을 연 다음 두 창을 제자리에 배치합니다. 그 후로 M³는 Zoom을 제자리에 유지합니다. 화면 공유 후나 참가자 목록이 열리거나 닫힐 때 Zoom이 저절로 창을 옮기거나 크기를 바꾸면 M³가 제자리로 되돌립니다. Zoom을 직접 옮기거나 크기를 바꾸면 M³는 다음 집회 때까지 둔 자리에 그대로 둡니다. M³가 Zoom을 스스로 옮길 때마다 알림이 표시되며, 방해가 될 경우를 위해 버튼 두 개가 함께 표시됩니다. **Zoom 그대로 두기**를 누르면 M³를 다시 시작할 때까지 중지되고, **끄기**를 누르면 여기에서 다시 켤 때까지 창 배치가 꺼집니다. 화면을 연결하거나 분리하면 M³가 창을 다시 정렬합니다. Zoom 화면이 더 이상 없으면 Zoom이 M³의 화면을 함께 사용하고 M³가 이를 알려 줍니다.

Zoom은 미디어 창을 공유하는 동안 참가자 목록을 포함한 자체 회의 창을 숨깁니다. **공유 중에 참가자 목록 표시**가 켜져 있으면 M³가 Zoom 자리에 Zoom 참가자 목록을 별도의 창으로 열어 주므로, 해설하려고 손을 든 사람을 계속 볼 수 있습니다. 목록을 닫으면 다음 공유 때까지 닫힌 상태로 유지됩니다. 공유가 끝나면 Zoom이 목록을 스스로 닫고 회의 창이 제자리로 돌아옵니다.

Zoom의 **Meeting window view** 설정이 **Dual window**로 되어 있으면(이전 버전의 Zoom에서는 **Use dual monitors**) Zoom이 두 번째 창(공유 화면이나 발표자 표시)을 엽니다. M³는 그 창을 미디어 창이 있는 화면에 미디어 창 뒤로 전체 화면으로 표시합니다. 미디어 창을 숨기면 그 창이 보이므로, 예를 들어 참가자를 확인할 수 있습니다.

**Windows 창 맞춤으로 정렬**이 켜져 있으면 M³가 Windows 자체의 창 맞춤 기능으로 두 창을 나란히 맞춥니다. 화면 가장자리로 끌어다 놓은 것처럼 맞춰지므로, 두 창 사이의 경계를 끌면 두 창의 크기가 함께 바뀝니다. 이를 위해 M³가 각 창을 잠시 앞으로 가져옵니다.

Zoom 팝업의 **창 정렬** 버튼을 누르면 언제든지 모든 창을 제자리로 되돌릴 수 있습니다. 창 배치는 컴퓨터의 화면에 따라 달라지므로 컴퓨터별로 저장됩니다.

**기본값**: 꺼짐

### OBS Studio 연동 {#settings-guide-obs-integration}

#### OBS 활성화 {#enable-obs}

<!-- **Setting**: `obsEnable` -->

자동 장면 전환을 위해 OBS Studio 연동 기능을 활성화합니다.

**기본값**: `false`

:::warning 중요한 참고 사항

**오디오 설정 필요**: OBS Studio 연동 기능은 화면 공유만 처리합니다. OBS Studio를 사용할 때 M³ 미디어의 오디오는 Zoom 참여자에게 **자동으로 전송되지 않습니다**. 집회 참석자가 미디어 소리를 들을 수 있도록 Zoom의 원본 오디오 설정을 구성하거나 ‘컴퓨터 소리 공유’를 사용해야 합니다. 자세한 오디오 설정 방법은 [사용자 가이드](/user-guide#audio-configuration)를 참조하십시오.

**참고**: Zoom 연동 기능은 Zoom의 기본 화면 공유를 사용하므로 OBS Studio 연동 기능보다 오디오를 더 매끄럽게 처리합니다.

:::

#### OBS 포트 {#obs-port}

<!-- **Setting**: `obsPort` -->

OBS Studio WebSocket에 연결할 포트 번호입니다.

**기본값**: 없음

#### OBS 비밀번호 {#obs-password}

<!-- **Setting**: `obsPassword` -->

OBS Studio WebSocket 연결 비밀번호입니다.

**기본값**: 없음

#### OBS 장면 {#obs-scenes}

용도별로 사용할 OBS 장면을 설정합니다.

- **카메라 장면**: 카메라/연단을 보여 주는 장면
- **미디어 장면**: 미디어를 표시하는 장면
- **이미지 장면**: 이미지를 표시하는 장면(예: 미디어와 연사를 함께 보여 주는 PIP 장면)

#### 고급 OBS 옵션 {#obs-advanced-options}

- **이미지를 자동으로 공유하지 않음**: 직접 공유할 때까지 OBS로 이미지를 공유하지 않습니다.
- **빠른 전환**: OBS 연동을 빠르게 켜고 끌 수 있는 토글을 활성화합니다.
- **미디어 재생 후 장면 전환**: 미디어 재생이 끝나면 이전 장면으로 자동으로 돌아갑니다.
- **이전 장면 기억**: 이전 장면을 기억했다가 다시 전환합니다.
- **아이콘 숨기기**: 인터페이스에서 OBS 관련 아이콘을 숨깁니다.
- **녹화 제어**: M³에서 OBS 녹화를 시작하고 중지하는 컨트롤을 표시합니다.

:::warning 중요한 참고 사항

**오디오 설정 필요**: OBS Studio 연동 기능은 동영상/장면 전환만 처리합니다. M³ 미디어 오디오는 Zoom 또는 OBS로 **자동 전송되지 않습니다**. 비디오 스트림은 웹캠처럼 소리 없는 가상 카메라로 동작합니다. 집회 참석자가 미디어 소리를 들을 수 있도록 Zoom의 원본 오디오 설정을 구성하거나 ‘컴퓨터 소리 공유’를 사용해야 합니다. 자세한 오디오 설정 방법은 [사용자 가이드](/user-guide#audio-configuration)를 참조하십시오.

**대안**: 대신 Zoom 연동 기능을 사용하는 것을 고려해 보십시오. Zoom 연동 기능은 Zoom의 기본 화면 공유를 사용하므로 오디오를 더 매끄럽게 처리합니다.

:::

### 사용자 지정 이벤트 {#custom-events}

#### 사용자 지정 이벤트 활성화 {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

특정 이벤트(예: 미디어 재생, 일시 정지, 중지)가 감지되면 실행되는 사용자 지정 단축키를 활성화합니다.

**기본값**: `false`

#### 사용자 지정 이벤트 단축키 {#custom-event-shortcuts}

##### 미디어 재생 단축키 {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

미디어가 재생될 때 실행되는 단축키입니다.

**기본값**: 없음

##### 미디어 일시 정지 단축키 {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

미디어가 일시 정지될 때 실행되는 단축키입니다.

**기본값**: 없음

##### 미디어 중지 단축키 {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

미디어가 중지될 때 실행되는 단축키입니다.

**기본값**: 없음

##### 마지막 노래 단축키 {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

집회 중 마지막 노래가 재생될 때 실행되는 단축키입니다.

**기본값**: 없음

### 집회 녹화 {#meeting-recordings}

#### 외부 녹화 앱 연동 활성화 {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

M³가 키보드 단축키로 별도의 녹화 애플리케이션을 제어하도록 합니다. M³ 자체에서 녹화하는 것이 아니라, 집회 녹화 팝업에서 **녹화 시작** 또는 **녹화 중지**를 누르면 설정한 단축키를 보냅니다.

OBS 녹화 컨트롤이 활성화되어 있으면 이 옵션은 표시되지 않습니다. OBS Studio를 사용한다면 대신 OBS 연동 기능의 OBS 녹화 컨트롤을 사용하십시오.

**기본값**: `false`

#### 녹화 단축키 및 폴더 {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

녹화를 시작하는 키보드 단축키, 녹화를 중지하는 단축키(선택 사항), 외부 앱에서 녹화 파일을 저장하는 폴더를 설정합니다. 중지 단축키를 지정하지 않으면 M³가 시작 단축키를 다시 사용합니다. 폴더를 지정하면 M³에 해당 폴더를 여는 버튼이 표시됩니다.

## 인터페이스 및 단축키 {#interface-shortcuts}

### 키보드 단축키 {#settings-guide-keyboard-shortcuts}

#### 키보드 단축키 활성화 {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

미디어 제어용 사용자 지정 키보드 단축키를 활성화합니다.

**기본값**: `false`

#### 미디어 제어 단축키 {#media-control-shortcuts}

미디어 재생에 사용할 단축키를 설정합니다.

- **미디어 창**: 미디어 창을 열거나 닫습니다.
- **이전 미디어**: 이전 미디어 항목으로 이동합니다.
- **다음 미디어**: 다음 미디어 항목으로 이동합니다.
- **일시 정지/재개**: 미디어 재생을 일시 정지하거나 다시 시작합니다.
- **미디어 중지**: 미디어 재생을 중지합니다.
- **음악 켜기/끄기**: 배경 음악을 켜거나 끕니다.

### 미디어 더 추가 버튼 {#add-more-media-button}

#### ‘미디어 더 추가’ 버튼을 표시할 섹션 {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

항상 모든 섹션에서 사용할 수 있는 상단 도구 모음의 ‘미디어 추가’ 버튼 외에, 직접 미디어를 추가하는 버튼을 따로 표시할 집회 섹션을 선택합니다.

**기본값**: 공개 강연, 그리스도인 생활, 순회 감독자 방문 및 사용자 지정 섹션

#### 미디어 추가 버튼 간소화 모드 {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

섹션 헤더의 ‘미디어 더 추가’/‘노래 추가’ 버튼을 아이콘으로만 표시합니다. 비활성화하면 공간이 충분할 때 아이콘과 함께 텍스트도 표시됩니다.

**기본값**: `true`

### 미디어 드래그 핸들 {#media-drag-handle}

#### 드래그 핸들 표시 {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

각 미디어 항목에 순서를 바꿀 때 끌어서 사용하는 작은 핸들을 표시합니다. 미디어 항목은 어느 곳을 드래그해도 항상 순서를 바꿀 수 있으며, 이 설정은 핸들 아이콘의 표시 여부에만 영향을 줍니다.

**기본값**: `true`

### 집회 전후 빠른 작업 {#before-after-meeting-quick-actions}

#### 집회 빠른 작업 표시 {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

유용한 제어 기능(배경 음악, 녹화)과 사용자 지정할 수 있는 체크리스트가 각각 포함된 집회 전 패널과 집회 후 패널을 표시합니다.

**기본값**: `true`

집회 전 패널과 집회 후 패널의 체크리스트 카테고리와 작업은 모두 이 설정 섹션에서 관리합니다. 회중에 필요한 대로 카테고리와 작업을 추가하거나, 이름을 바꾸거나, 순서를 변경하거나, 삭제할 수 있습니다.

## 고급 {#advanced-settings}

### 프로필 설정 옮기기 {#profile-settings-transfer}

현재 프로필의 설정을 JSON 파일로 내보내거나, 이전에 내보낸 프로필 설정 파일을 가져옵니다. 프로필을 가져오면 현재 프로필의 설정이 가져온 설정으로 대체됩니다.

### 조작 주의 {#danger-zone}

:::warning 경고

이 설정은 변경했을 때의 영향을 이해하는 경우에만 변경해야 합니다.

:::

#### 기본 URL {#base-url}

<!-- **Setting**: `baseUrl` -->

출판물과 미디어를 다운로드할 때 사용하는 기본 도메인입니다.

**기본값**: `jw.org`

#### 하드웨어 가속 비활성화 {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

M³를 다시 시작한 후 하드웨어 가속을 비활성화합니다. 일부 시스템에서 발생하는 그래픽 문제나 강제 종료를 해결하는 데 도움이 될 수 있지만, 그 외의 경우에는 권장되지 않습니다.

**기본값**: `false`

#### 하드웨어 가속 알림 표시 안 함 {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

하드웨어 가속을 직접 비활성화한 후 다시 활성화하라는 알림을 표시하지 않습니다.

**기본값**: `false`

#### 미디어 가져오기 비활성화 {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

미디어 자동 다운로드를 완전히 비활성화합니다. 특별 행사나 기타 사용자 지정 구성에 사용할 프로필에만 이 설정을 사용하십시오.

**기본값**: `false`

## 최적의 구성을 위한 팁 {#configuration-tips}

### 신규 사용자 {#new-users}

1. 초기 설정 마법사로 기본 설정을 구성하는 것부터 시작합니다.
2. 미디어 표시 기능을 사용하려면 ‘미디어 재생 활성화’를 켭니다.
3. 집회 일정을 정확하게 설정합니다.
4. 혼합형 집회를 진행한다면 OBS 연동을 설정합니다.

### 고급 사용자 {#advanced-users}

1. 공유 폴더를 사용하여 Dropbox나 OneDrive 같은 클라우드 저장소에서 미디어를 추가합니다.
2. 백업을 위해 미디어 자동 내보내기를 활성화합니다.
3. 효율적으로 작업할 수 있도록 키보드 단축키를 설정합니다.
4. 자동 화면 공유를 위해 Zoom 연동을 설정합니다.

### 성능 최적화 {#performance-optimization}

1. 성능을 높이기 위해 노래책 동영상을 미리 저장합니다.
2. 필요에 맞는 적절한 최대 해상도를 사용합니다.
3. 디스크 공간을 관리하기 위해 자동 캐시 정리를 설정합니다.
4. 대역폭이 제한된 경우 데이터 사용 제한 설정을 고려합니다.

### 문제 해결 {#settings-guide-troubleshooting}

- 미디어가 다운로드되지 않으면 집회 일정 설정을 확인합니다.
- OBS 연동이 작동하지 않으면 포트 및 비밀번호 설정을 확인합니다.
- 성능이 느리면 추가 캐시를 활성화하거나 해상도를 낮춰 봅니다.
- 언어 관련 문제가 있으면 인터페이스 언어와 미디어 언어 설정을 모두 확인합니다.
- Zoom 참여자가 미디어 소리를 들을 수 없으면 Zoom의 원본 오디오 설정을 구성하거나 ‘컴퓨터 소리 공유’를 사용합니다.
- **참고**: 오디오를 더 간단하게 처리하려면 OBS Studio 대신 Zoom 연동 기능을 사용하는 것을 고려해 보십시오.

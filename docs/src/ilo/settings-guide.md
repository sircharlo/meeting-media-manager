# Giya kadagiti Setting {#settings-guide}

Ilawlawag daytoy a naan-anay a giya ti amin a setting nga adda iti M³, a naurnos a sigun iti kategoria. No maawatam dagitoy a setting, matulongannaka a mangi-set up iti M³ tapno naan-anay a maitutop iti kasapulan ti kongregasionmo.

## Sapasap {#application-configuration}

### Lengguahe ti App {#display-language}

<!-- **Setting**: `localAppLang` -->

Piliem ti lengguahe ti interface ti M³. Naisalumina daytoy iti lengguahe nga us-usaren iti panangi-download iti media.

**Dagiti opsion**: Amin a lengguahe ti interface nga adda (Ingles, Espaniol, Pranses, ken dadduma pay)

**Default**: Ingles

### Nasipnget nga Itsura {#dark-mode}

<!-- **Setting**: `darkMode` -->

Pilien no ania ti itsura ti M³.

**Dagiti opsion**:

- Automatiko nga agbaliw sigun iti setting ti sistema
- Kanayon nga usaren ti nasipnget nga itsura
- Kanayon nga usaren ti nalawag nga itsura

**Default**: Automatiko

### Umuna nga Aldaw ti Lawas {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Ikeddeng no ania nga aldaw ti maibilang nga umuna nga aldaw ti lawas kadagiti field ti petsa iti Dagiti Setting, kas iti petsa ti panagbisita ti manangaywan iti sirkito. Kanayon nga ipakita ti kalendario iti ngato ti window dagiti lawas manipud Lunes agingga iti Domingo, kas kadagiti lawas ti gimong.

**Dagiti opsion**: Domingo agingga iti Sabado

**Default**: Lunes

### Pormat ti Petsa {#date-format}

<!-- **Setting**: `localDateFormat` -->

Ti pormat a maus-usar iti panangipakita kadagiti petsa iti app.

**Ehemplo**: D MMMM YYYY

**Default**: D MMMM YYYY

### Automatiko a Panangrugi no Ag-login {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Automatiko nga irugi ti M³ no agrugi ti kompiuter.

**Default**: `false`

## Dagiti Gimong ti Kongregasion {#congregation-meetings}

### Nagan ti Kongregasion {#congregation-name}

<!-- **Setting**: `congregationName` -->

Ti nagan ti kongregasionmo. Maus-usar daytoy para iti panangurnos ken panangipakita.

**Default**: Blanko (masapul a maikabil bayat ti setup)

### Lengguahe ti Gimong {#meeting-language}

<!-- **Setting**: `lang` -->

Ti kangrunaan a lengguahe para iti panangi-download iti media. Rumbeng a daytoy ti lengguahe a maus-usar kadagiti gimong ti kongregasionmo.

**Dagiti opsion**: Amin a lengguahe nga adda iti opisial a website dagiti Saksi ni Jehova

**Default**: Ingles (E)

### Maikadua a Lengguahe {#fallback-language}

<!-- **Setting**: `langFallback` -->

Maikadua a lengguahe a mausar no awan ti media iti kangrunaan a lengguahe.

**Dagiti opsion**: Amin a lengguahe nga adda iti opisial a website dagiti Saksi ni Jehova

**Default**: Awan

### Aldaw ti Gimong iti Tengnga ti Lawas {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

Ti aldaw a pangangayan ti gimong iti tengnga ti lawas ti kongregasionmo.

**Dagiti opsion**: Domingo agingga iti Sabado

**Default**: Awan (masapul a maikabil bayat ti setup)

### Oras ti Gimong iti Tengnga ti Lawas {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

Ti oras a pangrugian ti gimong iti tengnga ti lawas ti kongregasionmo.

**Pormat**: HH:MM (pormat a 24 nga oras)

**Default**: Awan (masapul a maikabil bayat ti setup)

### Aldaw ti Gimong iti Ngudo ti Lawas {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

Ti aldaw a pangangayan ti gimong iti ngudo ti lawas ti kongregasionmo.

**Dagiti opsion**: Domingo agingga iti Sabado

**Default**: Awan (masapul a maikabil bayat ti setup)

### Oras ti Gimong iti Ngudo ti Lawas {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

Ti oras a pangrugian ti gimong iti ngudo ti lawas ti kongregasionmo.

**Pormat**: HH:MM (pormat a 24 nga oras)

**Default**: Awan (masapul a maikabil bayat ti setup)

### Lawas ti Manangaywan iti Sirkito {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

Ti lawas ti sumaruno a panagbisita ti manangaywan iti sirkito.

**Pormat**: MM/DD/YYYY

**Default**: Awan

### Petsa ti Memorial {#memorial-date}

<!-- **Setting**: `memorialDate` -->

Ti petsa ti sumaruno a Memorial.

**Pormat**: MM/DD/YYYY

**Default**: Automatiko a maal-ala iti regular a panawen

### Dagiti Panagbaliw ti Eskediul ti Gimong {#meeting-schedule-changes}

Babaen kadagitoy a setting, mabalinmo nga ikabil dagiti temporario a panagbaliw iti eskediul dagiti gimong:

- **Petsa ti panagbaliw ti eskediul**: No kaano nga agepekto ti panagbaliw
- **Maminsan laeng a panagbaliw**: No permanente wenno temporario daytoy a panagbaliw
- **Baro nga aldaw ti gimong iti tengnga ti lawas**: Baro nga aldaw para iti gimong iti tengnga ti lawas
- **Baro nga oras ti gimong iti tengnga ti lawas**: Baro nga oras para iti gimong iti tengnga ti lawas
- **Baro nga aldaw ti gimong iti ngudo ti lawas**: Baro nga aldaw para iti gimong iti ngudo ti lawas
- **Baro nga oras ti gimong iti ngudo ti lawas**: Baro nga oras para iti gimong iti ngudo ti lawas

### Automatiko a Panangi-update iti Eskediul ti Gimong {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

No naka-enable, regular a sukimaten ti M³ ti opisial a website dagiti Saksi ni Jehova no adda panagbaliw iti aldaw ken oras ti gimong, sa automatiko nga i-update ti agdama a profile.

Agandar laeng daytoy kadagiti profile a nainayon babaen ti panagbirok iti kongregasion ken saan pay a nasukatan a manual ti nagan ti kongregasionda. No na-disable ti panag-sync gapu ta nasukatan ti nagan ti kongregasion, usarem ti **I-enable ti panag-sync ti eskediul** tapno maikonektar manen ti profile.

#### I-enable ti Panag-sync ti Eskediul {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Ikonektarna manen ti agdama a profile iti panagbirok iti kongregasion tapno maituloy manen ti automatiko a panangi-update iti aldaw ken oras ti gimong. Agparang laeng daytoy no manual a nasukatan ti nagan ti kongregasion, ta dayta ti mangputed iti koneksion.

#### I-refresh ti Eskediul ti Gimong {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Manual nga i-sync ti agdama ken masakbayan nga eskediul ti gimong iti impormasion manipud iti opisial a website.

### Tulong iti Panangi-set Up iti Zoom para kadagiti Participant manipud iti Adayo {#zoom-display-setup-help}

<!-- **Setting**: `zoomDisplaySetupHelp` -->

Ti asinoman nga agar-aramid iti paset babaen ti Zoom ket makita iti TV babaen ti window ti Zoom, a kadawyan a nailemmeng iti likudan ti iskrin ti media: ilemmengmo ti iskrin ti media tapno maipakita dayta. Sakbay ti tunggal gimong, damagen ti M³ no adda paset iti dayta nga aldaw nga aramiden ti asinoman nga adda iti Zoom (sakbay ti gimong iti ngudo ti lawas, no adda iti Zoom ti agpalawag). No wen, tulongannaka a mangisagana iti window ti Zoom iti TV: ilemmengna iti apagbiit ti iskrin ti media tapno masukimatmo nga adda iti TV ti window ti Zoom ken punnuenna ti intero nga iskrin, ibagana no kasano a pagbalinen dayta a full screen no saan (i-double-click ti tengnga ti window ti Zoom), ipakitana manen ti iskrin ti media iti rabaw ti window ti Zoom, itudona dagiti button a mangilemmeng ken mangipakita iti iskrin ti media no oras ti panangipakita iti window ti Zoom, sa ibagana kenka no nakasagana aminen.

No naka-set iti **Dual window** ti **Meeting window view** ti Zoom, ipakita ti Zoom dagiti participant iti maikadua a window a mabalin nga agtalinaed iti TV. No naka-on ti [Zoom Meeting Manager](#zoom-meeting-manager), iyakar met ti M³ dayta a window iti TV ken pagbalinenna a full screen para kenka.

Maminsan laeng nga agdamag ti M³ iti tunggal gimong, manipud iti nasurok bassit a maysa nga oras sakbay a mangrugi dayta agingga iti panagrugina, ken bayat laeng a punnuen ti iskrin ti media ti bukodna nga iskrin. Tapno i-off ti saludsod, piliem ti **Dinak damagen manen**, sa ti **I-off**.

**Default**: `true`

## Media ken Panangi-play {#media-retrieval-and-playback}

### Limitado a Koneksion iti Data {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

I-enable daytoy no limitado ti koneksionmo iti data tapno bumassit ti maus-usar a bandwidth.

**Default**: `false`

### Iskrin ti Media {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

I-enable ti feature ti iskrin ti media. Masapul daytoy tapno maipakita ti media iti maikadua nga iskrin.

**Default**: `false`

#### I-enable ti Preview ti Media {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Ipakita ti live a preview ti window ti media bayat a maipakpakita ti ladawan wenno video.

**Default**: `true`

#### Irugi ti Panangi-play a Naka-pause {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Irugi dagiti video a naka-pause no mangrugi ti panangi-play.

**Default**: `false`

### Background Music {#settings-guide-background-music}

#### I-enable ti Musika {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

I-enable ti feature ti background music.

**Default**: `true`

#### Automatiko a Panangrugi iti Musika {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Automatiko nga irugi ti background music no agrugi ti M³, no maitutop.

**Default**: `true`

#### Panagsardeng Sakbay ti Gimong {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

No mano a segundo sakbay ti oras a pangrugian ti gimong nga agsardeng ti background music.

**Sakup**: 0-300 a segundo

**Default**: 60 a segundo

#### Kapigsa ti Uni ti Musika {#music-volume}

<!-- **Setting**: `musicVolume` -->

Kapigsa ti uni ti background music (1-100%).

**Default**: 100%

### Dagiti Opsion iti Panangi-play ken Panangi-download {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### I-enable ti In-inut a Panagparang ken Panaglemmeng ti Window ti Media {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

I-enable ti in-inut a panagparang ken panaglemmeng (fade-in/out) no ipakita wenno ilemmeng ti window ti media.

**Default**: `true`

#### I-enable ti Panangkontrol iti Kapartak ti Panangi-play {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Ipalubos a mabaliwan ti kapartak ti panangi-play iti audio ken video manipud iti context menu ti media.

**Default**: `false`

#### Ilemmeng ti Logo iti Media {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Ilemmeng ti logo iti window ti media.

**Default**: `false`

#### Kangatuan a Resolution {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Kangatuan a resolution dagiti nai-download a file ti media.

**Dagiti Opsion**: 240p, 360p, 480p, 720p, 1080p

**Default**: 720p

#### Iraman ti Nayimprenta a Media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Iraman ti media manipud kadagiti nayimprenta a publikasion iti panangi-download iti media.

**Default**: `true`

#### Saan nga Iraman Dagiti Footnote {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

No mabalin, saan nga iraman iti panangi-download iti media dagiti ladawan manipud kadagiti footnote.

**Default**: `false`

#### Saan nga Iraman Dagiti Kanayonan a Video iti Panagadal iti Pagwanawanan {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Saan nga iraman dagiti kanayonan a video a nadakamat kadagiti parapo ti Panagadal iti Pagwanawanan.

**Default**: `false`

#### Saan nga Iraman Dagiti Video iti Panagadal ti Kongregasion iti Biblia {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Piliem dagiti publikasion a saan a maipakita dagiti video a nadakamat kadagitoy bayat ti Panagadal ti Kongregasion iti Biblia. Birokem babaen ti titulo wenno simbolo ti publikasion.

**Default**: Situtured a Makipagna iti Dios (`wcg`)

#### Saan nga iraman ti media manipud iti broshur a Mangisuro {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Saan nga iraman iti panangi-download iti media dagiti media manipud iti broshur a Mangisuro (th).

**Default**: `true`

### Dagiti Subtitle {#subtitles}

#### I-enable Dagiti Subtitle {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

I-enable ti panangipakita kadagiti subtitle bayat ti panangi-play iti media.

**Default**: `false`

#### Lengguahe Dagiti Subtitle {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Lengguahe dagiti subtitle (mabalin a naiduma iti lengguahe ti media).

**Dagiti opsion**: Amin a lengguahe nga adda iti opisial a website dagiti Saksi ni Jehova

**Default**: Awan

### Panangaywan iti Cache {#cache-management}

#### I-cache Dagiti Video ti Pagkantaan {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

I-cache amin a video ti pagkantaan sakbay pay a kasapulan dagitoy, tapno nasaysayaat ti panagandar. Laglagipem a dumakkel ti cache ti media gapu iti daytoy.

**Default**: `false`

#### Folder ti Cache {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Custom nga ayan a pagidulinan kadagiti nai-cache a file ti media.

**Default**: Default nga ayan ti sistema

#### I-enable ti Automatiko a Panangi-clear iti Cache {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Automatiko nga i-clear dagiti daan a nai-cache a file tapno masalimetmetan ti espasio iti disk.

**Default**: `true`

### Dagiti Kanta iti Pinyin {#pinyin-song-titles}

#### Ipangruna Dagiti Kanta iti Pinyin {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

No adda masarakan a pinyin a bersion ti kanta ti gimong iti folder dagiti kanta iti pinyin, dayta ti usaren a kasukat ti kadawyan a kanta.

**Default**: `false`

#### Folder Dagiti Kanta iti Pinyin {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Folder a naglaon kadagiti video ti kanta iti pinyin (kas pagarigan, `sjjm_s-Pi_CHS_066_r720P.mp4`). No adda masarakan a pinyin a file a maitunos iti numero ti kanta ti gimong, dayta ti mai-play a kasukat ti kadawyan a kanta.

**Default**: Blanko

### Panangi-export iti Media {#settings-guide-media-export}

#### I-enable ti Automatiko a Panangi-export iti Media {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Automatiko nga i-export dagiti file ti media iti maysa a naituding a folder.

**Default**: `false`

#### Folder ti Panangi-export iti Media {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Ti path ti folder a pakai-export-an dagiti file ti media iti automatiko a wagas.

**Default**: Blanko

#### I-convert Dagiti File iti MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

I-convert dagiti nai-export a file ti media iti MP4 a pormat tapno ad-adda a mausar kadagiti nadumaduma a device.

**Default**: `false`

### Nai-share a Folder (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

Adda dagitoy a setting iti kategoria a **Dagiti Integration**.

Makainayon ti M³ iti media kadagiti gimongmo manipud iti folder a pagtalinaeden a naka-sync ti maysa nga app ti cloud storage, kas iti Dropbox, OneDrive, iCloud Drive wenno Google Drive. Makatulong daytoy no dagiti dadduma ti mangisagana iti media para kadagiti pasetda sada i-share kenka, wenno no maus-usar ti M³ iti nasurok a maysa a kompiuter. Mabalin met ti folder iti daytoy a kompiuter wenno iti network-mo.

Agaramid ti M³ iti folder iti uneg ti nai-share a folder para iti tunggal sumaruno a gimong, a ti naganna ket ti petsa ti gimong a naisurat kas tawen-bulan-aldaw (kas pagarigan, `2026-03-25`). Ikabil dagiti ladawan, video, audio file wenno playlist ti JW Library iti folder ti maysa a gimong, ket automatiko a mainayon dagitoy iti listaan ti media dayta a gimong. Tapno agnayon iti file para iti sabali nga aldaw, agaramidka iti folder para iti dayta, a nanaganan iti isu met laeng a wagas. Baybay-an ti M³ ti aniaman a sabali nga adda iti nai-share a folder.

:::tip Singasing

Agaramid iti baro a folder a para laeng iti daytoy, kas iti "Media ti gimong", ken iti app-mo ti cloud storage, i-set-mo a kanayon nga adda dayta iti daytoy a kompiuter (masansan a maawagan iti "available offline"), tapno nakasagana dagiti file sakbay a mangrugi ti gimong.

:::

#### Inayon ti Media Manipud iti Nai-share a Folder {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Automatiko nga inayon dagiti file a naikabil iti nai-share a folder iti husto a gimong.

**Default**: `false`

#### Nai-share a Folder {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

Ti folder a pagalaan ti media a mainayon. Ti setup wizard ket mangidiaya nga i-set up dayta para kenka.

**Default**: Blanko

#### I-delete Dagiti Folder Dagiti Napalabas a Gimong {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

No malpas ti maysa a lawas, i-delete dagiti folder dayta a lawas a naaddaan iti petsa, agraman dagiti file nga adda kadagitoy, tapno naurnos latta ti nai-share a folder. Yantangay nai-share ti folder, mai-delete met dagitoy para kadagiti amin a dadduma nga agus-usar iti dayta. I-off daytoy no kayatmo a taginayonen dagitoy.

**Default**: `true`

## Timer ti Gimong {#meeting-timer}

### I-enable ti Timer ti Gimong {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

I-enable ti naisina a window ti timer tapno matiempuan dagiti paset ti gimong. Beta a feature daytoy, isu nga i-enable laeng no naaprobaran iti lokal a kongregasion.

**Default**: `false`

### Panagandar ti Window ti Timer {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

I-set up no automatiko a malukatan ti window ti timer, no agbilang a pangato wenno pababa iti default dagiti timer dagiti paset, no 12 nga oras wenno 24 nga oras ti usaren ti relo, ken no maipakita ti agdama nga oras ti timer iti button ti timer iti isla dagiti aksion.

### Napartak a Panangusar iti Timer {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Piliem no kasano a maaramat ti timer manipud iti kangrunaan a window:

- **Napartak a kontrol no i-hover ti button ti timer**: no i-hover-mo ti button ti timer iti isla dagiti aksion, maipakita ti paset a matiempuan, agraman dagiti button nga Irugi, I-pause, Isardeng ken Sumaruno a paset, a saan a malukatan ti intero a popup ti timer. Naka-on iti default.
- **Ipakita ti panel ti timer iti kangrunaan a window**: ipakitana ti intero a listaan dagiti paset ti gimong ken dagiti kontrol ti timer iti maysa a panel a naikabit iti kannawan a sikigan ti kangrunaan a window, a kanayon a makita. Mabalin pay laeng a luktan ti intero a popup manipud iti isla dagiti aksion para kadagiti setting ti window ken iskrin.

### Orasan a naisina ti balakad {#timer-separate-counsel}

<!-- **Setting**: `timerSeparateCounsel` -->

Orasan kas naisina a paset ti maysa a minuto a balakad kalpasan ti Panagbasa iti Biblia ken ti tunggal paset iti Agbalin a Mas Epektibo iti Ministerio. Maipakita dayta iti baba ti paset a sarunuenna, ket ti **Sumaruno a paset** ket mapan manipud iti paset ti estudiante agingga iti balakad, sa iti sumaruno a paset. Iti kasta, makita ti tserman no mano pay ti nabati iti minuto, bayat a mairekord pay laeng ti bukod nga oras ti estudiante para iti report ti oras, a sadiay addaan ti balakad iti bukodna a linia.

Maysa a minuto latta ti balakad. Agpada latta ti eskediul ti gimong, dagiti naplano nga oras ti panangrugi, ken ti pagilasinan no nasapa wenno naladaw ti gimong, kas no naka-off daytoy a setting.

**Default**: `false`

### Remote ti Timer {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemoteFocusLayout`, `timerRemotePort` -->

No naka-on, mangipaay ti M³ iti kopia ti iskrin ti timer a mabuya laeng (read-only) kas web page iti lokal a network-mo, para iti tablet wenno telepono iti pulpito: makita ti ispiker ti nabati nga oras a saan a maipakita iti iskrin ti kongregasion wenno iti mai-share iti Zoom. Ti panid ket agsurot iti timer iti mismo nga oras, agraman ti countdown sakbay ti gimong, ti relo, dagiti kolor ti panaglabes iti oras ken ti pakaammo babaen ti ima, ket adda latta iti M³ amin a kontrol.

No naka-on ti **Focus layout para iti remote ti timer**, ipakita ti panid ti oras iti dakkel a progress ring: teal bayat nga adda pay nabati nga oras, duyaw iti naudi a minuto, sa nalabaga a kadua ti kaadu ti sobra nga oras (`+02:18`). Nakalista iti abayna dagiti participant iti Zoom a nakangato ti imada, iti urnos ti panangingatoda, a ti umuna nga uppat ket babaen ti nagan ken adda bilang dagiti dadduma, ket iti tunggal baro nga ima, agkimat iti sumagmamano a segundo ti banner a "Nakangato ti ima" bayat nga agtalinaed a nakalista dagiti ima. Agtalinaed a default a display ti dakkel nga oras laeng.

Bayat a nakalukat ti panid, pagtalinaedenna a naka-on ti iskrin ti device, tapno saan nga ag-lock wenno ag-dim ti tablet iti pulpito iti tengnga ti paset. No saan nga ipalubos dayta ti browser iti plain-HTTP nga address ti panid, mangi-play ketdi iti video nga awan unina tapno agtalinaed a naka-on ti iskrin.

Nailista iti popup ti timer dagiti address a luktan iti device, agraman ti button a pangkopia. Sukatam laeng ti port no us-usaren daytoy ti sabali a programa. Laglagipem a mabalin a luktan ti siasinoman iti isu met laeng a network ti panid bayat a naka-on daytoy; ti timer laeng ti ipakitana.

Nailista met dagiti address iti Settings, iti baba ti port ti remote ti timer. No aglukat ti panid iti daytoy a kompiuter ngem saan iti tablet, nalabit a bloblokean dayta ti Windows Firewall. Maminsan laeng nga agsaludsod ti Windows no mabalin nga umawat ti M³ iti koneksion, ket no naiwaksi dayta a saludsod, wenno impalubos laeng ti M³ kadagiti pribado a network bayat a publiko ti network ti kompiuter, agtultuloy a bloblokeanna dayta nga awan ti panagsaludsodna manen. Iti Windows, ballaagan ti M³ dayta iti baba dagiti address, ket ti **Ipalubos iti Windows Firewall** ti mangpalabas iti panid kalpasan ti panagdawat ti Windows iti pammalubos ti maysa nga administrator. Ipalubos dayta ti bersion ti Microsoft Store inton maikabil dayta.

**Default**: `false`, port `8787`

### Dagiti Pormat ti Pannakaipakita ti Timer {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Piliem ti analog wenno digital a pormat ti pannakaipakita ti agdama nga oras ken dagiti countdown a timer. Ti pagilasinan a pakdaar iti countdown ket mabalinna nga in-inut a sukatan ti kolor ti analog a bilog ti countdown iti kolor ti pakdaar bayat ti maudi a minuto.

Ti pormat ti countdown nga **Analog a relo nga addaan iti arko ti oras** ket ipakitana ti nabati nga oras ti maysa a paset kas maysa a nakolor a piraso iti rupa ti analog a relo, manipud iti tudo ti minuto agingga iti naplano a panaggibus, tapno iti maysa a kita, makitam ti agdama nga oras ken no mano ti nabati. Ti limbes iti oras ket agparang kas maikadua a nakolor a piraso iti kolor ti panaglabes iti oras. Agaplikar met daytoy iti countdown sakbay ti gimong ken agandar met iti mode nga agbilang a pangato.

### Countdown ti Gimong ken Kasasaad ti Eskediul {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Ipakita ti countdown sakbay dagiti naiskediul a gimong, ken no kayatmo, ipakita no nasapa wenno naladaw ti gimong iti eskediulna. Iti iskrin laeng ti timer nga agparang ti countdown ti gimong, saan nga iti kangrunaan nga iskrin ti media.

### Itsura ti Timer ken Panaglabes iti Oras {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

I-customize ti kadakkel ken kolor ti teksto ti timer, ken i-set up dagiti pagilasinan no lumbes iti oras, kas iti sabali a kolor, panagkiremkirem, ken ti panangipakita laeng no mano ti limbes iti oras iti mode nga agbilang a pangato.

## Dagiti Integration {#integrations}

Adda met iti daytoy a kategoria dagiti setting ti [nai-share a folder](#settings-guide-folder-monitoring), para iti panangnayon iti media manipud iti Dropbox, OneDrive, iCloud Drive wenno Google Drive.

### Integration ti Zoom {#settings-guide-zoom-integration}

#### I-enable ti Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

I-enable dagiti feature ti integration ti Zoom para kadagiti gimong.

**Default**: `false`

#### Shortcut ti Panangi-share iti Iskrin {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Keyboard shortcut a pangipaandar iti panangi-share iti iskrin iti Zoom.

**Default**: Awan

#### Automatiko nga I-focus ti Window ti Media {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Automatiko nga i-focus ti window ti media kalpasan a mangrugi ti panangi-share iti iskrin iti Zoom. Kadawyan a saan a masapul daytoy, ngem mabalin a makatulong iti dadduma a kompiuter no masansan a mapukaw ti focus ti window ti media kalpasan a mangrugi ti panangi-share iti iskrin.

**Default**: `false`

### Zoom Meeting Manager {#zoom-meeting-manager}

Ti Zoom Meeting Manager (beta, para laeng iti Windows) ket kontrolenna para kenka ti desktop app ti Zoom sakbay, bayat, ken kalpasan ti tunggal gimong. Ti setup assistant-na, a maidiaya kenka no i-on-mo daytoy, ti mangigiya kenka iti tunggal automation.

#### Bayat a Kontkontrolen ti M³ ti Zoom {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Awan ti umiso nga automation interface ti Zoom, isu a kontrolen ti M³ ti app ti Zoom babaen ti accessibility interface-na, nga agandar uray saan nga agkuti ti mouse, uray no ilemmeng ti Zoom ti toolbar-na. Iparang latta ti Zoom ti window-na iti sangoanan iti apagbiit no ipindot ti M³ dagiti button-na, ken agkuti laeng ti mouse kas maudi a pamuspusan, no saan nga ikaskaso ti Zoom ti amin a sabali a wagas. Tunggal kontrolen ti M³ ti Zoom, kalubanna ti bukodna a window iti pakaammo a "Kontkontrolen ti M³ ti Zoom" a mangibaga no ania ti mapaspasamak, a kadua ti button a **I-cancel daytoy nga automation**. Agparang met ti isu met laeng a pakaammo bayat ti panangsukimat ti setup assistant ken bayat ti self-test. Ti global a keyboard shortcut (default `Ctrl+Alt+Escape`), nga aktibo laeng bayat nga agandar ti automation, ti mang-cancel iti dayta uray sadino ti ayanmo, uray no adda iti Zoom ti focus. No i-cancel-mo, dagus nga agsardeng ti M³; mabalin a nagkagudua ti naaramid iti Zoom, isu a sukimatem dayta.

**Default**: `Ctrl+Alt+Escape`

#### Katulongan iti Nakangato nga Ima {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert` -->

Bayat ti gimong, bambantayan ti M³ ti listaan dagiti participant iti Zoom tapno makita no adda nakangato nga ima. No adda mangingato iti imana, ti pakaammo iti M³ ket mangipalubos kenka nga **i-unmute** dayta a participant iti maysa a click, ken no nalpasen nga agsao, mabalinmo nga **i-mute manen ken ibaba ti imana** iti maysa pay a click. Ipakita ti button ti Zoom iti isla dagiti aksion ti listaan dagiti nakangato nga ima, a kadua dagiti isu met laeng a button. Tunggal aksion ket maaramid iti bukod a linia dayta a participant iti Zoom, babaen ti eksakto a naganna; no dua a participant ti agpada ti naganda, saan a galawen ti M³ ti uray maysa kadakuada.

No naka-enable ti [timer ti gimong](#meeting-timer), agparang met ti dakkel nga ima a kadua ti nagan ti participant iti iskrin ti timer para iti tserman, ket ti button a **Pakaammo babaen ti ima** kadagiti popup ti timer ken ti Zoom ti mangipakita iti dayta no kayatmo. Masapul daytoy a paset ti iskrin ti timer; agandar dagiti pakaammo ken button uray awan dayta.

Markaan ti Zoom dagiti nakangato nga ima iti bukodna a lengguahe, isu a masapul nga umuna nga adalen ti M³ no kasano: bayat a nakalukat ti gimongmo iti Zoom, i-click-mo ti **Adalen no kasano a markaan ti Zoom dagiti nakangato nga ima**. Ingato ti M³ ti bukodmo nga ima, basaenna no kasano a markaan ti Zoom dayta iti listaan dagiti participant ken no ania nga opsion iti menu ti mangibaba iti dayta, sa ibabana manen. Adda met daytoy nga addang iti setup assistant.

**Default**: `false`

#### Layout Dagiti Window {#zoom-meeting-manager-window-layout}

<!-- **Setting**: `zoomMeetingManagerWindowLayout` -->

Mabalin nga ikabil ti M³ ti window ti gimong iti Zoom, ken ti bukodna a kangrunaan a window, iti ayan a kayatmo kadagiti iskrinmo. Saludsoden ti setup assistant no sadino iti dua nga addang, a mabalinmo a luktan manen iti aniaman nga oras babaen ti button a **Pilien ti layout** ditoy:

1. Iti mapa dagiti iskrinmo a kas iti pannakaurnosda, piliem ti iskrin para iti gimong iti Zoom. Saan a pulos a maipili ti iskrin a punpunnuen ti window ti media. No saan nga isu ti iskrin ti Zoom ti ayan ti M³, piliem no ti Zoom laeng ti agusar iti dayta wenno bingayenna dayta iti M³ (sa umakar met sadiay ti M³).
2. Iti drowing dayta nga iskrin iti pudno a langana, i-drag-mo ti divider tapno bingayen dayta iti nagbaetan ti M³ ken ti Zoom. Agsardeng dayta kadagiti kadawyan a proporsion (kagudua, kakatlo, kakapat, ken dadduma pay); iteggedmo ti `Alt` tapno siwayawaya nga i-drag dayta. Saan a pulos a pabassiten ti divider ti maysa a window iti nababbaba ngem ti kabassitan a kadakkelna: ad-adu ti espasio a kasapulan ti Zoom no nakalukat ti listaan dagiti participant-na. Iti portrait nga iskrin, maikabil ti dua a window a ti maysa ket adda iti ngato ti sabali.

Apaman a maluktan ti gimong, luktan ti M³ ti listaan dagiti participant iti Zoom no kiniddawmo, sa ikabilna ti dua a window iti lugarda. Manipud idin, pagtalinaedenna ti Zoom iti lugarna: no iyakar wenno sukatan ti Zoom ti kadakkel ti window-na iti bukodna, kalpasan ti panangi-share iti iskrin wenno no maluktan wenno maiserra ti listaan dagiti participant-na, isubli dayta ti M³. No sika ti mangiyakar wenno mangsukat iti kadakkel ti Zoom, baybay-an ti M³ dayta iti nangikabilam agingga iti sumaruno a gimong. Tunggal iyakar ti M³ ti Zoom iti bukodna, adda pakaammo a mangibaga iti dayta, a kadua ti dua a button no makariribuk dayta: ti **Baybay-an ti Zoom** ket mangisardeng iti dayta agingga nga ag-restart ti M³, ken ti **I-off** ket i-off-na ti layout dagiti window agingga nga i-on-mo manen dayta ditoy. No adda iskrin a maikonektar wenno maikkat, urnosen manen ti M³ dagiti window; no awanen ti iskrin ti Zoom, makibingay ti Zoom iti iskrin ti M³ ket ibaga dayta ti M³ kenka.

Bayat nga i-share ti Zoom ti window ti media, ilemmengna ti bukodna a window ti gimong, agraman ti listaan dagiti participant. No naka-on ti **Ipakita ti listaan dagiti participant bayat ti panangi-share**, luktan ngarud ti M³ ti listaan dagiti participant iti Zoom iti bukodna a window, iti lugar ti Zoom, tapno makitam latta no asino ti mangingato iti ima tapno agkomento. No iserram dayta, agtalinaed a nakaserra agingga iti sumaruno a panangi-share; iserra ti Zoom dayta iti bukodna no agsardeng ti panangi-share, ket agsubli iti lugarna ti window ti gimong iti Zoom.

No ti **Meeting window view** ti Zoom ket naka-set iti **Dual window** (**Use dual monitors** kadagiti daan a bersion ti Zoom), aglukat ti Zoom iti maikadua a window (a mangipakita iti nai-share nga iskrin wenno iti ispiker). Ikabil ti M³ dayta a full screen iti iskrin ti window ti media, iti likud ti window ti media: ilemmengmo ti window ti media tapno maipakita dayta, kas pagarigan tapno makita dagiti participant.

No naka-on ti **I-snap dagitoy babaen ti Windows**, i-snap ti M³ ti dua a window nga agsibay babaen ti bukod a panag-snap ti Windows, a kasla in-drag-mo ida iti igid ti iskrin, isu nga no i-drag ti beddeng iti nagbaetanda, agbaliw ti kadakkel ti dua. Tapno maaramid dayta, iparang ti M³ ti tunggal window iti sangoanan iti apagbiit.

Ti button a **Urnosen dagiti window** iti popup ti Zoom ket isublina amin iti lugarda iti aniaman nga oras. Maidulin ti layout dagiti window para iti tunggal kompiuter, yantangay agpannuray dayta kadagiti iskrin ti kompiuter.

**Default**: naka-off

### Integration ti OBS Studio {#settings-guide-obs-integration}

#### I-enable ti OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

I-enable ti integration ti OBS Studio para iti automatiko a panagsukat ti scene.

**Default**: `false`

:::warning Napateg a Palagip

**Masapul nga I-set up ti Audio**: Ti integration ti OBS Studio ket para laeng iti panangi-share iti iskrin. Ti audio ti media ti M³ ket **saan nga automatiko a maipatulod** kadagiti participant iti Zoom no OBS Studio ti us-usarem. Masapul nga i-set up-mo dagiti setting ti Original Audio iti Zoom wenno usarem ti "Share Computer Sound" tapno masigurado a mangngeg ti media dagiti participant iti gimong. Kitaem ti [Giya ti Agar-aramat](/user-guide#audio-configuration) para kadagiti detalyado nga instruksion iti panangi-set up iti audio.

**Palagip**: Ti integration ti Zoom ket usarenna ti bukod a panangi-share iti iskrin ti Zoom, a nasaysayaat ti panangtamingna iti audio ngem ti integration ti OBS Studio.

:::

#### Port ti OBS {#obs-port}

<!-- **Setting**: `obsPort` -->

Ti numero ti port para iti panagkonektar iti WebSocket ti OBS Studio.

**Default**: Awan

#### Password ti OBS {#obs-password}

<!-- **Setting**: `obsPassword` -->

Ti password para iti koneksion iti WebSocket ti OBS Studio.

**Default**: Awan

#### Dagiti Scene ti OBS {#obs-scenes}

Ikeddeng no ania dagiti scene ti OBS a mausar para iti nadumaduma a panggep:

- **Scene ti kamera**: Scene a mangipakita iti kamera/pulpito
- **Scene ti media**: Scene a pangipakitaan iti media
- **Scene ti ladawan**: Scene a pangipakitaan kadagiti ladawan (kas pagarigan, PIP a scene a mangipakita iti media ken iti ispiker)

#### Advanced nga Opsion ti OBS {#obs-advanced-options}

- **Saan nga automatiko nga i-share dagiti ladawan**: Itantan ti panangi-share kadagiti ladawan iti OBS agingga nga i-share-mo ida
- **Napartak a panangi-on/off**: I-enable ti napartak a panangi-on wenno panangi-off iti integration ti OBS
- **Sukatan ti scene kalpasan ti media**: Automatiko nga agsubli iti dati a scene kalpasan ti media
- **Laglagipen ti dati a scene**: Laglagipen ken isubli ti dati a scene
- **Ilemmeng dagiti icon**: Ilemmeng dagiti icon a maipapan iti OBS iti interface
- **Dagiti Kontrol ti Panangi-record**: Ipakita dagiti kontrol a mangirugi ken mangisardeng iti panangi-record ti OBS manipud iti M³

:::warning Napateg a Palagip

**Masapul nga I-set up ti Audio**: Ti integration ti OBS Studio ket para laeng iti video ken iti panagsukat ti scene. Ti audio ti media ti M³ ket **saan nga automatiko a maipatulod** iti Zoom wenno OBS. Ti video stream ket kasla maysa a virtual a kamera nga awan ti uni, kas iti webcam. Masapul nga i-set up-mo dagiti setting ti Original Audio iti Zoom wenno usarem ti "Share Computer Sound" tapno masigurado a mangngeg ti media dagiti participant iti gimong. Kitaem ti [Giya ti Agar-aramat](/user-guide#audio-configuration) para kadagiti detalyado nga instruksion iti panangi-set up iti audio.

**Sabali a Pagpilian**: Panunotem nga usaren ketdi ti integration ti Zoom, ta usarenna ti bukod a panangi-share iti iskrin ti Zoom, a nasaysayaat ti panangtamingna iti audio.

:::

### Dagiti Custom nga Event {#custom-events}

#### I-enable Dagiti Custom nga Event {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

I-enable dagiti custom a shortcut a maipaandar no adda madlaw a partikular nga event (kas pagarigan, no mai-play, mai-pause, wenno maisardeng ti media).

**Default**: `false`

#### Dagiti Shortcut ti Custom nga Event {#custom-event-shortcuts}

##### Shortcut no Mai-play ti Media {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Shortcut a maipaandar no mai-play ti media.

**Default**: Awan

##### Shortcut no Mai-pause ti Media {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Shortcut a maipaandar no mai-pause ti media.

**Default**: Awan

##### Shortcut no Maisardeng ti Media {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Shortcut a maipaandar no maisardeng ti media.

**Default**: Awan

##### Shortcut ti Maudi a Kanta {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Shortcut a maipaandar kalpasan a mai-play ti maudi a kanta iti gimong.

**Default**: Awan

### Dagiti Recording ti Gimong {#meeting-recordings}

#### I-enable ti Integration ti External nga App a Pang-record {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Ipalubos a kontrolen ti M³ ti sabali nga app a pang-record babaen kadagiti keyboard shortcut. Saan a mangi-record daytoy iti uneg ti M³; itulodna dagiti na-set up a shortcut no ipindotmo ti **Irugi ti Panangi-record** wenno **Isardeng ti Panangi-record** iti popup dagiti recording ti gimong.

Nailemmeng daytoy nga opsion no naka-enable dagiti kontrol ti panangi-record ti OBS. No OBS Studio ti us-usarem, usarem ketdi dagiti kontrol ti panangi-record ti OBS iti integration ti OBS.

**Default**: `false`

#### Dagiti Shortcut ken Folder ti Panangi-record {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

I-set up ti keyboard shortcut a mangirugi iti panangi-record, ti opsional a shortcut a mangisardeng iti panangi-record, ken ti folder a pangi-save-an ti external nga app kadagiti recording. No awan ti naisaad a shortcut a pangisardeng, usaren manen ti M³ ti shortcut a pangirugi. No adda naisaad a folder, mangipakita ti M³ iti button a panglukat iti dayta.

## Interface ken Dagiti Shortcut {#interface-shortcuts}

### Dagiti Keyboard Shortcut {#settings-guide-keyboard-shortcuts}

#### I-enable Dagiti Keyboard Shortcut {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

I-enable dagiti keyboard shortcut a mabalin a baliwan para iti panangkontrol iti media.

**Default**: `false`

#### Dagiti Shortcut a Pangkontrol iti Media {#media-control-shortcuts}

I-set up dagiti shortcut para iti panangi-play iti media:

- **Window ti media**: Luktan/iserra ti window ti media
- **Napalabas a media**: Mapan iti napalabas a media
- **Sumaruno a media**: Mapan iti sumaruno a media
- **I-pause/ituloy**: I-pause wenno ituloy ti panangi-play iti media
- **Isardeng ti media**: Isardeng ti panangi-play iti media
- **Irugi/isardeng ti musika**: Irugi wenno isardeng ti background music

### Button a Pangnayon iti Media {#add-more-media-button}

#### Dagiti Seksion nga Addaan iti Button a Pangnayon iti Media {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Piliem no ania kadagiti seksion ti gimong ti addaan iti bukodda a button a pangnayon iti bukodmo a media, malaksid iti button a "Inayon ti media" iti toolbar iti ngato, nga agandar a kanayon iti tunggal seksion.

**Default**: Palawag Publiko, Panagbiag kas Kristiano, Panagbisita ti Manangaywan iti Sirkito, ken dagiti custom a seksion

#### Compact a Button a Pangnayon iti Media {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

Icon laeng ti ipakita para iti button a "Inayon pay ti media"/"Inayon ti kanta" kadagiti header ti seksion. No naka-disable, mangipakita met ti button iti teksto iti abay ti icon no umanay ti espasio.

**Default**: `true`

### Handle a Pang-drag iti Media {#media-drag-handle}

#### Ipakita ti Handle a Pang-drag {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Ipakita ti bassit a handle iti tunggal media a mausar iti panangi-drag tapno mabaliwan ti urnos. Kanayon a mabaliwan ti urnos dagiti media babaen ti panangi-drag iti aniaman a paset dagitoy; daytoy laeng ti mangikeddeng no maipakita ti icon ti handle.

**Default**: `true`

### Napartak nga Aksion Sakbay/Kalpasan ti Gimong {#before-after-meeting-quick-actions}

#### Ipakita Dagiti Napartak nga Aksion ti Gimong {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Ipakita ti panel sakbay ti gimong ken ti panel kalpasan ti gimong nga addaan kadagiti makatulong a kontrol (background music, panangi-record) ken checklist a mabalin nga i-customize para iti tunggal maysa.

**Default**: `true`

Dagiti kategoria ken aramiden iti checklist para iti panel sakbay ken kalpasan ti gimong ket maurnos iti daytoy met laeng a seksion ti setting: mabalinmo ti agnayon, agsukat iti nagan, agbaliw iti urnos, wenno ag-delete kadagiti kategoria ken aramiden a kas kasapulan ti kongregasionmo.

## Advanced {#advanced-settings}

### Panangiyalis kadagiti Setting ti Profile {#profile-settings-transfer}

I-export dagiti setting ti agdama a profile iti JSON a file, wenno i-import ti file ti setting ti profile a nai-export idi. No mangi-importka, masukatan dagiti setting ti agdama a profile.

### Napeggad a Paset {#danger-zone}

:::warning Pakdaar

Sukatam laeng dagitoy a setting no maawatam ti mabalin nga ibunga dagitoy.

:::

#### Address ti Website {#base-url}

<!-- **Setting**: `baseUrl` -->

Ti kangrunaan a domain a mausar iti panangi-download kadagiti publikasion ken media.

**Default**: `jw.org`

#### I-disable ti Hardware Acceleration {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

I-disable ti hardware acceleration kalpasan ti panangi-restart iti M³. Mabalin a makatulong daytoy no adda problema iti graphics wenno ag-crash ti app iti dadduma a kompiuter, ngem no saan, saan a mairekomenda daytoy.

**Default**: `false`

#### Ilemmeng ti Palagip Maipapan iti Hardware Acceleration {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Ilemmeng ti palagip nga i-enable manen ti hardware acceleration kalpasan a manual a na-disable dayta.

**Default**: `false`

#### I-disable ti Panangala iti Media {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Naan-anay nga i-disable ti automatiko a panangi-download iti media. Usarem laeng daytoy kadagiti profile a mausar para kadagiti espesial a pasamak wenno sabali pay a custom a setup.

**Default**: `false`

## Dagiti Singasing para iti Kasayaatan a Setup {#configuration-tips}

### Para kadagiti Baro nga Agar-aramat {#new-users}

1. Rugiam babaen ti setup wizard tapno i-set up dagiti batayan a setting
2. I-on ti "I-enable ti panangi-play iti media" tapno mausarmo dagiti feature ti panangipakita
3. Siguraduem nga umiso ti eskediul dagiti gimongmo
4. I-set up ti integration ti OBS no adda hybrid a gimong iti kongregasionmo

### Para kadagiti Advanced nga Agar-aramat {#advanced-users}

1. Usaren ti nai-share a folder tapno makainayon iti media manipud iti cloud storage, kas iti Dropbox wenno OneDrive
2. I-enable ti automatiko a panangi-export iti media tapno adda backup-mo
3. I-set up dagiti keyboard shortcut tapno napardas ken nalaka ti panangkontrolmo
4. I-set up ti integration ti Zoom para iti automatiko a panangi-share iti iskrin

### Panangpasayaat iti Panagandar {#performance-optimization}

1. I-cache dagiti video ti pagkantaan tapno nasaysayaat ti panagandar
2. Usarem ti kangatuan a resolution a maitutop iti kasapulam
3. I-set up ti automatiko a panangi-clear iti cache tapno maaywanan ti espasio iti disk
4. Panunotem nga i-on ti setting a limitado a koneksion iti data no limitado ti bandwidth-mo

### Panangrisut kadagiti Problema {#settings-guide-troubleshooting}

- No saan a mai-download ti media, sukimatem dagiti setting ti eskediul ti gimong
- No saan nga agandar ti integration ti OBS, sukimatem dagiti setting ti port ken password
- No nabuntog ti panagandar, padasem nga i-enable ti kanayonan a cache wenno ibaba ti resolution
- No adda problemam iti lengguahe, sukimatem dagiti setting ti lengguahe ti app ken ti lengguahe ti media
- No saan a mangngeg dagiti participant iti Zoom ti audio ti media, i-set up-mo dagiti setting ti Original Audio iti Zoom wenno usarem ti "Share Computer Sound"
- **Singasing**: Panunotem nga usaren ti integration ti Zoom imbes nga OBS Studio tapno nalaklaka ti panangtaming iti audio

---
tag: Использование
title: Режим презентации медиа
ref: present-media
---

### Использование режима презентации медиа

Режимы презентации и управления мультимедиа разработаны с целью простого использования и предотвращения ошибок во время встреч.

После того как опция `Воспроизводить медиафайлы на внешнем экране или в отдельном окне` включена, экран презентации мультимедиа будет автоматически отображаться на внешнем мониторе если таковой имеется, или в отдельном окне с возможностью перетаскивать и изменять размер, если внешний монитор не был обнаружен.

В режиме ожидания на экране презентации мультимедиа будет отображаться фоновое изображение, выбранное в настройках. Если фоновое изображение не было настроено, то M³ попытается автоматически загрузить и отобразить годовой текст.

Если в настройках не установлено фоновое изображение и годовой текст не удалось загрузить автоматически, в режиме ожидания будет отображаться черный фон.

В режим презентации мультимедиа можно попасть, нажав кнопку ▶️ (воспроизведение) на главном экране M³ или с помощью сочетания клавиш <kbd>Alt D</kbd>.

Как только вы войдете в режим презентации, на экране выбора папок вы сможете выбрать дату, за которую вы хотите отобразить медиа. Если папка текущего дня существует, она автоматически будет выбрана. Можно изменить выбранную дату в любое время, нажав на кнопку выбора даты в верхнем разделе.

### Презентация мультимедиа

Чтобы воспроизвести мультимедиа, нажмите кнопку ▶️ (воспроизведение) для нужного файла. Чтобы скрыть медиа, нажмите кнопку ⏹️ (остановить). При желании видео можно перемотать назад или вперед, когда оно поставлено на паузу. Обратите внимание, что для видеороликов кнопку остановки необходимо нажать **дважды**, чтобы предотвратить случайную и преждевременную остановку видеоролика во время его воспроизведения перед собранием. Видео будет автоматически останавливаться после полного воспроизведения.

### Проведение гибридных встреч, используя M³, OBS Studio, и Zoom

Самым простым способом показать медиа во время гибридных встреч - это настроить OBS Studio, M³ и Zoom так, чтобы они функционировали вместе.

#### Начальная конфигурация: Компьютер Зала Царства

Установите разрешение экрана внешнего монитора на 1280x720.

Настройте выход звуковой карты компьютера на один из входов микшера звукового пульта, а объединенный выход микшера звукового пульта - на вход звуковой карты компьютера.

#### Начальная конфигурация: OBS Studio

Установите OBS Studio, или скачайте портативную версию.

Если используется портативная версия OBS Studio, установите плагин [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/), и установите виртуальную камеру в Windows с помощью прилагаемого скрипта установки.

Если у вас OBS Studio v27 или старше, вам необходимо установить плагин [obs-websocket](https://github.com/obsproject/obs-websocket). В противном случае obs-websocket уже включен. Настройте номер порта и пароль для obs-websocket.

In the OBS settings, under `General` > `System Tray`, enable all checkboxes. Under `Output` > `Streaming`, enable a hardware encoder if available. Under `Video` > `Base (Canvas) Resolution` and `Output (Scaled) Resolution`, choose `1280x720`, and under `Downscale Filter`, choose `Bilinear`.

Set up at least 2 scenes: one for the media display (`Window Capture` or `Display Capture` with the mouse cursor disabled and the appropriate window title/monitor selected), and one for the stage view (`Video Capture Device` with the KH camera selected). You may add as many scenes as required, with the camera adjusted, zoomed-in and cropped as needed (lectern view, conductor and reader view, table view, etc.).

Add a shortcut to OBS Studio, with the `--startvirtualcam` parameter, to the Startup folder of the Windows user profile, to ensure that OBS Studio gets started automatically when the user logs in.

#### Начальная конфигурация: Zoom Зала Царства

Zoom должен быть настроен таким образом, чтобы использовать два монитора. Включите глобальные сочетания клавиш для Zoom, чтобы выключить/включить звук Зала Царства в Zoom (<kbd>Alt A</kbd>) и запустить/остановить видеопоток Зала Царства в Zoom (<kbd>Alt V</kbd>).

Установите "микрофон" по умолчанию на объединенный выход микшера звукового пульта (чтобы все, что слышно через звуковую систему Зала Царства, передавалось через Zoom, включая микрофоны и мультимедиа), а "камеру" - на виртуальную камеру, предоставляемую OBS Studio.

#### Начальная конфигурация: M³

Включить опцию `Воспроизводить медиафайлы на внешнем экране или в отдельном окне`.

Включите и настройте режим совместимости с OBS Studio, используя данные порта и пароля, настроенные на этапе настройки OBS Studio.

#### Начало встречи

Запустите встречу Zoom и переместите вторичное окно встречи Zoom на внешний монитор. При желании сделайте его полноэкранным. Здесь будут отображаться все удаленные участники встречи, чтобы собрание могло их видеть.

После того как встреча Zoom отобразится на внешнем мониторе, откройте M³. Окно презентации мультимедиа автоматически откроется поверх окна Zoom на внешнем мониторе. Sync media if necessary, and enter media controller mode by clicking the ▶️ (play) button on the main screen of M³, or <kbd>Alt D</kbd>.

Enable the Kingdom Hall video feed (<kbd>Alt V</kbd>), and spotlight the Kingdom Hall video feed if necessary so that Zoom participants see the Kingdom Hall stage. Unmute the Kingdom Hall audio feed in Zoom (<kbd>Alt A</kbd>). It should not be necessary to disable the video or audio feed in Zoom for the duration of the meeting.

Start background music playback using the button on the bottom left, or <kbd>Alt K</kbd>.

#### Трансляция частей со сцены Зала Царства на Zoom

Никаких действий не требуется.

Various camera angles/zoom can be chosen during the meeting by using the menu on the bottom of the M³ media playback control window; this menu will contain a list of all configured camera view scenes in OBS.

#### Презентация мультимедиа в Зале Царства и через Zoom

Find the media you want to share in the M³ media playback control window, and press the "play" button.

When you're done sharing media, press the "stop" button in M³. Note that videos automatically stop upon completion.

#### Отображение удаленных участников Zoom на мониторе Зала Царства

Press the "hide/show media presentation window" button in the lower right corner of the M³ media controller screen, or <kbd>Alt Z</kbd>, to **hide** the media presentation window. The Zoom meeting will now be visible on the Kingdom Hall monitor.

> Если удаленному участнику нужно показать медиа, следуйте шагам в подразделе **Презентация мультимедиа в Зале Царства и через Zoom**.

Once the participant has finished their part, press the "hide/show media presentation window" button in the lower right corner of the M³ media playback control window, or <kbd>Alt Z</kbd>, to **show** the media presentation window. The Kingdom Hall monitor will now show the yeartext.

### Проведение гибридных встреч с помощью только M³ и Zoom, без OBS Studio

Если по каким-либо причинам вы не хотите использовать OBS Studio, следующие предложения, возможно, помогут вам настроить все как можно проще.

#### Без OBS Studio: Начальная конфигурация: Компьютер Зала Царства

То же, что и в соответствующем разделе выше. Кроме того, настройте глобальное сочетание клавиш в Zoom для запуска/остановки презентации экрана (<kbd>Alt S</kbd>). В качестве "камеры" будет использоваться поток с камеры Зала Царства.

#### Без OBS Studio: Начальная конфигурация: M³

Включить опцию `Воспроизводить медиафайлы на внешнем экране или в отдельном окне`.

#### Без OBS Studio: Начало встречи

То же, что и в соответствующем разделе выше.

#### Без OBS Studio: Трансляция частей со сцены Зала Царства на Zoom

То же, что и в соответствующем разделе выше.

#### Без OBS Studio: Презентация мультимедиа в Зале Царства и через Zoom

Start sharing in Zoom by hitting <kbd>Alt S</kbd>. In the Zoom sharing window that pops up, choose the external monitor and enable both checkboxes on the bottom left (for sound and video optimization). The yeartext will now be shared over Zoom.

Find the media you want to share in the M³ media playback control window, and press the "play" button.

When you're done sharing media, hit <kbd>Alt S</kbd> to end Zoom screen sharing.

#### Без OBS Studio: Отображение удаленных участников Zoom на мониторе Зала Царства

То же, что и в соответствующем разделе выше.

### Screenshots of Presentation Mode

{% include screenshots/present-media.html lang=site.data.ru %}

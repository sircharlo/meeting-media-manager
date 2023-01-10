---
tag: Справка
title: Технические примечания
ref: usage-notes
---

Приложение должно работать без проблем на большинстве современных компьютеров с операционными системами Виндовс, Linux или macOS.

### Виндовс: Установка и первый запуск

При открытии программы установки может быть обнаружена [ошибка](assets/img/other/win-smartscreen.png), указывающая на то, что Windows SmartScreen не запускал нераспознанное приложение. Это связано с тем, что приложение не имеет большого количества загрузок и, следовательно, не является полностью доверенным в Windows. Чтобы обойти эту проблему, просто нажмите на "Подробнее", затем "Выполнить все равно".

### Linux: Установка и первый запуск

Согласно официальной документации [AppImage](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), если приложение не открывается должным образом, подтвердите вывод следующей команды:

`sysctl kernel.unprivileged_userns_clone`

Если на выходе получается `0`, то AppImage **не запустится**, пока вы не выполните следующую команду и затем не перезагрузитесь:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Убедитесь, что вы прочитали о том, [что это подразумевает](https://lwn.net/Articles/673597/), прежде чем это сделать.

### macOS: Installation and first launch

If upon launching the app, you receive a warning that the app cannot be opened, either because "it was not downloaded from the App store" or because "the developer cannot be verified", then this [Apple support page](https://support.apple.com/en-ca/HT202491) will help you to get past that.

If you get a message indicating that you "do not have permission to open the application", then try some solutions from [this page](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Auto-update

Unlike Windows and Linux, auto-update functionality is **not** implemented on macOS, and for technical reasons probably never will be. However, one of two things will happen for macOS users when an update is available:

- M³ will attempt to download the update package and open it automatically, after which the user will have to manually complete the installation of the M³ update by dragging and dropping the updated app to their Applications folder. Then, they will be able to launch the newly updated M³ from their Applications folder as usual.
- If the previous step fails at any stage, M³ will display a persistent notification indicating that an update is available, with a link to the update itself. A red, pulsing notification will also be displayed on the settings button in the main screen of M³. The M³ version number in the settings screen will turn into a button that, once clicked, opens the latest release's download page automatically.

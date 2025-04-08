<!-- markdownlint-disable no-inline-html -->

# 왕국회관에서 M³ 사용하기 {#using-m3-at-a-kingdom-hall}

이 가이드는 왕국회관에서 **Meeting Media Manager (M³)** 를 다운로드 및 설치하고 설정하는 방법에 대해 안내합니다. 가이드에 따라 회중 집회에서 미디어를 원활하게 관리하기 위한 설정을 진행해보세요.

## 1. 다운로드 및 설치 {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. 사용하는 운영체제에 해당하는 버전을 다운로드하세요.
  - **윈도우:**
    - For most Windows systems, download <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a>.
    - For older 32-bit Windows systems, download <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a>.
    - For a portable version, download <a :href="data.winPortable">meeting-media-manager-[VERSION]-portable.exe</a>.
  - **macOS:**
    - **M-series (Apple Silicon)**: Download <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a>.
    - **Intel-based Macs**: Download <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a>.
  - **리눅스:**
    - Download <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a>.
2. 위 다운로드 링크가 동작하지 않는 경우 [M³ 다운로드 페이지](https://github.com/sircharlo/meeting-media-manager/releases/latest) 에 방문하여 직접 다운로드해주세요.
3. Open the installer and follow the on-screen instructions to install M³.
4. Launch M³.
5. Go through the configuration wizard.

### macOS only: Additional installation steps {#additional-steps-for-macos-users}

:::warning 경고

This section only applies to macOS users.

:::

Due to Apple's security measures, a few additional steps are required to run the installed M³ app on modern macOS systems.

Run the following two commands in Terminal, modifying the path to M³ as needed:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning 경고

As a macOS user, you will need to follow these steps every time you install or update M³.

:::

:::info Explanation

The first command _signs the application's code_. This is required to prevent M³ from being detected as a malicious application from an unknown developer.

The second command _removes the quarantine flag_ from the application. The quarantine flag is used to warn users about potentially malicious applications that have been downloaded from the internet.

:::

#### Alternative method {#alternative-method-for-macos-users}

If you are still unable to launch M³ after entering the two commands from the previous section, please try the following:

1. Open the macOS system **Privacy & Security** settings.
2. Find the entry for M³ and click the button to **Open Anyway**.
3. You will then be warned again, and given the advice to not "open this unless you are certain it is from a trustworthy source." Click **Open Anyway**.
4. Another warning will appear, where you’ll need to authenticate to launch the app.
5. M³ should now launch successfully.

If you still have issues after following all these steps, please [open an issue on GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). We will do our best to help.

### macOS only: Re-enabling website presentation after updates {#screen-sharing-issues}

:::warning 경고

This section only applies to macOS users.

:::

Some macOS users have reported that website presentation no longer works after installing updates to M³.

If the media window is black when presenting the website after updating M³, try the following steps:

1. Open the macOS system **Privacy & Security** settings.
2. Go to **Screen Recording**.
3. Select M³ in the list.
4. Click the `-` (minus) button to remove it.
5. Click the `+` (plus) button and select M³ from the Applications folder.
6. You may be prompted to relaunch M³ to apply the change.

After these steps, screen sharing should function as expected once again.

:::tip 참고

웹사이트 표시 기능을 사용하지 않을 경우, 이 작업은 진행하지 않아도 괜찮습니다. 하지만 웹사이트 표시 기능을 사용할 경우, 애플리케이션이 업데이트될 때마다 이 작업을 진행하는 것을 권장합니다.

:::

## 2. Configuration wizard {#configuration-wizard}

### App display language {#app-display-language}

When launching M³ for the first time, you will be prompted to choose your preferred **display language**. Choose the language you want M³ to use for its interface.

:::tip 참고

This is does not have to be the same language as the one in which M³ will download media. The language for media downloads is configured in a later step.

:::

### Profile type {#profile-type}

The next step is to choose a **profile type**. For a regular setup in a Kingdom Hall, choose **Regular**. This will configure many features that are commonly used for congregation meetings.

:::warning 경고

You should only choose **Other** if you are creating a profile for which no media should be automatically downloaded. Media will have to be manually imported for use in this profile. This type of profile is used mostly to use M³ during theocratic schools, assemblies, conventions and other special events.

The **Other** profile type is rarely used. **For normal use during congregation meetings, please choose _Regular_.**

:::

### Automatic congregation lookup {#automatic-congregation-lookup}

M³ can attempt to automatically find your congregation's meeting schedule, language, and formatted name.

To do so, use the **Congregation Lookup** button next to the congregation name field and enter at least part of the congregation's name and city.

Once the correct congregation is found and selected, M³ will prefill all available information, such as your congregation's **name**, **meeting language**, and **meeting days and times**.

:::info 참고

This lookup uses publicly available data from the official website of Jehovah's Witnesses.

:::

### Manual entry of congregation information {#manual-entry-of-congregation-information}

If the automated lookup did not find your congregation, you can of course manually enter the required information. The wizard will allow you to review and/or enter your congregation's **name**, **meeting language**, and **meeting days and times**.

### Caching videos from the songbook {#caching-videos-from-the-songbook}

You will also be given the option of **caching all videos from the songbook**. This option pre-downloads all the songbook videos, reducing the time it takes to fetch media for meetings in the future.

- **Pros:** Meeting media will be available much faster.
- **Cons:** The size of the media cache will increase significantly, by approximately 5GB.

:::tip 참고

If your Kingdom Hall has sufficient storage space, it’s recommended to **enable** this option for efficiency and perceived performance.

:::

### OBS Studio Integration Configuration (Optional) {#obs-studio-integration-configuration}

If your Kingdom Hall uses **OBS Studio** for broadcasting hybrid meetings over Zoom, M³ can automatically integrate with that program. During setup, you can configure the integration with OBS Studio by entering the following:

- **Port:** The port number used to connect to the OBS Studio Websocket plugin.
- **Password:** The password used to connect to the OBS Studio Websocket plugin.
- **Scenes:** The OBS scenes that will be used during media presentations. You'll need one scene that captures the media window or screen, and one that shows the stage.

:::tip 참고

If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.

:::

## 3. Enjoy using M³ {#enjoy-using-m3}

Once the setup wizard is complete, M³ is ready to help manage and present media for congregation meetings. Enjoy using the app! :tada:

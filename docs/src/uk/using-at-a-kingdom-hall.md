<!-- markdownlint-disable no-inline-html -->

# Using M³ at a Kingdom Hall {#using-m3-at-a-kingdom-hall}

This guide will walk you through the process of downloading, installing, and setting up **Meeting Media Manager (M³)** at a Kingdom Hall. Follow the steps to ensure a smooth setup for managing media during congregation meetings.

## 1. Download and install {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Download the appropriate version for your operating system:
   - **Windows:**
     - For most Windows systems, download <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a>.
     - For older 32-bit Windows systems, download <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a>.
   - **macOS:**
     - **M-series (Apple Silicon)**: Download <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a>.
     - **Intel-based Macs**: Download <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a>.
   - **Linux:**
     - Download <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a>.
2. If the download links do not work, visit the [M³ download page](https://github.com/sircharlo/meeting-media-manager/releases/latest) and download the correct version manually.
3. Відкрийте інсталятор та дотримуйтесь екранних інструкцій для встановлення M³.
4. Запустіть M³.
5. Пройдіть через майстер настройки.

### macOS only: Additional installation steps {#additional-steps-for-macos-users}

:::warning Увага

This section only applies to macOS users.

:::

Due to Apple's security measures, a few additional steps are required to run the installed M³ app on modern macOS systems.

Run the following two commands in Terminal, modifying the path to M³ as needed:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Увага

As a macOS user, you will need to follow these steps every time you install or update M³.

:::

:::info Пояснення

The first command _signs the application's code_. This is required to prevent M³ from being detected as a malicious application from an unknown developer.

The second command _removes the quarantine flag_ from the application. The quarantine flag is used to warn users about potentially malicious applications that have been downloaded from the internet.

:::

#### Alternative method {#alternative-method-for-macos-users}

If you are still unable to launch M³ after entering the two commands from the previous section, please try the following:

1. Відкрийте налаштування macOS системи **Конфіденційність та безпека**.
2. Find the entry for M³ and click the button to **Open Anyway**.
3. You will then be warned again, and given the advice to not "open this unless you are certain it is from a trustworthy source." Click **Open Anyway**.
4. Ще одне попередження з’явиться, де вам потрібно буде автентифікуватись для запуску додатку.
5. M³ тепер повинен успішно запуститися.

If you still have issues after following all these steps, please [open an issue on GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Ми зробимо все можливе, щоб допомогти.

### macOS only: Re-enabling website presentation after updates {#screen-sharing-issues}

:::warning Увага

This section only applies to macOS users.

:::

Some macOS users have reported that website presentation no longer works after installing updates to M³.

If the media window is black when presenting the website after updating M³, try the following steps:

1. Відкрийте налаштування macOS системи **Конфіденційність та безпека**.
2. Go to **Screen Recording**.
3. Select M³ in the list.
4. Click the `-` (minus) button to remove it.
5. Click the `+` (plus) button and select M³ from the Applications folder.
6. You may be prompted to relaunch M³ to apply the change.

After these steps, screen sharing should function as expected once again.

:::tip Порада

These steps are optional and can be skipped if you do not plan to use the website presentation feature. On the other hand, if you do plan to use the website presentation feature, it is recommended to follow these steps after every update to ensure the feature works as expected.

:::

## 2. Майстер налаштування {#configuration-wizard}

### Мова інтерфейсу додатку {#app-display-language}

При запуску M³ вперше, вам буде запропоновано вибрати бажану **мову відображення**. Виберіть мову, яку ви хочете, щоб M³ використовував для свого інтерфейсу.

:::tip Порада

Мова не повинна обов'язково співпадати з тією ж мовою, якою M³ буде завантажувати медіа. Мова для завантаження медіа буде налаштовуватись в подальшому кроці.

:::

### Тип профілю {#profile-type}

Наступний крок - вибрати **тип профілю**. Для звичайного налаштування в Залі Царства, оберіть **Звичайний**. Це налаштує багато функцій, які зазвичай використовуються для зібрань збору.

:::warning Увага

Ви повинні вибрати **Інший** в тому випадку, якщо ви створюєте профіль, для якого не потрібно автоматично завантажувати жодних медіа. Медіафайли повинні будуть імпортовані вручну при використанні цього профілю. Цей тип профілю зазвичай корисний для використання M³ під час теократичних шкіл, конгресів, та інших спеціальних подій.

Тип **Інший** використовується рідко. **Для звичайного використання під час зібрань збору, будь ласка, оберіть _Звичайний_.**

:::

### Автоматичний пошук збору {#automatic-congregation-lookup}

M³ може спробувати автоматично знайти графік завдань вашого збору, мову та відформатовану назву.

Для цього скористайтеся кнопкою **Пошук збору** поруч із полем назви збору та введіть щонайменше частину назви збору та міста.

Як тільки правильний збір буде знайдений і обраний, M³ автоматично заповнить усю доступну інформацію, таку як **назва** вашого збору, **мова зібрань**, а також **дні та час зібрань**.

:::info Примітка

Цей пошук використовує публічно доступні дані з офіційного сайту Свідків Єгови.

:::

### Manual entry of congregation information {#manual-entry-of-congregation-information}

Якщо автоматичний пошук не знайде вашого збору, то ви можете вручну ввести необхідну інформацію. Майстер налаштування дозволить вам переглянути та/або ввести **назву** вашого збору, **мову зібрань** та **дні і час зібрань**.

### Кешування відео з пісненника {#caching-videos-from-the-songbook}

Також вам буде доступна опція **кешування всіх відео з пісенника**. Ця функція попередньо завантажує всі відео з пісенника, зменшуючи час, необхідний для того, щоб завантажувати медіа для зібрань в майбутньому.

- **Плюси:** Медіафайли для зібрань будуть доступні набагато швидше.
- **Мінуси:** Розмір медіа кешу значно збільшиться, приблизно на 5ГБ.

:::tip Порада

Якщо у вашому Залі Царства достатньо місця для зберігання, рекомендується **увімкнути** цю опцію для підвищення ефективності та сприйнятої продуктивності.

:::

### Налаштування інтеграції OBS Studio (опціонально) {#obs-studio-integration-configuration}

Якщо в вашому Залі Царства використовується **OBS Studio** для трансляції гібридних зібрань в Zoom, M³ може автоматично інтегруватися з цією програмою. Під час встановлення ви можете налаштувати інтеграцію з OBS Studio, ввівши наступне:

- **Port:** Номер порту, що використовується для підключення до плагіну OBS Studio Websocket.
- **Пароль:** Пароль, що використовується для підключення до модуля OBS Studio Websocket.
- **Сцени:** Сцени OBS, які будуть використовуватися під час презентацій медіа. Вам потрібно буде створити одну сцену, яка захоплює вікно або екран медіа, і одну сцену, яка показує сцену Залу Царства.

:::tip Порада

Якщо ваш збір регулярно проводить гібридні зібрання, **дуже** рекомендується увімкнути інтеграцію з OBS Studio.

:::

## 3. Насолоджуйтеся використанням M³ {#enjoy-using-m3}

Як тільки майстер установки завершиться, M³ буде готовим допомогти керувати і демонструвати медіа на зібраннях. Насолоджуйтесь використання програми! :tada:

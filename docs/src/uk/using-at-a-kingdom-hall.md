# Using M³ at a Kingdom Hall {#using-m3-at-a-kingdom-hall}

Цей посібник проведе вас через процес завантаження, встановлення та налаштування Meeting Media Manager (M³) у Залі Царства. Дотримуйтесь цих кроків, щоб забезпечити безперебійне налаштування для управління медіа під час зібрань.

## 1. Download and install {#download-and-install}

1. Відвідайте [сторінку завантаження M³](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Завантажте відповідну версію для вашої операційної системи (Windows, macOS або Linux).
3. Відкрийте інсталятор та дотримуйтесь екранних інструкцій для встановлення M³.
4. Запустіть M³.
5. Пройдіть через майстер настройки.

### Additional steps for macOS Users {#additional-steps-for-macos-users}

Через заходи безпеки Apple, необхідні додаткові кроки для запуску M³ на сучасних macOS системах.

First, run the following two commands in Terminal (modify the path to M³ as needed):

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::tip Пояснення

These commands do two things that will prevent M³ from being detected as a malicious application on your system: the first one signs the application's code locally, and the second one removes the quarantine flag from the application. The quarantine flag is used to warn users about applications that have been downloaded from the internet.

:::

If you are still unable to launch M³ after entering the two commands, please try the following:

1. Відкрийте налаштування macOS системи **Конфіденційність та безпека**.
2. Find the entry for M³ and click the button to **Open Anyway**.
3. You will then be warned again, and given the advice to not "open this unless you are certain it is from a trustworthy source." Click **Open Anyway**.
4. Ще одне попередження з’явиться, де вам потрібно буде автентифікуватись для запуску додатку.
5. M³ тепер повинен успішно запуститися.

If you still have issues after following all these steps, please [open an issue on GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Ми зробимо все можливе, щоб допомогти.

## 2. Configuration wizard {#configuration-wizard}

### App display language {#app-display-language}

При запуску M³ вперше, вам буде запропоновано вибрати бажану **мову відображення**. Виберіть мову, яку ви хочете, щоб M³ використовував для свого інтерфейсу.

:::tip Порада

Мова не повинна обов'язково співпадати з тією ж мовою, якою M³ буде завантажувати медіа. Мова для завантаження медіа буде налаштовуватись в подальшому кроці.

:::

### Profile type {#profile-type}

Наступний крок - вибрати **тип профілю**. Для звичайного налаштування в Залі Царства, оберіть **Звичайний**. Це налаштує багато функцій, які зазвичай використовуються для зібрань збору.

:::warning Увага

Ви повинні вибрати **Інший** в тому випадку, якщо ви створюєте профіль, для якого не потрібно автоматично завантажувати жодних медіа. Медіафайли повинні будуть імпортовані вручну при використанні цього профілю. Цей тип профілю зазвичай корисний для використання M³ під час теократичних шкіл, конгресів, та інших спеціальних подій.

Тип **Інший** використовується рідко. **Для звичайного використання під час зібрань збору, будь ласка, оберіть _Звичайний_.**

:::

### Automatic congregation lookup {#automatic-congregation-lookup}

M³ може спробувати автоматично знайти графік завдань вашого збору, мову та відформатовану назву.

Для цього скористайтеся кнопкою **Пошук збору** поруч із полем назви збору та введіть щонайменше частину назви збору та міста.

Як тільки правильний збір буде знайдений і обраний, M³ автоматично заповнить усю доступну інформацію, таку як **назва** вашого збору, **мова зібрань**, а також **дні та час зібрань**.

:::info Примітка

Цей пошук використовує публічно доступні дані з офіційного сайту Свідків Єгови.

:::

### Manual entry of congregation information {#manual-entry-of-congregation-information}

Якщо автоматичний пошук не знайде вашого збору, то ви можете вручну ввести необхідну інформацію. Майстер налаштування дозволить вам переглянути та/або ввести **назву** вашого збору, **мову зібрань** та **дні і час зібрань**.

### Caching videos from the songbook {#caching-videos-from-the-songbook}

Також вам буде доступна опція **кешування всіх відео з пісенника**. Ця функція попередньо завантажує всі відео з пісенника, зменшуючи час, необхідний для того, щоб завантажувати медіа для зібрань в майбутньому.

- **Плюси:** Медіафайли для зібрань будуть доступні набагато швидше.
- **Мінуси:** Розмір медіа кешу значно збільшиться, приблизно на 5ГБ.

:::tip Порада

Якщо у вашому Залі Царства достатньо місця для зберігання, рекомендується **увімкнути** цю опцію для підвищення ефективності та сприйнятої продуктивності.

:::

### OBS Studio Integration Configuration (Optional) {#obs-studio-integration-configuration}

Якщо в вашому Залі Царства використовується **OBS Studio** для трансляції гібридних зібрань в Zoom, M³ може автоматично інтегруватися з цією програмою. Під час встановлення ви можете налаштувати інтеграцію з OBS Studio, ввівши наступне:

- **Port:** Номер порту, що використовується для підключення до плагіну OBS Studio Websocket.
- **Пароль:** Пароль, що використовується для підключення до модуля OBS Studio Websocket.
- **Сцени:** Сцени OBS, які будуть використовуватися під час презентацій медіа. Вам потрібно буде створити одну сцену, яка захоплює вікно або екран медіа, і одну сцену, яка показує сцену Залу Царства.

:::tip Порада

Якщо ваш збір регулярно проводить гібридні зібрання, **дуже** рекомендується увімкнути інтеграцію з OBS Studio.

:::

## 3. Enjoy using M³ {#enjoy-using-m3}

Як тільки майстер установки завершиться, M³ буде готовим допомогти керувати і демонструвати медіа на зібраннях. Насолоджуйтесь використання програми! :tada:

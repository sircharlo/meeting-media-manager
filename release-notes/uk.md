<!-- markdownlint-disable no-duplicate-heading -->

# Що нового

Для повного списку змін між версіями перегляньте наш файл CHANGELOG.md на GitHub.

## 25.6.0

### ✨ Нові функції

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

### 🛠️ Покращення та налаштування

- 🛠️ **Better mime type handling**: Improved support for MIME types for better media compatibility.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Linux compatibility**: Forced GTK 3 usage on Linux to prevent UI and launch issues.

## 25.5.0

### ✨ Нові функції

- 🖼️ **OBS Delay Option for Images**: Add an OBS Studio setting to delay scene changes when displaying images, improving transitions.
- 🔊 **Support for `.m4a` Audio Format**: Add compatibility for `.m4a` audio files to expand supported media types.

### 🛠️ Покращення та налаштування

- 🔍 **Restore Zoom with `Ctrl` + `Scroll`**: Re-enable immediate zooming with the control + scroll gesture for easier navigation.
- 👤 **Hide Unused CO Media**: Hide rather than skip unused media for Circuit Overseer visits to maintain a cleaner presentation.
- 🎵 **Improve Duplicate Song Indicator**: Enhance the visual cue for duplicate songs to make them easier to identify.

## 25.4.3

### 🛠️ Покращення та налаштування

- ➕ **Clean Up Media From v25.4.x**: Automatically clean up orphaned or misplaced media from v25.4.1 to v25.4.2 to ensure no media is missing or in the wrong place in the media list.

## 25.4.2

### 🛠️ Покращення та налаштування

- ➕ **Prevent Duplicate Media**: Avoid adding some media items multiple times to the media list.

## 25.4.1

### 🛠️ Покращення та налаштування

- 🎬 **Виправлення призначення власного часу початку/завершення**: Запобігає неправильному застосуванню заданого часу початку та завершення до іншого відео.
- 📝 **Дозволити невідповідні субтитри**: Дозволяє використовувати субтитри, навіть якщо вони не повністю відповідають медіафайлу.
- 🪟 **Вимкнути заокруглені кути у Windows**: Видаляє заокруглені кути у вікні медіа у Windows.
- 🖼 **Додати невикористані зображення до списку медіа**: Гарантує, що всі невикористані зображення будуть додані до списку медіа для повноти.
- ➕ **Запобігти дублюванню розділів медіа**: Уникає створення кількох розділів медіа для одного й того ж елемента.
- 📥 **Зберігати порядок файлів у плейлисті при імпорті**: Зберігайте оригінальний порядок файлів у плейлисті JWL під час імпорту.

## 25.4.0

### ✨ Нові функції

- 🇵🇭 **New Language: Tagalog**: Added support for Tagalog, expanding the app's multilingual capabilities.
- 🎞 **Support for `.m4v` Video Format**: Now supports playback of `.m4v` files to improve media compatibility.

### 🛠️ Покращення та налаштування

- 🎬 **Multiple Start/End Times for Single Video**: Allow a single video to appear in the media list multiple times with different custom start/end times.
- 📤 **Include Grouped Media in Auto Export**: Automatically export grouped media items along with others.
- 📡 **Correct `.m4v` Fetching from JW API**: Ensure `.m4v` files are correctly fetched from the JW API.

## 25.3.1

### ✨ Нові функції

- 🌏 **Нова мова: корейська**: Додано підтримку корейської мови, що розширює доступність для більшої кількості користувачів.

### 🛠️ Покращення та налаштування

- ⚡ **Покращена продуктивність і використання процесора**: Оптимізовано роботу для зменшення навантаження на процесор і підвищення ефективності.
- 🔄 **Виправлення проблем із синхронізацією та збоями**: Усунуто різні помилки, пов’язані із синхронізацією та стабільністю, для підвищення надійності.
- 📜 **Показувати примітки до випуску для існуючих зборів**: Забезпечено відображення приміток до випуску лише для зборів, які вже завантажені.

## 25.3.0

### ✨ Нові функції

- 🎵 **Відтворення фонової музики з відео**: Дозволяє фоновій музиці продовжувати грати під час перегляду відео.
- 🎥 **Камера для медіа жестової мови**: Додано можливість відображати камеру на медіа вікні, спеціально для користувачів жестової мови.
- 📅 **Автоматична дата та фон для Спомину**: Автоматично визначає дату Спомину та готує фонове зображення для нього.
- 📜 **Показувати примітки до релізу в додатку**: Відображати примітки до релізу безпосередньо в додатку, щоб користувачі могли легко переглядати зміни після оновлення.

### 🛠️ Покращення та налаштування

- ⚡ **Оптимізація інтелектуального очищення кешу**: Покращення механізму інтелектуального очищення кешу для кращої продуктивності та ефективності.
- 📂 **Коректне розміщення медіа для районного наглядача**: Забезпечити правильне розміщення медіа для районного наглядача в відповідному розділі.
- 📅 **Виключити медіа для регулярних зібрань під час Спомину**: Запобігти завантаженню стандартного медіа для зібрання під час Спомину, щоб уникнути помилок.
- 📅 **Приховати розділи для зібрань під час Спомину**: Прибрати непотрібні розділи для зібрань під час Спомину для більш чистого виду.
- 📖 **Виправлено завантаження відео Біблії жестовою мовою**: Коректне завантаження відео розділів Біблії жестовою мовою з JWL плейлістів.

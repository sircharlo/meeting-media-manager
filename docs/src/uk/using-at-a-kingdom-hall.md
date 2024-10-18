# Використання M³ в Залі Царства

This guide will walk you through the process of downloading, installing, and setting up **Meeting Media Manager (M³)** at a Kingdom Hall. Follow the steps to ensure a smooth setup for managing media during congregation meetings.

## 1. Завантажте та встановіть

1. Відвідайте [сторінку завантаження M³](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Завантажте відповідну версію для вашої операційної системи (Windows, macOS або Linux).
3. Відкрийте інсталятор та дотримуйтесь екранних інструкцій для встановлення M³.
4. Запустіть M³.
5. Пройдіть через майстер настройки.

## 2) Майстер налаштування

### Мова інтерфейсу

При запуску M³ вперше, вам буде запропоновано вибрати бажану **мову відображення**. Виберіть мову, яку ви хочете, щоб M³ використовував для свого інтерфейсу.

:::tip Порада
Мова не повинна обов'язково співпадати з тією ж мовою, якою M³ буде завантажувати медіа. Мова для завантаження медіа буде налаштовуватись в подальшому кроці.
:::

### Тип профілю

Наступний крок - вибрати **тип профілю**. Для звичайного налаштування в Залі Царства, оберіть **Звичайний**. Це налаштує багато функцій, які зазвичай використовуються для зібрань збору.

::: warning
You should only choose **Other** if you are creating a profile for which no media should be automatically downloaded. Media will have to be manually imported for use in this profile. This type of profile is used mostly to use M³ during theocratic schools, assemblies, conventions and other special events.

Тип **Інший** рідко використовується. **For normal use during congregation meetings, please choose _Regular_.**
:::

### Автоматичний пошук збору

M³ може спробувати автоматично знайти графік завдань вашого збору, мову та відформатовану назву.

To do so, use the **Congregation Lookup** button next to the congregation name field and enter at least part of the congregation's name and city.

Once the correct congregation is found and selected, M³ will prefill all available information, such as your congregation's **name**, **meeting language**, and **meeting days and times**.

:::info Примітка
Цей пошук використовує публічно доступні дані з офіційного сайту Свідків Єгови.
:::

### Ручний ввід інформації про збір

Якщо автоматичний пошук не знайде вашого збору, то ви можете вручну ввести необхідну інформацію. The wizard will allow you to review and/or enter your congregation's **name**, **meeting language**, and **meeting days and times**.

### Кешування відео з пісенника

Також вам буде доступна опція **кешування всіх відео з пісенника**. Ця функція попередньо завантажує всі відео з пісенника, зменшуючи час, необхідний для того, щоб завантажувати медіа для зібрань в майбутньому.

- **Плюси:** Медіафайли для зібрань будуть доступні набагато швидше.
- **Мінуси:** Розмір медіа кешу значно збільшиться, приблизно на 5ГБ.

:::tip Порада
If your Kingdom Hall has sufficient storage space, it’s recommended to **enable** this option for efficiency and perceived performance.
:::

### Конфігурація інтеграції OBS Studio (за бажанням)

Якщо в вашому Залі Царства використовується **OBS Studio** для трансляції гібридних зібрань в Zoom, M³ може автоматично інтегруватися з цією програмою. Під час встановлення ви можете налаштувати інтеграцію з OBS Studio, ввівши наступне:

- **Port:** Номер порту, що використовується для підключення до плагіну OBS Studio Websocket.
- **Пароль:** Пароль, що використовується для підключення до модуля OBS Studio Websocket.
- **Сцени:** Сцени OBS, які будуть використовуватися під час презентацій медіа. You'll need one scene that captures the media window or screen, and one that shows the stage.
  ::: tip Tip
  If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.
  :::

## 3. Насолоджуйтесь використанням M³

Як тільки майстер установки завершиться, M³ буде готовим допомогти керувати і демонструвати медіа на зібраннях. Насолоджуйтесь використання програми! :tada:

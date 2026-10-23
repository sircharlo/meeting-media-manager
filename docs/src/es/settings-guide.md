# Guía de configuración {#settings-guide}

Esta guía completa explica toda la configuración disponible en M³, organizada por categorías. Entender estas opciones te ayudará a configurar M³ para que se adapte perfectamente a las necesidades de tu congregación.

## General {#application-configuration}

### Idioma de la interfaz {#display-language}

<!-- **Setting**: `localAppLang` -->

Elige el idioma de la interfaz de M³. Es independiente del idioma que se usa para descargar archivos multimedia.

**Opciones**: Todos los idiomas de interfaz disponibles (inglés, español, francés, etc.)

**Predeterminado**: Inglés

### Modo oscuro {#dark-mode}

<!-- **Setting**: `darkMode` -->

Controla el tema de apariencia de M³.

**Opciones**:

- Cambiar automáticamente según la preferencia del sistema
- Usar siempre el modo oscuro
- Usar siempre el modo claro

**Predeterminado**: Automático

### Primer día de la semana {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Establece qué día debe considerarse el primero de la semana en la vista de calendario.

**Opciones**: De domingo a sábado

**Predeterminado**: Domingo

### Formato de fecha {#date-format}

<!-- **Setting**: `localDateFormat` -->

Formato que se usa para mostrar las fechas en la aplicación.

**Ejemplo**: D MMMM YYYY

**Predeterminado**: D MMMM YYYY

### Inicio automático al iniciar sesión {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Inicia M³ automáticamente cuando arranca la computadora.

**Predeterminado**: `false`

## Reuniones de congregación {#congregation-meetings}

### Nombre de la congregación {#congregation-name}

<!-- **Setting**: `congregationName` -->

El nombre de tu congregación. Se usa para organizar y mostrar la información.

**Predeterminado**: Vacío (debe establecerse durante la configuración)

### Idioma de las reuniones {#meeting-language}

<!-- **Setting**: `lang` -->

El idioma principal para descargar archivos multimedia. Debería coincidir con el idioma que se usa en las reuniones de tu congregación.

**Opciones**: Todos los idiomas disponibles en el sitio web oficial de los testigos de Jehová

**Predeterminado**: Inglés (E)

### Idioma alternativo {#fallback-language}

<!-- **Setting**: `langFallback` -->

Un idioma secundario que se usa cuando los archivos multimedia no están disponibles en el idioma principal.

**Opciones**: Todos los idiomas disponibles en el sitio web oficial de los testigos de Jehová

**Predeterminado**: Ninguno

### Día de la reunión de entre semana {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

El día de la semana en que se celebra tu reunión de entre semana.

**Opciones**: De domingo a sábado

**Predeterminado**: Ninguno (debe establecerse durante la configuración)

### Hora de la reunión de entre semana {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

La hora de inicio de tu reunión de entre semana.

**Formato**: HH:MM (formato de 24 horas)

**Predeterminado**: Ninguno (debe establecerse durante la configuración)

### Día de la reunión del fin de semana {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

El día de la semana en que se celebra tu reunión del fin de semana.

**Opciones**: De domingo a sábado

**Predeterminado**: Ninguno (debe establecerse durante la configuración)

### Hora de la reunión del fin de semana {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

La hora de inicio de tu reunión del fin de semana.

**Formato**: HH:MM (formato de 24 horas)

**Predeterminado**: Ninguno (debe establecerse durante la configuración)

### Semana del superintendente de circuito {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

La semana de la próxima visita del superintendente de circuito.

**Formato**: MM/DD/YYYY

**Predeterminado**: Ninguno

### Fecha de la Conmemoración {#memorial-date}

<!-- **Setting**: `memorialDate` -->

La fecha de la próxima celebración de la Conmemoración.

**Formato**: MM/DD/YYYY

**Predeterminado**: Se obtiene automáticamente de forma periódica

### Cambios del programa de reuniones {#meeting-schedule-changes}

Estas opciones te permiten configurar cambios temporales en tu programa de reuniones:

- **Fecha del cambio**: Cuándo entra en vigor el cambio
- **Cambio de una sola vez**: Si se trata de un cambio permanente o temporal
- **Nuevo día entre semana**: Nuevo día de la reunión de entre semana
- **Nueva hora entre semana**: Nueva hora de la reunión de entre semana
- **Nuevo día del fin de semana**: Nuevo día de la reunión del fin de semana
- **Nueva hora del fin de semana**: Nueva hora de la reunión del fin de semana

### Actualizaciones automáticas del programa de reuniones {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Si está activado, M³ consulta periódicamente el sitio web oficial de los testigos de Jehová para ver si cambiaron los días y las horas de las reuniones y actualiza automáticamente el perfil actual.

Esto solo funciona con perfiles que se añadieron mediante la búsqueda de congregación y cuyo nombre de congregación no se ha cambiado manualmente. Si la sincronización se desactivó porque cambió el nombre de la congregación, usa **Activar sincronización del programa** para volver a vincular el perfil.

#### Activar sincronización del programa {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Vuelve a vincular el perfil actual con la búsqueda de congregación para que puedan reanudarse las actualizaciones automáticas del día y la hora de las reuniones. Solo se muestra después de cambiar manualmente el nombre de la congregación, ya que eso es lo que rompe el vínculo.

#### Actualizar programa de reuniones {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Sincroniza manualmente el programa de reuniones actual y futuro con la información del sitio web oficial.

## Archivos multimedia y reproducción {#media-retrieval-and-playback}

### Conexión de uso medido {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Activa esta opción si tienes una conexión de datos limitada para reducir el uso de ancho de banda.

**Predeterminado**: `false`

### Presentación de archivos multimedia {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Activa la función de presentación de archivos multimedia. Esto es necesario para presentar archivos multimedia en un segundo monitor.

**Predeterminado**: `false`

#### Activar vista previa de archivos multimedia {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Muestra una vista previa en vivo de la ventana de archivos multimedia mientras se muestra una imagen o un video.

**Predeterminado**: `true`

#### Iniciar reproducción en pausa {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Inicia los videos en pausa cuando comienza la reproducción.

**Predeterminado**: `false`

### Música de fondo {#settings-guide-background-music}

#### Activar música {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Activa la función de música de fondo.

**Predeterminado**: `true`

#### Iniciar música automáticamente {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Inicia automáticamente la música de fondo cuando se abre M³ si corresponde.

**Predeterminado**: `true`

#### Margen de detención antes de la reunión {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Cuántos segundos antes de la hora de inicio de la reunión se debe detener la música de fondo.

**Intervalo**: 0-300 segundos

**Predeterminado**: 60 segundos

#### Volumen de la música {#music-volume}

<!-- **Setting**: `musicVolume` -->

Nivel de volumen de la música de fondo (1-100 %).

**Predeterminado**: 100 %

### Opciones de reproducción y descarga {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### Activar transiciones de fundido de la ventana de archivos multimedia {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Activa transiciones de aparición y desaparición gradual al mostrar u ocultar la ventana de archivos multimedia.

**Predeterminado**: `true`

#### Activar control de velocidad de reproducción {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Permite ajustar la velocidad de reproducción de audio y video desde el menú contextual del archivo multimedia.

**Predeterminado**: `false`

#### Ocultar logotipo de archivos multimedia {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Oculta el logotipo de la ventana de archivos multimedia.

**Predeterminado**: `false`

#### Resolución máxima {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Resolución máxima de los archivos multimedia descargados.

**Opciones**: 240p, 360p, 480p, 720p, 1080p

**Predeterminado**: 720p

#### Incluir archivos multimedia impresos {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Incluye en las descargas los archivos multimedia de las publicaciones impresas.

**Predeterminado**: `true`

#### Excluir notas al pie {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Excluye de las descargas las imágenes de notas al pie cuando sea posible.

**Predeterminado**: `false`

#### Excluir videos adicionales del Estudio de La Atalaya {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Excluye videos adicionales a los que se haga referencia en los párrafos del Estudio de La Atalaya.

**Predeterminado**: `false`

#### Excluir videos del Estudio bíblico de la congregación {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Elige las publicaciones cuyos videos mencionados no deben mostrarse durante el Estudio bíblico de la congregación. Busca por título o símbolo de la publicación.

**Predeterminado**: Seamos valientes al andar con Dios (`wcg`)

#### Excluir archivos multimedia del folleto Seamos mejores lectores y maestros {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Excluye de las descargas los archivos multimedia del folleto Seamos mejores lectores y maestros (th).

**Predeterminado**: `true`

### Subtítulos {#subtitles}

#### Activar subtítulos {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Activa la compatibilidad con subtítulos para la reproducción de archivos multimedia.

**Predeterminado**: `false`

#### Idioma de los subtítulos {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Idioma de los subtítulos (puede ser distinto del idioma de los archivos multimedia).

**Opciones**: Todos los idiomas disponibles en el sitio web oficial de los testigos de Jehová

**Predeterminado**: Ninguno

### Administración de caché {#cache-management}

#### Guardar en caché los videos del cancionero {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Guarda en caché todos los videos del cancionero con anticipación para mejorar el rendimiento. Ten en cuenta que esto aumenta el tamaño de la caché multimedia.

**Predeterminado**: `false`

#### Carpeta de caché {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Ubicación personalizada para guardar archivos multimedia en caché.

**Predeterminado**: Ubicación predeterminada del sistema

#### Activar borrado automático de caché {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Borra automáticamente archivos antiguos de la caché para ahorrar espacio en disco.

**Predeterminado**: `true`

### Títulos de canciones en pinyin {#pinyin-song-titles}

#### Preferir canciones en pinyin {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

Cuando se encuentre una versión en pinyin de una canción de la reunión en la carpeta de canciones en pinyin, úsala en lugar de la canción normal.

**Predeterminado**: `false`

#### Carpeta de canciones en pinyin {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Carpeta que contiene canciones en video en pinyin (p. ej., `sjjm_s-Pi_CHS_066_r720P.mp4`). Cuando se encuentre un archivo en pinyin que coincida con el número de la canción de la reunión, se reproducirá en lugar de la canción normal.

**Predeterminado**: Vacío

### Exportación de archivos multimedia {#settings-guide-media-export}

#### Activar exportación automática de archivos multimedia {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exporta automáticamente archivos multimedia a una carpeta específica.

**Predeterminado**: `false`

#### Carpeta de exportación de archivos multimedia {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Ruta de la carpeta donde se exportarán automáticamente los archivos multimedia.

**Predeterminado**: Vacío

#### Convertir archivos a MP4 {#convert-files-to-mp4}

**Opción**: `convertFilesToMp4`

Convierte los archivos multimedia exportados al formato MP4 para mejorar la compatibilidad.

**Predeterminado**: `false`

### Carpeta compartida (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

Estos ajustes están en la categoría **Integraciones**.

M³ puede añadir archivos multimedia a tus reuniones desde una carpeta sincronizada con una aplicación de almacenamiento en la nube, como Dropbox, OneDrive, iCloud Drive o Google Drive. Esto resulta útil cuando otros preparan archivos multimedia para sus partes y los comparten contigo, o cuando M³ se usa en más de una computadora. Una carpeta en esta computadora o en tu red también sirve.

M³ crea una carpeta dentro de la carpeta compartida para cada próxima reunión, nombrada con la fecha de la reunión escrita como año-mes-día (por ejemplo, `2026-03-25`). Pon fotos, videos, archivos de audio o listas de reproducción de JW Library en la carpeta de una reunión y se añadirán automáticamente a la lista de multimedia de esa reunión. Para añadir archivos para otro día, crea una carpeta para ese día, nombrada de la misma manera. Todo lo demás en la carpeta compartida se ignorará.

:::tip Consejo

Crea una carpeta nueva dedicada solo a esto, como "Multimedia de las reuniones", y configúrala para que permanezca siempre en esta computadora en tu aplicación de almacenamiento en la nube (suele llamarse "disponible sin conexión"), de modo que los archivos estén listos antes de que comience la reunión.

:::

#### Añadir archivos multimedia desde una carpeta compartida {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Añade automáticamente los archivos que se pongan en la carpeta compartida a la reunión correspondiente.

**Predeterminado**: `false`

#### Carpeta compartida {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

La carpeta desde la que se añadirán los archivos multimedia. El asistente de configuración se ofrece a configurarla por ti.

**Predeterminado**: Vacío

#### Eliminar carpetas de reuniones pasadas {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

Cuando termina una semana, elimina las carpetas fechadas de esa semana, junto con los archivos que contienen, para mantener ordenada la carpeta compartida. Como la carpeta es compartida, también se eliminan para todos los demás que la usan. Desactiva esto para conservarlos.

**Predeterminado**: `true`

## Cronómetro de la reunión {#meeting-timer}

### Activar cronómetro de la reunión {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Activa una ventana independiente del cronómetro para controlar el tiempo de las partes de la reunión. Esta es una función beta y solo debería activarse si se ha aprobado localmente.

**Predeterminado**: `false`

### Comportamiento de la ventana del cronómetro {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configura si la ventana del cronómetro se abre automáticamente, si los cronómetros de los participantes cuentan de forma progresiva o regresiva de manera predeterminada, si el reloj usa el formato de 12 o 24 horas y si el valor actual del cronómetro se muestra en el botón del cronómetro de la isla de acciones.

### Acceso rápido al cronómetro {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Elige cómo acceder al cronómetro desde la ventana principal:

- **Controles rápidos al pasar el ratón sobre el botón del cronómetro**: al pasar el ratón sobre el botón del cronómetro en la isla de acciones, se muestra la parte que se está cronometrando, con botones para Iniciar, Pausar, Detener y Siguiente parte, sin abrir la ventana emergente completa del cronómetro. Activado por defecto.
- **Mostrar un panel del cronómetro en la ventana principal**: mantiene la lista completa de partes de la reunión y los controles del cronómetro en un panel anclado a la derecha de la ventana principal, siempre a la vista. La ventana emergente completa sigue estando disponible desde la isla de acciones para los ajustes de ventana y de pantalla.

### Control remoto del cronómetro {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemotePort` -->

Al activarse, M³ sirve una copia de solo lectura de la pantalla del cronómetro como página web en tu red local para una tableta o un teléfono en el atril: el discursante ve el tiempo restante sin que aparezca en la pantalla de la congregación ni en la transmisión de Zoom. La página sigue el cronómetro en tiempo real, incluyendo la cuenta regresiva previa a la reunión, el reloj, los colores de tiempo extra y el aviso de mano levantada, y todos los controles se quedan en M³.

Las direcciones para abrir en el dispositivo se enumeran en la ventana emergente del cronómetro, con un botón para copiar. Cambia el puerto solo si otro programa ya lo está usando. Ten en cuenta que cualquiera en la misma red puede abrir la página mientras esté activada; no muestra nada más que el cronómetro.

**Por defecto**: `false`, puerto `8787`

### Formatos de visualización del cronómetro {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Elige formatos de visualización analógicos o digitales para la hora y los cronómetros de cuenta regresiva. El indicador de advertencia de la cuenta regresiva puede cambiar el anillo analógico de cuenta regresiva hacia un color de advertencia durante el último minuto.

El formato de cuenta regresiva **Reloj analógico con arco de tiempo** muestra el tiempo restante de una parte como un sector en la esfera de un reloj analógico, desde el minutero hasta el final previsto; así, con una sola mirada, ves tanto la hora como lo que queda. El tiempo extra se muestra como un segundo sector con el color de tiempo extra. También se aplica a la cuenta regresiva antes de la reunión y sirve en modo de conteo progresivo.

### Cuenta regresiva de la reunión y estado del programa {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Muestra una cuenta regresiva antes de las reuniones programadas y, si quieres, indica si la reunión va adelantada o atrasada con respecto al programa. La cuenta regresiva de la reunión aparece solo en la pantalla del cronómetro, no en la pantalla principal de archivos multimedia.

### Apariencia del cronómetro y tiempo excedido {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Personaliza el tamaño y los colores del texto del cronómetro, y configura indicadores de tiempo excedido, como colores alternativos, parpadeo y mostrar solo el tiempo excedido en modo de cuenta progresiva.

## Integraciones {#integrations}

Esta categoría también contiene los ajustes de la [carpeta compartida](#settings-guide-folder-monitoring), para añadir archivos multimedia desde Dropbox, OneDrive, iCloud Drive o Google Drive.

### Integración con Zoom {#settings-guide-zoom-integration}

#### Activar Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Activa las funciones de integración con reuniones de Zoom.

**Predeterminado**: `false`

#### Atajo para compartir pantalla {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Atajo de teclado para activar la pantalla compartida de Zoom.

**Predeterminado**: Ninguno

#### Enfocar automáticamente la ventana de archivos multimedia {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Enfoca automáticamente la ventana de archivos multimedia después de iniciar la pantalla compartida de Zoom. Normalmente esto no hace falta, pero puede ayudar en algunos sistemas si la ventana de archivos multimedia pierde el foco con frecuencia después de empezar a compartir pantalla.

**Predeterminado**: `false`

### Zoom Meeting Manager {#zoom-meeting-manager}

Zoom Meeting Manager (beta, solo Windows) maneja por ti la aplicación de escritorio de Zoom alrededor de cada reunión. Su asistente de configuración, ofrecido al activarlo, te guía por cada automatización.

#### Mientras M³ controla Zoom {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

Zoom no ofrece una interfaz de automatización adecuada, por lo que M³ controla la aplicación de Zoom mediante su interfaz de accesibilidad, la cual funciona sin mover el ratón, incluso mientras Zoom oculta su barra de herramientas. Aun así, Zoom trae su ventana al frente por un instante cuando M³ pulsa sus botones, y el ratón solo se mueve como último recurso, si Zoom no responde a ninguna otra forma. Siempre que M³ controla Zoom, cubre su propia ventana con un aviso que dice "M³ está controlando Zoom", indicando lo que está sucediendo y con un botón **Cancelar esta automatización**. El mismo aviso se muestra durante las comprobaciones del asistente de configuración y la autoprueba. Un atajo de teclado global (por defecto `Ctrl+Alt+Escape`), activo solo mientras se ejecuta una automatización, la cancela desde cualquier lugar, incluso mientras Zoom esté en primer plano. Cancelar detiene M³ de inmediato; Zoom podría quedar a medias, así que revísalo.

**Por defecto**: `Ctrl+Alt+Escape`

#### Ayudante para manos levantadas {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert` -->

Durante la reunión, M³ revisa la lista de participantes de Zoom en busca de manos levantadas. Cuando alguien levanta la mano, una notificación en M³ te permite **activar el micrófono** de ese participante con un clic y, una vez que termine de hablar, **volver a silenciarlo y bajarle la mano** con otro clic. El botón de Zoom en la isla de acciones muestra las manos levantadas con los mismos botones. Cada acción se dirige a la fila propia de ese participante en Zoom por su nombre exacto; si dos participantes comparten el mismo nombre, M³ no toca a ninguno.

Si el [cronómetro de la reunión](#meeting-timer) está activado, también aparece una mano grande con el nombre del participante en la pantalla del cronómetro para el presidente, y el botón **Aviso de mano levantada** en las ventanas emergentes del cronómetro y de Zoom permite mostrarla manualmente. Esta función requiere la pantalla del cronómetro; las notificaciones y los botones funcionan sin ella.

Zoom marca las manos levantadas en su propio idioma, así que M³ necesita primero aprender cómo: con la reunión abierta en Zoom, haz clic en **Aprender cómo marca Zoom las manos levantadas**. M³ levanta tu propia mano, lee cómo la marca Zoom en la lista de participantes y qué opción del menú la baja, y luego vuelve a bajarla. El asistente de configuración también ofrece este paso.

**Predeterminado**: `false`

#### Disposición de ventanas {#zoom-meeting-manager-window-layout}

<!-- **Setting**: `zoomMeetingManagerWindowLayout` -->

M³ puede colocar la ventana de la reunión de Zoom, y también su propia ventana principal, donde quieras en tus pantallas. El asistente de configuración te pregunta dónde en dos pasos, que el botón **Elegir la disposición** de aquí vuelve a abrir en cualquier momento:

1. En un mapa de tus pantallas tal como están colocadas, elige la pantalla para la reunión de Zoom. La pantalla que ocupa la ventana de multimedia nunca aparece como opción. Si la pantalla de Zoom no es la de M³, elige si Zoom la tiene para él solo o la comparte con M³ (entonces M³ también se mueve allí).
2. En un dibujo de esa pantalla con su forma real, arrastra el divisor para repartirla entre M³ y Zoom. Se ajusta a las proporciones habituales (la mitad, un tercio, un cuarto, etc.); mantén pulsada la tecla `Alt` para arrastrarlo libremente. El divisor nunca deja una ventana por debajo de su tamaño mínimo: Zoom necesita más espacio mientras su lista de participantes está abierta. En una pantalla vertical, las dos ventanas se colocan una encima de la otra.

En cuanto se abre la reunión, M³ abre la lista de participantes de Zoom si se lo pediste y luego coloca las dos ventanas. A partir de entonces, mantiene Zoom en su sitio: cuando Zoom mueve o cambia el tamaño de su ventana por sí solo, después de compartir pantalla o al abrirse o cerrarse su lista de participantes, M³ lo vuelve a poner en su sitio. Si mueves Zoom o cambias su tamaño tú mismo, M³ lo deja donde lo pusiste hasta la próxima reunión. Cada vez que M³ mueve Zoom por su cuenta, una notificación te lo indica, con dos botones por si eso estorba: **Dejar Zoom como está** lo detiene hasta que M³ se reinicie, y **Desactivar** desactiva la disposición de ventanas hasta que vuelvas a activarla aquí. Cuando se conectan o se desconectan pantallas, M³ vuelve a organizar las ventanas; si la pantalla de Zoom ya no está, Zoom comparte la pantalla de M³ y M³ te lo indica.

Mientras Zoom comparte la ventana de multimedia, oculta su propia ventana de la reunión, incluida la lista de participantes. Con **Mostrar la lista de participantes al compartir** activada, M³ abre entonces la lista de participantes de Zoom en una ventana aparte, en el lugar de Zoom, para que sigas viendo quién levanta la mano para comentar. Si la cierras, se queda cerrada hasta la próxima vez que se comparta; Zoom la cierra por sí solo cuando se deja de compartir, y su ventana de la reunión vuelve a su sitio.

Cuando la opción **Meeting window view** de Zoom está en **Dual window** (**Use dual monitors** en versiones anteriores de Zoom), Zoom abre una segunda ventana (que muestra la pantalla compartida o al orador). M³ la pone en pantalla completa en la pantalla de la ventana de multimedia, detrás de la ventana de multimedia: oculta la ventana de multimedia para verla, por ejemplo, para ver a los participantes.

Cuando **Ajustarlas con Windows** está activado, M³ ajusta las dos ventanas una al lado de la otra con la función de ajuste del propio Windows, como si las hubieras arrastrado a los bordes de la pantalla, así que al arrastrar el borde que las separa se cambia el tamaño de las dos. Para ello, M³ pone cada ventana en primer plano un momento.

El botón **Organizar ventanas** de la ventana emergente de Zoom vuelve a poner todo en su sitio en cualquier momento. La disposición de ventanas se guarda por computadora, ya que depende de sus pantallas.

**Predeterminado**: desactivado

### Integración con OBS Studio {#settings-guide-obs-integration}

#### Activar OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Activa la integración con OBS Studio para cambiar escenas automáticamente.

**Predeterminado**: `false`

:::warning Nota importante

**Se necesita configurar el audio**: La integración con OBS Studio solo se encarga de compartir la pantalla. El audio de los archivos multimedia de M³ **no se transmite automáticamente** a los participantes de Zoom cuando se usa OBS Studio. Debes configurar las opciones de Audio original de Zoom o usar "Compartir sonido de la computadora" para que los participantes de la reunión puedan oír los archivos multimedia. Consulta la [Guía del usuario](/user-guide#audio-configuration) para ver instrucciones detalladas de configuración del audio.

**Nota**: La integración con Zoom usa la función nativa de Zoom para compartir pantalla, que gestiona el audio de forma más fluida que la integración con OBS Studio.

:::

#### Puerto de OBS {#obs-port}

<!-- **Setting**: `obsPort` -->

El número de puerto para conectarse a WebSocket de OBS Studio.

**Predeterminado**: Ninguno

#### Contraseña de OBS {#obs-password}

<!-- **Setting**: `obsPassword` -->

La contraseña para la conexión WebSocket de OBS Studio.

**Predeterminado**: Ninguno

#### Escenas de OBS {#obs-scenes}

Configura qué escenas de OBS se usarán para distintos fines:

- **Escena de cámara**: Escena que muestra la cámara/atril
- **Escena de archivos multimedia**: Escena para mostrar archivos multimedia
- **Escena de imagen**: Escena para mostrar imágenes (por ejemplo, una escena PiP que muestre tanto los archivos multimedia como al orador)

#### Opciones avanzadas de OBS {#obs-advanced-options}

- **No compartir imágenes automáticamente**: Retrasa compartir imágenes en OBS hasta activarlas manualmente
- **Activación rápida**: Activa un control rápido para activar o desactivar la integración con OBS
- **Cambiar escena después de los archivos multimedia**: Vuelve automáticamente a la escena anterior después de reproducir archivos multimedia
- **Recordar escena anterior**: Recuerda y restaura la escena anterior
- **Ocultar iconos**: Oculta los iconos relacionados con OBS en la interfaz
- **Controles de grabación**: Muestra controles para iniciar y detener la grabación de OBS desde M³

:::warning Nota importante

**Se necesita configurar el audio**: La integración con OBS Studio solo se encarga del video y del cambio de escenas. El audio de los archivos multimedia de M³ **no se transmite automáticamente** a Zoom ni a OBS. La transmisión de video funciona como una cámara virtual sin sonido, igual que una webcam. Debes configurar las opciones de Audio original de Zoom o usar "Compartir sonido de la computadora" para que los participantes de la reunión puedan oír los archivos multimedia. Consulta la [Guía del usuario](/user-guide#audio-configuration) para ver instrucciones detalladas de configuración del audio.

**Alternativa**: Considera usar la integración con Zoom, ya que utiliza la función nativa de Zoom para compartir pantalla y gestiona el audio de forma más fluida.

:::

### Eventos personalizados {#custom-events}

#### Activar eventos personalizados {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Activa atajos personalizados que se ejecutarán cuando se detecte un evento específico (p. ej., cuando se reproduzcan, pausen o detengan archivos multimedia).

**Predeterminado**: `false`

#### Atajos de eventos personalizados {#custom-event-shortcuts}

##### Atajo al reproducir archivos multimedia {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Atajo que se activa cuando se reproducen archivos multimedia.

**Predeterminado**: Ninguno

##### Atajo al pausar archivos multimedia {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Atajo que se activa cuando se pausan archivos multimedia.

**Predeterminado**: Ninguno

##### Atajo al detener archivos multimedia {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Atajo que se activa cuando se detienen archivos multimedia.

**Predeterminado**: Ninguno

##### Atajo de la última canción {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Atajo que se activa cuando se reproduce la última canción de una reunión.

**Predeterminado**: Ninguno

### Grabaciones de reuniones {#meeting-recordings}

#### Activar integración con aplicación de grabación externa {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Permite que M³ controle una aplicación de grabación independiente mediante atajos de teclado. Esto no graba dentro de M³; envía los atajos configurados cuando presionas **Iniciar grabación** o **Detener grabación** en la ventana emergente de grabaciones de la reunión.

Esta opción se oculta cuando están activados los controles de grabación de OBS. Si usas OBS Studio, usa en su lugar los controles de grabación de OBS de la integración con OBS.

**Predeterminado**: `false`

#### Atajos y carpeta de grabación {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configura el atajo de teclado que inicia la grabación, el atajo opcional que la detiene y la carpeta donde la aplicación externa guarda las grabaciones. Si no se indica un atajo para detener, M³ vuelve a usar el atajo de inicio. Cuando se configura una carpeta, M³ muestra un botón para abrirla.

## Interfaz y atajos {#interface-shortcuts}

### Atajos de teclado {#settings-guide-keyboard-shortcuts}

#### Activar atajos de teclado {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Activa atajos de teclado personalizables para controlar archivos multimedia.

**Predeterminado**: `false`

#### Atajos de control de archivos multimedia {#media-control-shortcuts}

Configura atajos para la reproducción de archivos multimedia:

- **Ventana de archivos multimedia**: Abre/cierra la ventana de archivos multimedia
- **Archivo multimedia anterior**: Va al archivo multimedia anterior
- **Siguiente archivo multimedia**: Va al siguiente archivo multimedia
- **Pausar/Reanudar**: Pausa o reanuda la reproducción de archivos multimedia
- **Detener archivos multimedia**: Detiene la reproducción de archivos multimedia
- **Activar/desactivar música**: Activa o desactiva la música de fondo

### Botón Añadir más archivos multimedia {#add-more-media-button}

#### Secciones con un botón Añadir archivos multimedia {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Elige qué secciones de la reunión muestran su propio botón para añadir tus archivos multimedia, además del botón "Añadir archivos multimedia" de la barra de herramientas superior, que siempre funciona en todas las secciones.

**Predeterminado**: Discurso público, Nuestra vida cristiana, Visita del superintendente de circuito y secciones personalizadas

#### Botón compacto Añadir archivos multimedia {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

Mostrar solo un icono para el botón "Añadir más archivos multimedia"/"Añadir una canción" en los encabezados de las secciones. Si se desactiva, el botón también muestra texto junto al icono cuando hay suficiente espacio.

**Predeterminado**: `true`

### Control de arrastre de archivos multimedia {#media-drag-handle}

#### Mostrar control de arrastre {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Muestra un pequeño control en cada archivo multimedia para arrastrarlo y cambiar su orden. Los archivos multimedia siempre se pueden reordenar arrastrándolos desde cualquier parte; esto solo determina si se muestra el icono del control.

**Predeterminado**: `true`

### Acciones rápidas antes/después de la reunión {#before-after-meeting-quick-actions}

#### Mostrar acciones rápidas de la reunión {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Muestra un panel antes de la reunión y otro después de la reunión con controles útiles (música de fondo, grabación) y una lista de tareas personalizable para cada uno.

**Predeterminado**: `true`

Las categorías y tareas de las listas de los paneles de antes y después de la reunión se administran desde esta misma sección de configuración: añade, cambia el nombre, reordena o elimina categorías y tareas según las necesidades de tu congregación.

## Avanzado {#advanced-settings}

### Transferencia de configuración del perfil {#profile-settings-transfer}

Exporta la configuración del perfil actual a un archivo JSON o importa un archivo de configuración de perfil exportado anteriormente. La importación reemplaza la configuración del perfil actual.

### Zona de peligro {#danger-zone}

:::warning Advertencia

Estas opciones solo deberían cambiarse si entiendes sus implicaciones.

:::

#### URL base {#base-url}

<!-- **Setting**: `baseUrl` -->

Dominio base que se usa para descargar publicaciones y archivos multimedia.

**Predeterminado**: `jw.org`

#### Desactivar aceleración por hardware {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Desactiva la aceleración por hardware después de reiniciar M³. Esto puede ayudar con fallos gráficos o bloqueos en algunos sistemas, pero por lo demás no se recomienda.

**Predeterminado**: `false`

#### Ocultar recordatorio de aceleración por hardware {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Oculta el recordatorio para volver a activar la aceleración por hardware después de desactivarla manualmente.

**Predeterminado**: `false`

#### Desactivar descarga de archivos multimedia {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Desactiva por completo las descargas automáticas de archivos multimedia. Usa esto solo para perfiles que se usarán en eventos especiales u otras configuraciones personalizadas.

**Predeterminado**: `false`

## Consejos para una configuración óptima {#configuration-tips}

### Para usuarios nuevos {#new-users}

1. Empieza con el asistente de configuración para configurar las opciones básicas
2. Activa "Habilitar reproducción de multimedia" para acceder a las funciones de presentación
3. Configura correctamente tu programa de reuniones
4. Configura la integración con OBS si tienes reuniones híbridas

### Para usuarios avanzados {#advanced-users}

1. Usa una carpeta compartida para añadir archivos multimedia desde un almacenamiento en la nube, como Dropbox o OneDrive
2. Activa la exportación automática de archivos multimedia para tener copias de seguridad
3. Configura atajos de teclado para trabajar con eficiencia
4. Configura la integración con Zoom para compartir pantalla automáticamente

### Optimización del rendimiento {#performance-optimization}

1. Guarda en caché los archivos de video del cancionero para un mejor rendimiento
2. Usa una resolución máxima adecuada para tus necesidades
3. Configura el borrado automático de caché para administrar el espacio en disco
4. Considera usar la opción de conexión de uso medido si tienes un ancho de banda limitado

### Solución de problemas {#settings-guide-troubleshooting}

- Si los archivos multimedia no se descargan, revisa la configuración de tu programa de reuniones
- Si la integración con OBS no funciona, revisa la configuración del puerto y la contraseña
- Si el rendimiento es lento, prueba a activar la caché adicional o reducir la resolución
- Si tienes problemas con el idioma, revisa tanto el idioma de la interfaz como el de los archivos multimedia
- Si los participantes de Zoom no oyen el audio de los archivos multimedia, configura las opciones de Audio original de Zoom o usa "Compartir sonido de la computadora"
- **Consejo**: Considera usar la integración con Zoom en vez de OBS Studio para gestionar el audio de forma más sencilla

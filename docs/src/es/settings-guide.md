# Guía de configuración {#settings-guide}

Esta guía completa te explica todos los ajustes disponibles en M³, organizados por categoría. Entender estos ajustes te ayudará a configurar M³ para que funcione perfectamente según las necesidades de tu congregación.

## Configuración de la aplicación {#application-configuration}

### Idioma de visualización {#display-language}

<!-- **Setting**: `localAppLang` -->

Elige el idioma para la interfaz de M³. Esto es independiente del idioma que uses para descargar archivos multimedia.

**Opciones**: Todos los idiomas de interfaz disponibles (inglés, español, francés, etc.)

**Por defecto**: Inglés

### Modo oscuro {#dark-mode}

<!-- **Setting**: `darkMode` -->

Controla el tema visual de M³.

**Opciones**:

- Cambiar automáticamente según las preferencias de tu sistema
- Usar siempre el modo oscuro
- Usar siempre el modo claro

**Por defecto**: Automático

### Primer día de la semana {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Configura qué día se debe considerar como el primer día de la semana en la vista del calendario.

**Opciones**: De domingo a sábado

**Por defecto**: Domingo

### Formato de fecha {#date-format}

<!-- **Setting**: `localDateFormat` -->

El formato que se usa para mostrar las fechas en la aplicación.

**Ejemplo**: D MMMM YYYY

**Por defecto**: D MMMM YYYY

### Inicio automático al iniciar sesión {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Iniciar M³ de forma automática cuando enciendas la computadora.

**Por defecto**: `false`

## Reuniones de la congregación {#congregation-meetings}

### Nombre de la congregación {#congregation-name}

<!-- **Setting**: `congregationName` -->

El nombre de tu congregación. Esto se usa para organizarte y mostrarlo en la pantalla.

**Por defecto**: Vacío (lo tienes que configurar durante la instalación)

### Idioma de la reunión {#meeting-language}

<!-- **Setting**: `lang` -->

El idioma principal para descargar archivos multimedia. Esto debería coincidir con el idioma que se usa en las reuniones de tu congregación.

**Opciones**: Todos los idiomas disponibles en el sitio web oficial de los testigos de Jehová

**Por defecto**: Inglés (E)

### Idioma de reserva {#fallback-language}

<!-- **Setting**: `langFallback` -->

Un idioma secundario que puedes usar cuando los archivos multimedia no están disponibles en el idioma principal.

**Opciones**: Todos los idiomas disponibles en el sitio web oficial de los testigos de Jehová

**Por defecto**: Ninguno

### Día de la reunión de entre semana {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

El día de la semana en que tienen su reunión de entre semana.

**Opciones**: De domingo a sábado

**Por defecto**: Ninguno (lo tienes que configurar durante la instalación)

### Hora de la reunión de entre semana {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

La hora de inicio de su reunión de entre semana.

**Formato**: HH:MM (formato de 24 horas)

**Por defecto**: Ninguno (lo tienes que configurar durante la instalación)

### Día de la reunión del fin de semana {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

El día de la semana en que tienen su reunión del fin de semana.

**Opciones**: De domingo a sábado

**Por defecto**: Ninguno (lo tienes que configurar durante la instalación)

### Hora de la reunión del fin de semana {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

La hora de inicio de su reunión del fin de semana.

**Formato**: HH:MM (formato de 24 horas)

**Por defecto**: Ninguno (lo tienes que configurar durante la instalación)

### Semana del superintendente de circuito {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

La semana de la próxima visita del superintendente de circuito.

**Formato**: MM/DD/YYYY

**Por defecto**: Ninguno

### Fecha de la Conmemoración {#memorial-date}

<!-- **Setting**: `memorialDate` -->

La fecha de la próxima celebración de la Conmemoración.

**Formato**: MM/DD/YYYY

**Por defecto**: Se obtiene de forma automática periódicamente

### Cambios en el programa de las reuniones {#meeting-schedule-changes}

Estos ajustes te permiten configurar cambios temporales en el programa de tus reuniones:

- **Fecha del cambio**: Cuándo se aplica el cambio
- **Cambio de una sola vez**: Si es un cambio permanente o temporal
- **Nuevo día para la reunión de entre semana**: Un nuevo día para la reunión de entre semana
- **Nueva hora para la reunión de entre semana**: Una nueva hora para la reunión de entre semana
- **Nuevo día para la reunión del fin de semana**: Un nuevo día para la reunión del fin de semana
- **Nueva hora para la reunión del fin de semana**: Una nueva hora para la reunión del fin de semana

### Actualizaciones automáticas del programa de las reuniones {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Cuando lo activas, M³ comprueba periódicamente en el sitio web oficial de los testigos de Jehová si hay cambios en los días y las horas de las reuniones, y actualiza el perfil actual de forma automática.

Esto solo funciona en los perfiles que añadiste usando la búsqueda de congregaciones y a los que no les has cambiado el nombre de la congregación manualmente. Si la sincronización se desactivó porque cambiaste el nombre de la congregación, usa **Activar sincronización del programa** para volver a vincular el perfil.

#### Actualizar el programa de las reuniones {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Sincroniza manualmente el programa de las reuniones actual y futuro con la información del sitio web oficial.

## Obtención y reproducción de archivos multimedia {#media-retrieval-and-playback}

### Conexión de uso medido {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Activa esto si tienes una conexión de datos limitada para reducir el uso del ancho de banda.

**Por defecto**: `false`

### Visualización multimedia {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Activa la característica de visualización multimedia. Esto es necesario para que presentes archivos multimedia en un segundo monitor.

**Por defecto**: `false`

#### Activar la vista previa multimedia {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Muestra una vista previa en vivo de la ventana multimedia mientras se está mostrando una imagen o un video.

**Por defecto**: `true`

#### Comenzar con la reproducción en pausa {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Inicia los videos en pausa cuando comienza la reproducción.

**Por defecto**: `false`

### Música de fondo {#settings-guide-background-music}

#### Activar música {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Activa la característica de música de fondo.

**Por defecto**: `true`

#### Iniciar música automáticamente {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Inicia automáticamente la música de fondo cuando abres M³, si corresponde.

**Por defecto**: `true`

#### Tiempo de margen para detenerla {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Cuántos segundos antes de la hora de inicio de la reunión se detendrá la música de fondo.

**Rango**: 0-300 segundos

**Por defecto**: 60 segundos

#### Volumen de la música {#music-volume}

<!-- **Setting**: `musicVolume` -->

Nivel de volumen para la música de fondo (1-100%).

**Por defecto**: 100%

### Administración de la caché {#cache-management}

#### Activar caché adicional {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Activa el almacenamiento en caché adicional para que tengas un mejor rendimiento.

**Por defecto**: `false`

#### Carpeta de la caché {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Una ubicación personalizada para guardar los archivos multimedia en caché.

**Por defecto**: La ubicación predeterminada del sistema

#### Activar la limpieza automática de la caché {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Borra automáticamente los archivos antiguos en caché para que ahorres espacio en el disco.

**Por defecto**: `true`

### Supervisión de carpetas {#settings-guide-folder-monitoring}

#### Activar supervisor de carpetas {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Vigila una carpeta para ver si hay nuevos archivos multimedia y los añade automáticamente a M³.

**Por defecto**: `false`

#### Carpeta para vigilar {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

La ruta de la carpeta que quieres vigilar por si hay nuevos archivos multimedia.

**Por defecto**: Vacío

## Integraciones {#integrations}

### Integración con Zoom {#settings-guide-zoom-integration}

#### Activar Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Activa las características de integración de las reuniones en Zoom.

**Por defecto**: `false`

#### Atajo para compartir pantalla {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Atajo de teclado para iniciar la opción de compartir pantalla en Zoom.

**Por defecto**: Ninguno

### Integración con OBS Studio {#settings-guide-obs-integration}

#### Activar OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Activa la integración con OBS Studio para el cambio automático de escenas.

**Por defecto**: `false`

:::warning Nota importante

**Se requiere configurar el audio**: La integración con OBS Studio solo se encarga de compartir la pantalla. El audio de los archivos multimedia de M³ **no se transmite automáticamente** a los participantes de Zoom cuando usas OBS Studio. Tienes que configurar los ajustes del Audio original para músicos de Zoom o usar "Compartir sonido de la computadora" para asegurarte de que los participantes de la reunión puedan escuchar los archivos multimedia. Mira la [Guía del usuario](/user-guide#audio-configuration) si quieres ver las instrucciones detalladas sobre cómo configurar el audio.

**Nota**: La integración con Zoom usa la función para compartir pantalla nativa de Zoom, la cual maneja el audio de forma más fluida que la integración con OBS Studio.

:::

#### Puerto de OBS {#obs-port}

<!-- **Setting**: `obsPort` -->

El número de puerto para conectarte al WebSocket de OBS Studio.

**Por defecto**: Ninguno

#### Contraseña de OBS {#obs-password}

<!-- **Setting**: `obsPassword` -->

La contraseña para conectarte al WebSocket de OBS Studio.

**Por defecto**: Ninguno

#### Escenas de OBS {#obs-scenes}

Configura qué escenas de OBS quieres usar para diferentes propósitos:

- **Escena de la cámara**: La escena que muestra la cámara o el atril
- **Escena multimedia**: La escena para mostrar los archivos multimedia
- **Escena de imágenes**: La escena para mostrar imágenes (por ejemplo, una escena PIP que muestre tanto el archivo multimedia como al discursante)

#### Opciones avanzadas de OBS {#obs-advanced-options}

- **Posponer las imágenes**: Retrasa el envío de imágenes a OBS hasta que las inicies manualmente.
- **Interruptor rápido**: Activa el interruptor para encender o apagar rápidamente la integración con OBS.
- **Cambiar de escena después del archivo multimedia**: Vuelve automáticamente a la escena anterior después del archivo multimedia.
- **Recordar la escena anterior**: Recuerda y restaura la escena anterior.
- **Ocultar iconos**: Oculta los iconos relacionados con OBS en la interfaz.
- **Controles de grabación**: Muestra los controles que inician y detienen la grabación de OBS desde M³.

:::warning Nota importante

**Se requiere configurar el audio**: La integración con OBS Studio solo se encarga del video y de cambiar las escenas. El audio de los archivos multimedia de M³ **no se transmite automáticamente** a Zoom ni a OBS. La transmisión de video funciona como una cámara virtual sin sonido, igual que una cámara web. Tienes que configurar los ajustes del Audio original para músicos de Zoom o usar "Compartir sonido de la computadora" para asegurarte de que los participantes de la reunión puedan escuchar los archivos multimedia. Mira la [Guía del usuario](/user-guide#audio-configuration) si quieres ver las instrucciones detalladas sobre cómo configurar el audio.

**Alternativa**: Considera usar la integración con Zoom en su lugar, ya que usa la función nativa de compartir pantalla de Zoom, la cual maneja el audio de forma más fluida.

:::

### Eventos personalizados {#custom-events}

#### Activar eventos personalizados {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Activa atajos personalizados que se ejecutarán cuando se detecte un evento específico (por ejemplo, cuando se reproduce, se pausa o se detiene un archivo multimedia).

**Por defecto**: `false`

#### Atajos de eventos personalizados {#custom-event-shortcuts}

##### Atajo para reproducir un archivo multimedia {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

El atajo que se ejecuta cuando se reproduce un archivo multimedia.

**Por defecto**: Ninguno

##### Atajo para pausar un archivo multimedia {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

El atajo que se ejecuta cuando se pausa un archivo multimedia.

**Por defecto**: Ninguno

##### Atajo para detener un archivo multimedia {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

El atajo que se ejecuta cuando se detiene un archivo multimedia.

**Por defecto**: Ninguno

##### Atajo de la última canción {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

El atajo que se ejecuta cuando se reproduce la última canción durante una reunión.

**Por defecto**: Ninguno

### Grabaciones de las reuniones {#meeting-recordings}

#### Activar la integración con una aplicación de grabación externa {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Deja que M³ controle una aplicación de grabación independiente mediante atajos de teclado. Esto no graba desde adentro de M³; envía los atajos configurados cuando presionas **Empezar grabación** o **Detener grabación** en la ventana emergente de grabaciones de las reuniones.

Esta opción se oculta cuando activas los controles de grabación de OBS. Si usas OBS Studio, usa en su lugar los controles de grabación de OBS en la integración con OBS.

**Por defecto**: `false`

#### Atajos y carpeta de grabación {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configura el atajo de teclado que empieza la grabación, el atajo opcional que detiene la grabación y la carpeta donde la aplicación externa guarda las grabaciones. Si no le indicas un atajo de detención, M³ vuelve a usar el atajo de inicio. Cuando configuras una carpeta, M³ muestra un botón para abrirla.

### Cronómetro de la reunión {#meeting-timer}

#### Activar cronómetro de la reunión {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Activa una ventana separada con un cronómetro para medir el tiempo de las partes de la reunión. Esta es una característica en fase beta y solo la deberías activar si se aprobó localmente.

**Por defecto**: `false`

#### Comportamiento de la ventana del cronómetro {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configura si la ventana del cronómetro se abre automáticamente, si los cronómetros de los participantes cuentan hacia arriba o hacia abajo por defecto, si el reloj usa el formato de 12 horas o de 24 horas, y si el valor actual del cronómetro se muestra en el botón del cronómetro de la isla de acciones.

#### Formatos de visualización del cronómetro {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Elige los formatos de visualización analógica o digital para la hora del día y para la cuenta regresiva de los cronómetros. El indicador de advertencia de la cuenta regresiva puede hacer que el anillo analógico de la cuenta regresiva cambie a un color de advertencia durante el último minuto.

#### Cuenta regresiva de la reunión y estado del programa {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Muestra una cuenta regresiva antes de las reuniones programadas y, opcionalmente, muestra si la reunión va adelantada o atrasada con respecto al programa. La cuenta regresiva de la reunión solo aparece en la pantalla del cronómetro, no en la pantalla principal de visualización multimedia.

#### Apariencia del cronómetro y tiempo extra {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Personaliza el tamaño del texto y los colores del cronómetro, y configura los indicadores de tiempo extra como los colores alternos, el parpadeo y la visualización solo del tiempo extra transcurrido en el modo de conteo hacia arriba.

## Configuración avanzada {#advanced-settings}

### Atajos de teclado {#settings-guide-keyboard-shortcuts}

#### Activar atajos de teclado {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Activa los atajos de teclado personalizables para el control multimedia.

**Por defecto**: `false`

#### Atajos de control multimedia {#media-control-shortcuts}

Configura atajos para la reproducción multimedia:

- **Ventana multimedia**: Abre o cierra la ventana multimedia.
- **Archivo multimedia anterior**: Pasa al archivo multimedia anterior.
- **Siguiente archivo multimedia**: Pasa al siguiente archivo multimedia.
- **Pausar/Reanudar**: Pausa o reanuda la reproducción multimedia.
- **Detener archivo multimedia**: Detiene la reproducción multimedia.
- **Interruptor de música**: Activa o desactiva la música de fondo.

### Visualización multimedia {#media-display}

#### Activar las transiciones de fundido de la ventana multimedia {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Activa las transiciones de aparición/desaparición (fundido) cuando muestres u ocultes la ventana multimedia.

**Por defecto**: `true`

#### Activar el control de la velocidad de reproducción {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Permite que ajustes la velocidad de reproducción del audio y del video desde el menú contextual del archivo multimedia.

**Por defecto**: `false`

#### Ocultar el logo multimedia {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Oculta el logo en la ventana multimedia.

**Por defecto**: `false`

#### Resolución máxima {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

La resolución máxima para los archivos multimedia descargados.

**Opciones**: 240p, 360p, 480p, 720p, 1080p

**Por defecto**: 720p

#### Incluir archivos multimedia impresos {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Incluye archivos multimedia de las publicaciones impresas en las descargas de archivos multimedia.

**Por defecto**: `true`

#### Excluir notas {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Excluye las imágenes de las notas en las descargas de archivos multimedia cuando sea posible.

**Por defecto**: `false`

#### Excluir los videos adicionales del Estudio de La Atalaya {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Excluye los videos adicionales a los que se hace referencia en los párrafos del Estudio de La Atalaya.

**Por defecto**: `false`

#### Excluir los archivos multimedia del folleto Maestros {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Excluye los archivos multimedia del folleto Maestros (th) en las descargas de archivos multimedia.

**Por defecto**: `true`

### Subtítulos {#subtitles}

#### Activar subtítulos {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Activa la compatibilidad de subtítulos para la reproducción multimedia.

**Por defecto**: `false`

#### Idioma de los subtítulos {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

El idioma de los subtítulos (puede ser diferente al idioma del archivo multimedia).

**Opciones**: Todos los idiomas disponibles en el sitio web oficial de los testigos de Jehová

**Por defecto**: Ninguno

### Exportación de archivos multimedia {#settings-guide-media-export}

#### Activar la exportación automática de archivos multimedia {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exporta automáticamente los archivos multimedia a una carpeta que especifiques.

**Por defecto**: `false`

#### Carpeta de exportación de archivos multimedia {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

La ruta de la carpeta donde se exportarán automáticamente los archivos multimedia.

**Por defecto**: Vacío

#### Convertir archivos a MP4 {#convert-files-to-mp4}

**Ajuste**: `convertFilesToMp4`

Convierte los archivos multimedia que exportaste al formato MP4 para que tengan una mejor compatibilidad.

**Por defecto**: `false`

### Transferencia de ajustes del perfil {#profile-settings-transfer}

Exporta los ajustes del perfil actual a un archivo JSON o importa un archivo con los ajustes del perfil que hayas exportado anteriormente. Al importar, se sustituye la configuración del perfil actual.

### Zona de peligro {#danger-zone}

:::warning Advertencia

Solo deberías cambiar estos ajustes si entiendes lo que implican.

:::

#### URL base {#base-url}

<!-- **Setting**: `baseUrl` -->

El dominio base que se usa para descargar publicaciones y archivos multimedia.

**Por defecto**: `jw.org`

#### Desactivar la aceleración de hardware {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Desactiva la aceleración de hardware después de reiniciar M³. Esto te puede ayudar con problemas gráficos o fallos en algunos sistemas, pero por lo general no se recomienda.

**Por defecto**: `false`

#### Ocultar el recordatorio de la aceleración de hardware {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Oculta el recordatorio de volver a activar la aceleración de hardware después de haberla desactivado manualmente.

**Por defecto**: `false`

#### Desactivar la obtención de archivos multimedia {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Desactiva por completo las descargas automáticas de los archivos multimedia. Usa esto solo para perfiles que vayas a usar en eventos especiales o en otras configuraciones personalizadas.

**Por defecto**: `false`

## Consejos para una configuración óptima {#configuration-tips}

### Para los usuarios nuevos {#new-users}

1. Comienza con el asistente de configuración para configurar los ajustes básicos.
2. Activa el "Botón de visualización multimedia" para acceder a las características de presentación.
3. Configura el programa de las reuniones de forma exacta.
4. Configura la integración con OBS si usas reuniones híbridas.

### Para usuarios avanzados {#advanced-users}

1. Usa la supervisión de carpetas para sincronizar los archivos multimedia desde el almacenamiento en la nube.
2. Activa la exportación automática de archivos multimedia para que tengas copias de seguridad.
3. Configura atajos de teclado para que trabajes de forma eficiente.
4. Configura la integración con Zoom para compartir pantalla de forma automática.

### Optimización del rendimiento {#performance-optimization}

1. Activa la caché adicional para tener un mejor rendimiento.
2. Usa la resolución máxima que sea adecuada a tus necesidades.
3. Configura la limpieza automática de la caché para administrar tu espacio en disco.
4. Considera activar el ajuste de conexión de uso medido si tienes un ancho de banda limitado.

### Solución de problemas {#settings-guide-troubleshooting}

- Si los archivos multimedia no se descargan, comprueba la configuración del programa de las reuniones.
- Si la integración con OBS no funciona, verifica la configuración del puerto y la contraseña.
- Si notas que el rendimiento es lento, prueba a activar la caché adicional o a reducir la resolución.
- Si tienes problemas con el idioma, comprueba los ajustes del idioma de la interfaz y también los de los archivos multimedia.
- Si los participantes de Zoom no pueden escuchar el audio del archivo multimedia, configura los ajustes del Audio original para músicos de Zoom o usa "Compartir sonido de la computadora".
- **Consejo**: Considera usar la integración con Zoom en vez de OBS Studio para que manejar el audio te sea más sencillo.

---
tag: Configuration
title: Ajustes
ref: configuration
---

La pantalla de Configuración se divide en 4 secciones. La mayoría de las opciones se explican por sí mismas, pero aquí hay algunos detalles adicionales.

### Configuración de la aplicación

| Ajuste | Explicación |
| ------- | ----------- |
| `Idioma a mostrar` | Establece el idioma en el que se muestra M³. <br><br> ¡Gracias a todos nuestros colaboradores por traducir la aplicación a tantos idiomas! Si desea ayudar a mejorar una traducción existente o agregar una nueva, abra una nueva [discussion]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE). |
| `Carpeta en la que guardar los contenidos multimedia` | Los contenidos de la reunión se guardarán en esta carpeta para compartirlos y usarlos más tarde. |
| `Ejecutar la aplicación al iniciar el sistema` | Si está habilitado, M³ se iniciará cuando el usuario actual inicie sesión en la computadora. <br><br> _**Nota:** no disponible en Linux._ |
| `Iniciar automáticamente la sincronización de contenido multimedia` | Si está habilitada, esta opción iniciará automáticamente una sincronización de contenidos 5 segundos después de que se inicie M³. <br><br> _Para evitar que se produzca la sincronización automática cuando esta configuración está habilitada, presione el botón ⏸ (pausa) antes de que finalice el temporizador de 5 segundos._ |
| `Abrir carpeta después de la sincronización de contenido multimedia` | Cuando está habilitado, la carpeta que contiene los contenidos descargados para la semana elegida se abrirá en el explorador de archivos de la computadora después de que se complete la sincronización de contenidos. |
| `Salir de la aplicación después de la sincronización de la multimedia` | Si está habilitada, esta opción cerrará automáticamente M³ 5 segundos después de que se complete la sincronización de contenidos. <br><br> _Para evitar que M³ se cierre automáticamente cuando esta configuración está habilitada, presione el botón 🏃 (persona saliendo/corriendo) antes de que finalice el temporizador de 5 segundos._ |
| `Habilite el modo de compatibilidad con _OBS Studio_` | Si está habilitada, esta opción accederá a OBS Studio para cambiar escenas automáticamente según sea necesario, tanto antes como después de compartir medios. <br><br> _Si habilita este ajuste, asegúrese de que OBS Studio esté configurado para usar el complemento `obs-websocket`, que es lo que permitirá que M³ se comunique con OBS Studio. <br><br> Además, configure todas las escenas necesarias para compartir contenidos y mostrar la plataforma en OBS. Como mínimo, necesitará una escena con una `Captura de ventana` (recomendada) o `Captura de pantalla` configurada para capturar la ventana de presentación multimedia de M³, o la pantalla en la que se presentarán los contenidos. <br><br> También deberá configurar todas las escenas de vista deseadas de la plataforma, por ejemplo: una toma del atril, un plano general de la plataforma, etc._ |
| `Puerto` | Puerto en el que el complemento `obs-websocket` está configurado para escuchar. |
| `Contraseña` | Contraseña establecida en la configuración del complemento `obs-websocket`. |
| `Escena de vista predeterminada en OBS Studio` | Elija qué escena debe seleccionarse de forma predeterminada cuando se inicia el modo de presentación de contenidos. Por lo general, una vista panorámica de la plataforma o una toma del atril. |
| `Escena de ventana multimedia en OBS Studio` | Seleccione qué escena está configurada en OBS Studio para capturar la ventana multimedia de M³. |
| `Deshabilite la aceleración por hardware` | Solo habilite esta configuración si tiene problemas con el modo de presentación multimedia. Cambiar esta configuración hará que M³ se reinicie. |

### Configuración de sincronización de la congregación

Consulte la sección [Congregation sync]({{page.lang}}/#congregation-sync) para obtener detalles sobre lo que hace exactamente y cómo configurar esta sección.

### Configuración de multimedia

| Ajuste | Explicación |
| ------- | ----------- |
| `Idioma del contenido multimedia` | Seleccione el idioma de su congregación o grupo. Todos los contenidos se descargarán de JW.org en este idioma. |
| `Resolución máxima para videos` | Los videos descargados de JW.org se descargarán con esta resolución o con la siguiente resolución inferior disponible. Útil para situaciones de ancho de banda limitado o bajo. |
| `Convertir multimedia a formato MP4` | Esto convertirá automáticamente todos los archivos de imagen y audio al formato MP4, para usar con la["native MP4 sharing feature"](assets/img/other/zoom-mp4-share.png)de Zoom durante las reuniones de congregación por Zoom **totalmente remotas**. Esto incluye todas las imágenes y archivos multimedia descargados de JW.org, así como archivos multimedia adicionales agregados por el usuario o el Organizador de Videoconferencias. <br><br> _**Nota:** esta opción es más adecuada para reuniones de Zoom de congregación **solo remotas**. Si lleva a cabo reuniones de congregación **híbridas** o **presenciales**, intente usar [Modo de presentación multimedia]({{page.lang}}/#present-media) activando la opción `Habilitar botón para presentar multimedia en un pantalla externa o en una ventana separada` y deshabilite esta opción._ |
| `Mantenga los archivos multimedia originales después de la conversión` | Si esta configuración está habilitada, los archivos de imagen y audio se mantendrán en la carpeta multimedia después de convertirlos al formato MP4, en lugar de eliminarlos. Esto dará como resultado una carpeta de contenidos un poco más desordenada y, por lo general, no es necesario habilitarla si se comparten contenidos a través de Zoom MP4. (Ver `Convertir multimedia a formato MP4` arriba).<br><br> _**Nota:** Solo visible si `Convertir multimedia a formato MP4` también está habilitado._ |
| `Habilitar botón para presentar multimedia en un pantalla externa o en una ventana separada` | Esta configuración le permitirá usar M³ para presentar imágenes, videos y archivos de audio durante reuniones de congregación **híbridas** o **en persona**. Se puede acceder al haciendo clic en el botón ▶️ (reproducir) en la pantalla principal de M³.<br><br> La pantalla de presentación multimedia utilizará automáticamente un monitor externo si está presente; de lo contrario, los medios se mostrarán en una ventana separada de tamaño variable. <br><br> _**Nota:** Esta opción es más adecuada para reuniones de congregación **híbridas** o **presenciales**. <br><br> Si lleva a cabo reuniones por Zoom **solo** de manera remota, intente activar la opción Convertir multimedia a formato MP4 y compartir los medios con el uso compartido nativo de MP4 de Zoom._ |
| `Imagen de fondo para el modo de presentación multimedia` | De forma predeterminada, M³ intentará obtener el texto del año actual en el idioma seleccionado previamente, para mostrarlo sobre un fondo negro cuando esté en [Modo de presentación multimedia]({{page.lang}}/#present-media) y no se esté reproduciendo ningún otro contenido. Si la recuperación automática del texto del año falla por alguna razón, o si desea mostrar una imagen de fondo diferente, puede usar el botón 'Examinar' para seleccionar una imagen personalizada, o el botón 'Actualizar' para intentar recuperar el texto del año automáticamente de nuevo. <br><br> _**Nota:** Si [Sincronización de la congregación]({{page.lang}}/#congregation-sync) está habilitado, al seleccionar una imagen de fondo personalizada, se sincronizará automáticamente para todos los usuarios de sincronización de la congregación._ |
| `Crear listas de reproducción para usar con _VLC_` | Habilite esto si desea generar listas de reproducción para cada reunión automáticamente, que luego se pueden cargar en VLC, si está utilizando esa aplicación para mostrar contenidos en lugar de [Modo de presentación multimedia]({{page.lang}}/#present-media). |
| `Excluir contenido multimedia del folleto _th_` | Si está habilitado, esto evitará que los medios del folleto _Maestros_ se incluyan en cada reunión entre semana. |
| `Excluir imágenes del folleto _lffi_` | Si está habilitado, esto evitará que se incluyan imágenes del folleto _Disfrute de la vida_ (_lffi_), por ejemplo, para las asignaciones de los estudiantes durante la reunión entre semana. |

### Configuración de la reunión

| Ajuste | Explicación |
| ------- | ----------- |
| `Reunión entre semana` | Indicar el día y la hora habituales para la reunión entre semana; se utiliza para nombrar carpetas y atenuación automática de la música de fondo (ver más abajo). |
| `Reunión de fin de semana` | Indicar día y hora habitual para la reunión del fin de semana. |
| `Habilitar botón para reproducir canciones del Reino en modo aleatorio` | Activa un botón en la pantalla principal que reproducirá canciones del Reino de la serie _sjjm_, en orden aleatorio. Esto es útil, por ejemplo, para reproducir canciones antes y después de las reuniones en el Salón del Reino como música de fondo. |
| `Volumen de reproducción de la canción` | Establece el volumen al que se reproducirá la música de fondo. |
| `Dejar de reproducir canciones automáticamente` | Si `Habilitar botón para reproducir canciones del Reino en modo aleatorio` está activo, esta configuración le permitirá especificar un retraso después del cual la música de fondo debe detenerse automáticamente. Esto puede ser: un número determinado de minutos, o un número predeterminado de segundos antes del inicio de la reunión (en el caso de que la música de fondo se haya iniciado antes de la reunión). |

### Capturas de pantalla de la pantalla de configuración

{% include posts/configuration.md lang=site.data.es %}

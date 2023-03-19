---
tag: Uso
title: Modo de presentación multimedia
ref: present-media
---

### Uso del modo de presentación multimedia

Los modos de presentación multimedia y controlador están diseñados para simplificar y evitar errores durante las reuniones.

Una vez que la opción `Habilitar botón para presentar multimedia en un pantalla externa o en una ventana separada` está habilitada, la pantalla de presentación de contenidos aparecerá automáticamente en el monitor externo si está presente, o en una ventana separada, movible y redimensionable si no se detectó un monitor externo.

Cuando esté en modo de espera, la pantalla de presentación multimedia mostrará la imagen de fondo que está configurada en los ajustes. Si no se ha configurado una imagen de fondo, M³ intentará obtener y mostrar automáticamente el texto del año.

Si no se configura una imagen de fondo en la configuración y el texto del año no se puede cargar automáticamente, se mostrará un fondo negro cuando esté en modo de espera.

Se puede acceder al modo de controlador de contenidos haciendo clic en el botón ▶️ (reproducir) en la pantalla principal de M³, o usando el atajo de teclado <kbd>Alt D</kbd> (para pantalla externa).

Una vez que haya ingresado al modo de controlador, la pantalla de selección de carpetas le permitirá seleccionar la fecha para la cual le gustaría mostrar los contenidos. Si existe la carpeta del día actual, se preseleccionará automáticamente. Una vez que se selecciona una fecha, aún puede cambiar la fecha seleccionada en cualquier momento haciendo clic en el botón de selección de fecha, en la sección superior.

### Presentación de contenidos

Para reproducir contenidos, presione el botón ▶️ (reproducir) para el archivo que desea. Para ocultar el contenido, presione el botón ⏹️ (detener). Un video se puede retroceder o avanzar rápidamente mientras está en pausa, si lo desea. Tenga en cuenta que para los videos, el botón de detener debe presionarse **dos veces** para evitar detener accidental y prematuramente un video mientras se reproduce para la congregación. Los videos se detendrán automáticamente cuando se hayan reproducido en su totalidad.

### Características adicionales

M³ tiene algunas características adicionales que se pueden utilizar para mejorar la experiencia de presentación de contenidos.

#### Presentar JW.org

Para mostrar JW.org, puede pulsar el botón ⋮ (ellipsis) en la parte superior de la pantalla y seleccionar `Abrir JW.org`. Esto abrirá una nueva ventana con JW.org cargado. La ventana de contenidos también mostrará JW.org. Ahora puede usar la ventana de controlador para navegar por JW.org, y la ventana de contenidos mostrará sus acciones. Cuando haya terminado de mostrar JW.org, puede cerrar la ventana del controlador y continuar con el modo normal de presentación de contenidos.

#### Zoom y desplazamiento de imágenes

Cuando se muestra una imagen, puede desplazar la rueda del ratón mientras pasa el cursor sobre la vista previa de la imagen para acercarla o alejarla. Alternativamente, también puede hacer doble clic en la vista previa de la imagen para aumentarla. Doble clic alternará entre aumento 1.5x, 2x, 3x, 4x y 1x. También puede arrastrar la imagen para desplazarse por ella.

#### Ordenar la lista de contenidos

La lista de contenidos se puede ordenar haciendo clic en el botón de ordenar en la parte superior derecha de la pantalla. Los elementos multimedia tendrán un botón que aparecerá junto a ellos que puede ser usado para arrastrar el elemento multimedia hacia arriba o hacia abajo en la lista. Cuando esté satisfecho con el orden, puede hacer clic de nuevo en el botón de ordenación para bloquearlo.

#### Añadir una canción en el último minuto

Si necesitas añadir una canción en el último minuto a la lista de contenidos, puedes pulsar el botón `♫ +` (añadir canción) en la parte superior de la pantalla. Un desplegable aparecerá con una lista de todas las canciones del Reino. Cuando seleccione una, se añadirá inmediatamente a la parte superior de la lista de medios y se podrá reproducir al instante. Se reproducirá la canción desde JW.org, o se reproducirá desde la caché local si se descargó previamente.

### Realización de reuniones híbridas utilizando una combinación de M³, OBS Studio y Zoom

Con mucho, la forma más sencilla de compartir medios durante las reuniones híbridas es configurar OBS Studio, M³ y Zoom para que funcionen juntos.

#### Configuración inicial: computadora del Salón del Reino

Establezca la resolución de pantalla del monitor externo en 1280x720, o algo parecido.

Configure la salida de la tarjeta de sonido de la computadora para ir a una de las entradas del mezclador del equipo de sonido y la salida combinada del mezclador del equipo de sonido para ir a la entrada de la tarjeta de sonido de la computadora.

#### Configuración inicial: OBS Studio

Instale OBS Studio o descargue la versión portable.

Si usa la versión portable de OBS Studio, instale el complemento [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) y, si usa la versión portable de OBS Studio, agregue la cámara virtual a Windows haciendo doble clic en el script de instalación proporcionado.

Si tiene OBS Studio v27 o anterior, debe instalar el complemento [obs-websocket](https://github.com/obsproject/obs-websocket). Si su versión de OBS es superior, obs-websocket ya viene instalado. Configure un número de puerto y una contraseña para obs-websocket.

En la configuración de OBS, en `General` > `Bandeja del sistema`, active todas las casillas de verificación. En `Output` > `Streaming`, habilite un codificador de hardware si está disponible. En `Vídeo` > `Resolución base (lienzo)` y `Resolución de salida (escalada)`, elija `1280x720`, y en `Filtro de reducción de escala`, elija `Bilineal`.

Configure al menos 2 escenas: una para la visualización de contenidos (`Captura de ventana` o `Captura de pantalla` con el cursor del ratón deshabilitado y el título de ventana/monitor apropiado seleccionado), y otra para la vista de la plataforma (`Video Capture Device` con la cámara del Salón del Reino seleccionada). También puede añadir otra escena específicamente para las imágenes, donde la ventana de medios es visible junto con la plataforma en una pantalla de tipo imagen en imagen. Puede agregar tantas escenas como sea necesario, con la cámara ajustada, ampliada y recortada según sea necesario (vista de atril, vista de conductor y lector, vista de mesa, etc.).

Habilite el filtro `Ratio de Escalado/Aspecto` en todas las entradas `Captura de Ventana` o `Captura de Visualización`, con una `Resolución` de `Resolución Base (lienzo)`. Esto asegurará que la ventana de medios esté siempre ajustada a la resolución de salida de la cámara virtual.

Agregue un acceso directo a OBS Studio, con el parámetro `--startvirtualcam`, a la carpeta de inicio del perfil de usuario de Windows, para garantizar que OBS Studio se inicie automáticamente cuando el usuario inicie sesión.

#### Configuración inicial: Zoom Salón del Reino

Zoom debe configurarse para usar monitores duales. Habilite los atajos de teclado globales para que Zoom silencie/active el audio del Salón del Reino en Zoom (<kbd>Alt A</kbd>), e inicie/detenga la transmisión de video del Salón del Reino en Zoom (<kbd>Alt V</kbd>).

Configure el "micrófono" predeterminado para que sea la salida combinada del mezclador del equipo de sonido (para que todo lo que se escuche a través del sistema de sonido del Salón del Reino se transmita a través de Zoom, incluidos los micrófonos y los contenidos) y la "cámara" para que sea la cámara virtual proporcionada por OBS Studio.

#### Configuración inicial: M³

Habilite la opción `Habilitar botón para presentar multimedia en una pantalla externa o en una ventana separada`.

Habilite y configure el modo de compatibilidad de OBS Studio, utilizando la información de puerto y contraseña establecida en el paso de configuración de OBS Studio.

#### Comenzando la reunión

Inicie la reunión de Zoom y mueva la ventana secundaria de la reunión de Zoom al monitor externo. Cambie a pantalla completa si lo desea. Aquí es donde se mostrarán los participantes de la reunión remota para que los vea la congregación.

Una vez que se muestra la reunión de Zoom en el monitor externo, abra M³. La ventana de presentación multimedia se abrirá automáticamente sobre Zoom en el monitor externo. Sincronice los contenidos si es necesario e ingrese al modo de controlador de contenidos haciendo clic en el botón ▶️ (reproducir) en la pantalla principal de M³, o <kbd>Alt D</kbd>.

Habilite la transmisión de video del Salón del Reino (<kbd>Alt V</kbd>) y destaque la transmisión de video del Salón del Reino si es necesario, para que los participantes de Zoom vean la plataforma del Salón del Reino. Active el audio del Salón del Reino en Zoom (<kbd>Alt A</kbd>). No debería ser necesario deshabilitar la transmisión de video o audio en Zoom durante la reunión. Asegúrese de que "Sonido original para músicos" está habilitado en Zoom, para conseguir la mejor calidad de audio para los participantes de reuniones remotas.

Inicie la reproducción de música de fondo usando el botón en la parte inferior izquierda, o <kbd>Alt K</kbd>.

#### Transmitiendo partes en persona desde la plataforma del Salón del Reino a través de Zoom

No es necesaria ninguna acción.

Se pueden elegir varios ángulos de cámara/zoom durante la reunión usando el menú en la parte inferior de la ventana de control de reproducción de contenidos de M³; este menú contendrá una lista de todas las escenas de vista de cámara configuradas en OBS.

#### Compartiendo contenidos en el Salón del Reino y por Zoom

Encuentre los contenidos que desea compartir en la ventana de control de reproducción de contenidos de M³ y presione el botón "reproducir".

Cuando haya terminado de compartir contenidos, presione el botón "detener" en M³. Tenga en cuenta que los videos se detienen automáticamente al finalizar.

#### Visualización de participantes remotos de Zoom en el monitor del Salón del Reino

Presione el botón "ocultar/mostrar ventana de presentación de contenidos" en la esquina inferior derecha de la pantalla del controlador de contenidos M³, o <kbd>Alt Z</kbd>, para **ocultar** la ventana de presentación multimedia. La reunión de Zoom ahora será visible en el monitor del Salón del Reino.

> Si el participante tiene contenidos para mostrar, siga los pasos del subtítulo **Compartiendo contenidos en el Salón del Reino y por Zoom**.

Una vez que el participante haya terminado su parte, presione el botón "ocultar/mostrar ventana de presentación de contenidos" en la esquina inferior derecha de la ventana de control de reproducción de contenidos de M³, o <kbd>Alt Z</kbd>, para **mostrar** la ventana de presentación multimedia. El monitor del Salón del Reino ahora mostrará el texto del año.

### Realización de reuniones híbridas utilizando solo M³ y Zoom

Si no desea usar OBS Studio por algún motivo, las siguientes sugerencias quizás lo ayuden a configurar las cosas de la manera más simple posible.

#### Configuración inicial: computadora del Salón del Reino

Igual que la sección correspondiente anterior. Con la adición del atajo de teclado global para Zoom para iniciar/detener el uso compartido de pantalla (<kbd>Alt S</kbd>). La "cámara" será la señal de la cámara del Salón del Reino.

#### Configuración inicial: M³

Habilite la opción `Habilitar botón para presentar multimedia en una pantalla externa o en una ventana separada`.

#### Comenzando la reunión

Igual que la sección correspondiente anterior.

#### Transmitiendo partes en persona desde la plataforma del Salón del Reino a través de Zoom

Igual que la sección correspondiente anterior.

#### Compartiendo contenidos en el Salón del Reino y por Zoom

Comience a compartir en Zoom presionando <kbd>Alt S</kbd>. En la ventana Compartir de Zoom que aparece, elija el monitor externo y habilite ambas casillas de verificación en la parte inferior izquierda (para optimización de sonido y video). El texto del año ahora se compartirá a través de Zoom.

Encuentre los contenidos que desea compartir en la ventana de control de reproducción de contenidos de M³ y presione el botón "reproducir".

Cuando haya terminado de compartir contenidos, presione <kbd>Alt S</kbd> para finalizar el uso compartido de la pantalla de Zoom.

#### Visualización de participantes remotos de Zoom en el monitor del Salón del Reino

Igual que la sección correspondiente anterior.

### Capturas de pantalla del Modo Presentación

{% include screenshots/present-media.html lang=site.data.es %}

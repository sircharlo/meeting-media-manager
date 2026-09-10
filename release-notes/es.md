<!-- markdownlint-disable no-duplicate-heading -->

# Novedades

Para ver la lista completa de cambios entre versiones, consulta nuestro archivo CHANGELOG.md en GitHub.

## PRÓXIMA VERSIÓN

### ✨ Nuevas funciones

- ✨ **Acciones rápidas antes/después de la reunión**: Un nuevo panel con botones grandes ayuda durante los preparativos y justo después de cada reunión: cuenta regresiva en vivo, inicio/detención de música de fondo con un toque, inicio/detención de grabación y una lista de tareas por congregación agrupada en categorías y editable desde Configuración. El panel de antes de la reunión se cierra automáticamente cuando empieza la reunión y se completa la lista de tareas (o después de un breve periodo de gracia), y siempre se puede cerrar manualmente.

## v26.8.0

### ✨ Nuevas funciones

- ✨ **Rediseño de toda la aplicación**: Una amplia actualización visual y de interacción en cuadros de diálogo, lista/encabezado de archivos multimedia, Configuración y Asistente de configuración. El Asistente de configuración ahora muestra una pregunta por pantalla con una barra de progreso. Todos los avisos se reemplazaron por un cuadro de diálogo de marca uniforme, y la selección de intervalos de páginas PDF (para importaciones de publicaciones y mediante arrastrar y soltar) ahora usa un selector con cuadrícula de miniaturas en lugar de un aviso de texto libre. Se añadió un nuevo recorrido de Guía de inicio rápido al terminar el Asistente de configuración. También incluye estilos renovados de tarjetas y encabezados con sombras adaptadas al modo oscuro y varias correcciones de contraste en modo oscuro (etiquetas de campos con foco, porcentajes de progreso de descarga).
- ✨ **Página de Configuración**: Se reorganizó en un diseño de dos paneles, con una nueva sección de Preferencias generales para los controles de actualización automática/beta, que se movieron fuera del cuadro Acerca de (que ahora es solo informativo).
- ✨ **Botón Añadir más archivos multimedia**: Se añadió una opción para elegir exactamente qué secciones de la reunión muestran el botón de acceso rápido "añadir más archivos multimedia", junto con una opción para el modo compacto (solo icono).
- ✨ **Lista de archivos multimedia**: Ahora los elementos muestran esqueletos de carga mientras se añaden en vez de aparecer vacíos; los grupos de archivos multimedia muestran en su insignia la cantidad de elementos ocultos (p. ej., "9 elementos (2 ocultos)"); los elementos secundarios dentro de un grupo se pueden reordenar arrastrando y soltando; y con ventanas muy estrechas los elementos se contraen en fichas compactas con información emergente en vez de saturar la fila.

## v26.7.7

### ✨ Nuevas funciones

- ✨ **Calidad de la vista previa de archivos multimedia**: La vista previa ahora renderiza los fotogramas de video mediante canvas con reducción de escala de alta calidad, corrigiendo vistas previas dentadas o borrosas (sobre todo en contenido con mucho texto, como las canciones). La vista previa también se desactiva automáticamente si tiene que corregir repetidamente el desfase de reproducción en un solo video, con una opción de un clic para volver a activarla.

## v26.7.6

### ✨ Nuevas funciones

- ✨ **Exclusión de videos del EBC**: Se añadió una opción para excluir videos del Estudio bíblico de la congregación de publicaciones específicas (de forma predeterminada, el libro **Seamos valientes al andar con Dios**), con un selector de publicaciones con búsqueda.
- ✨ **Números de página de documentos**: Los listados de importación de Archivos multimedia de publicaciones y JWPUB ahora muestran el número de página de cada documento (o números cuando hay varias páginas) después de su título. Esto puede ayudarte a encontrar rápidamente archivos multimedia específicos cuando sabes el número de página en el que aparecen.

## v26.7.4

### ✨ Nuevas funciones

- ✨ **Recuperación de archivos multimedia faltantes**: Los elementos multimedia cuyo archivo local desapareció (p. ej., eliminado por el borrado automático de caché o quitado manualmente) ahora muestran un botón de reproducción desactivado, la etiqueta "faltante" con el nombre del archivo que hay que buscar y una nueva acción "Localizar archivo" para volver a vincular el elemento con un archivo del disco.
- ✨ **Advertencia de compatibilidad**: Se añadió un aviso que se puede descartar para advertir a los usuarios de combinaciones de sistema operativo/arquitectura que pronto dejarán de ser compatibles (macOS 12 Monterey y Windows de 32 bits), para que actualicen antes de que las futuras actualizaciones de la aplicación requieran sistemas más recientes.

## v26.7.0

### ✨ Nuevas funciones

- ✨ **Reproducción de audio vinculado**: Se añadió compatibilidad para reproducir el audio de un archivo junto con el video de otro archivo. Esto puede ser útil para reproducir presentaciones de video con música de acompañamiento.
- ✨ **Diseños de archivos multimedia supervisados**: Se añadió persistencia para los elementos multimedia supervisados y el orden de las secciones entre carpetas supervisadas. Esto garantiza que la lista de archivos multimedia se muestre de la misma manera incluso cuando la carpeta supervisada se sincroniza entre dispositivos.

## v26 6.1

### ✨ Nuevas funciones

- ✨ **Vista previa de archivos multimedia**: Se añadió una vista previa en vivo superpuesta de los archivos multimedia que se puede activar o desactivar desde la configuración o desde la ventana emergente de pantalla.
- ✨ **Buscar archivos multimedia**: Se añadió un cuadro de búsqueda rápida en la lista de archivos multimedia que te permite encontrar rápidamente archivos por título. Para usarlo, simplemente usa el atajo de teclado estándar para buscar (Ctrl+F o Cmd+F).
- ✨ **Filtrar configuración**: Se añadió un cuadro de filtro a la página de configuración que te permite encontrar opciones por palabra clave o categoría. Para usarlo, simplemente haz clic en el botón Buscar de la esquina superior derecha de la página de configuración o usa el atajo de teclado estándar para buscar (Ctrl+F o Cmd+F).
- ✨ **Advertencia por superposición de música de fondo**: Se añadió una notificación de advertencia cuando se inician archivos multimedia mientras se reproduce música de fondo. Los usuarios pueden elegir detener la música de fondo desde la notificación.

## v26.6

### ✨ Nuevas funciones

- ✨ **Cronómetro**: Se añadieron modos de visualización analógica y estado del informe de tiempos.
- ✨ **Perfiles**: Se añadió la importación y exportación de la configuración de perfiles en la configuración avanzada y el Asistente de configuración.
- ✨ **Ventana de archivos multimedia**: Se añadió compatibilidad para ocultar automáticamente la ventana de archivos multimedia después de la reproducción cuando estaba oculta al principio. Esto resulta práctico, por ejemplo, cuando un orador a distancia quiere mostrar imágenes.

## v26.5.0

### ✨ Nuevas funciones

- ✨ **Importación de PDF**: Se añadió un nuevo flujo de importación de PDF al cuadro de diálogo Archivos multimedia de publicaciones, que permite importar automáticamente la versión PDF de una publicación como imágenes individuales cuando se quiera.

## v26.4.8

### ✨ Nuevas funciones

- ✨ **JW Stream**: Se añadió JW Stream a la lista de sitios web que se pueden duplicar.

## v26.4.0

### ✨ Nuevas funciones

- ✨ **Cronómetro de la reunión**: Se añadió una nueva función de cronómetro de la reunión. Es opcional y, si se desea, se puede activar en la configuración avanzada. El cronómetro se puede usar para que el operador de archivos multimedia controle el tiempo empleado en las partes de la reunión o para mostrar el tiempo empleado en la parte actual en una pantalla exclusiva visible solo para el orador.

## v26.3.0

### ✨ Nuevas funciones

- ✨ **Archivos multimedia de la Conmemoración**: ¡La obtención automática de archivos multimedia de la Conmemoración ya salió de la fase beta! La aplicación descargará automáticamente el video de bienvenida y la imagen de la Conmemoración para mostrarlos durante la Conmemoración, cuando estén disponibles en el idioma configurado.
- ✨ **Velocidad de reproducción**: Se añadió control de velocidad de reproducción con indicador visual y restablecimiento manual. Esta función solo se ve si se activa en la configuración avanzada.
- ✨ **Canciones en pinyin**: Se añadió un control para sustituir canciones por versiones en pinyin en reuniones celebradas en chino.

## v26.2.0

### ✨ Nuevas funciones

- ✨ **Comprobación del espacio en disco**: Se añadió una función para supervisar y avisar cuando queda poco espacio en disco.

## v26.1.5

### ✨ Nuevas funciones

- ✨ **Archivos multimedia de la Conmemoración**: Obtiene automáticamente la imagen de la Conmemoración y el video de introducción en los idiomas compatibles cuando se selecciona la fecha de la Conmemoración.

## v26.1.0

### ✨ Nuevas funciones

- ✨ **Sincronización automática del programa de reuniones**: Se añadió la posibilidad de sincronizar automáticamente las fechas y horas de las reuniones con el sitio web oficial. Esta función está activada de forma predeterminada y puede iniciarse manualmente o desactivarse en la configuración avanzada.
- ✨ **Cambios futuros del programa**: La aplicación ahora incluye cambios futuros del programa al crear una congregación mediante la búsqueda del sitio web, si están disponibles.
- ✨ **Caché compartida para instalaciones en todo el equipo**: Las instalaciones para todo el equipo ahora comparten de forma predeterminada una carpeta de datos común, optimizando el uso de almacenamiento y ancho de banda entre varios usuarios de la misma computadora.

## v25.12.2

### ✨ Nuevas funciones

- ✨ **Botones de zoom/desplazamiento**: Se añadió la posibilidad de mantener presionados los botones de zoom y desplazamiento para un ajuste continuo.

## v25.12.0

### ✨ Nuevas funciones

- ✨ **Menú contextual de selección múltiple**: Se añadió compatibilidad con acciones del menú de clic derecho cuando hay varios archivos multimedia seleccionados.
- ✨ **Atajos de teclado**: Se añadió `Ctrl/Cmd+A` para seleccionar todos los archivos multimedia, `H` para ocultar los seleccionados y `Shift+Up/Down` para navegar por la selección con el teclado.
- ✨ **Configuración de videos del Estudio de La Atalaya**: Se añadió una opción para excluir videos adicionales del Estudio de La Atalaya.
- ✨ **Secciones contraíbles**: Se añadió la posibilidad de contraer secciones en días sin reunión para tener una vista más limpia.
- ✨ **Sitio web JW Events**: Se añadió la posibilidad de presentar el sitio web JW Events además del sitio web oficial principal.
- ✨ **Personalización de la importación de listas de reproducción**: Se añadió la posibilidad de personalizar el prefijo que se añade a los archivos multimedia al importar listas de reproducción de JW.
- ✨ **Navegación al duplicar el sitio web**: Se añadió un control para ir automáticamente a la lista de archivos multimedia después de detener la duplicación del sitio web.
- ✨ **Controles de grabación de OBS**: Se añadió la posibilidad de controlar las grabaciones de OBS.
- ✨ **Vista previa del texto del año**: Se añadió la posibilidad de previsualizar el texto del año siguiente a partir de diciembre de cada año.
- ✨ **Notificaciones de actualización**: Se añadieron notificaciones de advertencia si se ejecuta una versión beta o si las actualizaciones están desactivadas, y se mejoró la visualización del progreso de descarga de actualizaciones.
- ✨ **Configuración de aceleración por hardware**: Se añadió una opción para desactivar permanentemente la aceleración por hardware si hace falta.

## v25.11.0

### ✨ Nuevas funciones

- ✨ **Selección de archivos multimedia JWPUB**: Se añadió una forma de seleccionar archivos multimedia individuales de archivos JWPUB.
- ✨ **Enfoque automático de la ventana de archivos multimedia**: Se añadió una opción para enfocar automáticamente la ventana de archivos multimedia después de compartir pantalla en Zoom.
- ✨ **Superposición del cursor para la pantalla de TV**: Se mejoró la superposición del cursor en la ventana del sitio web para que el puntero del mouse se vea mejor en las pantallas de TV.
- ✨ **Grabación de reuniones**: Se añadió una nueva función de grabación de reuniones para controlar una aplicación de grabación externa.
- ✨ **Búsqueda en el sitio**: Se añadió la posibilidad de buscar archivos multimedia o publicaciones en el sitio mediante búsqueda inteligente.
- ✨ **Importación manual sencilla de publicaciones**: Se añadió una función para importar fácilmente publicaciones de JW.org, como revistas, libros, programas e invitaciones.
- ✨ **Mejoras para lenguaje de señas**: Se añadió confirmación antes de reproducir archivos completos para lenguajes de señas y compatibilidad para seleccionar varios clips, por ejemplo, cuando se deben leer varios párrafos consecutivamente.
- ✨ **Navegación entre clips**: Se añadió la duración a los elementos de la lista de clips y se mejoró la navegación entre clips.
- 🛠️ **Presentación de archivos multimedia**: Se aseguró que la presentación de archivos multimedia se haga visible al iniciar la reproducción, incluso si antes estaba oculta.

## v25.10.1

### ✨ Nuevas funciones

- ✨ **Asistente de configuración – Paso de Zoom**: Se añadió un paso de integración con Zoom al asistente de configuración para facilitar la configuración inicial.
- ✨ **Mejoras del selector de pantalla**: La ventana emergente de pantalla ahora muestra una representación visual precisa de todas las pantallas, además del tamaño y la ubicación actuales de la ventana principal. Esto facilita elegir la pantalla correcta en la que se debe mostrar la ventana de archivos multimedia.
- ✨ **Preferencia de la ventana de archivos multimedia**: La aplicación ahora recordará la pantalla preferida en la que debe mostrarse la ventana de archivos multimedia, si el usuario la especifica.

## v25.10.0

### ✨ Nuevas funciones

- ✨ **Iniciar reproducción en pausa**: Se añadió una nueva opción para permitir que la reproducción empiece en pausa, lo que puede ser útil para que los operadores de audio y video preparen su configuración (por ejemplo, iniciar la pantalla compartida de Zoom) antes de que empiecen a reproducirse los archivos multimedia en la ventana.
- ✨ **Notificaciones de actualización**: Ahora se avisará a los usuarios de las actualizaciones mediante un banner dentro de la aplicación, que también permitirá instalarlas de inmediato en vez de esperar al siguiente reinicio de la aplicación.
- ✨ **Eventos personalizados**: Se añadieron eventos opcionales que pueden activar atajos de teclado cuando se detectan determinados eventos. Esto puede ser útil para que los operadores de audio y video ejecuten automáticamente acciones fuera de la aplicación. Por ejemplo, se podrían encender y apagar luces inteligentes antes y después de reproducir archivos multimedia en auditorios donde se usan proyectores; o se podría ejecutar un script después de reproducir la última canción de una reunión para automatizar diversas acciones en una reunión de Zoom.

## v25.9.1

### ✨ Nuevas funciones

- ✨ **Ventana de archivos multimedia siempre encima y comportamiento de pantalla completa**: Se corrigió y mejoró el comportamiento de mantener siempre encima la ventana de archivos multimedia, ajustándolo dinámicamente según el estado de pantalla completa.
- ✨ **Configuración del formato de fecha**: Se añadió una opción para que el usuario configure el formato de visualización de la fecha.
- ✨ **Fundido cruzado de archivos multimedia**: Se implementaron transiciones de fundido cruzado para la presentación de archivos multimedia en lugar de la transición más brusca de fundido a negro que había antes.
- ✨ **Detención automática de música**: Se optimizó el comportamiento de la detención automática de la música de fondo para que sea el mismo tanto si la música se inició automáticamente como si no
- ✨ **Clic en ventanas inactivas de macOS**: Se habilitó el paso de clics del mouse a la ventana principal en macOS, lo que debería facilitar controlar la aplicación incluso cuando no tiene el foco.

## v25.9.0

### ✨ Nuevas funciones

- ✨ **Mejoras de la ventana emergente de descargas**: Se añadió un botón de actualización y agrupación de descargas por fecha en la ventana emergente de descargas.
- ✨ **Memoria del orden de archivos multimedia supervisados**: Se añadió memoria del orden de las secciones para elementos multimedia supervisados.

## v25.8.3

### ✨ Nuevas funciones

- ✨ **Transiciones de fundido de la ventana de archivos multimedia**: Se añadió una nueva opción avanzada para que la ventana de archivos multimedia aparezca y desaparezca gradualmente, ofreciendo transiciones visuales más suaves.
- ✨ **Control de duración de imágenes y seguimiento del progreso**: Se añadieron funciones para controlar la duración de imágenes y seguir el progreso en secciones repetidas.

## v25.8.1

### ✨ Nuevas funciones

- ✨ **Secciones personalizadas de archivos multimedia**: Sistema completo para crear, editar y administrar secciones personalizadas de archivos multimedia con personalización de color y reordenación mediante arrastrar y soltar.
- ✨ **Separadores de archivos multimedia**: Añade separadores con título dentro de las listas de archivos multimedia para organizarlas mejor, con opciones de colocación arriba/abajo.
- ✨ **Modo de repetición de sección**: Activa la reproducción continua dentro de secciones específicas para repetir archivos multimedia sin interrupciones.
- ✨ **Integración con Zoom**: Coordinación automática del inicio y detención de la pantalla compartida con la reproducción de archivos multimedia.

## v25.7.0

### ✨ Nuevas funciones

- ¡No hay funciones nuevas en esta versión!

## 25.6.0

### ✨ Nuevas funciones

- ✨ **Configuración de conexión de uso medido**: Se añadió una nueva opción para reducir el uso de ancho de banda de descarga en conexiones de uso medido.
- ✨ **Mejor manejo de archivos multimedia transmitidos**: Mejor compatibilidad con archivos multimedia transmitidos, reduciendo problemas relacionados con la latencia.

## 25.5.0

### ✨ Nuevas funciones

- 🖼️ **Opción de retraso de OBS para imágenes**: Añadir una opción de OBS Studio para retrasar los cambios de escena al mostrar imágenes y mejorar las transiciones.
- 🔊 **Compatibilidad con el formato de audio `.m4a`**: Añadir compatibilidad con archivos de audio `.m4a` para ampliar los tipos de archivos multimedia admitidos.

## 25.4.0

### ✨ Nuevas funciones

- 🇵🇭 **Nuevo idioma: tagalo**: Se añadió compatibilidad con el tagalo, ampliando las capacidades multilingües de la aplicación.
- 🎞 **Compatibilidad con el formato de video `.m4v`**: Ahora se admite la reproducción de archivos `.m4v` para mejorar la compatibilidad multimedia.

## 25.3.1

### ✨ Nuevas funciones

- 🌏 **Nuevo idioma: coreano**: Añadir compatibilidad con el idioma coreano para que la aplicación sea accesible a más usuarios.

## 25.3.0

### ✨ Nuevas funciones

- 🎵 **Reproducir música de fondo con videos**: Permitir que la música de fondo siga reproduciéndose mientras se muestran videos.
- 🎥 **Señal de cámara para archivos multimedia en lenguaje de señas**: Añadir la posibilidad de mostrar una señal de cámara en la ventana de archivos multimedia específicamente para usuarios de lenguaje de señas.
- 📅 **Fecha y fondo automáticos de la Conmemoración**: Detectar y establecer automáticamente la fecha de la Conmemoración y preparar la imagen de fondo de la Conmemoración.
- 📜 **Mostrar notas de la versión en la aplicación**: Mostrar las notas de la versión directamente en la aplicación para que los usuarios puedan revisar fácilmente los cambios después de una actualización.

## 25.2.1

### ✨ Nuevas funciones

- 🔄 **Permitir intentos de reconexión con OBS**: Introducir la posibilidad de forzar manualmente la reconexión de OBS cuando haga falta.
- 🗑 **Limpieza automática de carpetas de exportación antiguas por fecha**: Quitar automáticamente las carpetas de exportación antiguas por fecha para mantener organizado el almacenamiento.

## 25.2.0

### ✨ Nuevas funciones

- 🌍 **Usar de forma predeterminada la configuración regional del sistema**: Detectar y usar automáticamente la configuración regional del sistema para ofrecer una experiencia más personalizada.
- 🏷 **Compatibilidad con etiquetas para archivos multimedia exportados**: Añadir etiquetas de metadatos a los archivos multimedia exportados para organizarlos mejor.
- 🔄 **Cambio automático de beta a estable**: Permitir el cambio automático de versiones beta a versiones estables cuando sea necesario.
- 🌐 **Obtener los índices de idioma MEPS más recientes**: Obtener los índices de idioma MEPS más recientes directamente del sitio web oficial para mantener actualizada la compatibilidad con idiomas.

## 25.1.0

### ✨ Nuevas funciones

- 📅 **Abrir fechas anteriores**: Permitir abrir fechas anteriores de la semana actual, lo que resulta útil cuando el día de la reunión se mueve a una fecha posterior de la semana.
- 🛑 **Banner de error para OBS Studio**: Añadir un banner de error cuando OBS Studio no esté conectado en un día de reunión, para asegurarse de que los usuarios reciban el aviso.
- 📚 **Agrupar archivos multimedia por publicación**: Agrupar los archivos multimedia de la misma publicación citada para tener un resumen más limpio y organizado.
- 🎵 **Advertencia de canción duplicada**: Mostrar una advertencia si hay canciones más de una vez en la lista de archivos multimedia de las reuniones del fin de semana.
- 🔄 **Planificación de futuros cambios de programa**: Permitir planificar cambios futuros en el programa de reuniones, lo que resulta útil para cambios anuales de programa o para la visita del superintendente de circuito a una congregación vecina.

## 24.11.0

### ✨ Nuevas funciones

- 🖥️ **Presentación del sitio web en macOS**: Ahora se puede presentar el sitio web en macOS 🚀
- ⌨️ **Atajos de teclado de reproducción**: Se añadieron atajos de teclado para detener, pausar y reanudar la reproducción de archivos multimedia 🚀
- 🌐 **Dirección personalizada de descarga de archivos multimedia**: Se añadió compatibilidad para establecer la dirección web desde la que se deben descargar los archivos multimedia 🚀
- 🎬 **Selector instantáneo de escenas de OBS**: Se añadió un selector instantáneo de escenas de OBS Studio y se renovó por completo la función de selección de escenas en la configuración
- 📖 **Más idiomas de documentación**: Se amplió el sitio web de documentación para admitir más idiomas

## 24.10.10

### ✨ Nuevas funciones

- ⌨️ **Atajos para navegar por archivos multimedia**: Se añadieron atajos de teclado para ir al archivo multimedia siguiente/anterior
- 🖱️ **Menú de clic derecho de archivos multimedia**: Se añadió un menú de clic derecho a los archivos multimedia para ocultarlos y cambiarles el nombre
- ✂️ **Importación recortada de listas JWL**: Ahora se respetan los tiempos recortados de los videos en las listas de reproducción JWL importadas

## 24.10.9

### ✨ Nuevas funciones

- 🗑️ **Eliminar archivos multimedia adicionales de un día**: Se añadió una opción para eliminar todos los archivos multimedia adicionales del día seleccionado actualmente

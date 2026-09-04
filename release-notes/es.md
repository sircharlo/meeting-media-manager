<!-- markdownlint-disable no-duplicate-heading -->

# Lo nuevo

Para ver la lista completa de cambios entre versiones, mira nuestro archivo CHANGELOG.md en GitHub.

## PRÓXIMA VERSIÓN

### ✨ Nuevas características

- ✨ **Acciones rápidas antes y después de la reunión**: Un nuevo panel de botones grandes te ayuda con los preparativos previos y justo después de cada reunión: una cuenta regresiva en vivo, iniciar/detener música de fondo con un solo toque, iniciar/detener la grabación, y una lista de verificación por congregación agrupada en categorías y que puedes editar desde la Configuración. El panel anterior a la reunión se cierra automáticamente cuando esta comienza y la lista de verificación está completa (o después de un corto período de gracia), y siempre lo puedes cerrar de forma manual.

## v26.8.0

### ✨ Nuevas características

- ✨ **Rediseño en toda la aplicación**: Una amplia renovación visual y de interacción en los diálogos, la lista y el encabezado de los archivos multimedia, la Configuración y el Asistente de configuración. El Asistente de configuración ahora es un flujo de una pregunta por pantalla con una barra de progreso. Todos los mensajes emergentes se cambiaron por un diálogo uniforme, y la selección del rango de páginas en PDF (para importaciones de publicaciones y de arrastrar y soltar) ahora usa un selector de cuadrícula de miniaturas en lugar de un cuadro de texto libre. Añadimos un nuevo recorrido de la Guía de inicio rápido después de que termina el Asistente de configuración. También incluye un nuevo estilo de tarjetas y encabezados con sombras adaptadas al modo oscuro y varias correcciones de contraste en el modo oscuro (etiquetas de campos enfocados, porcentajes del progreso de descarga).
- ✨ **Página de configuración**: Reestructurada en un diseño de dos paneles, con una nueva sección global de Preferencias para los interruptores de actualización automática y de versiones beta que se movió fuera del diálogo "Acerca de" (el cual ahora es puramente informativo).
- ✨ **Botón para añadir más multimedia**: Añadimos un ajuste para que elijas exactamente qué partes de la reunión muestran el botón de atajo para añadir más archivos multimedia, además de un ajuste para un modo compacto (solo con icono).
- ✨ **Lista de archivos multimedia**: Los elementos ahora muestran esqueletos de carga mientras se añaden en lugar de aparecer vacíos, los grupos de archivos multimedia muestran un recuento de elementos ocultos en su insignia (por ejemplo, "9 elementos [2 ocultos]"), los elementos secundarios dentro de un grupo se pueden reordenar al arrastrar y soltar, y en anchos de ventana muy reducidos los elementos se colapsan en fichas compactas con información sobre herramientas en lugar de amontonarse en la fila.

## v26.7.7

### ✨ Nuevas características

- ✨ **Calidad de vista previa de los archivos multimedia**: La vista previa de los archivos multimedia ahora renderiza los fotogramas de video a través de un lienzo con reducción de alta calidad, corrigiendo las previsualizaciones dentadas o borrosas (especialmente en contenido con mucho texto como las canciones). La vista previa también se desactiva automáticamente si tiene que corregir repetidamente el desfase de reproducción en un solo video, con una forma de volver a activarla con un solo clic.

## v26.7.6

### ✨ Nuevas características

- ✨ **Exclusión de videos del Estudio bíblico de la congregación**: Añadimos un ajuste para excluir los videos del Estudio bíblico de la congregación de publicaciones específicas (por defecto el libro **Anda con valor con Dios**), con un selector de publicaciones en el que puedes buscar.
- ✨ **Números de página de los documentos**: Las listas de importación de archivos multimedia de publicaciones y JWPUB ahora muestran el número de página de cada documento (o números cuando hay varias páginas) después de su título. Esto te puede ayudar a encontrar rápidamente un archivo multimedia específico cuando sabes el número de página en el que se encuentra.

## v26.7.4

### ✨ Nuevas características

- ✨ **Recuperación de archivos multimedia faltantes**: Los archivos multimedia cuyo archivo local desapareció (por ejemplo, al eliminarse por la limpieza automática de la caché, o al eliminarse manualmente) ahora muestran un botón de reproducción desactivado, una leyenda que dice "falta" nombrando el archivo a buscar, y una nueva acción de "Localizar archivo" para que vuelvas a vincular el elemento a un archivo en tu disco.
- ✨ **Advertencia de compatibilidad**: Añadimos un aviso que puedes descartar para advertir a los usuarios sobre las combinaciones de sistema operativo y arquitectura que pronto dejarán de ser compatibles (macOS 12 Monterey y Windows de 32 bits) para que actualices antes de que las futuras actualizaciones de Meeting Media Manager requieran compatibilidad con sistemas más nuevos.

## v26.7.0

### ✨ Nuevas características

- ✨ **Reproducción de audio vinculado**: Añadimos compatibilidad para que reproduzcas el audio de un archivo junto con el video de otro archivo. Esto te puede ser útil para reproducir presentaciones de video con música de acompañamiento.
- ✨ **Diseños de archivos multimedia vistos**: Añadimos persistencia para los elementos multimedia vistos y el orden de las secciones en las carpetas vigiladas. Esto asegura que la lista de archivos multimedia se muestre de la misma manera incluso cuando la carpeta vigilada se sincroniza en varios dispositivos.

## v26 6.1

### ✨ Nuevas características

- ✨ **Vista previa de los archivos multimedia**: Añadimos una superposición de vista previa multimedia en vivo que puedes activar o desactivar desde la configuración o desde la ventana emergente de visualización.
- ✨ **Buscar archivos multimedia**: Añadimos un cuadro de búsqueda rápida en la lista de archivos multimedia que te permite encontrar rápidamente los archivos por su título. Para usarlo, simplemente usa el atajo de teclado estándar para buscar (Ctrl+F o Cmd+F).
- ✨ **Filtrar configuración**: Añadimos un cuadro de filtro a la página de configuración que te permite encontrar los ajustes por palabra clave o categoría. Para usarlo, simplemente haz clic en el botón de Buscar en la esquina superior derecha de la página de configuración, o usa el atajo de teclado estándar para buscar (Ctrl+F o Cmd+F).
- ✨ **Advertencia de superposición de música de fondo**: Añadimos una notificación de advertencia cuando se inicia un archivo multimedia mientras se está reproduciendo música de fondo. Puedes elegir detener la música de fondo desde la notificación.

## v26.6

### ✨ Nuevas características

- ✨ **Cronómetro**: Añadimos modos de visualización analógica y el estado del informe de tiempo.
- ✨ **Perfiles**: Añadimos la importación y exportación de la configuración de perfiles en la Configuración avanzada y en el Asistente de configuración.
- ✨ **Ventana multimedia**: Añadimos compatibilidad para ocultar automáticamente la ventana multimedia después de la reproducción si estaba oculta inicialmente. Esto es práctico cuando un orador remoto quiere mostrar imágenes, por ejemplo.

## v26.5.0

### ✨ Nuevas características

- ✨ **Importación de PDF**: Añadimos un nuevo flujo de importación de PDF al diálogo de Archivos multimedia de publicaciones, lo que permite que la versión en PDF de una publicación se importe automáticamente como imágenes individuales cuando lo desees.

## v26.4.8

### ✨ Nuevas características

- ✨ **JW Stream**: Añadimos JW Stream a la lista de sitios web que se pueden reflejar.

## v26.4.0

### ✨ Nuevas características

- ✨ **Cronómetro de la reunión**: Se ha añadido una nueva característica de cronómetro para la reunión. Es opcional y lo puedes activar en la configuración avanzada, si lo deseas. El cronómetro se puede usar para permitir que el operador de audio y video lleve un registro del tiempo dedicado a las partes de la reunión, o para mostrar el tiempo dedicado a la parte actual de la reunión en una pantalla dedicada visible solo para el discursante.

## v26.3.0

### ✨ Nuevas características

- ✨ **Archivos multimedia para la Conmemoración**: ¡La descarga automática de los archivos multimedia para la Conmemoración ya no está en fase beta! La aplicación descargará automáticamente el video de bienvenida y la imagen que se mostrará durante la Conmemoración, cuando estén disponibles en el idioma configurado.
- ✨ **Velocidad de reproducción**: Añadimos control de velocidad de reproducción con indicador visual, y restablecimiento manual. Esta característica solo es visible si la activas en la configuración avanzada.
- ✨ **Canciones en pinyin**: Añadimos un interruptor para sustituir las canciones por versiones en pinyin para las reuniones que se hacen en chino.

## v26.2.0

### ✨ Nuevas características

- ✨ **Comprobación de espacio en disco**: Añadimos la función de supervisar y notificar cuando el espacio en disco es bajo.

## v26.1.5

### ✨ Nuevas características

- ✨ **Archivos multimedia para la Conmemoración**: Descarga automáticamente el cartel y el video de introducción de la Conmemoración en los idiomas compatibles cuando seleccionas la fecha de la Conmemoración.

## v26.1.0

### ✨ Nuevas características

- ✨ **Sincronización automática del programa de las reuniones**: Añadimos la capacidad de sincronizar automáticamente las fechas y horas de las reuniones con el sitio web oficial. Esta característica viene activada por defecto y la puedes iniciar de forma manual o desactivar en la configuración avanzada.
- ✨ **Cambios futuros en el programa**: La aplicación ahora incluye los cambios futuros en el programa al crear una congregación usando la búsqueda en el sitio web, si están disponibles.
- ✨ **Caché compartida para instalaciones en todo el equipo**: Las instalaciones en todo el equipo ahora comparten una carpeta de datos común por defecto, lo que optimiza el almacenamiento y el uso del ancho de banda entre varios usuarios en la misma computadora.

## v25.12.2

### ✨ Nuevas características

- ✨ **Botones de acercar/desplazar**: Añadimos la capacidad de mantener presionados los botones de acercar y desplazar para un ajuste continuo.

## v25.12.0

### ✨ Nuevas características

- ✨ **Menú contextual de selección múltiple**: Añadimos compatibilidad para las acciones del menú al hacer clic derecho cuando seleccionas varios archivos multimedia.
- ✨ **Atajos de teclado**: Añadimos `Ctrl/Cmd+A` para seleccionar todos los archivos multimedia, `H` para ocultar los archivos multimedia seleccionados, y `Shift+Up/Down` para navegar por la selección con el teclado.
- ✨ **Configuración de los videos del Estudio de La Atalaya**: Añadimos un ajuste para excluir los videos adicionales del Estudio de La Atalaya.
- ✨ **Secciones contraíbles**: Añadimos la capacidad de contraer secciones en los días que no hay reunión para tener una vista más limpia.
- ✨ **Sitio web de JW Events**: Añadimos la capacidad de presentar el sitio web de JW Events además del sitio web oficial principal.
- ✨ **Personalización de la importación de listas de reproducción**: Añadimos la capacidad de personalizar el prefijo que se añade a los archivos multimedia al importar listas de reproducción de JW.
- ✨ **Navegación reflejada del sitio web**: Añadimos un interruptor para navegar automáticamente a la lista de archivos multimedia después de detener el reflejo del sitio web.
- ✨ **Controles de grabación de OBS**: Añadimos la capacidad de controlar las grabaciones de OBS.
- ✨ **Vista previa del texto del año**: Añadimos la capacidad de ver una vista previa del texto del año próximo a partir de diciembre de cada año.
- ✨ **Notificaciones de actualización**: Añadimos notificaciones de advertencia si estás usando una versión beta o si las actualizaciones están desactivadas, y mejoramos cómo se ve el progreso de descarga de las actualizaciones.
- ✨ **Configuración de aceleración de hardware**: Añadimos una opción para desactivar permanentemente la aceleración de hardware si lo necesitas.

## v25.11.0

### ✨ Nuevas características

- ✨ **Selección de archivos multimedia JWPUB**: Añadimos una forma de seleccionar archivos multimedia individuales desde archivos JWPUB.
- ✨ **Autoenfoque de la ventana multimedia**: Añadimos un ajuste opcional para enfocar automáticamente la ventana multimedia después de compartir pantalla en Zoom.
- ✨ **Superposición de cursor para pantalla de televisión**: Mejoramos la superposición del cursor de la ventana del sitio web para que el cursor del ratón se vea mejor en las pantallas de televisión.
- ✨ **Grabación de la reunión**: Añadimos una nueva característica de grabación de la reunión para controlar una aplicación de grabación externa.
- ✨ **Búsqueda en el sitio**: Añadimos la capacidad de buscar archivos multimedia o publicaciones en el sitio usando búsqueda inteligente.
- ✨ **Importación manual sencilla de publicaciones**: Añadimos la característica para importar fácilmente publicaciones de JW.org, como revistas, libros, programas e invitaciones.
- ✨ **Mejoras para el lenguaje de señas**: Añadimos una confirmación antes de reproducir archivos completos para los lenguajes de señas y compatibilidad para seleccionar varios fragmentos, como por ejemplo cuando se van a leer varios párrafos seguidos.
- ✨ **Navegación de fragmentos**: Añadimos la visualización de la duración en los elementos de la lista de fragmentos y mejoramos la navegación de los mismos.
- 🛠️ **Visualización multimedia**: Nos aseguramos de que la visualización multimedia aparezca cuando empiece la reproducción, aunque estuviera oculta antes.

## v25.10.1

### ✨ Nuevas características

- ✨ **Asistente de configuración – Paso de Zoom**: Añadimos un paso de integración con Zoom al asistente de configuración para que la configuración inicial sea más fácil.
- ✨ **Mejoras en el selector de pantalla**: Mostramos una representación visual precisa de todas las pantallas, así como el tamaño y la ubicación actuales de la ventana principal, en la ventana emergente de visualización. Esto hace que sea más fácil elegir la pantalla correcta en la que se debe mostrar la ventana multimedia.
- ✨ **Preferencia de la ventana multimedia**: La aplicación ahora recordará la pantalla preferida en la que se debe mostrar la ventana multimedia, si así lo especificas.

## v25.10.0

### ✨ Nuevas características

- ✨ **Comenzar con la reproducción en pausa**: Añadimos un nuevo ajuste para permitir que la reproducción comience en pausa, lo cual te puede ser útil como operador de audio y video para preparar tu configuración (como iniciar la transmisión en Zoom) antes de que el archivo multimedia comience a reproducirse en la ventana multimedia.
- ✨ **Notificaciones de actualización**: Ahora te avisaremos sobre las actualizaciones mediante un cartel dentro de la aplicación, el cual también te permitirá instalar las actualizaciones de inmediato, en vez de esperar a que reinicies la aplicación.
- ✨ **Eventos personalizados**: Añadimos enlaces de eventos opcionales que pueden activar atajos de teclado cuando se detectan ciertos eventos. Esto te puede ser útil como operador de audio y video para ejecutar acciones automáticamente fuera de la aplicación. Por ejemplo, las luces inteligentes se pueden encender y apagar antes y después de que los archivos multimedia se reproduzcan en auditorios donde se usan proyectores; o se puede ejecutar un script después de que se haya reproducido la última cancion de una reunión para automatizar varias acciones en una reunión de Zoom.

## v25.9.1

### ✨ Nuevas características

- ✨ **Ventana multimedia siempre visible y comportamiento en pantalla completa**: Corregimos y mejoramos el comportamiento de mantener siempre visible la ventana multimedia, ajustándose dinámicamente según el estado de la pantalla completa.
- ✨ **Ajuste del formato de visualización de fecha**: Añadimos un ajuste para que puedas configurar el formato en el que se muestran las fechas.
- ✨ **Fundido cruzado multimedia**: Implementamos transiciones de fundido cruzado para la visualización multimedia, en vez de la transición de fundido a negro más brusca que había antes.
- ✨ **Detención automática de la música**: Optimizamos el comportamiento de la detención automática de la música de fondo para que se comporte igual sin importar si la música se inició de forma automática o no.
- ✨ **Paso de clics en macOS en ventanas inactivas**: Activamos el paso de clics del ratón en la ventana principal para macOS, lo que te facilitará el control de Meeting Media Manager incluso cuando no esté seleccionada.

## v25.9.0

### ✨ Nuevas características

- ✨ **Mejoras en la ventana emergente de descargas**: Añadimos un botón para actualizar y agrupamos las descargas por fecha en la ventana emergente de descargas.
- ✨ **Memoria del orden de los archivos multimedia vistos**: Añadimos memoria para el orden de las secciones en los archivos multimedia que ya viste.

## v25.8.3

### ✨ Nuevas características

- ✨ **Transiciones de fundido de la ventana multimedia**: Añadimos un nuevo ajuste avanzado para que la ventana multimedia aparezca y desaparezca con un fundido, logrando transiciones visuales más suaves.
- ✨ **Control de la duración de las imágenes y seguimiento del progreso**: Añadimos control de duración para las imágenes y funciones para seguir el progreso de las secciones repetidas.

## v25.8.1

### ✨ Nuevas características

- ✨ **Secciones multimedia personalizadas**: Un sistema completo para que crees, edites y administres secciones multimedia personalizadas, con personalización de colores y reordenamiento con arrastrar y soltar.
- ✨ **Separadores de archivos multimedia**: Añade separadores con título dentro de las listas de archivos multimedia para que te organices mejor, con opciones para colocarlos arriba o abajo.
- ✨ **Modo de repetición de sección**: Activa la reproducción continua dentro de secciones específicas para lograr bucles multimedia sin interrupciones.
- ✨ **Integración con Zoom**: Coordinación automática para iniciar y detener la función de compartir pantalla junto con la reproducción multimedia.

## v25.7.0

### ✨ Nuevas características

- ¡No hay nuevas características en esta versión!

## 25.6.0

### ✨ Nuevas características

- ✨ **Ajuste de conexión de uso medido**: Añadimos un nuevo ajuste para que reduzcas el uso del ancho de banda en las descargas cuando uses conexiones de uso medido.
- ✨ **Manejo mejorado de la transmisión de archivos multimedia**: Mejor compatibilidad para la transmisión de archivos multimedia, reduciendo los problemas relacionados con la latencia.

## 25.5.0

### ✨ Nuevas características

- 🖼️ **Opción de retraso en OBS para las imágenes**: Añadimos un ajuste en OBS Studio para retrasar los cambios de escena al mostrar imágenes, mejorando las transiciones.
- 🔊 **Compatibilidad con el formato de audio `.m4a`**: Añadimos compatibilidad para los archivos de audio `.m4a` para ampliar los tipos de archivos multimedia admitidos.

## 25.4.0

### ✨ Nuevas características

- 🇵🇭 **Nuevo idioma: tagalo**: Añadimos compatibilidad con el tagalo, ampliando las capacidades multilingües de la aplicación.
- 🎞 **Compatibilidad con el formato de video `.m4v`**: Ahora es compatible con la reproducción de archivos `.m4v` para mejorar la compatibilidad multimedia.

## 25.3.1

### ✨ Nuevas características

- 🌏 **Nuevo idioma: coreano**: Añadimos compatibilidad con el idioma coreano, ampliando la accesibilidad para más usuarios.

## 25.3.0

### ✨ Nuevas características

- 🎵 **Reproducir música de fondo con los videos**: Permite que la música de fondo se siga reproduciendo mientras ves videos.
- 🎥 **Transmisión de cámara para archivos multimedia en lenguaje de señas**: Añadimos la capacidad de mostrar la transmisión de una cámara en la ventana multimedia específicamente para quienes usan el lenguaje de señas.
- 📅 **Fecha y fondo automáticos para la Conmemoración**: Detecta y establece automáticamente la fecha de la Conmemoración y prepara la imagen de fondo para la Conmemoración.
- 📜 **Mostrar notas de la versión en la aplicación**: Muestra las notas de la versión directamente en la aplicación para que puedas revisar fácilmente los cambios después de una actualización.

## 25.2.1

### ✨ Nuevas características

- 🔄 **Permitir intentos de reconexión de OBS**: Introducimos la posibilidad de forzar a OBS a reconectarse de forma manual cuando sea necesario.
- 🗑 **Eliminar automáticamente las carpetas de fechas de exportación antiguas**: Elimina de forma automática las carpetas de fechas de exportación antiguas para que mantengas tu almacenamiento organizado.

## 25.2.0

### ✨ Nuevas características

- 🌍 **Usar la configuración regional del sistema por defecto**: Detecta y usa automáticamente la configuración regional de tu sistema para darte una experiencia más personalizada.
- 🏷 **Compatibilidad de etiquetas para los archivos multimedia exportados**: Añade etiquetas de metadatos a los archivos multimedia que exportes para una mejor organización.
- 🔄 **Cambio automático de versión beta a estable**: Permite cambiar de forma automática de las versiones beta a las versiones estables cuando sea necesario.
- 🌐 **Extraer los últimos índices de idiomas del sistema MEPS**: Obtén los índices de idiomas más recientes del sistema MEPS directamente desde el sitio web oficial, garantizando que tengas los idiomas actualizados.

## 25.1.0

### ✨ Nuevas características

- 📅 **Abrir fechas anteriores**: Permite abrir fechas anteriores de la semana actual, lo cual te es útil cuando el día de la reunión se pasa para más adelante en la semana.
- 🛑 **Aviso de error para OBS Studio**: Añade un cartel de error cuando OBS Studio no está conectado en un día de reunión, garantizando que recibas la alerta.
- 📚 **Agrupar archivos multimedia por publicación**: Agrupa los archivos multimedia de la misma publicación referenciada para que tengas una vista general más limpia y organizada.
- 🎵 **Advertencia de cancion duplicada**: Muestra una advertencia si las canciones aparecen más de una vez en la lista de archivos multimedia para la reunion del fin de semana.
- 🔄 **Planificación de cambios futuros en el programa**: Permite planificar los cambios futuros en el programa de la reunión, lo cual te es útil para los cambios anuales en el programa o para la visita del superintendente de circuito a una congregación vecina.

## 24.11.0

### ✨ Nuevas características

- 🖥️ **Presentación de sitios web en macOS**: Ahora puedes presentar el sitio web en macOS 🚀
- ⌨️ **Atajos de teclado para la reproducción**: Introducimos atajos de teclado para que puedas detener, pausar y reanudar la reproducción multimedia 🚀
- 🌐 **Dirección de descarga de archivos multimedia personalizada**: Añadimos compatibilidad para que configures la dirección web desde donde se deben descargar los archivos multimedia 🚀
- 🎬 **Selector instantáneo de escenas de OBS**: Añadimos el selector instantáneo de escenas de OBS Studio y renovamos la función del selector de escenas en la configuración.
- 📖 **Más idiomas en la documentación**: Ampliamos el sitio web de documentación para que sea compatible con más idiomas.

## 24.10.10

### ✨ Nuevas características

- ⌨️ **Atajos de navegación multimedia**: Añadimos atajos de teclado para que navegues al archivo multimedia siguiente o anterior.
- 🖱️ **Menú de clic derecho en el archivo multimedia**: Añadimos un menú que aparece al hacer clic derecho en los archivos multimedia para que puedas ocultarlos y cambiarles el nombre.
- ✂️ **Importación de listas de reproducción de JWL recortadas**: Ahora se respetan los tiempos de los videos recortados en las listas de reproducción de JWL que importes.

## 24.10.9

### ✨ Nuevas características

- 🗑️ **Eliminar archivos multimedia adicionales por día**: Añadimos una opción para que puedas eliminar todos los archivos multimedia adicionales del día que tienes seleccionado actualmente.

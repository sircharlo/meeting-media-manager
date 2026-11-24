# Política de privacidad {#privacy-policy}

Fecha de entrada en vigor: 24 de noviembre de 2026

Meeting Media Manager (M³) es una aplicación gratuita y de código abierto creada por voluntarios. Esta política explica qué datos maneja M³ y adónde van. Se aplica a todas las versiones de M³: los instaladores y la versión portátil de este sitio web, y las versiones de Microsoft Store y Snap Store.

**En resumen:** M³ no tiene cuentas, ni anuncios, ni rastreadores publicitarios o de marketing. Tu configuración y tus archivos multimedia se quedan en tu computadora. Para encontrar y corregir problemas, M³ envía datos de diagnóstico a sus desarrolladores: informes de errores e información sobre cada sesión y sobre la velocidad a la que funciona M³. M³ excluye de ellos lo que podría identificarte a ti o a tu congregación, y tu dirección IP no se almacena.

## Lo que se queda en tu computadora {#on-your-computer}

M³ guarda lo siguiente en su carpeta de datos, en tu computadora:

- la configuración de cada congregación o grupo, como su nombre, su horario de reuniones, su idioma y sus integraciones;
- los archivos multimedia y las publicaciones que descarga, y los archivos multimedia que añades;
- la contraseña de OBS Studio, si lo usas. M³ la cifra con el almacenamiento de contraseñas de tu sistema operativo cuando está disponible; cuando no lo está, M³ la guarda como texto sin formato y te lo indica;
- la configuración de tu integración con Zoom, si la usas.

Los informes de errores incluyen algunos de estos ajustes (ver más abajo), pero nunca los que podrían identificarte a ti o a tu congregación.

Si muestras la imagen de una cámara en la ventana de archivos multimedia (una opción para las congregaciones de lenguaje de señas), solo se muestra: M³ no la graba, no la guarda ni la envía. La vista previa de la ventana de archivos multimedia que M³ te muestra se captura en tu computadora y tampoco se guarda ni se envía.

Puedes eliminar todo esto en cualquier momento eliminando la carpeta de datos de M³. En Windows, al desinstalar M³, también se elimina. La versión de Snap Store la conserva cuando la desinstalas, a menos que le pidas que no lo haga (`snap remove --purge`).

## Datos de diagnóstico {#error-reports}

M³ envía datos de diagnóstico a [Sentry](https://sentry.io), el servicio que usan sus desarrolladores para encontrar y corregir errores.

**Informes de errores**, cuando algo falla en M³. Un informe puede contener:

- el error y en qué parte del código de M³ se produjo;
- la versión de M³ y la forma en que lo instalaste, tu sistema operativo y su versión, tu idioma y tu zona horaria, e información básica sobre tu hardware, como tu tarjeta gráfica;
- los pasos que llevaron al error, como las páginas abiertas en M³ y los archivos que estaba descargando;
- el estado de M³ en ese momento: su configuración y lo que estaba haciendo, como el archivo multimedia que se estaba reproduciendo o la reunión que estaba preparando;
- cuando una parte de M³ falla, un informe del fallo de esa parte, que puede incluir una porción de su memoria en el momento del fallo.

**Información de la sesión**, cada vez que se ejecuta M³: cuándo se inició y si se cerró con normalidad o falló, junto con la versión de M³ y tu sistema operativo.

**Información de rendimiento**, en cada sesión: cuánto tardan en abrirse las páginas de M³ y cuánto tardan sus solicitudes a los servidores que se indican más abajo, con sus direcciones.

### Lo que M³ excluye {#left-out}

Antes de enviar sus datos de diagnóstico, M³ quita lo que podría identificarte a ti o a tu congregación:

- el nombre de la congregación, su ID de reunión de Zoom y los nombres de los participantes de Zoom;
- el PIN de la configuración y la contraseña de OBS Studio;
- los nombres de las carpetas y archivos de tu computadora: solo se conservan la unidad o la carpeta de nivel superior de una carpeta, y el tipo de un archivo;
- la dirección indicada en el ajuste "Dirección del sitio web", cuando no es la predeterminada;
- tu nombre de usuario, en las rutas de carpetas de sus informes.

Los datos no contienen ningún nombre, dirección de correo electrónico ni cuenta, ya que M³ no tiene nada de esto. M³ le pide a Sentry que no registre tu dirección IP, y Sentry está configurado para no almacenarla.

Los responsables de mantener M³ usan estos datos solo para encontrar y corregir problemas. Sentry los almacena en Estados Unidos y los elimina después de un tiempo limitado. La [política de privacidad de Sentry](https://sentry.io/privacy/) explica cómo los trata.

## Servidores a los que se conecta M³ {#connections}

Para hacer su trabajo, M³ se conecta a los servidores que se indican a continuación. Como ocurre con cualquier sitio web que visitas, estos servidores pueden ver la dirección IP de tu computadora.

- **El sitio web oficial de los testigos de Jehová** y sus servidores de descarga, para descargar los archivos multimedia de las reuniones y las publicaciones, así como su información. La política de privacidad propia de ese sitio web se aplica a lo que recibe.
- **GitHub**, donde se publica M³, para buscar y descargar actualizaciones de M³ y para mostrar sus novedades. Las versiones de Microsoft Store y Snap Store, en cambio, reciben sus actualizaciones de su tienda.
- **jsDelivr**, para descargar las fuentes que necesitan algunos idiomas y el componente que usa M³ para leer archivos PDF.
- **Apple, Cloudflare, icanhazip.com y ipify.org**, para comprobar si tu computadora está conectada a internet.
- **Sentry**, para enviar los datos de diagnóstico descritos más arriba.

Si los usas, M³ también funciona con los siguientes, en tu computadora o en tu red local:

- **Zoom:** M³ controla la aplicación de Zoom en tu computadora. M³ no envía nada por sí mismo a los servidores de Zoom.
- **OBS Studio:** M³ se conecta a OBS Studio en tu computadora o en tu red local.
- **El control remoto del cronómetro:** M³ ejecuta un pequeño servidor web en tu red local para que otro dispositivo pueda mostrar el cronómetro de la reunión.

Cuando muestras el sitio web oficial de los testigos de Jehová en la ventana del sitio web de M³, funciona igual que en un navegador web.

## Tiendas de aplicaciones {#stores}

Si instalas M³ desde Microsoft Store o Snap Store, esa tienda se encarga de la instalación y las actualizaciones de M³, según su propia política de privacidad. M³ en sí funciona de la misma manera en todas las versiones.

## Cambios en esta política {#changes}

Si M³ empieza a manejar los datos de otra forma, esta página se actualizará, con una nueva fecha al principio. Su historial está en [GitHub](https://github.com/sircharlo/meeting-media-manager/commits/master/docs/src/en/privacy.md).

## Preguntas {#questions}

Si tienes alguna pregunta sobre esta política o sobre tus datos, [abre una incidencia en GitHub](https://github.com/sircharlo/meeting-media-manager/issues).

---
tag: Configuración
title: Sincronización de la congregación
ref: congregation-sync
---

El hermano designado como *organizador de videoconferencia* (OV) por el cuerpo de ancianos puede usar M³ para administrar qué contenidos están disponibles para el equipo de soporte técnico de Audio/Video en su congregación.

El OV, o alguien designado por él, puede:

- subir contenidos **adicionales** para compartir durante una reunión, como la visita del superintendente de circuito o los discursos de los oradores públicos
- **ocultar** los medios de JW.org que no son relevantes para una reunión determinada, por ejemplo, cuando una parte ha sido reemplazada por la sucursal local
- agregar o eliminar contenidos **recurrentes**, como un video de texto anual o una diapositiva de anuncio

Todos los que estén sincronizados con la misma congregación recibirán exactamente los mismos contenidos cuando hagan clic en el botón *¡Actualizar multimedia!*.

Tenga en cuenta que la función de sincronización de la congregación totalmente opcional.

### Cómo funciona

El mecanismo de sincronización subyacente de M³ utiliza WebDAV. Esto significa que el OV (o alguien bajo su supervisión) debe:

- configurar un servidor WebDAV seguro que sea accesible desde la web, **o**
- utilizar un servicio de almacenamiento en la nube de terceros que admita el protocolo WebDAV (consulte la configuración *Nombre del host* en la sección *Configuración de sincronización de la congregación* a continuación).

Todos los usuarios que deseen sincronizarse juntos deberán conectarse al mismo servidor WebDAV utilizando la información de conexión y las credenciales que les proporcionó su OV.

### Configuración de sincronización de la congregación

| Ajuste                                         | Explicación                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Nombre de host`                               | Dirección web del servidor WebDAV. Se requiere HTTP seguro (HTTPS). <br><br> ***Nota:** La etiqueta de este campo es en realidad un botón que, una vez que se hace clic, mostrará una lista de proveedores de WebDAV que se sabe que son compatibles con M³ y automáticamente completará ciertas configuraciones para esos proveedores. <br><br> Esta lista se proporciona como cortesía y de ninguna manera representa un respaldo de ningún servicio o proveedor en particular. El mejor servidor es siempre el tuyo...* |
| `Nombre de usuario`                            | Nombre de usuario para el servicio WebDAV.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `Contraseña`                                   | Contraseña para el servicio WebDAV. <br><br> ***Nota:** Como se detalla en sus respectivas páginas de soporte, es posible que se deba crear una contraseña específica de la aplicación para[Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) y [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) para habilitar las conexiones WebDAV a sus servicios.*                                                                                                 |
| `Carpeta de sincronización de la congregación` | Esta es la carpeta que se usará para sincronizar contenidos para todos los usuarios de sincronización de la congregación. Puede escribir/pegar una ruta o usar el ratón para navegar a la carpeta de destino. <br><br> ***Nota:** Asegúrese de que todos los usuarios de sincronización de la congregación ingresen la misma ruta de carpeta; de lo contrario, la sincronización no funcionará como esperaba.*                                                                                                                         |
| `Configuración de toda la congregación`        | Una vez que el OV ha configurado las secciones *Configuración de multimedia* y *Configuración de la reunión* de [Ajustes]({{page.lang}}/#configuration) en su propia computadora, puede usar este botón para aplicar ciertas configuraciones para todos los usuarios de sincronización de la congregación (por ejemplo, días de reunión, idioma de los contenidos, configuración de conversión, etc.). Esto significa que la configuración seleccionada se aplicará a la fuerza a todos los usuarios sincronizados cada vez que abran M³.          |

### Usar la sincronización de la congregación para administrar los contenidos

Una vez que se complete la configuración de sincronización de la congregación, estará listo para iniciar [gestionar medios]({{page.lang}}/#manage-media) para el equipo de soporte técnico AV de su congregación.

### Capturas de pantalla de la sincronización de la congregación en acción

{% include screenshots/congregation-sync.html lang=site.data.es %}

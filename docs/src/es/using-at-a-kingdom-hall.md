<!-- markdownlint-disable no-inline-html -->

# Usando M³ en un Salón del Reino {#using-m3-at-a-kingdom-hall}

Esta guía te guiará a través del proceso de descarga, instalación y configuración de **Meeting Media Manager (M³)** en un Salón del Reino. Siga los pasos para asegurar una configuración fluida para gestionar el contenido multimedia durante las reuniones de congregación.

## 1. Descargar e instalar {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Descargue la versión apropiada para su sistema operativo:
   - **Windows:**
     - Para la mayoría de sistemas Windows, descarga <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a>.
     - Para sistemas Windows de 32 bits más antiguos, descarga <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a>.
     - Para una versión portable, descarga <a :href="data.winPortable">meeting-media-manager-[VERSION]-portable.exe</a>.
   - **macOS:**
     - **M-series (Apple Sillicon)**: Descarga <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a>.
     - **Macs basados en Intel**: Descargar <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a>.
   - **Linux:**
     - Descargar <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a>.
2. Si los enlaces de descarga no funcionan, visita la [página de descarga M³](https://github.com/sircharlo/meeting-media-manager/releases/latest) y descarga la versión correcta manualmente.
3. Abra el instalador y siga las instrucciones en pantalla para instalar M³.
4. Iniciar M³.
5. Vaya a través del asistente de configuración

### solo macOS: pasos adicionales de instalación {#additional-steps-for-macos-users}

:::warning Advertencia

Esta sección sólo se aplica a los usuarios de macOS.

:::

Debido a las medidas de seguridad de Apple, se necesitan algunos pasos adicionales para ejecutar la aplicación M³ instalada en sistemas macOS modernos.

Ejecuta los siguientes dos comandos en Terminal, modificando la ruta a M³ según sea necesario:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Advertencia

Como usuario de macOS, necesitará seguir estos pasos cada vez que instale o actualice M³.

:::

:::info Explicación

El primer comando _firma el código del programa_. Esto es necesario para evitar que M³ sea detectado como una aplicación maliciosa de un desarrollador desconocido.

El segundo comando _elimina la bandera cuarentena_ de la aplicación. La bandera cuarantina se utiliza para advertir a los usuarios sobre las aplicaciones potencialmente maliciosas que se han descargado de Internet.

:::

#### Método alternativo {#alternative-method-for-macos-users}

Si todavía no puede iniciar M³ después de introducir los dos comandos de la sección anterior, por favor intente lo siguiente:

1. Abre los ajustes de la **Privacidad y Seguridad** del sistema macOS.
2. Encuentre la entrada para M³ y haga clic en el botón **Abrir de todos modos**.
3. Entonces se le advertirá de nuevo, y se le dará el consejo de no "abrir esto a menos que esté seguro de que es de una fuente confiable". Haga clic en **Abrir de todos modos**.
4. Aparecerá otra advertencia, donde tendrás que autenticarte para iniciar la aplicación.
5. M³ ahora debería lanzarse con éxito.

Si aún tienes problemas después de seguir todos estos pasos, por favor [abre un problema en GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). ¡Haremos lo posible por ayudarte!

### solo macOS: Reactivando la presentación del sitio web después de las actualizaciones {#screen-sharing-issues}

:::warning Advertencia

Esta sección sólo se aplica a los usuarios de macOS.

:::

Algunos usuarios de macOS han informado de que la presentación del sitio web ya no funciona después de instalar las actualizaciones de M³.

Si la ventana multimedia es negra cuando se presenta el sitio web después de actualizar M³, pruebe los siguientes pasos:

1. Abre los ajustes de la **Privacidad y Seguridad** del sistema macOS.
2. Vaya a **Grabación de pantalla**.
3. Seleccione M³ en la lista.
4. Haga clic en el botón `-` (menos) para eliminarlo.
5. Haga clic en el botón `+` (más) y seleccione M³ de la carpeta Aplicaciones.
6. Es posible que le pidan volver a abrir M³ para aplicar el cambio.

Después de estos pasos, el uso compartido de la pantalla debería funcionar como se esperaba una vez más.

:::tip Consejo

Estos pasos son opcionales y se pueden omitir si no planea utilizar la función de presentación del sitio web. Por otra parte, si planea utilizar la función de presentación del sitio web, se recomienda seguir estos pasos después de cada actualización para asegurar que la característica funciona como se esperaba.

:::

## 2. Asistente de configuración {#configuration-wizard}

### Idioma de la aplicación {#app-display-language}

Cuando inicies M³ por primera vez, se te pedirá que elijas tu **idioma de la aplicación**. Elija el idioma que desea usar M³ para su interfaz.

:::tip Consejo

Este no tiene por qué ser el mismo idioma que el que M³ descargará el contenido multimedia. El idioma para las descargas de multimedia será configurado en un paso posterior.

:::

### Tipo de perfil {#profile-type}

El siguiente paso es elegir un **tipo de perfil**. Para una configuración regular en un Salón del Reino, elige **Regular**. Esto configurará muchas características que se utilizan comúnmente para las reuniones de congregación.

:::warning Advertencia

Solo deberías elegir **Otro** si estás creando un perfil para el que ningún contenido multimedia debe ser descargado automáticamente. El contenido multimedia tendrá que ser importado manualmente para su uso en este perfil. Este tipo de perfil se utiliza principalmente para utilizar M³ en escuelas teocráticas, asambleas y otros eventos especiales.

Rara vez se utiliza el tipo de perfil **otro**. **For normal use during congregation meetings, please choose _Regular_.**
:::

:::

### Búsqueda de congregación automática {#automatic-congregation-lookup}

M³  puede intentar encontrar automáticamente el horario de la reunión, el idioma y el nombre formateado de la congestión.

Para ello, utilice el botón **Búsqueda de Congregación** junto al campo de nombre de congregación e introduzca al menos parte del nombre de la congestión y la ciudad.

Una vez que se encuentre y se seleccione la congregación correcta, M³  rellenará toda la información disponible como el **nombre** de la congregación, el **lenguaje de la reunión** y los **horarios de la reunión**.

:::info Nota

Esta búsqueda utiliza datos disponibles públicos del sitio web oficial de los testigos de Jehová.

:::

### Entrada manual de la información de  congregación {#manual-entry-of-congregation-information}

Si la búsqueda automatizada no encuentra su congregación, por supuesto puede introducir manualmente la información requerida. El asistente le permitirá revisar y/o introducir el **nombre** de su congregación, el **idioma de la reunión** y los **horarios de la reunión**.

### Almacenando vídeos del cancionero {#caching-videos-from-the-songbook}

También se te dará la opción de **cachear todos los vídeos del cancionero**. Esta opción pre-descarga todos los vídeos del cancionero, reduciendo el tiempo que se tarda en buscar contenido multimedia para las reuniones en el futuro.

- **Pros:** El contenido multimedia de reunión estarán disponibles mucho más rápido.
- **Cons:** El tamaño de la caché multimedia aumentará significativamente, en aproximadamente 5GB.

:::tip Consejo

Si tu Salón del Reino tiene suficiente espacio de almacenamiento, se recomienda **habilitar** esta opción para eficiencia y rendimiento.

:::

### Configuración de integración de OBS Studio (Opcional) {#obs-studio-integration-configuration}

Si tu Salón del Reino usa **OBS Studio** para transmitir reuniones híbridas a través de Zoom, M³  se puede integrar automáticamente con ese programa. Durante la configuración, puede configurar la integración con OBS Studio introduciendo lo siguiente:

- **Puerto:** El número de puerto utilizado para conectarse al plugin Websocket de OBS Studio.
- **Contraseña:** La contraseña utilizada para conectarse al plugin Websocket de OBS Studio.
- **Escenas:** Las escenas OBS que se utilizarán durante las presentaciones de multimedia. Necesitará una escena que capture la ventana de multimedia o la pantalla, y otra que muestre la plataforma.

:::tip Consejo

Si su congregación celebra regularmente reuniones híbridas, se recomienda altamente activar la integración con OBS Studio.

:::

## 3. Disfruta usando M³  {#enjoy-using-m3}

Una vez finalizado el asistente de configuración, M³  está listo para ayudar a gestionar y presentar multimedia para las reuniones de congregación. ¡Disfruta usando la aplicación! :tada:

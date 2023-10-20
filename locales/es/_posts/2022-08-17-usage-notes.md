---
tag: Ayuda
title: Notas técnicas de uso
ref: usage-notes
---

La aplicación debería ejecutarse tal como está en la mayoría de las computadoras modernas con Windows, Linux o Mac.

### Windows: Instalación y primeros pasos

Al abrir el instalador, es posible que obtenga un [error](assets/img/other/win-smartscreen.png) que indique que "Windows SmartScreen impidió que se iniciara una aplicación no reconocida". Esto se debe a que la aplicación no tiene una gran cantidad de descargas y, en consecuencia, Windows no "confía" explícitamente en ella. Para evitar esto, simplemente haga clic en "Más información", luego en "Ejecutar de todos modos".

### Linux: Instalación y primeros pasos

Según [documentación oficial de AppImage](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), si la aplicación no se abre correctamente, confirme el resultado del siguiente comando:

`sysctl kernel.unprivileged_userns_clone`

Si el resultado es `0`, AppImage **no** se ejecutará a menos que ejecute el siguiente comando, seguido de un reinicio:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Asegúrate de leer [lo que esto implica](https://lwn.net/Articles/673597/) antes de hacer esto.

### macOS: Instalación y primeros pasos

Si al iniciar la aplicación, recibe una advertencia de que la aplicación no se puede abrir, ya sea porque "no se descargó de la tienda de aplicaciones" o porque "no se puede verificar el desarrollador", entonces esta [página de soporte de Apple](https://support.apple.com/en-ca/HT202491) lo ayudará a seguir adelante.

Si recibe un mensaje indicando que "no tiene permiso para abrir la aplicación", pruebe algunas soluciones de [esta página](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860), por ejemplo ejecutando el siguiente comando en `Terminal.app`:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Problemas con permisos de audio o micrófono en macOS Sonoma

Since macOS Sonoma, some users might encounter an issue where M³ repeatedly gives an error message indicating that it needs access to the microphone. Executing the following command in `Terminal.app` has resolved the issue for some:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Actualización Automática

A diferencia de Windows y Linux, la funcionalidad de actualización automática **no** está implementada en macOS y, por razones técnicas, probablemente nunca lo estará. Sin embargo, una de estas dos cosas sucederá para los usuarios de Mac cuando haya una actualización disponible:

- M³ intentará descargar el paquete de actualización y lo abrirá automáticamente, después de lo cual el usuario deberá completar manualmente la instalación de la actualización de M³ arrastrando y soltando la aplicación actualizada en su carpeta Aplicaciones. Luego, podrán iniciar M³ recién actualizado desde su carpeta de Aplicaciones como de costumbre.
- Si el paso anterior falla en cualquier etapa, M³ mostrará una notificación persistente que indica que hay una actualización disponible, con un enlace a la actualización en sí. También se mostrará una notificación roja intermitente en el botón de configuración en la pantalla principal de M³. El número de versión de M³ en la pantalla de configuración se convertirá en un botón que, una vez que se haga clic, abre automáticamente la página de descarga de la última versión.

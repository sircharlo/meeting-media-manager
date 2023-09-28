---
tag: Hilfe
title: Technische Hinweise
ref: usage-notes
---

Die App sollte wie auf den meisten modernen Computern mit Windows, Linux oder macOS laufen.

### Windows: Installation und erster Start

Beim Öffnen des Installers erhalten Sie möglicherweise einen [-Fehler](assets/img/other/win-smartscreen.png) mit dem Hinweis, dass "Windows SmartScreen das Starten einer nicht erkannten App verhindert hat". Dies liegt daran, dass die App keine große Anzahl an Downloads hat und daher von Windows nicht explizit "vertrauenswürdig" wird. Um dies zu umgehen, klicken Sie einfach auf "Mehr Info", dann auf "Trotzdem ausführen".

### Linux: Installation und erster Start

Gemäß der [offiziellen AppImage Dokumentation](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), wenn die App nicht richtig geöffnet wird, bestätigen Sie die Ausgabe des folgenden Befehls:

`sysctl kernel.unprivileged_userns_clone`

Wenn die Ausgabe `0`ist, dann wird das AppImage **nicht** ausführen, es sei denn, Sie führen den folgenden Befehl aus, gefolgt von einem Neustart:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Lesen Sie sich [durch, was dies bedeutet,](https://lwn.net/Articles/673597/) bevor Sie dies tun.

### macOS: Installation und erster Start

Wenn Sie beim Starten der App eine Warnung erhalten, dass die App nicht geöffnet werden kann, entweder weil "es nicht aus dem App Store heruntergeladen wurde" oder weil "der Entwickler nicht überprüft werden kann" dann wird dir diese [Apple Support-Seite](https://support.apple.com/en-ca/HT202491) helfen, das zu überwinden.

Wenn Sie eine Nachricht erhalten, die angibt, dass Sie "keine Berechtigung zum Öffnen der Anwendung haben" dann versuchen Sie einige Lösungen von [auf dieser Seite](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860).

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Auto-update

Anders als Windows und Linux ist die Auto-Update-Funktionalität **nicht** auf macOS implementiert und wird es aus technischen Gründen wahrscheinlich nie sein. Allerdings passiert eine von zwei Dingen für MacOS-Benutzer, wenn ein Update verfügbar ist:

- M3 wird versuchen, das Updatepaket herunterzuladen und es automatisch zu öffnen, danach muss der Benutzer die Installation des M3-Updates manuell durch Ziehen und Ablegen der aktualisierten App in seinen Anwendungsordner durchführen. Dann können sie wie gewohnt die neu aktualisierte M3 aus ihrem Anwendungsordner starten.
- Wenn der vorherige Schritt zu irgendeinem Zeitpunkt fehlschlägt M3 zeigt eine persistente Benachrichtigung an, die angibt, dass ein Update verfügbar ist, mit einem Link auf das Update selbst. Eine rote, pulsierende Benachrichtigung wird auch auf der Einstellungstaste im Hauptbildschirm von M3 angezeigt. Die M3-Versionsnummer im Einstellungsbildschirm verwandelt sich in eine Schaltfläche, die nach einem Klick automatisch die neueste Release-Seite öffnet.

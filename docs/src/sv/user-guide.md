# Användarhandbok {#user-guide}

Denna omfattande användarhandbok hjälper dig att bemästra alla funktioner i M³, från grundläggande inställning till avancerade media presentationstekniker.

## Komma igång {#getting-started}

### Första starten {#first-launch}

När du först startar M³, kommer du att guidas genom en installationsguide som kommer att konfigurera de viktigaste inställningarna för din församling:

1. **Välj ditt gränssnittsspråk** - Detta avgör vilket språk M³:s menyer och knappar kommer att visas i
2. **Välj profiltyp** - Välj "vanlig" för normal församlingsanvändning eller "Annat" för speciella evenemang
3. **Konfigurera församlingsinformation** - Ange din församlingsinformation eller använd funktionen automatisk uppslagning
4. **Konfigurera mötestid** - Konfigurera dag oc tid för vecko- och helgmötet
5. **Valfria funktioner** - Konfigurera OBS-integration, bakgrundsmusik och andra avancerade funktioner

:::tip Tips

Låt installationen ta sin tid - men har du bråttom så kan du alltid ändra dessa inställningar senare i inställningsmenyn.

:::

### Översikt av gränssnittet {#main-interface}

Huvudgränssnittet i M³ består av flera viktiga områden:

- **Sidnavigering** - Få tillgång till olika sektioner och inställningar
- **Kalendervy** - Bläddra media efter datum
- **Medielista** - Visa och hantera media för valda datum
- **Verktygsfältet** - Snabb åtkomst till vanliga funktioner
- **Statusfält** - Visar nedladdningsförlopp, och bakgrundsmusik och OBS Studio anslutningsstatus

## Mediehantering {#user-guide-media-management}

### Förstå kalendervyn {#calendar-view}

Kalendervyn visar ditt mötesschema och tillgänglig media:

- **Mötesdagar** - Markerade dagar visas när möten är schemalagda
- **Mediaindikatorer** - Ikoner visar vilka typer av media som är tillgängliga
- **Datumnavigering** - Använd piltangenterna för att navigera mellan månader

<!-- ### Downloading Media {#downloading-media}

::: info Note

Download speed depends on your internet connection and the size of media files. Videos typically take longer to download than images.

::: -->

### Organisera media {#organizing-media}

M³ organiserar automatiskt media efter typ och mötesdel:

- **Mötesdelar** - Media grupperas efter mötesdelar (Föreläsning, Guldkorn, etc.)
- **Anpassade mötesdelar** - Du kan skapa anpassade mötesdelar för ytterligare media om inget möte är planerat den dagen

## Mediapresentation {#media-presentation}

### Öppna mediaspelaren {#opening-media-player}

Att visa media under ett möte:

1. Välj datum och media som du vill visa
2. Klicka på play-knappen eller använd kortkommandot
3. Mediet kommer att börja spela upp på mediedisplayen
4. Använd kontrollerna för att spela, pausa eller navigera genom media

### Mediaspelarinställningar {#media-player-controls}

Mediaspelaren erbjuder omfattande inställningsmöjligheter:

- **Spela/Pausa** - Startar eller pausar medieuppspelning
- **Stopp** - Stoppa uppspelning

<!-- - **Previous/Next** - Navigate between media items
- **Volume** - Adjust playback volume -->

<!-- - **Fullscreen** - Toggle fullscreen mode -->

- **Zoom/Pan** - Använd mushjulet för att zooma, dra för att panorera (bilder)

### Avancerade visningsfunktioner{#advanced-presentation}

#### Anpassad tidsinställning {#custom-timing}

Ställ in anpassade start- och sluttider för media:

<!-- 1. Right-click on a media item
2. Select "Edit Timing" -->

1. Klicka på varaktigheten av en video längst upp till vänster i miniatyrbilden
2. Ange start- och sluttider
3. Spara dina ändringar

#### Zooma och panorera {#zoom-pan}

För bilder och videor:

- \*\*Zooma in/ut \*\* - Använd mushjulet eller används kontrollerna på miniatyrbilden
- **Pan** - Klicka och dra miniatyren för att flytta runt bilden
- **Återställ Zoom** - Klicka för att återgå till original zoom

#### Kortkommandon {#user-guide-keyboard-shortcuts}

Ställ in anpassade kortkommandon för snabbare åtkomst. Observera att inga kortkommandon är inställda som standard.

\*\*Inbyggda mediekontroller \*\* (när huvudfönstret är fokuserat och visar medielistan):

- **Tab/Shift+Tab** - Navigera mellan medieobjekt
- **Upp/Ner pil** - Navigera mellan medieobjekt
- **Mellanslag** - Spela/Pausa media
- **Esc** - Stoppa media

**Anpassningsbara genvägar** (när aktiverat i inställningar):

- **Mediefönster** - Öppna/stäng mediefönstret
- **Föregående/Nästa media** - Navigera mellan medieobjekt
- **Pausa/Återuppspela** - Kontrollera uppspelning av media
- **Stoppa media** - Stoppa medieuppspelning
- **Musikväxling** - Styr bakgrundsmusiken

**Note (\*):** Global shortcut - available even when the app is not focused

## Bakgrundsmusik {#user-guide-background-music}

### Ställa in bakgrundsmusik {#background-music-setup}

Bakgrundsmusik spelas automatiskt före möten och stannar vid lämplig tidpunkt:

1. **Aktivera musik** - Aktivera bakgrundsmusik i inställningarna
2. **Autostart** - Musiken startar automatiskt när M³ startar
3. **Mötesstopp** - Musiken stannar automatiskt innan mötet börjar
4. **Manuell kontroll** - Använd musikknappen i statusfältet för att starta/stoppa manuellt
5. **Omstart** - Återuppta musik efter mötet med ett klick

## Zoomintegration {#user-guide-zoom-integration}

M³ kan integreras med Zoom för automatisk skärmdelning:

1. **Aktivera integration** - Slå på Zoom-integration i inställningar
2. **Konfigurera genväg** - Ställ in kortkommandot för skärmdelning som du angett i Zoom. Se till att kryssrutan "global" är markerad i Zoom.
3. **Automatisk kontroll** - M³ växlar automatiskt skärmdelning i Zoom efter behov
4. **Manuell åsidosättning** - Du kan fortfarande manuellt styra skärmdelning med Zoom om det behövs

## OBS Studiointegration {#user-guide-obs-integration}

### Ställa in OBS Integration {#user-guide-obs-setup}

Att använda M³ med OBS Studio för hybridmöten:

1. **Installera OBS Studio** - Ladda ner och installera OBS Studio
2. **Aktivera WebSocket** - Installera WebSocket-insticksmodulen i OBS
3. **Konfigurera M³** - Ange OBS-port och lösenord i M³-inställningarna
4. **Ställ in scener** - Skapa scener för kamera, media och annat innehåll
5. **Testa** - Kontrollera att uppspelningen fungerar korrekt

### OBS Scenhantering {#obs-scene-management}

M³ växlar automatiskt OBS scener baserade på:

- **Kamerascen** - Visar podiet/kameravyn
- **Mediescen** - Visar medieinnehåll
- **Bildscen** - Visar bilder (kan skjutas upp om aktiverat)
- **Automatisk växling** - Scener ändras baserat på mediatyp och inställningar

### Avancerade OBS-funktioner {#advanced-obs}

#### Skjut upp bildvisning {#user-guide-postpone-images}

Aktivera detta alternativ för att fördröja delning av bilder till OBS tills manuellt aktiveras:

1. Aktivera "Skjut upp bilder" i OBS-inställningar
2. Bilder kommer endast att delas när du klickar på knappen för att visa dem med OBS Studio. Detta är användbart för att visa bilder för åhörarna först.

#### Scenväxlingsbeteende {#user-guide-scene-switching}

Konfigurera hur M³ hanterar scenförändringar:

- **Byt efter Media** - Återvänd automatiskt till föregående scen
- **Kom ihåg föregående scen** - Återställ scenen som var aktiv innan media

### Ljudkonfiguration för hybridmöten {#audio-configuration}

När du använder M³ med OBS Studio för hybridmöten (På plats + Zoom), måste du konfigurera ljudinställningar för att säkerställa att mötesdeltagarna kan höra ev. ljud:

#### Zoom ljudinställningar {#zoom-audio-settings}

**Före varje möte måste du aktivera Original Audio i Zoom:**

1. **Öppna Zoom** och gå till Inställningar
2. **Navigera till Audio** → **Avancerat**
3. **Enable "Show in-meeting option to 'Enable Original Sound'"**
4. **Check "Disable echo cancellation"** (first checkbox)
5. **Check "Disable noise suppression"** (second checkbox)
6. **Uncheck "Disable high-fidelity music mode"** (third checkbox)
7. **Before starting each meeting**, click the "Original Audio" button in the meeting controls

**Alternativ: Dela datorljud**
Om Original Audio inte fungerar bra i din inställning:

1. **Before playing media**, go to **Advanced** tab in Zoom screen sharing options
2. **Bocka i "Datorljud"**
3. **Observera**: Det här alternativet måste aktiveras varje gång du startar en ny Zoom-session

**Bästa alternativ**: Överväg att använda M³:s Zoom-integration istället för OBS Studio, eftersom den använder Zooms inbyggda skärmdelning som hanterar ljud mer sömlöst och inte kräver en komplex ljudkonfiguration.

#### Varför ljudkonfiguration är nödvändig {#why-audio-config}

M³ spelar upp media med ljud på din dator, men detta ljud överförs **inte automatiskt** via videoströmmen till OBS Studio. Detta är samma beteende du skulle uppleva med någon annan mediaspelare.

**Ljudfrågan är inte relaterad till M³** - det är en begränsning av hur OBS Studio-videoströmning fungerar med Zoom. Videoströmmen fungerar som en virtuell kamera utan ljud, precis som en webbkamera, så du måste uttryckligen konfigurera Zoom för att fånga datorns ljud. Detta innebär att din dator har två ljudkort, och om inte kommer du förmodligen inte att kunna använda OBS Studio-integrationen framgångsrikt.

**Alternativ lösning**: Överväg att använda Zoomintegrationen istället, eftersom den använder Zooms inbyggda skärm och ljuddelning, som hanterar ljudet mer sömlöst.

#### Felsökning av ljudproblem {#audio-troubleshooting}

**Vanliga problem:**

- **Inget ljud i Zoom**: Kontrollera om Original Audio är aktiverat och korrekt konfigurerat
- **Dålig ljudkvalitet**: Verifiera de tre kryssrutorna för Original Audio är korrekt inställda
- **Ljud fungerar inte efter omstart av zoom**: Ursprungliga ljudinställningar måste vara aktiverade igen för varje ny Zoom-session

**Bästa praxis:**

- Testa ljudkonfiguration och delning innan mötet
- Skapa en checklista för ljudinställningar
- Överväg att använda "Dela datorljud" som backup
- **Överväg att använda Zoom-integration istället för OBS Studio** för enklare ljudhantering
- Se till att alla som sköter ljud/media känner till dessa inställningar

## Importera och hantera media {#media-import}

### Importera anpassad media {#importing-custom-media}

Lägg till dina egna mediefiler till M³:

1. **Filimport** - Använd importknappen för att lägga till videor, bilder eller ljudfiler
2. **Dra och släpp** - Dra filer direkt till M³
3. **Mappövervakning**: Ställ in en bevakad mapp för automatisk import
4. **JWPUB-filer och spellistor**: Importera publikationer och spellistor

### Hantera importerad media {#managing-imported-media}

- **Organisera efter datum** - Tilldela importerad media till specifika datum
- **Anpassade sektioner** - Skapa anpassade sektioner för bättre organisering
- **Redigera egenskaper** - Ändra rubriker, beskrivningar och timing
- **Ta bort media** - Ta bort oönskade medieobjekt

### Importera ljudbibeln {#audio-bible-import}

Importera ljudinspelningar av Bibelverser:

1. Klicka på knappen "Ljudbibel"
2. Välja Bibelbok och kapitel
3. Välj specifika verser eller versintervall
4. Ladda ner ljudfilerna
5. Använd dem

## Mappbevakning och export {#user-guide-folder-monitoring}

### Ställa in mappbevakning {#folder-monitoring-setup}

Bevaka en mapp för nya mediefiler:

1. **Aktivera mappbevakning** - Slå på mappbevakning i inställningar
2. **Välj mapp** - Välj den mapp som ska bevakas
3. **Automatisk import** - Nya filer läggs automatiskt till i M³
4. **Organiserat** - Filerna organiseras efter datum baserat på mappstrukturen

### Mediaexport {#user-guide-media-export}

Exportera media automatiskt till organiserade mappar:

1. **Aktivera automatisk export** - Slå på mediaexport i inställningar
2. **Välj exportera mapp** - Välj var du vill spara exporterade filer
3. **Automatisk organisering** - Filer organiseras efter datum och mötesdel
4. **Formatalternativ** - Konvertera filer till MP4 för bättre kompatibilitet

## Website Presentation {#website-presentation}

### Presenting the Official Website {#presenting-the-website}

Share the official website on external displays:

1. **Open Website Mode** - Click the website presentation button
2. **External Display** - The website opens in a new window
3. **Navigation** - Use the browser controls to navigate

### Website Controls {#website-controls}

- **Navigation** - Standard browser navigation controls
- **Refresh** - Reload the current page
- **Close** - Exit website presentation mode

## Advanced Features {#user-guide-advanced-features}

### Multiple Congregations {#user-guide-multiple-congregations}

Manage multiple congregations or groups:

1. **Create Profiles** - Set up separate profiles for different congregations
2. **Switch Profiles** - Use the congregation selector to switch between profiles
3. **Separate Settings** - Each profile has its own settings and media
4. **Shared Resources** - Media files are shared between profiles whenever possible

### Keyboard Shortcuts {#keyboard-shortcuts-guide}

Configure custom keyboard shortcuts for efficient operation:

1. **Enable Shortcuts** - Turn on keyboard shortcuts in settings
2. **Configure Shortcuts** - Set up shortcuts for common actions
3. **Practice** - Learn your shortcuts for faster operation
4. **Customize** - Adjust shortcuts to match your preferences

## Troubleshooting {#troubleshooting-guide}

### Common Issues {#common-issues}

#### Media Not Downloading {#user-guide-media-not-downloading}

- Check your meeting schedule settings
- Verify internet connection
- Check if media is available in your selected language

#### OBS Integration Not Working {#user-guide-obs-not-working}

- Verify OBS WebSocket plugin is installed
- Check port and password settings
- Ensure OBS is running

#### Audio Issues in Zoom/OBS {#audio-issues}

- **No audio in Zoom**: Enable Original Audio in Zoom settings and before each meeting
- **Poor audio quality**: Check the three Original Audio checkboxes (first two enabled, third disabled)
- **Audio not working after restart**: Original Audio must be re-enabled for each new Zoom session
- **Alternative solution**: Use "Share Computer Sound" option in Zoom screen sharing

#### Performance Issues {#user-guide-performance-issues}

- Enable extra cache
- Reduce maximum resolution
- Clear old cached files
- Check available disk space

#### Language Issues {#user-guide-language-issues}

- Check media language setting
- Ensure language is available on JW.org
- Try a fallback language
- Verify interface language setting

### Getting Help {#getting-help}

If you encounter issues:

1. **Check Documentation** - Review this guide and other available documentation
2. **Search Issues** - Look for similar issues on GitHub
3. **Report Problems** - Create a new issue with detailed information

## Best Practices {#best-practices}

### Before Meetings {#before-meetings}

1. **Check Downloads** - Ensure all media is downloaded
2. **Test Equipment** - Verify displays and audio work
3. **Prepare Media** - Review and organize media for the meeting; make sure no media files are missing
4. **Configure Audio** - For hybrid meetings, enable Original Audio in Zoom or set up "Share Computer Sound"

### During Meetings {#during-meetings}

1. **Stay Focused** - Use the clean and distraction-free interface
2. **Use Shortcuts** - Master keyboard shortcuts for smooth operation
3. **Monitor Audio** - Keep an eye on volume levels, if that's part of your responsibilities
4. **Be Prepared** - Have the next media item ready
5. **Verify Audio** - For hybrid meetings, ensure Zoom participants can hear the media

### After Meetings {#after-meetings}

1. **Start Background Music** - Start the playback of background music
2. **Plan Ahead** - Prepare for the next meeting by making sure everything is in place
3. **Clean Up** - Close media player when you're ready to leave

### Regular Maintenance {#regular-maintenance}

1. **Update M³** - Keep the application updated
2. **Clear Cache** - Periodically clear old cached files
3. **Check Settings** - Review and update settings as needed

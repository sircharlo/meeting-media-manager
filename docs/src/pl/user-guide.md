# User Guide {#user-guide}

This comprehensive user guide will help you master all the features of M³, from basic setup to advanced media presentation techniques.

## Getting Started {#getting-started}

### Download and Install {#download-and-install}

Get the latest version from the [Download page](download). It recommends the best build for your device and shows the latest version.

### First Launch {#first-launch}

When you first launch M³, you'll be guided through a setup wizard that will configure the essential settings for your congregation:

1. **Choose your interface language** - This determines what language M³'s menus and buttons will be displayed in
2. **Select profile type** - Choose "Regular" for normal congregation use or "Other" for special events
3. **Configure congregation information** - Enter your congregation details or use the automatic lookup feature
4. **Set up meeting schedule** - Configure your midweek and weekend meeting times
5. **Optional features** - Configure OBS integration, background music, and other advanced features

:::tip Tip

Take your time during setup - but you can always change these settings later in the Settings menu.

:::

### Main Interface Overview {#main-interface}

The main M³ interface consists of several key areas:

- **Navigation Drawer** - Access different sections and settings
- **Calendar View** - Browse media by date
- **Media List** - View and manage media for selected dates
- **Toolbar** - Quick access to common functions
- **Status Bar** - Shows download progress, and background music and OBS Studio connection status

## Media Management {#user-guide-media-management}

### Understanding the Calendar View {#calendar-view}

The calendar view shows your meeting schedule and available media:

- **Meeting Days** - Highlighted days show when meetings are scheduled
- **Media Indicators** - Icons show what types of media are available
- **Date Navigation** - Use arrow keys to navigate between months

### Organizowanie mediów {#organizing-media}

M3 automatycznie organizuje media według typu spotkania i sekcji:

- **Sekcje spotkań** - Media są pogrupowane według części spotkań (rozmowa publiczna, skarby z Boga itp.)
- **Niestandardowe sekcje** - Możesz utworzyć własne sekcje dla dodatkowych mediów, jeśli nie zaplanowano spotkania w tym konkretnym dniu

## Prezentacja mediów {#media-presentation}

### Otwieranie odtwarzacza multimedialnego {#opening-media-player}

Aby zaprezentować media podczas spotkania:

1. Wybierz datę i element multimedialny, który chcesz zaprezentować
2. Kliknij przycisk odtwarzania lub użyj skrótu klawiszowego
3. Media będą odtwarzane na wyświetlaczu multimediów
4. Użyj przycisków do odtwarzania, wstrzymania lub nawigacji przez media

### Funkcje odtwarzacza multimediów {#media-player-controls}

Odtwarzacz multimediów zapewnia wszechstronne sterowanie:

- **Odtwórz/Wstrzymaj** - Rozpocznij lub wstrzymaj odtwarzanie multimediów
- **Stop** - Zatrzymaj odtwarzanie

<!-- - **Previous/Next** - Navigate between media items
- **Volume** - Adjust playback volume -->

<!-- - **Fullscreen** - Toggle fullscreen mode -->

- **Zoom/Pan** - Użyj kółka myszy, aby powiększyć, przeciągnij do panewki (dla zdjęć)

### Zaawansowane funkcje prezentacji {#advanced-presentation}

#### Niestandardowy czas {#custom-timing}

Ustaw niestandardowe godziny rozpoczęcia i zakończenia dla mediów:

<!-- 1. Right-click on a media item
2. Select "Edit Timing" -->

1. Kliknij na czas trwania filmu w lewym górnym rogu miniatury
2. Ustaw godziny rozpoczęcia i zakończenia
3. Zapisz zmiany

#### Powiększenie i panorama {#zoom-pan}

Dla obrazów i filmów:

- **Powiększenie** - Użyj kółka myszy lub sterowania powiększeniem na miniaturze
- **Pan** - Kliknij i przeciągnij miniaturkę, aby przesunąć obraz
- **Resetuj powiększenie** - Kliknij, aby powrócić do oryginalnego powiększenia

#### Skróty klawiaturowe {#user-guide-keyboard-shortcuts}

Skonfiguruj niestandardowe skróty klawiszowe dla szybkiego dostępu. Zauważ, że żadne skróty klawiszowe nie są ustawione domyślnie.

**Wbudowane sterowanie mediami** (gdy główne okno jest skupione i pokazuje listę mediów):

- **Tabela/Shift+Tab** - Nawiguj pomiędzy elementami multimedialnymi
- **Strzałka w górę/w dół** - Nawigacja pomiędzy elementami multimedialnymi
- **Spacja** - Odtwórz/Zatrzymaj media
- **Escape** - Zatrzymaj media

**Konfigurowalne skróty** (gdy włączone są w ustawieniach):

- **Media Window** - Otwórz/zamknij okno multimedialne
- **Poprzednie/następne multimedia** - Nawiguj między elementami multimedialnymi
- \*\*Wstrzymaj/Wznów \*\* - Kontroluj odtwarzanie mediów
- **Zatrzymaj media** - Zatrzymaj odtwarzanie multimediów
- **Przełącznik muzyczny** - Kontroluj muzykę w tle

**Note (\*):** Global shortcut - available even when the app is not focused

## Muzyka w tle {#user-guide-background-music}

### Konfigurowanie muzyki w tle {#background-music-setup}

Muzyka w tle automatycznie odtwarza przed spotkaniami i zatrzymuje się w odpowiednim czasie:

1. **Włącz muzykę** - Włącz muzykę w tle w ustawieniach
2. **Auto-Start** - Muzyka uruchomi się automatycznie, gdy M3 uruchomi, jeśli to stosowne
3. **Stopek spotkania** - Muzyka zatrzymuje się automatycznie przed rozpoczęciem spotkania
4. **Manual Control** - Użyj przycisku muzyki na pasku stanu, aby rozpocząć/zatrzymać ręcznie
5. **Uruchom ponownie** - Wznów muzykę po spotkaniach jednym kliknięciem

## Integracja powiększenia {#user-guide-zoom-integration}

M3 może zintegrować się z Zoom w celu automatycznego udostępniania ekranu:

1. **Włącz integrację** - Włącz integrację powiększenia w ustawieniach
2. \*\*Skonfiguruj Skrót \*\* - Skrót do udostępniania ekranu skonfigurowany w Zoom. Upewnij się, że pole "globalne" jest zaznaczone w Zoom.
3. **Automatyczna kontrola** - M3 automatycznie przełączy udostępnianie ekranu w powiększeniu w razie potrzeby
4. **Ręczne nadpisywanie** - Nadal możesz ręcznie kontrolować udostępnianie ekranu za pomocą Powiększenia w razie potrzeby

## Integracja z OBS Studio {#user-guide-obs-integration}

### Konfigurowanie integracji OBS {#user-guide-obs-setup}

Używać M3 z OBS Studio do spotkań mieszanych:

1. **Zainstaluj OBS Studio** - Pobierz i zainstaluj OBS Studio
2. **Włącz WebSocket** - Zainstaluj wtyczkę WebSocket w OBS
3. **Konfiguruj M3** - Wprowadź port OBS i hasło w ustawieniach M3
4. **Skonfiguruj sceny** - Twórz sceny dla aparatu, mediów i innych treści
5. **Test** - Sprawdź, czy odtwarzanie działa poprawnie

### Zarządzanie scenami OBS {#obs-scene-management}

M3 automatycznie przełącza sceny OBS podczas prezentacji:

- **Scena aparatu** - Pokazuje widok lectern/aparatu
- **Scena multimedialna** - Wyświetla zawartość multimediów
- **Scena obrazu** - Pokazuje obrazy (jeśli włączone, może być odroczone)
- **Automatyczne przełączanie** - Sceny zmieniają się w zależności od typu mediów i ustawień

### Zaawansowane funkcje OBS {#advanced-obs}

#### Opóźnienie zdjęć {#user-guide-postpone-images}

Włącz tę opcję, aby opóźnić udostępnianie obrazów OBS do momentu ręcznego uruchomienia:

1. Włącz "Odroczenie zdjęć" w ustawieniach OBS
2. Obrazy będą udostępniane tylko po kliknięciu przycisku, aby wyświetlić je za pomocą OBS Studio. Jest to przydatne do wyświetlania zdjęć najpierw odbiorcom osobistym.

#### Przełączanie sceny {#user-guide-scene-switching}

Skonfiguruj jak zmienia się scena M3:

- **Przełącz po mediach** - Automatycznie wróć do poprzedniej sceny
- **Zapamiętaj poprzednią scenę** - Przywróć scenę, która była aktywna przed mediami

### Konfiguracja dźwięku dla spotkań hybrydowych {#audio-configuration}

Używając M3 z OBS Studio do spotkań mieszanych (osobiście + Zoom), musisz skonfigurować ustawienia audio, aby upewnić się, że uczestnicy spotkania mogą usłyszeć media:

#### Ustawienia powiększenia dźwięku {#zoom-audio-settings}

**Przed każdym spotkaniem musisz włączyć Oryginalne Audio w Zoom:**

1. **Otwórz Zoom** i przejdź do ustawień
2. **Przejdź do audio** → **Zaawansowane**
3. **Włącz opcję "Pokaż w trakcie spotkania aby 'Włącz Oryginalny Dźwięk'**
4. **Zaznacz "Wyłącz anulowanie echo"** (pierwsze pole wyboru)
5. **Zaznacz "Wyłącz tłumienie hałasu"** (drugie pole wyboru)
6. **Odznacz "Wyłącz tryb muzyczny wysokiej wiarygodności"** (trzecie pole wyboru)
7. **Przed rozpoczęciem każdego spotkania**, kliknij przycisk "Oryginalne Audio" w kontrolach spotkania

**Alternatywnie: Udostępnij dźwięk komputera**
Jeśli oryginalny dźwięk nie działa prawidłowo w Twojej konfiguracji:

1. **Przed odtwarzaniem multimediów**, przejdź do zakładki **Zaawansowane** w opcji udostępniania ekranu powiększenia
2. **Sprawdź "Udostępnij dźwięk komputera"**
3. **Uwaga**: Ta opcja musi być włączona za każdym razem, gdy rozpoczniesz nową sesję powiększenia

**Alternatywne rozwiązanie**: Rozważ skorzystanie z integracji z Zoom, ponieważ używa wbudowanego ekranu i współdzielenia dźwięków w Zoom, które obsługuje dźwięk w sposób bardziej płynny.

#### Dlaczego konfiguracja audio jest niezbędna {#why-audio-config}

M3 odtwarza multimedia z dźwiękiem na komputerze, ale to audio \*\*nie jest automatycznie przesyłane \*\* przez strumień wideo do OBS Studio. To jest takie samo zachowanie, jakie doświadczysz z każdym innym odtwarzaczem multimedialnym.

**Problem z dźwiękiem nie jest związany z M3** - to ograniczenie działania strumieniowania wideo OBS Studio z Zoom. Strumień wideo działa jak wirtualna kamera bez dźwięku, podobnie jak kamera internetowa, więc musisz wyraźnie skonfigurować Zoom aby przechwycić dźwięk komputera. Oznacza to, że Twój komputer ma dwie karty dźwiękowe, a jeśli tak nie jest, prawdopodobnie nie będziesz w stanie pomyślnie użyć integracji z OBS Studio.

**Najlepsza alternatywa**: Rozważ użycie integracji powiększenia M3 zamiast OBS Studio, ponieważ używa natywnego udostępniania ekranu Zoom, który obsługuje dźwięk bardziej płynnie i nie wymaga skomplikowanej konfiguracji dźwięku.

#### Rozwiązywanie problemów z dźwiękiem {#audio-troubleshooting}

**Często zadawane problemy:**

- **Brak dźwięku w Zoom**: Sprawdź, czy oryginalny dźwięk jest włączony i poprawnie skonfigurowany
- **Słaba jakość dźwięku**: Sprawdź, czy trzy oryginalne pola wyboru audio są ustawione poprawnie
- **Dźwięk nie działa po ponownym uruchomieniu Zoom**: Oryginalne ustawienia dźwięku muszą być ponownie włączone dla każdej sesji nowego powiększenia

**Najlepsze praktyki:**

- Testuj konfigurację dźwięku i udostępnianie przed spotkaniami
- Utwórz listę kontrolną dla konfiguracji dźwięku
- Rozważ użycie "Udostępnij dźwięk komputera" jako opcji kopii zapasowej
- **Rozważ użycie integracji powiększenia zamiast OBS Studio** dla prostszej obsługi dźwięku
- Upewnij się, że wszyscy operatorzy AV są znani z tymi ustawieniami

## Zarządzanie importowanymi mediami {#managing-imported-media}

### Importowanie niestandardowych mediów {#importing-custom-media}

Dodaj własne pliki multimedialne do M3:

1. **Import pliku** - Użyj przycisku importu, aby dodać filmy, obrazy lub pliki audio
2. **Przeciągnij i Drop** - Przeciągnij pliki bezpośrednio do M3
3. **Monitorowanie folderów** - Ustaw obejrzany folder dla automatycznego importu
4. **Pliki JWPUB i playlisty** - Importuj publikacje i playlisty
5. **Public Talk Media (S-34 / S-34mp)** - Importuj publiczne media do rozmów za pomocą plików S-34 lub S-34mp JWPUB

### Import i zarządzanie multimediami {#media-import}

- **Organizuj według daty** - Przypisz zaimportowane media do określonych dat
- **Niestandardowe sekcje** - Utwórz własne sekcje dla organizacji
- **Edytuj właściwości** - Modyfikuj tytuły, opisy i harmonogram
- **Usuń multimedia** - Usuń niechciane elementy multimediów

### Import Biblii audio {#audio-bible-import}

Importuj nagrania audio z Biblii:

1. Kliknij przycisk "Biblia dźwiękowa"
2. Wybierz książkę i rozdział Biblii
3. Choose specific verses or verse ranges
4. Pobierz pliki audio
5. Użyj ich

## Monitorowanie folderów i eksport {#user-guide-folder-monitoring}

### Konfigurowanie monitorowania folderów {#folder-monitoring-setup}

Monitoruj folder dla nowych multimediów:

1. **Włącz obserwator folderów** - Włącz monitorowanie folderów w ustawieniach
2. **Wybierz folder** - Wybierz folder do monitorowania
3. **Automatyczne importowanie** - Nowe pliki są automatycznie dodawane do M3
4. **Organizacja** - Pliki są zorganizowane według daty w oparciu o strukturę folderów

### Eksport mediów {#user-guide-media-export}

Automatycznie eksportuj media do zorganizowanych folderów:

1. **Włącz Auto-Export** - Włącz eksport mediów w ustawieniach
2. **Wybierz folder eksportu** - Wybierz gdzie zapisać wyeksportowane pliki
3. **Automatyczna organizacja** - Pliki są zorganizowane według daty i sekcji
4. **Opcje formatu** - Konwertuj pliki na MP4 dla lepszej kompatybilności

## Prezentacja strony {#website-presentation}

### Prezentacja Oficjalnej Witryny {#presenting-the-website}

Udostępnij oficjalną stronę internetową na zewnętrznych wyświetlaczach:

1. **Otwórz tryb strony internetowej** - Kliknij przycisk prezentacji strony
2. **Wyświetlacz zewnętrzny** - Strona otwiera się w nowym oknie
3. **Nawigacja** - Użyj kontroli przeglądarki do nawigacji

### Kontrole witryny {#website-controls}

- **Nawigacja** - Standardowa nawigacja przeglądarki
- **Odśwież** - Odśwież bieżącą stronę
- **Zamknij** - Tryb prezentacji strony zamykającej

## Zaawansowane funkcje {#user-guide-advanced-features}

### Wiele kongregacji {#user-guide-multiple-congregations}

Zarządzaj wieloma kongresami lub grupami:

1. **Utwórz profile** - Skonfiguruj oddzielne profile dla różnych kongresów
2. **Przełącz profile** - Użyj selektora konfigurowania, aby przełączać się między profilami
3. **Ustawienia oddzielne** - Każdy profil ma własne ustawienia i media
4. **Zasoby współdzielone** - Pliki multimedialne są współdzielone między profilami w miarę możliwości

### Skróty klawiaturowe {#keyboard-shortcuts-guide}

Skonfiguruj niestandardowe skróty klawiszowe dla efektywnej operacji:

1. **Włącz skróty** - Włącz skróty klawiszowe w ustawieniach
2. **Skonfiguruj skróty** - Skonfiguruj skróty dla wspólnych akcji
3. **Ćwiczenie** - Naucz się swoich skrótów dla szybszej operacji
4. **Dostosuj** - Dostosuj skróty do swoich preferencji

## Rozwiązywanie problemów {#troubleshooting-guide}

### Najczęstsze problemy {#common-issues}

#### Media nie pobierane {#user-guide-media-not-downloading}

- Sprawdź ustawienia harmonogramu spotkań
- Zweryfikuj połączenie internetowe
- Sprawdź, czy media są dostępne w wybranym języku

#### Integracja OBS nie działa {#user-guide-obs-not-working}

- Zweryfikuj zainstalowaną wtyczkę OBS WebSocket
- Sprawdź ustawienia portu i hasła
- Upewnij się, że OBS jest uruchomiony

#### Problemy z dźwiękiem w Zoom/OBS {#audio-issues}

- **Brak dźwięku w powiększeniu**: Włącz oryginalny dźwięk w ustawieniach powiększenia przed każdym spotkaniem
- **Słaba jakość dźwięku**: Sprawdź trzy oryginalne pola wyboru audio (pierwsze dwa włączone, trzecie wyłączone)
- **Dźwięk nie działa po ponownym uruchomieniu**: Oryginalny dźwięk musi być ponownie włączony dla każdej nowej sesji powiększenia
- **Alternatywne rozwiązanie**: Użyj opcji "Udostępnij dźwięk komputera" w powiększeniu ekranu

#### Problemy z wydajnością {#user-guide-performance-issues}

- Włącz pamięć podręczną
- Zmniejsz maksymalną rozdzielczość
- Wyczyść stare pliki pamięci podręcznej
- Sprawdź dostępne miejsce na dysku

#### Problemy językowe {#user-guide-language-issues}

- Sprawdź ustawienia języka mediów
- Upewnij się, że język jest dostępny na JW.org
- Wypróbuj język zastępczy
- Zweryfikuj ustawienia języka interfejsu

### Uzyskiwanie pomocy {#getting-help}

Jeśli napotkasz problemy:

1. **Sprawdź dokumentację** - Przejrzyj ten przewodnik i inną dostępną dokumentację
2. **Szukaj problemów** - Szukaj podobnych problemów na GitHub
3. **Zgłoś problemy** - Utwórz nowy problem ze szczegółowymi informacjami

## Najlepsze praktyki {#best-practices}

### Po spotkaniach {#after-meetings}

1. **Sprawdź pobierania** - Upewnij się, że wszystkie media są pobierane
2. **Wyposażenie testowe** - Sprawdzanie wyświetlaczy i pracy audio
3. **Przygotuj multimedia** - Przejrzyj i zorganizuj media na spotkanie; upewnij się, że nie brakuje żadnych plików multimedialnych
4. **Skonfiguruj audio** - W przypadku spotkań hybrydowych włącz Oryginalne Audio w Zoom lub ustaw "Udostępnij dźwięk komputera"

### Podczas spotkań {#during-meetings}

1. **Bądź w centrum uwagi** - Użyj czystego i wolnego od rozproszenia interfejsu
2. **Użyj skrótów klawiaturowych** - Skróty klawiszowe do gładkiej pracy
3. **Monitoruj dźwięk** - Miej oko na poziomy głośności, jeśli to część swoich obowiązków
4. **Bądź gotowy** - Przygotuj następny element multimedialny
5. **Zweryfikuj audio** - Na spotkaniach hybrydowych upewnij się, że uczestnicy powiększenia mogą usłyszeć media

### Przed spotkaniami {#before-meetings}

1. **Uruchom muzykę w tle** - Rozpocznij odtwarzanie muzyki w tle
2. **Zaplanuj Ahead** - Przygotuj się na następne spotkanie upewniając się, że wszystko jest gotowe
3. \*\*Wyczyść \*\* - Zamknij odtwarzacz multimediów, gdy będziesz gotowy do opuszczenia

### Regularna konserwacja {#regular-maintenance}

1. **Aktualizuj M3** - aktualizuj aplikację
2. **Wyczyść pamięć podręczną** - Okresowo wyczyść stare pliki pamięci podręcznej
3. **Sprawdź ustawienia** - Przejrzyj i zaktualizuj ustawienia w razie potrzeby

# Guia de Configurações {#settings-guide}

Este guia abrangente explica todas as configurações disponíveis em M³, organizadas por categoria. Compreender essas configurações irá ajudá-lo a configurar o M3 para funcionar perfeitamente para as necessidades da sua congregação.

## Configuração do aplicativo {#application-configuration}

### Exibir Idioma {#display-language}

<!-- **Setting**: `localAppLang` -->

Escolha o idioma para a interface do M³'s Isso é independente do idioma usado para downloads de mídia.

**Opções**: Todos os idiomas da interface disponíveis (Inglês, Espanhol, Francês, etc.)

**Padrão**: Inglês

### Modo Escuro {#dark-mode}

<!-- **Setting**: `darkMode` -->

Controle a aparência do tema do M³.

**Opções**:

- Ativar automaticamente com base na preferência do sistema
- Sempre usar o modo escuro
- Sempre usar o modo claro

**Padrão**: Automático

### Primeiro dia da semana {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Configura qual dia deve ser considerado o primeiro dia da semana na visualização do calendário.

**Opções**: Domingo a Sábado

**Padrão**: Domingo

### Início automático no login {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Automaticamente inicia o M³ quando o computador for iniciado.

**Padrão**: `false`

## Reuniões de Congregação {#congregation-meetings}

### Nome da Congregação {#congregation-name}

<!-- **Setting**: `congregationName` -->

O nome da sua congregação. Isto é usado para fins de organização e exibição.

**Padrão**: Vazio (deve ser definido durante a configuração)

### Idioma da reunião {#meeting-language}

<!-- **Setting**: `lang` -->

O idioma principal para downloads de mídia. Isto deve corresponder ao idioma usado nas reuniões da sua congregação.

**Opções**: Todas as línguas disponíveis no site oficial das Testemunhas de Jeová

**Padrão**: Inglês (E)

### Idioma secundário {#fallback-language}

<!-- **Setting**: `langFallback` -->

Um idioma secundário a ser usado quando a mídia não está disponível no idioma principal.

**Opções**: Todas as línguas disponíveis no site oficial das Testemunhas de Jeová

**Padrão**: Nenhum

### Reunião do Meio de Semana {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

O dia da semana em que é realizada a reunião do meio de semana.

**Opções**: Domingo a Sábado

**Padrão**: Nenhum (deve ser definido durante a configuração)

### Horário da reunião de meio de semana {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

O horário de início da sua reunião de meio de semana.

**Formato**: HH:MM (formato 24 horas)

**Padrão**: Nenhum (deve ser definido durante a configuração)

### Dia da Reunião do Fim de Semana {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

O dia da semana em que é realizada a reunião do fim de semana.

**Opções**: Domingo a Sábado

**Padrão**: Nenhum (deve ser definido durante a configuração)

### Horário da reunião de fim de semana {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

O horário de início da sua reunião de fim de semana.

**Formato**: HH:MM (formato 24 horas)

**Padrão**: Nenhum (deve ser definido durante a configuração)

### Semana do Superintendente de Circuito {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

A semana da próxima visita do superintendente de circuito.

**Formato**: MM/DD/YYYY

**Padrão**: Nenhum

### Data da Celebração {#memorial-date}

<!-- **Setting**: `memorialDate` -->

A data da próxima Celebração (recurso beta).

**Formato**: MM/DD/YYYY

**Padrão**: obtida automaticamente periodicamente

### Mudanças na Programação das Reuniões

Estas configurações permitem que você configure mudanças temporárias na sua programação de reuniões:

- **Data de alteração**: Quando a alteração entra em vigor
- **Mudança única**: Se esta é uma mudança permanente ou temporária
- **Novo Dia do Meio de Semana**: novo dia para a reunião do meio de semana
- **Novo Horário do Meio de Semana**: novo horário para a reunião do meio de semana
- **Nova Dia do Fim de Semana**: Novo dia para a reunião do fim de semana
- \*\*Novo Horário do Fim de Semana \*\*: novo horário da reunião do fim de semana

## Recuperação de mídia e reprodução {#media-retrieval-and-playback}

### Conexão limitada {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Ative isto se você estiver em uma conexão de dados limitada para reduzir o uso de largura de banda.

**Padrão**: `false`

### Visualização de mídia {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Habilita a funcionalidade de exibição de mídia. Isto é necessário para apresentar mídia num segundo monitor.

**Padrão**: `false`

### Música de Fundo {#settings-guide-background-music}

#### Habilitar música {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Habilitar a funcionalidade de música de fundo.

**Padrão**: `true`

#### Iniciar música automaticamente {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Iniciar automaticamente a música de fundo quando o M³ abrir, se apropriado.

**Padrão**: `true`

#### Buffer de parada {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Quantos segundos antes da hora inicial da reunião para parar o cântico de fundo.

**Intervalo**: 0-300 segundos

**Padrão**: 60 segundos

#### Volume da música {#music-volume}

<!-- **Setting**: `musicVolume` -->

Nível de volume para música de fundo (1-100%).

**Padrão**: 100%

### Gerenciamento de cache {#cache-management}

#### Habilitar Cache Extra {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Ativar cache adicional para melhor desempenho.

**Padrão**: `false`

#### Pasta de cache {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Local personalizado para armazenar arquivos de mídia em cache.

**Padrão**: Localização padrão do sistema

#### Habilitar o Cache Auto-Limpar {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Limpa automaticamente arquivos em cache antigos para economizar espaço em disco.

**Padrão**: `true`

### Monitoramento de pasta {#settings-guide-folder-monitoring}

#### Habilitar pasta Monitorada {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Monitore uma pasta para novos arquivos de mídia e adicione-os automaticamente ao M³.

**Padrão**: `false`

#### Pasta para Monitorar {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

O caminho da pasta para monitorar novos arquivos de mídia.

**Padrão**: Vazio

## Integrações {#integrations}

### Integração com Zoom {#settings-guide-zoom-integration}

#### Habilitar Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Habilita recursos de integração de Zoom

**Padrão**: `false`

#### Atalho de compartilhamento de tela {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Atalho de teclado para ativar o compartilhamento de tela do Zoom.

**Padrão**: Nenhum

### Integração OBS Studio {#settings-guide-obs-integration}

#### Habilitar OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Ativa integração do OBS Studio para troca automática de cena.

**Padrão**: `false`

:::warning Nota importante:

**Configuração de áudio necessária**: a integração do OBS Studio apenas lida com o compartilhamento de tela. Áudio de mídia M³ **não é transmitido automaticamente** para Zoom para os participantes ao usar o OBS Studio. Você deve configurar as configurações de áudio originais do Zoom ou usar "Compartilhar som do computador" para garantir que os participantes da reunião possam ouvir a mídia. Veja o [Guia do Usuário](/user-guide#audio-configuration) para instruções detalhadas de configuração de áudio.

**Nota**: A integração Zoom usa o compartilhamento de tela nativo do Zoom, o que lida com o áudio de forma mais transparente do que a integração do OBS Studio.

:::

#### Porta OBS {#obs-port}

<!-- **Setting**: `obsPort` -->

O número da porta para conectar ao OBS Studio WebSocket.

**Padrão**: Nenhum

#### Senha OBS {#obs-password}

<!-- **Setting**: `obsPassword` -->

A senha para a conexão WebSocket do OBS Studio.

**Padrão**: Nenhum

#### Cenas OBS {#obs-scenes}

Configurar quais cenas OBS usar para diferentes fins:

- **Cena da câmera**: A cena mostra a câmera/lectern
- **Media Scene**: Scene for displaying media
- **Image Scene**: Scene for displaying images (for example, a PIP scene showing both media and the speaker)

#### OBS Advanced Options {#obs-advanced-options}

- **Postpone Images**: Delay sharing images to OBS until manually triggered
- **Quick Toggle**: Enable quick on/off toggle for OBS integration
- **Switch Scene After Media**: Automatically return to previous scene after media
- **Remember Previous Scene**: Remember and restore the previous scene
- **Hide Icons**: Hide OBS-related icons in the interface

:::warning Nota importante:

**Audio Configuration Required**: OBS Studio integration only handles video/scene switching. Audio from M³ media is **not automatically transmitted** to Zoom or OBS. The video stream works like a virtual camera without sound, just like a webcam. Você deve configurar as configurações de áudio originais do Zoom ou usar "Compartilhar som do computador" para garantir que os participantes da reunião possam ouvir a mídia. Veja o [Guia do Usuário](/user-guide#audio-configuration) para instruções detalhadas de configuração de áudio.

**Alternative**: Consider using the Zoom integration instead, as it uses Zoom's native screen sharing which handles audio more seamlessly.

:::

## Advanced Settings {#advanced-settings}

### Keyboard Shortcuts {#settings-guide-keyboard-shortcuts}

#### Enable Keyboard Shortcuts {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Enable customizable keyboard shortcuts for media control.

**Padrão**: `false`

#### Media Control Shortcuts {#media-control-shortcuts}

Configure shortcuts for media playback:

- **Media Window**: Open/close media window
- **Previous Media**: Go to previous media item
- **Next Media**: Go to next media item
- **Pause/Resume**: Pause or resume media playback
- **Stop Media**: Stop media playback
- **Music Toggle**: Toggle background music

### Media Display {#media-display}

#### Hide Media Logo {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Hide the logo in the media window.

**Padrão**: `false`

#### Maximum Resolution {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Maximum resolution for downloaded media files.

**Options**: 240p, 360p, 480p, 720p

**Default**: 720p

#### Include Printed Media {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Include media from the printed publications in media downloads.

**Padrão**: `true`

#### Exclude Footnotes {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclude footnote images from media downloads when possible.

**Padrão**: `false`

#### Exclude media from the Teaching brochure {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Exclude media from the Teaching (th) brochure from media downloads.

**Padrão**: `true`

### Subtitles {#subtitles}

#### Enable Subtitles {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Enable subtitle support for media playback.

**Padrão**: `false`

#### Subtitle Language {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Language for subtitles (can be different from media language).

**Opções**: Todas as línguas disponíveis no site oficial das Testemunhas de Jeová

**Padrão**: Nenhum

### Media Export {#settings-guide-media-export}

#### Enable Media Auto-Export {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Automatically export media files to a specified folder.

**Padrão**: `false`

#### Media Export Folder {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Folder path where media files will be automatically exported.

**Padrão**: Vazio

#### Convert Files to MP4 {#convert-files-to-mp4}

**Setting**: `convertFilesToMp4`

Convert exported media files to MP4 format for better compatibility.

**Padrão**: `false`

### Danger Zone {#danger-zone}

:::warning Aviso

These settings should only be changed if you understand their implications.

:::

#### Disable Media Fetching {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Completely disable automatic media downloads. Use this only for profiles that will be used for special events or other custom setups.

**Padrão**: `false`

## Tips for Optimal Configuration {#configuration-tips}

### For New Users {#new-users}

1. Start with the setup wizard to configure basic settings
2. Enable "Media Display Button" to access presentation features
3. Configure your meeting schedule accurately
4. Set up OBS integration if you use hybrid meetings

### For Advanced Users {#advanced-users}

1. Use folder monitoring to sync media from cloud storage
2. Enable media auto-export for backup purposes
3. Configure keyboard shortcuts for efficient operation
4. Configure Zoom integration for automatic screen sharing

### Performance Optimization {#performance-optimization}

1. Enable extra cache for better performance
2. Use appropriate maximum resolution for your needs
3. Configure cache auto-clear to manage disk space
4. Consider metered connection setting if on limited bandwidth

### Troubleshooting {#settings-guide-troubleshooting}

- If media isn't downloading, check your meeting schedule settings
- If OBS integration isn't working, verify port and password settings
- If performance is slow, try enabling extra cache or reducing resolution
- If you're having language issues, check both interface and media language settings
- If Zoom participants can't hear media audio, configure Zoom's Original Audio settings or use "Share Computer Sound"
- **Tip**: Consider using Zoom integration instead of OBS Studio for simpler audio handling

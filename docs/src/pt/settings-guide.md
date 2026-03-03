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

### Date Format {#date-format}

<!-- **Setting**: `localDateFormat` -->

Format used to display dates in the app.

**Example**: D MMMM YYYY

**Default**: D MMMM YYYY

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

#### Begin Playback Paused {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Start videos in a paused state when playback begins.

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
- **Cena de mídia**: cena para exibir a mídia
- **Cena de Imagem**: Cena para exibir imagens (por exemplo, uma cena PIP mostrando a mídia e o orador)

#### Opções Avançadas do OBS {#obs-advanced-options}

- **Postpone Imagens**: Atrasar compartilhamento de imagens no OBS até ser acionado manualmente
- **Alternador rápido**: Ativa o alternador rápido para a integração do OBS
- **Mudar a cena após a mídia**: retornar automaticamente para a cena anterior após a mídia
- **Lembra da cena anterior**: lembre-se e restaure a cena anterior
- **Ocultar Ícones**: Esconder ícones relacionados ao OBS na interface

:::warning Nota importante:

**Configuração de áudio necessária**: integração do OBS Studio lida apenas com a mudança de vídeo/cena. Áudio de mídia M³ **não é transmitido automaticamente** para Zoom ou OBS. O stream de vídeo funciona como uma câmera virtual sem som, como uma webcam. Você deve configurar as configurações de áudio originais do Zoom ou usar "Compartilhar som do computador" para garantir que os participantes da reunião possam ouvir a mídia. Veja o [Guia do Usuário](/user-guide#audio-configuration) para instruções detalhadas de configuração de áudio.

**Alternativa**: Considere usar a integração com o Zoom, pois usa o compartilhamento de tela nativo do Zoom, o que lida com o áudio mais facilmente.

:::

### Custom Events {#custom-events}

#### Enable Custom Events {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Enable custom shortcuts that will be triggered when a specific event is detected (e.g., media is played, paused, or stopped).

**Padrão**: `false`

#### Custom Event Shortcuts {#custom-event-shortcuts}

##### Play Media Shortcut {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Shortcut that is triggered when media is played.

**Padrão**: Nenhum

##### Pause Media Shortcut {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Shortcut that is triggered when media is paused.

**Padrão**: Nenhum

##### Stop Media Shortcut {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Shortcut that is triggered when media is stopped.

**Padrão**: Nenhum

##### Last Song Shortcut {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Shortcut that is triggered when the last song is played during a meeting.

**Padrão**: Nenhum

## Configurações Avançadas {#advanced-settings}

### Atalhos de teclado {#settings-guide-keyboard-shortcuts}

#### Habilitar atalhos de teclado {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Ativar atalhos personalizáveis de teclado para controle de mídia.

**Padrão**: `false`

#### Atalhos de Controle de Mídia {#media-control-shortcuts}

Configurar atalhos para reprodução de mídia:

- **Janela de Mídia**: Abrir/fechar janela de mídia
- **Mídia Anterior**: Ir para o item de mídia anterior
- **Próxima mídia**: Ir para o próximo item de mídia
- **Pausar/Reproduzir**:  Controlar a reprodução de mídia
- **Parar Mídia**: Parar reprodução de mídia
- **Mudança de cântico**: Mudar o cântico de fundo

### Visualização de mídia {#media-display}

#### Enable Media Window Fade Transitions {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Enable fade-in/out transitions when showing or hiding the media window.

**Padrão**: `true`

#### Ocultar miniatura de mídia {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Ocultar a miniatura na janela de mídia.

**Padrão**: `false`

#### Resolução Máxima {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Resolução máxima para arquivos de mídia baixados.

**Opções**: 240p, 360p, 480p, 720p

**Padrão**: 720p

#### Incluir Mídia Impressa {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Incluir mídia nas publicações impressas nos downloads de mídia.

**Padrão**: `true`

#### Excluir Notas de Rodapé {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Excluir imagens de rodapé dos downloads de mídia quando possível.

**Padrão**: `false`

#### Excluir mídia da brochura Melhore {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Excluir a mídia da brochura Melhore (th) dos downloads de mídia.

**Padrão**: `true`

### Legendas {#subtitles}

#### Habilitar Legendas {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Ativar suporte a legendas para reprodução de mídia.

**Padrão**: `false`

#### Idioma da legenda {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Idioma para legendas (pode ser diferente do idioma da mídia).

**Opções**: Todas as línguas disponíveis no site oficial das Testemunhas de Jeová

**Padrão**: Nenhum

### Exportação de Mídia {#settings-guide-media-export}

#### Habilitar Exportação Automática de Mídia {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exporta arquivos de mídia para uma pasta específica.

**Padrão**: `false`

#### Pasta de exportação de mídia {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Caminho da pasta onde os arquivos de mídia serão exportados automaticamente.

**Padrão**: Vazio

#### Converter arquivos para MP4 {#convert-files-to-mp4}

**Configuração**: `convertFilesToMp4`

Converta arquivos de mídia exportados para o formato MP4 para uma melhor compatibilidade.

**Padrão**: `false`

### Zona de perigo {#danger-zone}

:::warning Aviso

Estas configurações só devem ser alteradas se você entender suas implicações.

:::

#### Base URL {#base-url}

<!-- **Setting**: `baseUrl` -->

Base domain used to download publications and media.

**Default**: `jw.org`

#### Desativar busca de mídia {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Desativar completamente downloads automáticos de mídia. Use isto apenas para perfis que serão usados para eventos especiais ou outras configurações personalizadas.

**Padrão**: `false`

## Dicas para configuração ideal {#configuration-tips}

### Para novos usuários {#new-users}

1. Comece com o assistente de configuração para configurar as configurações básicas
2. Ative "Botão de Exibição de Mídia" para acessar os recursos de apresentação
3. Configure com precisão a sua programação de reunião
4. Configure a integração do OBS se você usar reuniões híbridas

### Para usuários avançados {#advanced-users}

1. Usar monitoramento de pastas para sincronizar mídias do armazenamento na nuvem
2. Habilitar a exportação automática de mídia para backup
3. Configurar atalhos de teclado para operação eficiente
4. Configurar integração de Zoom para compartilhamento automático de tela

### Otimização de desempenho {#performance-optimization}

1. Ativar cache adicional para melhor desempenho
2. Use a resolução máxima apropriada para suas necessidades
3. Configurar a limpeza automática de cache para gerenciar o espaço em disco
4. Considere configuração de conexão limitada se você usa uma largura de banda limitada

### Solução de problemas {#settings-guide-troubleshooting}

- Se a mídia não estiver sendo baixada, verifique suas configurações de programação de reunião
- Se a integração do OBS não funcionar, verifique as configurações da porta e da senha
- Se o desempenho estiver lento, tente ativar o cache extra ou reduzir a resolução
- Se estiver tendo problemas com o idioma, verifique as configurações de idioma da interface e mídia
- Se os participantes do Zoom não conseguirem ouvir o áudio da mídia, verifique as configurações originais do Zoom ou use "Compartilhar som do computador"
- **Dica**: Considere usar a integração de Zoom em vez do OBS Studio para um processamento de áudio mais simples

# Manual de configurações {#settings-guide}

Este guia completo explica todas as configurações disponíveis no M³, organizadas por categoria. Entender essas configurações vai ajudar você a configurar o M³ para atender perfeitamente às necessidades da sua congregação.

## Geral {#application-configuration}

### Idioma da interface {#display-language}

<!-- **Setting**: `localAppLang` -->

Escolha o idioma da interface do M³. Isso é independente do idioma usado para downloads de mídia.

**Opções**: Todos os idiomas de interface disponíveis (inglês, espanhol, francês etc.)

**Padrão**: Inglês

### Modo escuro {#dark-mode}

<!-- **Setting**: `darkMode` -->

Define o tema de aparência do M³.

**Opções**:

- Alternar automaticamente de acordo com a preferência do sistema
- Sempre usar o modo escuro
- Sempre usar o modo claro

**Padrão**: Automático

### Primeiro dia da semana {#first-day-of-week}

<!-- **Setting**: `firstDayOfWeek` -->

Configura qual dia deve ser considerado o primeiro dia da semana na visualização do calendário.

**Opções**: domingo a sábado

**Padrão**: Domingo

### Formato de data {#date-format}

<!-- **Setting**: `localDateFormat` -->

Formato usado para exibir datas no aplicativo.

**Exemplo**: D MMMM YYYY

**Padrão**: D MMMM YYYY

### Início automático no login {#auto-start-at-login}

<!-- **Setting**: `autoStartAtLogin` -->

Inicia o M³ automaticamente quando o computador é ligado.

**Padrão**: `false`

## Reuniões da congregação {#congregation-meetings}

### Nome da congregação {#congregation-name}

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

### Dia da reunião do meio de semana {#midweek-meeting-day}

<!-- **Setting**: `mwDay` -->

O dia da semana em que é realizada a reunião do meio de semana.

**Opções**: domingo a sábado

**Padrão**: Nenhum (deve ser definido durante a configuração)

### Horário da reunião do meio de semana {#midweek-meeting-time}

<!-- **Setting**: `mwStartTime` -->

O horário de início da sua reunião do meio de semana.

**Formato**: HH:MM (formato 24 horas)

**Padrão**: Nenhum (deve ser definido durante a configuração)

### Dia da reunião do fim de semana {#weekend-meeting-day}

<!-- **Setting**: `weDay` -->

O dia da semana em que é realizada a reunião do fim de semana.

**Opções**: domingo a sábado

**Padrão**: Nenhum (deve ser definido durante a configuração)

### Horário da reunião do fim de semana {#weekend-meeting-time}

<!-- **Setting**: `weStartTime` -->

O horário de início da sua reunião do fim de semana.

**Formato**: HH:MM (formato 24 horas)

**Padrão**: Nenhum (deve ser definido durante a configuração)

### Semana do superintendente de circuito {#circuit-overseer-week}

<!-- **Setting**: `coWeek` -->

A semana da próxima visita do superintendente de circuito.

**Formato**: MM/DD/YYYY

**Padrão**: Nenhum

### Data da Celebração {#memorial-date}

<!-- **Setting**: `memorialDate` -->

A data da próxima Celebração.

**Formato**: MM/DD/YYYY

**Padrão**: Obtida automaticamente de tempos em tempos

### Mudanças na programação das reuniões {#meeting-schedule-changes}

Estas configurações permitem que você configure mudanças temporárias na sua programação de reuniões:

- **Data da mudança**: Quando a mudança entra em vigor
- **Mudança única**: Se esta é uma mudança permanente ou temporária
- **Novo dia do meio de semana**: Novo dia da reunião do meio de semana
- **Novo horário do meio de semana**: Novo horário da reunião do meio de semana
- **Novo dia do fim de semana**: Novo dia da reunião do fim de semana
- **Novo horário do fim de semana**: Novo horário da reunião do fim de semana

### Atualizações automáticas da programação das reuniões {#automatic-meeting-schedule-updates}

<!-- **Setting**: `enableAutomaticMeetingScheduleUpdates` -->

Quando esta opção está ativada, o M³ verifica periodicamente no site oficial das Testemunhas de Jeová se houve mudanças nos dias e horários das reuniões e atualiza o perfil atual automaticamente.

Isso só funciona para perfis que foram adicionados com a pesquisa congregacional e cujo nome da congregação não foi alterado manualmente. Se a sincronização foi desativada porque o nome da congregação mudou, use **Habilitar sincronização de programação** para vincular o perfil novamente.

#### Habilitar sincronização de programação {#relink-congregation}

<!-- **Setting**: `relinkCongregationButton` -->

Vincula novamente o perfil atual à pesquisa congregacional para que as atualizações automáticas dos dias e horários das reuniões possam ser retomadas. Só aparece depois que o nome da congregação foi alterado manualmente, já que é justamente isso que desfaz o vínculo.

#### Atualizar programação das reuniões {#refresh-meeting-schedule}

<!-- **Setting**: `reSyncMeetingScheduleButton` -->

Sincroniza manualmente a programação atual e futura das reuniões com as informações do site oficial.

## Mídia e reprodução {#media-retrieval-and-playback}

### Conexão limitada {#metered-connection}

<!-- **Setting**: `meteredConnection` -->

Ative isto se você estiver em uma conexão de dados limitada para reduzir o uso de largura de banda.

**Padrão**: `false`

### Exibição de mídia {#media-display-button}

<!-- **Setting**: `enableMediaDisplayButton` -->

Habilita a funcionalidade de exibição de mídia. Isto é necessário para apresentar mídia num segundo monitor.

**Padrão**: `false`

#### Habilitar pré-visualização de mídia {#enable-media-preview}

<!-- **Setting**: `enableMediaPreview` -->

Mostra uma prévia ao vivo da janela de mídia enquanto uma imagem ou vídeo está sendo exibido.

**Padrão**: `true`

#### Começar reprodução pausada {#begin-playback-paused}

<!-- **Setting**: `beginPlaybackPaused` -->

Iniciar vídeos em estado pausado quando a reprodução começar.

**Padrão**: `false`

### Cânticos de fundo {#settings-guide-background-music}

#### Habilitar cânticos de fundo {#enable-music-button}

<!-- **Setting**: `enableMusicButton` -->

Habilita o recurso de cânticos de fundo.

**Padrão**: `true`

#### Iniciar cânticos de fundo automaticamente {#auto-start-music}

<!-- **Setting**: `autoStartMusic` -->

Inicia automaticamente os cânticos de fundo quando o M³ é aberto, se for o momento apropriado.

**Padrão**: `true`

#### Antecedência para parar os cânticos {#meeting-stop-buffer}

<!-- **Setting**: `meetingStopBufferSeconds` -->

Quantos segundos antes do início da reunião os cânticos de fundo devem parar.

**Intervalo**: 0-300 segundos

**Padrão**: 60 segundos

#### Volume dos cânticos de fundo {#music-volume}

<!-- **Setting**: `musicVolume` -->

Nível de volume dos cânticos de fundo (1-100%).

**Padrão**: 100%

### Opções de reprodução e download {#media-display}

<!-- This section covers mediaRetrievalPlayback's `media-display` settings subgroup -
these control the media window's playback behavior and which downloaded media is
filtered out, as distinct from the "Media Display" section above (which is about
whether the media window feature is enabled at all). -->

#### Habilitar transições de fade da janela de mídia {#enable-media-window-fade-transitions}

<!-- **Setting**: `enableMediaWindowFadeTransitions` -->

Habilitar transições de fade in/out ao mostrar ou ocultar a janela de mídia.

**Padrão**: `true`

#### Ativar controle de velocidade de reprodução {#enable-playback-speed-control}

<!-- **Setting**: `enablePlaybackSpeedControl` -->

Permitir que a velocidade de reprodução de áudio e vídeo seja ajustada no menu de contexto do item de mídia.

**Padrão**: `false`

#### Ocultar logotipo da mídia {#hide-media-logo}

<!-- **Setting**: `hideMediaLogo` -->

Oculta o logotipo na janela de mídia.

**Padrão**: `false`

#### Resolução máxima {#maximum-resolution}

<!-- **Setting**: `maxRes` -->

Resolução máxima para arquivos de mídia baixados.

**Opções**: 240p, 360p, 480p, 720p, 1080p

**Padrão**: 720p

#### Incluir mídia impressa {#include-printed-media}

<!-- **Setting**: `includePrinted` -->

Inclui a mídia das publicações impressas nos downloads de mídia.

**Padrão**: `true`

#### Excluir notas de rodapé {#exclude-footnotes}

<!-- **Setting**: `excludeFootnotes` -->

Exclui as imagens das notas de rodapé dos downloads de mídia, quando possível.

**Padrão**: `false`

#### Excluir vídeos adicionais do Estudo de A Sentinela {#exclude-additional-watchtower-study-videos}

<!-- **Setting**: `excludeWtParagraphVideos` -->

Exclui os vídeos adicionais mencionados nos parágrafos do Estudo de A Sentinela.

**Padrão**: `false`

#### Excluir vídeos do Estudo bíblico de congregação {#exclude-cbs-pubs}

<!-- **Setting**: `excludeCbsPubs` -->

Escolha as publicações cujos vídeos mencionados não devem ser mostrados durante o Estudo bíblico de congregação. Pesquise pelo título ou pelo símbolo da publicação.

**Padrão**: Ande Corajosamente com Deus (`wcg`)

#### Excluir mídia da brochura Melhore {#exclude-theocratic-ministry-school}

<!-- **Setting**: `excludeTh` -->

Excluir a mídia da brochura Melhore (th) dos downloads de mídia.

**Padrão**: `true`

### Legendas {#subtitles}

#### Habilitar legendas {#enable-subtitles}

<!-- **Setting**: `enableSubtitles` -->

Ativar suporte a legendas para reprodução de mídia.

**Padrão**: `false`

#### Idioma da legenda {#subtitle-language}

<!-- **Setting**: `langSubtitles` -->

Idioma para legendas (pode ser diferente do idioma da mídia).

**Opções**: Todas as línguas disponíveis no site oficial das Testemunhas de Jeová

**Padrão**: Nenhum

### Gerenciamento do armazenamento local {#cache-management}

#### Armazenamento local para cânticos em vídeo {#enable-extra-cache}

<!-- **Setting**: `enableExtraCache` -->

Armazena localmente, com antecedência, todos os cânticos em vídeo para melhorar o desempenho. Observe que isso aumenta o tamanho do armazenamento local de mídia.

**Padrão**: `false`

#### Local de armazenamento {#cache-folder}

<!-- **Setting**: `cacheFolder` -->

Local personalizado para armazenar arquivos de mídia em cache.

**Padrão**: Localização padrão do sistema

#### Ativar limpeza automática de cache {#enable-cache-auto-clear}

<!-- **Setting**: `enableCacheAutoClear` -->

Limpa automaticamente arquivos em cache antigos para economizar espaço em disco.

**Padrão**: `true`

### Títulos dos cânticos em pinyin {#pinyin-song-titles}

#### Preferir cânticos em pinyin {#enable-pinyin-songs}

<!-- **Setting**: `enablePinyinSongs` -->

Quando uma versão em pinyin de um cântico da reunião for encontrada na pasta de cânticos em pinyin, ela será usada no lugar do cântico padrão.

**Padrão**: `false`

#### Pasta de cânticos em pinyin {#pinyin-song-folder}

<!-- **Setting**: `pinyinSongFolder` -->

Pasta que contém os vídeos dos cânticos em pinyin (por exemplo, `sjjm_s-Pi_CHS_066_r720P.mp4`). Quando for encontrado um arquivo em pinyin correspondente ao número do cântico da reunião, ele será reproduzido no lugar do cântico padrão.

**Padrão**: Vazio

### Exportação de mídia {#settings-guide-media-export}

#### Habilitar exportação automática de mídia {#enable-media-auto-export}

<!-- **Setting**: `enableMediaAutoExport` -->

Exporta automaticamente os arquivos de mídia para uma pasta especificada.

**Padrão**: `false`

#### Pasta de exportação de mídia {#media-export-folder}

<!-- **Setting**: `mediaAutoExportFolder` -->

Caminho da pasta onde os arquivos de mídia serão exportados automaticamente.

**Padrão**: Vazio

#### Converter arquivos para MP4 {#convert-files-to-mp4}

**Configuração**: `convertFilesToMp4`

Converta arquivos de mídia exportados para o formato MP4 para uma melhor compatibilidade.

**Padrão**: `false`

### Pasta compartilhada (Dropbox, OneDrive, iCloud Drive, Google Drive) {#settings-guide-folder-monitoring}

Estas configurações ficam na categoria **Integrações**.

O M³ pode adicionar mídia às suas reuniões a partir de uma pasta sincronizada por um aplicativo de armazenamento em nuvem, como Dropbox, OneDrive, iCloud Drive ou Google Drive. Isso é útil quando outras pessoas preparam a mídia das suas partes e compartilham com você, ou quando o M³ é usado em mais de um computador. Uma pasta neste computador ou na sua rede também funciona.

O M³ cria dentro da pasta compartilhada uma pasta para cada reunião futura, com a data da reunião no formato ano-mês-dia (por exemplo, `2026-03-25`). Coloque fotos, vídeos, arquivos de áudio ou listas de reprodução do JW Library na pasta de uma reunião, e eles serão adicionados automaticamente à lista de mídia dessa reunião. Para adicionar arquivos para outro dia, crie uma pasta para ele, com o nome no mesmo formato. Qualquer outra coisa na pasta compartilhada é ignorada.

:::tip Dica

Crie uma pasta nova, usada só para isso, como "Mídia das reuniões", e configure-a no aplicativo de armazenamento em nuvem para ficar sempre neste computador (geralmente chamado de "disponível off-line"), para que os arquivos estejam prontos antes de a reunião começar.

:::

#### Adicionar mídia de uma pasta compartilhada {#enable-folder-watcher}

<!-- **Setting**: `enableFolderWatcher` -->

Adiciona automaticamente à reunião certa os arquivos colocados na pasta compartilhada.

**Padrão**: `false`

#### Pasta compartilhada {#folder-to-watch}

<!-- **Setting**: `folderToWatch` -->

A pasta de onde a mídia será adicionada. O assistente de configuração inicial oferece configurá-la para você.

**Padrão**: Vazio

#### Excluir pastas de reuniões passadas {#delete-past-watched-folders}

<!-- **Setting**: `deletePastWatchedFolders` -->

Quando uma semana termina, exclui as pastas datadas dessa semana, junto com os arquivos dentro delas, para manter a pasta compartilhada organizada. Como a pasta é compartilhada, elas também são excluídas para todos os outros que a usam. Desative esta opção para mantê-las.

**Padrão**: `true`

## Temporizador da reunião {#meeting-timer}

### Ativar o temporizador da reunião {#enable-meeting-timer}

<!-- **Setting**: `enableTimerDisplay` -->

Ativa uma janela de temporizador separada para cronometrar as partes da reunião. Este é um recurso beta e só deve ser ativado se aprovado localmente.

**Padrão**: `false`

### Comportamento da janela do temporizador {#timer-window-behavior}

<!-- **Settings**: `timerAutoOpen`, `timerMode`, `timerHourFormat`, `timerShowOnActionIsland` -->

Configure se a janela do temporizador abre automaticamente, se os temporizadores dos oradores fazem contagem progressiva ou regressiva por padrão, se o relógio usa o formato de 12 ou 24 horas e se o valor atual do temporizador aparece no botão do temporizador da barra de ações.

### Acesso rápido ao temporizador {#timer-quick-access}

<!-- **Settings**: `timerIslandHoverControls`, `timerDockedPanel` -->

Escolha como acessar o temporizador a partir da janela principal:

- **Controles rápidos ao passar o mouse sobre o botão do temporizador**: ao passar o mouse sobre o botão do temporizador na barra de ações, aparece a parte que está sendo cronometrada, com os botões Iniciar, Pausar, Parar e Próxima parte, sem abrir o pop-up completo do temporizador. Ativado por padrão.
- **Mostrar um painel do temporizador na janela principal**: mantém a lista completa de partes da reunião e os controles do temporizador em um painel fixado no lado direito da janela principal, sempre à vista. O pop-up completo continua disponível na barra de ações para as configurações de janela e de exibição.

### Temporizador remoto {#timer-remote}

<!-- **Settings**: `timerRemoteEnable`, `timerRemoteFocusLayout`, `timerRemotePort` -->

Quando esta opção está ativada, o M³ disponibiliza uma cópia somente leitura da tela do temporizador como uma página web na sua rede local, para um tablet ou celular na tribuna: o orador vê o tempo restante sem que ele apareça na tela da congregação ou em um compartilhamento do Zoom. A página acompanha o temporizador em tempo real, incluindo a contagem regressiva antes da reunião, o relógio, as cores de tempo excedido e o alerta de mão levantada, e todos os controles continuam no M³.

With **Focus layout for the timer remote** on, the page shows the time in a large progress ring instead: teal while there's time to spare, yellow in the last minute, then red with the amount of overtime (`+02:18`). The Zoom participants whose hand is raised are listed beside it, in the order they raised them, with the first four by name and a count of the rest, and each new hand flashes a "Hand raised" banner for a few seconds while the hands stay listed. The default display remains the plain large time.

While the page is open, it keeps the device's screen awake, so a tablet at the lectern doesn't lock or dim mid-part. Where the browser doesn't allow that on the page's plain-HTTP address, it plays a silent video to hold the screen on instead.

Os endereços para abrir no dispositivo aparecem no pop-up do temporizador, com um botão para copiar. Só altere a porta se outro programa já a estiver usando. Observe que qualquer pessoa na mesma rede pode abrir a página enquanto esta opção estiver ativada; ela não mostra nada além do temporizador.

**Padrão**: `false`, porta `8787`

### Formatos de exibição do temporizador {#timer-display-formats}

<!-- **Settings**: `timerTimeOfDayDisplay`, `timerCountdownDisplay`, `timerCountdownWarningIndicator` -->

Escolha formatos de exibição analógica ou digital para a hora do dia e a contagem regressiva. O indicador de aviso da contagem regressiva pode mudar o anel da contagem regressiva analógica para uma cor de aviso durante o último minuto.

O formato de contagem regressiva **Relógio analógico com arco de tempo** mostra o tempo restante de uma parte como um setor no mostrador de um relógio analógico, do ponteiro dos minutos até o término previsto; assim, com uma só olhada, você vê a hora atual e quanto tempo falta. O tempo excedido aparece como um segundo setor, na cor de tempo excedido. Esse formato também se aplica à contagem regressiva antes da reunião e funciona no modo progressivo.

### Contagem regressiva da reunião e status da programação {#meeting-countdown-and-schedule-status}

<!-- **Settings**: `timerEnableMeetingCountdown`, `timerMeetingCountdownMinutes`, `timerEnableMeetingAheadBehind` -->

Mostra uma contagem regressiva antes das reuniões programadas e, opcionalmente, indica se a reunião está adiantada ou atrasada. A contagem regressiva da reunião aparece apenas na tela do temporizador, não na exibição de mídia principal.

### Aparência do temporizador e tempo excedido {#timer-appearance-and-overtime}

<!-- **Settings**: `timerBackgroundColor`, `timerTextColor`, `timerTextSize`, `timerOvertimeIndicator`, `timerOvertimeBackgroundColor`, `timerOvertimeTextColor`, `timerOvertimeAnimation`, `timerOvertimeShowAmountOnly` -->

Personalize o tamanho e as cores do texto do temporizador e configure os indicadores de tempo excedido, como cores alternativas, texto piscando e a exibição apenas do tempo excedido decorrido no modo progressivo.

## Integrações {#integrations}

Esta categoria também reúne as configurações da [pasta compartilhada](#settings-guide-folder-monitoring), para adicionar mídia do Dropbox, OneDrive, iCloud Drive ou Google Drive.

### Integração com o Zoom {#settings-guide-zoom-integration}

#### Habilitar Zoom {#enable-zoom}

<!-- **Setting**: `zoomEnable` -->

Habilita os recursos de integração com reuniões do Zoom.

**Padrão**: `false`

#### Atalho de compartilhamento de tela {#screen-share-shortcut}

<!-- **Setting**: `zoomScreenShareShortcut` -->

Atalho de teclado para ativar o compartilhamento de tela do Zoom.

**Padrão**: Nenhum

#### Focar automaticamente a janela de mídia {#zoom-auto-focus-media-window}

<!-- **Setting**: `zoomAutoFocusMediaWindow` -->

Coloca automaticamente a janela de mídia em foco depois que o compartilhamento de tela do Zoom começa. Normalmente isso não é necessário, mas pode ajudar em alguns sistemas se a janela de mídia perder o foco com frequência depois que o compartilhamento de tela começa.

**Padrão**: `false`

### Gerenciador de Reuniões do Zoom {#zoom-meeting-manager}

O Gerenciador de Reuniões do Zoom (beta, somente Windows) opera o aplicativo de desktop do Zoom por você em cada reunião. O assistente de configuração dele, oferecido quando você ativa o recurso, orienta você em cada automação.

#### Enquanto o M³ controla o Zoom {#zoom-meeting-manager-overlay}

<!-- **Setting**: `zoomCancelAutomationShortcut` -->

O Zoom não oferece uma interface de automação adequada, por isso o M³ controla o aplicativo do Zoom pela interface de acessibilidade dele, que funciona sem mover o mouse, mesmo quando o Zoom oculta a barra de ferramentas. Ainda assim, o Zoom traz a janela dele para a frente por um instante quando o M³ pressiona os botões dele, e o mouse só se move como último recurso, caso o Zoom não responda de nenhuma outra forma. Sempre que o M³ controla o Zoom, ele cobre a própria janela com o aviso "O M³ está controlando o Zoom", que informa o que está acontecendo, com um botão **Cancelar esta automação**. O mesmo aviso aparece durante as verificações do assistente de configuração e durante o autoteste. Um atalho de teclado global (padrão `Ctrl+Alt+Escape`), ativo somente enquanto uma automação está em andamento, cancela a automação de qualquer lugar, mesmo quando o Zoom está em foco. O cancelamento interrompe o M³ na hora; o Zoom pode ficar no meio do processo, por isso verifique-o.

**Padrão**: `Ctrl+Alt+Escape`

#### Assistente de mãos levantadas {#zoom-meeting-manager-hand-alert}

<!-- **Settings**: `zoomMeetingManagerHandAlert` -->

Durante uma reunião, o M³ observa a lista de participantes do Zoom em busca de mãos levantadas. Quando alguém levanta a mão, uma notificação no M³ permite **ativar o áudio** desse participante com um clique e, quando ele terminar de falar, **desativar o áudio de novo e abaixar a mão** com outro clique. O botão do Zoom na barra de ações lista as mãos levantadas com os mesmos botões. Cada ação é feita na linha desse participante no Zoom, pelo nome exato; se dois participantes tiverem o mesmo nome, o M³ não mexe em nenhum dos dois.

Se o [temporizador da reunião](#meeting-timer) estiver ativado, uma mão grande com o nome do participante também aparece na tela do temporizador para o presidente, e um botão **Alerta de mão levantada** nos pop-ups do temporizador e do Zoom mostra o alerta manualmente. Essa parte precisa da tela do temporizador; as notificações e os botões funcionam sem ela.

O Zoom marca as mãos levantadas no idioma em que está configurado, por isso primeiro o M³ precisa aprender como: com sua reunião aberta no Zoom, clique em **Aprender como o Zoom marca as mãos levantadas**. O M³ levanta sua própria mão, lê como o Zoom a marca na lista de participantes e qual item do menu a abaixa, e depois a abaixa novamente. O assistente de configuração também oferece essa etapa.

**Padrão**: `false`

#### Layout das janelas {#zoom-meeting-manager-window-layout}

<!-- **Setting**: `zoomMeetingManagerWindowLayout` -->

O M³ pode colocar a janela da reunião do Zoom, e também a própria janela principal dele, onde você quiser nas suas telas. O assistente de configuração pergunta onde em duas etapas, que o botão **Escolher o layout** aqui abre de novo a qualquer momento:

1. Em um mapa das suas telas, organizadas como estão, escolha a tela para a reunião do Zoom. A tela que a janela de mídia ocupa nunca aparece como opção. Se a tela do Zoom não for a tela em que o M³ está, escolha se o Zoom fica com ela só para si ou a divide com o M³ (nesse caso, o M³ também vai para lá).
2. Em um desenho dessa tela no formato real, arraste o divisor para dividi-la entre o M³ e o Zoom. Ele se encaixa nas proporções mais comuns (metade, um terço, um quarto e assim por diante); segure `Alt` para arrastá-lo livremente. O divisor nunca deixa uma janela menor do que o tamanho mínimo dela: o Zoom precisa de mais espaço enquanto a lista de participantes dele está aberta. Em uma tela na vertical, as duas janelas ficam uma em cima da outra.

Assim que a reunião abre, o M³ abre a lista de participantes do Zoom se você pediu, depois coloca as duas janelas no lugar. A partir daí, ele mantém o Zoom onde deve ficar: quando o Zoom move ou redimensiona a janela dele sozinho, depois de um compartilhamento de tela ou quando a lista de participantes abre ou fecha, o M³ o coloca de volta. Se você mesmo mover ou redimensionar o Zoom, o M³ o deixa onde você o colocou até a próxima reunião. Sempre que o M³ move o Zoom por conta própria, uma notificação avisa, com dois botões caso isso atrapalhe: **Deixar o Zoom como está** interrompe isso até o M³ ser reiniciado, e **Desativar** desativa o layout das janelas até você ativá-lo de novo aqui. Quando telas são conectadas ou removidas, o M³ organiza as janelas de novo; se a tela do Zoom não estiver mais lá, o Zoom divide a tela do M³ e o M³ avisa você.

Enquanto o Zoom compartilha a janela de mídia, ele oculta a própria janela da reunião, incluindo a lista de participantes. Com **Mostrar a lista de participantes durante o compartilhamento** ativado, o M³ abre a lista de participantes do Zoom em uma janela separada, no lugar do Zoom, para que você continue vendo quem levanta a mão para comentar. Se você a fechar, ela fica fechada até o próximo compartilhamento; o Zoom a fecha sozinho quando o compartilhamento termina, e a janela da reunião volta ao lugar.

Com a opção **Meeting window view** do Zoom definida como **Dual window** (**Use dual monitors** em versões mais antigas do Zoom), o Zoom abre uma segunda janela (que mostra a tela compartilhada ou quem está falando). O M³ a coloca em tela cheia na tela da janela de mídia, atrás da janela de mídia: oculte a janela de mídia para vê-la, por exemplo, para ver os participantes.

Quando **Ajustar com o Windows** está ativado, o M³ ajusta as duas janelas lado a lado com o próprio recurso de ajuste do Windows, como se você as tivesse arrastado para as bordas da tela, então arrastar a borda entre elas redimensiona as duas. Para isso, o M³ traz cada janela para a frente por um instante.

O botão **Organizar janelas** no pop-up do Zoom coloca tudo de volta no lugar a qualquer momento. O layout das janelas é salvo por computador, já que depende das telas dele.

**Padrão**: desativado

### Integração com o OBS Studio {#settings-guide-obs-integration}

#### Habilitar OBS {#enable-obs}

<!-- **Setting**: `obsEnable` -->

Ativa a integração com o OBS Studio para a troca automática de cenas.

**Padrão**: `false`

:::warning Observação importante

**Configuração de áudio necessária**: a integração do OBS Studio apenas lida com o compartilhamento de tela. O áudio da mídia do M³ **não é transmitido automaticamente** para os participantes do Zoom quando se usa o OBS Studio. Você precisa configurar o Som original do Zoom ou usar "Compartilhar som do computador" para garantir que os participantes da reunião consigam ouvir a mídia. Veja o [Manual do Usuário](/user-guide#audio-configuration) para instruções detalhadas sobre a configuração de áudio.

**Observação**: A integração com o Zoom usa o compartilhamento de tela nativo do Zoom, que lida com o áudio de forma mais simples do que a integração com o OBS Studio.

:::

#### Porta do OBS {#obs-port}

<!-- **Setting**: `obsPort` -->

O número da porta para conectar ao WebSocket do OBS Studio.

**Padrão**: Nenhum

#### Senha do OBS {#obs-password}

<!-- **Setting**: `obsPassword` -->

A senha para a conexão WebSocket do OBS Studio.

**Padrão**: Nenhum

#### Cenas do OBS {#obs-scenes}

Configure quais cenas do OBS usar para cada finalidade:

- **Cena da câmera**: Cena que mostra a câmera/tribuna
- **Cena de mídia**: Cena para exibir a mídia
- **Cena de imagem**: Cena para exibir imagens (por exemplo, uma cena PIP mostrando a mídia e o orador)

#### Opções avançadas do OBS {#obs-advanced-options}

- **Não compartilhar imagens automaticamente**: Adia o compartilhamento de imagens no OBS até que você o acione manualmente
- **Alternância rápida**: Ativa um botão rápido para ligar/desligar a integração com o OBS
- **Trocar de cena após a mídia**: Volta automaticamente para a cena anterior após a mídia
- **Lembrar a cena anterior**: Lembra e restaura a cena anterior
- **Ocultar ícones**: Oculta os ícones relacionados ao OBS na interface
- **Controles de gravação**: Mostra controles que iniciam e param a gravação do OBS pelo M³

:::warning Observação importante

**Configuração de áudio necessária**: A integração com o OBS Studio só cuida da troca de vídeo/cena. O áudio da mídia do M³ **não é transmitido automaticamente** para o Zoom nem para o OBS. O fluxo de vídeo funciona como uma câmera virtual sem som, assim como uma webcam. Você precisa configurar o Som original do Zoom ou usar "Compartilhar som do computador" para garantir que os participantes da reunião consigam ouvir a mídia. Veja o [Manual do Usuário](/user-guide#audio-configuration) para instruções detalhadas sobre a configuração de áudio.

**Alternativa**: Considere usar a integração com o Zoom, pois usa o compartilhamento de tela nativo do Zoom, o que lida com o áudio mais facilmente.

:::

### Eventos personalizados {#custom-events}

#### Habilitar eventos personalizados {#enable-custom-events}

<!-- **Setting**: `enableCustomEvents` -->

Habilite atalhos personalizados que serão acionados quando um evento específico for detectado (por exemplo, mídia é reproduzida, pausada ou parada).

**Padrão**: `false`

#### Atalhos de eventos personalizados {#custom-event-shortcuts}

##### Atalho para reproduzir mídia {#custom-event-media-play-shortcut}

<!-- **Setting**: `customEventMediaPlayShortcut` -->

Atalho que é acionado quando a mídia é reproduzida.

**Padrão**: Nenhum

##### Atalho para pausar mídia {#custom-event-media-pause-shortcut}

<!-- **Setting**: `customEventMediaPauseShortcut` -->

Atalho que é acionado quando a mídia é pausada.

**Padrão**: Nenhum

##### Atalho para parar mídia {#custom-event-media-stop-shortcut}

<!-- **Setting**: `customEventMediaStopShortcut` -->

Atalho que é acionado quando a mídia é parada.

**Padrão**: Nenhum

##### Atalho do último cântico {#custom-event-last-song-shortcut}

<!-- **Setting**: `customEventLastSongShortcut` -->

Atalho que é acionado quando o último cântico é reproduzido durante uma reunião.

**Padrão**: Nenhum

### Gravações de reuniões {#meeting-recordings}

#### Ativar integração com aplicativo de gravação externo {#enable-external-recording-app-integration}

<!-- **Setting**: `recordingEnable` -->

Permite que o M³ controle um aplicativo de gravação separado com atalhos de teclado. Isso não grava dentro do M³; apenas envia os atalhos configurados quando você pressiona **Iniciar gravação** ou **Parar gravação** no pop-up de gravações de reuniões.

Esta opção fica oculta quando os controles de gravação do OBS estão habilitados. Se você usar o OBS Studio, use os controles de gravação do OBS na integração do OBS.

**Padrão**: `false`

#### Atalhos e pasta de gravação {#recording-shortcuts-and-folder}

<!-- **Settings**: `recordingStartShortcut`, `recordingStopShortcut`, `recordingFolder` -->

Configure o atalho de teclado que inicia a gravação, o atalho opcional que para a gravação e a pasta onde o aplicativo externo salva as gravações. Se nenhum atalho para parar for definido, o M³ reutiliza o atalho de início. Quando uma pasta está configurada, o M³ mostra um botão para abri-la.

## Interface e atalhos {#interface-shortcuts}

### Atalhos de teclado {#settings-guide-keyboard-shortcuts}

#### Habilitar atalhos de teclado {#enable-keyboard-shortcuts}

<!-- **Setting**: `enableKeyboardShortcuts` -->

Ativar atalhos personalizáveis de teclado para controle de mídia.

**Padrão**: `false`

#### Atalhos de controle de mídia {#media-control-shortcuts}

Configurar atalhos para reprodução de mídia:

- **Janela de mídia**: Abrir/fechar a janela de mídia
- **Mídia anterior**: Ir para o item de mídia anterior
- **Próxima mídia**: Ir para o próximo item de mídia
- **Pausar/Retomar**: Pausar ou retomar a reprodução da mídia
- **Parar mídia**: Parar a reprodução da mídia
- **Alternar cânticos de fundo**: Iniciar ou parar os cânticos de fundo

### Botão "Adicionar mais mídia" {#add-more-media-button}

#### Seções com um botão "Adicionar mais mídia" {#add-media-button-sections}

<!-- **Setting**: `addMediaButtonSections` -->

Escolha quais seções da reunião têm um botão próprio para você adicionar sua mídia, além do botão "Adicionar mídia" na barra de ferramentas superior, que sempre funciona para todas as seções.

**Padrão**: Discurso público, Nossa Vida Cristã, Visita do superintendente de circuito e seções personalizadas

#### Modo compacto do botão Adicionar mídia {#compact-add-media-button}

<!-- **Setting**: `compactAddMediaButton` -->

Mostra apenas um ícone no botão "Adicionar mais mídia"/"Adicionar um cântico" nos cabeçalhos das seções. Quando desativado, o botão também mostra texto ao lado do ícone se houver espaço suficiente.

**Padrão**: `true`

### Alça de arrastar nos itens de mídia {#media-drag-handle}

#### Mostrar alça de arrastar {#show-media-drag-handle}

<!-- **Setting**: `showMediaDragHandle` -->

Mostra uma pequena alça em cada item de mídia para arrastá-lo e mudar a ordem. Os itens de mídia sempre podem ser reordenados arrastando-os por qualquer ponto; esta opção afeta apenas a exibição do próprio ícone da alça.

**Padrão**: `true`

### Ações rápidas antes/depois da reunião {#before-after-meeting-quick-actions}

#### Mostrar ações rápidas da reunião {#enable-meeting-quick-actions}

<!-- **Setting**: `enableMeetingQuickActions` -->

Mostra um painel de antes da reunião e um painel de depois da reunião com controles úteis (cânticos de fundo, gravação) e uma lista de verificação personalizável para cada um.

**Padrão**: `true`

As categorias e tarefas da lista de verificação dos painéis de antes e de depois da reunião são gerenciadas nesta mesma seção das configurações: adicione, renomeie, reordene ou exclua categorias e tarefas conforme necessário para a sua congregação.

## Avançado {#advanced-settings}

### Transferência das configurações do perfil {#profile-settings-transfer}

Exporte as configurações do perfil atual para um arquivo JSON ou importe um arquivo de configurações de perfil previamente exportado. A importação substitui as configurações do perfil atual.

### Zona de perigo {#danger-zone}

:::warning Aviso

Estas configurações só devem ser alteradas se você entender suas implicações.

:::

#### URL base {#base-url}

<!-- **Setting**: `baseUrl` -->

Domínio base usado para baixar publicações e mídias.

**Padrão**: `jw.org`

#### Desativar a aceleração de hardware {#disable-hardware-acceleration}

<!-- **Setting**: `disableHardwareAcceleration` -->

Desativa a aceleração de hardware depois de reiniciar o M³. Isso pode ajudar com falhas gráficas ou travamentos em alguns sistemas, mas, caso contrário, não é recomendado.

**Padrão**: `false`

#### Suprimir lembrete de aceleração de hardware {#suppress-hardware-acceleration-reminder}

<!-- **Setting**: `suppressHardwareAccelerationReminder` -->

Ocultar o lembrete para reativar a aceleração de hardware após ele ter sido desativado manualmente.

**Padrão**: `false`

#### Desativar busca de mídia {#disable-media-fetching}

<!-- **Setting**: `disableMediaFetching` -->

Desativar completamente downloads automáticos de mídia. Use isto apenas para perfis que serão usados para eventos especiais ou outras configurações personalizadas.

**Padrão**: `false`

## Dicas para configuração ideal {#configuration-tips}

### Para novos usuários {#new-users}

1. Comece pelo assistente de configuração inicial para definir as configurações básicas
2. Ative "Habilitar exibição de mídia" para acessar os recursos de apresentação
3. Configure com precisão a sua programação de reunião
4. Configure a integração do OBS se você usar reuniões híbridas

### Para usuários avançados {#advanced-users}

1. Use uma pasta compartilhada para adicionar mídia de um armazenamento em nuvem, como Dropbox ou OneDrive
2. Ative a exportação automática de mídia para ter um backup
3. Configure atalhos de teclado para trabalhar com mais eficiência
4. Configure a integração com o Zoom para compartilhar a tela automaticamente

### Otimização de desempenho {#performance-optimization}

1. Armazene localmente os cânticos em vídeo para melhorar o desempenho
2. Use a resolução máxima apropriada para suas necessidades
3. Configure a limpeza automática de cache para gerenciar o espaço em disco
4. Considere ativar a configuração de conexão limitada se a sua largura de banda for limitada

### Solução de problemas {#settings-guide-troubleshooting}

- Se a mídia não estiver sendo baixada, verifique suas configurações de programação de reunião
- Se a integração do OBS não funcionar, verifique as configurações da porta e da senha
- Se o desempenho estiver lento, tente ativar o cache extra ou reduzir a resolução
- Se estiver tendo problemas com o idioma, verifique as configurações de idioma da interface e mídia
- Se os participantes do Zoom não conseguirem ouvir o áudio da mídia, configure o Som original do Zoom ou use "Compartilhar som do computador"
- **Dica**: Considere usar a integração com o Zoom em vez do OBS Studio para lidar com o áudio de forma mais simples

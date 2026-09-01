<!-- markdownlint-disable no-duplicate-heading -->

# Novidades

Para obter a lista completa das mudanças entre versões, consulte nosso arquivo CHANGELOG.md no GitHub.

## UPCOMING VERSION

### ✨ Novos Recursos

- ✨ **Before/After Meeting Quick Actions**: A new big-button panel assists with the run-up to and immediately after each meeting — a live countdown, one-tap background music start/stop, start/stop recording, and a per-congregation checklist grouped into categories and editable from Settings. The before-meeting panel auto-dismisses once the meeting starts and the checklist is complete (or after a short grace period), and can always be dismissed manually.

## v26.8.0

### ✨ Novos Recursos

- ✨ **App-Wide Redesign**: A broad visual and interaction refresh across dialogs, the media list/header, Settings, and the Setup Wizard. The Setup Wizard is now a one-question-per-screen flow with a progress bar. All prompts were replaced with a consistent branded dialog, and PDF page-range selection (for publication and drag-and-drop imports) now uses a thumbnail-grid picker instead of a free-text prompt. Added a new Quick Start Guide tour after the Setup Wizard completes. Also includes refreshed card/header styling with dark-mode-aware shadows and several dark-mode contrast fixes (focused field labels, download-progress percentages).
- ✨ **Settings Page**: Reworked into a two-pane layout, with a new global Preferences section for auto-update/beta-update toggles moved out of the About dialog (which is now purely informational).
- ✨ **Add More Media Button**: Added a setting to choose exactly which meeting sections show the "add more media" shortcut button, along with a setting for a compact (icon-only) mode.
- ✨ **Media List**: Items now show loading skeletons while being added instead of appearing empty, media groups show a hidden-item count in their badge (e.g. "9 items (2 hidden)"), children within a group can be reordered via drag-and-drop, and at very narrow window widths items collapse into compact, tooltip-carrying chips instead of crowding the row.

## v26.7.7

### ✨ Novos Recursos

- ✨ **Media Preview Quality**: Media preview now renders video frames via canvas with high-quality downscaling, fixing jagged/blurry previews (especially on text-heavy content like songs). The preview also auto-disables itself if it has to repeatedly correct playback drift on a single video, with a one-click way to turn it back on.

## v26.7.6

### ✨ Novos Recursos

- ✨ **CBS Video Exclusion**: Added a setting to exclude Congregation Bible Study videos from specific publications (defaults to the **Walk Courageously With God** book), with a searchable publication picker.
- ✨ **Document Page Numbers**: Publication Media and JWPUB import listings now show each document's page number (or numbers when there are multiple pages) after its title. This can help you to quickly find specific media when you know the page number on which it is found.

## v26.7.4

### ✨ Novos Recursos

- ✨ **Missing Media Recovery**: Media items whose local file went missing (e.g. deleted by the cache auto-clear, or removed manually) now show a disabled play button, a "missing" caption naming the file to look for, and a new "Locate file" action to relink the item to a file on disk.
- ✨ **Compatibility Warning**: Added a dismissible banner warning users on soon-to-be-unsupported OS/architecture combos (macOS 12 Monterey and Windows 32-bit) to upgrade before future app updates require newer system support.

## v26.7.0

### ✨ Novos Recursos

- ✨ **Linked Audio Playback**: Added support for playing audio from one file together with video from another file. This can be useful for playing video slideshows with accompanying music.
- ✨ **Watched Media Layouts**: Added persistence for watched media items and section order across watched folders. This ensures that the media list is displayed the same way even when the watched folder is synced across devices.

## v26.6.1

### ✨ Novos Recursos

- ✨ **Media Preview**: Added a live media preview overlay that can be toggled on or off from the settings or from the display popup.
- ✨ **Search media**: Added a quick search box in the media list that allows you to quickly find media by title. To use it, simply use the standard keyboard shortcut for search (Ctrl+F or Cmd+F).
- ✨ **Filter settings**: Added a filter box to the settings page that allows you to find settings by keyword or category. To use it, simply click on the Search button in the top right corner of the settings page, or use the standard keyboard shortcut for search (Ctrl+F or Cmd+F).
- ✨ **Background Music Overlap Warning**: Added a warning notification when media is started while background music is playing. Users can choose to stop the background music from the notification.

## v26.6.0

### ✨ Novos Recursos

- ✨ **Timer**: Added analog display modes and timing report status.
- ✨ **Profiles**: Added profile settings import and export in Advanced settings and the Setup Wizard.
- ✨ **Media Window**: Added support for automatically hiding the media window after playback when it was initially hidden. This is practical when a remote speaker wants to display images, for example.

## v26.5.0

### ✨ Novos Recursos

- ✨ **PDF Import**: Added a new PDF import flow to the Publication Media dialog, allowing the PDF version of a publication to be automatically imported as individual images when desired.

## v26.4.8

### ✨ Novos Recursos

- ✨ **JW Stream**: Added JW Stream to the list of websites that can be mirrored.

## v26.4.0

### ✨ Novos Recursos

- ✨ **Meeting Timer**: A new meeting timer feature has been added. It is optional and can be enabled in the advanced settings, if desired. The timer can be used to allow the media operator to keep track of the time spent on meeting parts, or to display the time spent on the current meeting part on a dedicated screen visible only to the speaker.

## v26.3.0

### ✨ Novos Recursos

- ✨ **Memorial Media**: Automatic Memorial media retrieval is now out of beta! The app will automatically download the Memorial Welcome Video and image to display during the Memorial, when available in the configured language.
- ✨ **Playback Speed**: Added playback speed control with visual indicator, and manual reset. This feature is only visible if enabled in the advanced settings.
- ✨ **Pinyin Songs**: Added a toggle for pinyin song substitution for meetings held in Chinese.

## v26.2.0

### ✨ Novos Recursos

- ✨ **Verificação de espaço em disco**: Adicionada funcionalidade para monitorar e notificar quando o espaço em disco estiver baixo.

## v26.1.5

### ✨ Novos Recursos

- ✨ **Mídias da Celebração**: Baixar automaticamente banner e vídeo de introdução da Celebração nos idiomas suportados quando a data da Celebração for selecionada.

## v26.1.0

### ✨ Novos Recursos

- ✨ **Sincronização automática da programação das reuniões**: Adicionada a capacidade de sincronizar automaticamente as datas e horários das reuniões com o site oficial. Este recurso é habilitado por padrão e pode ser acionado manualmente ou desabilitado nas configurações avançadas.
- ✨ **Mudanças futuras na programação**: O aplicativo agora inclui mudanças futuras na programação ao criar uma congregação usando a pesquisa no site, se disponível.
- ✨ **Cache compartilhado para instalações em toda a máquina**: Instalações em toda a máquina agora compartilham uma pasta de dados comum por padrão, otimizando o uso de armazenamento e largura de banda entre vários usuários no mesmo computador.

## v25.12.2

### ✨ Novos Recursos

- ✨ **Botões de Zoom/Pan**: Adicionada a capacidade de pressionar e segurar os botões de zoom e pan para ajuste contínuo.

## v25.12.0

### ✨ Novos Recursos

- ✨ **Menu de contexto de seleção múltipla**: Adicionado suporte para ações do menu do botão direito quando vários itens de mídia são selecionados.
- ✨ **Atalhos de teclado**: Adicionados `Ctrl/Cmd+A` para selecionar todas as mídias, `H` para ocultar mídias selecionadas e `Shift+Seta para cima/baixo` para navegação de seleção por teclado.
- ✨ **Configurações de vídeos do Estudo de A Sentinela**: Adicionada uma configuração para excluir vídeos extras do Estudo de A Sentinela.
- ✨ **Seções recolhíveis**: Adicionada a capacidade de recolher seções em dias sem reunião para uma visualização mais limpa.
- ✨ **Site de Eventos TJ**: Adicionada a capacidade de apresentar o site de Eventos TJ além do site oficial principal.
- ✨ **Personalização de importação de lista de reprodução**: Permitida a capacidade de personalizar o prefixo que é adicionado aos itens de mídia ao importar listas de reprodução JW.
- ✨ **Navegação de espelhamento de site**: Adicionado um alternador para navegar automaticamente para a lista de mídias após o espelhamento do site ser interrompido.
- ✨ **Controles de gravação do OBS**: Adicionada a capacidade de controlar gravações do OBS.
- ✨ **Visualização do texto do ano**: Adicionada a capacidade de visualizar o texto do ano seguinte a partir de dezembro de cada ano.
- ✨ **Notificações de atualização**: Adicionadas notificações de aviso se estiver executando uma versão beta ou se as atualizações estiverem desabilitadas, e melhorado o display de progresso de download de atualização.
- ✨ **Configurações de aceleração de hardware**: Adicionada uma opção para desabilitar permanentemente a aceleração de hardware se necessário.

## v25.11.0

### ✨ Novos Recursos

- ✨ **Seleção de mídia JWPUB**: Adicionada uma maneira de selecionar mídias individuais de arquivos JWPUB.
- ✨ **Foco automático da janela de mídia**: Adicionada uma configuração opcional para focar automaticamente a janela de mídia após o compartilhamento de tela do Zoom.
- ✨ **Sobreposição de cursor para exibição em TV**: Aprimorada a sobreposição do cursor da janela do site para melhor visibilidade do cursor do mouse em exibições de TV.
- ✨ **Gravação de reunião**: Adicionado um novo recurso de gravação de reunião, para controlar um aplicativo de gravação externo.
- ✨ **Pesquisa no site**: Adicionada a capacidade de pesquisar mídias ou publicações no site usando pesquisa inteligente.
- ✨ **Importação manual fácil de publicações**: Adicionada funcionalidade para importar facilmente publicações de JW.org, como revistas, livros, programas e convites.
- ✨ **Melhorias em língua de sinais**: Adicionada confirmação antes de reproduzir arquivos inteiros para línguas de sinais e suporte para selecionar vários clipes, como para quando vários parágrafos devem ser lidos consecutivamente.
- ✨ **Navegação de clipes**: Adicionada exibição de duração aos itens da lista de clipes e melhorada a navegação de clipes.
- 🛠️ **Exibição de mídia**: Garantido que a exibição de mídia se torne visível quando a reprodução iniciar, mesmo que estivesse oculta antes.

## v25.10.1

### ✨ Novos Recursos

- ✨ **Assistente de configuração – Etapa do Zoom**: Adicionada uma etapa de integração com o Zoom ao assistente de configuração para configuração inicial mais fácil.
- ✨ **Seletor de tela**: Mostrar uma representação visual precisa de todas as telas, bem como o tamanho e a localização atual da janela principal no popup. Isso facilita a escolha da tela correta na qual a janela de mídia deve ser exibida.
- ✨ **Preferência de janela de mídia**: O aplicativo agora lembrará a tela preferida na qual a janela de mídia deve ser exibida, se especificado pelo usuário.

## v25.10.0

### ✨ Novos Recursos

- ✨ **Begin Playback Paused**: Added a new setting to allow playback to begin paused, which can be useful for AV operators to prepare their setup (such as starting Zoom sharing) before the media starts playing in the media window.
- ✨ **Update Notifications**: Users will now be notified of updates through an in-app banner, which will also allow the user to install updates immediately, instead of waiting for the next app restart.
- ✨ **Custom Events**: Added optional events hooks that can trigger keyboard shortcuts when certain events are detected. This can be useful for AV operators to execute actions automatically outside of the app. For example, smart lights could be turned on and off before and after media plays in auditoriums where projectors are used; or a script can be called after a meeting's last song has been played to automate various actions in a Zoom meeting.

## v25.9.1

### ✨ Novos Recursos

- ✨ **Media Window Always on Top & Fullscreen Behavior**: Fixed and improved always-on-top behavior for the media window, adjusting dynamically based on fullscreen state.
- ✨ **Date Display Format Setting**: Added a user setting to configure a date display format.
- ✨ **Media Crossfade**: Implemented crossfade transitions for media display, instead of the more abrupt fade-to-black transition that was present before.
- ✨ **Music Auto-Stop**: Optimized the behavior of the background music auto-stop to behave the same whether music was auto-started or not
- ✨ **macOS Click-Through on Inactive Windows**: Enabled mouse click passthrough on the main window for macOS, which should make it easier to control the app even when it's not focused.

## v25.9.0

### ✨ Novos Recursos

- ✨ **Melhoria no Pop-up de Downloads**: Adicionado botão de atualização e agrupamento de downloads por data no pop-up de download.
- ✨ **Memória da ordem de mídias assistidas**: adicionada a função de lembrar a ordem das seções para mídias já assistidas.

## v25.8.3

### ✨ Novos Recursos

- ✨ **Media Window Fade Transitions**: Added a new advanced setting to make the media window fade in and out, providing smoother visual transitions.
- ✨ **Image Duration Control and Progress Tracking**: Added image duration control and progress tracking capabilities for repeated sections.

## v25.8.1

### ✨ Novos Recursos

- ✨ **Custom Media Sections**: Complete system for creating, editing, and managing custom media sections with color customization and drag-and-drop reordering.
- ✨ **Media Dividers**: Add titled dividers within media lists for better organization with top/bottom positioning options.
- ✨ **Section Repeat Mode**: Enable continuous playback within specific sections for seamless media loops.
- ✨ **Zoom Integration**: Automatic screen sharing start/stop coordination with media playback.

## v25.7.0

### ✨ Novos Recursos

- No new features for this release!

## 25.6.0

### ✨ Novos Recursos

- ✨ **Configuração de conexão limitada**: Adicionada uma nova configuração para reduzir o uso de largura de banda em conexões limitadas.
- ✨ **Melhoria no Manuseio de Mídia em Stream**: Melhor suporte para mídia transmitida, reduzindo problemas relacionados à latência.

## 25.5.0

### ✨ Novos Recursos

- **Opção de Atraso no OBS para Imagens**: Adiciona uma configuração no OBS Studio para atrasar a mudança de cena ao exibir imagens, melhorando as transições.
- **Compatibilidade com Áudio .m4a**: Adiciona compatibilidade com arquivos .m4a, ampliando os tipos de mídia aceitos.

## 25.4.0

### ✨ Novos Recursos

- 🇵🇭 **Novo idioma: Tagalo**: Suporte adicionado para Tagalo, expandindo as capacidades multilíngues do aplicativo.
- 🎞️ **Suporte para o Formato de Vídeo `.m4v`**: Agora suporta a reprodução de arquivos `.m4v` para melhorar a compatibilidade de mídia.

## 25.3.1

### ✨ Novos Recursos

- 🌏 **Novo Idioma: Coreano**: Adiciona suporte para o idioma coreano, expandindo a acessibilidade para mais usuários.

## 25.3.0

### ✨ Novos Recursos

- 🎵 **Reprodução de Música de Fundo com Vídeos**: Permite que a música de fundo continue reproduzindo enquanto os vídeos estão sendo exibidos.
- 🎥 **Transmissão de Câmera para Mídia de Língua de Sinais**: Adiciona a capacidade de exibir a transmissão de uma câmera na janela de mídia especificamente para usuários de língua de sinais.
- 📅 **Data da Celebração e Fundo de Tela Automáticos**: Detecta e configura automaticamente a data da Celebração e prepara a imagem de fundo da Celebração.
- 📜 **Exibição de Notas de Versão no Aplicativo**: Mostra notas de lançamento diretamente no aplicativo para que os usuários possam facilmente revisar as alterações após uma atualização.

## 25.2.1

### ✨ Novos Recursos

- 🔄 **Allow OBS Reconnection Attempts**: Introduce the possibility to manually force OBS to reconnect when needed.
- 🗑 **Auto Cleanup Old Export Date Folders**: Automatically remove outdated export date folders to keep storage organized.

## 25.2.0

### ✨ Novos Recursos

- 🌍 **Use System Locale by Default**: Automatically detect and use the system's locale for a more personalized experience.
- 🏷 **Tag Support for Exported Media**: Add metadata tags to exported media files for better organization.
- 🔄 **Automatic Beta to Stable Downgrade**: Allow automatic downgrades from beta versions to stable releases when necessary.
- 🌐 **Extract Latest MEPS Language Indexes**: Fetch the most recent MEPS language indexes directly from the official website, ensuring up-to-date language support.

## 25.1.0

### ✨ Novos Recursos

- 📅 **Open Previous Dates**: Allow opening previous dates of the current week, which is useful when the meeting day is moved later in the week.
- 🛑 **Error Banner for OBS Studio**: Add an error banner when OBS Studio is not connected on a meeting day, ensuring users are alerted.
- 📚 **Group Media by Publication**: Group media from the same referred publication for a cleaner and more organized media overview.
- 🎵 **Duplicate Song Warning**: Show a warning if songs are listed more than once in the media list for weekend meetings.
- 🔄 **Future Schedule Planning**: Enable the planning of future meeting schedule changes, which is useful for yearly schedule changes or for the circuit overseer's visit to a neighboring congregation.

## 24.11.0

### ✨ Novos Recursos

- 🖥️ **Website Presentation on macOS**: Presenting the website is now supported on macOS 🚀
- ⌨️ **Playback Keyboard Shortcuts**: Introduced keyboard shortcuts for stopping, pausing, and resuming media playback 🚀
- 🌐 **Custom Media Download Address**: Added support for setting the web address from which media should be downloaded 🚀
- 🎬 **OBS Instant Scene Picker**: Added OBS Studio instant scene picker and overhauled scene picker functionality in settings
- 📖 **More Documentation Languages**: Expanded documentation website to support more languages

## 24.10.10

### ✨ Novos Recursos

- ⌨️ **Media Navigation Shortcuts**: Added keyboard shortcuts to navigate to the next/previous media item
- 🖱️ **Media Item Right-Click Menu**: Added a right-click menu to media items to hide media items and rename them
- ✂️ **Trimmed JWL Playlist Import**: Trimmed video times are now respected in imported JWL playlists

## 24.10.9

### ✨ Novos Recursos

- 🗑️ **Delete Extra Media for a Day**: Added an option to delete all extra media files for the currently selected day

<!-- markdownlint-disable no-duplicate-heading -->

# Novidades

Para a lista completa de alterações entre versões, consulte o ficheiro CHANGELOG.md no GitHub.

## v25.11.0

### ✨ Novas Funcionalidades

- ✨ **JWPUB Media Selection**: Added a way to select individual media from JWPUB files.
- ✨ **Auto-Focus Media Window**: Added an optional setting to automatically focus the media window after Zoom screen sharing.
- ✨ **Cursor Overlay for TV Display**: Enhanced website window cursor overlay for better visibility of the mouse cursor on TV displays.
- ✨ **Meeting Recording**: Added a new meeting recording feature, to control an external recording app.
- ✨ **Site Search**: Added ability to search for media or publications on the site using smart search.
- ✨ **Easy Manual Publication Import**: Added functionality to easily import publications from JW.org, such as magazine, books, programs and invitations.
- ✨ **Sign Language Improvements**: Added confirmation before playing entire files for sign languages and support for selecting multiple clips, such as for when multiple paragraphs are to be read consecutively.
- ✨ **Clip Navigation**: Added duration display to clip list items and improved clip navigation.
- 🛠️ **Media Display**: Ensured media display becomes visible when playback starts, even if it was hidden before.

## v25.10.1

### ✨ Novas Funcionalidades

- ✨ **Setup Wizard – Zoom Step**: Added a Zoom integration step to the setup wizard for easier initial configuration.
- ✨ **Screen Picker Enhancements**: Show an accurate visual representation of all screens, as well as the main window’s current size and location, in the display popup. This makes it easier to choose the correct screen on which the media window should be displayed.
- ✨ **Media Window Preference**: The app will now remember the preferred screen on which the media window should be displayed, if specified by the user.

## v25.10.0

### ✨ Novas Funcionalidades

- ✨ **Begin Playback Paused**: Added a new setting to allow playback to begin paused, which can be useful for AV operators to prepare their setup (such as starting Zoom sharing) before the media starts playing in the media window.
- ✨ **Update Notifications**: Users will now be notified of updates through an in-app banner, which will also allow the user to install updates immediately, instead of waiting for the next app restart.
- ✨ **Custom Events**: Added optional events hooks that can trigger keyboard shortcuts when certain events are detected. This can be useful for AV operators to execute actions automatically outside of the app. For example, smart lights could be turned on and off before and after media plays in auditoriums where projectors are used; or a script can be called after a meeting's last song has been played to automate various actions in a Zoom meeting.

## v25.9.1

### ✨ Novas Funcionalidades

- ✨ Janela de Multimédia Sempre em Primeiro Plano & Comportamento em Ecrã Inteiro: Corrigido e melhorado o comportamento de manter a janela de média sempre em primeiro plano, ajustando-se dinamicamente consoante o estado de ecrã inteiro.
- ✨ **Configurações de Formato de Data**: Adicionado uma configuração de usuário para configurar um formato de exibição de data.
- ✨ **Media Crossfade**: transições de crossfade implementadas para a exibição de mídia, em vez da transição mais brusca para preta que estava presente antes.
- ✨ **Música AutoStop**: Otimizou o comportamento da música de fundo auto-parar para se comportar da mesma maneira que a música foi auto-iniciada ou não.
- ✨ **macOS Click-Through no Windows Inativo**: Clique com o mouse habilitado sobre a janela principal para macOS, o que deve tornar mais fácil o controle do aplicativo, mesmo quando ele não está focado.

## v25.9.0

### ✨ Novas Funcionalidades

- ✨ **Download Popup Enhancements**: Adicionado botão atualizar e baixar o agrupamento por data no pop-up de download.
- ✨ **Memória da Ordem de Mídia Acompanhada**: Memória da ordem de seção adicionada para itens de mídia assistidos.

## v25.8.3

### ✨ Novas Funcionalidades

- ✨ **Media Window Fade Transitions**: Added a new advanced setting to make the media window fade in and out, providing smoother visual transitions.
- ✨ **Image Duration Control and Progress Tracking**: Added image duration control and progress tracking capabilities for repeated sections.

## v25.8.1

### ✨ Novas Funcionalidades

- ✨ **Custom Media Sections**: Complete system for creating, editing, and managing custom media sections with color customization and drag-and-drop reordering.
- ✨ **Media Dividers**: Add titled dividers within media lists for better organization with top/bottom positioning options.
- ✨ **Section Repeat Mode**: Enable continuous playback within specific sections for seamless media loops.
- ✨ **Zoom Integration**: Automatic screen sharing start/stop coordination with media playback.

### 🛠️ Melhorias e Ajustes

- 🛠️ **Enhanced Section Headers**: New three-dots menu system with color picker, move up/down controls, repeat options, and delete functionality.
- ✨ **Inline Title Editing**: Edit media item titles directly in the interface without opening separate dialogs.
- 🛠️ **Improved Navigation**: Better keyboard shortcuts with scroll-to-selected functionality and enhanced media navigation.
- 🛠️ **Visual Enhancements**: Animation support during sorting operations and improved drag-and-drop visual feedback.

## 25.6.0

### ✨ Novas Funcionalidades

- ✨ **Definição de conexão limitada**: Adicionada uma nova configuração para reduzir o uso da largura de banda de download em conexões com medidor.
- **Melhoria do tratamento de multimédia em fluxo contínuo**: Melhor suporte para multimédia em fluxo contínuo, reduzindo os problemas relacionados com a latência.

### 🛠️ Melhorias e Ajustes

- 🛠️ **Melhor tratamento de tipos MIME**: Suporte melhorado para tipos MIME para uma melhor compatibilidade com a multimédia.
- 🛠️ **Gaveta de navegação melhorada**: Melhoria do manuseamento do miniestado e adição de uma apresentação de dicas para uma melhor navegação do utilizador.
- 🛠️ **Compatibilidade com Linux**: Uso forçado do GTK 3 no Linux para evitar a UI e iniciar problemas.

## 25.5.0

### ✨ Novas Funcionalidades

- 🖼️ **Opção de atraso de OBS para imagens**: Adicionar uma definição OBS Studio para atrasar as alterações de cena ao apresentar imagens, melhorando as transições.
- 🔊 **Suporte para o formato de áudio `.m4a`**: Adicionar compatibilidade para ficheiros de áudio `.m4a` para expandir os tipos de multimédia suportados.

### 🛠️ Melhorias e Ajustes

- 🔍 **Restaurar o zoom com `Ctrl` + `Scroll`**: Reativar o zoom imediato com o gesto de controlo + scroll para facilitar a navegação.
- 👤 **Ocultar multimédia não utilizada do Sup. Circuito**: Esconder em vez de saltar a multimédia não utilizada nas visitas do Superintendente de Circuito para manter uma apresentação mais limpa.
- 🎵 **Melhorar o indicador de músicas duplicadas**: Melhorar a indicação visual de músicas duplicadas para facilitar a sua identificação.

## 25.4.3

### 🛠️ Melhorias e Ajustes

- ➕ Limpar Conteúdos da v25.4.x: Limpeza automática de conteúdos órfãos ou mal colocados das versões v25.4.1 a v25.4.2, garantindo que nenhuma multimédia esteja em falta ou no local errado na lista de multimédia.

## 25.4.2

### 🛠️ Melhorias e Ajustes

- ➕ Evitar Duplicação de Multimédia: Impede que certa multimédia seja adicionada várias vezes à lista de multimédia.

## 25.4.1

### 🛠️ Melhorias e Ajustes

- 🎬 Corrigir Atribuição Personalizada de Início/Fim: Impede que os tempos personalizados de início e fim sejam aplicados incorretamente ao vídeo errado.
- 📝 Permitir Legendas Desajustadas: Permite o uso de legendas mesmo quando não correspondem perfeitamente ao ficheiro de multimédia.
- 🪟 Desativar Canto Arredondado no Windows: Remove os cantos arredondados da janela de mídia no Windows.
- 🖼 Incluir Imagens Não Referenciadas na Lista de Multimédia: Garante que todas as imagens não referenciadas sejam adicionadas à lista de multimédia para maior completude.
- ➕ Evitar Secções de Multimédia Duplicadas: Impede a criação de várias secções de multimédia para o mesmo item de multimédia.
- 📥 Preservar a Ordem da Playlist na Importação: Manter a ordem original das playlists JWL durante o processo de importação.

## 25.4.0

### ✨ Novas Funcionalidades

- 🇵🇭 **Novo Idioma: Tagalog**: Adicionado suporte para Tagalog, expandindo as capacidades multilingues da aplicação.
- 🎞 **Suporte para o formato de vídeo `.m4v`**: Agora é possível reproduzir ficheiros `.m4v`, melhorando a compatibilidade com diferentes tipos de multimédia.

### 🛠️ Melhorias e Ajustes

- 🎬 Vários Momentos de Início/Fim para um Único Vídeo: Permite que um único vídeo apareça várias vezes na lista de multimédia com diferentes momentos personalizados de início e fim.
- 📤 Incluir Multimédia Agrupado na Exportação Automática: Exporta automaticamente os itens de multimédia agrupados juntamente com os restantes.
- 📡 Correcção na Obtenção de.m4v a partir da API JW: Garante que os ficheiros.m4v são correctamente obtidos a partir da API JW.

## 25.3.1

### ✨ Novas Funcionalidades

- : globe_showing_Asia-Austrália: **Novo Idioma: Coreano**: Adicionado suporte para o idioma coreano, expandindo a acessibilidade para mais utilizadores.

### 🛠️ Melhorias e Ajustes

- ⚡ **Melhor desempenho e uso da CPU**: Otimização do desempenho para reduzir o uso da CPU e melhorar a eficiência.
- 🔄 **Corrigir problemas de sincronização e 'crash'**: resolver vários problemas de estabilidade e sincronização para melhorar a confiabilidade.
- 📜 **Mostrar Notas de Lançamento para Congregações Existentes**: Garante de que as notas de lançamento só são exibidas para congregações que já estão carregadas.

## 25.3.0

### ✨ Novas Funcionalidades

- 🎵 Reproduzir Música de Fundo com Vídeos: Permite que a música de fundo continue a tocar enquanto os vídeos são reproduzidos.
- 🎥 Transmissão de Câmara para Multimédia em Língua Gestual: Permite exibir a transmissão da câmara na janela de multimédia, especificamente para utilizadores de língua gestual.
- 📅 Data e Plano de Fundo do Memorial Automáticos: Deteta e define automaticamente a data do Memorial e prepara a imagem de fundo correspondente.
- 📜 Notas de Lançamento na Aplicação: Mostra as notas de lançamento diretamente na aplicação, permitindo aos utilizadores rever facilmente as alterações após uma atualização.

### 🛠️ Melhorias e Ajustes

- ⚡ Otimização da Limpeza Inteligente da Cache: Melhoria do mecanismo de limpeza da cache para maior desempenho e eficiência.
- 📂 Correção da Colocação de Multimédia do Superintendente de Circuito: Garantir que os ficheiros multimédia do Superintendente de Circuito sejam colocados na secção correta.
- 📅 Excluir Multimédia de Reuniões Regulares para a Comemoração: Impedir o descarregamento de multimédia das reuniões regulares para a Comemoração, de modo a evitar erros.
- 📅 Ocultar Secções de Reuniões Regulares na Comemoração: Remover secções desnecessárias de reuniões durante o evento da Comemoração para um layout mais limpo.
- 📖 Corrigir Downloads de Vídeos da Bíblia em Língua Gestual: Corrigir o download dos vídeos dos capítulos da Bíblia em Língua Gestual a partir das playlists JWL.

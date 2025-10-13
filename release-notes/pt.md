<!-- markdownlint-disable no-duplicate-heading -->

# Novidades

Para obter a lista completa das mudanças entre versões, consulte nosso arquivo CHANGELOG.md no GitHub.

## v25.10.0

### ✨ Novos Recursos

- ✨ **Begin Playback Paused**: Added a new setting to allow playback to begin paused, which can be useful for AV operators to prepare their setup (such as starting Zoom sharing) before the media starts playing in the media window.
- ✨ **Update Notifications**: Users will now be notified of updates through an in-app banner, which will also allow the user to install updates immediately, instead of waiting for the next app restart.
- ✨ **Custom Events**: Added optional events hooks that can trigger keyboard shortcuts when certain events are detected. This can be useful for AV operators to execute actions automatically outside of the app. For example, smart lights could be turned on and off before and after media plays in auditoriums where projectors are used; or a script can be called after a meeting's last song has been played to automate various actions in a Zoom meeting.

## v25.9.1

### ✨ Novos Recursos

- ✨ **Janela de Mídia sempre na parte superior e comportamento Fullscreen**: Corrigido e melhorado sempre no topo da janela de mídia, ajustando dinamicamente com base no estado em tela cheia.
- ✨ \*\*Configuração de Formato de Data \*\*: Adicionado uma configuração de usuário para configurar um formato de exibição de data.
- ✨ **Mídia Crossfade**: transições de crossfade implementadas para a exibição de mídia, em vez da transição mais brusca para preta que estava presente antes.
- ✨ **Música AutoStop**: Otimizou o comportamento da música de fundo para auto-parar para se comportar da mesma maneira que a música foi auto-iniciada ou não.
- ✨ **macOS Click-Through no Windows Inativo**: Habilitado clique no mouse sobre a janela principal para macOS, o que deve facilitar o controle do aplicativo, mesmo quando ele não está focado.

## v25.9.0

### ✨ Novos Recursos

- ✨ **Melhoria no Pop-up de Downloads**: Adicionado botão de atualização e agrupamento de downloads por data no pop-up de download.
- ✨ **Memória da ordem de mídias assistidas**: adicionada a função de lembrar a ordem das seções para mídias já assistidas.

## v25.8.3

### ✨ Novos Recursos

- ✨ **Transições de Fade da Janela de Mídia**: Adicionada uma nova configuração avançada para fazer a janela de mídia desaparecer e para fora, fornecendo transições visuais mais fáceis.
- ✨ **Controle de Duração da Imagem e Progresso**: Adicionado controle de duração da imagem e capacidade de acompanhamento do progresso para seções repetidas.

## v25.8.1

### ✨ Novos Recursos

- ✨ **Seções Personalizadas de Mídia**: Sistema completo para criar, editar e gerenciar seções de mídia personalizadas com personalização de cor e reordenação de arrastar e soltar.
- ✨ **Divisores de Mídia**: Adicione divisores titulares dentro das listas de mídia para uma melhor organização com opções de posicionamento de topo/inferior.
- ✨ **Modo repita a seção**: Ativar reprodução contínua em seções específicas para loops de mídia perfeitos.
- ✨ **Zoom Integração**: Iniciar/Parar automaticamente o compartilhamento de tela com a reprodução de mídia.

### 🛠️ Melhorias e Ajustes

- 🛠️ **Cabeçalhos de Seção Aprimoradas**: Novo sistema de menu de três pontos com a barra de cores, mover controles para cima/para baixo, repetir opções e excluir funcionalidade.
- ✨ **Edição de Título Inline**: Editar títulos de itens de mídia diretamente na interface sem abrir diálogos separados.
- 🛠️ **Navegação melhorada**: Melhores atalhos de teclado com funcionalidade de scroll-to-selected e navegação aprimorada de mídia.
- 🛠️ **Melhorias Visuais**: Suporte de animação durante a classificação de operações e melhoramento do feedback visual de arrastar e soltar.

## 25.6.0

### ✨ Novos Recursos

- ✨ **Configuração de conexão limitada**: Adicionada uma nova configuração para reduzir o uso de largura de banda em conexões limitadas.
- ✨ **Melhoria no Manuseio de Mídia em Stream**: Melhor suporte para mídia transmitida, reduzindo problemas relacionados à latência.

### 🛠️ Melhorias e Ajustes

- 🛠️ **Melhor Manuseio de Tipos MIME**: Suporte aprimorado para tipos MIME, garantindo melhor compatibilidade de mídia.
- 🛠️ **Aprimoramento do Menu de Navegação**: Melhor gerenciamento de estado e adição de exibição de dicas de ferramenta para facilitar a navegação do usuário.
- 🛠️ **Compatibilidade com Linux**: Forçado o uso do GTK 3 no Linux para evitar problemas de interface e inicialização.

## 25.5.0

### ✨ Novos Recursos

- **Opção de Atraso no OBS para Imagens**: Adiciona uma configuração no OBS Studio para atrasar a mudança de cena ao exibir imagens, melhorando as transições.
- **Compatibilidade com Áudio .m4a**: Adiciona compatibilidade com arquivos .m4a, ampliando os tipos de mídia aceitos.

### 🛠️ Melhorias e Ajustes

- **Restaurar Zoom com Ctrl + Rolagem**: Reabilita o zoom imediato com o gesto de Ctrl + rolagem, facilitando a navegação.
- 👤 **Ocultar Mídia do SC Não Utilizada**: Oculta, em vez de ignorar, a mídia não utilizada nas visitas do superintendente de circuito, mantendo a apresentação mais limpa.
- 🎵 **Melhoria no Indicador de Cânticos Duplicados**: Melhora o destaque visual para cânticos duplicados, facilitando sua identificação.

## 25.4.3

### 🛠️ Melhorias e Ajustes

- ➕ **Limpar Mídias da Versão 25.4.x**: Limpa automaticamente mídias órfãs ou deslocadas da versão 25.4.1 à 25.4.2 para garantir que nenhum item esteja faltando ou no lugar errado da lista de mídias.

## 25.4.2

### 🛠️ Melhorias e Ajustes

- ➕ **Prevenção a Mídias Duplicadas**: Evita que sejam adicionados itens repetidos à lista de mídias.

## 25.4.1

### 🛠️ Melhorias e Ajustes

- 🎬 **Correção na Atribuição de Horários de Início/Fim Personalizados**: Impede que horários de início e fim personalizados sejam aplicados incorretamente a vídeos errados.
- 📝 **Permitir Legendas Desajustadas**: Habilita o uso de legendas, mesmo que não correspondam perfeitamente ao arquivo de mídia.
- 🪟 **Desabilitar Cantos Arredondados no Windows**: Remove os cantos arredondados da janela de mídia no Windows.
- 🖼 **Incluir Imagens Não Referenciadas na Lista de Mídia**: Garante que todas as imagens não referenciadas sejam adicionadas à lista de mídia para maior completude.
- ➕ **Prevenir Seções de Mídia Duplicadas**: Evitar a criação de várias seções para o mesmo item de mídia.
- 📥 **Preservar a Ordem da Playlist na Importação**: Manter a ordem original das playlists JWL durante o processo de importação.

## 25.4.0

### ✨ Novos Recursos

- 🇵🇭 **Novo idioma: Tagalo**: Suporte adicionado para Tagalo, expandindo as capacidades multilíngues do aplicativo.
- 🎞️ **Suporte para o Formato de Vídeo `.m4v`**: Agora suporta a reprodução de arquivos `.m4v` para melhorar a compatibilidade de mídia.

### 🛠️ Melhorias e Ajustes

- 🎬 **Múltiplos Pontos de Início/Fim para um Único Vídeo**: Permite que um único vídeo apareça na lista de mídia várias vezes com diferentes pontos de início/fim personalizados.
- 📤 **Inclusão de Mídia Agrupada na Exportação Automática**: Exporta automaticamente itens de mídia agrupados junto com outros.
- 📡 **Obtenção correta de `.m4v` da API JW**: Garante que os arquivos `.m4v` sejam obtidos corretamente da API JW.

## 25.3.1

### ✨ Novos Recursos

- 🌏 **Novo Idioma: Coreano**: Adiciona suporte para o idioma coreano, expandindo a acessibilidade para mais usuários.

### 🛠️ Melhorias e Ajustes

- ⚡ **Melhora no Desempenho e Uso da CPU**: Otimiza o desempenho para reduzir o uso da CPU e melhorar a eficiência.
- 🔄 **Correção de Problemas de Sincronização e Travamento**: Resolve vários problemas de estabilidade e relacionados à sincronização para melhorar a confiabilidade.
- 📜 **Mostrar Notas de Versão para Congregações Existentes**: Garante que as notas de lançamento só sejam exibidas para congregações que já estão carregadas.

## 25.3.0

### ✨ Novos Recursos

- 🎵 **Reprodução de Música de Fundo com Vídeos**: Permite que a música de fundo continue reproduzindo enquanto os vídeos estão sendo exibidos.
- 🎥 **Transmissão de Câmera para Mídia de Língua de Sinais**: Adiciona a capacidade de exibir a transmissão de uma câmera na janela de mídia especificamente para usuários de língua de sinais.
- 📅 **Data da Celebração e Fundo de Tela Automáticos**: Detecta e configura automaticamente a data da Celebração e prepara a imagem de fundo da Celebração.
- 📜 **Exibição de Notas de Versão no Aplicativo**: Mostra notas de lançamento diretamente no aplicativo para que os usuários possam facilmente revisar as alterações após uma atualização.

### 🛠️ Melhorias e Ajustes

- ⚡ **Otimização da Limpeza Inteligente de Cache**: Melhora o mecanismo de limpeza inteligente de cache para melhor desempenho e eficiência.
- 📂 **Correção no Posicionamento das Mídias do Superintendente de Circuito**: Garante que a mídia do Superintendente de Circuito esteja na seção correta.
- 📅 **Exclusão da Mídia de Reunião Regular para a Celebração**: Evita buscar a mídia padrão das reuniões na data da Celebração para prevenir erros.
- 📅 **Ocultar Seções da Reunião Regular na Celebração**: Remove seções desnecessárias das reuniões durante o evento da Celebração para um layout mais limpo.
- 📖 **Correção nos Downloads de Vídeos da Bíblia em Língua de Sinais**: Baixa corretamente vídeos de capítulos bíblicos em língua de sinais a partir de playlists JWL.

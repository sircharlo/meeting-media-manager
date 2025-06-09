<!-- markdownlint-disable no-duplicate-heading -->

# Novidades

Para obter a lista completa das mudanças entre versões, consulte nosso arquivo CHANGELOG.md no GitHub.

## v25.6.0 Release Notes

### ✨ Novos Recursos

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

### 🛠️ Melhorias e Ajustes

- 🛠️ **Better mime type handling**: Improved support for MIME types for better media compatibility.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Linux compatibility**: Forced GTK 3 usage on Linux to prevent UI and launch issues.

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

- 🎬 **Fix Custom Start/End Time Assignment**: Prevent custom start and end times from being incorrectly applied to the wrong video.
- 📝 **Allow Mismatched Subtitles**: Enable use of subtitles even when they do not perfectly match the media file.
- 🪟 **Disable Rounded Corners on Windows**: Remove rounded corners for the media window on Windows.
- 🖼 **Include Non-Referenced Images in Media List**: Ensure all non-referenced images are added to the media list for completeness.
- ➕ **Prevenir Seções de Mídia Duplicadas**: Evitar a criação de várias seções para o mesmo item de mídia.
- 📥 **Preserve Playlist Order on Import**: Maintain the original order of JWL playlists during the import process.

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
- 📜 **Mostrar Notas de Lançamento para Congregações Existentes**: Garante que as notas de lançamento só sejam exibidas para congregações que já estão carregadas.

## 25.3.0

### ✨ Novos Recursos

- 🎵 **Reprodução de Música de Fundo com Vídeos**: Permite que a música de fundo continue reproduzindo enquanto os vídeos estão sendo exibidos.
- 🎥 **Transmissão de Câmera para Mídia de Língua de Sinais**: Adiciona a capacidade de exibir a transmissão de uma câmera na janela de mídia especificamente para usuários de língua de sinais.
- 📅 **Data da Celebração e Fundo de Tela Automáticos**: Detecta e configura automaticamente a data da Celebração e prepara a imagem de fundo da Celebração.
- 📜 **Exibição de Notas de Lançamento no Aplicativo**: Mostra notas de lançamento diretamente no aplicativo para que os usuários possam facilmente revisar as alterações após uma atualização.

### 🛠️ Melhorias e Ajustes

- ⚡ **Otimização da Limpeza Inteligente de Cache**: Melhora o mecanismo de limpeza inteligente de cache para melhor desempenho e eficiência.
- 📂 **Correção no Posicionamento das Mídias do Superintendente de Circuito**: Garante que a mídia do Superintendente de Circuito esteja na seção correta.
- 📅 **Exclusão da Mídia de Reunião Regular para a Celebração**: Evita buscar a mídia padrão das reuniões na data da Celebração para prevenir erros.
- 📅 **Ocultar Seções da Reunião Regular na Celebração**: Remove seções desnecessárias das reuniões durante o evento da Celebração para um layout mais limpo.
- 📖 **Correção nos Downloads de Vídeos da Bíblia em Língua de Sinais**: Baixa corretamente vídeos de capítulos bíblicos em língua de sinais a partir de playlists JWL.

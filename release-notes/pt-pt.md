<!-- markdownlint-disable no-duplicate-heading -->

# Novidades

Para a lista completa de alterações entre versões, consulte o ficheiro CHANGELOG.md no GitHub.

## v25.6.0 Release Notes

### ✨ Novas Funcionalidades

- ✨ **Metered connection setting**: Added a new setting to reduce download bandwidth usage on metered connections.
- ✨ **Improved streamed media handling**: Better support for streamed media, reducing latency-related issues.

### 🛠️ Melhorias e Ajustes

- 🛠️ **Better mime type handling**: Improved support for MIME types for better media compatibility.
- 🛠️ **Enhanced navigation drawer**: Improved mini state handling and added tooltip display for better user navigation.
- 🛠️ **Linux compatibility**: Forced GTK 3 usage on Linux to prevent UI and launch issues.

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

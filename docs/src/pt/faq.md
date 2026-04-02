# Perguntas Frequentes {#frequently-asked-questions}

## Perguntas Gerais {#general-questions}

### :earth_americas: Este aplicativo depende de sites, fontes ou "curadores" externos para baixar publicações, mídias de reuniões ou outros conteúdos? {#external-dependencies}

**Não.** O aplicativo se comporta de maneira semelhante ao JW Library. Ele baixa publicações, mídias e outros conteúdos diretamente do site oficial das Testemunhas de Jeová e sua rede de entrega de conteúdo. O aplicativo determina automaticamente o que precisa ser baixado e se uma publicação ou mídia foi atualizada e precisa ser baixada novamente.

:::info Nota

O código fonte para este aplicativo está disponível para todos examinarem e verificarem o que realmente ele faz.

:::

### :thinking: Este aplicativo infringe os Termos de Uso do site oficial das Testemunhas de Jeová? {#terms-of-use}

**Não.** Os [Termos de Uso](https://www.jw.org/finder?docid=1011511&prefer=content) do site oficial das Testemunhas de Jeová permitem explicitamente o tipo de uso que estamos fazendo. Aqui está o trecho relevante desses termos (ênfase adicionada):

> Você não pode:
>
> Criar, com o objetivo de distribuir, qualquer software, aplicativo, ferramenta ou técnica que sirva especificamente para colecionar, copiar, baixar, extrair ou rastrear dados, HTML, imagens ou textos deste site. (Isso **não** proíbe a distribuição gratuita, sem fins comerciais, de aplicativos projetados para baixar arquivos eletrônicos como EPUB, PDF, MP3 e arquivos MP4 das áreas públicas deste site.)

### :question: Quais sistemas operacionais o M3 suporta? {#operating-systems}

M3 suporta Windows, macOS e Linux:

- **Windows**: Windows 10 e posterior (versões de 64-bit e 32-bit disponíveis)
- **macOS**: macOS 10.15 (Catalina) ou posterior (build Universal)
- **Linux**: Distribuições Linux mais modernas (AppImage format)

### :globe_with_meridians: O M3 funciona no meu idioma? {#language-support}

**Sim!** O M³ oferece suporte abrangente em vários idiomas:

- **Mídias**: Baixe mídias em qualquer uma das centenas de idiomas disponíveis no site oficial das Testemunhas de Jeová
- **Interface do aplicativo**: Use a interface do M³ em vários idiomas diferentes
- **Configurações Independentes**: você pode usar a interface em um idioma enquanto baixa a mídia em outro
- **Idiomas alternativos**: Configure idiomas alternativos para quando a mídia não estiver disponível no idioma principal
- **Suporte a legendas**: Baixe e exiba legendas em vários idiomas

## Instalação e configuração {#installation-setup}

### :computer: Como faço para baixar e instalar o M³? {#installation}

Baixe a versão apropriada na [página de Download](download) e siga as etapas no [Guia do usuário](user-guide).

### :gear: Como faço para configurar o M³ pela primeira vez? {#first-time-setup}

O M³ inclui um assistente de configuração que o orienta na configuração essencial:

1. Escolha o idioma da interface
2. Selecione o tipo de perfil (Regular ou Outro)
3. Configure as informações da congregação
4. Configure a programação das reuniões
5. Configure recursos opcionais como integração com OBS

## Gerenciamento de mídias {#faq-media-management}

### :desktop_computer: Como o M³ baixa as mídias? {#media-download}

O M³ baixa automaticamente as mídias das próximas reuniões ao:

1. Verificar a programação de suas reuniões
2. Determinar quais mídias são necessárias
3. Baixar do site oficial das Testemunhas de Jeová no idioma selecionado
4. Organizar as mídias por data e tipo de reunião
5. Armazenar arquivos em cache para uso offline

### :calendar: Posso baixar mídias para datas específicas? {#specific-dates}

Sim! O M³ permite que você:

- Baixe mídias para as próximas reuniões automaticamente
- Importe mídias personalizadas para qualquer data

### :file_folder: What is media auto-export? {#faq-media-export} :file_folder: What is media auto-export?

Você pode importar mídias personalizadas de várias maneiras:

- **Importação de arquivos**: Use o botão de importação para adicionar vídeos, imagens ou arquivos de áudio
- **Arrastar e soltar**: Arraste os arquivos diretamente para o M³
- **Monitoramento de pasta**: Configure uma pasta monitorada para importações automáticas
- **Arquivos e listas de reprodução JWPUB**: Importe publicações e listas de reprodução

### :speaker: Posso importar gravações de áudio da Bíblia? {#audio-bible}

Sim! O M³ inclui um recurso de Bíblia em áudio que permite:

1. Selecionar livros e capítulos da Bíblia
2. Escolher versículos específicos ou faixas de versículos
3. Baixar gravações de áudio
4. Usá-los nas reuniões

## Recursos de apresentação {#faq-presentation-features}

### :tv: Como faço para apresentar mídias durante as reuniões? {#present-media}

Para apresentar mídias:

1. Selecione a data
2. Clique no botão de reprodução do item de mídia que deseja apresentar ou use atalhos de teclado
3. Use os controles do reprodutor de mídia para pausar, navegar ou parar a reprodução
4. Use os recursos de zoom/pan para imagens
5. Defina o tempo personalizado se necessário

### :keyboard: Quais atalhos de teclado estão disponíveis? {#faq-keyboard-shortcuts}

O M³ suporta atalhos de teclado personalizáveis para:

- Abrir/fechar janela de mídia
- Navegação entre mídias anterior/próxima
- Controles de reproduzir/pausar/parar
- Alternar música de fundo

<!-- - Fullscreen mode -->

### :notes: Como funciona a música de fundo? {#faq-background-music}

Os recursos de música de fundo incluem:

- Reprodução automática quando o M³ inicia, antes do início da reunião
- Parada automática antes do início das reuniões
- Reinício com um clique após as reuniões
- Controle de volume independente
- Tempo de parada configurável

### :video_camera: Como faço para configurar a integração com o Zoom? {#zoom-setup}

Para integrar com o Zoom:

1. Habilite a integração com o Zoom nas configurações do M³
2. Configure o atalho de compartilhamento de tela que está configurado no Zoom. Certifique-se de que o atalho é "global" nas configurações do Zoom.
3. O M³ iniciará e parará automaticamente o compartilhamento de tela do Zoom durante apresentações de mídia

## Integração com o OBS Studio {#faq-obs-integration}

### :video_camera: Como faço para configurar a integração com o OBS Studio? {#faq-obs-setup}

Para integrar com o OBS Studio:

1. Instale o OBS Studio e o plugin WebSocket
2. Habilite a integração com OBS nas configurações do M³
3. Insira a porta e a senha do OBS
4. Configure cenas para câmera, mídias e imagens
5. Teste a reprodução

### :arrows_counterclockwise: Como funciona a mudança automática de cenas? {#faq-scene-switching}

O M³ muda automaticamente as cenas do OBS com base em:

- Tipo de mídia (vídeo, imagem, etc.)
- Sua configuração de cenas
- Configurações como "Adiar imagens"
- Se deve retornar à cena anterior após a mídia

### :pause_button: O que é o recurso "Adiar imagens"? {#faq-postpone-images}

Este recurso adia o compartilhamento de imagens para o OBS até que você as acione manualmente. Isso é útil para:

- Mostrar as imagens primeiro para o público presencial
- Ter mais controle sobre o tempo
- Evitar mudanças prematuras de cena

## Recursos avançados {#faq-advanced-features}

### :cloud: Como funciona o monitoramento de pasta? {#faq-folder-monitoring}

O monitoramento de pasta permite que você:

1. Selecione uma pasta para monitorar novos arquivos
2. Importe automaticamente novos arquivos de mídia que são sincronizados com armazenamento em nuvem como Dropbox ou OneDrive

### :open_file_folder: How do I import my own media files? {#import-media}

A exportação automática de mídias automaticamente:

1. Exporta arquivos de mídia para uma pasta especificada
2. Organiza os arquivos por data e seção
3. Converte os arquivos para o formato MP4 (opcional)
4. Mantém um backup organizado dos arquivos de mídia das reuniões

### :family: Posso gerenciar várias congregações? {#faq-multiple-congregations}

Sim! O M³ suporta múltiplos perfis para:

- Diferentes congregações
- Eventos especiais
- Grupos diferentes
- Configurações e mídias separadas para cada

## Solução de problemas {#faq-troubleshooting}

### :warning: As mídias não estão sendo baixadas. O que devo verificar? {#faq-media-not-downloading}

Verifique estes problemas comuns:

1. **Programação das reuniões**: Verifique se os dias e horários das suas reuniões estão corretos
2. **Configurações de idioma**: Certifique-se de que o idioma da mídia está configurado corretamente
3. **Conexão com a internet**: Verifique sua conexão com a internet
4. **Disponibilidade do idioma**: Verifique se a mídia está disponível no idioma selecionado

<!-- 5. **Manual Refresh**: Try manually refreshing to check for new media -->

### :video_camera: A integração com o OBS não está funcionando. O que devo verificar? {#faq-obs-not-working}

Verifique estes problemas relacionados ao OBS:

1. **Instalação do OBS**: Certifique-se de que o OBS Studio está instalado e em execução
2. **Plugin WebSocket**: Verifique se o plugin WebSocket está instalado
3. **Porta e senha**: Verifique as configurações de porta e senha do OBS
4. **Firewall**: Certifique-se de que o firewall não está bloqueando a conexão

### :speaker: O Meeting Media Manager envia automaticamente o áudio da mídia para o Zoom ao usar o OBS Studio? {#audio-to-zoom}

**Não.** O M³ não envia automaticamente o áudio da mídia para o Zoom ou OBS Studio. A transmissão de vídeo funciona como uma câmera virtual sem som, assim como uma webcam. Para ter o som da música/vídeo disponível no Zoom automaticamente, você precisa garantir que o Zoom 'ouça' a alimentação de áudio vindo do computador e então habilitar a configuração **Áudio original** no Zoom.

**Notas importantes:**

- Você deve habilitar o Áudio original **todas as vezes** antes de iniciar uma reunião no Zoom
- Esta configuração não está relacionada ao M³ - você enfrentaria o mesmo problema de áudio ao usar qualquer outro reprodutor de mídia e não usar os recursos de compartilhamento de tela e áudio do Zoom
- A configuração de Áudio original tem três subopções - normalmente as duas primeiras devem estar habilitadas e a terceira desabilitada para qualidade de áudio ideal
- Se você ainda estiver enfrentando problemas de áudio, pode ser necessário usar a opção "Compartilhar som do computador" do Zoom
- Alternativamente, considere usar a integração com o Zoom, pois ela usa o compartilhamento de tela nativo do Zoom.

**Por que isso é necessário?**
O M³ reproduz mídias com som no seu computador, mas esse áudio não é transmitido automaticamente pela transmissão de vídeo para o Zoom ao usar o OBS Studio. A configuração de Áudio original permite que o Zoom capture o áudio sendo reproduzido no seu computador durante o compartilhamento de tela, se o seu computador estiver configurado corretamente (por exemplo: o computador tem uma segunda placa de som que é usada para reprodução de mídia à qual o Zoom ouve como microfone).

### :snail: O M³ está executando lentamente. Como posso melhorar o desempenho? {#performance-issues}

Tente estas otimizações de desempenho:

1. **Habilitar cache extra**: Ative o cache adicional nas configurações
2. **Fechar outros aplicativos**: Feche aplicativos desnecessários
3. **Verificar espaço em disco**: Certifique-se de ter espaço livre suficiente em disco
4. **Reduzir resolução**: Diminua a configuração de resolução máxima

### :speech_balloon: Estou tendo problemas com idiomas. O que devo verificar? {#faq-language-issues}

Verifique estas configurações de idioma:

1. **Idioma da interface**: Verifique a configuração do idioma de exibição
2. **Idioma da mídia**: Verifique o idioma de download da mídia
3. **Disponibilidade do idioma**: Certifique-se de que o idioma da mídia está disponível no site oficial das Testemunhas de Jeová
4. **Idioma alternativo**: Tente configurar um idioma alternativo

## Suporte e comunidade {#support-community}

### :radioactive: Como faço para relatar um problema? {#how-do-i-report-an-issue}

Por favor, [registre um problema](https://github.com/sircharlo/meeting-media-manager/issues) no repositório oficial do GitHub. Inclua:

- Descrição detalhada do problema
- Passos para reproduzir o problema
- Seu sistema operacional e versão do M³
- Quaisquer mensagens de erro, logs e capturas de tela

### :new: Como posso solicitar um novo recurso ou melhoria? {#how-can-i-request-a-new-feature-or-enhancement}

Por favor, [abra uma discussão](https://github.com/sircharlo/meeting-media-manager/discussions) no repositório oficial do GitHub. Descreva:

- O recurso que você gostaria de ver
- Como isso beneficiaria os usuários
- Quaisquer requisitos ou preferências específicas

### :handshake: Como posso contribuir com código? {#how-can-i-contribute-some-code}

Por favor, [consulte o guia de contribuição](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) no repositório oficial do GitHub. Aceitamos contribuições de código e Pull Requests!

### :globe_with_meridians: Como posso ajudar com traduções? {#translations}

O M³ usa o Crowdin para gerenciamento de traduções. Você pode contribuir com traduções:

1. Visitando o [projeto no Crowdin](https://crowdin.com/project/meeting-media-manager)
2. Selecionando seu idioma
3. Traduzindo strings que precisam de trabalho
4. Revisando traduções existentes

### :x: Posso fazer uma doação para o projeto? {#can-i-make-a-donation-to-the-project}

Obrigado pelo seu interesse em apoiar o projeto! No entanto, no espírito de Mateus 10:8, doações **não** são aceitas e nunca serão. Este aplicativo foi feito com amor e um pouco de tempo livre. Aproveite! :tada:

:::tip :book: Mateus 10:8

"Recebestes de graça, dai de graça."

:::

## Perguntas técnicas {#technical-questions}

### :computer: Quais são os requisitos de hardware e software do M³? {#hardware-and-software-requirements}

O M³ foi projetado para funcionar em uma ampla variedade de sistemas operacionais:

- **Windows**: Windows 10 e posterior (versões de 64-bit e 32-bit disponíveis)
- **macOS**: macOS 10.15 (Catalina) ou posterior (build Universal)
- **Linux**: Distribuições Linux mais modernas (AppImage format)

O M³ tem os seguintes requisitos de hardware:

- **Mínimo**: 4GB de RAM, 6GB de espaço livre em disco
- **Recomendado**: 8GB de RAM, 15GB de espaço livre em disco para cache de mídias
- **Rede**: Conexão com a internet para downloads de mídias

Dependendo dos recursos que você usa, o M³ também requer o seguinte software adicional:

- **Zoom**: Necessário apenas se usar recursos de integração com o Zoom
- **OBS Studio**: Necessário apenas se usar recursos de integração com o OBS

### :floppy_disk: Quanto espaço em disco é usado pelo M³? {#disk-space}

O uso do espaço em disco depende de:

- **Resolução de mídia**: Resoluções mais altas usam mais espaço
- **Conteúdo em cache**: arquivos de mídia são armazenados localmente
- **Cache extra**: Cache adicional pode aumentar o uso
- **Mídia exportada**: Exportação automática de recursos usa espaço adicional

O uso típico varia de 2-10GB, dependendo das configurações e do uso.

### :shield: O M³ é seguro e privado? {#security-privacy}

Sim! O M³ foi projetado para segurança e privacidade em mente:

- **Armazenamento local**: Todos os dados da reunião são armazenados localmente no seu computador
- **Downloads diretos**: A mídia é baixada diretamente do site oficial das Testemunhas de Jeová
- **Código aberto**: O código está aberto para revisão e verificação
- **Relatórios de erro**: dados limitados podem ser coletados para fins de relatório de erros

### :arrows_clockwise: Com que frequência o M³ verifica se há atualizações? {#update-frequency}

M³ procura por atualizações:

- **Atualizações do aplicativo**: Verifica automaticamente novas versões toda vez que o aplicativo é aberto
- **Atualizações de Mídia**: Verifica automaticamente novas mídias de reuniões toda vez que o app for aberto
- **Atualizações de Idioma**: Detecção dinâmica de novos idiomas conforme necessário

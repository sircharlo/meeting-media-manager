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
- **macOS**: macOS 10.15 (Catalina) e posterior (Suporte ao Intel e à Apple Silicon)
- **Linux**: Distribuições Linux mais modernas (AppImage format)

### :globe_with_meridians: O M3 funciona no meu idioma? {#language-support}

**Sim!** O M³ oferece suporte abrangente em vários idiomas:

- **Idiomas de Mídia**: Faça o download da mídia em qualquer uma das centenas de idiomas disponíveis no site oficial das Testemunhas de Jeová
- **Idiomas da interface**: use a interface M3 em diversos idiomas
- **Configurações Independentes**: você pode usar a interface em um idioma enquanto baixa a mídia em outro

## Instalação e configuração {#installation-setup}

### :computer: Como faço para instalar o M3? {#installation}

Baixe a versão apropriada para o seu sistema operacional em [página de lançamentos](https://github.com/sircharlo/meeting-media-manager/releases/latest) e siga as instruções de instalação no [guia de instalação](/using-at-a-kingdom-hall#download-and-install).

### :gear: Como eu configuro o M³ pela primeira vez? {#first-time-setup}

M3 inclui um assistente de configuração que o guia através das configurações essenciais:

1. Escolha o idioma da sua interface
2. Selecione o tipo de perfil (regular ou outros)
3. Configure as informações da congregação
4. Configurar a programação de reuniões
5. Configurar recursos opcionais como integração do OBS

## Gerenciamento de Mídia {#faq-media-management}

### :download: Como o M³ baixa mídia? {#media-download}

O M³ baixa automaticamente as mídias das próximas reuniões por:

1. Verificar a sua programação de reuniões
2. Determinar que mídia é necessária
3. Baixar do site oficial das Testemunhas do Jeová no idioma selecionado
4. Organizar a mídia por data e tipo de reunião
5. Armazenar arquivos em cache para uso offline

### :calendar: Posso baixar mídia para datas específicas? {#specific-dates}

Sim! O M³ permite que você:

- Baixe mídia para as próximas reuniões automaticamente
- Importe mídia personalizada para qualquer data

### :folder: Como faço para importar meus próprios arquivos de mídia? {#import-media}

Você pode importar mídias personalizadas de várias maneiras:

- **Importação de arquivo**: Use o botão importar para adicionar vídeos, imagens ou arquivos de áudio
- **Arraste e Solte**: Arraste arquivos diretamente no M³
- **Monitoramento de Pastas**: Configurar uma pasta selecionada para importações automáticas
- **Arquivos e Playlists JWPUB**: Importar publicações e playlists

### :speaker: Posso importar gravações de áudio da Bíblia? {#audio-bible}

Sim! O M³ inclui um recurso de Áudio da Bíblia que permite que você:

1. Selecione livros e capítulos da Bíblia
2. Escolha versículos específicos ou intervalo de versículos
3. Baixe as gravações de áudio
4. Use-as nas reuniões

## Apresentação de Recursos {#faq-presentation-features}

### :tv: Como faço para exibir a mídia durante as reuniões? {#present-media}

Para exibir mídia:

1. Selecione a data
2. Clique no botão reproduzir no item de mídia que você deseja exibir ou usar os atalhos do teclado
3. Use os controles do reprodutor de mídia para pausar, navegar ou parar a reprodução
4. Use recursos zoom/pan para imagens
5. Definir tempo personalizado se necessário

### :keyboard: Quais atalhos de teclado estão disponíveis? {#faq-keyboard-shortcuts}

O M³ suporta atalhos de teclado personalizáveis para:

- Abrir/fechar janela de mídia
- Navegação de mídia anterior/seguinte
- Controles de reprodução/pausar/parar
- Trocar música de fundo

<!-- - Fullscreen mode -->

### :music: Como funciona a música de fundo? {#faq-background-music}

Recursos de música de fundo incluem:

- Reprodução automática quando o M³ inicia, antes de começar a reunião
- Interromper automaticamente antes das reuniões começarem
- Um clique reiniciará após reuniões
- Controle de volume independente
- Tempo de espera configurável

### :video_camera: Como faço para configurar a integração de Zoom? {#zoom-setup}

Para integrar com o Zoom:

1. Ative a integração com o Zoom nas configurações do M³
2. Configure o atalho de compartilhamento de tela configurado no Zoom. Certifique-se de que o atalho esteja marcado como "global" nas configurações do Zoom.
3. O M³ iniciará e interromperá automaticamente o compartilhamento de tela durante as apresentações da mídia

## Integração com OBS Studio {#faq-obs-integration}

### :video_camera: Como faço para configurar a integração com OBS Studio? {#faq-obs-setup}

Para integrar com o OBS Studio:

1. Instalar o OBS Studio e o plugin WebSocket
2. Ative a integração com o OBS Studio nas configurações do M³
3. Entre no OBS e digite a porta e a senha
4. Configurar cenários para câmera, mídia e imagens
5. Teste a reprodução

### :arrows_counterclockwise: Como funciona a mudança automática de cena? {#faq-scene-switching}

M³ altera automaticamente as cenas OBS com base em:

- Tipo de mídia (vídeo, imagem, etc)
- Sua configuração de cena
- Configurações como "Adiar Imagens"
- Se deve retornar para a cena anterior após a mídia

### :pause_button: O que é o recurso "Pós-Imagem"? {#faq-postpone-images}

Este recurso atrasa o compartilhamento de imagens no OBS até você ativá-las manualmente. É útil para:

- Exibindo imagens ao público presencial primeiro
- Ter mais controle sobre o tempo
- Evitar mudanças prematuras na cena

## Recursos Avançados {#faq-advanced-features}

### O :cloud: Como funciona o monitoramento de pasta? {#faq-folder-monitoring}

Monitoramento de pastas permite que você:

1. Selecione uma pasta para ver os novos arquivos
2. Importar automaticamente novos arquivos de mídia que são sincronizados com armazenamento em nuvem, como Dropbox ou OneDrive

### :file_folder: O que é a exportação automática de mídia? {#faq-media-export}

Exportar automaticamente as mídias:

1. Exporta arquivos de mídia para uma pasta específica
2. Organiza arquivos por data e seção
3. Converte arquivos para o formato MP4 (opcional)
4. Mantém um backup organizado de arquivos de mídia de reuniões

### :family: Posso gerenciar várias congregações? {#faq-multiple-congregations}

Sim! O M³ suporta vários perfis para:

- Congregações diferentes
- Eventos especiais
- Grupos diferentes
- Configurações e mídia separadas para cada um

## Solução de problemas {#faq-troubleshooting}

### O :warning: Mídia não está baixando. O que devo verificar? {#faq-media-not-downloading}

Verifique estes problemas comuns:

1. **Programação da Reunião**: verifique os dias e os horários da sua reunião
2. **Configurações de Idioma**: Certifique-se de que seu idioma de mídia esteja definido corretamente
3. **Conexão de Internet**: Verifique sua conexão com a internet
4. **Disponibilidade de Idiomas**: Verifique se a mídia está disponível no idioma selecionado

<!-- 5. **Manual Refresh**: Try manually refreshing to check for new media -->

### :video_camera: A integração OBS não está funcionando. O que devo verificar? {#faq-obs-not-working}

Verifique estes problemas relacionados ao OBS:

1. **Instalação do OBS**: Certifique-se de que o OBS Studio está instalado e em execução
2. **Plugin WebSocket**: verifique se o plugin WebSocket está instalado
3. **Porta e Senha**: verifique suas configurações de porta e senha do OBS
4. **Firewall**: Certifique-se de que o firewall não está bloqueando a conexão

### :speaker: O M³ envia automaticamente o áudio da mídia para o Zoom ao usar o OBS Studio? {#audio-to-zoom}

**Não.** M³ não envia automaticamente áudio de mídia para Zoom ou OBS Studio. O stream de vídeo funciona como uma câmera virtual sem som, como uma webcam. Para ter o som de música/vídeo disponível automaticamente no Zoom, você precisa garantir que o Zoom 'ouve' o feed de áudio vindo do computador, e então você deve ativar as configurações de **Áudio original** no Zoom.

**Notas importantes:**

- Você deve ativar o Áudio Original **toda vez** antes de iniciar uma reunião Zoom
- Esta configuração não está relacionada ao M³ - você enfrentará o mesmo problema de áudio ao usar qualquer outro reprodutor de mídia e não usar recursos de compartilhamento de tela e áudio do Zoom
- A configuração Áudio original tem três sub-opções - tipicamente os dois primeiros devem ser ativados e o terceiro deve ser desativado para melhor qualidade de áudio
- Se ainda estiver com problemas de áudio, talvez precise usar a opção "Compartilhar som do computador" do Zoom
- Como alternativa, procure usar a integração com o Zoom, enquanto usa o compartilhamento de tela nativo do Zoom.

\*\*Por que isso é preciso? \*
M³ reproduz mídia com som em seu computador, mas este áudio não é transmitido automaticamente através do stream do vídeo para o Zoom quando usando o OBS Studio. A configuração Áudio original permite que o Zoom capture a reprodução de áudio no seu computador durante o compartilhamento de tela se o seu computador está configurado corretamente (por exemplo: o computador tem uma segunda placa de som usada para reprodução de mídia que o Zoom escuta como um microfone.)

### :snail: M³ está rodando lentamente. Como posso melhorar o desempenho? {#performance-issues}

Experimente essas otimizações de desempenho:

1. **Habilitar cache extra**: ative cache adicional nas configurações
2. **Fechar outros aplicativos**: Feche aplicativos desnecessários
3. **Check Disk Space**: Ensure you have sufficient free disk space
4. **Reduce Resolution**: Lower the maximum resolution setting

### :speech_balloon: I'm having language issues. O que devo verificar? {#faq-language-issues}

Verify these language settings:

1. **Interface Language**: Check your display language setting
2. **Media Language**: Verify your media download language
3. **Language Availability**: Ensure the media language is available on the official website of Jehovah's Witnesses
4. **Fallback Language**: Try setting a fallback language

## Support and Community {#support-community}

### :radioactive: Como faço para reportar um problema? {#how-do-i-report-an-issue}

Por favor, [registre uma issue](https://github.com/sircharlo/meeting-media-manager/issues) no repositório oficial do GitHub. Include:

- Detailed description of the problem
- Steps to reproduce the issue
- Your operating system and M³ version
- Any error messages, logs and screenshots

### :new: Como posso solicitar um novo recurso ou melhoria? {#how-can-i-request-a-new-feature-or-enhancement}

Por favor, [abra uma discussão](https://github.com/sircharlo/meeting-media-manager/discussions) no repositório oficial do GitHub. Describe:

- The feature you'd like to see
- How it would benefit users
- Any specific requirements or preferences

### :handshake: Como posso contribuir com algum código? {#how-can-i-contribute-some-code}

Por favor, [veja o guia de contribuições](https://github.com/sircharlo/meeting-media-manager/blob/master/CONTRIBUTING.md) no repositório oficial do GitHub. We welcome code contributions and Pull Requests!

### :globe_with_meridians: How can I help with translations? {#translations}

M³ uses Crowdin for translation management. You can contribute translations by:

1. Visiting the [Crowdin project](https://crowdin.com/project/meeting-media-manager)
2. Selecting your language
3. Translating strings that need work
4. Reviewing existing translations

### :x: Posso fazer uma doação para o projeto? {#can-i-make-a-donation-to-the-project}

Obrigado pelo seu interesse em apoiar o projeto! No entanto, com base em Mateus 10:8, doações **não** são aceitas e nunca serão. Este aplicativo foi feito com amor e um pouco de tempo livre. Aproveite! :tada:

:::tip :book: Mateus 10:8

"Vocês receberam de graça, portanto deem de graça."

:::

## Technical Questions {#technical-questions}

### :floppy_disk: How much disk space does M³ use? {#disk-space}

Disk space usage depends on:

- **Media Resolution**: Higher resolutions use more space
- **Cached Content**: Media files are cached locally
- **Extra Cache**: Additional caching can increase usage
- **Exported Media**: Auto-export features use additional space

Typical usage ranges from 2-10GB depending on settings and usage.

### :shield: Is M³ secure and private? {#security-privacy}

Sim! M³ is designed with security and privacy in mind:

- **Local Storage**: All meeting data is stored locally on your computer
- **Direct Downloads**: Media is downloaded directly from the official website of Jehovah's Witnesses
- **Open Source**: The code is open for review and verification
- **Bug Reports**: Limited data may be collected for bug reporting purposes

### :arrows_clockwise: How often does M³ check for updates? {#update-frequency}

M³ checks for updates:

- **Application Updates**: Automatically checks for new versions every time the app is opened
- **Media Updates**: Automatically checks for new meeting media every time the app is opened
- **Language Updates**: Dynamic detection of new languages as needed

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

1. Select a folder to watch for new files
2. Automatically import new media files that are synced with cloud storage like Dropbox or OneDrive

### :file_folder: What is media auto-export? {#faq-media-export}

Media auto-export automatically:

1. Exports media files to a specified folder
2. Organizes files by date and section
3. Converts files to MP4 format (optional)
4. Maintains an organized backup of meeting media files

### :family: Can I manage multiple congregations? {#faq-multiple-congregations}

Sim! M³ supports multiple profiles for:

- Different congregations
- Special events
- Different groups
- Separate settings and media for each

## Troubleshooting {#faq-troubleshooting}

### :warning: Media isn't downloading. What should I check? {#faq-media-not-downloading}

Check these common issues:

1. **Meeting Schedule**: Verify your meeting days and times are correct
2. **Language Settings**: Ensure your media language is set correctly
3. **Internet Connection**: Check your internet connection
4. **Language Availability**: Verify media is available in your selected language

<!-- 5. **Manual Refresh**: Try manually refreshing to check for new media -->

### :video_camera: The OBS integration isn't working. What should I verify? {#faq-obs-not-working}

Check these OBS-related issues:

1. **OBS Installation**: Ensure OBS Studio is installed and running
2. **WebSocket Plugin**: Verify the WebSocket plugin is installed
3. **Port and Password**: Check your OBS port and password settings
4. **Firewall**: Ensure the firewall isn't blocking the connection

### :speaker: Does Meeting Media Manager automatically send the media audio to Zoom when using OBS Studio? {#audio-to-zoom}

**No.** M³ does not automatically send media audio to Zoom or OBS Studio. The video stream works like a virtual camera with no sound, just like a webcam. To have the music/video sound available in Zoom automatically, you need to ensure that Zoom 'hears' the audio feed coming from the computer, and then you should enable the **Original Audio** setting in Zoom.

**Important Notes:**

- You must enable Original Audio **every time** before starting a Zoom meeting
- This setting is not related to M³ - you would face the same audio issue when using any other media player and not using Zoom's screen and audio sharing features
- The Original Audio setting has three sub-options - typically the first two should be enabled and the third disabled for optimal audio quality
- If you're still experiencing audio issues, you may need to use Zoom's "Share Computer Sound" option instead
- Alternatively, look into using the Zoom integration instead, as it uses Zoom's native screen sharing.

**Why is this necessary?**
M³ plays media with sound on your computer, but this audio is not automatically transmitted through the video stream to Zoom when using OBS Studio. The Original Audio setting allows Zoom to capture the audio playing on your computer during screen sharing, if your computer is configured properly (for example: the computer has a second sound card that is used for media playback which Zoom listens to as a microphone.)

### :snail: M³ is running slowly. How can I improve performance? {#performance-issues}

Try these performance optimizations:

1. **Enable Extra Cache**: Turn on additional caching in settings
2. **Close Other Apps**: Close unnecessary applications
3. **Check Disk Space**: Ensure you have sufficient free disk space
4. **Reduce Resolution**: Lower the maximum resolution setting

### :speech_balloon: I'm having language issues. What should I check? {#faq-language-issues}

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

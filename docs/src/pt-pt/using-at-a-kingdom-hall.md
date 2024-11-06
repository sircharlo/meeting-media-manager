# Using M³ at a Kingdom Hall {#using-m3-at-a-kingdom-hall}

Este guia irá orientá-lo pelo processo de descarregamento, instalação e configuração do **Meeting Media Manager (M³)** num Salão do Reino. Siga estes passos para garantir uma configuração sem falhas na gestão de multimédia durante as reuniões congregacionais.

## 1. Download and install {#download-and-install}

1. Visite a [página de download do M³](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Download the appropriate version for your operating system:
   - **Windows:**
     - For most Windows systems, download `meeting-media-manager-[VERSION]-x64.exe`.
     - For older 32-bit Windows systems, download `meeting-media-manager-[VERSION]-ia32.exe`.
   - **macOS:**
     - **M-series (Apple Silicon)**: Download `meeting-media-manager-[VERSION]-arm64.dmg`.
     - **Intel-based Macs**: Download `meeting-media-manager-[VERSION]-x64.dmg`.
   - **Linux:**
     - Download `meeting-media-manager-[VERSION]-x86_64.AppImage`.
3. Abra o instalador e siga as instruções na tela para instalar o M³.
4. Inicie o M³.
5. Siga o assistente de configuração.

### Additional steps for macOS Users {#additional-steps-for-macos-users}

Due to Apple's security measures, a few additional steps are required to run M³ on modern macOS systems.

First, run the following two commands in Terminal (modify the path to M³ as needed):

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::tip Explanation

These commands do two things that will prevent M³ from being detected as a malicious application on your system: the first one signs the application's code locally, and the second one removes the quarantine flag from the application. The quarantine flag is used to warn users about applications that have been downloaded from the internet.

:::

If you are still unable to launch M³ after entering the two commands, please try the following:

1. Open the macOS system **Privacy & Security** settings.
2. Find the entry for M³ and click the button to **Open Anyway**.
3. You will then be warned again, and given the advice to not "open this unless you are certain it is from a trustworthy source." Click **Open Anyway**.
4. Another warning will appear, where you’ll need to authenticate to launch the app.
5. M³ should now launch successfully.

If you still have issues after following all these steps, please [open an issue on GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). We will do our best to help.

## 2. Configuration wizard {#configuration-wizard}

### App display language {#app-display-language}

Ao iniciar o M³ pela primeira vez, será solicitado que escolha o seu **idioma de exibição** preferido. Escolha o idioma que deseja que o M³ utilize na sua interface.

:::tip Dica

Este não precisa ser o mesmo idioma em que o M³ fará o download de multimédia. O idioma para esse efeito será configurado posteriormente.

:::

### Profile type {#profile-type}

O próximo passo será escolher um **tipo de perfil**. Para uma configuração regular num Salão do Reino, escolha **Regular**. Esta configuração irá ajustar várias funcionalidades que são frequentemente utilizadas nas reuniões congregacionais.

:::warning Aviso

Deve escolher apenas **Outro** se estiver a criar um perfil para o qual não deve ser feito o download automático de multimédia. A multimédia terá de ser importada manualmente para ser utilizada neste perfil. Este tipo de perfil é desenhado especificamente para usar o M³ durante escolas teocráticas, assembleias, congressos e outros eventos especiais.

O tipo de perfil **Outro** é raramente utilizado. **Para o uso comum, durante as reuniões congregacionais, escolha _Regular_.**

:::

### Automatic congregation lookup {#automatic-congregation-lookup}

O M³ pode tentar encontrar automaticamente o horário das reuniões, o idioma e o nome da sua congregação.

Para fazer isso, use o botão **Pesquisa da Congregação** ao lado do campo do nome da congregação e insira pelo menos uma parte do nome e cidade da congregação.

Assim que a congregação correta for encontrada e selecionada, o M³ irá preencher automaticamente todas as informações disponíveis, como o **nome** da congregação, o **idioma** das reuniões e os **dias e horários** das reuniões.

:::info Nota

Esta pesquisa utiliza dados disponíveis publicamente no site oficial das Testemunhas de Jeová.

:::

### Manual entry of congregation information {#manual-entry-of-congregation-information}

Se a pesquisa automática não encontrou a sua congregação, é possível inserir manualmente as informações necessárias. O assistente permitirá que revise e/ou insira o **nome**, **idioma** das reuniões e os **dias e horários** das reuniões da sua congregação.

### Caching videos from the songbook {#caching-videos-from-the-songbook}

Também terá a opção de **armazenar em cache todos os cânticos**. Esta opção pré-carrega todos os cânticos, reduzindo o tempo necessário para procurar multimédia para as reuniões no futuro.

- **Prós:** A multimédia da reunião estará disponível muito mais rapidamente.
- **Contras:** O tamanho do cache de multimédia aumentará significativamente, em aproximadamente 5GB.

:::tip Dica

Se o seu Salão do Reino tiver espaço de armazenamento suficiente, é recomendável **ativar** esta opção para um desempenho visivelmente mais eficiente.

:::

### OBS Studio Integration Configuration (Optional) {#obs-studio-integration-configuration}

Se o seu Salão do Reino usar **OBS Studio** para transmitir reuniões híbridas pelo Zoom (isto é, reuniões em que existem pessoas a assistir por videoconferência), o M³ pode integrar-se automaticamente com esse programa. Durante a configuração, é possível configurar a integração com o OBS Studio inserindo o seguinte:

- **Porta:** O número da porta usado para conectar ao plugin Websocket do OBS Studio.
- **Senha:** A senha usada para conectar ao plugin Websocket do OBS Studio.
- **Cenas:** As cenas do OBS que serão usadas durante as apresentações de multimédia. Você precisará de uma cena que capture a janela ou a tela da multimédia e uma que mostre o palco.

:::tip Dica

Se a sua congregação realiza regularmente reuniões híbridas, é **altamente** recomendável ativar a integração com o OBS Studio.

:::

## 3. Enjoy using M³ {#enjoy-using-m3}

Assim que o assistente de configuração estiver concluído, o M³ estará pronto para auxiliar na gestão e apresentação de multimédia nas reuniões congregacionais. Aproveite ao usar a app! :tada:

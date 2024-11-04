# Usando o M³ no Salão do Reino

Este guia irá orientá-lo no processo de download, instalação e configuração do **Meeting Media Manager (M³)** em um Salão do Reino. Siga os passos para garantir uma configuração eficiente no gerenciamento de mídia durante as reuniões da congregação.

## 1. Baixar e instalar

1. Visite a [página de download do M³.](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Baixe a versão adequada para o seu sistema operacional (Windows, macOS ou Linux).
3. Abra o instalador e siga as instruções na tela para instalar o M³.
4. Abra o M³.
5. Siga as instruções do assistente de configuração.

### Additional steps for macOS Users

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

## 2. Assistente de configuração

### Idioma de exibição do aplicativo

Ao abrir o M³ pela primeira vez, será solicitado que você escolha o **idioma de exibição** da sua preferência. Escolha o idioma que você deseja que o M³ use na interface.

:::tip Dica

Esse idioma não precisa ser o mesmo que o M³ utilizará para baixar mídias. O idioma para o download de mídias será configurado em uma etapa posterior.

:::

### Tipo de perfil

O próximo passo é escolher um **tipo de perfil**. Para uma configuração padrão em um Salão do Reino, escolha **Regular**. Isso configurará muitos recursos que são frequentemente utilizados nas reuniões da congregação.

:::warning 2) Configuration wizard

Você deve escolher **Outro** apenas se estiver criando um perfil para o qual nenhuma mídia deve ser baixada automaticamente. As mídias terão de ser importadas manualmente para serem utilizadas neste perfil. Esse tipo de perfil é utilizado principalmente para usar o M³ durante escolas teocráticas, assembleias, congressos e outros eventos especiais.

O tipo de perfil **outro** é raramente usado. **Para uso normal durante as reuniões da congregação, escolha _Regular_.**

:::

### Pesquisa automática de congregação

O M³ pode encontrar automaticamente o horário das reuniões, o idioma e o nome da sua congregação.

Para isso, use o botão **Pesquisa congregacional** ao lado do campo de nome da congregação e insira pelo menos uma parte do nome da congregação e da cidade.

Uma vez que a congregação correta for encontrada e selecionada, o M³ preencherá automaticamente todas as informações disponíveis, como o **nome** da sua congregação, **idioma das reuniões** e **dias e horários das reuniões**.

:::info Nota

Esta pesquisa utiliza dados disponíveis publicamente no site oficial das Testemunhas de Jeová.

:::

### Inserir manualmente as informações da congregação

Se a busca automatizada não encontrar sua congregação, você pode, é claro, inserir manualmente as informações necessárias. O assistente permitirá que você revise e/ou insira o **nome** da sua congregação, o **idioma das reuniões** e os **dias e horários das reuniões**.

### Armazenamento temporário dos cânticos em vídeo

Você também terá a opção de **armazenar temporariamente todos os cânticos em vídeo**. Esta opção faz download de todos os cânticos em vídeo, o que ajuda ao não ter que baixá-los toda vez.

- **Prós:** A mídia das reuniões estará disponível muito mais rapidamente.
- **Contras:** O tamanho do armazenamento temporário de mídias aumentará significativamente, em aproximadamente 5GB.

:::tip Dica

Se o seu computador tiver espaço de armazenamento suficiente, é recomendável ativar essa opção para eficiência e melhor desempenho.

:::

### Configuração da integração com o OBS Studio (Opcional)

Se você usa o **OBS Studio** para transmitir reuniões híbridas pelo Zoom, o M³ pode se integrar automaticamente a esse programa. Durante a configuração, você pode configurar a integração com o OBS Studio inserindo o seguinte:

- **Porta:** O número da porta usada para se conectador ao plugin Websocket.
- **Senha:** A senha usada para conectar ao plugin Websocket.
- **Cenas:** As cenas do OBS que serão utilizadas durante a exibição de mídia. Você precisará de uma cena que captura a janela ou a tela de mídia, e adicionar uma fonte de câmera que mostre todo o palco.

:::tip Dica

Se a sua congregação realiza reuniões híbridas regularmente, é **altamente** recomendável ativar a integração com o OBS Studio.

:::

## 3. Aproveite o M³

Uma vez que o assistente de configuração seja concluído, o M³ estará pronto para exibir as mídias nas reuniões congregacionais. Aproveite o aplicativo! :tada:

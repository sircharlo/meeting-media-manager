<!-- markdownlint-disable no-inline-html -->

# Usando o M³ em um Salão do Reino {#using-m3-at-a-kingdom-hall}

Este guia o ajudará no processo de download, instalação e configuração do **Meeting Media Manager (M³)** em um Salão do Reino. Siga os passos para garantir uma configuração tranquila para gerenciar a mídia durante as reuniões da congregação.

## 1. Baixar e instalar {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Baixe a versão apropriada para o seu sistema operacional:
  - **Windows:**
    - Para a maioria dos sistemas Windows, baixe <a :href="data.win64">meeting-media-manager-[VERSÃO]-x64.exe</a>.
    - Para sistemas Windows mais antigos, de 32 bits, baixe <a :href="data.win32">meeting-media-manager-[VERSÃO]-ia32.exe</a>.
    - Para a versão portátil, faça o download de <a :href="data.winPortable">meeting-media-manager-[VERSÃO]-portable.exe</a>.
  - **macOS:**
    - **M-series (Apple Silicon)**: Baixe <a :href="data.macArm">meeting-media-manager-[VERSÃO]-arm64.dmg</a>.
    - **Macs com chip Intel**: Baixe <a :href="data.macIntel">meeting-media-manager-[VERSÃO]-x64.dmg</a>.
  - **Linux:**
    - Baixe <a :href="data.linux">meeting-media-manager-[VERSÃO]-x86_64.AppImage</a>.
2. Se os links de download não funcionarem, visite a [página de download do M³](https://github.com/sircharlo/meeting-media-manager/releases/latest) e baixe a versão correta manualmente.
3. Abra o instalador e siga as instruções na tela para instalar o M³.
4. Abra o M³.
5. Siga as instruções do assistente de configuração.

### Somente macOS: etapas adicionais de instalação {#additional-steps-for-macos-users}

:::warning 2) Configuration wizard

Esta seção se aplica apenas a usuários de macOS.

:::

Devido às medidas de segurança da Apple, alguns passos adicionais são necessários para executar o aplicativo M³ instalado em sistemas macOS modernos.

Execute os seguintes dois comandos no Terminal, modificando o caminho para o M³ conforme necessário:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Aviso

Como usuário do macOS, você precisará seguir esses passos sempre que instalar ou atualizar o M³.

:::

:::info Explicação

O primeiro comando _assina o código do aplicativo_. Isso é necessário para evitar que o M³ seja detectado como um aplicativo malicioso de um desenvolvedor desconhecido.

O segundo comando _remove a flag de quarentena_ do aplicativo. A flag de quarentena é usada para avisar os usuários sobre aplicativos potencialmente maliciosos que foram baixados da internet.

:::

#### Método alternativo {#alternative-method-for-macos-users}

Se você ainda não conseguir abrir o M³ após inserir os dois comandos da seção anterior, tente o seguinte:

1. Abra as configurações de **Privacidade e Segurança** do macOS.
2. Encontre a entrada para o M³ e clique no botão para **Abrir assim mesmo**.
3. Você será avisado novamente e receberá a recomendação de não "abrir isto, a menos que tenha certeza de que é de uma fonte confiável." Clique em **Abrir assim mesmo**.
4. Outra advertência aparecerá, onde você precisará autenticar para iniciar o aplicativo.
5. O M³ agora deve iniciar com sucesso.

Se você ainda tiver problemas após seguir todos esses passos, por favor, [abra uma issue no GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Faremos o nosso melhor para ajudar.

### Somente macOS: Reativando a apresentação do site após atualizações {#screen-sharing-issues}

:::warning Aviso

Esta seção se aplica apenas a usuários de macOS.

:::

Alguns usuários do macOS relataram que a apresentação do site não funciona mais após instalar atualizações do M³.

Se a janela de mídia estiver preta quando apresentar o site após atualizar o M³, tente os seguintes passos:

1. Abra as configurações de **Privacidade e Segurança** do macOS.
2. Vá para **Gravação de tela**.
3. Selecione o M³ na lista.
4. Clique no botão `-` (menos) para removê-lo.
5. Clique no botão `+` (mais) e selecione o M³ na pasta de aplicativos.
6. Você pode ser solicitado para reiniciar o M³ para aplicar a alteração.

Após esses passos, o compartilhamento de tela deve funcionar como esperado novamente.

:::tip Dica

Estas etapas são opcionais e podem ser ignoradas se você não planeja usar o recurso de apresentação do site. Por outro lado, se você planeja usar o recurso de apresentação do site, é recomendado seguir esses passos após cada atualização para garantir que o recurso funcione como esperado.

:::

## 2. Assistente de configuração {#configuration-wizard}

### Idioma de exibição do aplicativo {#app-display-language}

Ao abrir o M³ pela primeira vez, será solicitado que você escolha o **idioma de exibição** da sua preferência. Escolha o idioma que você deseja que o M³ use na interface.

:::tip Dica

Esse idioma não precisa ser o mesmo que o M³ utilizará para baixar mídias. O idioma para o download de mídias será configurado em uma etapa posterior.

:::

### Tipo de perfil {#profile-type}

O próximo passo é escolher um **tipo de perfil**. Para uma configuração padrão em um Salão do Reino, escolha **Regular**. Isso configurará muitos recursos que são frequentemente utilizados nas reuniões da congregação.

:::warning Aviso

Você deve escolher **Outro** apenas se estiver criando um perfil para o qual nenhuma mídia deve ser baixada automaticamente. As mídias terão de ser importadas manualmente para serem utilizadas neste perfil. Esse tipo de perfil é utilizado principalmente para usar o M³ durante escolas teocráticas, assembleias, congressos e outros eventos especiais.

O tipo de perfil **outro** é raramente usado. **Para uso normal durante as reuniões da congregação, escolha _Regular_.**

:::

### Pesquisa automática de congregação {#automatic-congregation-lookup}

O M³ pode encontrar automaticamente o horário das reuniões, o idioma e o nome da sua congregação.

Para isso, use o botão **Pesquisa congregacional** ao lado do campo de nome da congregação e insira pelo menos uma parte do nome da congregação e da cidade.

Uma vez que a congregação correta for encontrada e selecionada, o M³ preencherá automaticamente todas as informações disponíveis, como o **nome** da sua congregação, **idioma das reuniões** e **dias e horários das reuniões**.

:::info Nota

Esta pesquisa utiliza dados disponíveis publicamente no site oficial das Testemunhas de Jeová.

:::

### Entrada manual de informações da congregação {#manual-entry-of-congregation-information}

Se a busca automatizada não encontrar sua congregação, você pode, é claro, inserir manualmente as informações necessárias. O assistente permitirá que você revise e/ou insira o **nome** da sua congregação, o **idioma das reuniões** e os **dias e horários das reuniões**.

### Armazenando em cache dos vídeos dos cânticos {#caching-videos-from-the-songbook}

Você também terá a opção de **armazenar temporariamente todos os cânticos em vídeo**. Esta opção faz download de todos os cânticos em vídeo, o que ajuda ao não ter que baixá-los toda vez.

- **Prós:** A mídia das reuniões estará disponível muito mais rapidamente.
- **Contras:** O tamanho do armazenamento temporário de mídias aumentará significativamente, em aproximadamente 5GB.

:::tip Dica

Se o seu computador tiver espaço de armazenamento suficiente, é recomendável ativar essa opção para eficiência e melhor desempenho.

:::

### Configuração de Integração com OBS Studio (Opcional) {#obs-studio-integration-configuration}

Se você usa o **OBS Studio** para transmitir reuniões híbridas pelo Zoom, o M³ pode se integrar automaticamente a esse programa. Durante a configuração, você pode configurar a integração com o OBS Studio inserindo o seguinte:

- **Porta:** O número da porta usada para se conectador ao plugin Websocket.
- **Senha:** A senha usada para conectar ao plugin Websocket.
- **Cenas:** As cenas do OBS que serão utilizadas durante a exibição de mídia. Você precisará de uma cena que captura a janela ou a tela de mídia, e adicionar uma fonte de câmera que mostre todo o palco.

:::tip Dica

Se a sua congregação realiza reuniões híbridas regularmente, é **altamente** recomendável ativar a integração com o OBS Studio.

:::

## 3. Aproveite o uso do M³ {#enjoy-using-m3}

Uma vez que o assistente de configuração seja concluído, o M³ estará pronto para exibir as mídias nas reuniões congregacionais. Aproveite o aplicativo! :tada:

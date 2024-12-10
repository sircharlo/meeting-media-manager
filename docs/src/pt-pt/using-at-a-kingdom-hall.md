<!-- markdownlint-disable no-inline-html -->

# Utilizar o M³ no Salão do Reino {#using-m3-at-a-kingdom-hall}

Este guia irá orientá-lo no processo de download, instalação e configuração do **Meeting Media Manager (M³)** no Salão do Reino. Siga os passos para uma configuração simples e eficiente na gestão de multimédia durante as reuniões congregacionais.

## 1. Descarregar e instalar {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Descarregue a versão apropriada para o seu sistema operativo:
   - **Windows:**
     - Para a maioria dos sistemas Windows, descarregue <a :href="data.win64">meeting-media-manager-[VERSÃO]-x64.exe</a>.
     - Para sistemas Windows 32 bits mais antigos, descarregue <a :href="data.win32">meeting-media-manager-[VERSÃO]-ia32.exe</a>.
     - Para uma versão portátil, descarregue <a :href="data.winPortable">meeting-media-manager-[VERSÃO]-portable.exe</a>.
   - **macOS:**
     - **M-series (Apple Silicon)**: Descarregue <a :href="data.macArm">meeting-media-manager-[VERSÃO]-arm64.dmg</a>.
     - **Macs com processador Intel**: Descarregue <a :href="data.macIntel">meeting-media-manager-[VERSÃO]-x64.dmg</a>.
   - **Linux:**
     - Descarregue <a :href="data.linux">meeting-media-manager-[VERSÃO]-x86_64.AppImage</a>.
2. Se os links de download não funcionarem, visite a [página de download do M³](https://github.com/sircharlo/meeting-media-manager/releases/latest) e descarregue manualmente a versão correta.
3. Abra o instalador e siga as instruções na tela para instalar o M³.
4. Inicie o M³.
5. Siga o assistente de configuração.

### Somente no macOS: Etapas adicionais da instalação {#additional-steps-for-macos-users}

:::warning Aviso

Esta secção só se aplica a utilizadores de macOS.

:::

Devido às medidas de segurança da Apple, são necessários alguns passos adicionais para executar a instalação da aplicação M³ em sistemas macOS modernos.

Execute os seguintes dois comandos no Terminal, modificando o caminho para o M³ conforme necessário:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Aviso

Como utilizador de macOS, será necessário seguir estes passos sempre que instalar ou atualizar o M³.

:::

:::info Explicação

O primeiro comando **assina o código da aplicação**. Isso é necessário para evitar que o M³ seja detectado como uma aplicação maliciosa de um desenvolvedor desconhecido.

O segundo comando **remove a bandeira de quarentena** da aplicação. A bandeira de quarentena é usada para alertar os utilizadores sobre aplicações potencialmente maliciosas que foram descarregadas da internet.

:::

#### Método alternativo {#alternative-method-for-macos-users}

Se ainda não conseguir abrir o M³ após ter inserido os dois comandos da secção anterior, por favor tente o seguinte:

1. Abra as configurações de **Privacidade e Segurança** do macOS.
2. Encontre a entrada para o M³ e clique no botão **Abrir de Qualquer Forma**.
3. Ser-lhe-á exibido um aviso novamente, com a recomendação de não "abrir isto, a menos que tenha a certeza de que é de uma fonte confiável." Clique **Abrir de Qualquer Forma**.
4. Aparecerá outro aviso, onde será necessário autenticar-se para iniciar a aplicação.
5. O M³ deverá agora iniciar com sucesso.

Se ainda tiver problemas depois de seguir todos esses passos, por favor [abra um problema no GitHub](https://github.com/sircharlo/meeting-media-manager/issues/new). Faremos o nosso melhor para ajudar.

### Somente no macOS: Reabilitar a apresentação do site após as atualizações {#screen-sharing-issues}

:::warning Aviso

Esta secção só se aplica a utilizadores de macOS.

:::

Alguns utilizadores de macOS relataram que a apresentação do site deixou de funcionar após a instalação de atualizações do M³.

Se a janela de multimédia estiver preta ao apresentar o site após atualizar o M³, tente os seguintes passos:

1. Abra as configurações de **Privacidade e Segurança** do macOS.
2. Vá para **Gravação de Ecrã**.
3. Selecione o M³ na lista.
4. Clique no botão `-` (menos) para removê-lo.
5. Clique no botão `+` (mais) e selecione o M³ na pasta Aplicações.
6. Pode ser solicitado que reinicie o M³ para aplicar a alteração.

Após estas etapas, o compartilhamento de ecrã deverá funcionar corretamente novamente.

:::tip Dica

Estas etapas são opcionais e podem ser ignoradas se não planeia usar o recurso de apresentação do site. Por outro lado, se planeia usar o recurso de apresentação do site, é recomendável seguir estas etapas após cada atualização para garantir que o recurso funcione como esperado.

:::

## 2. Assistente de configuração {#configuration-wizard}

### Idioma da interface do aplicativo {#app-display-language}

Ao iniciar o M³ pela primeira vez, será solicitado que escolha o seu **idioma de exibição** preferido. Escolha o idioma que deseja que o M³ utilize na sua interface.

:::tip Dica

Este não precisa ser o mesmo idioma em que o M³ fará o download de multimédia. O idioma para esse efeito será configurado posteriormente.

:::

### Tipo de perfil {#profile-type}

O próximo passo será escolher um **tipo de perfil**. Para uma configuração regular num Salão do Reino, escolha **Regular**. Esta configuração irá ajustar várias funcionalidades que são frequentemente utilizadas nas reuniões congregacionais.

:::warning Aviso

Deve escolher apenas **Outro** se estiver a criar um perfil para o qual não deve ser feito o download automático de multimédia. A multimédia terá de ser importada manualmente para ser utilizada neste perfil. Este tipo de perfil é desenhado especificamente para usar o M³ durante escolas teocráticas, assembleias, congressos e outros eventos especiais.

O tipo de perfil **Outro** é raramente utilizado. **Para o uso comum, durante as reuniões congregacionais, escolha _Regular_.**

:::

### Pesquisa automática de congregação {#automatic-congregation-lookup}

O M³ pode tentar encontrar automaticamente o horário das reuniões, o idioma e o nome da sua congregação.

Para fazer isso, use o botão **Pesquisa da Congregação** ao lado do campo do nome da congregação e insira pelo menos uma parte do nome e cidade da congregação.

Assim que a congregação correta for encontrada e selecionada, o M³ irá preencher automaticamente todas as informações disponíveis, como o **nome** da congregação, o **idioma** das reuniões e os **dias e horários** das reuniões.

:::info Nota

Esta pesquisa utiliza dados disponíveis publicamente no site oficial das Testemunhas de Jeová.

:::

### Entrada manual das informações da congregação {#manual-entry-of-congregation-information}

Se a pesquisa automática não encontrou a sua congregação, é possível inserir manualmente as informações necessárias. O assistente permitirá que revise e/ou insira o **nome**, **idioma** das reuniões e os **dias e horários** das reuniões da sua congregação.

### Armazenamento em cache de todos os cânticos{#caching-videos-from-the-songbook}

Também terá a opção de **armazenar em cache todos os cânticos**. Esta opção pré-carrega todos os cânticos, reduzindo o tempo necessário para procurar multimédia para as reuniões no futuro.

- **Prós:** A multimédia da reunião estará disponível muito mais rapidamente.
- **Contras:** O tamanho do cache de multimédia aumentará significativamente, em aproximadamente 5GB.

:::tip Dica

Se o seu Salão do Reino tiver espaço de armazenamento suficiente, é recomendável **ativar** esta opção para um desempenho visivelmente mais eficiente.

:::

### Configuração de integração do OBS Studio (Opcional) {#obs-studio-integration-configuration}

Se o seu Salão do Reino usar **OBS Studio** para transmitir reuniões híbridas pelo Zoom (isto é, reuniões em que existem pessoas a assistir por videoconferência), o M³ pode integrar-se automaticamente com esse programa. Durante a configuração, é possível configurar a integração com o OBS Studio inserindo o seguinte:

- **Porta:** O número da porta usado para conectar ao plugin Websocket do OBS Studio.
- **Senha:** A senha usada para conectar ao plugin Websocket do OBS Studio.
- **Cenas:** As cenas do OBS que serão usadas durante as apresentações de multimédia. Você precisará de uma cena que capture a janela ou a tela da multimédia e uma que mostre o palco.

:::tip Dica

Se a sua congregação realiza regularmente reuniões híbridas, é **altamente** recomendável ativar a integração com o OBS Studio.

:::

## 3. Aproveite ao usar o M³! {#enjoy-using-m3}

Assim que o assistente de configuração estiver concluído, o M³ estará pronto para auxiliar na gestão e apresentação de multimédia nas reuniões congregacionais. Aproveite ao usar a app! :tada:

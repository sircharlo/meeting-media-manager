# Ao usar o M³ no Salão do Reino

Este guia irá orientá-lo pelo processo de descarregamento, instalação e configuração do **Meeting Media Manager (M³)** num Salão do Reino. Siga estes passos para garantir uma configuração sem falhas na gestão de multimédia durante as reuniões congregacionais.

## 1. Descarregar e instalar

1. Visite a [página de download do M³](https://github.com/sircharlo/meeting-media-manager/releases/latest)
2. Descarregue a versão adequada para o seu sistema operativo (Windows, macOS ou Linux).
3. Abra o instalador e siga as instruções na tela para instalar o M³.
4. Inicie o M³.
5. Siga o assistente de configuração.

## 2) Assistente de configuração

### Idioma de exibição da app

Ao iniciar o M³ pela primeira vez, será solicitado a escolha do seu **idioma de exibição** de preferência. Escolha o idioma que deseja que o M³ use para a sua interface.

:::tip Dica

Isto não precisa ser o mesmo idioma em que o M³ irá descarregar a multimédia. O idioma para os download de multimédia é configurado posteriormente.

:::

### Tipo de perfil

O próximo passo será escolher um **tipo de perfil**. Para uma configuração regular em um Salão do Reino, escolha **Regular**. Isto irá configurar várias funcionalidades que são normalmente utilizadas nas reuniões da congregação.

:::warning Aviso

Você deve escolher **Outro** apenas se estiver criando um perfil para o qual nenhum multimédia deve ser descarregada automaticamente. A multimédia terá que ser importada manualmente para ser usada neste perfil. Este tipo de perfil é utilizado principalmente para usar o M³ durante escolas teocráticas, assembleias, congressos e outros eventos especiais.

O tipo de perfil **Outro** é raramente utilizado. **Para uso normal durante as reuniões da congregação, escolha _Regular_.**

:::

### Pesquisa automática da congregação

O M³ pode tentar encontrar automaticamente o horário das reuniões, o idioma e o nome da sua congregação.

Para fazer isso, use o botão **Pesquisa da Congregação** ao lado do campo do nome da congregação e insira pelo menos parte do nome e cidade da congregação.

Assim que a congregação correta for encontrada e selecionada, o M³ preencherá automaticamente todas as informações disponíveis, como o **nome** da sua congregação, **idioma** das reuniões e **dias e horários** das reuniões.

:::info Nota

Esta pesquisa utiliza dados disponíveis publicamente no site oficial das Testemunhas de Jeová.

:::

### Entrada manual das informações da congregação

Se a pesquisa automática não encontrou a sua congregação, é possível pode inserir manualmente as informações necessárias. O assistente permitirá que revise e/ou insira o **nome**, **idioma** das reuniões e **dias e horários** das reuniões da sua congregação.

### Armazenamento em cache de vídeos do cancioneiro

Também terá a opção de **armazenar em cache todos os vídeos do cancioneiro**. Esta opção pré-carrega todos os cânticos, reduzindo o tempo necessário para procurar multimédia para as reuniões no futuro.

- **Prós:** A multimédia da reunião estará disponível muito mais rapidamente.
- **Contras:** O tamanho do cache de multimédia aumentará significativamente, em aproximadamente 5GB.

:::tip Dica

Se o seu Salão do Reino tiver espaço de armazenamento suficiente, é recomendável **ativar** esta opção para mais eficiência e melhor desempenho.

:::

### Configuração de Integração do OBS Studio (Opcional)

Se o seu Salão do Reino usar **OBS Studio** para transmitir reuniões híbridas pelo Zoom (isto é, reuniões em que existem pessoas a assistir por videoconferência), o M³ pode integrar-se automaticamente com esse programa. Durante a configuração, é possível configurar a integração com o OBS Studio inserindo o seguinte:

- **Porta:** O número da porta usado para conectar ao plugin Websocket do OBS Studio.
- **Senha:** A senha usada para conectar ao plugin Websocket do OBS Studio.
- **Cenas:** As cenas do OBS que serão usadas durante as apresentações de multimédia. Você precisará de uma cena que capture a janela ou a tela da multimédia e uma que mostre o palco.

:::tip Dica

Se a sua congregação realiza regularmente reuniões híbridas, é **altamente** recomendável ativar a integração com o OBS Studio.

:::

## 3. Aproveite ao usar o M³

Assim que o assistente de configuração estiver concluído, o M³ estará pronto para auxiliar na gestão e apresentação de multimédia nas reuniões congregacionais. Aproveite ao usar a app! :tada:

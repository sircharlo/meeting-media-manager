---
tag: Uso
title: Modo de exibição de mídias
ref: present-media
---

### Usando o modo de exibição de mídias

Exibir mídias pelo M³ é simples e evita erros durante as reuniões.

Assim que a opção `Habilitar tela para exibição de mídias` estiver ativa, a tela de exibição de mídia aparecerá automaticamente numa tela, se conectada, ou em uma janela separada, que pode ser movida e redimensionável, se nenhuma tela externa for detectada.

Quando nenhum vídeo ou imagem estiver sendo exibido, a tela de exibição de mídia do M³ exibirá a imagem de fundo escolhida nas configurações. Se nenhuma imagem de fundo tiver sido selecionada, o M³ tentará buscar e exibir automaticamente o texto do ano.

Se nenhuma imagem de fundo estiver selecionada nas configurações e o texto do ano não puder ser carregado automaticamente, um fundo preto será exibido quando nenhuma mídia estiver sendo executada.

O modo de exibição de mídias pode ser acessado clicando no botão ▶️ (reproduzir) na tela principal do M³, ou usando o atalho de teclado <kbd>Alt D</kbd> (para exibir numa tela externa).

Depois de entrar no modo de exibição, a tela para selecionar a pasta permitirá que você selecione a data que deseja para exibir a mídia. Se a pasta do dia atual existir, ela será selecionada automaticamente. Depois que uma data é selecionada, você ainda pode alterar a data selecionada a qualquer momento clicando no botão de seleção de data, no quadrado superior.

### Exibindo mídia

Para reproduzir a mídia, clique no botão ▶️ (reproduzir) na mídia. Para parar a reprodução da mídia, clique no botão ⏹️ (parar). Um vídeo pode ser avançado ou retrocedido enquanto pausado, se desejado. Observe que, para vídeos, o botão Parar deve ser pressionado **duas vezes** para evitar que alguém aperte sem querer em parar enquanto algum vídeo estiver sendo reproduzido para a congregação. Os vídeos serão parados automaticamente ao terminar a reprodução.

### Recursos adicionais

O M³ tem alguns recursos extras que podem ser usados para melhorar a experiência da exibição de mídias.

#### Exibir JW.org

Para exibir o JW.org, você pode pressionar o botão (círculo) no topo da tela e selecionar `Abrir JW.org`. Isso abrirá uma janela de controle para o JW.org. A tela de exibição de mídia também mostrará o JW.org. Agora você pode usar a janela de controle para navegar no JW.org, e a janela de mídia exibirá suas ações. Quando terminar de exibir o JW.org, você pode fechar a janela de controle e continuar no modo normal de exibição de mídia.

#### Ampliar e mover imagens

Quando uma imagem estiver sendo exibida, você poderá rolar a roda do mouse enquanto passar o mouse sobre a pré-visualização da imagem para aumentar e diminuir o zoom. Como alternativa, você também pode clicar duas vezes na pré-visualização da imagem para ampliar. Um clique duplo irá alternar entre 1,5x, 2x, 3x, 4x e voltar para 1x zoom. Você também pode segurar e arrastar para mover a visualização para diferentes regiões da imagem.

#### Escolher ordem das mídias

A ordem das mídias pode ser definida clicando no botão no canto superior direito da tela. Ao lado de cada mídia terá um botão que pode ser usado para arrastar essa mídia para cima ou para baixo na lista. Quando você definir a ordem, pode clicar no botão no canto superior direito novamente para bloquear a ordem.

#### Adicionar um cântico de última hora

Se você precisar adicionar um cântico de última hora à lista de mídia, você pode pressionar o botão `♫+` (adicionar cântico) no topo do lado esquerdo da tela. Um menu aparecerá com uma lista de todos os cânticos. Quando você selecionar um cântico, ele vai ser adicionado ao topo da lista de mídia e poderá ser reproduzido instantaneamente. Será reproduzido o cântico do JW.org, ou se o cântico escolhido já tiver sido baixado pelo M³, será reproduzido.

### Realização de reuniões híbridas usando o M³, OBS Studio e Zoom

A maneira mais simples de exibir as mídias durante reuniões híbridas é configurando o OBS Studio com o M³ e o Zoom.

#### Configuração inicial: computador do Salão do Reino

Defina a resolução da tela externa para 1280x720, ou algo próximo disso.

Conecte o cabo P10 na mesa de som e o P2 na saída de áudio do computador para mandar o áudio do computador para os auto-falantes do Salão do Reino. E um cabo P10 ou RCA na entrada de gravação da mesa de som, e o P2 na saída de microfone do computador.

#### Configuração inicial: OBS Studio

Instale o OBS Studio ou baixe a versão portátil.

Se estiver usando a versão portátil do OBS Studio, instale o plug-in [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) e, se estiver usando a versão portátil do OBS Studio, adicione a câmera virtual ao Windows clicando duas vezes no script de instalação.

Se você tiver o OBS Studio v27 ou anterior, precisará instalar o plugin [obs-websocket](https://github.com/obsproject/obs-websocket). Caso contrário, o obs-websocket estará incluído. Configure um número de porta e senha para obs-websocket.

Nas configurações do OBS, em `Geral` > `Bandeja do sistema`, marque todas as caixas de seleção. Em `Saída` > `Transmissão`, habilite um codificador de hardware, se disponível. Em `Vídeo` > `Resolução de base (canvas)` e `Resolução de saída (escalonada)`, escolha `1280x720` e em `Filtro`, escolha `Bilinear`.

Configure pelo menos 2 cenas: uma para a exibição de mídia (`Captura de janela` ou `Captura de tela` com o cursor do mouse desativado e o título/monitor de janela apropriado selecionado) e uma para a visualização do palco (`Dispositivo de captura de vídeo` com a câmera do Salão do Reino selecionada). Você também pode adicionar outra cena para imagens. Ideal para mostrar a tela de exibição de mídias em tela cheia configurada no OBS e a câmera do Salão do Reino no canto no estilo Picture-in-Picture. Você pode adicionar quantas cenas forem necessárias, em diferentes cortes de câmera como (uma cena da tribuna, uma cena do dirigente e leitor, uma cena da mesa, etc.).

Adicione um filtro de `Dimensionamento/proporção` na `Captura de janela` ou `Captura de tela` configurada para `Resolução Base (Tela)`. Isso garantirá que a tela de exibição de mídias seja sempre ajustada à resolução de saída da câmera virtual.

Adicione um atalho para o OBS Studio, com o parâmetro `--startvirtualcam`, na pasta Iniciar do perfil de usuário do Windows, para garantir que o OBS Studio seja iniciado automaticamente ao iniciar o computador.

#### Configuração inicial: Zoom do Salão do Reino

O zoom deve ser configurado para usar monitores duplos. Ative os atalhos de teclado globais para Zoom para silenciar/ativar o áudio do Salão do Reino no Zoom (<kbd>Alt A</kbd>) e iniciar/parar o vídeo do Salão do Reino no Zoom ( <kbd>Alt V</kbd>).

Defina o "microfone" padrão como a placa externa de som ou do próprio computador (para que tudo o que for ouvido pelo sistema de som do Salão do Reino seja transmitido pelo Zoom, incluindo microfones e mídia) e a "câmera" para ser a câmera virtual do OBS Studio.

#### Configuração inicial: M³

Ative a opção `Habilitar tela para exibição de mídias`.

Habilite e configure o modo de compatibilidade com o OBS Studio, colocando a porta e senha que você configurou no plugin obs-websocket no OBS Studio.

#### Iniciando a reunião

Inicie a reunião Zoom e mova a janela secundária da reunião Zoom para a tela conectada. Você pode fazer isso em tela cheia, se desejar. É aqui que todos os participantes da reunião Zoom serão exibidos para a congregação ver.

Quando a reunião do Zoom estiver sendo exibida na tela externa, abra o M³. A janela de exibição de mídia será aberta automaticamente em cima do Zoom na tela externa. Baixe as mídias, se necessário, e entre no modo de exibição de mídia clicando no botão ▶️ (reproduzir) na tela principal do M³, ou <kbd>Alt D</kbd>.

Ative o vídeo do Salão do Reino (<kbd>Alt V</kbd>) pelo Zoom e destaque o vídeo do Salão do Reino, se necessário, para que os participantes do Zoom vejam a câmera do Salão do Reino. Ative o áudio do Salão do Reino no Zoom (<kbd>Alt A</kbd>). Não deve ser necessário desativar a câmera ou áudio no Zoom durante a reunião. Certifique-se de que o "Som original" esteja ativado no Zoom, para garantir a melhor qualidade de áudio.

Inicie a reprodução de cânticos de fundo usando o botão no canto inferior esquerdo, ou <kbd>Alt K</kbd>.

#### Transmitindo partes do palco do Salão do Reino para o Zoom

Nenhuma ação necessária.

Vários ângulos/zoom da câmera podem ser escolhidos durante a reunião usando o menu na parte inferior da janela de controle de reprodução de mídia do M³; este menu conterá uma lista de todas as cenas de visualização de câmera configuradas no OBS.

#### Compartilhando mídia no Salão do Reino e pelo Zoom

Encontre a mídia que deseja compartilhar na janela de controle de reprodução de mídia M³ e pressione o botão "reproduzir".

Quando terminar de compartilhar a mídia, pressione o botão "parar" no M³. Todos os vídeos param automaticamente após a conclusão.

#### Exibindo participantes do Zoom na tela do Salão do Reino

Pressione o botão "ocultar/exibir janela de apresentação de mídia" no canto inferior direito da tela do modo de exibição de mídia do M³, ou <kbd>Alt Z</kbd>, para **ocultar** a tela de exibição de mídia. A reunião Zoom agora estará visível na tela do Salão do Reino.

> Se o participante tiver mídia para mostrar, siga as etapas no subtítulo **Compartilhando mídia no Salão do Reino e pelo Zoom**.

Quando o participante terminar sua parte, pressione o botão "ocultar/exibir a tela de exibição de mídia" no canto inferior direito no modo de exibição de mídia do M³, ou <kbd>Alt Z</kbd>, para **mostrar** a tela de exibição de mídia. A tela do Salão do Reino mostrará agora o texto do ano.

### Reuniões híbridas usando apenas o M³ e Zoom

Se você não deseja usar o OBS Studio por qualquer motivo, as sugestões a seguir talvez o ajudem a configurar as coisas da maneira mais simples possível.

#### Configuração inicial: computador do Salão do Reino

Igual à seção acima. Com a adição do atalho de teclado global para Zoom para iniciar/parar o compartilhamento de tela (<kbd>Alt S</kbd>). A "câmera" será o video da câmera do Salão do Reino.

#### Configuração inicial: M³

Ative a opção `Habilitar tela para exibição de mídias`.

#### Iniciando a reunião

Igual à seção acima.

#### Transmitindo partes do palco do Salão do Reino para o Zoom

Igual à seção acima.

#### Compartilhando mídia no Salão do Reino e pelo Zoom

Comece a compartilhar no Zoom pressionando <kbd>Alt S</kbd>. Na janela de compartilhamento do zoom, escolha a tela externa conectada e ative as duas caixas de seleção no canto inferior esquerdo (para otimização de som e vídeo). O texto do ano agora será compartilhado pelo Zoom.

Encontre a mídia que deseja compartilhar na janela de controle de reprodução de mídia M³ e pressione o botão "reproduzir".

Quando terminar de compartilhar a mídia, pressione <kbd>Alt S</kbd> para encerrar o compartilhamento de tela no Zoom.

#### Exibindo participantes do Zoom na tela do Salão do Reino

Igual à seção acima.

### Capturas de tela do modo de exibição

{% include screenshots/present-media.html lang=site.data.pt %}

---
tag: Utilização
title: Modo de Exibição de Multimédia
ref: present-media
---

### Usar o Modo de Exibição de Multimédia

A exibição de multimédia e os modos de controlo de multimédia são concebidos para simplificar o trabalho de quem está no A/V e evitar erros durante reuniões.

Uma vez que a opção `Exibir multimédia num monitor externo ou numa janela separada` é habilitada a tela de exibição de multimédia aparecerá automaticamente no monitor externo, se estiver presente, ou numa janela separada, móvel e redimensionável se nenhum monitor externo for detetado.

Quando em espera, a tela de exibição de multimédia exibirá a imagem de fundo configurada nas definições. Se nenhuma imagem de fundo foi configurada, o M³ tentará procurar e exibir automaticamente o texto.

Se nenhuma imagem de fundo estiver configurada nas definições e o texto do ano não puder ser carregado automaticamente, um fundo preto será exibido no modo de espera.

O modo de controlo de multimédia pode ser acedido ao clicar no botão ▶️ (play) na tela principal do M³, ou usar o atalho do teclado <kbd>Alt D</kbd> (para exibição externa).

Após ter entrado no modo de controlo, a tela de seleção de pastas permitirá que selecione a data na qual gostaria de exibir a multimédia. Se existir uma pasta de dia atual, ela será pré-selecionada automaticamente. Uma vez que uma data é selecionada, ainda pode alterar a data selecionada a qualquer momento clicando no botão de seleção de data, na secção superior.

### Exibir multimédia

Para reproduzir a multimédia, pressione o botão ▶️ (play) para o ficheiro que desejar. Para ocultar a multimédia, pressione o botão ⏹️ (stop). Um vídeo pode ser rebobinado ou avançado rapidamente enquanto está em pausa, se desejado. Observe que para os vídeos, o botão de parar deve ser pressionado **duas vezes** para evitar parar um vídeo acidentalmente enquanto estiver a reproduzir para a congregação. Os vídeos param automaticamente quando tiverem sido reproduzidos na totalidade.

### Funcionalidades Extra:

O M³ tem alguns recursos extras que podem ser usados para melhorar a experiência de exibição de multimédia.

#### Exibir o JW.org

Para exibir o JW.org, pode pressionar o botão (reticências) na parte superior da tela e selecionar `Abrir JW.org`. Isso abrirá uma nova janela de controlo com JW.org carregada. A janela de multimédia também exibirá o JW.org. Agora você pode usar a janela do controlo para navegar no JW.org, e a janela de multimédia exibirá as suas ações. Quando terminar de exibir o JW.org, você pode fechar a janela de controlo e continuar com o modo normal de exibição de multimédia.

#### Ampliar e deslocar imagens

Quando uma imagem está a ser exibida, pode deslocar a roda do mouse enquanto passa o mouse sobre a pré-visualização da imagem para aumentar ou diminuir o zoom. Em alternativa, também pode fazer duplo clique na pré-visualização da imagem para aumentar o zoom. Se fizer duplo clique, alterna entre 1,5x, 2x, 3x, 4x e volta ao zoom de 1x. Também pode manter premido e arrastar a imagem para deslocar a imagem.

#### Ordenar a lista de multimédia

A lista de multimédia pode ser ordenada clicando no botão de ordenação no canto superior direito da tela. Os itens de multimédia terão um botão junto a eles que pode ser utilizado para arrastar o item de multimédia para cima ou para baixo na lista. Quando estiver satisfeito com a ordem, pode clicar novamente no botão de ordenação para bloquear a ordem.

#### Adicionar um cântico de última hora

Se precisar de adicionar uma música de última hora à lista de multimédia, pode premir o botão `♫ +` (adicionar cântico) na parte superior da tela. Um menu suspenso aparecerá com uma lista de todos os cânticos. Quando seleciona um, este é imediatamente adicionado ao topo da lista de média e pode ser reproduzido instantaneamente O cântico será transmitida a partir de JW.org ou reproduzida a partir da cache local, caso tenha sido descarregada anteriormente.

### Realizar reuniões híbridas usando uma combinação de M3, OBS Studio e Zoom

De longe, a maneira mais simples de compartilhar a multimédia durante reuniões híbridas é configurar o OBS Studio, M3 e Zoom para trabalhar juntos.

#### Configuração inicial: Computador do Salão do Reino

Defina a resolução de tela do monitor externo para 1280x720, ou algo próximo a isso.

Configure a saída da placa de som do computador para ir para uma das entradas do misturador da cabina de som e a saída combinada do misturador da cabina de som para ir para a entrada da placa de som do computador.

#### Configuração inicial: OBS Studio

Instale o OBS Studio ou faça o download da versão portátil.

Se usar a versão portátil do OBS Studio, instale o plugin [Virtualcam](https://obsproject.com/forum/resources/obs-virtualcam.949/) , e se estiver a usar a versão portátil do OBS Studio, adicione a câmara virtual no Windows clicando duas vezes no script de instalação fornecido.

Se você tem o OBS Studio v27 ou mais antigo, você precisa instalar o plugin [obs-websocket](https://github.com/obsproject/obs-websocket). Caso contrário, obs-websocket está incluído. Configure o número da porta e senha para obs-websocket.

Nas configurações do OBS, em `Geral` > `Sistema`, habilite todas as caixas de verificação. Em `Saída` > `Streaming`, habilite um codificador de hardware se disponível. Sob `Vídeo` > `Base (tela) Resolução` e `Saída (Chamado) Resolução`, escolha `1280x720`e abaixo `Filtro de Rebaixa`, escolha `Bilinear`.

Configure pelo menos 2 cenas: uma para a exibição de multimédia(`Captura de janela` ou `Exibir Captura` com o cursor do mouse desativado e o título/monitor da janela apropriada selecionado), e uma para a visualização do palco (`Dispositivo de Captura de Vídeo` com a câmera KH selecionada). Você também pode adicionar outra cena especificamente para imagens, onde a janela de mídia é visível junto com o pódio em um display de estilo picture-in-pic. Pode adicionar tantas cenas quantas as necessárias, com a câmara ajustada, ampliada e cortada conforme necessário (vista do orador e do leitor, vista da mesa, etc.).

Habilite o filtro `Scaling/Aspect Ratio` em todas as entradas `Captura de janela` ou `Captura de tela` com a Resolução `Resolução` da Base `(tela) Resolução`. Isso garantirá que a janela de multimédia seja sempre ajustada à resolução de saída da câmara virtual.

Adicionar um atalho ao OBS Studio, com o parâmetro `--startvirtualcam` , para a pasta Startup do perfil do utilizador do Windows, para garantir que o OBS Studio é iniciado automaticamente quando o utilizador faz o login.

#### Configuração inicial: Zoom do Salão do Reino

O zoom deve ser configurado para utilizar monitores duplos. Habilitar atalhos de teclado globais para silenciar/desmutar o áudio da Sala do Reino no Zoom (<kbd>Alt A</kbd>), e iniciar/parar a feed de vídeo do Salão do Reino no Zoom (<kbd>Alt V</kbd>).

Defina o "microfone" predefinido para ser a saída combinada do misturador da cabina de som (para que tudo o que é ouvido no sistema de som do Salão do Reino seja transmitido através do Zoom, incluindo microfones e meios de comunicação) e a "câmara" para ser a câmara virtual fornecida pelo OBS Studio.

#### Configuração inicial: M³

Habilita a Multimédia`presente num monitor externo ou numa janela separada`.

Ativar e configurar o modo de compatibilidade do OBS Studio, usando as informações de porta e senha configuradas na etapa de configuração do OBS Studio.

#### Início da reunião

Inicie a reunião Zoom e mova a janela secundária de reunião Zoom para o monitor externa. Torne-a tela cheia, se desejar. Aqui é onde quaisquer participantes da reunião Zoom serão exibidos para a congregação ver.

Quando a reunião Zoom estiver a ser exibida no monitor externo, abra o M³. A janela de exibição de multimédia será aberta automaticamente no topo do Zoom no monitor externo. Sincronize a multimédia, se necessário, e entre no modo de controlo de multimédia, clicando no botão ▶️ (play) na tela principal do M3, ou <kbd>ALT D</kbd>.

Habilite a fonte de vídeo do Salão do Reino (<kbd>Alt V</kbd>) e destaque-a, se necessário, para que os participantes do Zoom vejam o palco do Salão do Reino. Ative o som da fonte de áudio da Sala do Reino no Zoom (<kbd>Alt A</kbd>). Não deve ser necessário desativar a transmissão de vídeo ou áudio no Zoom durante a reunião. Certifique-se de que o "Som original para músicos" (ou algo parecido) esteja ativo no Zoom, para garantir a melhor qualidade de áudio para os participantes no Zoom.

Inicie a reprodução de música de fundo usando o botão na parte inferior esquerda, ou <kbd>ALT K</kbd>.

#### Transmitindo partes presenciais do Salão do Reino acima do Zoom

Nenhuma ação é necessária.

Vários ângulos da câmara/zoom podem ser escolhidos durante a reunião, usando o menu na parte inferior da janela de controlo de reprodução de multimédia M3; este menu irá conter uma lista de todas as cenas de exibição de câmara configuradas no OBS.

#### Compartilhar multimédia no Salão do Reino e Zoom

Encontre a multimédia que deseja compartilhar na janela de controlo de reprodução de multimédia do M3 e pressione o botão "reproduzir".

Quando terminar de compartilhar a multimédia, pressione o botão "parar" no M3. Observe que os vídeos param automaticamente após a sua conclusão.

#### Exibindo participantes do Zoom no Salão do Reino

Prima o botão "mostrar/ocultar exibição de multimédia" no canto inferior direito da tela do controlador de multimédia M³ ou <kbd>Alt Z</kbd>, to **ocultar** a janela de exibição de multimédia. A reunião Zoom será visível no(s) monitor(es) externo(s) do Salão do Reino

> Se o participante tiver multimédia a exibir, siga os passos sob a multimédia**de compartilhamento no Salão do Reino e Zoom** subtítulo.

Uma vez que o usuário termine sua parte, pressione o botão "ocultar/mostrar janela de exibição de multimédia" no canto inferior direito do controlo de multimédia M3, janela de reprodução de multimédia ou <kbd>Alt Z</kbd>, para **mostrar** a janela de exibição de multimédia. O monitor Salão do Reino agora mostrará o texto do ano.

### Realizar reuniões híbridas usando apenas M3 e Zoom

Se você não deseja usar o OBS Studio por qualquer motivo, as seguintes sugestões talvez o ajudem a organizar as coisas da forma mais simples possível.

#### Configuração inicial sem OBS: Computador do Salão do Reino

Mesmo que a secção correspondente acima. Com a adição do atalho de teclado global para Zoom para iniciar/parar o compartilhamento de tela (<kbd>ALT S</kbd>). A "câmara" será a fonte da câmara do Salão do Reino.

#### Configuração inicial sem OBS: M3

Habilita a Multimédia`presente num monitor externo ou numa janela separada`.

#### Iniciar a reunião sem OBS

Mesmo que a secção correspondente acima.

#### Transmitindo partes presenciais do Salão do Reino acima do Zoom sem OBS

Mesmo que a secção correspondente acima.

#### Compartilhar multimédia no Salão do Reino e Zoom sem OBS

Comece a compartilhar o Zoom ao pressionar<kbd>Alt S</kbd>. Na janela de compartilhamento de Zoom que aparece, escolha o monitor externo e ative as duas caixas de seleção na parte inferior esquerda (para otimização de som e vídeo). O texto do ano será agora compartilhado no Zoom.

Encontre a multimédia que deseja compartilhar na janela de controlo de reprodução de multimédia do M3 e pressione o botão "reproduzir".

Quando terminar de compartilhar a multimédia, pressione <kbd>Alt S</kbd> para finalizar o compartilhamento de tela do Zoom.

#### Exibir participantes do Zoom no Salão do Reino sem OBS

Mesmo que a secção correspondente acima.

### Capturas de tela do Modo de exibição

{% include screenshots/present-media.html lang=site.data.pt-pt %}

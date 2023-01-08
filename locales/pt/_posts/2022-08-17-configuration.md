---
tag: Configuração
title: Configurações
ref: configuration
---

A tela Configurações é dividida em 4 seções. A maioria das opções é autoexplicativa, mas aqui estão alguns detalhes adicionais.

### Configuração do programa

Configuração | Explicação
--- | ---
`Idioma do programa` | Define o idioma no qual M³ é exibido. <br> <br> Obrigado aos nossos muitos colaboradores por traduzir o aplicativo em tantos idiomas! Se você quiser ajudar a melhorar uma tradução existente ou adicionar uma nova, abra uma nova [discussão]({{site.github}}/discussions/new?category=translations&title=New+translation+in+LANGUAGE&body=I+would+like+to+help+to+translate+M%C2%B3+into+a+language+I+speak,+LANGUAGE) .
`Pasta para salvar as mídias` | A mídia da reunião será salva nesta pasta.
`Executar o programa após a inicialização do sistema` | Se ativado, o M³ será iniciado quando o usuário atual fizer login no computador. <br><br> ***Observação:** não está disponível no Linux.*
`Baixar as mídias ao abrir o programa` | Se estiver habilitada, essa opção irá baixar automaticamente as mídias da semana 5 segundos após a execução do M³. <br><br> *Para evitar que sejam baixadas as mídias quando essa configuração estiver habilitada, clique no botão ⏸ (pausa) antes que o temporizador de 5 segundos termine.*
`Abrir pasta após baixar as mídias` | Se essa opção estiver habilitada, a pasta que você escolheu para salvar as mídias será aberta no explorador de arquivos depois de baixar todas as mídias.
`Fechar o programa após baixar as mídias` | Se habilitada, essa opção fechará automaticamente o M³ 5 segundos após baixar as mídias. <br><br> *Para evitar que o M³ feche automaticamente quando esta configuração estiver habilitada, clique no botão 🏃 (pessoa saindo/correndo) antes que o temporizador de 5 segundos termine.*
`Habilitar compatibilidade com OBS Studio` | Se habilitada, essa opção entrará no OBS Studio para alterar as cenas automaticamente conforme necessário antes e depois de exibir as mídias. <br><br> _Se habilitar essa configuração, certifique-se de que o OBS Studio esteja configurado para usar o plugin `obs-websocket`, que permitirá que o M³ se comunique com o OBS Studio. <br><br> Além disso, configure todas as cenas necessárias para as mídias e exibição do palco no OBS. No mínimo, você precisará de uma cena com uma `Captura de janela` (recomendado) ou `Captura de tela` configurada para capturar a janela de exibição de mídia M³ ou a tela na qual a mídia será exibida. <br><br> Você também precisará configurar todas as cenas de visualização de palco desejadas, por exemplo: Uma cena da tribuna, Uma cena mostrando todo o palco, etc._
`Porta` | Porta em que o plug-in `obs-websocket` está configurado para se comunicar com o M³.
`Senha` | Senha criada nas configurações do plugin `obs-websocket`.
`Nome da cena de câmera do OBS Studio` | Selecione qual cena deve ser selecionada por padrão quando o modo de exibição de mídia é iniciado. Pode ser uma cena de câmera de todo o palco, ou apenas da tribuna.
`Nome da cena de mídia do OBS Studio` | Selecione qual cena está configurada no OBS Studio para capturar a tela de mídia do M³.
`Desativar a aceleração de hardware` | Habilite essa configuração apenas se estiver tendo problemas com o modo de exibição de mídia. Alterar esta configuração fará com que o M³ reinicie.

### Configuração do servidor da congregação

Consulte a seção [Configuração do servidor da congregação]({{page.lang}}/#congregation-sync) para obter detalhes sobre o que isso faz exatamente e como configurar.

### Configuração de mídia

Configuração | Explicação
--- | ---
`Idioma das mídias` | Selecione o idioma de sua congregação ou grupo. Todas as mídias serão baixadas do JW.org neste idioma.
`Resolução dos vídeos` | Os vídeos baixados do JW.org serão baixados nessa resolução ou na menor resolução disponível. Útil para situações de internet baixa ou limitada.
`Converter mídias para MP4` | Nessa opção serão convertidos automaticamente todos os arquivos de imagem e áudio para o formato MP4, para uso com o [player de compartilhamento nativo MP4](assets/img/other/zoom-mp4-share.png) do Zoom durante as reuniões **apenas pelo Zoom.**. Isso inclui todas as imagens e arquivos de mídia baixados do JW.org, bem como arquivos de mídia adicionais adicionados pelo usuário ou pelo Organizador de Videoconferência. <br><br> ***Observação:** essa opção é mais adequada para reuniões que são realizadas **apenas pelo Zoom**. Se estiver realizando reuniões **híbridas** ou **regulares**, tente usar o [Modo de exibição de mídia]({{page.lang}}/#present-media) ativando a opção `Exibir as mídias numa tela secundária` e desative essa opção .*
`Manter os arquivos de mídia originais após a conversão` | Se essa configuração estiver habilitada, os arquivos de imagem e áudio serão mantidos na pasta de mídia após a conversão para o formato MP4, em vez de serem excluídos. Isso resultará em uma pasta de mídia um pouco mais desordenada e geralmente não precisa ser ativada se compartilhar mídia por meio do compartilhamento Zoom MP4. (Veja a opção `Converter mídias para MP4` acima.) <br><br> _**Observação:** somente visível se a opção `Converter mídias para MP4` também estiver ativada._
`Exibir as mídias numa tela secundária` | Essa configuração permitirá que você use o M³ para exibir imagens, vídeos e arquivos de áudio durante as reuniões de sua congregação **híbridas** ou **presenciais**. para entrar nesse modo basta clicar no botão ▶️ (reproduzir) na tela principal do M³. <br><br> A tela de exibição de mídia usará automaticamente uma tela externa se estiver conectada; caso contrário, a mídia será exibida em uma janela separada que pode ser redimensionada. <br><br> _**Observação:** essa opção é mais adequada para reuniões congregacionais **híbridas** ou **regulares**. <br><br> Se estiver realizando reuniões **apenas pelo Zoom**, ative a opção `Converter mídias para MP4` para compartilhar as mídias pelo player nativo do Zoom._
`Imagem de fundo da tela secundária` | Por padrão, o M³ tentará buscar o texto do ano atual no idioma selecionado anteriormente, para exibi-lo em um fundo preto quando estiver no [Modo de exibição de mídia]({{page.lang}}/#present-media) e nenhuma outra mídia estiver sendo reproduzida. Se o M³ não conseguir buscar o texto do ano por algum motivo, ou se você desejar exibir uma imagem de fundo diferente, você pode usar o botão 'Selecionar' para escolher uma imagem personalizada ou o botão 'Atualizar' para tentar buscar o texto do ano automaticamente novamente. <br><br> ***Observação:** Se a [Configuração do servidor da congregação]({{page.lang}}/#congregation-sync) estiver preenchida, quando você selecionar uma imagem de fundo personalizada para a exibição de mídia, o M³ irá sincronizar automaticamente para todos que estejam conectados ao servidor da congregação no M³.*
`Criar lista de reprodução para usar no VLC` | Habilite isso se quiser gerar listas de reprodução para cada reunião automaticamente, que podem ser carregadas no VLC, se você estiver usando esse aplicativo para exibir mídia em vez do [Modo de exibição de mídia]({{page.lang}}/#present-media).
`Excluir todas as mídias da publicação th` | Se ativado, isso impedirá que as mídias da brochura *Melhore* apareça em todas as reuniões do meio da semana.
`Excluir imagens do livro lff fora do estudo bíblico de congregação` | Se ativado, as imagens do livro *Seja Feliz para Sempre* (*lff*) não serão incluídas nos arquivos de mídia, por exemplo, em partes de estudante na reunião do meio da semana.

### Configuração da reunião

Configuração | Explicação
--- | ---
`Reunião de meio de semana` | Selecione o dia e a hora da sua reunião do meio da semana; usado para nomeação de pastas e parar automáticamente os cânticos de fundo (veja abaixo).
`Reunião de fim de semana` | Escolha o dia e horário da sua reunião do fim de semana.
`Habilitar botão para reproduzir cânticos aleatoriamente` | Nessa opção o M³ mostra um botão na tela principal que ao clicado duas vezes vai reproduzir cânticos *sjjm*, aleatoriamente. Isso é útil, por exemplo, para reproduzir cânticos antes e depois das reuniões no Salão do Reino como música de fundo.
`Volume de reprodução dos cânticos` | Define o volume em que os cânticos de fundo serão reproduzidos.
`Parar a reprodução dos cânticos` | Se a opção `Habilitar botão para reproduzir cânticos aleatoriamente` estiver ativada, essa configuração permitirá que você especifique um atraso em que os cânticos de fundo devem ser interrompidos automaticamente. Isso pode ser: um determinado número de minutos, ou um número escolhido de segundos antes do início da reunião (no caso em que o cântico de fundo foi iniciado antes de uma reunião).

### Capturas de tela da tela de configurações

{% include screenshots/configuration.html lang=site.data.pt %}

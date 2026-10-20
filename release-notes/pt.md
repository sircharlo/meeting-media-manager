<!-- markdownlint-disable no-duplicate-heading -->

# Novidades

Para obter a lista completa das mudanças entre versões, consulte nosso arquivo CHANGELOG.md no GitHub.

## PRÓXIMA VERSÃO

### ✨ Novos Recursos

- ✨ **Sugestões de recursos**: De vez em quando, o M³ sugere um recurso que um perfil ainda não usa, em uma pequena janela "Você sabia?" que explica o que ele faz. Ele mostra no máximo uma sugestão cada vez que um perfil é aberto, nunca desde 15 minutos antes de uma reunião até o fim dela, e se lembra de cada resposta: "Lembre-me depois" manda a sugestão para o fim da fila, "Não, obrigado" a oculta de vez, e "Parar de sugerir recursos" desativa todas as sugestões para o perfil. Um "Não" no assistente de configuração inicial também conta, e as respostas podem ser redefinidas nas Configurações, em Avançado.

## v26.10.1

### ✨ Novos Recursos

- ✨ **Gerenciador de Reuniões do Zoom (beta, Windows)**: Uma nova integração que opera o Zoom por você em cada reunião. Ele pode abrir a reunião do Zoom da sua congregação quando os cânticos de fundo começam a tocar antes da reunião. Quando os cânticos param, pouco antes de a reunião começar, ele conecta o áudio do computador, ativa o microfone, ativa o vídeo do anfitrião e desativa o áudio de todos, sem permitir que eles o ativem. Quando os cânticos tocam antes ou depois de uma reunião, ele faz o contrário: desconecta o áudio do computador, desativa o vídeo do anfitrião e permite que todos ativem o áudio novamente (pedindo que façam isso). Ele também pode compartilhar automaticamente a janela de mídia no Zoom enquanto a mídia é exibida, garantindo que o que é compartilhado seja a janela de mídia e nunca outra coisa da sua tela. Um novo botão do Zoom na barra de ações mostra se uma janela de reunião do Zoom foi encontrada e permite executar essas etapas manualmente. Um assistente de configuração, oferecido quando você ativa a opção (no Windows, o assistente de configuração inicial agora o oferece no lugar do compartilhamento de tela por atalho de teclado) e disponível a qualquer momento pelo botão do Zoom ou nas Configurações, verifica o seu Zoom, aprende os nomes dos botões de microfone e câmera no seu idioma e testa cada etapa com você. Quando o M³ é iniciado, ele também verifica se tudo o que automatiza no Zoom funciona, abrindo a reunião se necessário nos dias de reunião, durante a hora e quinze minutos que antecedem o início (apenas olhando, sem pressionar nada, se já houver outras pessoas na reunião); se algo não funcionar, ele avisa você e pausa as automações do Zoom até ser reiniciado ou até uma nova verificação dar certo, para que nada dê errado durante a reunião. Essa verificação vem ativada por padrão e pode ser desativada nas Configurações. À medida que cada uma dessas etapas dá certo, os lembretes correspondentes nas listas de verificação de antes e de depois da reunião das ações rápidas da reunião são marcados para você, como concluídos automaticamente no Zoom. Como ele não pode ser usado junto com o compartilhamento de tela por atalho de teclado, as Configurações avisam isso na opção que estiver indisponível, indicando qual das duas desativar. Funciona em qualquer idioma do Zoom e não precisa de nada instalado além do próprio Zoom.

- ✨ **Temporizador da reunião**: Agora também é possível adicionar partes personalizadas nos dias de reunião, para informativos do Corpo Governante, programas especiais e qualquer outra coisa que não esteja na programação normal. Cada uma é cronometrada como qualquer outra parte, e o nome e a duração podem ser alterados no pop-up do temporizador ou na lista de partes.

- ✨ **Temporizador da reunião**: Acesso mais rápido ao temporizador. Ao passar o mouse sobre o botão do temporizador na barra de ações, agora aparece a parte que está sendo cronometrada, com os botões Iniciar, Pausar, Parar e Próxima parte, sem abrir o pop-up (uma configuração ativada por padrão). Uma nova configuração também mantém a lista completa de partes e os controles do temporizador em um painel fixado no lado direito da janela principal, sempre à vista.

- ✨ **Temporizador da reunião**: Um novo formato de contagem regressiva, "Relógio analógico com arco de tempo", mostra o tempo restante de uma parte como um setor no mostrador de um relógio analógico, do ponteiro dos minutos até o término previsto; assim, com uma só olhada, você vê a hora atual e quanto tempo falta. O tempo excedido aparece como um setor vermelho. Ele também funciona na contagem regressiva antes da reunião e no modo progressivo.

- ✨ **Temporizador da reunião**: A contagem regressiva antes da reunião agora tem o rótulo "A reunião começa em", e a tela do temporizador mostra o nome da parte que está sendo cronometrada, para que "4:59" não seja mais confundido com a hora atual.

- ✨ **Temporizador da reunião**: Os tempos registrados de cada dia podem ser apagados de uma só vez, depois de uma confirmação, no pop-up do temporizador ou no painel fixado.

- ✨ **Gerenciador de Reuniões do Zoom (beta, Windows)**: Um novo assistente de mãos levantadas. Durante uma reunião, o M³ observa a lista de participantes do Zoom em busca de mãos levantadas. Quando alguém levanta a mão, uma notificação no M³ permite que o operador ative o áudio desse participante com um clique e, quando ele terminar de falar, desative o áudio de novo e abaixe a mão dele com outro clique; o botão do Zoom na barra de ações lista as mãos levantadas com os mesmos botões. Cada ação é feita na linha desse participante no Zoom, pelo nome exato, e o M³ não mexe em ninguém quando dois participantes têm o mesmo nome. Se o temporizador da reunião estiver ativado, uma mão grande com o nome do participante também aparece na tela do temporizador para o presidente, e ela pode ser mostrada manualmente pelos pop-ups do temporizador ou do Zoom. O M³ aprende como o Zoom marca as mãos levantadas no seu idioma com um único botão (ele levanta e abaixa sua própria mão), que também é oferecido no assistente de configuração.

- ✨ **Temporizador da reunião**: Um novo temporizador remoto opcional. Quando ativado, o M³ disponibiliza uma cópia somente leitura da tela do temporizador como uma página web na rede local, para que um tablet ou celular na tribuna mostre ao orador o tempo restante sem que ele apareça na tela da congregação ou em um compartilhamento do Zoom. A página acompanha o temporizador em tempo real (partes, contagem regressiva antes da reunião, relógio, cores de tempo excedido, alerta de mão levantada), e todos os controles continuam no M³. Os endereços para abrir aparecem no pop-up do temporizador, com um botão para copiar.

- ✨ **Assistente de configuração inicial**: O assistente de configuração inicial agora pergunta se você guarda os arquivos das reuniões em um aplicativo de armazenamento em nuvem, como Dropbox, OneDrive, iCloud Drive ou Google Drive. Se for o caso, ele ajuda você a escolher uma pasta compartilhada lá e mostra como funciona: o M³ cria uma pasta para cada reunião futura, com a data da reunião no nome, e os arquivos colocados nela são adicionados automaticamente a essa reunião, em todos os computadores que usam a pasta.

## v26.9.0

### ✨ Novos Recursos

- ✨ **Ações rápidas antes/depois da reunião**: Um novo painel com botões grandes ajuda nos momentos que antecedem cada reunião e logo depois dela — uma contagem regressiva ao vivo, início/parada dos cânticos de fundo com um toque, início/parada da gravação e uma lista de verificação por congregação, agrupada em categorias e editável nas Configurações. O painel de antes da reunião se fecha automaticamente quando a reunião começa e a lista de verificação está completa (ou depois de um curto período de tolerância), e sempre pode ser fechado manualmente.

## v26.8.0

### ✨ Novos Recursos

- ✨ **Redesenho de todo o aplicativo**: Uma ampla renovação visual e de interação nas caixas de diálogo, na lista de mídia e no cabeçalho, nas Configurações e no assistente de configuração inicial. O assistente de configuração inicial agora mostra uma pergunta por tela, com uma barra de progresso. Todos os avisos foram substituídos por uma caixa de diálogo padronizada com a identidade visual do aplicativo, e a seleção de intervalos de páginas de PDF (nas importações de publicações e por arrastar e soltar) agora usa uma grade de miniaturas em vez de um campo de texto livre. Adicionado um novo tour de início rápido, que aparece depois que o assistente de configuração inicial é concluído. Também inclui um novo estilo para cartões e cabeçalhos, com sombras adaptadas ao modo escuro, e várias correções de contraste no modo escuro (rótulos de campos em foco, porcentagens do progresso de download).
- ✨ **Página de configurações**: Reorganizada em um layout de dois painéis, com uma nova seção "Preferências globais" para as opções de atualização automática e de atualizações beta, que saíram da caixa de diálogo "Sobre este aplicativo" (agora apenas informativa).
- ✨ **Botão "Adicionar mais mídia"**: Adicionada uma configuração para escolher exatamente quais seções da reunião mostram o botão de atalho "Adicionar mais mídia", além de uma configuração para um modo compacto (só com ícone).
- ✨ **Lista de mídia**: Agora os itens mostram um indicador de carregamento enquanto são adicionados, em vez de aparecerem vazios; os grupos de mídia mostram no selo a quantidade de itens ocultos (por exemplo, "9 itens (2 ocultos)"); os itens dentro de um grupo podem ser reordenados arrastando e soltando; e, em janelas muito estreitas, os itens se recolhem em chips compactos com dica de ferramenta, em vez de lotar a linha.

## v26.7.7

### ✨ Novos Recursos

- ✨ **Qualidade da pré-visualização de mídia**: A pré-visualização de mídia agora renderiza os quadros de vídeo via canvas com redução de escala de alta qualidade, corrigindo pré-visualizações serrilhadas ou borradas (principalmente em conteúdos com muito texto, como os cânticos). A pré-visualização também se desativa automaticamente se precisar corrigir repetidamente a dessincronização da reprodução em um mesmo vídeo, com uma opção para reativá-la com um clique.

## v26.7.6

### ✨ Novos Recursos

- ✨ **Exclusão de vídeos do Estudo bíblico de congregação**: Adicionada uma configuração para excluir vídeos de publicações específicas no Estudo bíblico de congregação (por padrão, o livro **Ande Corajosamente com Deus**), com um seletor de publicações pesquisável.
- ✨ **Números de página dos documentos**: As listas de Mídias de publicações e de importação de JWPUB agora mostram o número da página de cada documento (ou os números, quando há várias páginas) após o título. Isso pode ajudá-lo a encontrar rapidamente uma mídia específica quando você souber o número da página em que ela é encontrada.

## v26.7.4

### ✨ Novos Recursos

- ✨ **Recuperação de mídia ausente**: Itens de mídia cujo arquivo local sumiu (por exemplo, excluído pela limpeza automática do armazenamento local ou removido manualmente) agora mostram um botão de reprodução desativado, uma legenda "ausente" com o nome do arquivo a procurar e uma nova ação "Localizar arquivo" para vincular o item novamente a um arquivo no disco.
- ✨ **Aviso de compatibilidade**: Adicionado um banner, que pode ser dispensado, avisando os usuários de combinações de sistema operacional/arquitetura que em breve deixarão de ser suportadas (macOS 12 Monterey e Windows 32-bit) para que atualizem o sistema antes que futuras atualizações do aplicativo exijam um sistema mais recente.

## v26.7.0

### ✨ Novos Recursos

- ✨ **Reprodução de áudio vinculada**: Adicionado suporte para reproduzir áudio de um arquivo junto com vídeo de outro arquivo. Isso pode ser útil para reproduzir apresentações de slides em vídeo com música de acompanhamento.
- ✨ **Layout das mídias da pasta compartilhada**: Agora a ordem dos itens de mídia e das seções vindos das pastas compartilhadas é mantida. Isso garante que a lista de mídia seja exibida da mesma forma, mesmo quando a pasta compartilhada é sincronizada entre dispositivos.

## v26.6.1

### ✨ Novos Recursos

- ✨ **Pré-visualização de mídia**: Adicionada uma sobreposição com a pré-visualização ao vivo da mídia, que pode ser ativada ou desativada nas configurações ou no pop-up de exibição.
- ✨ **Pesquisar mídia**: Adicionada uma caixa de pesquisa rápida na lista de mídia que permite encontrar rapidamente a mídia pelo título. Para usá-la, basta usar o atalho de teclado padrão de pesquisa (Ctrl+F ou Cmd+F).
- ✨ **Filtrar configurações**: Adicionada uma caixa de filtro na página de configurações que permite encontrar configurações por palavra-chave ou categoria. Para usá-la, basta clicar no botão Procurar no canto superior direito da página de configurações ou usar o atalho de teclado padrão de pesquisa (Ctrl+F ou Cmd+F).
- ✨ **Aviso de sobreposição dos cânticos de fundo**: Adicionada uma notificação de aviso quando uma mídia é iniciada enquanto os cânticos de fundo estão tocando. Os usuários podem parar os cânticos de fundo pela própria notificação.

## v26.6.0

### ✨ Novos Recursos

- ✨ **Temporizador**: Adicionados modos de exibição analógica e o status do relatório de tempo.
- ✨ **Perfis**: Adicionadas a importação e a exportação das configurações do perfil nas configurações avançadas e no assistente de configuração inicial.
- ✨ **Janela de mídia**: Adicionado suporte para ocultar automaticamente a janela de mídia após a reprodução, quando ela estava oculta inicialmente. Isso é prático, por exemplo, quando um orador remoto quer mostrar imagens.

## v26.5.0

### ✨ Novos Recursos

- ✨ **Importação de PDF**: Adicionado um novo fluxo de importação de PDF à caixa de diálogo Mídias de publicações, que permite importar automaticamente a versão em PDF de uma publicação como imagens individuais, quando desejado.

## v26.4.8

### ✨ Novos Recursos

- ✨ **JW Stream**: Adicionado JW Stream à lista de sites que podem ser espelhados.

## v26.4.0

### ✨ Novos Recursos

- ✨ **Temporizador da reunião**: Foi adicionado um novo recurso de temporizador da reunião. É opcional e pode ser ativado nas configurações avançadas, se desejar. O temporizador pode ser usado para que o operador de mídia acompanhe o tempo gasto nas partes da reunião, ou para mostrar o tempo gasto na parte atual da reunião em uma tela dedicada, visível somente para o orador.

## v26.3.0

### ✨ Novos Recursos

- ✨ **Mídia da Celebração**: A obtenção automática da mídia da Celebração não está mais em beta! O aplicativo vai baixar automaticamente o vídeo de boas-vindas e a imagem da Celebração para exibir durante a Celebração, quando estiverem disponíveis no idioma configurado.
- ✨ **Velocidade de reprodução**: Adicionado o controle de velocidade de reprodução, com indicador visual e redefinição manual. Este recurso só é visível se ativado nas configurações avançadas.
- ✨ **Cânticos com pinyin**: Adicionada uma opção para substituir os cânticos por versões em pinyin nas reuniões realizadas em chinês.

## v26.2.0

### ✨ Novos Recursos

- ✨ **Verificação de espaço em disco**: Adicionada funcionalidade para monitorar e notificar quando o espaço em disco estiver baixo.

## v26.1.5

### ✨ Novos Recursos

- ✨ **Mídias da Celebração**: Baixar automaticamente banner e vídeo de introdução da Celebração nos idiomas suportados quando a data da Celebração for selecionada.

## v26.1.0

### ✨ Novos Recursos

- ✨ **Sincronização automática da programação das reuniões**: Adicionada a capacidade de sincronizar automaticamente as datas e horários das reuniões com o site oficial. Este recurso é habilitado por padrão e pode ser acionado manualmente ou desabilitado nas configurações avançadas.
- ✨ **Mudanças futuras na programação**: O aplicativo agora inclui mudanças futuras na programação ao criar uma congregação usando a pesquisa no site, se disponível.
- ✨ **Cache compartilhado para instalações em toda a máquina**: Instalações em toda a máquina agora compartilham uma pasta de dados comum por padrão, otimizando o uso de armazenamento e largura de banda entre vários usuários no mesmo computador.

## v25.12.2

### ✨ Novos Recursos

- ✨ **Botões de Zoom/Pan**: Adicionada a capacidade de pressionar e segurar os botões de zoom e pan para ajuste contínuo.

## v25.12.0

### ✨ Novos Recursos

- ✨ **Menu de contexto de seleção múltipla**: Adicionado suporte para ações do menu do botão direito quando vários itens de mídia são selecionados.
- ✨ **Atalhos de teclado**: Adicionados `Ctrl/Cmd+A` para selecionar todas as mídias, `H` para ocultar mídias selecionadas e `Shift+Seta para cima/baixo` para navegação de seleção por teclado.
- ✨ **Configurações de vídeos do Estudo de A Sentinela**: Adicionada uma configuração para excluir vídeos extras do Estudo de A Sentinela.
- ✨ **Seções recolhíveis**: Adicionada a capacidade de recolher seções em dias sem reunião para uma visualização mais limpa.
- ✨ **Site de Eventos TJ**: Adicionada a capacidade de apresentar o site de Eventos TJ além do site oficial principal.
- ✨ **Personalização de importação de lista de reprodução**: Permitida a capacidade de personalizar o prefixo que é adicionado aos itens de mídia ao importar listas de reprodução JW.
- ✨ **Navegação de espelhamento de site**: Adicionado um alternador para navegar automaticamente para a lista de mídias após o espelhamento do site ser interrompido.
- ✨ **Controles de gravação do OBS**: Adicionada a capacidade de controlar gravações do OBS.
- ✨ **Visualização do texto do ano**: Adicionada a capacidade de visualizar o texto do ano seguinte a partir de dezembro de cada ano.
- ✨ **Notificações de atualização**: Adicionadas notificações de aviso se estiver executando uma versão beta ou se as atualizações estiverem desabilitadas, e melhorado o display de progresso de download de atualização.
- ✨ **Configurações de aceleração de hardware**: Adicionada uma opção para desabilitar permanentemente a aceleração de hardware se necessário.

## v25.11.0

### ✨ Novos Recursos

- ✨ **Seleção de mídia JWPUB**: Adicionada uma maneira de selecionar mídias individuais de arquivos JWPUB.
- ✨ **Foco automático da janela de mídia**: Adicionada uma configuração opcional para focar automaticamente a janela de mídia após o compartilhamento de tela do Zoom.
- ✨ **Sobreposição de cursor para exibição em TV**: Aprimorada a sobreposição do cursor da janela do site para melhor visibilidade do cursor do mouse em exibições de TV.
- ✨ **Gravação de reunião**: Adicionado um novo recurso de gravação de reunião, para controlar um aplicativo de gravação externo.
- ✨ **Pesquisa no site**: Adicionada a capacidade de pesquisar mídias ou publicações no site usando pesquisa inteligente.
- ✨ **Importação manual fácil de publicações**: Adicionada a possibilidade de importar facilmente publicações do site oficial, como revistas, livros, programas e convites.
- ✨ **Melhorias em língua de sinais**: Adicionada confirmação antes de reproduzir arquivos inteiros para línguas de sinais e suporte para selecionar vários clipes, como para quando vários parágrafos devem ser lidos consecutivamente.
- ✨ **Navegação de clipes**: Adicionada exibição de duração aos itens da lista de clipes e melhorada a navegação de clipes.
- 🛠️ **Exibição de mídia**: Garantido que a exibição de mídia se torne visível quando a reprodução iniciar, mesmo que estivesse oculta antes.

## v25.10.1

### ✨ Novos Recursos

- ✨ **Assistente de configuração – Etapa do Zoom**: Adicionada uma etapa de integração com o Zoom ao assistente de configuração para configuração inicial mais fácil.
- ✨ **Seletor de tela**: Mostrar uma representação visual precisa de todas as telas, bem como o tamanho e a localização atual da janela principal no popup. Isso facilita a escolha da tela correta na qual a janela de mídia deve ser exibida.
- ✨ **Preferência de janela de mídia**: O aplicativo agora lembrará a tela preferida na qual a janela de mídia deve ser exibida, se especificado pelo usuário.

## v25.10.0

### ✨ Novos Recursos

- ✨ **Iniciar reprodução em pausa**: Adicionada uma nova configuração que permite iniciar a reprodução em pausa, o que pode ser útil para os operadores de áudio e vídeo prepararem tudo (por exemplo, iniciar o compartilhamento no Zoom) antes de a mídia começar a ser reproduzida na janela de mídia.
- ✨ **Notificações de atualização**: Agora os usuários serão avisados sobre atualizações por um banner no aplicativo, que também permite instalar as atualizações na hora, em vez de esperar o próximo reinício do aplicativo.
- ✨ **Eventos personalizados**: Adicionados hooks de eventos opcionais que podem acionar atalhos de teclado quando certos eventos são detectados. Isso pode ser útil para os operadores AV executarem automaticamente ações fora do aplicativo. Por exemplo, luzes inteligentes poderiam ser acesas e apagadas antes e depois da reprodução de mídia em auditórios onde se usam projetores; ou um script pode ser executado depois que o último cântico de uma reunião for reproduzido, para automatizar várias ações em uma reunião do Zoom.

## v25.9.1

### ✨ Novos Recursos

- ✨ **Janela de mídia sempre visível e comportamento em tela cheia**: Corrigido e melhorado o comportamento de "sempre visível" da janela de mídia, que agora se ajusta dinamicamente de acordo com o estado de tela cheia.
- ✨ **Configuração do formato de data**: Adicionada uma configuração para definir o formato de exibição das datas.
- ✨ **Transição cruzada de mídia**: Implementadas transições cruzadas (crossfade) na exibição de mídia, em vez da transição mais brusca com fade para preto usada antes.
- ✨ **Parada automática dos cânticos de fundo**: Otimizado o comportamento da parada automática dos cânticos de fundo, para funcionar da mesma forma quer os cânticos tenham sido iniciados automaticamente ou não
- ✨ **Clique em janelas inativas no macOS**: Ativado o clique direto na janela principal no macOS, o que deve facilitar o controle do aplicativo mesmo quando ele não está em foco.

## v25.9.0

### ✨ Novos Recursos

- ✨ **Melhoria no Pop-up de Downloads**: Adicionado botão de atualização e agrupamento de downloads por data no pop-up de download.
- ✨ **Memória da ordem de mídias assistidas**: adicionada a função de lembrar a ordem das seções para mídias já assistidas.

## v25.8.3

### ✨ Novos Recursos

- ✨ **Transições graduais da janela de mídia**: Adicionada uma nova configuração avançada para fazer a janela de mídia aparecer e desaparecer gradualmente, proporcionando transições visuais mais suaves.
- ✨ **Controle da duração das imagens e acompanhamento do progresso**: Adicionados o controle da duração das imagens e o acompanhamento do progresso para seções repetidas.

## v25.8.1

### ✨ Novos Recursos

- ✨ **Seções de mídia personalizadas**: Sistema completo para criar, editar e gerenciar seções de mídia personalizadas, com personalização de cores e reordenação por arrastar e soltar.
- ✨ **Divisores de mídia**: Adicione divisores com título nas listas de mídia para uma melhor organização, com opções de posicionamento no topo ou no final.
- ✨ **Modo de repetição de seção**: Ative a reprodução contínua em seções específicas para repetir mídias sem interrupções.
- ✨ **Integração com o Zoom**: Início e parada automáticos do compartilhamento de tela, coordenados com a reprodução de mídia.

## v25.7.0

### ✨ Novos Recursos

- Não há novos recursos para esta versão!

## 25.6.0

### ✨ Novos Recursos

- ✨ **Configuração de conexão limitada**: Adicionada uma nova configuração para reduzir o uso de largura de banda em conexões limitadas.
- ✨ **Melhoria no Manuseio de Mídia em Stream**: Melhor suporte para mídia transmitida, reduzindo problemas relacionados à latência.

## 25.5.0

### ✨ Novos Recursos

- **Opção de Atraso no OBS para Imagens**: Adiciona uma configuração no OBS Studio para atrasar a mudança de cena ao exibir imagens, melhorando as transições.
- **Compatibilidade com Áudio .m4a**: Adiciona compatibilidade com arquivos .m4a, ampliando os tipos de mídia aceitos.

## 25.4.0

### ✨ Novos Recursos

- 🇵🇭 **Novo idioma: Tagalo**: Suporte adicionado para Tagalo, expandindo as capacidades multilíngues do aplicativo.
- 🎞️ **Suporte para o Formato de Vídeo `.m4v`**: Agora suporta a reprodução de arquivos `.m4v` para melhorar a compatibilidade de mídia.

## 25.3.1

### ✨ Novos Recursos

- 🌏 **Novo Idioma: Coreano**: Adiciona suporte para o idioma coreano, expandindo a acessibilidade para mais usuários.

## 25.3.0

### ✨ Novos Recursos

- 🎵 **Reprodução de Música de Fundo com Vídeos**: Permite que a música de fundo continue reproduzindo enquanto os vídeos estão sendo exibidos.
- 🎥 **Transmissão de Câmera para Mídia de Língua de Sinais**: Adiciona a capacidade de exibir a transmissão de uma câmera na janela de mídia especificamente para usuários de língua de sinais.
- 📅 **Data da Celebração e Fundo de Tela Automáticos**: Detecta e configura automaticamente a data da Celebração e prepara a imagem de fundo da Celebração.
- 📜 **Exibição de Notas de Versão no Aplicativo**: Mostra notas de lançamento diretamente no aplicativo para que os usuários possam facilmente revisar as alterações após uma atualização.

## 25.2.1

### ✨ Novos Recursos

- 🔄 **Permitir tentativas de reconexão do OBS**: Introduzida a possibilidade de forçar manualmente a reconexão do OBS quando necessário.
- 🗑 **Limpeza automática de pastas de exportação antigas**: Remove automaticamente as pastas de datas de exportação desatualizadas para manter o armazenamento organizado.

## 25.2.0

### ✨ Novos Recursos

- 🌍 **Usar a localidade do sistema por padrão**: Detecta e usa automaticamente a localidade do sistema para uma experiência mais personalizada.
- 🏷 **Suporte a tags na mídia exportada**: Adiciona tags de metadados aos arquivos de mídia exportados para uma melhor organização.
- 🔄 **Downgrade automático de beta para estável**: Permite fazer o downgrade automático de versões beta para versões estáveis quando necessário.
- 🌐 **Extração dos índices de idioma MEPS mais recentes**: Obtém os índices de idioma MEPS mais recentes diretamente do site oficial, garantindo suporte atualizado aos idiomas.

## 25.1.0

### ✨ Novos Recursos

- 📅 **Abrir datas anteriores**: Permite abrir datas anteriores da semana atual, o que é útil quando o dia da reunião é mudado para mais tarde na semana.
- 🛑 **Banner de erro para o OBS Studio**: Adicionar um banner de erro quando o OBS Studio não estiver conectado em um dia de reunião, garantindo que os usuários sejam alertados.
- 📚 **Agrupar mídia por publicação**: Agrupa a mídia da mesma publicação referenciada para uma visão geral da mídia mais limpa e organizada.
- 🎵 **Aviso de cântico duplicado**: Mostra um aviso se algum cântico aparecer mais de uma vez na lista de mídia das reuniões do fim de semana.
- 🔄 **Planejamento de programações futuras**: Permite planejar mudanças futuras na programação das reuniões, o que é útil para as mudanças anuais de horário ou para a visita do superintendente de circuito a uma congregação vizinha.

## 24.11.0

### ✨ Novos Recursos

- 🖥️ **Apresentação de sites no macOS**: Agora é possível apresentar o site no macOS 🚀
- ⌨️ **Atalhos de teclado para reprodução**: Introduzidos atalhos de teclado para parar, pausar e retomar a reprodução de mídia 🚀
- 🌐 **Endereço personalizado para download de mídia**: Adicionado suporte para definir o endereço web a partir do qual a mídia deve ser baixada 🚀
- 🎬 **Seletor instantâneo de cenas do OBS**: Adicionado o seletor instantâneo de cenas do OBS Studio e reformulado o funcionamento do seletor de cenas nas configurações
- 📖 **Documentação em mais idiomas**: O site de documentação foi ampliado para oferecer suporte a mais idiomas

## 24.10.10

### ✨ Novos Recursos

- ⌨️ **Atalhos de navegação de mídia**: Adicionados atalhos de teclado para ir ao próximo item de mídia ou ao anterior
- 🖱️ **Menu de clique direito nos itens de mídia**: Adicionado um menu de clique direito aos itens de mídia para ocultá-los e renomeá-los
- ✂️ **Importação de listas de reprodução do JW Library com cortes**: Os tempos de corte dos vídeos agora são respeitados nas listas de reprodução do JW Library importadas

## 24.10.9

### ✨ Novos Recursos

- 🗑️ **Excluir mídias extras de um dia**: Adicionada uma opção para excluir todos os arquivos de mídia extras do dia selecionado

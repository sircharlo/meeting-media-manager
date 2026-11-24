# Política de privacidade {#privacy-policy}

Data de vigência: 24 de novembro de 2026

O Meeting Media Manager (M³) é um aplicativo gratuito e de código aberto feito por voluntários. Esta política explica com quais dados o M³ lida e para onde eles vão. Ela se aplica a todas as versões do M³: os instaladores e a versão portátil deste site, e as versões da Microsoft Store e da Snap Store.

**Em resumo:** o M³ não tem contas, nem anúncios, nem rastreadores de publicidade ou de marketing. Suas configurações e mídias ficam no seu computador. Para encontrar e corrigir problemas, o M³ envia dados de diagnóstico para os desenvolvedores dele: relatórios de erros e informações sobre cada sessão e sobre a velocidade com que o M³ funciona. O M³ deixa de fora desses dados o que poderia identificar você ou sua congregação, e seu endereço IP não é armazenado.

## O que fica no seu computador {#on-your-computer}

O M³ guarda o seguinte na pasta de dados dele, no seu computador:

- as configurações de cada congregação ou grupo, como nome, horário das reuniões, idioma e integrações;
- as mídias e publicações que ele baixa, e as mídias que você adiciona;
- a senha do OBS Studio, se você o usar. O M³ a criptografa com o armazenamento de senhas do seu sistema operacional quando esse armazenamento está disponível; quando não está, o M³ a armazena como texto simples e avisa você;
- as configurações da sua integração com o Zoom, se você a usar.

Os relatórios de erros incluem algumas dessas configurações (veja abaixo), mas nunca as que poderiam identificar você ou sua congregação.

Se você mostrar a imagem de uma câmera na janela de mídia (uma opção para congregações de língua de sinais), ela é apenas exibida: o M³ não a grava, não a salva nem a envia. A prévia da janela de mídia que o M³ mostra a você é capturada no seu computador e também não é salva nem enviada.

Você pode excluir tudo isso a qualquer momento excluindo a pasta de dados do M³. No Windows, desinstalar o M³ também a exclui. A versão da Snap Store a mantém quando você a desinstala, a menos que você peça o contrário (`snap remove --purge`).

## Dados de diagnóstico {#error-reports}

O M³ envia dados de diagnóstico ao [Sentry](https://sentry.io), o serviço que os desenvolvedores do M³ usam para encontrar e corrigir bugs.

**Relatórios de erros**, quando algo dá errado no M³. Um relatório pode conter:

- o erro e em que parte do código do M³ ele ocorreu;
- a versão do M³ e como você o instalou, seu sistema operacional e a versão dele, seu idioma e fuso horário, e informações básicas sobre seu hardware, como sua placa de vídeo;
- as etapas que levaram ao erro, como as páginas abertas no M³ e os arquivos que ele estava baixando;
- o estado do M³ naquele momento: as configurações dele e o que ele estava fazendo, como a mídia em reprodução ou a reunião que estava preparando;
- quando uma parte do M³ falha, um relatório de falha dessa parte, que pode incluir um trecho da memória dela no momento da falha.

**Informações da sessão**, sempre que o M³ é executado: quando ele foi iniciado e se foi encerrado normalmente ou falhou, com a versão do M³ e seu sistema operacional.

**Informações de desempenho**, em todas as sessões: quanto tempo as páginas do M³ levam para abrir e quanto tempo levam as solicitações dele aos servidores abaixo, com os respectivos endereços.

### O que o M³ deixa de fora {#left-out}

Antes de enviar os dados de diagnóstico, o M³ remove o que poderia identificar você ou sua congregação:

- o nome da congregação, o ID da reunião do Zoom dela e os nomes dos participantes do Zoom;
- o PIN das configurações e a senha do OBS Studio;
- os nomes das pastas e dos arquivos no seu computador: restam apenas a unidade ou a pasta de nível superior de uma pasta, e o tipo de um arquivo;
- o endereço na configuração "Endereço do site", quando não é o padrão;
- seu nome de usuário, nos caminhos de pastas dos relatórios dele.

Os dados não contêm nenhum nome, endereço de e-mail ou conta, já que o M³ não tem nada disso. O M³ pede ao Sentry que não registre seu endereço IP, e o Sentry está configurado para não armazená-lo.

Os mantenedores do M³ usam esses dados apenas para encontrar e corrigir problemas. O Sentry os armazena nos Estados Unidos e os exclui após um tempo limitado. A [política de privacidade do Sentry](https://sentry.io/privacy/) explica como ele os trata.

## Servidores aos quais o M³ se conecta {#connections}

Para fazer seu trabalho, o M³ se conecta aos servidores abaixo. Como acontece com qualquer site que você visita, esses servidores podem ver o endereço IP do seu computador.

- **O site oficial das Testemunhas de Jeová** e os servidores de download dele, para baixar as mídias das reuniões e as publicações, e as informações sobre elas. A própria política de privacidade desse site se aplica ao que ele recebe.
- **GitHub**, onde o M³ é publicado, para verificar se há atualizações do M³, baixá-las e mostrar o que há de novo nele. Já as versões da Microsoft Store e da Snap Store recebem as atualizações da respectiva loja.
- **jsDelivr**, para baixar as fontes de que alguns idiomas precisam e o componente que o M³ usa para ler arquivos PDF.
- **Apple, Cloudflare, icanhazip.com e ipify.org**, para verificar se o seu computador está conectado à internet.
- **Sentry**, para enviar os dados de diagnóstico descritos acima.

Se você os usar, o M³ também funciona com os seguintes, no seu computador ou na sua rede local:

- **Zoom:** o M³ controla o aplicativo Zoom no seu computador. O M³ em si não envia nada aos servidores do Zoom.
- **OBS Studio:** o M³ se conecta ao OBS Studio no seu computador ou na sua rede local.
- **O temporizador remoto:** o M³ executa um pequeno servidor web na sua rede local para que outro dispositivo possa mostrar o temporizador da reunião.

Quando você exibe o site oficial das Testemunhas de Jeová na janela do site do M³, ele funciona como em um navegador.

## Lojas de aplicativos {#stores}

Se você instalar o M³ pela Microsoft Store ou pela Snap Store, essa loja cuida da instalação e das atualizações do M³, de acordo com a própria política de privacidade. O M³ em si funciona da mesma forma em todas as versões.

## Alterações nesta política {#changes}

Se o M³ começar a lidar com os dados de outra forma, esta página será atualizada, com uma nova data no topo. O histórico dela está no [GitHub](https://github.com/sircharlo/meeting-media-manager/commits/master/docs/src/en/privacy.md).

## Dúvidas {#questions}

Se você tiver alguma dúvida sobre esta política ou sobre seus dados, [abra uma issue no GitHub](https://github.com/sircharlo/meeting-media-manager/issues).

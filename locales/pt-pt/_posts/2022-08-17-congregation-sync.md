---
tag: Configuração
title: Multimédia da congregação
ref: congregation-sync
---

O irmão designado como *responsável pelas videoconferências* (VO) pelo corpo de anciãos pode utilizar o M³ para gerir a multimédia disponibilizada à equipa de apoio técnico A/V da sua congregação.

O VO ou alguém designado por ele, pode:

- carregar **ficheiros multimédia adicionais** para serem exibidos durante uma reunião, por exemplo, para a visita do superintendente do circuito ou para discursos de oradores públicos
- **ocultar** multimédia do JW.org que não seja relevante para uma determinada reunião, por exemplo, quando uma parte da reunião foi alterada pela filial local.
- adicionar ou remover uma multimédia **recorrente**, como um vídeo do texto do ano, ou um ‘slide’ de anúncio

Todos os que estiverem sincronizados com a mesma congregação receberão os mesmos ficheiros multimédia quando clicarem no botão *Atualizar pastas multimédia*.

Tenha em atenção que a funcionalidade de sincronização da congregação é opcional e totalmente facultativa.

### Como funciona

O mecanismo de sincronização subjacente do M³ usa WebDAV. Isto significa que o VO (ou alguém sob a sua supervisão) também precisa:

- configurar um servidor seguro WebDAV que seja acessível pela web, **ou**
- usar um serviço de armazenamento de nuvem de terceiros que suporte o protocolo WebDAV (veja o endereço *Web* definido na secção *Configuração do servidor da congregação* abaixo).

Todos os utilizadores que pretendam ser sincronizados em conjunto terão de se ligar ao mesmo servidor WebDAV utilizando as informações de ligação e as credenciais que lhes foram fornecidas pelo seu VO.

### Configuração do servidor da congregação

| Definições                           | Explicação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Endereço web`                       | Endereço web do servidor WebDAV. É necessário um HTTP (HTTPS) seguro. <br><br> ***Nota:** O botão de endereço da Web, quando clicado, irá mostrar uma lista de provedores WebDAV conhecidos por serem compatíveis com M³, e irá preencher automaticamente certas configurações para esses provedores. <br><br> Essa lista é fornecida como uma cortesia, e não representa de forma alguma um endosso a qualquer serviço ou provedor em particular. O melhor servidor é sempre aquele que você possui...* |
| `Utilizador`                         | Nome de utilizador para o serviço WebDAV                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `Palavra-passe`                      | Palavra-passe para o serviço WebDAV. <br><br> ***Nota:** Como detalhadas nas suas respectivas páginas de suporte, uma senha específica para o aplicativo pode precisar ser criada para a [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) e [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) a fim de ativar as conexões WebDAV para os seus serviços.*                                                                             |
| `Caminho da pasta`                   | Esta é a pasta que será utilizada para sincronizar multimédia para todos os utilizadores da sincronização de congregação. Você pode digitar/colar num caminho ou usar o mouse para navegar para a pasta de destino. <br><br> ***Nota:** Certifique-se de que todas as congregações sincronizam os utilizadores com o mesmo caminho da pasta; caso contrário, a sincronização não funcionará conforme o esperado.*                                                                                                    |
| `Definições para toda a congregação` | Depois que o VO tiver configurado a configuração *de multimédia* e *configuração de reunião* seções, [configurações]({{page.lang}}/#configuration) no seu próprio computador, então ele pode usar este botão para impor certas configurações para todos os usuários de sincronização de congregação (por exemplo, dias de reunião, idioma da multimédia, configurações de conversão, etc. Isto significa que as definições selecionadas serão aplicadas à força a todos os utilizadores sincronizados sempre que abrirem o M³.   |

### Ao usar a sincronização de congregação para gerir multimédia

Uma vez concluída a configuração da sincronização de congregação, você está pronto para começar [a gerir a multimédia]({{page.lang}}/#manage-media) da equipa de suporte técnico de AV da sua congregação.

### Capturas de ecrã da sincronização de congregação em ação

{% include screenshots/congregation-sync.html lang=site.data.pt-pt %}

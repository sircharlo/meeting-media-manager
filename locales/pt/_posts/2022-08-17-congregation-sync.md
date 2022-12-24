---
tag: Configuration
title: Configuração do servidor da congregação
ref: congregation-sync
---

O irmão designado como *organizador de videoconferência* (OV) pelo corpo de anciãos pode usar o M³ para adicionar/remover as mídias que serão usadas para a equipe técnica da congregação.

O OV, ou alguém que foi designado por ele, pode:

- fazer upload de mídias **adicionais** para ser exibida ou compartilhada durante uma reunião, como na visita do superintendente de circuito ou para discursos públicos
- **ocultar** mídia do JW.org que não será usada numa reunião, por exemplo, quando uma parte for substítuida.
- adicionar ou remover mídia **recorrente**, como um vídeo de texto do ano ou slides

Todos os que estiverem sincronizados com o mesmo servidor da congregação receberão exatamente a mesma mídia quando clicarem no botão *Baixar mídias!*.

Observe que o recurso do servidor da congregação é totalmente opcional.

### Como funciona

O M³ usa o recurso de WebDAV para sincronizar arquivos com um servidor. Isso significa que o OV (ou alguém sob sua supervisão) precisa:

- configurar um servidor WebDAV seguro que seja acessível pela Web, **ou**
- usar um serviço de armazenamento em nuvem de terceiros que suporte o protocolo WebDAV (consulte a configuração Nome do host na seção *Configuração do servidor da congregação* abaixo).

Para sincronizar todos os computadores com o servidor WebDAV, todos precisam estar conectados no mesmo servidor, usando os dados de conexão por quem criou o servidor.

### Configuração do servidor da congregação

Configuração | Explicação
--- | ---
`Nome do host` | Endereço Web do servidor WebDAV. HTTP seguro (HTTPS) é necessário. <br><br> _**Observação:** Aqui tem um botão que, quando clicado, mostrará uma lista de provedores WebDAV que são conhecidos por serem compatíveis com M³ e preencherá automaticamente algumas configurações para esses provedores. <br><br> Esta lista é fornecida como ajuda e de forma alguma representa um patrocínio de qualquer serviço ou provedor em particular. O melhor servidor é sempre aquele que você tem..._
`Usuário` | Nome de usuário para o serviço WebDAV.
`Senha` | Senha para o serviço WebDAV. <br><br> ***Observação:** conforme detalhado em suas respectivas páginas de suporte, pode ser necessário criar uma senha específica do aplicativo para os serviços [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) e [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) para habilitar conexões WebDAV com eles.*
`Caminho da pasta` | Esta é a pasta que será usada para baixar a mídia para todos os usuários do servidor da congregação. Você pode digitar/colar um caminho ou usar o mouse para navegar até a pasta de destino. <br><br> ***Observação:** certifique-se de que todos os usuários que usarão o servidor configurado insiram o mesmo caminho de pasta; caso contrário, a sincronização não funcionará conforme o esperado.*
`Configurações para todos da congregação` | Uma vez que o OV tenha configurado as seções *Configuração de mídia* e *Configuração da reunião* nas [Configurações](%7B%7Bpage.lang%7D%7D/#configuration) em seu próprio computador, ele pode então usar este botão para bloquear algumas configurações para todos os usuários que utilizarem o mesmo servidor em seus computadores. (por exemplo, dias de reunião, idioma de mídia, configurações de conversão e assim por diante). Isso significa que as configurações selecionadas serão bloqueadas para todos os usuários sincronizados toda vez que abrirem o M³.

### Usando o servidor da congregação para escolher a mídia

Quando a configuração de sincronização da congregação estiver concluída, você estará pronto para [Gerenciar Mídia](%7B%7Bpage.lang%7D%7D/#manage-media) para a equipe de áudio e vídeo da sua congregação.

### Captura da configuração do servidor da congregação

{% include screenshots/congregation-sync.html lang=site.data.pt %}

---
tag: Configuração
title: Mídia da congregação
ref: congregation-sync
---

O irmão designado como *organizador de videoconferência* (OV) pelo corpo de anciãos pode usar o M³ para adicionar/remover as mídias que serão usadas pela equipe técnica da congregação.

O OV, ou alguém que foi designado por ele, pode:

- enviar mídias **adicionais** para serem exibidas ou compartilhadas durante uma reunião, como na visita do superintendente de circuito ou para discursos públicos
- **ocultar** as mídias do JW.org que não serão usadas numa reunião, por exemplo, quando uma parte for substituída
- adicionar ou remover mídias **recorrentes**, como um vídeo de texto do ano ou slides

Todos os que estiverem sincronizados com o mesmo servidor da congregação receberão exatamente a mesma mídia quando clicarem no botão *Baixar mídias!*.

Observe que o recurso do servidor da congregação é totalmente opcional.

### Como funciona

O M³ usa o recurso de WebDAV para sincronizar arquivos com um servidor. Isso significa que o OV (ou alguém sob sua supervisão) precisa:

- configurar um servidor WebDAV seguro que seja acessível pela Web, **ou**
- usar um serviço de armazenamento em nuvem de terceiros que suporte o protocolo WebDAV (consulte a configuração *Nome do host* na seção *Configuração do servidor da congregação* abaixo).

Para sincronizar todos os computadores com o servidor WebDAV, todos precisam estar conectados no mesmo servidor, usando os dados de conexão por quem criou o servidor.

### Configuração do servidor da congregação

| Configuração | Explicação |
| --- | --- |
| `Endereço Web` | Endereço Web do servidor WebDAV. HTTP seguro (HTTPS) é necessário. <br><br> ***Observação:** Aqui tem um botão que, quando clicado, mostrará uma lista de provedores WebDAV conhecidos por serem compatíveis com o M³. Isso preencherá automaticamente algumas configurações para eles. <br><br> Esta lista é fornecida como ajuda e de forma alguma representa um patrocínio de qualquer serviço ou provedor em particular. O melhor servidor é sempre aquele que você tem...* |
| `Usuário` | Nome de usuário para o serviço WebDAV. |
| `Senha` | Senha para o serviço WebDAV. <br><br> ***Observação:** conforme detalhado em suas respectivas páginas de suporte, pode ser necessário criar uma senha específica para os serviços [Box](https://support.box.com/hc/en-us/articles/360043696414-WebDAV-with-Box) e [Koofr](https://koofr.eu/help/koofr_with_webdav/how-do-i-connect-a-service-to-koofr-through-webdav/) para habilitar conexões WebDAV com eles.* |
| `Caminho da pasta` | Esta é a pasta que será usada para baixar a mídia para todos os usuários do servidor da congregação. Você pode digitar/colar um caminho ou usar o mouse para navegar até a pasta de destino. <br><br> ***Observação:** certifique-se de que todos os usuários que usarão o servidor configurado insiram o mesmo caminho de pasta; caso contrário, a sincronização não funcionará conforme o esperado.* |
| `Configurações para todos da congregação` | Uma vez que o OV tenha configurado as seções *Configuração de mídia* e *Configuração da reunião* nas [Configurações]({{page.lang}}/#configuration) em seu próprio computador, ele pode então usar este botão para bloquear algumas configurações para todos os usuários que utilizarem o mesmo servidor em seus computadores. Isso significa que as configurações selecionadas serão bloqueadas para todos os usuários sincronizados toda vez que abrirem o M³. |

### Usando o servidor da congregação para escolher a mídia

Quando a configuração de sincronização da congregação estiver concluída, você estará pronto para [Gerenciar Mídia]({{page.lang}}/#manage-media) para a equipe de áudio e vídeo da sua congregação.

### Capturas de tela do servidor da congregação

{% include screenshots/congregation-sync.html lang=site.data.pt %}

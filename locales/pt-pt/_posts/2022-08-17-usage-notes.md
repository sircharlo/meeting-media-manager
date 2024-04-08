---
tag: Ajuda
title: Notas de uso técnico
ref: usage-notes
---

A aplicação deve ser executada como está nos computadores mais modernos em execução de Windows, Linux ou macOS.

### Windows: Instalação e primeira inicialização

Ao abrir o instalador, você pode receber um [erro](assets/img/other/win-smartscreen.png) indicando que o "Windows SmartScreen impediu o início de um aplicativo não reconhecido". Isso deve-se ao fato de a ‘app’ não ter um número elevado de downloads, e consequentemente não ser explicitamente "confiável" pelo Windows. Para contornar isso, basta clicar em "Mais informações", depois em "Executar mesmo assim".

### Linux: Instalação e primeira inicialização

De acordo com a documentação [oficial AppImage](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), se o aplicativo não abrir corretamente, confirme a saída do seguinte comando:

`sysctl kernel.unprivileged_userns_clone`

Se a saída for `0`, então o AppImage **não** será executado a menos que você execute o seguinte comando, seguido por uma reinicialização:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Certifique-se de ler [o que isso implica ](https://lwn.net/Articles/673597/) antes de fazer isso.

### macOS: Instalação e primeira inicialização

Se ao iniciar o aplicativo, você recebe um aviso de que o app não pode ser aberto, ou porque "não foi descarregado da App Store" ou porque "o desenvolvedor não pode ser verificado", então esta [página de suporte da Apple](https://support.apple.com/en-ca/HT202491) irá ajudá-lo a passar por isso.

Se você receber uma mensagem indicando que você não tem permissão para abrir o aplicativo", então tente algumas soluções de [esta página](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860), por exemplo, executando o seguinte comando em `Terminal. pp`:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Problemas com permissões de áudio ou microfone no macOS Sonoma

Com o macOS Sonoma, alguns utilizadores podem encontrar um problema em que o M3 fornece repetidamente uma mensagem de erro indicando que ele precisa de acesso ao microfone. Executar o seguinte comando em `Terminal.app` resolveu o problema para alguns:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Atualização automática

Ao contrário do Windows e do Linux, a funcionalidade de atualização automática não é **nem** implementada no macOS, e, por razões técnicas, provavelmente nunca será. No entanto, uma das duas coisas vai acontecer aos utilizadores do macOS quando uma atualização estiver disponível:

- O M³ irá tentar descarregar o pacote de atualização e abri-lo automaticamente, após o qual o utilizador terá que completar a instalação manualmente da atualização M3, arrastando e largando o aplicativo atualizado na sua pasta Aplicativos. Em seguida, eles poderão iniciar o M³ recém-atualizado a partir da sua pasta Aplicativos como habitual.
- Se o passo anterior falhar em alguma fase, O M³ mostrará uma notificação persistente, indicando que uma atualização está disponível, com um link para a própria atualização. Uma notificação vermelha e pulsante também será exibida no botão de definições na tela principal do M³. O número de versão M3 na tela de definições vai tornar-se um botão que, depois de clicado, abre a página de download da última versão automaticamente.

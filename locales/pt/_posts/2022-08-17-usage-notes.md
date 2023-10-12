---
tag: Ajuda
title: Instalação e atualização
ref: usage-notes
---

O aplicativo funciona nos sistemas operacionais Windows, Linux ou Mac.

### Windows: Instalação e primeira execução

Ao abrir o instalador, pode aparecer um [erro](assets/img/other/win-smartscreen.png) indicando que "O Windows SmartScreen impediu que um aplicativo não reconhecido fosse iniciado". Isso ocorre porque o aplicativo não possui um número alto de downloads e, consequentemente, não é "confiável" pelo Windows. Para resolver isso, basta clicar em "Mais informações" e depois em "Executar assim mesmo".

### Linux: Instalação e primeira execução

De acordo com a [documentação oficial do AppImage](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html), se o aplicativo não abrir corretamente, confirme a saída do seguinte comando:

`sysctl kernel.unprivileged_userns_clone`

Se a saída for `0`, o AppImage **não** será executado, a menos que você execute o seguinte comando, seguido de uma reinicialização:

`echo kernel.unprivileged_userns_clone = 1 | sudo tee /etc/sysctl.d/00-local-userns.conf`

Certifique-se de ler [o que isso implica](https://lwn.net/Articles/673597/) antes de fazer isso.

### macOS: Instalação e primeira execução

Se ao iniciar o aplicativo, você receber um aviso de que o aplicativo não pode ser aberto, seja porque "não foi baixado da App Store" ou porque "o desenvolvedor não pode ser verificado", esta [página de suporte da Apple](https://support.apple.com/en-ca/HT202491) ajudará você.

If you get a message indicating that you "do not have permission to open the application", then try some solutions from [this page](https://stackoverflow.com/questions/64842819/cant-run-app-because-of-permission-in-big-sur/64895860), for example running the following command in `Terminal.app`:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Issues with audio or microphone permissions in macOS Sonoma

Since macOS Sonoma, some users might encounter an issue where M³ repeatedly gives an error message indicating that it needs access to the microphone. Executing the following command in `Terminal.app` has resolved the issue for some:

`codesign --force --deep --sign - "/path/to/Meeting Media Manager.app"`

### macOS: Atualização automática

Ao contrário do Windows e do Linux, a funcionalidade de atualização automática **não é** implementada no macOS e, por motivos técnicos, provavelmente nunca será. No entanto, pode acontecer isso aos usuários do macOS quando uma atualização estiver disponível:

- O M³ tentará baixar o arquivo de atualização e abri-lo automaticamente, após isso o usuário terá que concluir manualmente a instalação da atualização do M³ arrastando e soltando o aplicativo atualizado na pasta Aplicativos. Em seguida, você pode iniciar o M³ atualizado na sua pasta Aplicativos, como de costume.
- Se isso não funcionar, o M³ exibirá uma notificação indicando que uma atualização está disponível, com um link para a atualização. Uma notificação vermelha também será exibida no botão de configurações na tela principal do M³. Você também pode clicar no botão do número da versão do M³ na tela de configurações, nele vai abrir a página para você baixar a última versão.

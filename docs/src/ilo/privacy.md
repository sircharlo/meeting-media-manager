# Privacy policy {#privacy-policy}

Effective date: November 22, 2026

Meeting Media Manager (M³) is a free, open-source app made by volunteers. This policy explains what data M³ handles and where it goes. It applies to every version of M³: the installers and portable version from this website, and the versions in the Microsoft Store, the Snap Store and Flathub.

**In short:** M³ has no accounts, no ads, and no advertising or marketing trackers. Your settings and media stay on your computer. To find and fix problems, M³ sends its developers diagnostic data: error reports, and information about each session and about how fast M³ runs. M³ leaves out of it what could identify you or your congregation, and your IP address isn't stored.

## What stays on your computer {#on-your-computer}

M³ keeps the following in its data folder on your computer:

- the settings of each congregation or group, such as its name, meeting schedule, language and integrations;
- the media and publications it downloads, and the media you add;
- the password for OBS Studio, if you use it. M³ encrypts it with your operating system's password storage when it's available; when it isn't, M³ stores it as plain text and tells you so;
- your Zoom integration settings, if you use it.

Error reports include some of these settings (see below), but never the ones that could identify you or your congregation.

If you show a camera's feed on the media window (an option for sign-language congregations), it's only displayed: M³ doesn't record, save or send it. The preview of the media window that M³ shows you is captured on your computer and isn't saved or sent either.

You can delete all of this at any time by deleting M³'s data folder. On Windows, uninstalling M³ deletes it too. The Snap Store and Flathub versions keep it when you uninstall them, unless you ask them not to (`snap remove --purge`, or `flatpak uninstall --delete-data`).

## Diagnostic data {#error-reports}

M³ sends diagnostic data to [Sentry](https://sentry.io), the service its developers use to find and fix bugs.

**Error reports**, when something goes wrong in M³. A report can contain:

- the error, and where in M³'s code it happened;
- M³'s version, your operating system and its version, your language and time zone, and basic information about your hardware, such as your graphics card;
- the steps that led up to the error, such as the pages opened in M³ and the files it was downloading;
- M³'s state at the time: its settings, and what it was doing, such as the media playing or the meeting it was preparing;
- when part of M³ crashes, a crash report of that part, which can include some of its memory at the moment of the crash.

**Session information**, each time M³ runs: when it started and whether it ended normally or crashed, with M³'s version and your operating system.

**Performance information**, in every session: how long M³'s pages take to open, and how long its requests to the servers below take, with their addresses.

### What M³ leaves out {#left-out}

Before sending its diagnostic data, M³ removes what could identify you or your congregation:

- the congregation's name, its Zoom meeting ID, and the names of Zoom participants;
- the settings PIN and the OBS Studio password;
- the names of the folders and files on your computer: only a folder's drive or top folder, and a file's type, remain;
- the address in the Website setting, when it isn't the default one;
- your user name, in the folder paths of its reports.

The data contains no name, email address or account, since M³ has none of these. M³ asks Sentry not to record your IP address, and Sentry is set not to store it.

M³'s maintainers use this data only to find and fix problems. Sentry stores it in the United States and deletes it after a limited time. [Sentry's privacy policy](https://sentry.io/privacy/) explains how it handles it.

## Servers M³ connects to {#connections}

To do its job, M³ connects to the servers below. As with any website you visit, these servers can see your computer's IP address.

- **The official website of Jehovah's Witnesses** and its download servers, to download meeting media and publications, and their information. That website's own privacy policy applies to what it receives.
- **GitHub**, where M³ is published, to check for and download updates of M³ and to show what's new in it. The Microsoft Store, Snap Store and Flathub versions get their updates from their store instead.
- **jsDelivr**, to download the fonts some languages need, and the component M³ uses to read PDF files.
- **Apple, Cloudflare, icanhazip.com and ipify.org**, to check whether your computer is connected to the internet.
- **Sentry**, to send the diagnostic data above.

If you use them, M³ also works with these, on your computer or your local network:

- **Zoom:** M³ controls the Zoom app on your computer. It doesn't send anything to Zoom's servers itself.
- **OBS Studio:** M³ connects to OBS Studio on your computer or local network.
- **The timer remote:** M³ runs a small web server on your local network, so another device can show the meeting timer.

When you display the official website of Jehovah's Witnesses in M³'s website window, it works as it does in a web browser.

## Stores {#stores}

If you install M³ from the Microsoft Store, the Snap Store or Flathub, that store handles its installation and updates, under its own privacy policy. M³ itself works the same way in every version.

## Changes to this policy {#changes}

If M³ starts handling data differently, this page will be updated, with a new date at the top. Its history is on [GitHub](https://github.com/sircharlo/meeting-media-manager/commits/master/docs/src/en/privacy.md).

## Questions {#questions}

If you have a question about this policy or about your data, [open an issue on GitHub](https://github.com/sircharlo/meeting-media-manager/issues).

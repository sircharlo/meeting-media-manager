# Using M³ at a Kingdom Hall

This guide will walk you through the process of downloading, installing, and setting up **Meeting Media Manager (M³)** at a Kingdom Hall. Follow the steps to ensure a smooth setup for managing media during congregation meetings.

## 1. Download and install

1. Visit the [M³ download page](https://github.com/sircharlo/meeting-media-manager/releases/latest) and choose the appropriate version for your system (Windows, macOS, or Linux).
2. Once the download is complete, open the installer and follow the on-screen instructions to install M³.
3. After installation, launch M³ to begin the setup process.

## 2. Configuration wizard

### App display language

- When launching M³ for the first time, you will be prompted to choose your preferred **display language**.
- Select the language you want M³ to use for its interface, keeping in mind that media downloads can be set for other languages later.

### Profile type

- The next step is to choose a **profile type**.
- For a regular Kingdom Hall setup, choose **Regular**. This will configure many features that are commonly used for congregation meetings.

> You should only choose **Other** if you are creating a profile for which no media should be automatically downloaded. Media will have to be manually imported for use in this profile. This type of profile is used mostly to use M³ during theocratic schools, assemblies, conventions and other special events. **For normal use during congregation meetings, choose _Regular_.**

### Automatic congregation lookup

- M³ can attempt to automatically find your congregation's meeting schedule, language, and formatted name using publicly available data from the official website of Jehovah's Witnesses.
- To do so, use the **Congregation Lookup** feature and enter at least part of the congregation's name and city.
- Once the correct congregation is found and selected, M³ will prefill all available information, such as your congregation's **name**, **meeting language**, and **meeting days and times**.

### Manual entry of congregation information

- If the automated lookup did not find your congregation, you can of course manually enter the required information.
- The wizard will allow you to review and/or enter your congregation's **name**, **meeting language**, and **meeting days and times**.

### Caching videos from the songbook

- You will be given the option to **cache all videos from the songbook**.
  This option pre-downloads all the songbook videos, reducing the time it takes to fetch media for meetings in the future.
  - **Pros:** Meeting media will be available much faster.
  - **Cons:** The size of the media cache will increase significantly, by approximately 5GB.
- If your Kingdom Hall has sufficient storage space, it’s recommended to enable this option for efficiency and perceived performance.

### OBS Studio Integration Configuration (Optional)

- If your Kingdom Hall uses **OBS Studio** for broadcasting hybrid meetings over Zoom, M³ can automatically integrate with that program.
- During setup, you can configure the integration with OBS Studio by entering the following:
  - **Port:** The port number used to connect to the OBS Studio Websocket plugin.
  - **Password:** The password used to connect to the OBS Studio Websocket plugin.
  - **Scenes:** The OBS scenes that will be used during media presentations. You'll need one scene that captures the media window or screen, and one that shows the stage.
- If your congregation regularly conducts hybrid meetings, it's **highly** recommended to enable the integration with OBS Studio.

## 3. Enjoy using M³

Once the setup wizard is complete, M³ is ready to help manage and present media for congregation meetings. Enjoy using the app!

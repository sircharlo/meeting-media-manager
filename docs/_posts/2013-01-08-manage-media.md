---
category: Usage
title: 'Managing media'
layout: null
---


If either `Offer to import additional media` or [congregation sync](#/congregation-sync) are enabled, then the media management screen will allow the user to add or remove media for any given meeting, as well as manage recurring media, if congregation sync is active.

### Launching the media management screen

There are two ways of getting to the media management screen.

- If `Offer to import additional media` is enabled, the media management screen will appear after clicking *Get media!*. Changes made will be local, on your computer only.

- If [congregation sync](#/congregation-sync) is enabled, click the ☁️ (cloud) button on the main screen of JWMMF to get to the media management screen. Changes made here will be synchronized with all congregation sync users.

<blockquote>To get the latest version of a meeting's media, as well as any changes or additions made by the VO, congregation sync users can click on the <em>Get media!</em> button on the main screen. The sync can be done as many times as necessary.</blockquote>


### Adding media

Here's how to **add** media from the media management screen.


| Option  | Explanation |
| ------------- | ------------- |
| `Target meeting`  | Choose the meeting for which you'd like to manage media. <br><br>If congregation sync is active, you'll also have a "Recurring" option, to manage recurring media.<br><br>After making a selection, the `media list` shows up. |
| `Type of upload`  | To add a file, you'll need to choose from one of the 3 `media types`. (See below.) |
| `Media to add`  | This will show either a menu or a file selection field, depending on the `media type` chosen. (See below) |
| `Filename prefix`  | Up to 6 digits can be added before the media filename(s), to help with sorting. |
| `Media list` | This shows the currently planned media for the active target meeting. |


In the `Media to add` field, you'll be presented with different options, depending on the media type selected.

| `Media type` selected | The `Media to add` field will... |
| ------------- | ------------- |
| `Song` | ... show a menu with all Kingdom song videos from the *sjjm* series, in the media language. Choose this option to add a song for the public talk, or for circuit overseer visits. <br><br>The selected song will be automatically downloaded from JW.org, in the congregation's language as configured in the [settings](#/configuration). |
| `JWPUB` | ... allow you to browse to (or drag and drop) a JWPUB file. <br><br>You'll then be prompted to select the section, or chapter, from which you'd like to add media. This will add both embedded and referenced media from that section in the JWPUB file. <br><br>An example of a commonly used JWPUB file is the S-34, but any JWPUB file can be used here. |
| `Custom` | ... allow you to browse to (or drag and drop) any other media file(s) from your computer.  <br><br>Note that all PDF and SVG files will automatically be converted into high-resolution images by JWMMF. |


### Removing or hiding media

To **hide** or **remove** media, simply select a target meeting, find the media file you don't want, and click on the relevant icon to delete or hide it.

|  | Media has a red 🟥 (delete) icon | Media has a ☑️ (checked checkbox) icon | Media has a 🔲 (unchecked checkbox) icon |
| ------------- | ------------- | | |
| `Offer to import additional media` is enabled | The media file was added to the meeting's media by you. <br><br>Click on the red 🟥 (delete) icon to delete the file from your computer. <br>Click a second time to confirm. | The media file is referenced in the meeting's material. <br><br>It *will* be downloaded from JW.org or extracted from the relevant publication. | The media file was referenced in the meeting's material. <br><br>It was hidden by you, so it *will not* be downloaded or added to the meeting's media. |
| [Congregation sync](#/congregation-sync) is active | The media file was added to congregation sync by the VO. <br><br>Click on the red 🟥 (delete) icon to delete the file from congregation sync. <br>Click a second time to confirm. | The media file is referenced in the meeting's material. <br><br>It *will* be downloaded from JW.org or extracted from the relevant publication, for every congregation sync user that fetches that meeting's media.  | The media file was referenced in the meeting's material. <br><br>It was hidden by the VO, so it *will not* be downloaded or added to the meeting's media, for any congregation sync user.  |

---
tag: Usage
title: Managing media
ref: manage-media
---

The media management screen allows the user to add or remove media for any given meeting, manage recurring media, and even add special media for other dates on which no meeting is normally scheduled.

### Managing media for any particular day

To manage media for a certain meeting or day, simply click on that day's tile on the main screen of M³. To manage media that be repeated at every meeting, click on the Recurring media tile.

### Adding media

Here's how to **add** media from the media management screen.

| Option            | Explanation                                                                     |
| ----------------- | ------------------------------------------------------------------------------- |
| `Type of upload`  | Choose from one of the 3 `media types` (see below).                             |
| `Media to add`    | Depends on the `media type` chosen (see below).                                 |
| `Filename prefix` | Up to 6 digits can be added before the media filename(s), to help with sorting. |
| `Media list`      | This shows the currently planned media for the selected date tile.              |

In the `Media to add` field, you'll be presented with different options, depending on the media type selected.

| `Media type` | The `Media to add` field                                                                                                                                                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Song`       | ... shows a menu with all Kingdom song videos from the *sjjm* series, in the media language. Choose this option for example to add a song for the public talk, or for circuit overseer visits. <br><br> The selected song will be automatically downloaded from JW.org, in the congregation or group's language, as configured in the [Settings]({{page.lang}}/#configuration). |
| `JWPUB`      | ... allows you to browse to (or drag and drop) a JWPUB file. <br><br> You'll then be prompted to select the section, or chapter, from which you'd like to add media. This will add both embedded and referenced media from that section in the JWPUB file. <br><br> An example of a commonly used JWPUB file is the S-34, but any JWPUB file can be used here.      |
| `Your own`   | ... allows you to browse to (or drag and drop) any other media file(s) from your computer. <br><br> *Note that all PDF and SVG files will automatically be converted into high-resolution images by M³.*                                                                                                                                                                        |
| `JW.ORG`     | ... allows you to select a video from the latest featured videos on JW.org.                                                                                                                                                                                                                                                                                                                 |

### Removing, hiding and showing media

To **remove**, **hide**, or **show** media, simply find the media file you don't want, and click on the relevant icon.

| A red 🟥 (delete) icon                                          | A ☑️ (checked checkbox) icon                                                                                                                                 | A 🔲 (unchecked checkbox) icon                                                                                                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The media file was added to that day's media by you or the VO. | The media file is referenced in the meeting's material. <br><br> It *will* be downloaded from JW.org or extracted from the relevant publication. | The media file is referenced in the meeting's material. <br><br> It was hidden by you or the VO, so it *will not* be downloaded or added to the meeting's media. |

### Screenshots of the media management screen

{% include screenshots/manage-media.html lang=site.data.wes-x-pgw %}

---
tag: Usage
title: 'Managing media'
ref: manage-media
---


The media management screen allows the user to add or remove media for any given meeting, manage recurring media, and even add special media for other dates on which no meeting is normally scheduled.

### Managing media for any particular day

To manage media for a certain meeting or day, simply click on that day's tile on the main screen of M³. To manage media that be repeated at every meeting, click on the Recurring media tile

### Adding media

Here's how to **add** media from the media management screen.

| Option            | Explanation                                                                     |
| ----------------- | ------------------------------------------------------------------------------- |
| `Type of upload`  | Choose from one of the 3 `media types`. (See below.)                            |
| `Media to add`    | Depends on the `media type` chosen. (See below.)                                |
| `Filename prefix` | Up to 6 digits can be added before the media filename(s), to help with sorting. |
| `Media list`      | This shows the currently planned media for the selected date tile.              |

In the `Media to add` field, you'll be presented with different options, depending on the media type selected.

<table>
  <thead>
    <th><code>Media type</code></th>
    <th>The <code>Media to add</code> field</th>
  </thead>
  <tbody>
    <tr>
      <td><code>Song</code></td>
      <td>... show a menu with all Kingdom song videos from the _sjjm_ series, in the media language. Choose this option for example to add a song for the public talk, or for circuit overseer visits. <br><br>The selected song will be automatically downloaded from JW.org, in the congregation or group's language, as configured in the [settings](#/configuration).</td>
    </tr>
    <tr>
      <td><code>JWPUB</code></td>
      <td>... allow you to browse to (or drag and drop) a JWPUB file. <br><br>You'll then be prompted to select the section, or chapter, from which you'd like to add media. This will add both embedded and referenced media from that section in the JWPUB file. <br><br>An example of a commonly used JWPUB file is the S-34, but any JWPUB file can be used here.</td>
    </tr>
    <tr>
      <td><code>Custom</code></td>
      <td>... allow you to browse to (or drag and drop) any other media file(s) from your computer.    <br><br><blockquote>Note that all PDF and SVG files will automatically be converted into high-resolution images by M³.</blockquote>                      </td>
    </tr>
  </tbody>
</table>

### Removing, hiding and showing media

To **remove**, **hide**, or **show** media, simply find the media file you don't want, and click on the relevant icon.

<table>
  <thead>
    <th>Media has a red 🟥 (delete) icon</th>
    <th>Media has a ☑️ (checked checkbox) icon</th>
    <th>Media has a 🔲 (unchecked checkbox) icon</th>
  </thead>
  <tbody>
    <tr>
      <td>
        The media file was added to that day's media by you or the VO.<br>
        <br>
        Click on the red 🟥 (delete) icon to delete the file.<br>
        Click a second time to confirm.
      </td>
      <td>
        The media file is referenced in the meeting's material.<br>
        <br>
        It <em>will</em> be downloaded from JW.org or extracted from the relevant publication.
      </td>
      <td>
        The media file was referenced in the meeting's material.<br>
        <br>
        It was hidden by you or the VO, so it _will not_ be downloaded or added to the meeting's media.
      </td>
    </tr>
  </tbody>
</table>

### Screenshots of the media management screen

<table class="showcase" markdown="0">
{% include image.html src="manage/song-media.png" alt="Adding a song for a public talk" %}
{% include image.html src="manage/custom-media.png" alt="Adding an additional picture" %}
{% include image.html src="manage/jwpub-extract.png" alt="Importing media from a section in a JWPUB file" %}
{% include image.html src="manage/jwpub-media.png" alt="Previewing media from a JWPUB file before importing" %}
{% include image.html src="manage/rename-media.png" alt="Renaming a media file" %}
</table>

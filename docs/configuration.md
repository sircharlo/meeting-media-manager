## Configuration

The Settings screen is divided into 4 sections. Most of the options are self-explanatory, but here are a few additional details.

### Application setup

| Setting  | Explanation |
| ------------- | ------------- |
| Display language  | Sets the language in which JWMMF is displayed. <br><br>Thank you to our many contributors for translating the app in so many languages! If you want to help improve an existing translation or add a new one, please open up a new [discussion](https://github.com/sircharlo/jw-meeting-media-fetcher/discussions). |
| Folder in which to save media  | All media will be downloaded to this folder for later sharing and use. |
| Run app at system startup | Self-explanatory |
| Initiate media sync on app launch | Self-explanatory |
| Open folder after media sync | Self-explanatory |
| Quit app after media sync | Self-explanatory |


### Congregation sync setup

See the [congregation sync](https://sircharlo.github.io/jw-meeting-media-fetcher/congregation-sync) page for details on what this does exactly and how to configure this section.


### Media setup

| Setting  | Explanation |
| ------------- | ------------- |
| Media language | Self-explanatory |
| Maximum resolution for videos | Videos downloaded from JW.org will be downloaded at this resolution, or the next available lower resolution. Useful for limited or low-bandwidth situatons. |
| Exclude all media from the <em>th</em> brochure  | If enabled, this will prevent media from the <em>Apply Yourself</em> brochure from being included at every midweek meeting. |
| Exclude audio and video files from the <em>lffi</em> brochure  | If enabled, this will prevent audio and video files from the <em>Live Forever</em> brochure from being included, for example for student assignments during the midweek meeting. Pictures from the <em>lffi</em> brochure are not affected by this setting. |
| Offer to import additional media | If enabled, you'll be presented with the *Additional media* screen when performing a media sync. That screen allows you to add additional media files into a given week's media. See [Managing media](https://sircharlo.github.io/jw-meeting-media-fetcher/manage-media). <br><blockquote>This option will only be shown is [congregation sync](https://sircharlo.github.io/jw-meeting-media-fetcher/congregation-sync) is not enabled.</blockquote>|
| Convert media to MP4 format | This automatically converts all picture and audio files into MP4 format, for use with Zoom's [native MP4 sharing feature](https://github.com/sircharlo/jw-meeting-media-fetcher/blob/master/screenshots/05-zoom.png?raw=true). This includes all pictures and media files downloaded from JW.org, as well as additional media files added by the user or the VO. <br><br>When using Zoom's native MP4 sharing, files are opened within Zoom’s built-in video player and shared, without other participants viewing the playback controls. Sharing an MP4 file with the built-in player, rather than sharing your entire screen or a media playback app's window, improves the quality of shared videos, providing a smoother and more stable viewing experience for meeting participants. (*[Zoom support article](https://support.zoom.us/hc/en-us/articles/360051673592-Sharing-and-playing-a-video)*) |

### Meeting setup

| Setting  | Explanation |
| ------------- | ------------- |
| Midweek meeting | Indicate the usual day and time for the midweek meeting; used for folder naming and smart music fade-out (see below). |
| Weekend meeting | Indicate the usual day and time for the weekend meeting. |
| Enable button to play Kingdom songs on shuffle  | Shows a button on the main screen which, once clicked, will play Kingdom songs in random order. This is useful, for example, to play songs before and after meetings at the Kingdom Hall as background music. |
| Automatically stop playing songs  | If the previous setting is active, then this setting will allow you to specify a delay after which background music should be automatically stopped. <br><br>This can be either: <br><li>a set number of minutes, or </li><li>a predetermined number of seconds before the start of the meeting (in the case where the background music was started before a meeting).</li> |

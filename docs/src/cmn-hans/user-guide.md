# User Guide {#user-guide}

This comprehensive user guide will help you master all the features of M³, from basic setup to advanced media presentation techniques.

## Getting Started {#getting-started}

### First Launch {#first-launch}

When you first launch M³, you'll be guided through a setup wizard that will configure the essential settings for your congregation:

1. **Choose your interface language** - This determines what language M³'s menus and buttons will be displayed in
2. **Select profile type** - Choose "Regular" for normal congregation use or "Other" for special events
3. **Configure congregation information** - Enter your congregation details or use the automatic lookup feature
4. **Set up meeting schedule** - Configure your midweek and weekend meeting times
5. **Optional features** - Configure OBS integration, background music, and other advanced features

:::tip 小贴士

Take your time during setup - but you can always change these settings later in the Settings menu.

:::

### Main Interface Overview {#main-interface}

The main M³ interface consists of several key areas:

- **Navigation Drawer** - Access different sections and settings
- **Calendar View** - Browse media by date
- **Media List** - View and manage media for selected dates
- **Toolbar** - Quick access to common functions
- **Status Bar** - Shows download progress, and background music and OBS Studio connection status

## Media Management {#media-management}

### Understanding the Calendar View {#calendar-view}

The calendar view shows your meeting schedule and available media:

- **Meeting Days** - Highlighted days show when meetings are scheduled
- **Media Indicators** - Icons show what types of media are available
- **Date Navigation** - Use arrow keys to navigate between months

<!-- ### Downloading Media {#downloading-media}

::: info Note

Download speed depends on your internet connection and the size of media files. Videos typically take longer to download than images.

::: -->

### Organizing Media {#organizing-media}

M³ automatically organizes media by meeting type and section:

- **Meeting Sections** - Media is grouped by meeting parts (Public Talk, Treasures from God's Word, etc.)
- **Custom Sections** - You can create custom sections for additional media if no meeting is scheduled on that particular day

## Media Presentation {#media-presentation}

### Opening the Media Player {#opening-media-player}

To present media during a meeting:

1. Select the date and media item you want to present
2. Click the play button or use the keyboard shortcut
3. The media will start playing on the media display
4. Use the controls to play, pause, or navigate through media

### Media Player Controls {#media-player-controls}

The media player provides comprehensive controls:

- **Play/Pause** - Start or pause media playback
- **Stop** - Stop playback

<!-- - **Previous/Next** - Navigate between media items
- **Volume** - Adjust playback volume -->

<!-- - **Fullscreen** - Toggle fullscreen mode -->

- **Zoom/Pan** - Use mouse wheel to zoom, drag to pan (for images)

### Advanced Presentation Features {#advanced-presentation}

#### Custom Timing {#custom-timing}

Set custom start and end times for media:

<!-- 1. Right-click on a media item
2. Select "Edit Timing" -->

1. Click on the duration of a video on the top left of its thumbnail
2. Set start and end times
3. Save your changes

#### Zoom and Pan {#zoom-pan}

For images and videos:

- **Zoom In/Out** - Use mouse wheel or zoom controls on the thumbnail
- **Pan** - Click and drag the thumbnail to move the image around
- **Reset Zoom** - Click to return to original zoom

#### Keyboard Shortcuts {#keyboard-shortcuts}

Configure custom keyboard shortcuts for quick access. Note that no keyboard shortcuts are set by default.

**Built-in Media Controls** (when main window is focused and showing the media list):

- **Tab/Shift+Tab** - Navigate between media items
- **Up/Down Arrow** - Navigate between media items
- **Space** - Play/Pause media
- **Escape** - Stop media

**Customizable Shortcuts** (when enabled in settings):

- **Media Window**\* - Open/close media window
- **Previous/Next Media**\* - Navigate between media items
- **Pause/Resume**\* - Control media playback
- **Stop Media**\* - Stop media playback
- **Music Toggle**\* - Control background music

**Note (\*):** Global shortcut - available even when the app is not focused

## Background Music {#background-music}

### Setting Up Background Music {#background-music-setup}

Background music automatically plays before meetings and stops at the appropriate time:

1. **Enable Music** - Turn on background music in settings
2. **Auto-Start** - Music will start automatically when M³ launches, if appropriate
3. **Meeting Stop** - Music stops automatically before meeting start time
4. **Manual Control** - Use the music button in the status bar to start/stop manually
5. **Restart** - Resume music after meetings with one click

## Zoom Integration {#zoom-integration}

M³ can integrate with Zoom for automatic screen sharing:

1. **Enable Integration** - Turn on Zoom integration in settings
2. **Configure Shortcut** - Set up the screen sharing keyboard shortcut that is configured in Zoom. Make sure that the "global" checkbox is checked in Zoom.
3. **Automatic Control** - M³ will automatically toggle screen sharing in Zoom as needed
4. **Manual Override** - You can still manually control screen sharing using Zoom if needed

## OBS Studio Integration {#obs-integration}

### Setting Up OBS Integration {#obs-setup}

To use M³ with OBS Studio for hybrid meetings:

1. **Install OBS Studio** - Download and install OBS Studio
2. **Enable WebSocket** - Install the WebSocket plugin in OBS
3. **Configure M³** - Enter OBS port and password in M³ settings
4. **Set Up Scenes** - Create scenes for camera, media, and other content
5. **Test** - Verify playback works properly

### OBS Scene Management {#obs-scene-management}

M³ automatically switches OBS scenes during presentations:

- **Camera Scene** - Shows the lectern/camera view
- **Media Scene** - Displays media content
- **Image Scene** - Shows images (can be postponed if enabled)
- **Automatic Switching** - Scenes change based on media type and settings

### Advanced OBS Features {#advanced-obs}

#### Postpone Images {#postpone-images}

Enable this option to delay sharing images to OBS until manually triggered:

1. Enable "Postpone Images" in OBS settings
2. Images will only be shared when you click the button to show them using OBS Studio. This is useful for showing images to in-person audience first.

#### Scene Switching Behavior {#scene-switching}

Configure how M³ handles scene changes:

- **Switch After Media** - Automatically return to previous scene
- **Remember Previous Scene** - Restore the scene that was active before media

### Audio Configuration for Hybrid Meetings {#audio-configuration}

When using M³ with OBS Studio for hybrid meetings (in-person + Zoom), you need to configure audio settings to ensure meeting participants can hear the media:

#### Zoom Audio Settings {#zoom-audio-settings}

**Before every meeting, you must enable Original Audio in Zoom:**

1. **Open Zoom** and go to Settings
2. **Navigate to Audio** → **Advanced**
3. **Enable "Show in-meeting option to 'Enable Original Sound'"**
4. **Check "Disable echo cancellation"** (first checkbox)
5. **Check "Disable noise suppression"** (second checkbox)
6. **Uncheck "Disable high-fidelity music mode"** (third checkbox)
7. **Before starting each meeting**, click the "Original Audio" button in the meeting controls

**Alternative: Share Computer Sound**
If Original Audio doesn't work well in your setup:

1. **Before playing media**, go to **Advanced** tab in Zoom screen sharing options
2. **Check "Share computer sound"**
3. **Note**: This option must be enabled every time you start a new Zoom session

**Best Alternative**: Consider using M³'s Zoom integration instead of OBS Studio, as it uses Zoom's native screen sharing which handles audio more seamlessly and doesn't require complex audio configuration.

#### Why Audio Configuration is Necessary {#why-audio-config}

M³ plays media with sound on your computer, but this audio is **not automatically transmitted** through the video stream to OBS Studio. This is the same behavior you would experience with any other media player.

**The audio issue is not related to M³** - it's a limitation of how OBS Studio video streaming works with Zoom. The video stream acts like a virtual camera without sound, just like a webcam, so you must explicitly configure Zoom to capture the computer's audio. This implies that your computer has two sound cards, and if this isn't the case, you probably won't be able to use the OBS Studio integration successfully.

**Alternative Solution**: Consider using the Zoom integration instead, as it uses Zoom's native screen and audio sharing, which handles audio more seamlessly.

#### Troubleshooting Audio Issues {#audio-troubleshooting}

**Common Problems:**

- **No audio in Zoom**: Check if Original Audio is enabled and properly configured
- **Poor audio quality**: Verify the three Original Audio checkboxes are set correctly
- **Audio not working after Zoom restart**: Original Audio settings must be re-enabled for each new Zoom session

**Best Practices:**

- Test audio configuration and sharing before meetings
- Create a checklist for audio setup
- Consider using "Share Computer Sound" as a backup option
- **Consider using Zoom integration instead of OBS Studio** for simpler audio handling
- Ensure all AV operators are familiar with these settings

## Media Import and Management {#media-import}

### Importing Custom Media {#importing-custom-media}

Add your own media files to M³:

1. **File Import** - Use the import button to add videos, images, or audio files
2. **Drag and Drop** - Drag files directly into M³
3. **Folder Monitoring** - Set up a watched folder for automatic imports
4. **JWPUB Files and Playlists** - Import publications and playlists

### Managing Imported Media {#managing-imported-media}

- **Organize by Date** - Assign imported media to specific dates
- **Custom Sections** - Create custom sections for organization
- **Edit Properties** - Modify titles, descriptions, and timing
- **Remove Media** - Delete unwanted media items

### Audio Bible Import {#audio-bible-import}

Import audio recordings of Bible verses:

1. Click the "Audio Bible" button
2. Select the Bible book and chapter
3. Choose specific verses or verse ranges
4. Download the audio files
5. Use them

## Folder Monitoring and Export {#folder-monitoring}

### Setting Up Folder Monitoring {#folder-monitoring-setup}

Monitor a folder for new media files:

1. **Enable Folder Watcher** - Turn on folder monitoring in settings
2. **Select Folder** - Choose the folder to monitor
3. **Automatic Import** - New files are automatically added to M³
4. **Organization** - Files are organized by date based on folder structure

### Media Export {#media-export}

Automatically export media to organized folders:

1. **Enable Auto-Export** - Turn on media export in settings
2. **Select Export Folder** - Choose where to save exported files
3. **Automatic Organization** - Files are organized by date and section
4. **Format Options** - Convert files to MP4 for better compatibility

## Website Presentation {#website-presentation}

### Presenting the Official Website {#presenting-the-website}

Share the official website on external displays:

1. **Open Website Mode** - Click the website presentation button
2. **External Display** - The website opens in a new window
3. **Navigation** - Use the browser controls to navigate

### Website Controls {#website-controls}

- **Navigation** - Standard browser navigation controls
- **Refresh** - Reload the current page
- **Close** - Exit website presentation mode

## Advanced Features {#advanced-features}

### Multiple Congregations {#multiple-congregations}

Manage multiple congregations or groups:

1. **Create Profiles** - Set up separate profiles for different congregations
2. **Switch Profiles** - Use the congregation selector to switch between profiles
3. **Separate Settings** - Each profile has its own settings and media
4. **Shared Resources** - Media files are shared between profiles whenever possible

### Keyboard Shortcuts {#keyboard-shortcuts-guide}

Configure custom keyboard shortcuts for efficient operation:

1. **Enable Shortcuts** - Turn on keyboard shortcuts in settings
2. **Configure Shortcuts** - Set up shortcuts for common actions
3. **Practice** - Learn your shortcuts for faster operation
4. **Customize** - Adjust shortcuts to match your preferences

## Troubleshooting {#troubleshooting-guide}

### Common Issues {#common-issues}

#### Media Not Downloading {#media-not-downloading}

- Check your meeting schedule settings
- Verify internet connection
- Check if media is available in your selected language

#### OBS Integration Not Working {#obs-not-working}

- Verify OBS WebSocket plugin is installed
- Check port and password settings
- Ensure OBS is running

#### Audio Issues in Zoom/OBS {#audio-issues}

- **No audio in Zoom**: Enable Original Audio in Zoom settings and before each meeting
- **Poor audio quality**: Check the three Original Audio checkboxes (first two enabled, third disabled)
- **Audio not working after restart**: Original Audio must be re-enabled for each new Zoom session
- **Alternative solution**: Use "Share Computer Sound" option in Zoom screen sharing

#### Performance Issues {#performance-issues}

- Enable extra cache
- Reduce maximum resolution
- Clear old cached files
- Check available disk space

#### Language Issues {#language-issues}

- Check media language setting
- Ensure language is available on JW.org
- Try a fallback language
- Verify interface language setting

### Getting Help {#getting-help}

If you encounter issues:

1. **Check Documentation** - Review this guide and other available documentation
2. **Search Issues** - Look for similar issues on GitHub
3. **Report Problems** - Create a new issue with detailed information

## Best Practices {#best-practices}

### Before Meetings {#before-meetings}

1. **Check Downloads** - Ensure all media is downloaded
2. **Test Equipment** - Verify displays and audio work
3. **Prepare Media** - Review and organize media for the meeting; make sure no media files are missing
4. **Configure Audio** - For hybrid meetings, enable Original Audio in Zoom or set up "Share Computer Sound"

### During Meetings {#during-meetings}

1. **Stay Focused** - Use the clean and distraction-free interface
2. **Use Shortcuts** - Master keyboard shortcuts for smooth operation
3. **Monitor Audio** - Keep an eye on volume levels, if that's part of your responsibilities
4. **Be Prepared** - Have the next media item ready
5. **Verify Audio** - For hybrid meetings, ensure Zoom participants can hear the media

### After Meetings {#after-meetings}

1. **Start Background Music** - Start the playback of background music
2. **Plan Ahead** - Prepare for the next meeting by making sure everything is in place
3. **Clean Up** - Close media player when you're ready to leave

### Regular Maintenance {#regular-maintenance}

1. **Update M³** - Keep the application updated
2. **Clear Cache** - Periodically clear old cached files
3. **Check Settings** - Review and update settings as needed

<template>
  <div id="media-win-container">
    <div id="importedYearText" class="font-fallback loading" />
    <div id="importedYearTextLogoContainer" style="display: none" />
    <div id="mediaDisplay" />
    <div id="blackOverlay" />
    <div id="resizeOverlay">
      <div id="dimensions" />
    </div>
  </div>
</template>
<script lang="ts">
import { pathToFileURL } from 'url'
import { defineComponent } from 'vue'
// eslint-disable-next-line import/named
import { readFileSync, existsSync } from 'fs-extra'
import { join, basename } from 'upath'
import Panzoom, { PanzoomObject } from '@panzoom/panzoom'
import { ipcRenderer } from 'electron'
import { ElectronStore } from '~/types'
import { HUNDRED_PERCENT } from '~/constants/general'

export default defineComponent({
  name: 'MediaPage',
  layout: 'media',
  data() {
    return {
      scale: 1,
      zoomEnabled: false,
      panzoom: null as null | PanzoomObject,
      container: document.createElement('div'),
      yeartext: document.createElement('div'),
      ytLogo: document.createElement('div'),
      mediaDisplay: document.createElement('div'),
      blackOverlay: document.createElement('div'),
      resizeOverlay: document.createElement('div'),
      dimensions: document.createElement('div'),
    }
  },
  watch: {
    zoomEnabled(val: boolean) {
      this.container.style.cursor = val ? 'zoom-in' : 'default'
      // @ts-ignore
      document.body.style['app-region'] = val ? 'none' : 'drag'
    },
    scale(val: number) {
      if (val === 1) {
        this.container.style.cursor = this.zoomEnabled ? 'zoom-in' : 'default'
      } else {
        this.container.style.cursor = 'move'
      }
    },
  },
  mounted() {
    // Set global html elements
    this.container = document.querySelector(
      '#media-win-container'
    ) as HTMLDivElement
    this.yeartext = document.querySelector(
      '#importedYearText'
    ) as HTMLDivElement
    this.ytLogo = document.querySelector(
      '#importedYearTextLogoContainer'
    ) as HTMLDivElement
    this.mediaDisplay = document.querySelector(
      '#mediaDisplay'
    ) as HTMLDivElement
    this.blackOverlay = document.querySelector(
      '#blackOverlay'
    ) as HTMLDivElement
    this.resizeOverlay = document.querySelector(
      '#resizeOverlay'
    ) as HTMLDivElement
    this.dimensions = document.querySelector('#dimensions') as HTMLDivElement

    this.panzoom = Panzoom(this.mediaDisplay, {
      animate: true,
      canvas: true,
      contain: 'outside',
      cursor: 'default',
      panOnlyWhenZoomed: true,
    })

    // @ts-ignore
    document.body.style['app-region'] = 'drag'
    this.container.addEventListener('wheel', this.zoom)

    // IpcRenderer listeners
    ipcRenderer.on('showMedia', (_e, media) => {
      if (this.panzoom) this.panzoom.reset()
      this.zoomEnabled = media && this.$isImage(media.path)
      if (!media) window.location.reload() // Reload page to allow dragging again
      this.transitionToMedia(media)
    })
    ipcRenderer.on('pauseVideo', () => {
      const video = document.querySelector('video') as HTMLVideoElement
      video.classList.add('manuallyPaused')
      video.pause()
    })
    ipcRenderer.on('playVideo', () => {
      const video = document.querySelector('video') as HTMLVideoElement
      video.classList.remove('manuallyPaused', 'shortVideoPaused')
      video.play()
    })
    ipcRenderer.on('windowResizing', (_e, args) => {
      this.resizingNow(args[0], args[1])
    })
    ipcRenderer.on('windowResized', () => {
      this.resizingDone()
    })
    ipcRenderer.on('videoScrub', (_e, timeAsPercent) => {
      const video = document.querySelector('video') as HTMLVideoElement
      video.currentTime = (video.duration * timeAsPercent) / HUNDRED_PERCENT
    })
    ipcRenderer.on('hideMedia', async () => {
      await this.hideMedia()
    })
    ipcRenderer.on('startMediaDisplay', async (_e, prefs) => {
      // Reset screen
      this.yeartext.innerHTML = ''
      const main = document.querySelector('main') as HTMLElement
      main.style.background = 'black'

      // Look for a custom background
      const bgImage = this.$findOne(
        join(
          await ipcRenderer.invoke('userData'),
          `custom-background-image-${prefs.app.congregationName}*`
        )
      )
      if (bgImage) {
        const response = await this.$axios.get(pathToFileURL(bgImage).href, {
          responseType: 'blob',
        })
        const file = new File([response.data], basename(bgImage), {
          type: response.headers['content-type'],
        })

        main.style.background = `url(${URL.createObjectURL(
          file
        )}) black center center / contain no-repeat`
      } else {
        await this.setYearText(prefs)
      }
    })

    ipcRenderer.send('readyToListen')
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('startMediaDisplay')
    ipcRenderer.removeAllListeners('hideMedia')
    ipcRenderer.removeAllListeners('videoScrub')
    ipcRenderer.removeAllListeners('windowResized')
    ipcRenderer.removeAllListeners('windowResizing')
    ipcRenderer.removeAllListeners('playVideo')
    ipcRenderer.removeAllListeners('pauseVideo')
    ipcRenderer.removeAllListeners('showMedia')
    document.removeEventListener('wheel', this.zoom)
  },
  methods: {
    zoom(e: WheelEvent) {
      if (this.panzoom && this.zoomEnabled) {
        // eslint-disable-next-line no-magic-numbers
        this.scale += e.deltaY * -0.01

        // Restrict scale
        // eslint-disable-next-line no-magic-numbers
        this.scale = Math.min(Math.max(0.125, this.scale), 4)
        if (this.scale < 1) this.scale = 1
        this.panzoom?.zoom(this.scale)
        if (this.scale === 1) this.panzoom.reset()
      }
    },
    transitionToMedia(media: { path: string; start?: string; end?: string }) {
      this.resizingDone()
      this.blackOverlay.style.opacity = '1'
      setTimeout(() => {
        if (media?.path) {
          const videos = document.querySelectorAll('#mediaDisplay video')

          // Remove all videos
          if (videos.length > 0) {
            videos.forEach((video) => {
              video.remove()
            })
          }
          if (this.$isVideo(media.path) || this.$isAudio(media.path)) {
            let src = pathToFileURL(media.path).href

            // Set start and end times
            if (media.start || media.end) {
              src += `#t=${media.start || ''}${
                media.end ? ',' + media.end : ''
              }`
            }

            const video = document.createElement('video')
            video.id = 'mediaVideo'
            video.autoplay = true
            video.controls = false
            video.src = src

            // If the video is short (converted image), pause it, so it doesn't stop automatically
            video.oncanplay = () => {
              if (video.duration < 0.1) {
                video.classList.add('shortVideoPaused')
                video.pause()
              }
            }
            video.ontimeupdate = () => {
              ipcRenderer.send('videoProgress', [
                video.currentTime,
                video.duration,
              ])
            }

            // If media is paused externally, stop the video
            video.onpause = async () => {
              if (
                !(
                  video.classList.contains('manuallyPaused') ||
                  video.classList.contains('shortVideoPaused')
                )
              ) {
                await this.hideMedia()
                ipcRenderer.send('videoEnd')
              }
            }
            video.onended = () => {
              ipcRenderer.send('videoEnd')
            }
            this.mediaDisplay.append(video)
            this.mediaDisplay.style.background = 'black'
          } else if (this.$isImage(media.path)) {
            this.mediaDisplay.style.background = `url(${
              pathToFileURL(media.path).href
            }) black center center / contain no-repeat`
          }
        } else {
          this.mediaDisplay.style.background = 'transparent'
        }
        this.blackOverlay.style.opacity = '0'
        // eslint-disable-next-line no-magic-numbers
      }, 400)
    },
    resizingNow(width: number, height: number) {
      this.resizeOverlay.style.opacity = '1'
      this.dimensions.innerText = `${width}x${height}`
    },
    resizingDone() {
      this.resizeOverlay.style.opacity = '0'
    },
    async hideMedia() {
      const video = document.querySelector('video') as HTMLVideoElement

      // Animate out
      if (video) {
        const animation = video.animate(
          [
            { opacity: 1, volume: 100 },
            { opacity: 0, volume: 0 },
          ],
          {
            duration: 400,
          }
        )
        await animation.finished
        video.remove()
      }
      setTimeout(() => {
        this.mediaDisplay.style.background = 'transparent'
        this.blackOverlay.style.opacity = '0'
        // eslint-disable-next-line no-magic-numbers
      }, 400)
    },
    async setYearText(prefs: ElectronStore) {
      const path = join(
        await ipcRenderer.invoke('userData'),
        'Publications',
        prefs.media.lang ?? 'E',
        `yeartext-${prefs.media.lang ?? 'E'}-${new Date()
          .getFullYear()
          .toString()}`
      )
      try {
        const yeartext = existsSync(path) ? readFileSync(path, 'utf8') : null
        const fontPath = await this.$wtFontPath() // Only works when watchtower library is installed on the user's machine
        if (yeartext && yeartext.length > 0) {
          this.yeartext.innerHTML = ''

          const root = document.createElement('div')
          root.innerHTML = yeartext

          // For each element of the yeartext, add it as a paragraph
          for (let i = 0; i < root.children.length; i++) {
            const el = root.children.item(i)
            if (
              el?.tagName === 'P' &&
              el.textContent &&
              el.textContent.length > 0
            ) {
              const newEl = document.createElement('p')
              newEl.innerText = el.textContent
              this.yeartext.append(newEl)
            }
          }

          // If WT library is installed, set the font to the WT font
          const fontFile = this.$findOne(join(fontPath, 'Wt-ClearText-Bold.*'))
          if (fontFile) {
            // @ts-ignore: FontFace is not defined in the types
            const font = new FontFace(
              'Wt-ClearText-Bold',
              `url(${pathToFileURL(fontFile).href})`
            )
            try {
              const loadedFont = await font.load()
              // @ts-ignore: fonts does not exist on document
              document.fonts.add(loadedFont)
              this.yeartext.classList.replace('font-fallback', 'font-native')
            } catch (e: unknown) {
              console.error(e)
            } finally {
              this.yeartext.classList.remove('loading')
            }
          } else {
            this.yeartext.classList.remove('loading')
          }
        }

        // If media logo is enabled, try to show it
        if (prefs.media.hideMediaLogo) {
          this.ytLogo.setAttribute('style', 'display: none')
        } else {
          const logoFontFile = this.$findOne(join(fontPath, 'jw-icons*'))
          if (logoFontFile) {
            // @ts-ignore: FontFace is not defined in the types
            const logoFont = new FontFace(
              'JW-Icons',
              `url(${pathToFileURL(logoFontFile).href})`
            )
            const loadedFont = await logoFont.load()
            // @ts-ignore: fonts does not exist on document
            document.fonts.add(loadedFont)
            this.ytLogo.setAttribute('style', '')
            this.ytLogo.style.fontFamily = '"JW-Icons"'
            this.ytLogo.innerHTML = "<div id='importedYearTextLogo'></div>"
          }
        }
      } catch (e: unknown) {
        console.error(e)
      }
    },
  },
})
</script>
<style lang="scss">
@font-face {
  font-family: NotoSerif;
  src: url('/NotoSerif-Bold.ttf') format('truetype');
}

html,
body {
  background: black;
  user-select: auto;
}

html,
body,
video,
#mediaDisplay,
#blackOverlay,
#resizeOverlay {
  margin: 0;
  height: 100%;
  width: 100%;
  overflow: hidden !important;
}

#importedYearText,
#mediaDisplay,
#blackOverlay,
#resizeOverlay {
  position: absolute;
  top: 0;
  left: 0;
}

#importedYearText,
#importedYearTextLogoContainer {
  z-index: 5;
}

#importedYearText {
  color: white;
  width: 100%;
  text-align: center;
  height: fit-content;
  margin: auto;
  bottom: 0;
  right: 0;
  font-size: 4vw;
  line-height: 2vw;
  font-weight: 800;

  &.font-fallback {
    font-family: 'NotoSerif', serif;
    letter-spacing: 0.05rem;
  }

  &.font-native {
    font-family: 'Wt-ClearText-Bold', 'NotoSerif', serif;
  }

  &.loading {
    visibility: hidden;
  }

  p {
    margin: 1em 0;
    padding: 0;
  }
}

#importedYearTextLogoContainer {
  font-size: 16vh;
  position: absolute;
  bottom: 12vh;
  right: 14vh;
  color: black !important;
  line-height: normal !important;
  box-sizing: unset;
  background: rgba(255, 255, 255, 0.2);
  border: rgba(255, 255, 255, 0) 1.5vh solid;
  height: 12vh;
  width: 12vh;
  overflow: hidden;

  #importedYearTextLogo {
    margin: -2.5vh -2vh; // was -2 -1
  }
}

#mediaDisplay {
  background: transparent;
  z-index: 10;
}

#blackOverlay,
#resizeOverlay {
  background: black;
  opacity: 0;
}

#blackOverlay {
  z-index: 15;
  transition: opacity 0.4s;
}

#resizeOverlay {
  z-index: 25;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  #dimensions {
    color: #084298;
    background-color: #cfe2ff;
    border-color: #b6d4fe;
    position: relative;
    padding: 1rem;
    border: 1px solid transparent;
    border-radius: 0.25rem;
    width: fit-content;
    height: fit-content;
    font: bold 4vw monospace;
  }
}
</style>

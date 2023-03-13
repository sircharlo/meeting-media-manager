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
// eslint-disable-next-line import/named
import { readFileSync, existsSync } from 'fs-extra'
import { defineComponent } from 'vue'
import { join, basename, changeExt } from 'upath'
import Panzoom, { PanzoomObject } from '@panzoom/panzoom'
import { ipcRenderer } from 'electron'
import { ElectronStore } from '~/types'
import {
  WT_CLEARTEXT_FONT,
  JW_ICONS_FONT,
  MS_IN_SEC,
} from '~/constants/general'

export default defineComponent({
  name: 'MediaPage',
  layout: 'media',
  data() {
    return {
      scale: 1,
      zoomEnabled: false,
      withSubtitles: false,
      interval: null as null | number,
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
      duration: 2 * MS_IN_SEC,
      panOnlyWhenZoomed: true,
      setTransform: (
        el: HTMLElement,
        { scale, x, y }: { scale: number; x: number; y: number }
      ) => {
        const maxY = (el.clientHeight * scale - window.innerHeight) / 2 / scale
        const isValidY = y <= maxY && y >= -maxY
        const validY = isValidY ? y : y > 0 ? maxY : -maxY
        if (this.panzoom) {
          this.panzoom.setStyle(
            'transform',
            `scale(${scale}) translate(${x}px, ${validY}px)`
          )
        }
      },
    })
    // IpcRenderer listeners
    ipcRenderer.on(
      'showMedia',
      async (
        _e,
        media: {
          src: string
          stream?: boolean
          start?: string
          end?: string
        } | null
      ) => {
        console.debug('showMedia', media)
        try {
          await this.transitionToMedia(media)
        } catch (e: unknown) {
          console.error('Error transitioning media', e)
          await this.hideMedia()
          ipcRenderer.send('videoEnd')
        }
      }
    )
    ipcRenderer.on('pauseVideo', () => {
      const video = document.querySelector('video') as HTMLVideoElement
      if (video) {
        video.classList.add('manuallyPaused')
        video.pause()
      }
    })
    ipcRenderer.on('playVideo', async () => {
      const video = document.querySelector('video') as HTMLVideoElement
      if (video) {
        video.classList.remove('manuallyPaused', 'shortVideoPaused')
        try {
          await video.play()
        } catch (e: unknown) {
          this.$log.error(e)
        }
      }
    })
    ipcRenderer.on('windowResizing', (_e, args) => {
      this.resizingNow(args[0], args[1])
    })
    ipcRenderer.on('windowResized', () => {
      this.resizingDone()
    })
    ipcRenderer.on('zoom', (_e, deltaY) => {
      this.zoom(deltaY)
    })
    ipcRenderer.on('resetZoom', () => {
      if (this.panzoom) this.panzoom.reset()
    })
    ipcRenderer.on('pan', (_e, { x, y }: { x: number; y: number }) => {
      if (this.panzoom) {
        this.panzoom.pan(
          this.mediaDisplay.clientWidth * x,
          this.mediaDisplay.clientHeight * y
        )
      }
    })
    ipcRenderer.on('videoScrub', (_e, timeAsPercent) => {
      const video = document.querySelector('video') as HTMLVideoElement
      if (video) {
        video.currentTime = (video.duration * timeAsPercent) / 100
        ipcRenderer.send('videoProgress', [video.currentTime, video.duration])
      }
    })
    ipcRenderer.on('hideMedia', async () => {
      await this.hideMedia()
    })
    ipcRenderer.on(
      'toggleSubtitles',
      (_e, { enabled, top }: { enabled: boolean; top: boolean }) => {
        this.withSubtitles = enabled
        const video = document.querySelector('video') as HTMLVideoElement
        if (video && video.textTracks.length > 0) {
          video.textTracks[0].mode = enabled ? 'showing' : 'hidden'
          const cues = video.textTracks[0].cues
          if (cues) {
            for (let i = 0; i < cues.length; i++) {
              const cue = cues[i]
              if (cue) {
                // @ts-ignore
                cue.line = top ? 5 : 100 - 10
              }
            }
          }
        }
      }
    )
    ipcRenderer.on('startMediaDisplay', async (_e, prefs: ElectronStore) => {
      console.debug('startMediaDisplay', prefs)
      // Reset screen
      this.yeartext.innerHTML = ''
      const main = document.querySelector('main') as HTMLElement
      main.style.background = 'black'

      this.withSubtitles =
        !!prefs.media.enableSubtitles && !!prefs.media.langSubs

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
  },
  methods: {
    zoom(deltaY: number) {
      if (!this.panzoom || !this.zoomEnabled) return

      this.scale += (deltaY * -1) / 100

      // Restrict scale
      // eslint-disable-next-line no-magic-numbers
      this.scale = Math.min(Math.max(0.125, this.scale), 4)
      if (this.scale < 1) this.scale = 1
      this.panzoom.zoom(this.scale)
      if (this.scale === 1) this.panzoom.reset()
    },
    async loadMedia(
      media: {
        src: string
        stream?: boolean
        start?: string
        end?: string
      } | null
    ) {
      const video: HTMLVideoElement = document.createElement('video')

      try {
        if (media?.src) {
          const videos = document.querySelectorAll('video')

          // Remove all videos
          videos.forEach((video) => {
            video.pause()
            video.remove()
          })

          if (this.$isVideo(media.src) || this.$isAudio(media.src)) {
            let src = media.stream ? media.src : pathToFileURL(media.src).href

            // Set start and end times
            if (media.start || media.end) {
              src += `#t=${media.start || ''}${
                media.end ? ',' + media.end : ''
              }`
            }

            video.id = 'mediaVideo'
            video.autoplay = true
            video.controls = false
            video.src = src

            const subsPath = changeExt(media.src, 'vtt')

            if (this.withSubtitles && existsSync(subsPath)) {
              console.debug('Adding subtitles', subsPath)
              const track = document.createElement('track')
              track.kind = 'subtitles'
              track.src = pathToFileURL(subsPath).href
              track.default = true
              track.srclang = 'en' // Needs a valid srclang, but we don't use it
              video.appendChild(track)
            }

            // If the video is short (converted image), pause it, so it doesn't stop automatically
            video.oncanplay = () => {
              console.debug('canplay start')
              if (
                this.withSubtitles &&
                existsSync(subsPath) &&
                video.textTracks.length > 0
              ) {
                video.textTracks[0].mode = 'showing'
              }
              if (video.duration < 0.1) {
                video.classList.add('shortVideoPaused')
                video.pause()
              }
              console.debug('canplay end')
            }

            video.onplay = () => {
              this.interval = setInterval(() => {
                if (video) {
                  ipcRenderer.send('videoProgress', [
                    video.currentTime,
                    video.duration,
                  ])
                }
              }, 0.5 * MS_IN_SEC) as unknown as number
            }

            // If media is paused externally, stop the video
            video.onpause = async () => {
              if (this.interval) {
                clearInterval(this.interval)
              }
              if (
                !(
                  video.classList.contains('manuallyPaused') ||
                  video.classList.contains('shortVideoPaused')
                )
              ) {
                await this.hideMedia()
                ipcRenderer.send('videoEnd')
              } else {
                ipcRenderer.send('videoProgress', [
                  video.currentTime,
                  video.duration,
                ])
              }
            }
            video.onended = () => {
              if (this.interval) {
                clearInterval(this.interval)
              }
              ipcRenderer.send('videoEnd')
            }
            this.mediaDisplay.append(video)
            this.mediaDisplay.style.background = 'black'
          } else if (this.$isImage(media.src)) {
            this.mediaDisplay.style.background = `url(${
              pathToFileURL(media.src).href
            }) black center center / contain no-repeat`
          }
        } else {
          this.mediaDisplay.style.background = 'transparent'
        }
        this.blackOverlay.style.opacity = '0'
        console.debug('mediaDisplay transitioned')
      } catch (e: unknown) {
        this.$log.error(e)
        video.pause()
        video.remove()
        if (media && (this.$isVideo(media.src) || this.$isAudio(media.src))) {
          await this.hideMedia()
        } else {
          await this.transitionToMedia(null)
        }
        ipcRenderer.send('videoEnd')
      }
    },
    async transitionToMedia(
      media: {
        src: string
        stream?: boolean
        start?: string
        end?: string
      } | null
    ) {
      if (this.panzoom) this.panzoom.reset()
      this.zoomEnabled = !!media && this.$isImage(media.src)
      this.resizingDone()
      this.blackOverlay.style.opacity = '1'

      await new Promise((resolve) => setTimeout(resolve, 4 * 100))

      await this.loadMedia(media)
    },
    resizingNow(width: number, height: number) {
      this.resizeOverlay.style.opacity = '1'
      this.dimensions.innerText = `${width}x${height}`
    },
    resizingDone() {
      this.resizeOverlay.style.opacity = '0'
    },
    async hideMedia() {
      const videos = document.querySelectorAll('video')

      // Animate out
      this.blackOverlay.style.opacity = '1'
      setTimeout(() => {
        this.mediaDisplay.style.background = 'transparent'
        videos.forEach((video) => {
          video.pause()
          video.remove()
        })
        this.blackOverlay.style.opacity = '0'
      }, 4 * 100)
      if (videos.length > 0) {
        const video = videos[0]
        const MS_TO_STOP = 4 * 100 // Let fadeout last 400ms
        const TOTAL_VOL = video.volume
        while (video.volume > 0) {
          video.volume -= Math.min(video.volume, (10 * TOTAL_VOL) / MS_TO_STOP)
          await new Promise((resolve) => setTimeout(resolve, 10))
        }
      }
    },
    async setYearText(prefs: ElectronStore) {
      let cachePath = prefs.app.customCachePath
      if (!cachePath) {
        cachePath = (await ipcRenderer.invoke('userData')) as string
      }

      const path = (lang: string | null) => {
        if (!lang) return ''
        return join(
          cachePath,
          'Publications',
          lang,
          `yeartext-${lang}-${new Date().getFullYear().toString()}`
        )
      }
      try {
        const fontPath = this.$wtFontPath() // Only works when watchtower library is installed on the user's machine

        const preferredPath = path(prefs.media.lang)
        const fallbackPath = path(prefs.media.langFallback)
        let yeartext = null as string | null
        if (preferredPath && existsSync(preferredPath)) {
          yeartext = readFileSync(preferredPath, 'utf8')
        } else if (fallbackPath && existsSync(fallbackPath)) {
          yeartext = readFileSync(fallbackPath, 'utf8')
        }

        this.yeartext.innerHTML = ''
        if (yeartext && yeartext.length > 0) {
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

          // Use fetched font if available, fallback to WT Library
          let fontFile = join(cachePath, 'Fonts', basename(WT_CLEARTEXT_FONT))
          if (!existsSync(fontFile)) {
            fontFile = this.$findOne(
              join(await fontPath, 'Wt-ClearText-Bold.*')
            )
          }
          if (fontFile && existsSync(fontFile)) {
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
            }
          }
          this.yeartext.classList.remove('loading')
        }

        // If media logo is enabled, try to show it
        if (prefs.media.hideMediaLogo) {
          this.ytLogo.setAttribute('style', 'display: none')
        } else {
          this.ytLogo.setAttribute('style', '')

          // Use fetched font if available, fallback to WT Library
          let logoFontFile = join(cachePath, 'Fonts', basename(JW_ICONS_FONT))
          if (!existsSync(logoFontFile)) {
            logoFontFile = this.$findOne(join(await fontPath, 'jw-icons*'))
          }
          if (logoFontFile && existsSync(logoFontFile)) {
            // @ts-ignore: FontFace is not defined in the types
            const logoFont = new FontFace(
              'JW-Icons',
              `url(${pathToFileURL(logoFontFile).href})`
            )
            try {
              const loadedFont = await logoFont.load()
              // @ts-ignore: fonts does not exist on document
              document.fonts.add(loadedFont)
              this.ytLogo.style.fontFamily = '"JW-Icons"'
              this.ytLogo.innerHTML = "<div id='importedYearTextLogo'></div>"
            } catch (e: unknown) {
              console.error(e)
              this.ytLogo.setAttribute('style', 'display: none')
            }
          } else {
            this.ytLogo.setAttribute('style', 'display: none')
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
  -webkit-app-region: drag;
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

::cue {
  font-size: 115%;
}
</style>

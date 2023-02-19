import { pathToFileURL } from 'url'
import { Plugin } from '@nuxt/types'
import { ipcRenderer } from 'electron'
import { basename, join } from 'upath'
import { MediaPrefs } from '~/types'

const plugin: Plugin = (
  {
    $notify,
    $log,
    $appPath,
    $getYearText,
    $findAll,
    $getPrefs,
    $axios,
    $getAllPrefs,
    i18n,
    store,
  },
  inject
) => {
  async function setShortcut(
    shortcut: string,
    fn: string,
    domain = 'mediaWindow'
  ) {
    let res = false
    const shortcuts = store.state.present.shortcuts as {
      name: string
      domain: string
      fn: string
    }[]
    try {
      const match = shortcuts.find(({ name }) => name === shortcut)
      if (match) {
        res = match.domain === domain && match.fn === fn
      } else if (shortcut && fn && domain) {
        store.commit('present/addShortcut', { name: shortcut, domain, fn })
        res = await ipcRenderer.invoke('registerShortcut', {
          shortcut,
          fn,
        })
      }
    } catch (e: unknown) {
      $log.error(e)
    } finally {
      if (!res) {
        $notify('infoShortcutSetFail', { identifier: shortcut })
      }
    }
  }
  inject('setShortcut', setShortcut)

  inject('isShortcutAvailable', (shortcut: string, func: string) => {
    const { ppForward, ppBackward, mediaWinShortcut, presentShortcut } =
      $getPrefs('media') as MediaPrefs

    // Alt+[number] is reserved for OBS scenes
    if (/Alt\+\d+/.test(shortcut)) return false

    const shortcuts = [
      { name: ppForward, fn: 'nextMediaItem' },
      { name: ppBackward, fn: 'previousMediaItem' },
      { name: mediaWinShortcut, fn: 'toggleMediaWindow' },
      { name: presentShortcut, fn: 'openPresentMode' },
      { name: $getPrefs('meeting.shuffleShortcut'), fn: 'toggleMusicShuffle' },
    ]

    return !shortcuts.find(({ name, fn }) => name === shortcut && fn !== func)
  })

  inject('isShortcutValid', (shortcut: string) => {
    if (!shortcut) return false

    const modifiers =
      /^(Command|Cmd|Control|Ctrl|CommandOrControl|CmdOrCtrl|Alt|Option|AltGr|Shift|Super)$/
    const keyCodes =
      /^([0-9A-Z)!@#$%^&*(:+<_>?~{|}";=,\-./`[\\\]']|F1*[1-9]|F10|F2[0-4]|Plus|Space|Tab|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|Esc|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause|PrintScreen)$/

    const parts = shortcut.split('+')
    let keyFound = false

    return parts.every((val, index) => {
      const isKey = keyCodes.test(val)
      const isModifier = modifiers.test(val)
      if (isKey) {
        // Key must be unique
        if (keyFound) return false
        keyFound = true
      }

      // Key is required
      if (index === parts.length - 1 && !keyFound) return false
      return isKey || isModifier
    })
  })

  inject('unsetShortcut', (func: string) => {
    const shortcuts = store.state.present.shortcuts as {
      name: string
      domain: string
      fn: string
    }[]

    const match = shortcuts.find(({ fn }) => fn === func)

    if (!match) return

    try {
      ipcRenderer.send('unregisterShortcut', match.name)
    } catch (e: unknown) {
      $log.error(e)
    }

    store.commit(
      'present/setShortcuts',
      shortcuts.filter(({ name }) => name !== match.name)
    )
  })

  function unsetShortcuts(filter = 'all') {
    const shortcuts = store.state.present.shortcuts as {
      name: string
      domain: string
      fn: string
    }[]
    const keepers = [] as { name: string; domain: string; fn: string }[]

    for (let i = shortcuts.length - 1; i >= 0; i--) {
      const { name, domain } = shortcuts[i]
      if (filter === 'all' || domain === filter) {
        try {
          ipcRenderer.send('unregisterShortcut', name)
        } catch (e: unknown) {
          $log.error(e)
        }
      } else {
        keepers.push({ ...shortcuts[i] })
      }
    }
    store.commit('present/setShortcuts', keepers)
  }
  inject('unsetShortcuts', unsetShortcuts)

  async function showMediaWindow() {
    console.log('show method', $getPrefs('media'))
    ipcRenderer.send('showMediaWindow', await getMediaWindowDestination())
    setShortcut($getPrefs('media.presentShortcut') as string, 'openPresentMode')
    setShortcut(
      $getPrefs('media.mediaWinShortcut') as string,
      'toggleMediaWindow'
    )
  }
  inject('showMediaWindow', showMediaWindow)

  function closeMediaWindow() {
    unsetShortcuts('mediaWindow')
    ipcRenderer.send('closeMediaWindow')
    store.commit('present/setMediaScreenInit', false)
  }
  inject('closeMediaWindow', closeMediaWindow)

  async function toggleMediaWindow(action?: string) {
    if (!action) {
      action = $getPrefs('media.enableMediaDisplayButton') ? 'open' : 'close'
    }
    if (action === 'open') {
      await showMediaWindow()
      await refreshBackgroundImgPreview()
    } else {
      closeMediaWindow()
      if (action === 'reopen') toggleMediaWindow()
    }
  }
  inject('toggleMediaWindow', toggleMediaWindow)

  async function refreshBackgroundImgPreview(force = false) {
    if (!$getPrefs('media.enableMediaDisplayButton')) return

    try {
      let type = 'yeartext'
      const backgrounds = $findAll(
        join(
          $appPath(),
          `custom-background-image-${$getPrefs('app.congregationName')}*`
        )
      )

      // If no custom background, set yeartext as background
      if (backgrounds.length === 0) {
        const yeartext = await $getYearText(force)
        const root = document.createElement('div')
        root.innerHTML = yeartext ?? ''
        let yeartextString = ''
        for (let i = 0; i < root.children.length; i++) {
          yeartextString += '<p>' + root.children.item(i)?.textContent + '</p>'
        }
        store.commit('present/setBackground', yeartextString)
      } else {
        const response = await $axios.get(pathToFileURL(backgrounds[0]).href, {
          responseType: 'blob',
        })
        const file = new File([response.data], basename(backgrounds[0]), {
          type: response.headers['content-type'],
        })

        URL.revokeObjectURL(store.state.present.background)
        store.commit('present/setBackground', URL.createObjectURL(file))
        type = 'custom'
      }
      ipcRenderer.send('startMediaDisplay', $getAllPrefs())
      return type
    } catch (e: unknown) {
      $log.error(e)
    }
  }
  inject('refreshBackgroundImgPreview', refreshBackgroundImgPreview)

  async function getMediaWindowDestination() {
    const mediaWinOptions = {
      destination: null,
      type: 'window',
      alwaysOnTop: !$getPrefs('media.disableAlwaysOnTop'),
    }

    if (!$getPrefs('media.enableMediaDisplayButton')) return mediaWinOptions

    try {
      const screenInfo = await ipcRenderer.invoke('getScreenInfo')
      store.commit(
        'present/setScreens',
        screenInfo.otherScreens.map(
          (screen: {
            id: number
            humanFriendlyNumber: number
            size: { width: number; height: number }
          }) => {
            return {
              id: screen.id,
              class: 'display',
              text: `${i18n.t('screen')} ${screen.humanFriendlyNumber} ${
                screen.size?.width && screen.size?.height
                  ? ` (${screen.size.width}x${screen.size.height}) (ID: ${screen.id})`
                  : ''
              }`,
            }
          }
        )
      )
      const output = $getPrefs('media.preferredOutput')
      if (output !== 'window' && screenInfo.otherScreens.length > 0) {
        const pref = screenInfo.otherScreens.find(
          (d: { id: number }) => d.id === output
        )
        mediaWinOptions.destination =
          pref?.id ??
          screenInfo.otherScreens[screenInfo.otherScreens.length - 1].id
        mediaWinOptions.type = 'fullscreen'
      } else {
        mediaWinOptions.destination = screenInfo.displays[0]?.id ?? null
      }
    } catch (e: unknown) {
      $log.error(e)
    }
    return mediaWinOptions
  }
  inject('getMediaWindowDestination', getMediaWindowDestination)
}

export default plugin

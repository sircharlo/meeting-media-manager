import { pathToFileURL } from 'url'
import { Plugin } from '@nuxt/types'
import { ipcRenderer } from 'electron'
import { join } from 'upath'

const plugin: Plugin = (
  {
    $notify,
    $log,
    $appPath,
    $getYearText,
    $findAll,
    $getPrefs,
    $getAllPrefs,
    i18n,
    store,
  },
  inject
) => {
  async function setShortcut(
    shortcut: string,
    fn: string,
    domain: string = 'mediaWindow'
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
      } else {
        store.commit('present/addShortcut', { name: shortcut, domain, fn })
        res = await ipcRenderer.invoke('registerShortcut', {
          shortcut,
          fn,
        })
      }
    } catch (e: any) {
      $log.error(e)
    } finally {
      if (!res) {
        $notify('infoShortcutSetFail', { identifier: shortcut })
      }
    }
  }
  inject('setShortcut', setShortcut)

  function unsetShortcuts(filter: string = 'all') {
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
        } catch (e: any) {
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
    ipcRenderer.send('showMediaWindow', await getMediaWindowDestination())
    setShortcut('Alt+D', 'openPresentMode')
    setShortcut('Alt+Z', 'toggleMediaWindow')
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

  async function refreshBackgroundImgPreview(force: boolean = false) {
    try {
      if ($getPrefs('media.enableMediaDisplayButton')) {
        let type = 'yeartext'
        const backgrounds = $findAll(
          join($appPath(), 'media-window-background-image*')
        )

        // If no custom background, set yeartext as background
        if (backgrounds.length === 0) {
          const yeartext = await $getYearText(force)
          const root = document.createElement('div')
          root.innerHTML = yeartext ?? ''
          let yeartextString = ''
          for (let i = 0; i < root.children.length; i++) {
            yeartextString += root.children.item(i)?.textContent
          }
          store.commit('present/setBackground', yeartextString)
        } else {
          store.commit(
            'present/setBackground',
            pathToFileURL(backgrounds[0]).href
          )
          type = 'custom'
        }
        ipcRenderer.send('startMediaDisplay', $getAllPrefs())
        return type
      }
    } catch (e: any) {
      $log.error(e)
    }
  }
  inject('refreshBackgroundImgPreview', refreshBackgroundImgPreview)

  async function getMediaWindowDestination() {
    const mediaWinOptions = {
      destination: null,
      type: 'window',
    }

    try {
      if ($getPrefs('media.enableMediaDisplayButton')) {
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
      }
    } catch (e: any) {
      $log.error(e)
    }
    return mediaWinOptions
  }
  inject('getMediaWindowDestination', getMediaWindowDestination)
}

export default plugin

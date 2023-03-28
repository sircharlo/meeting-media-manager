import { Plugin } from '@nuxt/types'
import OBSWebSocket from 'obs-websocket-js-v5'
import OBSWebSocketV4 from 'obs-websocket-js'
import { OBS_AUTH_ERROR, OBS_CONNECTION_ERROR } from './../constants/general'
import { ObsPrefs } from '~/types'

let obs = null as OBSWebSocket | OBSWebSocketV4 | null

const plugin: Plugin = (
  {
    $getPrefs,
    $setPrefs,
    $log,
    $warn,
    $error,
    $setShortcut,
    $unsetShortcuts,
    store,
  },
  inject
) => {
  async function connectOBS(): Promise<OBSWebSocket | OBSWebSocketV4 | null> {
    const { enable, port, password, useV4 } = $getPrefs('app.obs') as ObsPrefs
    if (!enable && obs) {
      await resetOBS()
    } else if (enable) {
      if (obs) {
        const correctVersion =
          (useV4 && obs instanceof OBSWebSocketV4) ||
          (!useV4 && obs instanceof OBSWebSocket)
        if (correctVersion) {
          return obs
        }
      }

      try {
        if (useV4) {
          obs = new OBSWebSocketV4()

          // When OBS switches scenes, update current scene if not media scene
          obs.on('SwitchScenes', (newScene) => {
            try {
              if (
                newScene['scene-name'] &&
                newScene['scene-name'] !== $getPrefs('app.obs.mediaScene') &&
                newScene['scene-name'] !== $getPrefs('app.obs.zoomScene') &&
                newScene['scene-name'] !== $getPrefs('app.obs.imageScene')
              ) {
                store.commit('obs/setCurrentScene', newScene['scene-name'])
              }
            } catch (e: unknown) {
              $log.error(e)
            }
          })

          obs.on('ScenesChanged', async () => {
            await getScenes()
          })

          obs.on('SceneCollectionChanged', async () => {
            await getScenes()
          })

          obs.on('ConnectionOpened', () => {
            $log.info('OBS Success! Connected & authenticated.')
          })

          obs.on('AuthenticationFailure', async () => {
            $warn('errorObsAuth')
            await resetOBS()
          })

          obs.on('Exiting', () => {
            $log.info('Existing OBS...')
          })

          obs.on('error', async (e) => {
            if (e.error?.code === 'NOT_CONNECTED') {
              $warn('errorObs')
            } else if (e.error?.code === 'CONNECTION_ERROR') {
              $warn('errorObs')
            } else {
              $log.debug('OBS v4 onError')
              $error('errorObs', e.error ?? e)
            }
            await resetOBS()
          })

          try {
            await obs.connect({
              address: `localhost:${port}`,
              password: password as string,
            })
          } catch (e: any) {
            if (e.error === 'Authentication Failed.') {
              $warn('errorObsAuth')
            } else if (e.code === 'CONNECTION_ERROR') {
              $warn('errorObs')
            } else {
              $log.debug('OBS connect v4')
              $error('errorObs', e)
            }
            await resetOBS()
          }
        } else {
          obs = new OBSWebSocket()

          // When OBS switches scenes, update current scene if not media scene
          obs.on('CurrentProgramSceneChanged', (newScene) => {
            try {
              if (
                newScene.sceneName &&
                newScene.sceneName !== $getPrefs('app.obs.mediaScene') &&
                newScene.sceneName !== $getPrefs('app.obs.zoomScene') &&
                newScene.sceneName !== $getPrefs('app.obs.imageScene')
              ) {
                store.commit('obs/setCurrentScene', newScene.sceneName)
              }
            } catch (e: unknown) {
              $log.error(e)
            }
          })

          obs.on('SceneNameChanged', ({ oldSceneName, sceneName }) => {
            const camera = $getPrefs('app.obs.cameraScene')
            const media = $getPrefs('app.obs.mediaScene')

            if (oldSceneName === camera) {
              $setPrefs('app.obs.cameraScene', sceneName)
            } else if (oldSceneName === media) {
              $setPrefs('app.obs.mediaScene', sceneName)
            }
          })

          obs.on('SceneListChanged', async () => {
            await getScenes()
          })

          obs.on('ConnectionError', async (e) => {
            if (
              !e.stack?.includes('resetOBS') &&
              !e.stack?.includes('.disconnect')
            ) {
              $warn('errorObs')
              await resetOBS()
            }
          })

          obs.on('ConnectionOpened', () => {
            $log.info('OBS Success! Connected & authenticated.')
          })

          try {
            await obs.connect(`ws://127.0.0.1:${port}`, password as string)
          } catch (e: any) {
            if (e.code === OBS_AUTH_ERROR) {
              $warn('errorObsAuth')
            }
            // Caused by resetOBS trying to disconnect
            else if (e.code === OBS_CONNECTION_ERROR) {
              await resetOBS()
              return obs
            } else {
              $log.debug('OBS connect v5')
              $error('errorObs', e)
            }
            await resetOBS()
          }
        }
        store.commit('obs/setConnected', !!obs)
      } catch (e: any) {
        $log.debug('Unknown OBS error')
        $error('errorObs', e)
        await resetOBS()
      }
    }
    return obs
  }

  async function resetOBS(): Promise<void> {
    try {
      if (obs && obs instanceof OBSWebSocketV4) {
        obs.disconnect()
      } else if (obs) {
        await obs.disconnect()
      }
    } catch (e: unknown) {}

    obs = null
    store.commit('obs/clear')
    $unsetShortcuts('obs')
  }
  inject('resetOBS', resetOBS)

  async function getScenes(current = false): Promise<string | string[]> {
    try {
      let currentScene = ''
      let scenes: string[] = []
      if ($getPrefs('app.obs.useV4')) {
        obs = (await connectOBS()) as OBSWebSocketV4

        // Try once again if connection failed
        if (!store.state.obs.connected) {
          obs = (await connectOBS()) as OBSWebSocketV4
        }

        // Return empty list on second failure
        if (!obs || !store.state.obs.connected) return []

        // Get scene list and current scene from obs
        const result = await obs.send('GetSceneList')
        scenes = result.scenes.map(({ name }) => name)
        currentScene = result['current-scene']
      } else {
        obs = (await connectOBS()) as OBSWebSocket

        // Try once again if connection failed
        if (!store.state.obs.connected) {
          obs = (await connectOBS()) as OBSWebSocket
        }

        // Return empty list on second failure
        if (!obs || !store.state.obs.connected) return []

        // Get scene list and current scene from obs
        const result = await obs.call('GetSceneList')
        scenes = result.scenes
          .sort((a, b) => (b.sceneIndex as number) - (a.sceneIndex as number))
          .map(({ sceneName }) => sceneName as string)

        currentScene = result.currentProgramSceneName
      }

      if (!scenes.includes($getPrefs('app.obs.cameraScene') as string)) {
        $warn('errorObsCameraScene')
      }

      if (!scenes.includes($getPrefs('app.obs.mediaScene') as string)) {
        $warn('errorObsMediaScene')
      }

      const zoomScene = $getPrefs('app.obs.zoomScene') as string

      if (zoomScene && !scenes.includes(zoomScene)) {
        $warn('errorObsZoomScene')
      }

      store.commit('obs/setScenes', scenes)
      store.commit('obs/setCurrentScene', currentScene)

      // Set shortcuts for scenes
      for (const [i] of scenes
        .filter(
          (scene) =>
            scene !== $getPrefs('app.obs.mediaScene') &&
            scene !== $getPrefs('app.obs.zoomScene')
        )
        .entries()) {
        const MAX_SHORTCUT = 9
        if (i < MAX_SHORTCUT) {
          await $setShortcut(`ALT+${i + 1}`, 'setObsScene', 'obs')
        } else if (i === MAX_SHORTCUT) {
          await $setShortcut('ALT+0', 'setObsScene', 'obs')
        }
      }

      if (current) return currentScene
      return scenes
    } catch (e: any) {
      if (store.state.obs.connected) {
        if (
          e.error === 'There is no Socket connection available.' ||
          e.message === 'Socket not identified' ||
          e.message === 'Not connected'
        ) {
          $warn('errorObs')
          await resetOBS()
        } else {
          $log.debug(`getScenes(${current})`)
          $error('errorObs', e)
        }
      }
      return []
    }
  }
  inject('getScenes', getScenes)

  async function setScene(scene: string): Promise<void> {
    try {
      if ($getPrefs('app.obs.useV4')) {
        obs = (await connectOBS()) as OBSWebSocketV4
        if (!obs) return
        await obs.send('SetCurrentScene', { 'scene-name': scene })
      } else {
        obs = (await connectOBS()) as OBSWebSocket
        if (!obs) return
        await obs.call('SetCurrentProgramScene', { sceneName: scene })
      }
    } catch (e: any) {
      if (store.state.obs.connected) {
        if (
          e.error === 'There is no Socket connection available.' ||
          e.message === 'Not connected'
        ) {
          $warn('errorObs')
          await resetOBS()
        } else if (scene === $getPrefs('app.obs.cameraScene')) {
          $warn('errorObsCameraScene')
        } else if (scene === $getPrefs('app.obs.mediaScene')) {
          $warn('errorObsMediaScene')
        } else if (scene === $getPrefs('app.obs.zoomScene')) {
          $warn('errorObsZoomScene')
        } else if (
          e?.message?.includes('No source was found') ||
          e?.error?.includes('requested scene does not exist')
        ) {
          $warn('errorObsScene', { identifier: scene })
        } else {
          $log.debug(`setScene(${scene})`)
          $error('errorObs', e)
        }
      }
    }
  }
  inject('setScene', setScene)
}

export default plugin

import { Plugin } from '@nuxt/types'
import OBSWebSocket from 'obs-websocket-js-v5'
import OBSWebSocketV4 from 'obs-websocket-js'
import { ObsPrefs } from '~/types'

let obs = null as OBSWebSocket | OBSWebSocketV4 | null

const plugin: Plugin = (
  { $getPrefs, $log, $error, $setShortcut, $unsetShortcuts, store },
  inject
) => {
  async function connect() {
    const { enable, port, password, cameraScene, useV4 } = $getPrefs(
      'app.obs'
    ) as ObsPrefs
    if (!enable && obs) {
      resetOBS()
    } else if (enable && !obs) {
      try {
        if (useV4) {
          obs = new OBSWebSocketV4()

          // When OBS switches scenes, update current scene if not media scene
          obs.on('SwitchScenes', (newScene) => {
            try {
              if (
                newScene['scene-name'] &&
                newScene['scene-name'] !== $getPrefs('app.obs.mediaScene')
              ) {
                store.commit('obs/setCurrentScene', newScene['scene-name'])
              }
            } catch (e: any) {
              $log.error(e)
            }
          })

          obs.on('ConnectionOpened', () => {
            $log.info('OBS Success! Connected & authenticated.')
          })

          obs.on('error', (e) => {
            $error('errorObs', e.error)
          })

          await obs.connect({
            address: `localhost:${port}`,
            password: password as string,
          })
        } else {
          obs = new OBSWebSocket()

          // When OBS switches scenes, update current scene if not media scene
          obs.on('CurrentProgramSceneChanged', (newScene) => {
            try {
              if (
                newScene.sceneName &&
                newScene.sceneName !== $getPrefs('app.obs.mediaScene')
              ) {
                store.commit('obs/setCurrentScene', newScene.sceneName)
              }
            } catch (e: any) {
              $log.error(e)
            }
          })

          obs.on('ConnectionOpened', () => {
            $log.info('OBS Success! Connected & authenticated.')
          })

          try {
            await obs.connect(`wssL//127.0.0.1:${port}`, password as string)
          } catch (e: any) {
            $error('errorObs', e.error)
          }
        }
        store.commit('obs/setConnected', true)
        if (cameraScene) {
          setScene(cameraScene)
        }
      } catch (e: any) {
        store.commit('obs/clear')
        $error('errorObs', e)
      }
    }
    return obs
  }

  function resetOBS() {
    obs?.disconnect()
    obs = null
    store.commit('obs/clear')
    $unsetShortcuts('obs')
  }
  inject('resetOBS', resetOBS)

  inject('getScenes', async (current: boolean = false) => {
    try {
      if ($getPrefs('app.obs.useV4')) {
        const obs = (await connect()) as OBSWebSocketV4
        if (!obs) return []
        const result = await obs.send('GetSceneList')
        store.commit('obs/setScenes', result.scenes)
        store.commit('obs/setCurrentScene', result['current-scene'])

        // Set shortcuts for scenes
        for (const [i] of result.scenes
          .filter(({ name }) => name !== $getPrefs('app.obs.mediaScene'))
          .entries()) {
          await $setShortcut(`ALT+${i + 1}`, 'setObsScene', 'obs')
        }

        if (current) return result['current-scene']
        return store.state.obs.scenes
      } else {
        const obs = (await connect()) as OBSWebSocket
        if (!obs) return []
        const result = await obs.call('GetSceneList')
        store.commit('obs/setScenes', result.scenes)
        store.commit('obs/setCurrentScene', result.currentProgramSceneName)

        // Set shortcuts for scenes
        for (const [i] of result.scenes
          .filter(({ name }) => name !== $getPrefs('app.obs.mediaScene'))
          .entries()) {
          await $setShortcut(`ALT+${i + 1}`, 'setObsScene', 'obs')
        }

        if (current) return result.currentProgramSceneName
        return store.state.obs.scenes
      }
    } catch (e: any) {
      if (store.state.obs.connected) {
        $error('errorObs', e)
      }
      return []
    }
  })

  async function setScene(scene: string) {
    try {
      if ($getPrefs('app.obs.useV4')) {
        const obs = (await connect()) as OBSWebSocketV4
        if (!obs) return
        await obs.send('SetCurrentScene', { 'scene-name': scene })
      } else {
        const obs = (await connect()) as OBSWebSocket
        if (!obs) return
        await obs.call('SetCurrentProgramScene', { sceneName: scene })
      }
    } catch (e: any) {
      if (store.state.obs.connected) {
        $error('errorObs', e)
      }
    }
  }
  inject('setScene', setScene)
}

export default plugin

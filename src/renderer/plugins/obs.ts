import { Context } from '@nuxt/types'
import OBSWebSocket from 'obs-websocket-js'
import { ObsPrefs } from './../types/prefs'

let obs = null as OBSWebSocket | null

export default function (
  { $getPrefs, $log, $error, $setShortcut, $unsetShortcuts, store }: Context,
  inject: (argument0: string, argument1: unknown) => void
) {
  async function connect() {
    const { enable, port, password, mediaScene, cameraScene } = $getPrefs(
      'app.obs'
    ) as ObsPrefs
    if (!enable && obs) {
      obs.disconnect()
      obs = null
      store.commit('obs/clear')
      $unsetShortcuts('obs')
    } else if (enable && !obs) {
      try {
        obs = new OBSWebSocket()

        // When OBS switches scenes, update current scene if not media scene
        obs.on('SwitchScenes', (newScene) => {
          try {
            if (
              newScene &&
              newScene['scene-name'] &&
              newScene['scene-name'] !== mediaScene
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

  inject('getScenes', async (current: boolean = false) => {
    try {
      const obs = await connect()
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
    } catch (e: any) {
      if (store.state.obs.connected) {
        $error('errorObs', e)
      }
      return []
    }
  })

  async function setScene(scene: string) {
    try {
      const obs = await connect()
      if (!obs) return
      await obs.send('SetCurrentScene', { 'scene-name': scene })
    } catch (e: any) {
      if (store.state.obs.connected) {
        $error('errorObs', e)
      }
    }
  }
  inject('setScene', setScene)
}

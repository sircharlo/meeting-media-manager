import { Plugin } from '@nuxt/types'
import OBSWebSocket from 'obs-websocket-js-v5'
import OBSWebSocketV4 from 'obs-websocket-js'
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
  async function connect() {
    const { enable, port, password, useV4 } = $getPrefs('app.obs') as ObsPrefs
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

          obs.on('ScenesChanged', async () => {
            await getScenes()
          })

          obs.on('SceneCollectionChanged', async () => {
            await getScenes()
          })

          obs.on('ConnectionOpened', () => {
            $log.info('OBS Success! Connected & authenticated.')
          })

          obs.on('error', (e) => {
            console.warn('built in', e)
            if (e.error.code === 'NOT_CONNECTED') {
              $warn('errorObsNotRunning')
            } else if (e.error.code === 'CONNECTION_ERROR') {
              // OBS not running
              $warn('errorObsNotRunning')
            } else {
              $error('errorObs', e.error)
            }
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
              $error('errorObs', e)
            }
            console.warn('connect v4', e)
            resetOBS()
          }
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

          obs.on('SceneNameChanged', ({ oldSceneName, sceneName }) => {
            const camera = $getPrefs('app.obs.cameraScene')
            const media = $getPrefs('app.obs.mediaScene')
            const current = store.state.obs.currentScene

            if (oldSceneName === current) {
              store.commit('obs/setCurrentScene', sceneName)
            }

            if (oldSceneName === camera) {
              $setPrefs('app.obs.cameraScene', sceneName)
            } else if (oldSceneName === media) {
              $setPrefs('app.obs.mediaScene', sceneName)
            }
          })

          obs.on('SceneListChanged', async () => {
            await getScenes()
          })

          obs.on('ConnectionError', (e) => {
            console.warn('built in', e)
            $error('errorObs', e)
          })

          obs.on('ConnectionOpened', () => {
            $log.info('OBS Success! Connected & authenticated.')
          })

          try {
            await obs.connect(`ws://127.0.0.1:${port}`, password as string)
          } catch (e: any) {
            console.warn('connect v5', e)
            resetOBS()
            $error('errorObs', e)
            return
          }
        }
        store.commit('obs/setConnected', !!obs)
      } catch (e: any) {
        console.warn('last resort', e)
        resetOBS()
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

  async function getScenes(current: boolean = false) {
    try {
      let currentScene = ''
      let scenes: string[] = []
      if ($getPrefs('app.obs.useV4')) {
        const obs = (await connect()) as OBSWebSocketV4
        if (!obs) return []
        const result = await obs.send('GetSceneList')
        scenes = result.scenes.map(({ name }) => name)
        currentScene = result['current-scene']
      } else {
        const obs = (await connect()) as OBSWebSocket
        if (!obs) return []
        const result = await obs.call('GetSceneList')
        scenes = result.scenes
          .sort((a, b) => (b.sceneIndex as number) - (a.sceneIndex as number))
          .map(({ sceneName }) => sceneName as string)
        currentScene = result.currentProgramSceneName
      }

      store.commit('obs/setScenes', scenes)
      store.commit('obs/setCurrentScene', currentScene)

      // Set shortcuts for scenes
      for (const [i] of scenes
        .filter((scene) => scene !== $getPrefs('app.obs.mediaScene'))
        .entries()) {
        await $setShortcut(`ALT+${i + 1}`, 'setObsScene', 'obs')
      }

      if (current) return currentScene
      return scenes
    } catch (e: any) {
      if (store.state.obs.connected) {
        console.warn('getScenes', e)
        $error('errorObs', e)
      }
      return []
    }
  }
  inject('getScenes', getScenes)

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
        console.warn('setScene', e)
        $error('errorObs', e)
      }
    }
  }
  inject('setScene', setScene)
}

export default plugin

import { Plugin } from '@nuxt/types'
import { EmbeddedClient } from '@zoomus/websdk/embedded'
import { ZoomPrefs } from '@/types'

const plugin: Plugin = (
  { $getPrefs, $log, $axios, $config, store },
  inject
) => {
  async function connectZoom() {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    const { enable, id, password, name } = $getPrefs('app.zoom') as ZoomPrefs

    if (!client || !enable || !id || !password || !name) {
      if (client) {
        client.off('user-updated', setCoHost)
      }
      store.commit('zoom/clear')
      return
    }

    try {
      await client.join({
        sdkKey: $config.zoomSdkKey,
        meetingNumber: id,
        password,
        userName: name,
        signature: (
          await $axios.$post($config.zoomSignatureEndpoint, {
            meetingNumber: id,
            role: 0,
          })
        ).signature,
      })

      client.on('user-updated', setCoHost)

      store.commit('zoom/setConnected', true)
    } catch (e: unknown) {
      $log.error(e)
    }
  }
  inject('connectZoom', connectZoom)

  function setCoHost() {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (client) {
      store.commit('zoom/setCoHost', client.isCoHost())
    }
  }
}

export default plugin

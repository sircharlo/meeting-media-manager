/* eslint-disable no-magic-numbers */
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

  inject('toggleAllowUnmute', (socket: WebSocket, allow: boolean) => {
    sendToWebSocket(socket, 4149, `{"bOn":${allow}}`)
  })

  inject('muteAll', (socket: WebSocket) => {
    sendToWebSocket(socket, 8201, `{"bMute":true}`)
  })

  inject('toggleAudio', (socket: WebSocket, enable: boolean) => {
    sendToWebSocket(socket, 8203, `{"bOn":${enable}}`)
  })

  inject('toggleMic', (socket: WebSocket, mute: boolean) => {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (client) {
      sendToWebSocket(
        socket,
        8193,
        `{"bMute":${mute}},"id":${client.getCurrentUser()?.userId}`
      )
    }
  })

  inject('toggleVideo', (socket: WebSocket, enable: boolean) => {
    sendToWebSocket(socket, 12297, `{"bOn":${enable}}`)
  })

  inject('toggleSplotlight', (socket: WebSocket, enable: boolean) => {
    if (enable) {
      const client = store.state.zoom.client as typeof EmbeddedClient | null
      if (client) {
        sendToWebSocket(
          socket,
          4219,
          `{"bReplace":false,"bSpotlight":true,"id":${
            client.getCurrentUser()?.userId
          }}`
        )
      }
    } else {
      sendToWebSocket(socket, 4219, `{"bUnSpotlightAll":true}`)
    }
  })

  function sendToWebSocket(socket: WebSocket, event: number, body: string) {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (client) {
      const sequence = store.state.zoom.sequence as number
      socket.send(`{"evt":${event},"body":${body},"seq":${sequence}}`)
      store.commit('zoom/increaseSequence')
    }
  }

  function setCoHost() {
    console.log('setcohost')
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (client) {
      console.log('cohost', client.isCoHost())
      store.commit('zoom/setCoHost', client.isCoHost())
    }
  }
}

export default plugin

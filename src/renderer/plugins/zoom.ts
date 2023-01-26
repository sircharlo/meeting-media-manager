import { Plugin } from '@nuxt/types'
import { EmbeddedClient } from '@zoomus/websdk/embedded'
import { ZoomPrefs } from '@/types'

const plugin: Plugin = (
  { $getPrefs, $warn, $notify, $log, $axios, $config, store },
  inject
) => {
  async function connectZoom() {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    const { enable, id, password, name } = $getPrefs('app.zoom') as ZoomPrefs

    if (!client || !enable || !id || !password || !name) {
      if (client) {
        client.off('user-updated', setUserProps)
      }
      store.commit('zoom/clear')
      return
    }

    $notify('remindNeedCoHost')

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
      client.on('user-updated', setUserProps)
      store.commit('zoom/setConnected', true)
    } catch (e: unknown) {
      $log.error(e)
    }
  }
  inject('connectZoom', connectZoom)

  inject('startMeeting', (socket: WebSocket) => {
    if (!store.state.zoom.coHost) {
      $warn('errorNotCoHost')
    }
    toggleAllowUnmute(socket, false)
    muteAll(socket)
    toggleAudio(socket, true)
    toggleVideo(socket, true)
    toggleMic(socket, false)
    if ($getPrefs('app.zoom.spotlight')) {
      toggleSplotlight(socket, true)
    }
  })

  inject('stopMeeting', (socket: WebSocket) => {
    if (!store.state.zoom.coHost) {
      $warn('errorNotCoHost')
    }
    toggleSplotlight(socket, false)
    toggleAudio(socket, false)
    toggleVideo(socket, false)
    toggleAllowUnmute(socket, true)
  })

  function toggleAllowUnmute(socket: WebSocket, allow: boolean) {
    sendToWebSocket(socket, {
      evt: 4149,
      body: { bOn: allow },
    })
  }

  function muteAll(socket: WebSocket) {
    sendToWebSocket(socket, {
      evt: 8201,
      body: { bMute: true },
    })
  }

  function toggleAudio(socket: WebSocket, enable: boolean) {
    sendToWebSocket(socket, {
      evt: 8203,
      body: { bOn: enable },
    })
  }

  function toggleMic(socket: WebSocket, mute: boolean) {
    sendToWebSocket(
      socket,
      {
        evt: 8193,
        body: { bMute: mute },
      },
      true
    )
  }

  function toggleVideo(_: WebSocket, enable: boolean) {
    /* sendToWebSocket(
      socket,
      {
        evt: 12297,
        body: { bOn: !enable },
      },
      true
    )
    sendToWebSocket(socket, {
      evt: 4167,
      body: {},
    }) */
    store.commit('zoom/toggleVideo', enable)
  }

  function toggleSplotlight(socket: WebSocket, enable: boolean) {
    if (enable) {
      sendToWebSocket(
        socket,
        {
          evt: 4219,
          body: { bReplace: false, bSpotlight: true },
        },
        true
      )
    } else {
      sendToWebSocket(socket, {
        evt: 4219,
        body: { bUnSpotlightAll: true },
      })
    }
  }

  function sendToWebSocket(
    socket: WebSocket,
    msg: { evt: number; body: { [key: string]: any }; seq?: number },
    withUser = false
  ) {
    if (!socket) {
      $warn('errorNoSocket')
      return
    }
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (client) {
      const sequence = store.state.zoom.sequence as number
      msg.seq = sequence
      if (withUser) {
        msg.body.id = client.getCurrentUser()?.userId
      }
      socket.send(JSON.stringify(msg))
      store.commit('zoom/increaseSequence')
    }
  }

  function setUserProps() {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (client) {
      store.commit('zoom/setCoHost', client.isCoHost())
      store.commit('zoom/setVideo', !!client.getCurrentUser()?.bVideoOn)
    }
  }
}

export default plugin

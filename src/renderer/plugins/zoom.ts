/* eslint-disable camelcase */
import { Plugin } from '@nuxt/types'
import {
  EmbeddedClient,
  event_user_added,
  event_user_updated,
} from '@zoomus/websdk/embedded'
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
        client.off('user-added', onUserAdded)
      }
      store.commit('zoom/clear')
      return
    }

    $notify('remindNeedCoHost')

    if (!$config.zoomSdkKey) {
      console.warn('No Zoom SDK Key provided')
    }

    if (!$config.zoomSignatureEndpoint) {
      console.warn('No Zoom Signature Endpoint provided')
    }

    try {
      await client.join({
        sdkKey: $config.zoomSdkKey,
        meetingNumber: id,
        password,
        userName: name,
        error: (e: unknown) => {
          console.debug('Caught join error')
          $log.error(e)
        },
        signature: (
          await $axios.$post($config.zoomSignatureEndpoint, {
            meetingNumber: id,
            role: 0,
          })
        ).signature,
      })
      client.on('user-updated', setUserProps)
      client.on('user-added', onUserAdded)
      store.commit('zoom/setConnected', true)
    } catch (e: unknown) {
      console.debug('caught Zoom error')
      $log.error(e)
    }
  }
  inject('connectZoom', connectZoom)

  inject('startMeeting', async (socket: WebSocket) => {
    if (!store.state.zoom.coHost) {
      $warn('errorNotCoHost')
    } else {
      store.commit('zoom/setStarted', true)
    }
    toggleAllowUnmute(socket, false)
    await muteAll(socket)
    toggleAudio(socket, true)
    toggleVideo(socket, true)
    await toggleMic(socket, false)
    if ($getPrefs('app.zoom.spotlight')) {
      toggleSplotlight(socket, true)
    }
  })

  inject('stopMeeting', (socket: WebSocket) => {
    if (!store.state.zoom.coHost) {
      $warn('errorNotCoHost')
    } else {
      store.commit('zoom/setStarted', false)
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

  async function rename(
    socket: WebSocket | null,
    name: string,
    user: { id: number; name?: string }
  ) {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (!client) return
    try {
      await client.rename(name, user.id)
    } catch (e: unknown) {
      sendToWebSocket(socket, {
        evt: 4109,
        body: {
          id: user.id,
          dn2: window.btoa(name),
          olddn2: window.btoa(user.name ?? ''),
        },
      })
    }
  }

  async function muteAll(socket: WebSocket) {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (!client) return
    try {
      await client.muteAll(true)
    } catch (e: unknown) {
      sendToWebSocket(socket, {
        evt: 8201,
        body: { bMute: true },
      })
    }
  }

  function toggleAudio(socket: WebSocket, enable: boolean) {
    sendToWebSocket(socket, {
      evt: 8203,
      body: { bOn: enable },
    })
  }

  async function toggleMic(socket: WebSocket, mute: boolean) {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (!client) return
    try {
      await client.mute(mute)
    } catch (e: unknown) {
      sendToWebSocket(
        socket,
        {
          evt: 8193,
          body: { bMute: mute },
        },
        true
      )
    }
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
    socket: WebSocket | null,
    msg: { evt: number; body: { [key: string]: any }; seq?: number },
    withUser = false
  ) {
    let webSocket = store.state.zoom.websocket as WebSocket | null
    if (!webSocket) {
      if (socket) {
        webSocket = socket
        store.commit('zoom/setWebSocket', socket)
      } else {
        $warn('errorNoSocket')
        return
      }
    }
    store.commit('zoom/setWebSocket', socket)
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (client) {
      const sequence = store.state.zoom.sequence as number
      msg.seq = sequence
      if (withUser) {
        msg.body.id = client.getCurrentUser()?.userId
      }
      webSocket.send(JSON.stringify(msg))
      store.commit('zoom/increaseSequence')
    }
  }

  const onUserAdded: typeof event_user_added = (payload) => {
    console.log('user added:', payload)
    // @ts-ignore
    const users = payload as (typeof payload)[]
    users
      .filter((user) => !user.bHold)
      .forEach((user) => {
        const renameList = $getPrefs('app.zoom.autoRename') as string[]
        const names = renameList.map((name) => {
          const [old, new_] = name.split('=')
          return { old: old.trim(), new: new_.trim() }
        })
        const name = names.find((name) => name.old === user.displayName)
        if (name) {
          console.log('renaming...')
          rename(null, name.new, {
            id: user.userId,
            name: name.old,
          })
        }
      })
  }

  const setUserProps: typeof event_user_updated = () => {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (!client) return
    store.commit('zoom/setCoHost', client.isCoHost())
    store.commit('zoom/setVideo', client.getCurrentUser()?.bVideoOn)
  }
}

export default plugin

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
      await client
        .join({
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
        .catch((e: unknown) => {
          console.debug('Caught join promise error')
          $log.error(e)
        })
      client.on('user-updated', setUserProps)
      client.on('user-added', onUserAdded)
      store.commit('zoom/setConnected', true)
      store.commit('zoom/setParticipants', client.getAttendeeslist())
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

    const userID = store.state.zoom.userID as number
    const hostID = store.state.zoom.hostID as number
    const automateAudio = $getPrefs('app.zoom.automateAudio') as boolean

    toggleAllowUnmute(socket, false)
    await muteAll(socket)
    if (automateAudio) toggleAudio(socket, true)
    toggleVideo(socket, true, hostID)
    await toggleMic(socket, false, automateAudio ? userID : hostID)
    if (automateAudio || $getPrefs('app.zoom.spotlight')) {
      toggleSplotlight(socket, true, hostID)
    }
  })

  inject('stopMeeting', (socket: WebSocket) => {
    if (!store.state.zoom.coHost) {
      $warn('errorNotCoHost')
    } else {
      store.commit('zoom/setStarted', false)
    }

    const hostID = store.state.zoom.hostID as number
    const automateAudio = $getPrefs('app.zoom.automateAudio') as boolean

    toggleSplotlight(socket, false)
    if (automateAudio) toggleAudio(socket, false)
    toggleVideo(socket, false, hostID)
    toggleAllowUnmute(socket, true)
  })

  inject('muteParticipants', (socket: WebSocket) => {
    if (!store.state.zoom.coHost) {
      $warn('errorNotCoHost')
      return
    }

    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (!client) return

    const openParticipants = client
      .getAttendeeslist()
      .filter((p) => !p.isHost && !p.isCoHost && !p.muted)
    openParticipants.forEach((p) => {
      toggleMic(socket, true, p.userId)
      lowerHand(socket, p.userId)
    })
  })

  function lowerHand(socket: WebSocket, userID: number) {
    sendToWebSocket(
      socket,
      {
        evt: 4131,
        body: { bOn: false },
      },
      true,
      userID
    )
  }

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

  async function toggleMic(socket: WebSocket, mute: boolean, userID?: number) {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (!client) return
    try {
      await client.mute(mute, userID)
    } catch (e: unknown) {
      sendToWebSocket(
        socket,
        {
          evt: 8193,
          body: { bMute: mute },
        },
        true,
        userID
      )
    }
  }

  function toggleVideo(socket: WebSocket, enable: boolean, userID: number) {
    sendToWebSocket(
      socket,
      {
        evt: 12297,
        body: { bOn: !enable },
      },
      true,
      userID
    )
  }

  function toggleSplotlight(
    socket: WebSocket,
    enable: boolean,
    userID?: number
  ) {
    if (enable) {
      sendToWebSocket(
        socket,
        {
          evt: 4219,
          body: { bReplace: false, bSpotlight: true },
        },
        true,
        userID
      )
    } else {
      sendToWebSocket(socket, {
        evt: 4219,
        body: { bUnSpotlightAll: true },
      })
    }
  }
  inject('toggleSpotlight', toggleSplotlight)

  function sendToWebSocket(
    socket: WebSocket | null,
    msg: { evt: number; body: { [key: string]: any }; seq?: number },
    withUser = false,
    userID?: number
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
        msg.body.id = userID ?? client.getCurrentUser()?.userId
      }
      webSocket.send(JSON.stringify(msg))
      store.commit('zoom/increaseSequence')
    }
  }

  const onUserAdded: typeof event_user_added = (payload) => {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (client) {
      const participants = client.getAttendeeslist()
      store.commit('zoom/setParticipants', participants)
    }

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
        const name = names.find(
          (name) =>
            name.old.toLowerCase() === user.displayName?.trim().toLowerCase()
        )
        if (name) {
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
    const host = client.getAttendeeslist().find((user) => user.isHost)
    store.commit('zoom/setUserID', client.getCurrentUser()?.userId)
    store.commit('zoom/setHostID', host?.userId)
    store.commit('zoom/setCoHost', client.isCoHost())
  }
}

export default plugin

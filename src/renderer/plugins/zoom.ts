/* eslint-disable camelcase */
import { Plugin } from '@nuxt/types'
import {
  EmbeddedClient,
  event_user_added,
  event_user_updated,
} from '@zoomus/websdk/embedded'
import { ZoomPrefs } from '@/types'

const plugin: Plugin = (
  { $getPrefs, $warn, $notify, $axios, $config, store },
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
          error: () => {
            console.debug('Caught join error')
          },
          signature: (
            await $axios.$post($config.zoomSignatureEndpoint, {
              meetingNumber: id,
              role: 0,
            })
          ).signature,
        })
        .catch(() => {
          console.debug('Caught join promise error')
        })
      client.on('user-updated', setUserProps)
      client.on('user-added', onUserAdded)
      store.commit('zoom/setConnected', true)
      setUserProps({ userId: 0, bCoHost: false })
    } catch (e: unknown) {
      console.debug('caught Zoom error')
    }
  }
  inject('connectZoom', connectZoom)

  async function startMeeting(socket: WebSocket | null) {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (!store.state.zoom.coHost || !client) {
      $warn('errorNotCoHost')
      if (!client) return
    } else {
      store.commit('zoom/setStarted', true)
    }

    const hostID = store.state.zoom.hostID as number

    toggleAllowUnmute(socket, false)
    await muteAll(socket)
    toggleVideo(socket, true, hostID)
    await toggleMic(socket, false, hostID)
    if ($getPrefs('app.zoom.spotlight')) {
      toggleSplotlight(socket, true, hostID)
    }
  }
  inject('startMeeting', startMeeting)

  function stopMeeting(socket: WebSocket) {
    if (!store.state.zoom.coHost) {
      $warn('errorNotCoHost')
    } else {
      store.commit('zoom/setStarted', false)
    }

    const hostID = store.state.zoom.hostID as number
    toggleSplotlight(socket, false)
    toggleVideo(socket, false, hostID)
    toggleAllowUnmute(socket, true)
  }
  inject('stopMeeting', stopMeeting)

  inject('muteParticipants', (socket: WebSocket) => {
    if (!store.state.zoom.coHost) {
      $warn('errorNotCoHost')
      return
    }

    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (!client) return

    const spotlights = store.state.zoom.spotlights as number[]
    const openParticipants = client
      .getAttendeeslist()
      .filter(
        (p) =>
          !p.isHost && !p.isCoHost && !p.muted && !spotlights.includes(p.userId)
      )
    openParticipants.forEach((p) => {
      toggleMic(socket, true, p.userId)
      lowerHand(socket, p.userId)
    })
  })

  function lowerHand(socket: WebSocket | null, userID: number) {
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

  async function toggleOnHold(
    socket: WebSocket | null,
    onHold: boolean,
    userID: number
  ) {
    const client = store.state.zoom.client as typeof EmbeddedClient | null
    if (!client) return
    try {
      if (onHold) {
        await client.putOnHold(userID, onHold)
      } else {
        await client.admit(userID)
      }
    } catch (e: unknown) {
      sendToWebSocket(
        socket,
        {
          evt: 4113,
          body: { bHold: onHold },
        },
        true,
        userID
      )
    }
  }
  inject('toggleOnHold', toggleOnHold)

  function toggleAllowUnmute(socket: WebSocket | null, allow: boolean) {
    sendToWebSocket(socket, {
      evt: 4149,
      body: { bOn: allow },
    })
  }

  function encodeName(name?: string) {
    if (!name) return ''
    try {
      return Buffer.from(name).toString('base64')
    } catch (e: unknown) {
      console.warn('Failed to encode name:', name)
    }
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
          dn2: encodeName(name),
          olddn2: encodeName(user.name),
        },
      })
    }
  }
  inject('renameParticipant', rename)

  async function muteAll(socket: WebSocket | null) {
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

  async function toggleMic(
    socket: WebSocket | null,
    mute: boolean,
    userID?: number
  ) {
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
  inject('toggleMic', toggleMic)

  function toggleVideo(
    socket: WebSocket | null,
    enable: boolean,
    userID: number
  ) {
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
    socket: WebSocket | null,
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
      setUserProps(payload)
    }

    console.debug('User added', payload)

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
    const userIsHost = client.isHost()
    const participants = client.getAttendeeslist()
    if (userIsHost && !!store.state.zoom.hostID) {
      client.makeCoHost(store.state.zoom.hostID as number)
    } else if (!userIsHost) {
      const host = participants.find((user) => user.isHost)
      console.debug('host', host)
      store.commit('zoom/setHostID', host?.userId)
    }
    store.commit('zoom/setParticipants', participants)
    store.commit('zoom/setUserID', client.getCurrentUser()?.userId)
    store.commit('zoom/setCoHost', userIsHost || client.isCoHost())
  }
}

export default plugin

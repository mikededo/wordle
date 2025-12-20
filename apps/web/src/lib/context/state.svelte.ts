import { getContext, setContext } from 'svelte'

import { goto } from '$app/navigation'
import { GameConnection } from '$lib/service'

const CONTEXT_KEY = Symbol.for('global:state')

type AppState = {
  connection: GameConnection | null
  user: {
    hasGameStarted: boolean
    playerName: string
    room: string
  } | null
}
const appState = $state<AppState>({
  connection: null,
  user: null
})

export const initContext = () => {
  setContext(CONTEXT_KEY, appState)
}
export const getAppContext = () => {
  const context = getContext<AppState | undefined>(CONTEXT_KEY)
  if (!context) {
    throw new Error('App context not initialized')
  }

  return context
}

type CreateRoomAndConnectOptions = {
  playerName: string
  onError?: () => void
  onSuccess?: () => void
  room?: string
}
export const connectToRoom = async (options: CreateRoomAndConnectOptions) => {
  appState.connection = new GameConnection({
    onClose: () => {
      goto('/')
    },
    onConnect: () => {
      if (!options.room) {
        appState.connection!.createRoom(options.playerName)
      } else {
        appState.connection!.joinRoom(options.room, options.playerName)
      }
    },
    onError: () => {
      options.onError?.()
    },
    onGameStarted: () => {
      if (!appState.user) {
        return
      }

      appState.user = { ...appState.user!, hasGameStarted: true }
    },
    onRoomCreated: (response) => {
      appState.user = {
        hasGameStarted: false,
        playerName: options.playerName,
        room: response
      }
      options.onSuccess?.()
      goto(`/game/${response}`)
    },
    onRoomJoined: (response) => {
      appState.user = {
        hasGameStarted: false,
        playerName: options.playerName,
        room: response
      }
      options.onSuccess?.()
      goto(`/game/${response}`)
    }
  })
}

export const disconnectFromRoom = () => {
  appState.connection?.close()
  goto('/')
}

export const startGame = () => {
  if (!appState.user || !appState.connection) {
    return
  }

  appState.connection.startGame(appState.user.room)
}

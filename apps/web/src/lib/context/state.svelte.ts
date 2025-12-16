import { getContext, setContext } from 'svelte'

import { goto } from '$app/navigation'
import { GameConnection } from '$lib/service'

const CONTEXT_KEY = Symbol.for('global:state')

type AppState = {
  connection: GameConnection | null
  user: {
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
  onError?: () => void
  onSuccess?: () => void
}
export const createRoomAndConnect = async (playerName: string, options: CreateRoomAndConnectOptions = {}) => {
  appState.connection = new GameConnection({
    onError: () => {
      options.onError?.()
    },
    onRoomCreated: (response) => {
      appState.user = {
        playerName,
        room: response
      }
      options.onSuccess?.()
      goto(`/game/${response}`)
    }
  })

  if (!appState.connection) {
    return
  }

  setTimeout(() => {
    appState.connection!.createRoom(playerName)
  }, 250)
}

export const disconnectFromRoom = () => {
  appState.connection?.close()
  goto('/')
}

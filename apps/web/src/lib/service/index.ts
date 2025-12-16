import type { CreateRoomMessage, ServerMessage } from '@wordle/server'

import { ServerMessageSchema } from '@wordle/server'
import { fromThrowable } from 'neverthrow'
import * as v from 'valibot'

const safeJSONParse = fromThrowable(JSON.parse)

type GameConnectionOptions = {
  onRoomCreated: (code: string) => void
  onError?: (reason: string) => void
  onMessage?: (message: ServerMessage) => void
}

export class GameConnection {
  private isClosed: boolean = false

  private ws: WebSocket

  constructor(private options: GameConnectionOptions) {
    this.ws = new WebSocket('ws://localhost:3001')

    this.ws.addEventListener('message', (event) => {
      console.log('WebSocket message received')
      if (!event.data) {
        return
      }

      const maybeParsed = safeJSONParse(event.data)
      if (maybeParsed.isErr()) {
        console.error('Failed to parse message', maybeParsed.error)
        return
      }
      const maybeMessage = v.safeParse(ServerMessageSchema, maybeParsed.value)
      if (!maybeMessage.success) {
        console.error('Invalid message format')
        return
      }

      const data = maybeMessage.output
      switch (data.type) {
        case 'room_created':
          this.options.onRoomCreated(data.code)
          break
        default:
          console.log('Unhandled message type:', data.type)
      }
    })
    this.ws.addEventListener('error', (e) => {
      console.log('WebSocket error', e)
      this.options.onError?.('Connection error')
    })
    this.ws.addEventListener('close', (event) => {
      console.log('WebSocket closed', event)

      this.isClosed = true
      if (event.code !== 1000 || !event.wasClean) {
        this.options.onError?.('An error occurred')
      }
    })
  }

  close() {
    if (this.isClosed) {
      return
    }

    this.ws.close()
  }

  createRoom(playerName: string) {
    if (this.isClosed) {
      return
    }

    const message: CreateRoomMessage = {
      playerName,
      type: 'create_room'
    }
    this.ws.send(JSON.stringify(message))
  }
}


import type { Result } from 'neverthrow'

import type { ClientMessage, InternalWebSocket, RoomError, ServerMessage } from '$lib/room/types'

import { err, ok } from 'neverthrow'
import * as v from 'valibot'

import { broadcast, createRoom, getRoom, joinRoom, leaveRoom } from '$lib/room/manager'
import { ClientMessageSchema } from '$lib/room/schemas'

const send = (ws: InternalWebSocket, message: ServerMessage) => {
  ws.send(JSON.stringify(message))
}

const parseMessage = (data: string): Result<ClientMessage, RoomError> => {
  try {
    const parsed = JSON.parse(data)
    const result = v.safeParse(ClientMessageSchema, parsed)

    if (!result.success) {
      return err('INVALID_MESSAGE')
    }

    return ok(result.output)
  } catch {
    return err('INVALID_MESSAGE')
  }
}

const errorMessage = (error: RoomError): string => {
  switch (error) {
    case 'GAME_IN_PROGRESS':
      return 'Game already in progress'
    case 'INVALID_MESSAGE':
      return 'Invalid message format'
    case 'ROOM_NOT_FOUND':
      return 'Room not found'
  }
}

export const handleMessage = (ws: InternalWebSocket, data: string) => {
  parseMessage(data)
    .andThen((message) => {
      switch (message.type) {
        case 'create_room':
          return createRoom(ws, message.playerName).map((code) =>
            send(ws, { code, type: 'room_created' })
          )

        case 'join_room':
          return joinRoom(ws, message.code, message.playerName).map(({ code, players }) => {
            send(ws, { code, players, type: 'room_joined' })
            const room = getRoom(code)
            if (room) {
              broadcast(room, { playerName: message.playerName, type: 'player_joined' }, ws)
            }

            return null
          })

        case 'leave_room': {
          const result = leaveRoom(ws)
          if (result && result.room.players.size > 0) {
            broadcast(result.room, { playerName: result.player.name, type: 'player_left' })
          }

          return ok()
        }
      }
    })
    .mapErr((error) => {
      send(ws, { message: errorMessage(error), type: 'error' })
    })
}

export const handleClose = (ws: InternalWebSocket) => {
  const result = leaveRoom(ws)
  if (result && result.room.players.size > 0) {
    broadcast(result.room, { playerName: result.player.name, type: 'player_left' })
  }
}

export const handleJoin = (ws: InternalWebSocket, code: string, playerName: string) => {
  joinRoom(ws, code, playerName)
    .map(({ code, players }) => {
      send(ws, { code, players, type: 'room_joined' })

      return null
    })
    .mapErr((error) => {
      send(ws, { message: errorMessage(error), type: 'error' })
    })
}


import type { Result } from 'neverthrow'

import type { ClientMessage } from '$lib/room/schemas'
import type { InternalWebSocket, ServerMessage } from '$lib/room/types'

import { err, ok } from 'neverthrow'
import * as v from 'valibot'

import { createRoom, getRoom, joinRoom, leaveRoom, roomBroadcast, startGame } from '$lib/room/manager'
import { ClientMessageSchema } from '$lib/room/schemas'
import { RoomError } from '$lib/room/types'

const send = (ws: InternalWebSocket, message: ServerMessage) => {
  ws.send(JSON.stringify(message))
}

const parseMessage = (data: string): Result<ClientMessage, RoomError> => {
  try {
    const parsed = JSON.parse(data)
    const result = v.safeParse(ClientMessageSchema, parsed)

    if (!result.success) {
      return err(RoomError.InvalidMessage)
    }

    return ok(result.output)
  } catch {
    return err(RoomError.InvalidMessage)
  }
}

const errorMessage = (error: RoomError): string => {
  switch (error) {
    case RoomError.GameInProgress:
      return 'Game already in progress'
    case RoomError.InvalidMessage:
      return 'Invalid message format'
    case RoomError.InvalidRoomCode:
      return 'Invalid room code'
    case RoomError.RoomNotFound:
      return 'Room not found'
  }
}

export const handleMessage = (ws: InternalWebSocket, data: string) => {
  parseMessage(data)
    .andThen((message) => {
      switch (message.type) {
        case 'create_room':
          return createRoom(ws, message.playerName).map((code) => {
            send(ws, { code, type: 'room_created' })
          })
        case 'join_room':
          return joinRoom(ws, message.code, message.playerName).map(({ code, players }) => {
            send(ws, { code, players, type: 'room_joined' })
            const room = getRoom(code)
            if (room) {
              roomBroadcast(room, { playerName: message.playerName, type: 'player_joined' }, ws)
            }

            return null
          })
        case 'leave_room': {
          const result = leaveRoom(ws)
          if (result && result.room.players.size > 0) {
            roomBroadcast(result.room, { playerName: result.player.name, type: 'player_left' })
          }

          return ok()
        }

        case 'start_game':
          return startGame(message.room)
      }
    })
    .mapErr((error) => {
      send(ws, { message: errorMessage(error), type: 'error' })
    })
}

export const handleClose = (ws: InternalWebSocket) => {
  const result = leaveRoom(ws)
  if (result && result.room.players.size > 0) {
    roomBroadcast(result.room, { playerName: result.player.name, type: 'player_left' })
  }
}

export const handleJoin = (ws: InternalWebSocket, code: string, playerName: string) => {
  joinRoom(ws, code, playerName)
    .map(({ code, players }) => {
      send(ws, { code, players, type: 'room_joined' })
    })
    .mapErr((error) => {
      send(ws, { message: errorMessage(error), type: 'error' })
    })
}


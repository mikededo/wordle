import type { ServerWebSocket } from 'bun'

import * as v from 'valibot'

export type RoomState = 'finished' | 'lobby' | 'playing'

export const ServerMessageSchema = v.variant('type', [
  v.object({
    message: v.string(),
    type: v.literal('error')
  }),
  v.object({
    playerName: v.string(),
    type: v.literal('player_joined')
  }),
  v.object({
    playerName: v.string(),
    type: v.literal('player_left')
  }),
  v.object({
    code: v.string(),
    players: v.array(v.string()),
    type: v.literal('room_joined')
  }),
  v.object({
    code: v.string(),
    type: v.literal('room_created')
  })
])

export type ServerMessage = v.InferOutput<typeof ServerMessageSchema>

export type RoomError = 'GAME_IN_PROGRESS' | 'INVALID_MESSAGE' | 'ROOM_NOT_FOUND'

export type InternalWebSocket = ServerWebSocket<unknown>

export type Player = {
  name: string
  ws: InternalWebSocket
}

export type Room = {
  createdAt: number
  lastActivity: number
  players: Map<InternalWebSocket, Player>
  state: RoomState
  code: string
  host: InternalWebSocket
}


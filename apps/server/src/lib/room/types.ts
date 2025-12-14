import type { ServerWebSocket } from 'bun'
import type * as v from 'valibot'

import type { ClientMessageSchema } from '$lib/room/schemas'

export type ClientMessage = v.InferOutput<typeof ClientMessageSchema>

export type RoomState = 'finished' | 'lobby' | 'playing'

export type ServerMessage = |
  { message: string, type: 'error' } |
  { playerName: string, type: 'player_joined' } |
  { playerName: string, type: 'player_left' } |
  { players: string[], type: 'room_joined', code: string } |
  { type: 'room_created', code: string }

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


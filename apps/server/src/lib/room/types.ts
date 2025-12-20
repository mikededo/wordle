import type { ServerWebSocket } from 'bun'

import type { RoomCode } from './code'

import * as v from 'valibot'

import { RoomCodeSchema } from './code'

export enum RoomState {
  Finished,
  Lobby,
  Playing
}

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
    code: RoomCodeSchema,
    players: v.array(v.string()),
    type: v.literal('room_joined')
  }),
  v.object({
    code: RoomCodeSchema,
    type: v.literal('room_created')
  }),
  v.object({ type: v.literal('game_started') })
])

export type ServerMessage = v.InferOutput<typeof ServerMessageSchema>

export enum RoomError {
  GameInProgress,
  InvalidMessage,
  RoomNotFound,
  InvalidRoomCode
}

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
  code: RoomCode
  host: InternalWebSocket
}


import type { ServerWebSocket } from 'bun'

import type { GameState } from '$lib/game/types'

import type { RoomCode } from './code'

import * as v from 'valibot'

import { LetterResult } from '../game/types'
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
  v.object({ type: v.literal('game_started') }),
  v.object({
    round: v.number(),
    timeRemaining: v.number(),
    type: v.literal('round_started')
  }),
  v.object({
    isCorrect: v.boolean(),
    result: v.array(v.enum(LetterResult)),
    type: v.literal('answer_result')
  }),
  v.object({
    playerName: v.string(),
    submission: v.array(v.enum(LetterResult)),
    type: v.literal('player_submitted')
  }),
  v.object({
    playerName: v.string(),
    type: v.literal('player_won'),
    word: v.string()
  }),
  v.object({
    round: v.number(),
    type: v.literal('round_ended'),
    winner: v.union([v.string(), v.null()])
  }),
  v.object({
    correctWord: v.string(),
    scores: v.record(v.string(), v.number()),
    type: v.literal('game_ended'),
    winner: v.union([v.string(), v.null()])
  })
])

export type ServerMessage = v.InferOutput<typeof ServerMessageSchema>

export enum RoomError {
  GameInProgress = 'GameInProgress',
  InvalidMessage = 'InvalidMessage',
  InvalidRoomCode = 'InvalidRoomCode',
  RoomNotFound = 'RoomNotFound'
}

export enum GameError {
  AlreadySubmitted = 'AlreadySubmitted',
  GameNotStarted = 'GameNotStarted',
  InvalidAnswer = 'InvalidAnswer',
  NotYourTurn = 'NotYourTurn',
  RoundEnded = 'RoundEnded'
}

export type InternalWebSocket = ServerWebSocket<unknown>

export type Player = {
  name: string
  ws: InternalWebSocket
}

export type Room = {
  createdAt: number
  game: GameState | null
  lastActivity: number
  players: Map<InternalWebSocket, Player>
  state: RoomState
  code: RoomCode
  host: InternalWebSocket
}


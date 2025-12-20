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
  v.object({ type: v.literal('game_started') }),
  v.object({
    round: v.number(),
    timeRemaining: v.number(),
    type: v.literal('round_started')
  }),
  v.object({
    isCorrect: v.boolean(),
    result: v.array(v.picklist(['correct', 'present', 'absent'])),
    type: v.literal('answer_result')
  }),
  v.object({
    playerName: v.string(),
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

export const AnswerSchema = v.pipe(v.string(), v.regex(/[a-z]+/i), v.length(5), v.toUpperCase(), v.brand('Answer'))
export type Answer = v.InferOutput<typeof AnswerSchema>
export type AnswerResult = {
  result: LetterResult[]
  isCorrect: boolean
}

export type LetterResult = 'absent' | 'correct' | 'present'
export type RoundSubmission = {
  result: LetterResult[]
  submittedAt: number
  round: number
  word: string
}

export type GameState = {
  winner: null | string
  currentRound: number
  maxRounds: number
  roundStartedAt: number
  roundTimeoutId: null | Timer
  scores: Map<string, number>
  submissions: Map<string, RoundSubmission[]>
  targetWord: string
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


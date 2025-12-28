/* eslint-disable no-console */
import type { LetterResult, ServerMessage } from '@wordle/server'

import { ServerMessageSchema } from '@wordle/server'
import { fromThrowable } from 'neverthrow'
import * as v from 'valibot'

import { createRoomMessage, joinRoomMessage, startGameMessage, submitAnswerMessage } from './messages'

const safeJSONParse = fromThrowable(JSON.parse)

type GameConnectionOptions = {
  onClose: () => void
  onGameStarted: () => void
  onRoomCreated: (code: string) => void
  onRoomJoined: (code: string, players: string[]) => void
  onAnswerResult?: (isCorrect: boolean, result: LetterResult[]) => void
  onConnect?: () => void
  onError?: (reason: string) => void
  onGameEnded?: (correctWord: string, scores: Record<string, number>, winner: null | string) => void
  onMessage?: (message: ServerMessage) => void
  onPlayerJoined?: (playerName: string) => void
  onPlayerLeft?: (playerName: string) => void
  onPlayerSubmitted?: (playerName: string, guess: LetterResult[]) => void
  onPlayerWon?: (playerName: string, word: string) => void
  onRoundEnded?: (round: number, winner: null | string) => void
  onRoundStarted?: (round: number, timeRemaining: number) => void
}

export class GameConnection {
  private isClosed: boolean = false

  private ws: WebSocket

  constructor(private options: GameConnectionOptions) {
    this.ws = new WebSocket('ws://localhost:3000')

    this.ws.addEventListener('open', () => {
      this.options.onConnect?.()
    })

    this.ws.addEventListener('message', (event) => {
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

      this.options.onMessage?.(data)
      switch (data.type) {
        case 'answer_result':
          this.options.onAnswerResult?.(data.isCorrect, data.result)
          break
        case 'error':
          this.options.onError?.(data.message)
          break
        case 'game_ended':
          this.options.onGameEnded?.(data.correctWord, data.scores, data.winner)
          break
        case 'game_started':
          this.options.onGameStarted()
          break
        case 'player_joined':
          this.options.onPlayerJoined?.(data.playerName)
          break
        case 'player_left':
          this.options.onPlayerLeft?.(data.playerName)
          break
        case 'player_submitted':
          this.options.onPlayerSubmitted?.(data.playerName, data.submission)
          break
        case 'player_won':
          this.options.onPlayerWon?.(data.playerName, data.word)
          break
        case 'room_created':
          this.options.onRoomCreated(data.code)
          break
        case 'room_joined':
          this.options.onRoomJoined(data.code, data.players)
          break
        case 'round_ended':
          this.options.onRoundEnded?.(data.round, data.winner)
          break
        case 'round_started':
          this.options.onRoundStarted?.(data.round, data.timeRemaining)
          break
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
      this.options.onClose()
    })
  }

  close() {
    if (this.isClosed) {
      return
    }

    this.ws.close(1000)
  }

  createRoom(playerName: string) {
    if (this.isClosed) {
      return
    }

    const message = createRoomMessage({ playerName })
    this.ws.send(JSON.stringify(message))
  }

  joinRoom(code: string, playerName: string) {
    if (this.isClosed) {
      return
    }

    this.ws.send(JSON.stringify(joinRoomMessage({ code, playerName })))
  }

  startGame(code: string) {
    if (this.isClosed) {
      return
    }

    const message = startGameMessage({ room: code })
    this.ws.send(JSON.stringify(message))
  }

  submitAnswer(answer: string) {
    console.log('Submitting answer:', answer, this)
    if (this.isClosed) {
      return
    }

    if (answer.length !== 5) {
      this.options.onError?.('Answer must be exactly 5 letters')
      return
    }

    const message = submitAnswerMessage({ answer })
    this.ws.send(JSON.stringify(message))
  }
}


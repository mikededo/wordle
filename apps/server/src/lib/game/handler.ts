import type { Result } from 'neverthrow'

import type {
  InternalWebSocket,
  Room
} from '$lib/room/types'

import type { Answer, AnswerResult, GameState, RoundSubmission } from './types'

import { err, ok } from 'neverthrow'
import * as v from 'valibot'

import { roomBroadcast } from '$lib/room/manager'
import { GameError, RoomState } from '$lib/room/types'

import { AnswerSchema, LetterResult } from './types'

const WORD_LIST = [
  'HELLO',
  'WORLD',
  'APPLE',
  'HOUSE',
  'MUSIC',
  'WATER',
  'LIGHT',
  'EARTH',
  'MAGIC',
  'DREAM',
  'OCEAN',
  'RIVER',
  'FOREST',
  'GARDEN',
  'FLOWER',
  'SUNNY',
  'CLOUD',
  'STORM',
  'RAINY',
  'BREEZE',
  'BREAD',
  'FRUIT',
  'SWEET',
  'SALTY',
  'SPICY',
  'FRESH',
  'TASTY',
  'CRISP',
  'JUICY',
  'TANGY',
  'TIGER',
  'EAGLE',
  'SHARK',
  'WHALE',
  'PANDA',
  'KOALA',
  'ZEBRA',
  'MOUSE',
  'SNAKE',
  'BIRDS',
  'SPORT',
  'GAMES',
  'PARTY',
  'DANCE',
  'LAUGH',
  'SMILE',
  'HAPPY',
  'PEACE',
  'HOPES'
]

const getRandomWord = (): string => WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]!

export const initializeGame = (room: Room): void => {
  const targetWord = import.meta.env.PLAYWRIGHT_TEST === '1' ? 'WORDS' : getRandomWord()
  const now = Date.now()

  const gameState: GameState = {
    currentRound: 1,
    maxRounds: 5,
    roundStartedAt: now,
    roundTimeoutId: null,
    scores: new Map(),
    submissions: new Map(),
    targetWord,
    winner: null
  }

  room.game = gameState
  room.state = RoomState.Playing

  room.players.values().forEach((player) => {
    gameState.scores.set(player.name, 0)
  })

  gameState.roundTimeoutId = setTimeout(() => {
    // eslint-disable-next-line ts/no-use-before-define
    endRound(room)
  }, 60_000)

  roomBroadcast(room, {
    round: 1,
    timeRemaining: 60,
    type: 'round_started'
  })
}

export const computeResult = (guess: Answer, target: string): AnswerResult => {
  const targetChars = [...target]

  const { correctCount, result } = [...guess].reduce<{ result: LetterResult[], correctCount: number }>(
    (result, char, i) => {
      if (char === target[i]) {
        targetChars[i] = ''
        return {
          correctCount: result.correctCount + 1,
          result: [...result.result, LetterResult.Correct]
        }
      }

      const index = targetChars.indexOf(char)
      const letterResult: LetterResult = index !== -1 ? LetterResult.Present : LetterResult.Absent
      if (index !== -1) {
        targetChars[index] = ''
      }

      return {
        correctCount: result.correctCount,
        result: [...result.result, letterResult]
      }
    },
    { correctCount: 0, result: [] }
  )

  return { isCorrect: correctCount === 5, result }
}

export const endRound = (room: Room): void => {
  if (!room.game) {
    return
  }

  const game = room.game
  if (game.roundTimeoutId) {
    clearTimeout(game.roundTimeoutId)
    game.roundTimeoutId = null
  }

  roomBroadcast(room, {
    round: game.currentRound,
    type: 'round_ended',
    winner: game.winner
  })

  if (game.currentRound < game.maxRounds && !game.winner) {
    game.currentRound += 1
    game.winner = null
    game.roundStartedAt = Date.now()

    game.roundTimeoutId = setTimeout(() => {
      endRound(room)
    }, 60_000)

    roomBroadcast(room, {
      round: game.currentRound,
      timeRemaining: 60,
      type: 'round_started'
    })
    return
  }

  room.state = RoomState.Finished
  const scores: Record<string, number> = game.scores
    .entries()
    .reduce((agg, [name, score]) => ({ ...agg, [name]: score }), {})

  roomBroadcast(room, {
    correctWord: game.targetWord,
    scores,
    type: 'game_ended',
    winner: game.winner
  })

  room.game = null
  room.state = RoomState.Finished
}

export const submitAnswer = (
  ws: InternalWebSocket,
  room: Room,
  answer: string
): Result<AnswerResult, GameError> => {
  if (room.state !== RoomState.Playing || !room.game) {
    return err(GameError.GameNotStarted)
  }

  const game = room.game
  const player = room.players.get(ws)
  if (!player) {
    return err(GameError.NotYourTurn)
  }

  const playerName = player.name
  const playerSubmissions = game.submissions.get(playerName) || []
  if (playerSubmissions.some((sub) => sub.round === game.currentRound)) {
    return err(GameError.AlreadySubmitted)
  }

  const answerValidation = v.safeParse(AnswerSchema, answer)
  if (!answerValidation.success) {
    return err(GameError.InvalidAnswer)
  }

  const { isCorrect, result } = computeResult(answerValidation.output, game.targetWord)
  const submission: RoundSubmission = {
    result,
    round: game.currentRound,
    submittedAt: Date.now(),
    word: answerValidation.output
  }

  if (!game.submissions.has(playerName)) {
    game.submissions.set(playerName, [])
  }
  game.submissions.get(playerName)!.push(submission)

  ws.send(JSON.stringify({ isCorrect, result, type: 'answer_result' }))

  roomBroadcast(room, { playerName, submission: result, type: 'player_submitted' }, ws)

  if (isCorrect) {
    game.winner = playerName
    const currentScore = game.scores.get(playerName) || 0
    game.scores.set(playerName, currentScore + 1)

    roomBroadcast(room, {
      playerName,
      type: 'player_won',
      word: answerValidation.output
    })

    endRound(room)
  } else {
    const allPlayers = [...room.players.values()].map((p) => p.name)
    const allSubmitted = allPlayers.every((name) => {
      const submissions = game.submissions.get(name) || []
      return submissions.some((sub) => sub.round === game.currentRound)
    })

    if (allSubmitted) {
      endRound(room)
    }
  }

  return ok({ isCorrect, result })
}

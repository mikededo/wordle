import { LetterResult } from '@wordle/server'
import { getContext, setContext } from 'svelte'
import { SvelteSet } from 'svelte/reactivity'

import { goto } from '$app/navigation'
import { GameConnection } from '$lib/service'

const CONTEXT_KEY = Symbol.for('global:state')

type Submission = {
  result: LetterResult[]
  isCorrect: boolean
  round: number
  word: string
}

type GameState = {
  answer: null | string
  gameWinner: null | string
  isGameFinished: boolean
  isGameStarted: boolean
  players: string[]
  timeRemaining: number
  winner: null | string
  correctWord: null | string
  currentRound: number
  isRoundActive: boolean
  maxRounds: number
  mySubmissions: Submission[]
  playerSubmissions: Record<string, LetterResult[][]>
  roundTimer: null | number
  scores: Record<string, number>
  keyStates: {
    absentKeys: SvelteSet<string>
    nonAbsentKeys: SvelteSet<string>
  }
}

type AppState = {
  game: GameState | null
  connection: GameConnection | null
  user: {
    playerName: string
    room: string
  } | null
}

let roundTimerInterval: null | number = null

const appState = $state<AppState>({
  connection: null,
  game: null,
  user: null
})

const stopRoundTimer = () => {
  if (roundTimerInterval !== null) {
    clearInterval(roundTimerInterval)
    roundTimerInterval = null
  }
  if (appState.game) {
    appState.game.roundTimer = null
  }
}

const startRoundTimer = (initialTime: number) => {
  stopRoundTimer()

  if (!appState.game) {
    return
  }

  appState.game.timeRemaining = initialTime

  roundTimerInterval = setInterval(() => {
    if (!appState.game) {
      stopRoundTimer()
      return
    }

    appState.game.timeRemaining -= 1

    if (appState.game.timeRemaining <= 0) {
      stopRoundTimer()
      appState.game.isRoundActive = false
    }
  }, 1000) as unknown as number

  appState.game.roundTimer = roundTimerInterval
}

export const initContext = () => {
  setContext(CONTEXT_KEY, appState)
}
export const getAppContext = () => {
  const context = getContext<AppState | undefined>(CONTEXT_KEY)
  if (!context) {
    throw new Error('App context not initialized')
  }

  return context
}

const initEmptyGame = () => {
  appState.game = {
    answer: null,
    correctWord: null,
    currentRound: 1,
    gameWinner: null,
    isGameFinished: false,
    isGameStarted: false,
    isRoundActive: false,
    keyStates: {
      absentKeys: new SvelteSet<string>(),
      nonAbsentKeys: new SvelteSet<string>()
    },
    maxRounds: 5,
    mySubmissions: [],
    players: [],
    playerSubmissions: {},
    roundTimer: null,
    scores: {},
    timeRemaining: 0,
    winner: null
  }
}

type CreateRoomAndConnectOptions = {
  playerName: string
  onError?: () => void
  onSuccess?: () => void
  room?: string
}
export const connectToRoom = async (options: CreateRoomAndConnectOptions) => {
  appState.connection = new GameConnection({
    onAnswerResult: (isCorrect, result) => {
      if (!appState.game || !appState.user) {
        return
      }

      const word = appState.game.answer || ''
      appState.game.mySubmissions.push({
        isCorrect,
        result,
        round: appState.game.currentRound,
        word
      })
      const submissions = appState.game.playerSubmissions[appState.user.playerName]
      appState.game.playerSubmissions[appState.user.playerName] = [...(submissions ?? []), result]

      const answerLetters = word.toUpperCase().split('')
      result.forEach((letterResult, index) => {
        if (letterResult !== LetterResult.Absent) {
          appState.game!.keyStates.nonAbsentKeys.add(answerLetters[index])
          return
        }

        if (appState.game!.keyStates.nonAbsentKeys.has(answerLetters[index])) {
          return
        }

        appState.game!.keyStates.absentKeys.add(answerLetters[index])
      })

      appState.game.answer = null
    },
    onClose: () => {
      stopRoundTimer()
      appState.game = null
      goto('/')
    },
    onConnect: () => {
      if (!options.room) {
        appState.connection!.createRoom(options.playerName)
      } else {
        appState.connection!.joinRoom(options.room, options.playerName)
      }
    },
    onError: (reason) => {
      console.error('Game error:', reason)
      options.onError?.()
    },
    onGameEnded: (correctWord, scores, winner) => {
      if (!appState.game) {
        return
      }
      appState.game.isGameFinished = true
      appState.game.correctWord = correctWord
      appState.game.scores = scores
      appState.game.gameWinner = winner
      stopRoundTimer()
    },
    onGameStarted: () => {
      // Game started, but wait for round_started to initialize game state
    },
    onPlayerJoined: (playerName) => {
      if (!appState.game) {
        // Game should've been initialised already
        return
      }

      if (!appState.game.players.includes(playerName)) {
        appState.game.players.push(playerName)
        appState.game.playerSubmissions[playerName] = []
      }
    },
    onPlayerLeft: (playerName) => {
      if (!appState.game) {
        return
      }
      appState.game.players = appState.game.players.filter((p) => p !== playerName)
      delete appState.game.playerSubmissions[playerName]
      delete appState.game.scores[playerName]
    },
    onPlayerSubmitted: (playerName, submission) => {
      if (!appState.game) {
        return
      }
      const submissions = appState.game.playerSubmissions[playerName] || []
      appState.game.playerSubmissions[playerName] = [...submissions, submission]
    },
    onPlayerWon: (playerName) => {
      if (!appState.game) {
        return
      }
      appState.game.winner = playerName
      appState.game.isGameFinished = true

      if (playerName === appState.user?.playerName) {
        const currentScore = appState.game.scores[playerName] || 0
        appState.game.scores[playerName] = currentScore + 1
      }
    },
    onRoomCreated: (response) => {
      appState.user = {
        playerName: options.playerName,
        room: response
      }
      options.onSuccess?.()

      initEmptyGame()
      if (!appState.game) {
        throw new Error('An error occurred initialising game state')
      }

      appState.game.players.push(options.playerName)
      appState.game.playerSubmissions[options.playerName] = []
      goto(`/game/${response}`)
    },
    onRoomJoined: (response, players) => {
      appState.user = {
        playerName: options.playerName,
        room: response
      }

      initEmptyGame()
      if (appState.game) {
        appState.game.players = players
        appState.game.playerSubmissions = players.reduce((agg, player) => ({ ...agg, [player]: [] }), {})
      }

      options.onSuccess?.()
      goto(`/game/${response}`)
    },
    onRoundEnded: (_, winner) => {
      if (!appState.game) {
        return
      }

      appState.game.currentRound += 1
      appState.game.isRoundActive = false
      appState.game.winner = winner
      stopRoundTimer()

      if (winner) {
        const currentScore = appState.game.scores[winner] || 0
        appState.game.scores[winner] = currentScore + 1
      }
    },
    onRoundStarted: (round, timeRemaining) => {
      if (!appState.game) {
        throw new Error('Game is not initialized')
      }

      if (!appState.game.isGameStarted) {
        appState.game.isGameStarted = true
      }

      appState.game.currentRound = round
      appState.game.timeRemaining = timeRemaining
      appState.game.isRoundActive = true
      appState.game.winner = null
      appState.game.answer = null
      startRoundTimer(timeRemaining)
    }
  })
}

export const disconnectFromRoom = () => {
  stopRoundTimer()
  appState.connection?.close()
  appState.game = null
  goto('/')
}

export const startGame = () => {
  if (!appState.user || !appState.connection) {
    return
  }

  appState.connection.startGame(appState.user.room)
}

export const submitAnswer = (answer: string) => {
  if (!appState.connection || !appState.game || !appState.user) {
    return
  }

  if (answer.length !== 5 || !appState.game.isRoundActive) {
    return
  }

  appState.game.answer = answer.toUpperCase()
  appState.connection.submitAnswer(answer)
}

export const updateCurrentGuess = (guess: string) => {
  if (!appState.game || !appState.game.isRoundActive) {
    return
  }
  if (appState.game.playerSubmissions[appState.user?.playerName || '']) {
    return
  }

  appState.game.answer = guess.toUpperCase().slice(0, 5)
}

export const closeConnection = () => {
  stopRoundTimer()
  appState.connection?.close()
  appState.game = null
}

import * as v from 'valibot'

export const AnswerSchema = v.pipe(v.string(), v.regex(/[a-z]+/i), v.length(5), v.toUpperCase(), v.brand('Answer'))
export type Answer = v.InferOutput<typeof AnswerSchema>
export type AnswerResult = {
  result: LetterResult[]
  isCorrect: boolean
}

export enum LetterResult {
  Absent,
  Correct,
  Present
}
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

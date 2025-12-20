import * as v from 'valibot'

const PlayerNameSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(20))

export const CreateRoomSchema = v.object({
  playerName: PlayerNameSchema,
  type: v.literal('create_room')
})
export type CreateRoomMessage = v.InferOutput<typeof CreateRoomSchema>

export const JoinRoomSchema = v.object({
  code: v.string(),
  playerName: PlayerNameSchema,
  type: v.literal('join_room')
})
export type JoinRoomMessage = v.InferOutput<typeof JoinRoomSchema>

export const StartGameSchema = v.object({
  room: v.string(),
  type: v.literal('start_game')
})
export type StartGameMessage = v.InferOutput<typeof StartGameSchema>

export const SubmitAnswerSchema = v.object({
  answer: v.pipe(v.string(), v.length(5)),
  type: v.literal('submit_answer')
})
export type SubmitAnswerMessage = v.InferOutput<typeof SubmitAnswerSchema>

export const LeaveRoomSchema = v.object({ type: v.literal('leave_room') })
export type LeaveRoomMessage = v.InferOutput<typeof LeaveRoomSchema>

export const ClientMessageSchema = v.variant('type', [
  CreateRoomSchema,
  JoinRoomSchema,
  LeaveRoomSchema,
  StartGameSchema,
  SubmitAnswerSchema
])
export type ClientMessage = v.InferOutput<typeof ClientMessageSchema>

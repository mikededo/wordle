import * as v from 'valibot'

export const CreateRoomSchema = v.object({
  playerName: v.pipe(v.string(), v.minLength(1), v.maxLength(20)),
  type: v.literal('create_room')
})
export type CreateRoomMessage = v.InferOutput<typeof CreateRoomSchema>

export const JoinRoomSchema = v.object({
  code: v.pipe(v.string(), v.length(5)),
  playerName: v.pipe(v.string(), v.minLength(1), v.maxLength(20)),
  type: v.literal('join_room')
})
export type JoinRoomMessage = v.InferOutput<typeof JoinRoomSchema>

export const LeaveRoomSchema = v.object({ type: v.literal('leave_room') })
export type LeaveRoomMessage = v.InferOutput<typeof LeaveRoomSchema>

export const ClientMessageSchema = v.variant('type', [
  CreateRoomSchema,
  JoinRoomSchema,
  LeaveRoomSchema
])
export type ClientMessage = v.InferOutput<typeof ClientMessageSchema>

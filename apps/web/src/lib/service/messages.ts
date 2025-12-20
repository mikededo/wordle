import type {
  ClientMessage,
  CreateRoomMessage,
  JoinRoomMessage,
  LeaveRoomMessage,
  StartGameMessage
} from '@wordle/server'

type MessageArgs<T extends ClientMessage> = Omit<T, 'type'>
type IsEmpty<T> = keyof T extends never ? true : false
type MessageBuilder<T extends ClientMessage> = IsEmpty<MessageArgs<T>> extends true
  ? () => T
  : (args: MessageArgs<T>) => T

export const createRoomMessage: MessageBuilder<CreateRoomMessage> = ({ playerName }) => ({
  playerName,
  type: 'create_room'
})

export const joinRoomMessage: MessageBuilder<JoinRoomMessage> = ({ code, playerName }) => ({
  code,
  playerName,
  type: 'join_room'
})

export const startGameMessage: MessageBuilder<StartGameMessage> = ({ room }) => ({
  room,
  type: 'start_game'
})

export const leaveRoomMessage: MessageBuilder<LeaveRoomMessage> = () => ({
  type: 'leave_room'
})

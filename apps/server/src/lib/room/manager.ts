import type { Result } from 'neverthrow'

import type { RoomCode } from '$lib/room/code'
import type { InternalWebSocket, Player, Room, ServerMessage } from '$lib/room/types'

import { err, ok } from 'neverthrow'

import { initializeGame } from '$lib/game/handler'
import { generateCode, isValidRoomCode } from '$lib/room/code'
import { RoomError, RoomState } from '$lib/room/types'

const rooms = new Map<RoomCode, Room>()
const playerRooms = new Map<InternalWebSocket, RoomCode>()

const getRoomCodes = (): Set<RoomCode> => new Set(rooms.keys())

export const getRoom = (code: string): Room | undefined => isValidRoomCode(code) ? rooms.get(code) : undefined

export const getRoomByWebSocket = (ws: InternalWebSocket): Room | undefined => {
  const code = playerRooms.get(ws)
  if (!code) {
    return undefined
  }
  return rooms.get(code)
}

const updateActivity = (room: Room) => {
  room.lastActivity = Date.now()
}

export const createRoom = (ws: InternalWebSocket, playerName: string): Result<RoomCode, never> => {
  const code = generateCode(getRoomCodes())
  const now = Date.now()

  const room: Room = {
    code,
    createdAt: now,
    game: null,
    host: ws,
    lastActivity: now,
    players: new Map([[ws, { name: playerName, ws }]]),
    state: RoomState.Lobby
  }

  rooms.set(code, room)
  playerRooms.set(ws, code)

  return ok(code)
}

export const joinRoom = (
  ws: InternalWebSocket,
  code: string,
  playerName: string
): Result<{ players: string[], code: RoomCode }, RoomError> => {
  const codeValidation = isValidRoomCode(code)
  if (!codeValidation) {
    return err(RoomError.RoomNotFound)
  }

  const room = getRoom(code)

  if (!room) {
    return err(RoomError.RoomNotFound)
  }

  if (room.state !== RoomState.Lobby) {
    return err(RoomError.GameInProgress)
  }

  const player: Player = { name: playerName, ws }
  room.players.set(ws, player)
  playerRooms.set(ws, room.code)
  updateActivity(room)

  const playerNames = [...room.players.values()].map((p) => p.name)

  return ok({ code: room.code, players: playerNames })
}

export const leaveRoom = (ws: InternalWebSocket): { player: Player, room: Room } | null => {
  const code = playerRooms.get(ws)
  if (!code) {
    return null
  }

  const room = rooms.get(code)
  if (!room) {
    playerRooms.delete(ws)
    return null
  }

  const player = room.players.get(ws)
  if (!player) {
    return null
  }

  room.players.delete(ws)
  playerRooms.delete(ws)

  if (room.players.size === 0) {
    rooms.delete(code)
  } else {
    updateActivity(room)
    // Transfer host if needed
    if (room.host === ws) {
      room.host = room.players.keys().next().value!
    }
  }

  return { player, room: room.players.size > 0 ? room : room }
}

export const startGame = (code: string): Result<void, RoomError> => {
  const isValidCode = isValidRoomCode(code)
  if (!isValidCode) {
    return err(RoomError.InvalidRoomCode)
  }

  const room = getRoom(code)
  if (!room) {
    return err(RoomError.RoomNotFound)
  }

  if (room.state !== RoomState.Lobby) {
    return err(RoomError.GameInProgress)
  }

  // eslint-disable-next-line ts/no-use-before-define
  roomBroadcast(room, { type: 'game_started' })
  initializeGame(room)
  return ok()
}

export const roomBroadcast = (room: Room, message: ServerMessage, exclude?: InternalWebSocket) => {
  const data = JSON.stringify(message)
  for (const player of room.players.values()) {
    if (player.ws !== exclude) {
      player.ws.send(data)
    }
  }
}

export const getStats = () => ({
  activeRooms: rooms.size,
  totalPlayers: playerRooms.size
})

export const getAllRooms = (): IterableIterator<Room> => rooms.values()

export const deleteRoom = (code: RoomCode): boolean => {
  const room = rooms.get(code)
  if (!room) {
    return false
  }

  // Clear game timer if exists
  if (room.game?.roundTimeoutId) {
    clearTimeout(room.game.roundTimeoutId)
  }

  for (const ws of room.players.keys()) {
    playerRooms.delete(ws)
  }

  rooms.delete(code)
  return true
}

export const resetState = () => {
  rooms.clear()
  playerRooms.clear()
}


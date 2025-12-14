import type { Result } from 'neverthrow'

import type { InternalWebSocket, Player, Room, RoomError, ServerMessage } from '$lib/room/types'

import { err, ok } from 'neverthrow'

import { generateCode } from '$lib/room/code'

const rooms = new Map<string, Room>()
const playerRooms = new Map<InternalWebSocket, string>()

const getRoomCodes = (): Set<string> => new Set(rooms.keys())

export const getRoom = (code: string): Room | undefined => rooms.get(code.toUpperCase())

const updateActivity = (room: Room) => {
  room.lastActivity = Date.now()
}

export const createRoom = (ws: InternalWebSocket, playerName: string): Result<string, never> => {
  const code = generateCode(getRoomCodes())
  const now = Date.now()

  const room: Room = {
    code,
    createdAt: now,
    host: ws,
    lastActivity: now,
    players: new Map([[ws, { name: playerName, ws }]]),
    state: 'lobby'
  }

  rooms.set(code, room)
  playerRooms.set(ws, code)

  return ok(code)
}

export const joinRoom = (
  ws: InternalWebSocket,
  code: string,
  playerName: string
): Result<{ players: string[], code: string }, RoomError> => {
  const room = getRoom(code)

  if (!room) {
    return err('ROOM_NOT_FOUND')
  }

  if (room.state !== 'lobby') {
    return err('GAME_IN_PROGRESS')
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

export const broadcast = (room: Room, message: ServerMessage, exclude?: InternalWebSocket) => {
  const data = JSON.stringify(message)
  for (const player of room.players.values()) {
    if (player.ws !== exclude) {
      player.ws.send(data)
    }
  }
}

// Stats for monitoring
export const getStats = () => ({
  activeRooms: rooms.size,
  totalPlayers: playerRooms.size
})

// For cleanup
export const getAllRooms = (): IterableIterator<Room> => rooms.values()

export const deleteRoom = (code: string): boolean => {
  const room = rooms.get(code)
  if (!room) {
    return false
  }

  // Clean up player references
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


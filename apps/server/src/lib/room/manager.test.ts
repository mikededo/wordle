import { afterEach, describe, expect, mock, test } from 'bun:test'
import * as v from 'valibot'

import { RoomCodeSchema } from './code'
import {
  createRoom,
  deleteRoom,
  getRoom,
  getStats,
  joinRoom,
  leaveRoom,
  resetState
} from './manager'
import { RoomError, RoomState } from './types'

const createMockWs = () => ({
  close: mock(() => {}),
  send: mock(() => {})
}) as any

describe('room manager', () => {
  afterEach(() => {
    resetState()
  })

  describe('createRoom', () => {
    test('creates a room and returns code', () => {
      const ws = createMockWs()
      const result = createRoom(ws, 'Alice')

      expect(result.isOk()).toBe(true)
      result.map((code) => {
        expect(code).toHaveLength(5)
        expect(getRoom(code)).toBeDefined()
      })
    })

    test('sets creator as host', () => {
      const ws = createMockWs()
      const result = createRoom(ws, 'Alice')

      result.map((code) => {
        const room = getRoom(code)
        expect(room?.host).toBe(ws)
      })
    })

    test('adds creator to players', () => {
      const ws = createMockWs()
      const result = createRoom(ws, 'Alice')

      result.map((code) => {
        const room = getRoom(code)
        expect(room?.players.size).toBe(1)
        expect(room?.players.get(ws)?.name).toBe('Alice')
      })
    })

    test('sets initial state to lobby', () => {
      const ws = createMockWs()
      const result = createRoom(ws, 'Alice')

      result.map((code) => {
        const room = getRoom(code)
        expect(room?.state).toBe(RoomState.Lobby)
      })
    })

    test('updates stats', () => {
      const ws = createMockWs()
      createRoom(ws, 'Alice')

      const stats = getStats()
      expect(stats.activeRooms).toBe(1)
      expect(stats.totalPlayers).toBe(1)
    })
  })

  describe('joinRoom', () => {
    test('joins existing room', () => {
      const host = createMockWs()
      const player = createMockWs()

      const createResult = createRoom(host, 'Alice')
      const code = createResult._unsafeUnwrap()

      const joinResult = joinRoom(player, code, 'Bob')

      expect(joinResult.isOk()).toBe(true)
      joinResult.map(({ players }) => {
        expect(players).toContain('Alice')
        expect(players).toContain('Bob')
      })
    })

    test('returns error for non-existent room', () => {
      const ws = createMockWs()
      const result = joinRoom(ws, 'XXXXX', 'Bob')

      expect(result.isErr()).toBe(true)
      result.mapErr((error) => {
        expect(error).toBe(RoomError.RoomNotFound)
      })
    })

    test('returns error when game in progress', () => {
      const host = createMockWs()
      const player = createMockWs()

      const createResult = createRoom(host, 'Alice')
      const code = createResult._unsafeUnwrap()

      const room = getRoom(code)!
      room.state = RoomState.Playing

      const joinResult = joinRoom(player, code, 'Bob')

      expect(joinResult.isErr()).toBe(true)
      joinResult.mapErr((error) => {
        expect(error).toBe(RoomError.GameInProgress)
      })
    })

    test('is case-sensitive for room codes', () => {
      const host = createMockWs()
      const player = createMockWs()

      const createResult = createRoom(host, 'Alice')
      const code = createResult._unsafeUnwrap()

      const joinResult = joinRoom(player, code.toLowerCase(), 'Bob')
      expect(joinResult.isOk()).toBe(false)
    })

    test('updates stats', () => {
      const host = createMockWs()
      const player = createMockWs()

      const createResult = createRoom(host, 'Alice')
      const code = createResult._unsafeUnwrap()
      joinRoom(player, code, 'Bob')

      const stats = getStats()
      expect(stats.activeRooms).toBe(1)
      expect(stats.totalPlayers).toBe(2)
    })
  })

  describe('leaveRoom', () => {
    test('removes player from room', () => {
      const host = createMockWs()
      const player = createMockWs()

      const createResult = createRoom(host, 'Alice')
      const code = createResult._unsafeUnwrap()
      joinRoom(player, code, 'Bob')

      leaveRoom(player)

      const room = getRoom(code)
      expect(room?.players.size).toBe(1)
      expect(room?.players.has(player)).toBe(false)
    })

    test('deletes room when last player leaves', () => {
      const host = createMockWs()

      const createResult = createRoom(host, 'Alice')
      const code = createResult._unsafeUnwrap()

      leaveRoom(host)

      expect(getRoom(code)).toBeUndefined()
      expect(getStats().activeRooms).toBe(0)
    })

    test('transfers host when host leaves', () => {
      const host = createMockWs()
      const player = createMockWs()

      const createResult = createRoom(host, 'Alice')
      const code = createResult._unsafeUnwrap()
      joinRoom(player, code, 'Bob')

      leaveRoom(host)

      const room = getRoom(code)
      expect(room?.host).toBe(player)
    })

    test('returns null for player not in room', () => {
      const ws = createMockWs()
      const result = leaveRoom(ws)
      expect(result).toBeNull()
    })

    test('returns player and room info', () => {
      const host = createMockWs()
      const player = createMockWs()

      const createResult = createRoom(host, 'Alice')
      const code = createResult._unsafeUnwrap()
      joinRoom(player, code, 'Bob')

      const result = leaveRoom(player)

      expect(result).not.toBeNull()
      expect(result?.player.name).toBe('Bob')
      expect(result?.room.code).toBe(code)
    })
  })

  describe('deleteRoom', () => {
    test('deletes existing room', () => {
      const ws = createMockWs()
      const createResult = createRoom(ws, 'Alice')
      const code = createResult._unsafeUnwrap()

      const deleted = deleteRoom(code)

      expect(deleted).toBe(true)
      expect(getRoom(code)).toBeUndefined()
    })

    test('returns false for non-existent room', () => {
      expect(deleteRoom(v.parse(RoomCodeSchema, 'XXXXX'))).toBe(false)
    })

    test('cleans up player references', () => {
      const host = createMockWs()
      const player = createMockWs()

      const createResult = createRoom(host, 'Alice')
      const code = createResult._unsafeUnwrap()
      joinRoom(player, code, 'Bob')

      deleteRoom(code)

      expect(getStats().totalPlayers).toBe(0)
    })
  })
})


import { describe, expect, mock, test } from 'bun:test'

import { handleClose, handleMessage } from '$lib/ws/handler'

const createMockWs = () => {
  const messages: string[] = []
  return {
    close: mock(() => {}),
    messages,
    send: mock((data: string) => {
      messages.push(data)
    })
  } as any
}

const parseLastMessage = (ws: ReturnType<typeof createMockWs>) => {
  const last = ws.messages[ws.messages.length - 1]
  return last ? JSON.parse(last) : null
}

describe('WebSocket handler', () => {
  describe('handleMessage', () => {
    describe('create_room', () => {
      test('creates room and sends room_created', () => {
        const ws = createMockWs()

        handleMessage(ws, JSON.stringify({ playerName: 'Alice', type: 'create_room' }))

        const response = parseLastMessage(ws)
        expect(response.type).toBe('room_created')
        expect(response.code).toHaveLength(5)
      })

      test('rejects empty player name', () => {
        const ws = createMockWs()

        handleMessage(ws, JSON.stringify({ playerName: '', type: 'create_room' }))

        const response = parseLastMessage(ws)
        expect(response.type).toBe('error')
        expect(response.message).toBe('Invalid message format')
      })

      test('rejects player name over 20 chars', () => {
        const ws = createMockWs()

        handleMessage(ws, JSON.stringify({ playerName: 'A'.repeat(21), type: 'create_room' }))

        const response = parseLastMessage(ws)
        expect(response.type).toBe('error')
      })
    })

    describe('join_room', () => {
      test('joins existing room', () => {
        const host = createMockWs()
        const player = createMockWs()

        handleMessage(host, JSON.stringify({ playerName: 'Alice', type: 'create_room' }))
        const { code } = parseLastMessage(host)

        handleMessage(player, JSON.stringify({ code, playerName: 'Bob', type: 'join_room' }))

        const response = parseLastMessage(player)
        expect(response.type).toBe('room_joined')
        expect(response.players).toContain('Alice')
        expect(response.players).toContain('Bob')
      })

      test('broadcasts player_joined to other players', () => {
        const host = createMockWs()
        const player = createMockWs()

        handleMessage(host, JSON.stringify({ playerName: 'Alice', type: 'create_room' }))
        const { code } = parseLastMessage(host)

        handleMessage(player, JSON.stringify({ code, playerName: 'Bob', type: 'join_room' }))

        // Host should receive player_joined
        const hostResponse = parseLastMessage(host)
        expect(hostResponse.type).toBe('player_joined')
        expect(hostResponse.playerName).toBe('Bob')
      })

      test('returns error for invalid room code', () => {
        const ws = createMockWs()

        handleMessage(ws, JSON.stringify({ code: 'XXXXX', playerName: 'Bob', type: 'join_room' }))

        const response = parseLastMessage(ws)
        expect(response.type).toBe('error')
        expect(response.message).toBe('Room not found')
      })

      test('rejects invalid code length', () => {
        const ws = createMockWs()

        handleMessage(ws, JSON.stringify({ code: 'ABC', playerName: 'Bob', type: 'join_room' }))

        const response = parseLastMessage(ws)
        expect(response.type).toBe('error')
        expect(response.message).toBe('Invalid message format')
      })
    })

    describe('leave_room', () => {
      test('player can leave room', () => {
        const host = createMockWs()
        const player = createMockWs()

        handleMessage(host, JSON.stringify({ playerName: 'Alice', type: 'create_room' }))
        const { code } = parseLastMessage(host)

        handleMessage(player, JSON.stringify({ code, playerName: 'Bob', type: 'join_room' }))
        handleMessage(player, JSON.stringify({ type: 'leave_room' }))

        // Host should receive player_left
        const hostResponse = parseLastMessage(host)
        expect(hostResponse.type).toBe('player_left')
        expect(hostResponse.playerName).toBe('Bob')
      })

      test('no error when leaving without being in room', () => {
        const ws = createMockWs()

        // Should not throw
        handleMessage(ws, JSON.stringify({ type: 'leave_room' }))

        // No message sent
        expect(ws.messages).toHaveLength(0)
      })
    })

    describe('invalid messages', () => {
      test('rejects invalid JSON', () => {
        const ws = createMockWs()

        handleMessage(ws, 'not valid json')

        const response = parseLastMessage(ws)
        expect(response.type).toBe('error')
        expect(response.message).toBe('Invalid message format')
      })

      test('rejects unknown message type', () => {
        const ws = createMockWs()

        handleMessage(ws, JSON.stringify({ type: 'unknown_type' }))

        const response = parseLastMessage(ws)
        expect(response.type).toBe('error')
      })

      test('rejects missing required fields', () => {
        const ws = createMockWs()

        handleMessage(ws, JSON.stringify({ type: 'create_room' }))

        const response = parseLastMessage(ws)
        expect(response.type).toBe('error')
      })
    })
  })

  describe('handleClose', () => {
    test('removes player from room on disconnect', () => {
      const host = createMockWs()
      const player = createMockWs()

      handleMessage(host, JSON.stringify({ playerName: 'Alice', type: 'create_room' }))
      const { code } = parseLastMessage(host)

      handleMessage(player, JSON.stringify({ code, playerName: 'Bob', type: 'join_room' }))

      // Clear previous messages
      host.messages.length = 0

      handleClose(player)

      // Host should receive player_left
      const hostResponse = parseLastMessage(host)
      expect(hostResponse.type).toBe('player_left')
      expect(hostResponse.playerName).toBe('Bob')
    })

    test('no error when disconnecting without being in room', () => {
      const ws = createMockWs()

      // Should not throw
      handleClose(ws)

      expect(ws.messages).toHaveLength(0)
    })
  })
})



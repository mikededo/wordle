import { deleteRoom, getAllRooms, getStats } from '$lib/room/manager'

const CLEANUP_INTERVAL_MS = 60 * 1000
const STALE_ROOM_THRESHOLD_MS = 30 * 60 * 1000
const EMPTY_ROOM_THRESHOLD_MS = 5 * 60 * 1000

let cleanupTimer: null | ReturnType<typeof setInterval> = null

const runCleanup = () => {
  const now = Date.now()
  let cleanedCount = 0

  for (const room of getAllRooms()) {
    const timeSinceActivity = now - room.lastActivity
    const isEmpty = room.players.size === 0

    const shouldClean = isEmpty
      ? timeSinceActivity > EMPTY_ROOM_THRESHOLD_MS
      : timeSinceActivity > STALE_ROOM_THRESHOLD_MS

    if (!shouldClean) {
      continue
    }

    if (!isEmpty) {
      const message = JSON.stringify({
        message: 'Room closed due to inactivity',
        type: 'error'
      })
      for (const player of room.players.values()) {
        player.ws.send(message)
        player.ws.close(1000, 'Room inactive')
      }
    }

    deleteRoom(room.code)
    cleanedCount++
  }

  if (cleanedCount > 0) {
    const stats = getStats()
    console.warn(
      `[Cleanup] Removed ${cleanedCount} stale rooms. Active: ${stats.activeRooms} rooms, ${stats.totalPlayers} players`
    )
  }
}

export const startCleanup = () => {
  if (cleanupTimer) {
    return
  }

  cleanupTimer = setInterval(runCleanup, CLEANUP_INTERVAL_MS)
  console.warn('[Cleanup] Started room cleanup scheduler')
}

export const stopCleanup = () => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
    console.warn('[Cleanup] Stopped room cleanup scheduler')
  }
}


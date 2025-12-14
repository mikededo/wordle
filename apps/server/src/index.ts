import { startCleanup } from '$lib/room/cleanup'
import { getStats } from '$lib/room/manager'
import { handleClose, handleMessage } from '$lib/ws/handler'

const PORT = Bun.env.PORT ? Number.parseInt(Bun.env.PORT, 10) : 3001
const Logger = console

const server = Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) {
      return
    }
    return new Response('Upgrade failed', { status: 500 })
  },
  port: PORT,
  websocket: {
    close(ws) {
      handleClose(ws)
    },
    message(ws, data) {
      handleMessage(ws, data.toString())
    }
  }
})

startCleanup()

setInterval(() => {
  const stats = getStats()
  if (stats.activeRooms > 0) {
    Logger.log(`[Stats] ${stats.activeRooms} rooms, ${stats.totalPlayers} players`)
  }
}, 5 * 60 * 1000)

Logger.log(`WebSocket server running on ws://localhost:${server.port}`)

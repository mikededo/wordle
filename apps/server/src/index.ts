const server = Bun.serve({
  port: 3001,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response('Upgrade failed', { status: 500 });
  },
  websocket: {
    open(ws) {
      console.log('Client connected');
    },
    message(ws, message) {
      console.log('Received:', message);
      ws.send(`Echo: ${message}`);
    },
    close(ws) {
      console.log('Client disconnected');
    },
  },
});

console.log(`WebSocket server running on ws://localhost:${server.port}`);


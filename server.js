const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    // Broadcast the received message to all connected clients
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

console.log(`WebSocket server is running on port ${PORT}`);

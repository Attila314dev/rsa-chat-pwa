// server.js – szobakezelős WebSocket szerver RSA Chathez

const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

// Szobák nyilvántartása: { roomId: [ { socket, name, pubkeyBase64 } ] }
const rooms = {};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);

      if (data.type === 'join') {
        const { room, name, pubkey } = data;
        if (!room || !name || !pubkey) return;

        // Szoba létrehozása, ha nem létezik
        if (!rooms[room]) rooms[room] = [];

        // Ellenőrzés: ne legyen duplikált név ugyanabban a szobában
        const existing = rooms[room].find(user => user.name === name);
        if (existing) return;

        // Hozzáadás a szobához
        rooms[room].push({ socket: ws, name, pubkey });

        // Küldés az új tagnak: kik vannak bent
        const members = rooms[room].map(u => ({ name: u.name, pubkey: u.pubkey }));
        ws.send(JSON.stringify({ type: 'room_members', members }));

        // Értesítsük a többieket az új belépőről
        rooms[room].forEach(u => {
          if (u.socket !== ws && u.socket.readyState === WebSocket.OPEN) {
            u.socket.send(JSON.stringify({ type: 'user_joined', name, pubkey }));
          }
        });

        // Csatoltuk a szobainformációt a sockethez (szerver oldalon)
        ws._room = room;
        ws._name = name;
      }

      if (data.type === 'message') {
        const { room, to, from, encrypted } = data;
        if (!room || !to || !from || !encrypted) return;

        const roomUsers = rooms[room] || [];
        const target = roomUsers.find(u => u.name === to);
        if (target && target.socket.readyState === WebSocket.OPEN) {
          target.socket.send(JSON.stringify({
            type: 'message',
            from,
            encrypted
          }));
        }
      }

    } catch (err) {
      console.error('Érvénytelen üzenet vagy hiba:', err);
    }
  });

  ws.on('close', () => {
    // Törlés minden szobából, ahol ez a socket benne volt
    for (const room in rooms) {
      rooms[room] = rooms[room].filter(u => u.socket !== ws);
      // Ha szoba üres, töröljük
      if (rooms[room].length === 0) delete rooms[room];
    }
  });
});

console.log(`WebSocket szerver fut a ${PORT} porton`);

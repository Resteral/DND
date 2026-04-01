import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => res.json({ ok: true, time: Date.now() }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let connId = 1;
const conns = new Map();

wss.on('connection', (ws) => {
  const id = connId++;
  conns.set(id, ws);
  console.log('WS connected', id);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      // simple echo-broadcast for token_move and chat_message types
      if (msg && msg.type) {
        const out = JSON.stringify({ ...msg, serverTime: Date.now() });
        for (const [k, s] of conns.entries()) {
          if (s.readyState === s.OPEN) s.send(out);
        }
      }
    } catch (err) {
      console.warn('ws parse error', err);
    }
  });

  ws.on('close', () => {
    conns.delete(id);
    console.log('WS disconnected', id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

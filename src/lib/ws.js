export default class WSClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.handlers = new Map();
    this.reconnectDelay = 1000;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener('open', () => {
      console.log('WS open', this.url);
      this.reconnectDelay = 1000;
    });
    this.ws.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const type = msg.type;
        if (this.handlers.has(type)) {
          for (const h of this.handlers.get(type)) h(msg.payload, msg);
        }
      } catch (err) {
        console.warn('ws message parse', err);
      }
    });
    this.ws.addEventListener('close', () => {
      console.log('WS closed, reconnecting...', this.reconnectDelay);
      setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(30000, this.reconnectDelay * 1.5);
    });
    this.ws.addEventListener('error', (e) => console.warn('WS error', e));
  }

  send(type, payload) {
    const msg = JSON.stringify({ type, payload, clientTime: Date.now() });
    if (this.ws && this.ws.readyState === this.ws.OPEN) this.ws.send(msg);
  }

  on(type, handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(handler);
    return () => this.handlers.get(type).delete(handler);
  }
}

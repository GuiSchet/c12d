/**
 * Typed WebSocket manager for the peer-observer event stream.
 *
 * Message format (from tools/websocket/www/js/lib.js):
 *
 * { EbpfExtractor: { ebpf_event: { Message: MessageEvent } } }
 * { EbpfExtractor: { ebpf_event: { Connection: { event: ConnectionEvent } } } }
 * { EbpfExtractor: { ebpf_event: { Mempool: { event: MempoolEvent } } } }
 * { RpcExtractor: { rpc_event: { PeerInfos: { infos: PeerInfo[] } } } }
 * { RpcExtractor: { rpc_event: { MempoolInfo: MempoolInfo } } }
 * { RpcExtractor: { rpc_event: { OrphanTxs: { orphans: OrphanTx[] } } } }
 * { RpcExtractor: { rpc_event: { NetTotals: NetTotals } } }
 * { RpcExtractor: { rpc_event: { Uptime: number } } }
 * { P2pExtractor: { p2p_event: { PingDuration: ... } } }
 * { LogExtractor: ... }
 */

// ---- P2P message metadata ----
export interface MessageMeta {
  peer_id: number;
  addr: string;
  conn_type: number;
  command: string;
  inbound: boolean;
  size: number;
}

export interface EbpfMessage {
  meta: MessageMeta;
}

// ---- Connection events ----
export interface Connection {
  peer_id: number;
  addr: string;
  conn_type: number;
  network: number;
}

export interface InboundConnection {
  conn: Connection;
  existing_connections: number;
}

export interface OutboundConnection {
  conn: Connection;
  existing_connections: number;
}

export interface ClosedConnection {
  conn: Connection;
  time_established: number;
}

// Server sends PascalCase keys: Inbound, Outbound, Closed, InboundEvicted
export type ConnectionEvent =
  | { Inbound: InboundConnection }
  | { Outbound: OutboundConnection }
  | { Closed: ClosedConnection }
  | { InboundEvicted: ClosedConnection };

// ---- RPC data structures ----
export interface PeerInfo {
  id: number;
  address: string;
  network: string;
  bytes_sent: number;
  bytes_received: number;
  connection_type: string;
  inbound: boolean;
  ping_time: number;
  version: number;
  subversion: string;
  synced_blocks: number;
  connection_time: number;
}

export interface MempoolInfo {
  loaded: boolean;
  size: number;
  bytes: number;
  usage: number;
  total_fee: number;
  max_mempool: number;
  mempoolminfee: number;
  minrelaytxfee: number;
  unbroadcastcount: number;
}

export interface OrphanTx {
  txid: string;
  wtxid: string;
  bytes: number;
  vsize: number;
  weight: number;
  from: number[];
}

export interface LogEntry {
  timestamp: Date;
  raw: string;
}

// ---- Typed event union ----
export type BitcoinEvent =
  | { type: 'EbpfMessage'; data: EbpfMessage }
  | { type: 'EbpfConnection'; data: ConnectionEvent }
  | { type: 'RpcPeerInfos'; data: PeerInfo[] }
  | { type: 'RpcMempoolInfo'; data: MempoolInfo }
  | { type: 'RpcOrphanTxs'; data: OrphanTx[] }
  | { type: 'LogEvent'; data: LogEntry };

type EventHandler = (event: BitcoinEvent) => void;

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

/**
 * Subscription message the peer-observer websocket expects after opening.
 * The server sends nothing until it receives one (see websocket-picker.js).
 */
export interface Subscriptions {
  ebpf: {
    messages: boolean;
    mempool: boolean;
    validation: boolean;
    connections: boolean;
  };
  p2p: boolean;
  log: boolean;
  rpc: boolean;
}

// The log stream is very high volume (~1k events/s), so it is opt-in.
export const DEFAULT_SUBSCRIPTIONS: Subscriptions = {
  ebpf: { messages: true, mempool: true, validation: false, connections: true },
  p2p: false,
  log: false,
  rpc: true,
};

export class BitcoinWebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private statusHandler: ((status: WsStatus) => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private url: string = '';
  private subscriptions: Subscriptions = DEFAULT_SUBSCRIPTIONS;

  connect(url: string): void {
    this.url = url;
    this.shouldReconnect = true;
    this._connect();
  }

  private _connect(): void {
    if (this.statusHandler) this.statusHandler('connecting');

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this._sendSubscriptions();
      if (this.statusHandler) this.statusHandler('connected');
    };

    this.ws.onclose = () => {
      if (this.statusHandler) this.statusHandler('disconnected');
      if (this.shouldReconnect) this._scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose fires after onerror, so reconnect is handled there
    };

    this.ws.onmessage = (msg: MessageEvent) => {
      try {
        const event = JSON.parse(msg.data);
        this._dispatch(event);
      } catch {
        // ignore malformed JSON
      }
    };
  }

  private _sendSubscriptions(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(this.subscriptions));
    }
  }

  /** Update subscriptions; applied immediately if open, otherwise on next connect. */
  setSubscriptions(subscriptions: Subscriptions): void {
    this.subscriptions = subscriptions;
    this._sendSubscriptions();
  }

  private _scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect) this._connect();
    }, 3000);
  }

  private _dispatch(event: Record<string, unknown>): void {
    if (event.EbpfExtractor) {
      const ebpf = (event.EbpfExtractor as Record<string, unknown>).ebpf_event as Record<string, unknown>;
      if (ebpf?.Message) {
        this._emit({ type: 'EbpfMessage', data: ebpf.Message as EbpfMessage });
      } else if (ebpf?.Connection) {
        // Server sends PascalCase inside { event: { Inbound|Outbound|Closed|InboundEvicted: ... } }
        const conn = ebpf.Connection as Record<string, unknown>;
        const evt = (conn.event ?? conn) as ConnectionEvent;
        this._emit({ type: 'EbpfConnection', data: evt });
      }
    } else if (event.RpcExtractor) {
      const rpc = (event.RpcExtractor as Record<string, unknown>).rpc_event as Record<string, unknown>;
      if (rpc?.PeerInfos) {
        const pi = rpc.PeerInfos as Record<string, unknown>;
        this._emit({ type: 'RpcPeerInfos', data: (pi.infos ?? []) as PeerInfo[] });
      } else if (rpc?.MempoolInfo) {
        this._emit({ type: 'RpcMempoolInfo', data: rpc.MempoolInfo as MempoolInfo });
      } else if (rpc?.OrphanTxs) {
        const ot = rpc.OrphanTxs as Record<string, unknown>;
        this._emit({ type: 'RpcOrphanTxs', data: (ot.orphans ?? []) as OrphanTx[] });
      }
    } else if (event.LogExtractor) {
      // LogExtractor events: log_event is { <Kind>: { raw_message, ... } }
      const logExt = event.LogExtractor as Record<string, unknown>;
      const logEvent = logExt.log_event;
      let message: string | undefined;
      if (typeof logEvent === 'string') {
        message = logEvent;
      } else if (logEvent && typeof logEvent === 'object') {
        const inner = Object.values(logEvent)[0] as Record<string, unknown> | undefined;
        if (typeof inner?.raw_message === 'string') message = inner.raw_message;
      }
      const thread = typeof logExt.threadname === 'string' ? `[${logExt.threadname}] ` : '';
      const raw = message !== undefined ? `${thread}${message}` : JSON.stringify(logExt);
      // log_timestamp is in microseconds
      const ts = typeof logExt.log_timestamp === 'number' ? new Date(logExt.log_timestamp / 1000) : new Date();
      const logEntry: LogEntry = {
        timestamp: ts,
        raw,
      };
      this._emit({ type: 'LogEvent', data: logEntry });
    }
  }

  private _emit(event: BitcoinEvent): void {
    const handlers = this.handlers.get(event.type) || [];
    handlers.forEach(h => h(event));
    const allHandlers = this.handlers.get('*') || [];
    allHandlers.forEach(h => h(event));
  }

  on(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  onStatus(handler: (status: WsStatus) => void): void {
    this.statusHandler = handler;
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    if (this.statusHandler) this.statusHandler('disconnected');
  }
}

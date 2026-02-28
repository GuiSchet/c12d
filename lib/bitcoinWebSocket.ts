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

export class BitcoinWebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private statusHandler: ((status: WsStatus) => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private url: string = '';

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
      // LogExtractor events: extract the log_event string if available
      const logExt = event.LogExtractor as Record<string, unknown>;
      const raw: string =
        typeof logExt.log_event === 'string'
          ? logExt.log_event
          : JSON.stringify(logExt);
      const logEntry: LogEntry = {
        timestamp: new Date(),
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

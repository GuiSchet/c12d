"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { BitcoinWebSocketManager, WsStatus, EbpfMessage, ConnectionEvent, PeerInfo, MempoolInfo, OrphanTx, LogEntry } from "@/lib/bitcoinWebSocket";
import { RollingBuffer } from "@/lib/bitcoinDataBuffer";

// ── sessionStorage cache ────────────────────────────────────────────────────

const CACHE_KEY = 'peer_observer_ts_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

// ── Typed data rows consumed by charts ────────────────────────────────────

export interface MsgTypeRow { command: string; count: number }
export interface MsgRateRow { time: string; rate: number }
export interface ConnectionRow { time: string; inbound: number; outbound: number; block_relay: number; feeler: number }
export interface MempoolRow { time: string; count: number; bytes: number; minfee: number }
export interface PeerTypeRow { name: string; value: number; fill: string }
export interface PeerTrafficRow { name: string; bytes: number }
export interface OrphanCountRow { time: string; count: number }
export interface OrphanVsizeRow { vsize: number; fromCount: number; txid?: string; firstPeer?: number }
export interface OrphanSourceRow { peer: string; count: number }

export interface BitcoinDataState {
  // network topic
  msgTypeCounts: MsgTypeRow[];
  msgRateSeries: MsgRateRow[];
  connectionHistory: ConnectionRow[];

  // mempool topic
  mempoolSeries: MempoolRow[];

  // peers topic
  peersByType: PeerTypeRow[];
  peersByNetwork: PeerTypeRow[];
  peersTraffic: PeerTrafficRow[];

  // orphans topic
  orphanCountSeries: OrphanCountRow[];
  orphanVsizeSeries: OrphanVsizeRow[];
  orphanSourcesBar: OrphanSourceRow[];

  // logs topic
  recentLogs: LogEntry[];

  // meta
  wsStatus: WsStatus;
  lastUpdate: Date | null;
}

const DEFAULT_STATE: BitcoinDataState = {
  msgTypeCounts: [], msgRateSeries: [], connectionHistory: [],
  mempoolSeries: [],
  peersByType: [], peersByNetwork: [], peersTraffic: [],
  orphanCountSeries: [], orphanVsizeSeries: [], orphanSourcesBar: [],
  recentLogs: [],
  wsStatus: 'disconnected', lastUpdate: null,
};

// ── Color palettes ─────────────────────────────────────────────────────────

const TYPE_COLORS = ["#F7931A", "#E8830F", "#D47210", "#BF6100", "#AA5000", "#954000", "#FF9C2A", "#FFAD44", "#FFBE5E", "#FFCF78"];
const NET_COLORS = { ipv4: "#F7931A", ipv6: "#4A9EFF", onion: "#9B59B6", i2p: "#2ECC71", cjdns: "#E74C3C", unknown: "#95A5A6" };

// ── Context ────────────────────────────────────────────────────────────────

interface BitcoinDataContextType {
  data: BitcoinDataState;
}

const BitcoinDataContext = createContext<BitcoinDataContextType>({ data: DEFAULT_STATE });

// ── Provider ───────────────────────────────────────────────────────────────

export function BitcoinDataProvider({ children, wsUrl }: { children: React.ReactNode; wsUrl: string }) {
  const [data, setData] = useState<BitcoinDataState>(DEFAULT_STATE);

  // Rolling buffers (mutable refs – not React state)
  const msgCountsRef = useRef<Map<string, number>>(new Map());
  const msgRateBuf = useRef(new RollingBuffer<MsgRateRow>(60));
  const connHistBuf = useRef(new RollingBuffer<ConnectionRow>(60));
  const mempoolBuf = useRef(new RollingBuffer<MempoolRow>(60));
  const orphanCountBuf = useRef(new RollingBuffer<OrphanCountRow>(60));
  const orphanVsizeBuf = useRef(new RollingBuffer<OrphanVsizeRow>(200));
  const orphanSrcMap = useRef<Map<string, number>>(new Map());
  const logBuf = useRef(new RollingBuffer<LogEntry>(500));

  // Peer state (replaced on each RPC update)
  const peersRef = useRef<PeerInfo[]>([]);

  // Connection counters (updated by eBPF events)
  const connCountsRef = useRef({ inbound: 0, outbound: 0, block_relay: 0, feeler: 0 });

  // Message counter for rate calculation
  const msgCounterRef = useRef(0);

  const managerRef = useRef<BitcoinWebSocketManager | null>(null);
  const lastCacheSave = useRef(0);

  // ── Helper: format HH:MM:SS ──────────────────────────────────────────────
  const nowTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  // ── Helper: rebuild peers pie data ──────────────────────────────────────
  const rebuildPeersPie = useCallback((peers: PeerInfo[]) => {
    // By connection type
    const typeMap: Record<string, number> = {};
    // By network
    const netMap: Record<string, number> = {};
    peers.forEach(p => {
      const ct = p.connection_type || 'unknown';
      typeMap[ct] = (typeMap[ct] ?? 0) + 1;
      const net = p.network || 'unknown';
      netMap[net] = (netMap[net] ?? 0) + 1;
    });

    const byType: PeerTypeRow[] = Object.entries(typeMap).map(([name, value], i) => ({
      name, value, fill: TYPE_COLORS[i % TYPE_COLORS.length],
    }));

    const byNetwork: PeerTypeRow[] = Object.entries(netMap).map(([name, value]) => ({
      name, value, fill: (NET_COLORS as Record<string, string>)[name] ?? NET_COLORS.unknown,
    }));

    const traffic: PeerTrafficRow[] = peers
      .slice()
      .sort((a, b) => b.bytes_received - a.bytes_received)
      .slice(0, 10)
      .map(p => ({ name: `peer#${p.id}`, bytes: p.bytes_received }));

    return { byType, byNetwork, traffic };
  }, []);

  // ── Cache helpers ─────────────────────────────────────────────────────────

  const saveCacheToStorage = useCallback(() => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        msgRateSeries: msgRateBuf.current.get(),
        connectionHistory: connHistBuf.current.get(),
        mempoolSeries: mempoolBuf.current.get(),
        orphanCountSeries: orphanCountBuf.current.get(),
      }));
    } catch { /* ignore */ }
  }, []);

  const loadCacheFromStorage = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const cache = JSON.parse(raw) as {
        timestamp: number;
        msgRateSeries?: MsgRateRow[];
        connectionHistory?: ConnectionRow[];
        mempoolSeries?: MempoolRow[];
        orphanCountSeries?: OrphanCountRow[];
      };
      if (Date.now() - cache.timestamp > CACHE_TTL_MS) return;
      cache.msgRateSeries?.forEach((r) => msgRateBuf.current.push(r));
      cache.connectionHistory?.forEach((r) => connHistBuf.current.push(r));
      cache.mempoolSeries?.forEach((r) => mempoolBuf.current.push(r));
      cache.orphanCountSeries?.forEach((r) => orphanCountBuf.current.push(r));
    } catch { /* ignore */ }
  }, []);

  // ── Flush state to React ─────────────────────────────────────────────────
  const flushState = useCallback((wsStatus?: WsStatus) => {
    const { byType, byNetwork, traffic } = rebuildPeersPie(peersRef.current);

    // Rebuild orphan sources bar (top 10)
    const orphanSources: OrphanSourceRow[] = [...orphanSrcMap.current.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([peer, count]) => ({ peer, count }));

    // Rebuild msgTypeCounts from rolling window
    const msgTypeCounts: MsgTypeRow[] = [...msgCountsRef.current.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([command, count]) => ({ command, count }));

    setData(prev => ({
      ...prev,
      msgTypeCounts,
      msgRateSeries: msgRateBuf.current.get(),
      connectionHistory: connHistBuf.current.get(),
      mempoolSeries: mempoolBuf.current.get(),
      peersByType: byType,
      peersByNetwork: byNetwork,
      peersTraffic: traffic,
      orphanCountSeries: orphanCountBuf.current.get(),
      orphanVsizeSeries: orphanVsizeBuf.current.get(),
      orphanSourcesBar: orphanSources,
      recentLogs: logBuf.current.get(),
      ...(wsStatus !== undefined ? { wsStatus } : {}),
      lastUpdate: new Date(),
    }));

    const now = Date.now();
    if (now - lastCacheSave.current > 5000) {
      lastCacheSave.current = now;
      saveCacheToStorage();
    }
  }, [rebuildPeersPie, saveCacheToStorage]);

  useEffect(() => {
    const mgr = new BitcoinWebSocketManager();
    managerRef.current = mgr;

    // ── Status changes ───────────────────────────────────────────────────
    mgr.onStatus(status => {
      setData(prev => ({ ...prev, wsStatus: status }));
    });

    // ── eBPF P2P messages ────────────────────────────────────────────────
    mgr.on('EbpfMessage', ev => {
      if (ev.type !== 'EbpfMessage') return;
      const meta = (ev.data as EbpfMessage).meta;
      const norm = meta.command.toLowerCase();

      // Update per-type counter
      msgCountsRef.current.set(norm, (msgCountsRef.current.get(norm) ?? 0) + 1);
      msgCounterRef.current++;

      // Log notable messages: block, headers, feefilter, version, addrv2
      const notable = ['block', 'headers', 'feefilter', 'version', 'addrv2', 'addr', 'ping'];
      if (notable.includes(norm)) {
        const dir = meta.inbound ? 'recv' : 'sent';
        logBuf.current.push({
          timestamp: new Date(),
          raw: `[p2p] ${dir} ${norm} peer=${meta.peer_id} addr=${meta.addr} size=${meta.size}B`,
        });
      }
    });

    // ── eBPF connections ─────────────────────────────────────────────────
    mgr.on('EbpfConnection', ev => {
      if (ev.type !== 'EbpfConnection') return;
      const conn = ev.data as ConnectionEvent;
      const c = connCountsRef.current;

      if ('Inbound' in conn) {
        c.inbound = Math.max(0, (conn.Inbound.existing_connections ?? c.inbound) + 1);
        logBuf.current.push({
          timestamp: new Date(),
          raw: `[conn] NEW inbound peer=${conn.Inbound.conn.peer_id} addr=${conn.Inbound.conn.addr} existing=${conn.Inbound.existing_connections}`,
        });
      } else if ('Outbound' in conn) {
        const ct = conn.Outbound.conn.conn_type;
        if (ct === 3) c.block_relay++;
        else if (ct === 4) c.feeler++;
        else c.outbound++;
        const typeLabel = ct === 3 ? 'block-relay' : ct === 4 ? 'feeler' : 'outbound';
        logBuf.current.push({
          timestamp: new Date(),
          raw: `[conn] NEW ${typeLabel} peer=${conn.Outbound.conn.peer_id} addr=${conn.Outbound.conn.addr}`,
        });
      } else if ('Closed' in conn) {
        logBuf.current.push({
          timestamp: new Date(),
          raw: `[conn] CLOSED peer=${conn.Closed.conn.peer_id} addr=${conn.Closed.conn.addr} uptime=${conn.Closed.time_established}s`,
        });
      } else if ('InboundEvicted' in conn) {
        logBuf.current.push({
          timestamp: new Date(),
          raw: `[conn] EVICTED peer=${conn.InboundEvicted.conn.peer_id} addr=${conn.InboundEvicted.conn.addr}`,
        });
      }
      flushState();
    });

    // ── RPC peer infos ────────────────────────────────────────────────────
    mgr.on('RpcPeerInfos', ev => {
      if (ev.type !== 'RpcPeerInfos') return;
      const peers = ev.data as PeerInfo[];
      peersRef.current = peers;

      // Rebuild connection counts from authoritative RPC data
      const c = { inbound: 0, outbound: 0, block_relay: 0, feeler: 0 };
      peers.forEach(p => {
        const ct = (p.connection_type ?? '').toLowerCase();
        if (p.inbound) c.inbound++;
        else if (ct.includes('block')) c.block_relay++;
        else if (ct.includes('feeler')) c.feeler++;
        else c.outbound++;
      });
      connCountsRef.current = c;

      connHistBuf.current.push({ time: nowTime(), ...c });
      flushState();
    });

    // ── RPC mempool info ──────────────────────────────────────────────────
    mgr.on('RpcMempoolInfo', ev => {
      if (ev.type !== 'RpcMempoolInfo') return;
      const m = ev.data as MempoolInfo;
      mempoolBuf.current.push({
        time: nowTime(),
        count: m.size,
        bytes: m.bytes,
        minfee: m.mempoolminfee,
      });
      logBuf.current.push({
        timestamp: new Date(),
        raw: `[rpc] mempool txs=${m.size} size=${(m.bytes / 1024).toFixed(1)}KB minfee=${m.mempoolminfee.toFixed(8)} BTC/kvB`,
      });
      flushState();
    });

    // ── RPC orphan txs ────────────────────────────────────────────────────
    mgr.on('RpcOrphanTxs', ev => {
      if (ev.type !== 'RpcOrphanTxs') return;
      const orphans = ev.data as OrphanTx[];

      orphanCountBuf.current.push({ time: nowTime(), count: orphans.length });
      if (orphans.length > 0) {
        logBuf.current.push({
          timestamp: new Date(),
          raw: `[rpc] orphanpool count=${orphans.length} sample=[${orphans.slice(0, 3).map(o => o.txid.slice(0, 8)).join(',')}${orphans.length > 3 ? '...' : ''}]`,
        });
      }

      // Vsize scatter (replace with current snapshot)
      orphanVsizeBuf.current.clear();
      orphans.forEach(o => {
        orphanVsizeBuf.current.push({ vsize: o.vsize, fromCount: o.from.length, txid: o.txid, firstPeer: o.from[0] });
        o.from.forEach(peerId => {
          const key = `${peerId}`;
          orphanSrcMap.current.set(key, (orphanSrcMap.current.get(key) ?? 0) + 1);
        });
      });

      flushState();
    });

    // ── Log events ────────────────────────────────────────────────────────
    mgr.on('LogEvent', ev => {
      if (ev.type !== 'LogEvent') return;
      logBuf.current.push(ev.data as LogEntry);
      flushState();
    });

    // ── Ticker: msg rate every second ────────────────────────────────────
    const rateTicker = setInterval(() => {
      const rate = msgCounterRef.current;
      msgCounterRef.current = 0;
      msgRateBuf.current.push({ time: nowTime(), rate });
      // Also reset per-type counts every 60s (sliding window approximation)
      if (msgRateBuf.current.size() % 60 === 0) {
        msgCountsRef.current.clear();
      }
      flushState();
    }, 1000);

    loadCacheFromStorage();
    flushState();
    mgr.connect(wsUrl);

    return () => {
      clearInterval(rateTicker);
      mgr.disconnect();
    };
  }, [wsUrl, flushState, loadCacheFromStorage]);

  return (
    <BitcoinDataContext.Provider value={{ data }}>
      {children}
    </BitcoinDataContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useBitcoinData(): BitcoinDataState {
  return useContext(BitcoinDataContext).data;
}

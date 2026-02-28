"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBitcoinData, PeerActivityRecord } from "@/contexts/BitcoinDataContext";
import { useChatContext } from "@/contexts/ChatContext";
import { PeerInfo } from "@/lib/bitcoinWebSocket";

// ── Network color palette (matches BitcoinDataContext) ──────────────────────

const NET_COLORS: Record<string, string> = {
  ipv4: "#F7931A", ipv6: "#4A9EFF", onion: "#9B59B6",
  i2p: "#2ECC71", cjdns: "#E74C3C", unknown: "#95A5A6",
};

/** Command → particle color. */
const CMD_COLORS: Record<string, string> = {
  inv: "#FFD700", tx: "#2ECC71", block: "#E74C3C", ping: "#4A9EFF",
  pong: "#4A9EFF", addr: "#9B59B6", version: "#FF9C2A", verack: "#FF9C2A",
};

/** Ring radii as fraction of the smaller viewport dimension. */
const RING_ORDER = ["ipv4", "ipv6", "onion", "i2p", "cjdns", "unknown"];
const RING_RADIUS_FRAC = [0.38, 0.32, 0.26, 0.20, 0.16, 0.12];

// ── Types ───────────────────────────────────────────────────────────────────

interface PeerNode {
  peer: PeerInfo;
  angle: number;
  ring: number;
  x: number;
  y: number;
  radius: number;
}

interface Particle {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  size: number;
  startTime: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Scale peer node radius by bytes_received (4–12px). */
function peerNodeRadius(bytesRx: number, maxBytes: number): number {
  if (maxBytes <= 0) return 5;
  return 4 + 8 * Math.sqrt(bytesRx / maxBytes);
}

/** Format bytes to human-readable string. */
function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ───────────────────────────────────────────────────────────────

/** Radial network graph with animated particles showing live P2P activity. */
export function NetworkPulseGraph() {
  const { currentPeers, peerActivity } = useBitcoinData();
  const { sendMessage } = useChatContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [hoveredPeer, setHoveredPeer] = useState<PeerInfo | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const [selectedNetworks, setSelectedNetworks] = useState<Set<string>>(new Set(RING_ORDER));
  const [topNPeers, setTopNPeers] = useState<number | null>(null);

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const cx = dims.w / 2;
  const cy = dims.h / 2;
  const unit = Math.min(dims.w, dims.h);

  // ── Filter peers ─────────────────────────────────────────────────────────

  const filteredPeers = useMemo(() => {
    let peers = currentPeers.filter(p => selectedNetworks.has(p.network || "unknown"));
    peers = [...peers].sort((a, b) =>
      (b.bytes_received + b.bytes_sent) - (a.bytes_received + a.bytes_sent)
    );
    return topNPeers !== null ? peers.slice(0, topNPeers) : peers;
  }, [currentPeers, selectedNetworks, topNPeers]);

  // ── Compute peer node positions ──────────────────────────────────────────

  const peerNodes: PeerNode[] = useMemo(() => {
    if (!unit || filteredPeers.length === 0) return [];

    const maxBytes = Math.max(...filteredPeers.map(p => p.bytes_received), 1);

    // Group peers by network
    const groups: Record<string, PeerInfo[]> = {};
    filteredPeers.forEach(p => {
      const net = p.network || "unknown";
      (groups[net] ??= []).push(p);
    });

    const nodes: PeerNode[] = [];

    RING_ORDER.forEach((net, ringIdx) => {
      const peers = groups[net];
      if (!peers?.length) return;
      const ringR = RING_RADIUS_FRAC[ringIdx] * unit;
      peers.forEach((peer, i) => {
        const angle = (2 * Math.PI * i) / peers.length - Math.PI / 2;
        nodes.push({
          peer,
          angle,
          ring: ringIdx,
          x: cx + ringR * Math.cos(angle),
          y: cy + ringR * Math.sin(angle),
          radius: peerNodeRadius(peer.bytes_received, maxBytes),
        });
      });
    });

    return nodes;
  }, [filteredPeers, cx, cy, unit]);

  // Build a peerId → node position lookup
  const peerPosMap = useMemo(() => {
    const m = new Map<number, { x: number; y: number }>();
    peerNodes.forEach(n => m.set(n.peer.id, { x: n.x, y: n.y }));
    return m;
  }, [peerNodes]);

  // ── Spawn particles from recent peer activity ────────────────────────────

  const activityRef = useRef<PeerActivityRecord[]>([]);

  useEffect(() => {
    activityRef.current = peerActivity;
  }, [peerActivity]);

  // Generate particles from activity changes
  useEffect(() => {
    if (peerActivity.length === 0 || peerPosMap.size === 0) return;

    const now = Date.now();
    const newParticles: Particle[] = [];

    for (const act of peerActivity) {
      // Only spawn for very recent activity (<1s)
      if (now - act.lastTimestamp > 1000) continue;

      const pos = peerPosMap.get(act.peerId);
      if (!pos) continue;

      // Cap particles
      if (newParticles.length >= 15) break;

      const color = CMD_COLORS[act.lastCommand] ?? "#F7931A";
      const size = act.lastCommand === "block" ? 4 : act.lastCommand === "tx" ? 3 : 2;

      if (act.lastInbound) {
        // Particle flows from peer to center
        newParticles.push({
          id: `p${particleIdRef.current++}`,
          fromX: pos.x, fromY: pos.y,
          toX: cx, toY: cy,
          color, size, startTime: now,
        });
      } else {
        // Particle flows from center to peer
        newParticles.push({
          id: `p${particleIdRef.current++}`,
          fromX: cx, fromY: cy,
          toX: pos.x, toY: pos.y,
          color, size, startTime: now,
        });
      }
    }

    if (newParticles.length > 0) {
      setParticles(prev => [...prev, ...newParticles].slice(-50));
    }
  }, [peerActivity, peerPosMap, cx, cy]);

  // Clean up expired particles every 1.5s
  useEffect(() => {
    const timer = setInterval(() => {
      const cutoff = Date.now() - 1200;
      setParticles(prev => prev.filter(p => p.startTime > cutoff));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  // ── Click handler: send peer details to AI chat ──────────────────────────

  const handlePeerClick = useCallback((peer: PeerInfo) => {
    sendMessage(
      `Tell me about this Bitcoin peer: id=#${peer.id}, address=${peer.address}, ` +
      `network=${peer.network}, type=${peer.connection_type}, ` +
      `inbound=${peer.inbound}, ping=${peer.ping_time}ms, ` +
      `sent=${fmtBytes(peer.bytes_sent)}, received=${fmtBytes(peer.bytes_received)}, ` +
      `version=${peer.subversion}. Is this a healthy peer connection?`
    );
  }, [sendMessage]);

  // ── Activity lookup for glow effect ──────────────────────────────────────

  const activityMap = useMemo(() => {
    const m = new Map<number, PeerActivityRecord>();
    peerActivity.forEach(a => m.set(a.peerId, a));
    return m;
  }, [peerActivity]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (dims.w === 0 || dims.h === 0) {
    return <div ref={containerRef} className="w-full h-full" />;
  }

  if (currentPeers.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-3">
        <div className="animate-pulse text-4xl">&#8383;</div>
        <p className="text-sm">Waiting for peer data...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <svg width={dims.w} height={dims.h} className="absolute inset-0">
        {/* Glow filter */}
        <defs>
          <filter id="pulse-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="center-grad">
            <stop offset="0%" stopColor="#F7931A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F7931A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Concentric ring guides */}
        {RING_ORDER.map((net, i) => {
          const r = RING_RADIUS_FRAC[i] * unit;
          if (r <= 0) return null;
          return (
            <circle key={net} cx={cx} cy={cy} r={r}
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1}
              strokeDasharray="4 6" />
          );
        })}

        {/* Edges from center to each peer */}
        {peerNodes.map(n => (
          <line key={`edge-${n.peer.id}`}
            x1={cx} y1={cy} x2={n.x} y2={n.y}
            stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
        ))}

        {/* Center ambient glow */}
        <circle cx={cx} cy={cy} r={unit * 0.08} fill="url(#center-grad)" />

        {/* Center pulsing rings */}
        {[0, 1, 2].map(i => (
          <motion.circle
            key={`pulse-${i}`}
            cx={cx} cy={cy}
            r={unit * 0.03}
            fill="none" stroke="#F7931A"
            initial={{ r: unit * 0.02, opacity: 0.6, strokeWidth: 2 }}
            animate={{ r: unit * 0.07, opacity: 0, strokeWidth: 0.5 }}
            transition={{
              duration: 3, repeat: Infinity, ease: "easeOut",
              delay: i * 1,
            }}
          />
        ))}

        {/* Center node */}
        <circle cx={cx} cy={cy} r={unit * 0.025}
          fill="#F7931A" filter="url(#pulse-glow)" />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize={unit * 0.018} fontWeight="bold"
          style={{ pointerEvents: "none" }}>
          &#8383;
        </text>

        {/* Particles */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.circle
              key={p.id}
              r={p.size}
              fill={p.color}
              filter="url(#node-glow)"
              initial={{ cx: p.fromX, cy: p.fromY, opacity: 1 }}
              animate={{ cx: p.toX, cy: p.toY, opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>

        {/* Peer nodes */}
        <AnimatePresence>
          {peerNodes.map(n => {
            const net = n.peer.network || "unknown";
            const fill = NET_COLORS[net] ?? NET_COLORS.unknown;
            const act = activityMap.get(n.peer.id);
            const isActive = act && (Date.now() - act.lastTimestamp < 2000);
            const isHovered = hoveredPeer?.id === n.peer.id;

            return (
              <motion.g
                key={`peer-${n.peer.id}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPeer(n.peer)}
                onMouseLeave={() => setHoveredPeer(null)}
                onClick={() => handlePeerClick(n.peer)}
              >
                {/* Activity ring pulse */}
                {isActive && (
                  <motion.circle
                    cx={n.x} cy={n.y}
                    r={n.radius}
                    fill="none" stroke={fill}
                    initial={{ r: n.radius, opacity: 0.8, strokeWidth: 2 }}
                    animate={{ r: n.radius + 10, opacity: 0, strokeWidth: 0.5 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}

                {/* Peer circle */}
                <circle
                  cx={n.x} cy={n.y} r={isHovered ? n.radius * 1.3 : n.radius}
                  fill={fill}
                  fillOpacity={isHovered ? 1 : 0.8}
                  stroke={isHovered ? "white" : "rgba(255,255,255,0.2)"}
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  filter={isActive ? "url(#node-glow)" : undefined}
                  style={{ transition: "r 0.2s ease, fill-opacity 0.2s ease" }}
                />

                {/* Peer label (only if hovered or large enough) */}
                {(isHovered || n.radius > 8) && (
                  <text
                    x={n.x} y={n.y + n.radius + 12}
                    textAnchor="middle" fill="rgba(255,255,255,0.6)"
                    fontSize={9} fontFamily="monospace"
                    style={{ pointerEvents: "none" }}
                  >
                    #{n.peer.id}
                  </text>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Hover tooltip via foreignObject */}
        {hoveredPeer && (() => {
          const node = peerNodes.find(n => n.peer.id === hoveredPeer.id);
          if (!node) return null;
          const tw = 200;
          const th = 110;
          // Position tooltip to avoid overflow
          let tx = node.x - tw / 2;
          let ty = node.y - node.radius - th - 8;
          if (ty < 0) ty = node.y + node.radius + 8;
          if (tx < 4) tx = 4;
          if (tx + tw > dims.w - 4) tx = dims.w - tw - 4;

          return (
            <foreignObject x={tx} y={ty} width={tw} height={th}>
              <div className="bg-black/90 border border-[#F7931A]/40 rounded-lg px-3 py-2 text-[10px] font-mono text-white/80 shadow-xl">
                <div className="text-[#F7931A] font-bold text-xs mb-1">
                  Peer #{hoveredPeer.id}
                </div>
                <div className="truncate">{hoveredPeer.address}</div>
                <div>Network: <span className="text-white">{hoveredPeer.network}</span></div>
                <div>Type: <span className="text-white">{hoveredPeer.connection_type}</span></div>
                <div>Ping: <span className="text-white">{hoveredPeer.ping_time?.toFixed(0) ?? "?"}ms</span></div>
                <div>RX: <span className="text-white">{fmtBytes(hoveredPeer.bytes_received)}</span></div>
              </div>
            </foreignObject>
          );
        })()}
      </svg>

      {/* Network legend — interactive toggles */}
      <div className="absolute bottom-3 right-3 bg-black/60 rounded-lg px-3 py-2 text-[10px] font-mono backdrop-blur-sm border border-white/10">
        {RING_ORDER.filter(net => currentPeers.some(p => (p.network || "unknown") === net)).map(net => {
          const active = selectedNetworks.has(net);
          return (
            <button key={net}
              onClick={() => setSelectedNetworks(prev => {
                const next = new Set(prev);
                active ? next.delete(net) : next.add(net);
                return next;
              })}
              className="flex items-center gap-2 py-0.5 w-full hover:opacity-100 transition-opacity"
              style={{ opacity: active ? 1 : 0.3 }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NET_COLORS[net] }} />
              <span className="text-white/60">{net}</span>
              {!active && <span className="ml-auto text-white/30">✕</span>}
            </button>
          );
        })}
      </div>

      {/* Peer count badge + Top N filter */}
      <div className="absolute top-3 left-3 bg-black/60 rounded-lg px-3 py-1.5 text-xs font-mono backdrop-blur-sm border border-white/10 text-white/60 flex items-center gap-2">
        <span>{filteredPeers.length}/{currentPeers.length} peers</span>
        <span className="text-white/30">|</span>
        {([null, 10, 25, 50] as (number | null)[]).map(n => (
          <button key={n ?? "all"}
            onClick={() => setTopNPeers(n)}
            className={`px-1.5 rounded ${topNPeers === n ? "text-white bg-white/20" : "hover:text-white/80"}`}>
            {n ?? "all"}
          </button>
        ))}
      </div>
    </div>
  );
}

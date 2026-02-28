"use client";

import { useEffect, useRef, useState } from "react";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, ResponsiveContainer, AreaChart, Area,
  ScatterChart, Scatter, CartesianGrid, Legend, Treemap,
} from "recharts";
import { useChartContext } from "./ChartContextProvider";
import { ChartDataSummary } from "@/types/charts";
import { calculateStatistics, generateDataInsights } from "@/lib/chartDataUtils";
import { useBitcoinData, BitcoinDataState } from "@/contexts/BitcoinDataContext";
import { useChatContext } from "@/contexts/ChatContext";
import { NetworkPulseGraph } from "@/components/NetworkPulseGraph";

interface ShadcnChartProps {
  chartId?: string;
  chartType: "bar" | "line" | "pie" | "area" | "scatter" | "treemap";
  enableInteractions?: boolean;
  className?: string;
  onChartReady?: () => void;
}

// ── Color palette (bitcoin orange → amber) ─────────────────────────────────

const BITCOIN_PALETTE = [
  "#F7931A", "#E8830F", "#D47210", "#BF6100",
  "#AA5000", "#954000", "#FF9C2A", "#FFAD44",
  "#FFBE5E", "#FFCF78",
];

// ── Per-chart axis configuration ──────────────────────────────────────────

interface ChartAxes {
  xKey: string;
  yKeys: string[];
  scatterX?: string;
  scatterY?: string;
  horizontal?: boolean;
}

const CHART_AXES: Record<string, ChartAxes> = {
  "msg-types-bar":      { xKey: "command", yKeys: ["count"] },
  "msg-rate-line":      { xKey: "time",    yKeys: ["rate"] },
  "connections-area":   { xKey: "time",    yKeys: ["inbound", "outbound", "block_relay", "feeler"] },
  "mempool-count-line": { xKey: "time",    yKeys: ["count"] },
  "mempool-bytes-area": { xKey: "time",    yKeys: ["bytes"] },
  "mempool-fees-line":  { xKey: "time",    yKeys: ["minfee"] },
  "peers-by-type-pie":      { xKey: "name", yKeys: ["value"] },
  "peers-by-network-pie":   { xKey: "name", yKeys: ["value"] },
  "peers-traffic-bar":      { xKey: "name", yKeys: ["bytes"], horizontal: true },
  "orphan-count-line":      { xKey: "time", yKeys: ["count"] },
  "orphan-vsize-scatter":   { xKey: "vsize", yKeys: ["fromCount"], scatterX: "vsize", scatterY: "fromCount" },
  "orphan-sources-bar":     { xKey: "peer",  yKeys: ["count"] },
  "network-pulse-graph":    { xKey: "id",    yKeys: ["bytes_received"] },
};

// ── Chart config for recharts' ChartContainer ─────────────────────────────

const CHART_CONFIGS: Record<string, ChartConfig> = {
  "msg-types-bar":    { count: { label: "Messages",       color: "#F7931A" } },
  "msg-rate-line":    { rate:  { label: "Msgs/sec",       color: "#F7931A" } },
  "connections-area": {
    inbound:     { label: "Inbound",     color: "#F7931A" },
    outbound:    { label: "Outbound",    color: "#E8830F" },
    block_relay: { label: "Block Relay", color: "#D47210" },
    feeler:      { label: "Feeler",      color: "#BF6100" },
  },
  "mempool-count-line": { count:  { label: "Txs",             color: "#F7931A" } },
  "mempool-bytes-area": { bytes:  { label: "Bytes",            color: "#F7931A" } },
  "mempool-fees-line":  { minfee: { label: "Min Fee (BTC/kB)", color: "#F7931A" } },
  "peers-by-type-pie":    { value: { label: "Peers",      color: "#F7931A" } },
  "peers-by-network-pie": { value: { label: "Peers",      color: "#F7931A" } },
  "peers-traffic-bar":    { bytes: { label: "Bytes RX",   color: "#F7931A" } },
  "orphan-count-line":    { count:     { label: "Orphans",        color: "#F7931A" } },
  "orphan-vsize-scatter": { fromCount: { label: "Announcers",     color: "#F7931A" } },
  "orphan-sources-bar":   { count:     { label: "Orphans",        color: "#F7931A" } },
  "network-pulse-graph":  { bytes_received: { label: "Bytes RX", color: "#F7931A" } },
};

// ── Map chartId → data slice from BitcoinDataState ────────────────────────

function getDataForChart(id: string | undefined, bd: BitcoinDataState): Record<string, unknown>[] {
  if (!id) return [];
  switch (id) {
    case "msg-types-bar":       return bd.msgTypeCounts    as unknown as Record<string, unknown>[];
    case "msg-rate-line":       return bd.msgRateSeries    as unknown as Record<string, unknown>[];
    case "connections-area":    return bd.connectionHistory as unknown as Record<string, unknown>[];
    case "mempool-count-line":  return bd.mempoolSeries    as unknown as Record<string, unknown>[];
    case "mempool-bytes-area":  return bd.mempoolSeries    as unknown as Record<string, unknown>[];
    case "mempool-fees-line":   return bd.mempoolSeries    as unknown as Record<string, unknown>[];
    case "peers-by-type-pie":   return bd.peersByType      as unknown as Record<string, unknown>[];
    case "peers-by-network-pie":return bd.peersByNetwork   as unknown as Record<string, unknown>[];
    case "peers-traffic-bar":   return bd.peersTraffic     as unknown as Record<string, unknown>[];
    case "orphan-count-line":   return bd.orphanCountSeries as unknown as Record<string, unknown>[];
    case "orphan-vsize-scatter":return bd.orphanVsizeSeries as unknown as Record<string, unknown>[];
    case "orphan-sources-bar":  return bd.orphanSourcesBar  as unknown as Record<string, unknown>[];
    case "network-pulse-graph": return bd.currentPeers      as unknown as Record<string, unknown>[];
    default: return [];
  }
}

// ── Shared empty / waiting state ──────────────────────────────────────────

function EmptyState() {
  const bitcoinData = useBitcoinData();
  return (
    <div className="flex flex-col items-center justify-center h-full text-white/40 gap-3">
      <div className="animate-pulse text-4xl">₿</div>
      <p className="text-sm">Waiting for node data…</p>
      <p className="text-xs text-white/25">
        {bitcoinData.wsStatus === "connecting"    ? "Connecting to WebSocket…"
          : bitcoinData.wsStatus === "disconnected" ? "Disconnected — reconnecting…"
          : "Connected. Waiting for events."}
      </p>
    </div>
  );
}

// ── Treemap chart ──────────────────────────────────────────────────────────

function TreemapChart({ data }: { data: Record<string, unknown>[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { sendMessage } = useChatContext();

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const treeData = data
    .map(d => ({
      name: ((d.txid as string) ?? '').slice(0, 8) || 'tx',
      size: (d.vsize as number) || 1,
      fromCount: (d.fromCount as number) || 1,
      firstPeer: d.firstPeer as number | undefined,
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 20);

  const peerColor = (peerId: number | undefined) =>
    BITCOIN_PALETTE[(peerId ?? 0) % BITCOIN_PALETTE.length];

  const CustomCell = (props: Record<string, unknown>) => {
    // Skip non-leaf (parent) nodes — they render the orange background
    const depth = (props as { depth?: number }).depth ?? 0;
    if (depth < 1) return <g />;

    const { x, y, width, height, index, name, fromCount, size, firstPeer } =
      props as { x: number; y: number; width: number; height: number; index: number;
                 name: string; fromCount: number; size: number; firstPeer?: number };
    const fill = peerColor(firstPeer);
    const extra = fromCount > 1 ? ` +${fromCount - 1}` : '';
    const isHovered = hoveredIdx === index;

    // Inset each cell to create visible gaps between blocks
    const gap = 5;
    const cx = x + gap;
    const cy = y + gap;
    const cw = Math.max(0, width - gap * 2);
    const ch = Math.max(0, height - gap * 2);

    // Seeded PRNG so each cell gets a unique but deterministic random path
    let s = index * 2654435761 + 374761393;
    const rand = () => { s = (s ^ (s >> 16)) * 2246822507 >>> 0; s = (s ^ (s >> 13)) * 3266489917 >>> 0; return ((s ^ (s >> 16)) >>> 0) / 4294967296; };

    const dur = 4 + rand() * 4;                          // 4 – 8s cycle
    const points = 6;
    const waypoints: string[] = ["0,0"];
    for (let i = 1; i < points - 1; i++) {
      const px = (rand() - 0.5) * 10;                    // -5 to +5 px
      const py = (rand() - 0.5) * 10;
      waypoints.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    waypoints.push("0,0");
    const driftValues = waypoints.join("; ");
    const driftSplines = Array(waypoints.length - 1)
      .fill(`${(0.3 + rand() * 0.3).toFixed(2)} 0 ${(0.5 + rand() * 0.3).toFixed(2)} 1`)
      .join("; ");

    if (cw <= 0 || ch <= 0) return null;

    return (
      <g
        onMouseEnter={() => setHoveredIdx(index)}
        onMouseLeave={() => setHoveredIdx(null)}
        onClick={() => {
          const fullTxid = ((data[index] as Record<string, unknown>)?.txid as string) ?? name;
          sendMessage(
            `Tell me about this orphan transaction: txid=${fullTxid}, vsize=${size} bytes, announced by ${fromCount} peer${fromCount > 1 ? "s" : ""} (first peer: #${firstPeer ?? "unknown"}). What could cause a transaction to become orphaned, and what does its size and peer count suggest?`
          );
        }}
        style={{ cursor: "pointer" }}
      >
        {/* Idle drift animation — figure-eight-ish wandering path */}
        <animateTransform
          attributeName="transform"
          type="translate"
          values={driftValues}
          dur={`${dur}s`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines={driftSplines}
        />

        {/* Glow layer visible on hover */}
        {isHovered && (
          <rect
            x={cx - 2} y={cy - 2}
            width={cw + 4} height={ch + 4}
            rx={5}
            fill="none"
            stroke={fill}
            strokeWidth={2}
            opacity={0.7}
            filter="url(#treemap-glow)"
          />
        )}

        {/* Main cell */}
        <rect x={cx} y={cy} width={cw} height={ch}
          fill={fill}
          fillOpacity={isHovered ? 1 : 0.85}
          stroke={isHovered ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)"}
          strokeWidth={isHovered ? 1.5 : 1}
          rx={4}
          style={{
            transition: "fill-opacity 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease",
          }}
        />

        {/* Labels */}
        {cw > 40 && ch > 28 && (
          <text x={cx + 5} y={cy + 15} fill="white" fontSize={10} fontFamily="monospace"
            fontWeight="bold" style={{ pointerEvents: "none" }}>{name}</text>
        )}
        {cw > 40 && ch > 44 && (
          <text x={cx + 5} y={cy + 28} fill="rgba(255,255,255,0.75)" fontSize={9}
            style={{ pointerEvents: "none" }}>
            {size}B · peer#{firstPeer ?? '?'}{extra}
          </text>
        )}

        {/* Hover tooltip overlay */}
        {isHovered && cw > 30 && ch > 20 && (
          <g style={{ pointerEvents: "none" }}>
            <rect
              x={cx + cw / 2 - 55} y={cy - 34}
              width={110} height={26} rx={6}
              fill="rgba(0,0,0,0.9)"
              stroke="rgba(247,147,26,0.5)" strokeWidth={1}
            />
            <text
              x={cx + cw / 2} y={cy - 17}
              textAnchor="middle" fill="#F7931A" fontSize={10} fontWeight="bold"
              fontFamily="monospace"
            >
              {size}B · {fromCount} peer{fromCount > 1 ? 's' : ''}
            </text>
          </g>
        )}
      </g>
    );
  };

  if (data.length === 0) return <EmptyState />;

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {/* Hidden SVG providing the glow filter definition */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="treemap-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      {dims.w > 0 && dims.h > 0 && (
        <Treemap
          width={dims.w} height={dims.h}
          data={treeData} dataKey="size"
          content={<CustomCell />}
        />
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function ShadcnChart({
  chartId,
  chartType,
  className = "",
  onChartReady,
}: ShadcnChartProps) {
  const { context, handleChartDataExtracted } = useChartContext();
  const bitcoinData = useBitcoinData();

  const activeId = chartId ?? context.selectedChart?.id;
  const axes     = activeId ? (CHART_AXES[activeId]   ?? { xKey: "time", yKeys: ["value"] }) : { xKey: "time", yKeys: ["value"] };
  const config   = activeId ? (CHART_CONFIGS[activeId] ?? {}) : {};
  const data     = getDataForChart(activeId, bitcoinData);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleClick = (_payload: Record<string, unknown>) => {};

  // ── Extract data for chat context ─────────────────────────────────────────

  useEffect(() => {
    if (data.length > 0 && context.selectedChart && handleChartDataExtracted) {
      const dataFields = context.selectedChart.dataFields ?? [];
      const statistics = calculateStatistics(data, dataFields);
      const insights   = generateDataInsights(data, chartType, dataFields, statistics);
      const summary: ChartDataSummary = { totalRecords: data.length, dataValues: data, statistics, insights };
      handleChartDataExtracted(summary);
      if (onChartReady) setTimeout(() => onChartReady(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, chartType, context.selectedChart?.id, handleChartDataExtracted]);

  // ── Shared axis / grid styles ─────────────────────────────────────────────

  const axisProps = {
    tick:     { fill: "white", fontSize: 11 },
    axisLine: { stroke: "rgba(255,255,255,0.3)" },
    tickLine: { stroke: "rgba(255,255,255,0.3)" },
  };

  const gridProps = {
    stroke:          "rgba(255,255,255,0.12)",
    strokeDasharray: "3 3",
    horizontal:      true,
    vertical:        false,
  };

  // ── Tooltip ───────────────────────────────────────────────────────────────

  const CustomTooltip = ({
    active, payload, label,
  }: {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number; name: string; payload: Record<string, unknown> }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-black/90 border border-[#F7931A]/40 text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="font-semibold text-[#F7931A] mb-1">
          {label ?? (payload[0]?.payload?.[axes.xKey] as string) ?? ""}
        </p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm">
            <span className="font-medium">{entry.name ?? entry.dataKey}:</span>
            <span className="ml-2 font-mono">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  // ── Gradient defs (for area charts) ──────────────────────────────────────

  const gradientDefs = (
    <defs>
      {BITCOIN_PALETTE.slice(0, 4).map((color, i) => (
        <linearGradient key={i} id={`btcGrad${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity={0.75} />
          <stop offset="95%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      ))}
    </defs>
  );

  // ── Chart renderers ───────────────────────────────────────────────────────

  const renderChart = () => {
    // Network pulse graph is a fully custom component
    if (activeId === "network-pulse-graph") return <NetworkPulseGraph />;

    if (data.length === 0) return <EmptyState />;

    switch (chartType) {

      // ── BAR ──────────────────────────────────────────────────────────────
      case "bar": {
        if (axes.horizontal) {
          return (
            <ChartContainer config={config} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 10, right: 40, left: 60, bottom: 10 }}>
                  <CartesianGrid {...gridProps} horizontal={false} vertical={true} />
                  <XAxis type="number" {...axisProps} />
                  <YAxis type="category" dataKey={axes.xKey} {...axisProps} width={60}
                    tick={{ ...axisProps.tick, fontSize: 9 }} />
                  <ChartTooltip content={<CustomTooltip />} />
                  <Bar dataKey={axes.yKeys[0]} fill="#F7931A" radius={[0, 6, 6, 0]}
                    onClick={handleClick} className="cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          );
        }
        return (
          <ChartContainer config={config} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey={axes.xKey} {...axisProps} angle={-45} textAnchor="end" height={70} />
                <YAxis {...axisProps} />
                <ChartTooltip content={<CustomTooltip />} />
                {axes.yKeys.map((key, i) => (
                  <Bar key={key} dataKey={key}
                    fill={BITCOIN_PALETTE[i % BITCOIN_PALETTE.length]}
                    radius={[4, 4, 0, 0]}
                    onClick={handleClick} className="cursor-pointer" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      }

      // ── LINE ─────────────────────────────────────────────────────────────
      case "line":
        return (
          <ChartContainer config={config} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey={axes.xKey} {...axisProps} angle={-30} textAnchor="end" height={50} />
                <YAxis {...axisProps} />
                <ChartTooltip content={<CustomTooltip />} />
                {axes.yKeys.map((key, i) => (
                  <Line key={key} type="monotone" dataKey={key}
                    stroke={BITCOIN_PALETTE[i % BITCOIN_PALETTE.length]}
                    strokeWidth={2} dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      // ── AREA ─────────────────────────────────────────────────────────────
      case "area":
        return (
          <ChartContainer config={config} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                {gradientDefs}
                <CartesianGrid {...gridProps} />
                <XAxis dataKey={axes.xKey} {...axisProps} angle={-30} textAnchor="end" height={50} />
                <YAxis {...axisProps} />
                <ChartTooltip content={<CustomTooltip />} />
                {axes.yKeys.length > 1 && (
                  <Legend verticalAlign="top"
                    wrapperStyle={{ color: "white", fontSize: "11px", paddingBottom: "8px" }} />
                )}
                {axes.yKeys.map((key, i) => (
                  <Area key={key} type="monotone" dataKey={key}
                    stroke={BITCOIN_PALETTE[i % BITCOIN_PALETTE.length]}
                    fill={`url(#btcGrad${i})`}
                    strokeWidth={2}
                    stackId={axes.yKeys.length > 1 ? "stack" : undefined} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      // ── PIE ──────────────────────────────────────────────────────────────
      case "pie": {
        const pieData = data as Array<{ name: string; value: number; fill?: string }>;
        return (
          <ChartContainer config={config} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
                <Pie data={pieData} cx="50%" cy="45%"
                  innerRadius={55} outerRadius={110} paddingAngle={2}
                  dataKey="value"
                  onClick={handleClick} className="cursor-pointer"
                  stroke="rgba(255,255,255,0.12)" strokeWidth={1}>
                  {pieData.map((entry, i) => (
                    <Cell key={`cell-${i}`}
                      fill={entry.fill ?? BITCOIN_PALETTE[i % BITCOIN_PALETTE.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle"
                  wrapperStyle={{ color: "white", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        );
      }

      // ── SCATTER ──────────────────────────────────────────────────────────
      case "scatter":
        return (
          <ChartContainer config={config} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
                <CartesianGrid {...gridProps} vertical={true} />
                <XAxis dataKey={axes.scatterX ?? axes.xKey} type="number"
                  name={axes.scatterX ?? axes.xKey}
                  domain={["dataMin", "dataMax"]} {...axisProps}
                  label={{ value: axes.scatterX ?? "x", position: "insideBottom",
                    fill: "rgba(255,255,255,0.45)", fontSize: 10, offset: -8 }} />
                <YAxis dataKey={axes.scatterY ?? axes.yKeys[0]} type="number"
                  name={axes.scatterY ?? axes.yKeys[0]}
                  domain={[0, "dataMax + 1"]} {...axisProps} />
                <ChartTooltip content={<CustomTooltip />}
                  cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={data} fill="#F7931A" fillOpacity={0.75}
                  onClick={handleClick} className="cursor-pointer" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        );

      // ── TREEMAP ───────────────────────────────────────────────────────────
      case "treemap":
        return <TreemapChart data={data} />;

      default:
        return <EmptyState />;
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      {renderChart()}
    </div>
  );
}

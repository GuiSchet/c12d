import { TopicChart, ChartTemplate } from "@/types/charts";

// Minimal Vega-Lite spec placeholder (actual rendering done by Recharts in ShadcnChart)
const emptySpec = (title: string, mark: string = "bar") => ({
  $schema: "https://vega.github.io/schema/vega-lite/v5.json" as const,
  title,
  data: { values: [] as Record<string, unknown>[] },
  mark: mark as "bar",
  encoding: {},
});

export const bitcoinChartTemplates: TopicChart[] = [
  // ── 1. Network ────────────────────────────────────────────────────────
  {
    topicId: "network",
    charts: [
      {
        id: "msg-types-bar",
        name: "P2P Message Types",
        description: "Count of each P2P message type in the last 60 seconds",
        agentDescription: "Shows how many messages of each type (inv, tx, addr, ping, etc.) have been received in the last 60-second window. Spikes in 'inv' indicate high transaction announcement activity; many 'addr' messages may indicate network probing.",
        type: "bar",
        spec: emptySpec("P2P Message Types"),
        dataFields: ["command", "count"],
        metrics: ["msg_count", "msg_diversity"],
      } as ChartTemplate,
      {
        id: "msg-rate-line",
        name: "Message Rate / second",
        description: "P2P messages per second over time",
        agentDescription: "Time series of messages/second. Sudden spikes may indicate block propagation bursts or transaction spam. Flat periods with zero rate may indicate a disconnection or inactive node.",
        type: "line",
        spec: emptySpec("Message Rate", "line"),
        dataFields: ["time", "rate"],
        metrics: ["msg_rate", "peak_rate"],
      } as ChartTemplate,
      {
        id: "connections-area",
        name: "Active Connections by Type",
        description: "Number of peers by connection type over time",
        agentDescription: "Stacked area chart showing inbound, outbound, block-relay, and feeler peers over time. A healthy node balances inbound and outbound connections. Many inbound with few outbound may indicate a node behind NAT.",
        type: "area",
        spec: emptySpec("Active Connections", "area"),
        dataFields: ["time", "inbound", "outbound", "block_relay", "feeler"],
        metrics: ["total_peers", "inbound_ratio"],
      } as ChartTemplate,
    ],
  },

  // ── 2. Mempool ────────────────────────────────────────────────────────
  {
    topicId: "mempool",
    charts: [
      {
        id: "mempool-count-line",
        name: "Mempool Transaction Count",
        description: "Number of transactions in the mempool over time",
        agentDescription: "Unconfirmed transactions in the mempool. Sharp increases indicate network congestion. Sudden drops happen after a large block is mined or after low-fee transactions are purged.",
        type: "line",
        spec: emptySpec("Mempool Transaction Count", "line"),
        dataFields: ["time", "count"],
        metrics: ["tx_count", "mempool_trend"],
      } as ChartTemplate,
      {
        id: "mempool-bytes-area",
        name: "Mempool Total Weight",
        description: "Sum of virtual bytes of all transactions in the mempool",
        agentDescription: "Total mempool weight in virtual bytes (vBytes). Exceeding the 300 MB limit causes Bitcoin Core to start evicting low-fee transactions. Useful for correlating with fee spikes.",
        type: "area",
        spec: emptySpec("Mempool Weight", "area"),
        dataFields: ["time", "bytes"],
        metrics: ["mempool_bytes", "capacity_usage"],
      } as ChartTemplate,
      {
        id: "mempool-fees-line",
        name: "Mempool Minimum Fee",
        description: "mempoolminfee over time (BTC/kB)",
        agentDescription: "The minimum fee Bitcoin Core accepts to include a transaction in the mempool. When the mempool is full, this value rises dynamically. Sustained periods above minrelayfee indicate persistent congestion.",
        type: "line",
        spec: emptySpec("Minimum Fee", "line"),
        dataFields: ["time", "minfee"],
        metrics: ["minfee", "fee_trend"],
      } as ChartTemplate,
    ],
  },

  // ── 3. Peers ──────────────────────────────────────────────────────────
  {
    topicId: "peers",
    charts: [
      {
        id: "peers-by-type-pie",
        name: "Peers by Connection Type",
        description: "Distribution of peers by type: inbound, outbound-full-relay, block-relay-only, feeler",
        agentDescription: "Distribution of connection types. A healthy node has ~8 outbound + ~2 block-relay-only + ~1 feeler. Many inbound is normal if the node is reachable. Zero outbound indicates a connectivity problem.",
        type: "pie",
        spec: emptySpec("Peers by Type", "arc"),
        dataFields: ["name", "value"],
        metrics: ["inbound_count", "outbound_count"],
      } as ChartTemplate,
      {
        id: "peers-by-network-pie",
        name: "Peers by Network",
        description: "Distribution of peers by network: IPv4, IPv6, Tor, I2P, CJDNS",
        agentDescription: "Network diversity of peers. Connectivity to Tor and I2P indicates good resistance to network attacks. IPv4-only nodes are more vulnerable to transaction correlation. Network diversity improves privacy and resilience.",
        type: "pie",
        spec: emptySpec("Peers by Network", "arc"),
        dataFields: ["name", "value"],
        metrics: ["network_diversity", "tor_count"],
      } as ChartTemplate,
      {
        id: "peers-traffic-bar",
        name: "Top 10 Peers by Received Traffic",
        description: "The 10 peers that have sent the most bytes to this node",
        agentDescription: "Top peers by bytes received from them. A peer with disproportionately high traffic may be sending large blocks, or in anomalous cases may indicate an eclipse node or excessive data provider.",
        type: "bar",
        spec: emptySpec("Top Peers by Traffic"),
        dataFields: ["name", "bytes"],
        metrics: ["max_traffic", "traffic_distribution"],
      } as ChartTemplate,
    ],
  },

  // ── 4. Orphans ────────────────────────────────────────────────────────
  {
    topicId: "orphans",
    charts: [
      {
        id: "orphan-count-line",
        name: "Orphan Transactions over Time",
        description: "Number of orphan transactions in the node's orphanage",
        agentDescription: "Number of orphan transactions (txs whose inputs are not yet in the UTXO set). A persistently high orphanage may indicate high-complexity transactions, RBF transaction packages, or an orphan flooding attack.",
        type: "line",
        spec: emptySpec("Orphans over Time", "line"),
        dataFields: ["time", "count"],
        metrics: ["orphan_count", "orphan_trend"],
      } as ChartTemplate,
      {
        id: "orphan-vsize-scatter",
        name: "Orphan Transactions",
        description: "Each current orphan tx as a block sized by vsize, colored by announcing peer",
        agentDescription: "Packed treemap of the current orphanage snapshot. Each rectangle is one orphan transaction; its area is proportional to vsize (virtual bytes). Color is keyed to the first peer that announced the tx, so a single dominant color means one peer is responsible for most orphans. Hover a tile to see txid, vsize, and peer ID.",
        type: "treemap",
        spec: emptySpec("Orphan Transactions", "rect"),
        dataFields: ["txid", "vsize", "fromCount", "firstPeer"],
        metrics: ["avg_vsize", "max_announcers"],
      } as ChartTemplate,
      {
        id: "orphan-sources-bar",
        name: "Top Peers Announcing Orphans",
        description: "Peers that have sent the most orphan transactions to this node",
        agentDescription: "Peers ranked by number of orphans they announced. A peer sending disproportionately many orphans may be running an orphan flooding attack, attempting to exhaust node memory, or forcing eviction of legitimate transactions.",
        type: "bar",
        spec: emptySpec("Top Orphan Announcers"),
        dataFields: ["peer", "count"],
        metrics: ["top_sender", "orphan_concentration"],
      } as ChartTemplate,
    ],
  },

  // ── 5. Logs ───────────────────────────────────────────────────────────
  {
    topicId: "logs",
    charts: [
      {
        id: "logs-viewer",
        name: "Real-Time Debug Logs",
        description: "Live stream of Bitcoin Core debug.log with grep filter",
        agentDescription: "Live log stream from the Bitcoin Core node. Look for patterns like 'UpdateTip' for new blocks, 'ProcessNewBlock' for validation, 'socket recv error' for network issues, or 'AcceptToMemoryPool' for accepted transactions.",
        type: "bar", // placeholder – DashboardLayout renders LogViewer directly
        spec: emptySpec("Logs"),
        dataFields: ["timestamp", "message"],
        metrics: ["log_rate", "error_count"],
      } as ChartTemplate,
    ],
  },
];

// ── Helper functions (same API as chartTemplates.ts) ──────────────────────

export function getChartsForTopic(topicId: string): ChartTemplate[] {
  const topic = bitcoinChartTemplates.find(t => t.topicId === topicId);
  return topic?.charts ?? [];
}

export function getChartById(chartId: string): ChartTemplate | undefined {
  for (const topic of bitcoinChartTemplates) {
    const chart = topic.charts.find(c => c.id === chartId);
    if (chart) return chart;
  }
  return undefined;
}

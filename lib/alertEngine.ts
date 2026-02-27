import type { AlertMetric, AlertOperator } from "@/types/alerts";
import type { BitcoinDataState } from "@/contexts/BitcoinDataContext";

/** Human-readable labels for each metric. */
export const METRIC_LABELS: Record<AlertMetric, string> = {
  msg_rate: "Message Rate (msg/s)",
  mempool_count: "Mempool Tx Count",
  mempool_bytes: "Mempool Size (bytes)",
  mempool_minfee: "Mempool Min Fee (BTC/kB)",
  peer_count_total: "Total Peers",
  peer_count_inbound: "Inbound Peers",
  peer_count_outbound: "Outbound Peers",
  orphan_count: "Orphan Tx Count",
};

/** Human-readable labels for each operator. */
export const OPERATOR_LABELS: Record<AlertOperator, string> = {
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  eq: "=",
};

/**
 * Extract the latest numeric value for a given metric from the live data state.
 * Returns null when the relevant buffer is empty.
 */
export function extractMetricValue(
  metric: AlertMetric,
  data: BitcoinDataState,
): number | null {
  switch (metric) {
    case "msg_rate": {
      const last = data.msgRateSeries[data.msgRateSeries.length - 1];
      return last ? last.rate : null;
    }
    case "mempool_count": {
      const last = data.mempoolSeries[data.mempoolSeries.length - 1];
      return last ? last.count : null;
    }
    case "mempool_bytes": {
      const last = data.mempoolSeries[data.mempoolSeries.length - 1];
      return last ? last.bytes : null;
    }
    case "mempool_minfee": {
      const last = data.mempoolSeries[data.mempoolSeries.length - 1];
      return last ? last.minfee : null;
    }
    case "peer_count_total":
      return data.peersByType.reduce((sum, r) => sum + r.value, 0) || null;
    case "peer_count_inbound": {
      const inbound = data.peersByType.find(
        (r) => r.name === "inbound-full-relay",
      );
      return inbound ? inbound.value : null;
    }
    case "peer_count_outbound": {
      const outbound = data.peersByType.find(
        (r) => r.name === "outbound-full-relay",
      );
      return outbound ? outbound.value : null;
    }
    case "orphan_count": {
      const last =
        data.orphanCountSeries[data.orphanCountSeries.length - 1];
      return last ? last.count : null;
    }
  }
}

/** Evaluate whether a value passes a threshold condition. */
export function evaluateCondition(
  value: number,
  operator: AlertOperator,
  threshold: number,
): boolean {
  switch (operator) {
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
    case "eq":
      return value === threshold;
  }
}

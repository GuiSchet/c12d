/** Metrics that the alert engine can evaluate. */
export type AlertMetric =
  | "msg_rate"
  | "mempool_count"
  | "mempool_bytes"
  | "mempool_minfee"
  | "peer_count_total"
  | "peer_count_inbound"
  | "peer_count_outbound"
  | "orphan_count";

/** Comparison operators for threshold evaluation. */
export type AlertOperator = "gt" | "gte" | "lt" | "lte" | "eq";

/** Severity levels, used for styling and ordering. */
export type AlertSeverity = "critical" | "warning" | "info";

/** A user-defined alert rule. */
export interface AlertRule {
  id: string;
  name: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  severity: AlertSeverity;
  /** Minimum seconds between repeat firings for the same rule. */
  cooldownSeconds: number;
  enabled: boolean;
}

/** A recorded alert event (rule that fired). */
export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  actualValue: number;
  severity: AlertSeverity;
  timestamp: number;
  dismissed: boolean;
}

/** Value exposed by AlertContext to consumers. */
export interface AlertContextValue {
  rules: AlertRule[];
  events: AlertEvent[];
  /** Number of un-dismissed events. */
  activeCount: number;
  addRule: (rule: Omit<AlertRule, "id">) => void;
  updateRule: (id: string, patch: Partial<AlertRule>) => void;
  removeRule: (id: string) => void;
  dismissEvent: (id: string) => void;
  dismissAll: () => void;
  clearHistory: () => void;
}

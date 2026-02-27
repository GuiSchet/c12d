"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { METRIC_LABELS, OPERATOR_LABELS } from "@/lib/alertEngine";
import type {
  AlertMetric,
  AlertOperator,
  AlertSeverity,
  AlertRule,
} from "@/types/alerts";

const METRICS = Object.keys(METRIC_LABELS) as AlertMetric[];
const OPERATORS = Object.keys(OPERATOR_LABELS) as AlertOperator[];
const SEVERITIES: AlertSeverity[] = ["critical", "warning", "info"];

interface AlertRuleFormProps {
  /** When provided the form pre-fills for editing. */
  initial?: AlertRule;
  onSubmit: (rule: Omit<AlertRule, "id">) => void;
  onCancel: () => void;
}

/** Form for creating or editing an alert rule. */
export function AlertRuleForm({ initial, onSubmit, onCancel }: AlertRuleFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [metric, setMetric] = useState<AlertMetric>(initial?.metric ?? "msg_rate");
  const [operator, setOperator] = useState<AlertOperator>(initial?.operator ?? "gt");
  const [threshold, setThreshold] = useState(String(initial?.threshold ?? ""));
  const [severity, setSeverity] = useState<AlertSeverity>(initial?.severity ?? "warning");
  const [cooldown, setCooldown] = useState(String(initial?.cooldownSeconds ?? 30));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseFloat(threshold);
    if (!name.trim() || isNaN(t)) return;
    onSubmit({
      name: name.trim(),
      metric,
      operator,
      threshold: t,
      severity,
      cooldownSeconds: Math.max(1, parseInt(cooldown) || 30),
      enabled: initial?.enabled ?? true,
    });
  };

  const selectClass =
    "w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#F7931A]/60";
  const inputClass = selectClass;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Name */}
      <div>
        <label className="text-white/50 text-xs mb-1 block">Name</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. High msg rate"
        />
      </div>

      {/* Metric */}
      <div>
        <label className="text-white/50 text-xs mb-1 block">Metric</label>
        <select className={selectClass} value={metric} onChange={(e) => setMetric(e.target.value as AlertMetric)}>
          {METRICS.map((m) => (
            <option key={m} value={m} className="bg-zinc-900">
              {METRIC_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {/* Operator + Threshold */}
      <div className="flex gap-2">
        <div className="w-1/3">
          <label className="text-white/50 text-xs mb-1 block">Operator</label>
          <select className={selectClass} value={operator} onChange={(e) => setOperator(e.target.value as AlertOperator)}>
            {OPERATORS.map((o) => (
              <option key={o} value={o} className="bg-zinc-900">
                {OPERATOR_LABELS[o]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-white/50 text-xs mb-1 block">Threshold</label>
          <input
            type="number"
            step="any"
            className={inputClass}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="text-white/50 text-xs mb-1 block">Severity</label>
        <div className="flex gap-2">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={`flex-1 text-xs py-1.5 rounded border transition-colors capitalize ${
                severity === s
                  ? s === "critical"
                    ? "border-red-500 bg-red-500/20 text-red-400"
                    : s === "warning"
                    ? "border-amber-500 bg-amber-500/20 text-amber-400"
                    : "border-blue-400 bg-blue-400/20 text-blue-400"
                  : "border-white/10 text-white/40 hover:border-white/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Cooldown */}
      <div>
        <label className="text-white/50 text-xs mb-1 block">Cooldown (seconds)</label>
        <input
          type="number"
          min="1"
          className={inputClass}
          value={cooldown}
          onChange={(e) => setCooldown(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          className="flex-1 bg-[#F7931A] hover:bg-[#E8830F] text-black font-medium"
        >
          {initial ? "Update" : "Create"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="text-white/50">
          Cancel
        </Button>
      </div>
    </form>
  );
}

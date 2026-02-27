"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, ToggleLeft, ToggleRight, Pencil, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/contexts/AlertContext";
import { AlertRuleForm } from "@/components/AlertRuleForm";
import { METRIC_LABELS, OPERATOR_LABELS } from "@/lib/alertEngine";
import type { AlertRule, AlertEvent } from "@/types/alerts";

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-400",
};

interface AlertPanelProps {
  open: boolean;
  onClose: () => void;
  /** Fires when the user clicks "Ask AI" on an event. */
  onAskAI?: (event: AlertEvent) => void;
}

/** Slide-over panel with Rules and History tabs. */
export function AlertPanel({ open, onClose, onAskAI }: AlertPanelProps) {
  const { rules, events, addRule, updateRule, removeRule, dismissEvent, dismissAll, clearHistory } =
    useAlerts();
  const [tab, setTab] = useState<"rules" | "history">("rules");
  const [editing, setEditing] = useState<AlertRule | null>(null);
  const [adding, setAdding] = useState(false);

  const tabClass = (active: boolean) =>
    `flex-1 text-center py-2 text-xs font-medium transition-colors ${
      active ? "text-[#F7931A] border-b-2 border-[#F7931A]" : "text-white/40 hover:text-white/60"
    }`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="fixed top-0 right-0 h-full w-80 z-50 bg-black/90 backdrop-blur-md border-l border-white/10 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Alerts</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button className={tabClass(tab === "rules")} onClick={() => setTab("rules")}>
              Rules ({rules.length})
            </button>
            <button className={tabClass(tab === "history")} onClick={() => setTab("history")}>
              History ({events.length})
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* ── Rules tab ─────────────────────────────────────────────── */}
            {tab === "rules" && (
              <>
                {(adding || editing) ? (
                  <AlertRuleForm
                    initial={editing ?? undefined}
                    onSubmit={(draft) => {
                      if (editing) {
                        updateRule(editing.id, draft);
                      } else {
                        addRule(draft);
                      }
                      setEditing(null);
                      setAdding(false);
                    }}
                    onCancel={() => {
                      setEditing(null);
                      setAdding(false);
                    }}
                  />
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAdding(true)}
                      className="w-full border border-dashed border-white/20 text-white/50 hover:text-white/80 hover:border-white/40"
                    >
                      <Plus size={14} className="mr-1" /> Add Rule
                    </Button>

                    {rules.length === 0 && (
                      <p className="text-white/30 text-xs text-center mt-6">
                        No rules defined yet.
                      </p>
                    )}

                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                          rule.enabled
                            ? "border-white/10 bg-white/5"
                            : "border-white/5 bg-white/[0.02] opacity-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[rule.severity]}`} />
                            <span className="text-white font-medium truncate max-w-[140px]">
                              {rule.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                              className="text-white/30 hover:text-white/70"
                              title={rule.enabled ? "Disable" : "Enable"}
                            >
                              {rule.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            </button>
                            <button
                              onClick={() => setEditing(rule)}
                              className="text-white/30 hover:text-white/70"
                              title="Edit"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => removeRule(rule.id)}
                              className="text-white/30 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <p className="text-white/40">
                          {METRIC_LABELS[rule.metric]} {OPERATOR_LABELS[rule.operator]} {rule.threshold}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {/* ── History tab ───────────────────────────────────────────── */}
            {tab === "history" && (
              <>
                {events.length > 0 && (
                  <div className="flex gap-2 mb-1">
                    <Button size="xs" variant="ghost" onClick={dismissAll} className="text-white/40 text-[10px]">
                      Dismiss all
                    </Button>
                    <Button size="xs" variant="ghost" onClick={clearHistory} className="text-white/40 text-[10px]">
                      Clear history
                    </Button>
                  </div>
                )}

                {events.length === 0 && (
                  <p className="text-white/30 text-xs text-center mt-6">
                    No alerts have fired yet.
                  </p>
                )}

                {[...events].reverse().map((ev) => (
                  <div
                    key={ev.id}
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      ev.dismissed
                        ? "border-white/5 bg-white/[0.02] opacity-40"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[ev.severity]}`} />
                        <span className="text-white font-medium truncate max-w-[140px]">
                          {ev.ruleName}
                        </span>
                      </div>
                      <span className="text-white/30 text-[10px]">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white/40 mb-1">
                      {METRIC_LABELS[ev.metric]} = {ev.actualValue} ({OPERATOR_LABELS[ev.operator]}{" "}
                      {ev.threshold})
                    </p>
                    <div className="flex gap-1">
                      {!ev.dismissed && (
                        <button
                          onClick={() => dismissEvent(ev.id)}
                          className="text-[10px] text-white/30 hover:text-white/60"
                        >
                          Dismiss
                        </button>
                      )}
                      {onAskAI && (
                        <button
                          onClick={() => onAskAI(ev)}
                          className="text-[10px] text-[#F7931A]/70 hover:text-[#F7931A] flex items-center gap-0.5"
                        >
                          <MessageSquare size={10} /> Ask AI
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

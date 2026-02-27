"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAlerts } from "@/contexts/AlertContext";
import { METRIC_LABELS, OPERATOR_LABELS } from "@/lib/alertEngine";
import type { AlertEvent } from "@/types/alerts";

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 10_000;

const SEVERITY_BG: Record<string, string> = {
  critical: "border-red-500/40 bg-red-500/10",
  warning: "border-amber-500/40 bg-amber-500/10",
  info: "border-blue-400/40 bg-blue-400/10",
};

const SEVERITY_TEXT: Record<string, string> = {
  critical: "text-red-400",
  warning: "text-amber-400",
  info: "text-blue-400",
};

/** Animated toast notifications for fired alerts. */
export function AlertToast() {
  const { events, dismissEvent } = useAlerts();
  const [visible, setVisible] = useState<AlertEvent[]>([]);
  const prevLenRef = useRef(events.length);

  // Track newly-added un-dismissed events
  useEffect(() => {
    if (events.length > prevLenRef.current) {
      const newOnes = events.slice(prevLenRef.current).filter((e) => !e.dismissed);
      setVisible((prev) => [...prev, ...newOnes].slice(-MAX_VISIBLE));
    }
    prevLenRef.current = events.length;
  }, [events]);

  const removeFromVisible = (id: string) => {
    setVisible((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="fixed top-4 left-4 z-[60] flex flex-col gap-2 pointer-events-none w-72">
      <AnimatePresence>
        {visible.map((ev) => (
          <ToastItem
            key={ev.id}
            event={ev}
            onDismiss={() => {
              dismissEvent(ev.id);
              removeFromVisible(ev.id);
            }}
            onExpire={() => removeFromVisible(ev.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Single toast with auto-dismiss and hover-pause. */
function ToastItem({
  event,
  onDismiss,
  onExpire,
}: {
  event: AlertEvent;
  onDismiss: () => void;
  onExpire: () => void;
}) {
  const hovered = useRef(false);
  const elapsed = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!hovered.current) {
        elapsed.current += 200;
        if (elapsed.current >= AUTO_DISMISS_MS) {
          onExpire();
        }
      }
    }, 200);
    return () => clearInterval(intervalRef.current);
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40, scale: 0.95 }}
      transition={{ type: "spring", damping: 22, stiffness: 300 }}
      onMouseEnter={() => (hovered.current = true)}
      onMouseLeave={() => (hovered.current = false)}
      className={`pointer-events-auto rounded-lg border backdrop-blur-md px-3 py-2 ${SEVERITY_BG[event.severity]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-xs font-semibold truncate ${SEVERITY_TEXT[event.severity]}`}>
            {event.ruleName}
          </p>
          <p className="text-white/50 text-[11px] leading-tight mt-0.5">
            {METRIC_LABELS[event.metric]} = {event.actualValue} ({OPERATOR_LABELS[event.operator]}{" "}
            {event.threshold})
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/30 hover:text-white/70 flex-shrink-0 mt-0.5"
        >
          <X size={12} />
        </button>
      </div>
    </motion.div>
  );
}

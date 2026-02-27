"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useBitcoinData } from "@/contexts/BitcoinDataContext";
import { extractMetricValue, evaluateCondition } from "@/lib/alertEngine";
import type {
  AlertRule,
  AlertEvent,
  AlertContextValue,
} from "@/types/alerts";

const RULES_KEY = "c12d_alert_rules";
const EVENTS_KEY = "c12d_alert_events";
const MAX_EVENTS = 200;

/** Generate a short unique id without external deps. */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── localStorage helpers ────────────────────────────────────────────────────

function loadRules(): AlertRule[] {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    return raw ? (JSON.parse(raw) as AlertRule[]) : [];
  } catch {
    return [];
  }
}

function saveRules(rules: AlertRule[]): void {
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  } catch {
    /* ignore */
  }
}

function loadEvents(): AlertEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    return raw ? (JSON.parse(raw) as AlertEvent[]) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: AlertEvent[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    /* ignore */
  }
}

// ── Context ─────────────────────────────────────────────────────────────────

const AlertCtx = createContext<AlertContextValue | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────────────────────

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<AlertRule[]>(loadRules);
  const [events, setEvents] = useState<AlertEvent[]>(loadEvents);
  const data = useBitcoinData();

  // Cooldown tracker: ruleId → last fired timestamp (ms)
  const cooldownMap = useRef<Map<string, number>>(new Map());

  // Persist rules whenever they change
  useEffect(() => {
    saveRules(rules);
  }, [rules]);

  // Persist events whenever they change
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  // ── Evaluation loop (~1/sec, driven by data.lastUpdate) ─────────────────
  useEffect(() => {
    if (!data.lastUpdate) return;

    const now = Date.now();
    const newEvents: AlertEvent[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const value = extractMetricValue(rule.metric, data);
      if (value === null) continue;

      if (!evaluateCondition(value, rule.operator, rule.threshold)) continue;

      // Cooldown check
      const lastFired = cooldownMap.current.get(rule.id) ?? 0;
      if (now - lastFired < rule.cooldownSeconds * 1000) continue;

      cooldownMap.current.set(rule.id, now);

      newEvents.push({
        id: uid(),
        ruleId: rule.id,
        ruleName: rule.name,
        metric: rule.metric,
        operator: rule.operator,
        threshold: rule.threshold,
        actualValue: value,
        severity: rule.severity,
        timestamp: now,
        dismissed: false,
      });
    }

    if (newEvents.length > 0) {
      setEvents((prev) => [...prev, ...newEvents].slice(-MAX_EVENTS));
    }
    // Only re-evaluate when data changes (lastUpdate) or rules change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.lastUpdate, rules]);

  // ── CRUD callbacks ──────────────────────────────────────────────────────

  const addRule = useCallback((draft: Omit<AlertRule, "id">) => {
    setRules((prev) => [...prev, { ...draft, id: uid() }]);
  }, []);

  const updateRule = useCallback(
    (id: string, patch: Partial<AlertRule>) => {
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    cooldownMap.current.delete(id);
  }, []);

  const dismissEvent = useCallback((id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, dismissed: true } : e)),
    );
  }, []);

  const dismissAll = useCallback(() => {
    setEvents((prev) => prev.map((e) => ({ ...e, dismissed: true })));
  }, []);

  const clearHistory = useCallback(() => {
    setEvents([]);
  }, []);

  const activeCount = events.filter((e) => !e.dismissed).length;

  return (
    <AlertCtx.Provider
      value={{
        rules,
        events,
        activeCount,
        addRule,
        updateRule,
        removeRule,
        dismissEvent,
        dismissAll,
        clearHistory,
      }}
    >
      {children}
    </AlertCtx.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAlerts(): AlertContextValue {
  const ctx = useContext(AlertCtx);
  if (!ctx) throw new Error("useAlerts must be used within an AlertProvider");
  return ctx;
}

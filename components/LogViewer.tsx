"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { LogEntry } from "@/lib/bitcoinWebSocket";

interface LogViewerProps {
  logs: LogEntry[];
  className?: string;
}

export function LogViewer({ logs, className = "" }: LogViewerProps) {
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter logs based on grep-style input
  const filteredLogs = useMemo(() => {
    if (!filter.trim()) return logs;
    try {
      const re = new RegExp(filter, "i");
      return logs.filter(l => re.test(l.raw));
    } catch {
      // Fall back to plain substring match if regex is invalid
      const lower = filter.toLowerCase();
      return logs.filter(l => l.raw.toLowerCase().includes(lower));
    }
  }, [logs, filter]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredLogs.length, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  // Highlight matching text in a log line
  const highlight = (text: string) => {
    if (!filter.trim()) return text;
    try {
      const re = new RegExp(`(${filter})`, "gi");
      const parts = text.split(re);
      return parts.map((part, i) =>
        re.test(part)
          ? <mark key={i} className="bg-bitcoin text-black px-0.5 rounded">{part}</mark>
          : part
      );
    } catch {
      return text;
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-mono text-xs">grep:</span>
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="filter by regex or string…"
            className="w-full pl-14 pr-4 py-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg text-white text-sm font-mono placeholder-white/30 focus:outline-none focus:border-[#F7931A]/60"
          />
        </div>
        <span className="text-white/50 text-xs font-mono whitespace-nowrap">
          {filteredLogs.length} / {logs.length}
        </span>
        <button
          onClick={() => setAutoScroll(v => !v)}
          title="Toggle auto-scroll"
          className={`px-3 py-2 rounded-lg text-xs font-mono border transition-all ${
            autoScroll
              ? "bg-[#F7931A]/20 border-[#F7931A]/60 text-[#F7931A]"
              : "bg-white/10 border-white/20 text-white/50"
          }`}
        >
          ↓ auto
        </button>
      </div>

      {/* Log lines */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-xs bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-3 space-y-0.5"
        style={{ minHeight: 0 }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-white/30 italic text-center pt-8">
            {logs.length === 0 ? "Waiting for node logs…" : "No results for the current filter."}
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className="flex gap-2 hover:bg-white/5 rounded px-1 py-0.5 leading-relaxed">
              <span className="text-[#F7931A]/70 shrink-0 select-none">
                {log.timestamp instanceof Date
                  ? log.timestamp.toTimeString().slice(0, 8)
                  : String(log.timestamp).slice(11, 19)}
              </span>
              <span className="text-white/80 break-all">{highlight(log.raw)}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

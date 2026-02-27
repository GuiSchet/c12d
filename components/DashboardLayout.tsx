"use client";

import { useState, useEffect, useCallback } from "react";
import { TopicWheel } from "@/components/TopicWheel";
import { ChartSelector } from "@/components/ChartSelector";
import { ShadcnChart } from "@/components/ShadcnChart";
import { LogViewer } from "@/components/LogViewer";
import { ChatPanel } from "@/components/ChatPanel";
import { AlertBadge } from "@/components/AlertBadge";
import { AlertToast } from "@/components/AlertToast";
import { AlertPanel } from "@/components/AlertPanel";
import { useChartContext } from "@/components/ChartContextProvider";
import { useBitcoinData } from "@/contexts/BitcoinDataContext";
import { useChatContext } from "@/contexts/ChatContext";
import { METRIC_LABELS, OPERATOR_LABELS } from "@/lib/alertEngine";
import { TopicId } from "@/types/charts";
import type { AlertEvent } from "@/types/alerts";

type View = "wheel" | "selector" | "chart";

function LeftPanel({ onAlertClick }: { onAlertClick: () => void }) {
  const [view, setView] = useState<View>("wheel");
  const { context, selectTopic, resetSelection, clearChart } = useChartContext();
  const bitcoinData = useBitcoinData();

  // Switch to chart view as soon as a chart is selected
  useEffect(() => {
    if (context.selectedChart && view === "selector") {
      setView("chart");
    }
  }, [context.selectedChart, view]);

  const handleTopicSelect = (topicId: TopicId) => {
    selectTopic(topicId);
    setView("selector");
  };

  const handleBack = () => {
    resetSelection();
    setView("wheel");
  };

  const handleBackToSelector = () => {
    clearChart();
    setView("selector");
  };

  const isLogsChart = context.selectedChart?.id === "logs-viewer";

  return (
    <div className="flex flex-col h-full overflow-hidden px-4 py-4">
      {/* WebSocket status bar */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <span className="text-white/60 text-xs font-mono">peer-observer</span>
        <div className="flex items-center gap-3">
          <AlertBadge onClick={onAlertClick} />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              bitcoinData.wsStatus === "connected"
                ? "bg-green-400 shadow-[0_0_6px_#4ade80]"
                : bitcoinData.wsStatus === "connecting"
                ? "bg-yellow-400 animate-pulse"
                : "bg-red-400"
            }`} />
            <span className="text-white/40 text-xs font-mono capitalize">{bitcoinData.wsStatus}</span>
          </div>
        </div>
      </div>

      {/* Back navigation */}
      {(view === "selector" || view === "chart") && (
        <button
          onClick={view === "chart" ? handleBackToSelector : handleBack}
          className="flex-shrink-0 text-white/50 text-xs hover:text-white/80 transition-colors mb-3 text-left"
        >
          ← {view === "chart" ? "Back to charts" : "Back to topics"}
        </button>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto min-h-0 flex flex-col items-center justify-center">
        {view === "wheel" && (
          <TopicWheel onTopicSelect={handleTopicSelect} />
        )}

        {view === "selector" && (
          <ChartSelector className="w-full" />
        )}

        {view === "chart" && context.selectedChart && (
          <div className="w-full h-full flex flex-col">
            <h3 className="text-white font-semibold text-base mb-3 flex-shrink-0">
              {context.selectedChart.name}
            </h3>
            <div className="flex-1 min-h-0">
              {isLogsChart ? (
                <LogViewer logs={bitcoinData.recentLogs} className="h-full" />
              ) : (
                <ShadcnChart
                  chartType={context.selectedChart.type as "bar" | "line" | "pie" | "area" | "scatter"}
                  className="h-full"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardLayout() {
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const { sendMessage } = useChatContext();

  /** Construct an explanation prompt and send it to the chat assistant. */
  const handleAskAI = useCallback(
    (event: AlertEvent) => {
      const prompt = `Alert "${event.ruleName}" fired. The metric "${METRIC_LABELS[event.metric]}" reached ${event.actualValue}, which is ${OPERATOR_LABELS[event.operator]} the threshold ${event.threshold}. Please explain what might cause this.`;
      sendMessage(prompt);
      setAlertPanelOpen(false);
    },
    [sendMessage],
  );

  return (
    <>
      <AlertToast />
      <AlertPanel open={alertPanelOpen} onClose={() => setAlertPanelOpen(false)} onAskAI={handleAskAI} />

      <div className="flex h-full w-full overflow-hidden">
        {/* Left panel — 60% */}
        <div className="w-3/5 h-full border-r border-white/10 overflow-hidden">
          <LeftPanel onAlertClick={() => setAlertPanelOpen((v) => !v)} />
        </div>

        {/* Right panel — 40% */}
        <div className="w-2/5 h-full overflow-hidden">
          <ChatPanel />
        </div>
      </div>
    </>
  );
}

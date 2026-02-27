"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import {
  ChartContext,
  ChartContextProviderProps,
  UseChartContext,
  ChartContextUpdate,
  TopicId,
  ChartTemplate,
  ChartDataSummary
} from "@/types/charts";
import { getChartsForTopic, getChartById } from "@/lib/chartTemplates";
import { processChartData } from "@/lib/chartDataUtils";

const ChartContextContext = createContext<UseChartContext | undefined>(undefined);

export function ChartContextProvider({ children }: ChartContextProviderProps) {
  const [selectedTopic, setSelectedTopic] = useState<TopicId | null>(null);
  const [selectedChart, setSelectedChart] = useState<ChartTemplate | null>(null);
  const [chartData, setChartData] = useState<ChartDataSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const chatContext = useChatContext();

  const availableCharts = useMemo(() => {
    if (!selectedTopic) return [];
    return getChartsForTopic(selectedTopic);
  }, [selectedTopic]);

  const context: ChartContext = {
    selectedTopic,
    selectedChart,
    availableCharts,
    chartData,
    isLoading,
    error
  };

  const handleChartDataExtracted = useCallback((extractedData: ChartDataSummary) => {
    // Prevent duplicate processing for same data size
    if (chartData && chartData.totalRecords === extractedData.totalRecords) return;

    setChartData(extractedData);

    // Push chart context to chat assistant
    if (selectedChart) {
      const stats = extractedData.statistics ?? {};
      chatContext.setCurrentChartContext({
        name: selectedChart.name,
        description: selectedChart.description,
        stats,
      });
    }
  }, [selectedChart, chatContext, chartData]);

  const selectTopic = useCallback((topicId: TopicId) => {
    setIsLoading(true);
    setError(undefined);
    try {
      setSelectedTopic(topicId);
      setSelectedChart(null);
      setChartData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select topic");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectChart = useCallback((chartId: string) => {
    if (!selectedTopic) return;
    setIsLoading(true);
    setError(undefined);
    try {
      const chart = getChartById(chartId);
      if (!chart) throw new Error(`Chart with ID ${chartId} not found`);

      setSelectedChart(chart);
      setChartData(null);

      // Update chat context immediately with chart metadata (no stats yet)
      chatContext.setCurrentChartContext({
        name: chart.name,
        description: chart.description,
        stats: {},
      });

      // Trigger auto-introduction from the assistant
      chatContext.sendMessage(
        `Introduce this chart to me briefly (2-3 sentences): what it measures and what to look for. Chart: "${chart.name}" — ${chart.description}`
      );

      // Extract initial spec data
      processChartData(chart.spec, chart.type, chart.dataFields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select chart");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTopic, chatContext]);

  const resetSelection = useCallback(() => {
    setSelectedTopic(null);
    setSelectedChart(null);
    setChartData(null);
    setError(undefined);
    chatContext.setCurrentChartContext(null);
  }, [chatContext]);

  const clearChart = useCallback(() => {
    setSelectedChart(null);
    setChartData(null);
    setError(undefined);
  }, []);

  // sendChartUpdate kept as a no-op to avoid breaking type contract
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sendChartUpdate = useCallback((_update: ChartContextUpdate) => {}, []);

  const value: UseChartContext = {
    context,
    selectTopic,
    selectChart,
    sendChartUpdate,
    resetSelection,
    clearChart,
    handleChartDataExtracted
  };

  return (
    <ChartContextContext.Provider value={value}>
      {children}
    </ChartContextContext.Provider>
  );
}

export function useChartContext(): UseChartContext {
  const context = useContext(ChartContextContext);
  if (context === undefined) {
    throw new Error("useChartContext must be used within a ChartContextProvider");
  }
  return context;
}

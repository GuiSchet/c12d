"use client";

import { useEffect, useRef, useCallback } from "react";
import embed, { Result } from "vega-embed";
import { TopLevelSpec } from "vega-lite";
import { useChartContext } from "./ChartContextProvider";
import { ChartContextUpdate, ChartInteraction, ChartDataSummary } from "@/types/charts";
import { processChartData } from "@/lib/chartDataUtils";

interface VegaChartProps {
  spec: TopLevelSpec;
  chartId?: string;
  enableInteractions?: boolean;
  className?: string;
  onDataExtracted?: (chartData: ChartDataSummary) => void;
  onChartReady?: () => void;
}

export function VegaChart({
  spec,
  chartId,
  enableInteractions = true,
  className = "",
  onDataExtracted,
  onChartReady
}: VegaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<Result | null>(null);
  const { sendChartUpdate, context } = useChartContext();

  const handleChartInteraction = useCallback((
    type: "hover" | "click",
    data: Record<string, unknown>,
    field?: string,
    value?: unknown
  ) => {
    if (!enableInteractions || !context.selectedTopic) return;

    const interaction: ChartInteraction = {
      type,
      data,
      field,
      value
    };

    const update: ChartContextUpdate = {
      action: "chart_interaction",
      topic: context.selectedTopic,
      chartId: chartId || context.selectedChart?.id,
      interactionData: interaction,
      description: `User ${type === "hover" ? "hovered over" : "clicked on"} data point${field && value ? ` for ${field}: ${value}` : ""}`
    };

    sendChartUpdate(update);
  }, [enableInteractions, context.selectedTopic, context.selectedChart, chartId, sendChartUpdate]);

  useEffect(() => {
    if (containerRef.current && spec) {
      // Clear previous chart
      containerRef.current.innerHTML = "";

      embed(containerRef.current, spec, {
        actions: false,
        renderer: "svg",
        tooltip: { theme: "light" }
      })
      .then((result) => {
        viewRef.current = result;

        // Extract and process chart data
        if (context.selectedChart && onDataExtracted) {
          const chartData = processChartData(
            spec,
            context.selectedChart.type,
            context.selectedChart.dataFields
          );
          onDataExtracted(chartData);
        }

        if (enableInteractions) {
          // Add click interaction
          result.view.addEventListener('click', (event, item) => {
            if (item && item.datum) {
              console.log("Chart clicked:", item.datum);

              // Try to extract meaningful field and value from the clicked item
              const datum = item.datum;
              let field, value;

              // Common field patterns in our data
              const fieldPriority = ['pozo', 'mes', 'dia', 'tipo', 'proceso', 'kpi', 'fecha', 'turno'];
              for (const f of fieldPriority) {
                if (datum[f] !== undefined) {
                  field = f;
                  value = datum[f];
                  break;
                }
              }

              handleChartInteraction('click', datum, field, value);
            }
          });

          // Add hover interaction with debouncing
          let hoverTimeout: NodeJS.Timeout;
          result.view.addEventListener('mouseover', (event, item) => {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
              if (item && item.datum) {
                console.log("Chart hovered:", item.datum);

                const datum = item.datum;
                let field, value;

                // Same field extraction logic as click
                const fieldPriority = ['pozo', 'mes', 'dia', 'tipo', 'proceso', 'kpi', 'fecha', 'turno'];
                for (const f of fieldPriority) {
                  if (datum[f] !== undefined) {
                    field = f;
                    value = datum[f];
                    break;
                  }
                }

                handleChartInteraction('hover', datum, field, value);
              }
            }, 500); // 500ms debounce for hover
          });
        }

        // Notify that chart is fully ready
        if (onChartReady) {
          console.log("📊 [VEGA CHART] Chart fully rendered and ready");
          onChartReady();
        }
      })
      .catch((error) => {
        console.error("Error embedding chart:", error);
      });
    }

    return () => {
      // Cleanup
      viewRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, enableInteractions, handleChartInteraction]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
    />
  );
}
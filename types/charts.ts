import { TopLevelSpec } from "vega-lite";

export type TopicId = "network" | "mempool" | "peers" | "orphans" | "logs";

export type ChartType = "bar" | "line" | "area" | "scatter" | "pie" | "heatmap" | "treemap";

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  agentDescription?: string; // Rich description for AI agent analysis
  type: ChartType;
  spec: TopLevelSpec;
  dataFields: string[];
  metrics: string[];
  thumbnail?: string;
}

export interface TopicChart {
  topicId: TopicId;
  charts: ChartTemplate[];
}

export interface ChartInteraction {
  type: "hover" | "click" | "select";
  data: Record<string, unknown>;
  field?: string;
  value?: unknown;
}

export interface ChartDataSummary {
  totalRecords: number;
  dataValues: Record<string, unknown>[];
  statistics?: {
    [field: string]: {
      min?: number;
      max?: number;
      avg?: number;
      sum?: number;
      count?: number;
    };
  };
  insights?: string[];
}

export interface ChartContextUpdate {
  action: "chart_selected" | "chart_interaction" | "topic_changed" | "chart_changed";
  chartId?: string;
  chartType?: ChartType;
  topic: TopicId;
  dataFields?: string[];
  metrics?: string[];
  interactionData?: ChartInteraction;
  currentData?: Record<string, unknown>[];
  chartData?: ChartDataSummary;
  description?: string;
  requiresImmediateResponse?: boolean;
}

export interface ChartContext {
  selectedTopic: TopicId | null;
  selectedChart: ChartTemplate | null;
  availableCharts: ChartTemplate[];
  chartData?: ChartDataSummary | null;
  isLoading: boolean;
  error?: string;
}

export interface ChartContextProviderProps {
  children: React.ReactNode;
}

export interface UseChartContext {
  context: ChartContext;
  selectTopic: (topicId: TopicId) => void;
  selectChart: (chartId: string) => void;
  sendChartUpdate: (update: ChartContextUpdate) => void;
  resetSelection: () => void;
  clearChart: () => void;
  handleChartDataExtracted: (chartData: ChartDataSummary) => void;
}
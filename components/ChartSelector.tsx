"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartContext } from "./ChartContextProvider";
import { MiniChartPreview } from "./MiniChartPreview";
import { BarChart3, TrendingUp, Activity, Search, PieChart, Flame, ArrowLeft, Network, Database, Users, GitBranch, Terminal } from "lucide-react";

interface ChartSelectorProps {
  onBack?: () => void;
  className?: string;
}

const chartTypeIcons = {
  bar: BarChart3,
  line: TrendingUp,
  area: Activity,
  scatter: Search,
  pie: PieChart,
  heatmap: Flame
};

const topicIcons = {
  network: Network,
  mempool: Database,
  peers: Users,
  orphans: GitBranch,
  logs: Terminal
};

export function ChartSelector({ onBack, className = "" }: ChartSelectorProps) {
  const { context, selectChart } = useChartContext();
  const { selectedTopic, availableCharts, isLoading } = context;

  const handleChartSelect = (chartId: string) => {
    selectChart(chartId);
  };

  const topicDisplayNames: Record<string, string> = {
    network: "Network",
    mempool: "Mempool",
    peers: "Peers",
    orphans: "Orphans",
    logs: "Logs"
  };

  if (!selectedTopic) {
    return (
      <div className="text-center text-gray-500">
        <p>Select a topic first</p>
      </div>
    );
  }

  const TopicIcon = topicIcons[selectedTopic as keyof typeof topicIcons];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-full flex items-center justify-center mb-8">
        {/* Circular back button */}
        {onBack && (
          <Button
            onClick={onBack}
            className="absolute left-0 w-10 h-10 rounded-full flex items-center justify-center text-white/70 bg-black/40 backdrop-blur-md border border-white/10 hover:border-[#F7931A]/30 hover:text-white transition-all duration-300 p-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

        {/* Centered title with topic icon */}
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            {TopicIcon && <TopicIcon className="w-4 h-4 text-[#F7931A]" />}
            <h3 className="text-xl font-bold text-white">
              {topicDisplayNames[selectedTopic as string]}
            </h3>
          </div>
          <p className="text-white/40 text-xs font-mono mt-1">select a chart to explore</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7931A]"></div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[#F7931A]/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#F7931A]/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#F7931A]/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-start w-full">
          <div className="flex flex-wrap gap-5 justify-center">
            {availableCharts.map((chart, index) => {
              const IconComponent = chartTypeIcons[chart.type as keyof typeof chartTypeIcons] || BarChart3;

              return (
                <motion.div
                  key={chart.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChartSelect(chart.id)}
                >
                  <Card className="cursor-pointer transition-all duration-300 bg-black/40 backdrop-blur-md border border-white/10 hover:border-[#F7931A]/30 hover:shadow-[0_0_20px_rgba(247,147,26,0.12)] shadow-xl w-80 min-h-64 overflow-hidden">
                    {/* Orange top accent line */}
                    <div className="h-px bg-gradient-to-r from-transparent via-[#F7931A]/40 to-transparent" />

                    <CardHeader className="pb-4 pt-6 relative">
                      {/* Chart type icon — muted, top-right */}
                      <div className="absolute top-4 right-4">
                        <IconComponent className="w-6 h-6 text-white/30" />
                      </div>
                      <CardTitle className="text-lg font-medium text-white/90 pr-10 mb-2">
                        {chart.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-col flex-1 px-6 pb-6">
                      {/* Mini chart preview */}
                      <div className="h-16 mb-4 flex-shrink-0 rounded-lg bg-black/30 border border-white/10">
                        <MiniChartPreview type={chart.type} className="w-full h-full" />
                      </div>

                      {/* Type badge + metric tags */}
                      <div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
                        <span className="bg-[#F7931A]/15 border border-[#F7931A]/20 text-[#F7931A]/80 font-mono text-xs px-2 py-0.5 rounded">
                          {chart.type}
                        </span>
                        {chart.metrics.slice(0, 2).map((metric) => (
                          <span
                            key={metric}
                            className="bg-white/5 border border-white/10 text-white/60 font-mono text-xs px-2 py-0.5 rounded"
                          >
                            {metric.replace("_", " ")}
                          </span>
                        ))}
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChartSelect(chart.id);
                        }}
                        className="w-full mt-auto text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 py-3 text-base"
                        style={{
                          backgroundColor: '#F7931A',
                          boxShadow: '0 10px 15px -3px rgba(247, 147, 26, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#E8830F";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#F7931A';
                        }}
                      >
                        View Chart
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {availableCharts.length === 0 && !isLoading && (
        <div className="text-center text-white/70 py-8">
          <p className="text-sm">No charts available for this topic</p>
        </div>
      )}
    </div>
  );
}

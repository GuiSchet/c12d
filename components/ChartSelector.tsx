"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartContext } from "./ChartContextProvider";
import { MiniChartPreview } from "./MiniChartPreview";
import { BarChart3, TrendingUp, Activity, Search, PieChart, Flame, ArrowLeft } from "lucide-react";

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

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-full flex items-center justify-center mb-8">
        {/* Circular back button - positioned on the left */}
        {onBack && (
          <Button
            onClick={onBack}
            className="absolute left-0 w-10 h-10 rounded-full flex items-center justify-center text-white bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-300 p-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

        {/* Centered title */}
        <h3 className="text-xl font-bold text-white">
          {topicDisplayNames[selectedTopic as string]}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-cyan-400 mx-auto mb-6"></div>
          <div className="flex items-center justify-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChartSelect(chart.id)}
                  className=""
                >
                  <Card className="cursor-pointer transition-all duration-300 bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl w-80 min-h-64">
                    <CardHeader className="pb-4 pt-6 relative">
                      {/* Icon positioned absolutely */}
                      <div className="absolute top-4 right-4">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg font-medium text-white/90 pr-10 mb-2">
                        {chart.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 px-6 pb-6">
                      {/* Mini chart preview */}
                      <div className="h-16 mb-4 flex-shrink-0 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                        <MiniChartPreview type={chart.type} className="w-full h-full" />
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
                        <span className="text-sm bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-sm">
                          {chart.type.charAt(0).toUpperCase() + chart.type.slice(1)}
                        </span>
                        {chart.metrics.slice(0, 2).map((metric) => (
                          <span
                            key={metric}
                            className="text-sm bg-white/15 text-white/80 px-4 py-2 rounded-full backdrop-blur-sm"
                          >
                            {metric.replace("_", " ")}
                          </span>
                        ))}
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click when button is clicked
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
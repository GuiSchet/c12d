import { TopLevelSpec } from "vega-lite";
import { ChartDataSummary, ChartType } from "@/types/charts";

/**
 * Extracts raw data values from a Vega-Lite specification
 */
export function extractDataFromSpec(spec: TopLevelSpec): Record<string, unknown>[] {
  try {
    // Handle direct data values
    if (spec.data && typeof spec.data === 'object' && 'values' in spec.data) {
      return spec.data.values as Record<string, unknown>[];
    }

    // Handle layered specs
    if ('layer' in spec && spec.layer) {
      for (const layer of spec.layer) {
        if (layer.data && typeof layer.data === 'object' && 'values' in layer.data) {
          return layer.data.values as Record<string, unknown>[];
        }
      }
    }

    // Handle concatenated specs
    if ('vconcat' in spec && spec.vconcat) {
      for (const subSpec of spec.vconcat) {
        try {
          const data = extractDataFromSpec(subSpec as TopLevelSpec);
          if (data.length > 0) return data;
        } catch (error) {
          console.warn("Failed to extract data from vconcat subspec:", error);
        }
      }
    }

    if ('hconcat' in spec && spec.hconcat) {
      for (const subSpec of spec.hconcat) {
        try {
          const data = extractDataFromSpec(subSpec as TopLevelSpec);
          if (data.length > 0) return data;
        } catch (error) {
          console.warn("Failed to extract data from hconcat subspec:", error);
        }
      }
    }

    // Handle faceted specs
    if ('facet' in spec && spec.spec) {
      try {
        return extractDataFromSpec(spec.spec as TopLevelSpec);
      } catch (error) {
        console.warn("Failed to extract data from facet spec:", error);
      }
    }

    return [];
  } catch (error) {
    console.error("Error extracting data from spec:", error);
    return [];
  }
}

/**
 * Calculates statistics for numeric fields in the data
 */
export function calculateStatistics(
  data: Record<string, unknown>[],
  fields: string[]
): { [field: string]: { min?: number; max?: number; avg?: number; sum?: number; count?: number } } {
  const stats: { [field: string]: { min?: number; max?: number; avg?: number; sum?: number; count?: number } } = {};

  fields.forEach(field => {
    const values = data
      .map(row => row[field])
      .filter(val => typeof val === 'number' && !isNaN(val));

    if (values.length > 0) {
      const numbers = values as number[]; // Safe cast since we filtered for numbers above
      const sum = numbers.reduce((a, b) => a + b, 0);
      stats[field] = {
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        avg: sum / numbers.length,
        sum: sum,
        count: numbers.length
      };
    }
  });

  return stats;
}

/**
 * Generates insights based on the data and chart type
 */
export function generateDataInsights(
  data: Record<string, unknown>[],
  chartType: ChartType,
  dataFields: string[],
  statistics: { [field: string]: { min?: number; max?: number; avg?: number; sum?: number; count?: number } }
): string[] {
  const insights: string[] = [];

  // Basic data insights
  insights.push(`El gráfico contiene ${data.length} puntos de datos`);

  // Chart-specific insights
  switch (chartType) {
    case 'bar':
      const numericFields = Object.keys(statistics);
      if (numericFields.length > 0) {
        const primaryField = numericFields[0];
        const stats = statistics[primaryField];
        if (stats) {
          insights.push(`Valor máximo de ${primaryField}: ${stats.max?.toLocaleString()}`);
          insights.push(`Valor mínimo de ${primaryField}: ${stats.min?.toLocaleString()}`);
          if (stats.avg) {
            insights.push(`Promedio de ${primaryField}: ${stats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
          }
        }
      }
      break;

    case 'line':
      // Look for trend analysis opportunities
      const timeFields = dataFields.filter(field =>
        field.toLowerCase().includes('mes') ||
        field.toLowerCase().includes('fecha') ||
        field.toLowerCase().includes('time')
      );

      if (timeFields.length > 0 && data.length > 1) {
        insights.push(`Datos de serie temporal con ${data.length} períodos`);

        // Try to identify trend
        const numericField = Object.keys(statistics)[0];
        if (numericField && data.length >= 2) {
          const firstValue = data[0][numericField];
          const lastValue = data[data.length - 1][numericField];
          if (typeof firstValue === 'number' && typeof lastValue === 'number') {
            const change = ((lastValue - firstValue) / firstValue * 100);
            insights.push(`Cambio total: ${change.toFixed(1)}% (de ${firstValue.toLocaleString()} a ${lastValue.toLocaleString()})`);
          }
        }
      }
      break;

    default:
      // Generic insights for other chart types
      Object.entries(statistics).forEach(([field, stats]) => {
        if (stats.sum) {
          insights.push(`Total de ${field}: ${stats.sum.toLocaleString()}`);
        }
      });
  }

  return insights;
}

/**
 * Processes chart data and returns a comprehensive summary
 */
export function processChartData(
  spec: TopLevelSpec,
  chartType: ChartType,
  dataFields: string[]
): ChartDataSummary {
  const dataValues = extractDataFromSpec(spec);
  const statistics = calculateStatistics(dataValues, dataFields);
  const insights = generateDataInsights(dataValues, chartType, dataFields, statistics);

  return {
    totalRecords: dataValues.length,
    dataValues,
    statistics,
    insights
  };
}

/**
 * Formats chart data for agent consumption
 */
export function formatDataForAgent(chartData: ChartDataSummary, chartName: string): string {
  const { totalRecords, dataValues, statistics, insights } = chartData;

  let formatted = `\n=== DATOS DEL GRÁFICO: ${chartName.toUpperCase()} ===\n`;
  formatted += `Total de registros: ${totalRecords}\n\n`;

  // Add statistics summary with enhanced formatting
  if (statistics && Object.keys(statistics).length > 0) {
    formatted += "📊 ESTADÍSTICAS COMPLETAS:\n";
    Object.entries(statistics).forEach(([field, stats]) => {
      formatted += `\n• Campo: ${field}\n`;
      if (stats.min !== undefined) formatted += `  - Mínimo: ${stats.min.toLocaleString()}\n`;
      if (stats.max !== undefined) formatted += `  - Máximo: ${stats.max.toLocaleString()}\n`;
      if (stats.avg !== undefined) formatted += `  - Promedio: ${stats.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n`;
      if (stats.sum !== undefined) formatted += `  - Total: ${stats.sum.toLocaleString()}\n`;
      if (stats.count !== undefined) formatted += `  - Cantidad de valores: ${stats.count}\n`;
    });
    formatted += `\n`;
  }

  // Add insights
  if (insights && insights.length > 0) {
    formatted += "💡 INSIGHTS CLAVE:\n";
    insights.forEach(insight => {
      formatted += `• ${insight}\n`;
    });
    formatted += `\n`;
  }

  // Add comprehensive sample data (more records for better context)
  if (dataValues.length > 0) {
    formatted += "📋 MUESTRA DE DATOS (para consultas específicas):\n";
    const sampleSize = Math.min(15, dataValues.length);
    dataValues.slice(0, sampleSize).forEach((record, index) => {
      formatted += `${index + 1}. ${JSON.stringify(record)}\n`;
    });
    if (dataValues.length > sampleSize) {
      formatted += `... y ${dataValues.length - sampleSize} registros más disponibles\n`;
    }
    formatted += `\n`;
  }

  // Add key values summary for quick reference
  formatted += "🔑 DATOS CLAVE PARA CONSULTAS:\n";
  formatted += `• Cantidad total de registros: ${totalRecords}\n`;
  if (statistics && Object.keys(statistics).length > 0) {
    const firstField = Object.keys(statistics)[0];
    const firstStats = statistics[firstField];
    formatted += `• Valor más alto encontrado: ${firstStats.max?.toLocaleString()} (campo: ${firstField})\n`;
    formatted += `• Valor más bajo encontrado: ${firstStats.min?.toLocaleString()} (campo: ${firstField})\n`;
    formatted += `• Promedio general: ${firstStats.avg?.toLocaleString(undefined, { maximumFractionDigits: 2 })} (campo: ${firstField})\n`;
  }

  return formatted;
}
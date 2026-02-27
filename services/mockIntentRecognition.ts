import { TopicId } from "@/types/charts";

export interface NavigationIntent {
  type: 'navigate_to_topic' | 'navigate_to_chart' | 'go_back' | 'go_to_topic_wheel' | 'go_to_chart_selector' | 'unknown';
  topic?: TopicId;
  chartId?: string;
  confidence: number;
  chartName?: string; // Add chart name for better logging
}

// Enhanced topic patterns with simple keywords and comprehensive expressions
const TOPIC_PATTERNS = {
  network: [
    'red', 'network', 'p2p', 'mensajes', 'trafico de red', 'conexiones globales',
    'quiero ver la red', 'hablemos de la red p2p'
  ],
  mempool: [
    'mempool', 'transacciones no confirmadas', 'fees', 'comisiones', 'peso mempool',
    'tamaño mempool'
  ],
  peers: [
    'peers', 'nodos', 'conexiones', 'inbound', 'outbound', 'IPv4', 'Tor',
    'muéstrame los nodos'
  ],
  orphans: [
    'orphans', 'huérfanas', 'transacciones sin padre', 'orphan txs',
    'ver orphans'
  ],
  logs: [
    'logs', 'visor de logs', 'registros', 'depuración', 'debug', 'errores'
  ]
};

// Mock patterns for navigation commands
const NAVIGATION_PATTERNS = {
  back: ['volver', 'atrás', 'back', 'regresar', 'anterior', 'salir'],
  home: ['inicio', 'home', 'principal', 'menu']
};

// Patterns for topic change requests
const TOPIC_CHANGE_PATTERNS = [
  'quiero cambiar de tema',
  'cambiemos de tema',
  'cambiar tema',
  'otro tema',
  'diferente tema',
  'cambio de tema',
  'vamos a otro tema',
  'ahora hablemos de',
  'mejor hablemos de',
  'prefiero hablar de',
  'me interesa más',
  'quisiera ver',
  'muéstrame',
  'vamos a ver'
];

// Chart-specific patterns with their corresponding chart IDs and topics
const CHART_PATTERNS = {
  // Network charts
  'msg-types-bar': ['tipos de mensaje', 'mensajes por tipo', 'inv', 'tx'],
  'msg-rate-line': ['tasa de mensajes', 'mensajes por segundo', 'rate'],
  'connections-area': ['conexiones', 'conexiones activas en la red'],

  // Mempool charts
  'mempool-count-line': ['cantidad de transacciones mempool', 'txs in mempool'],
  'mempool-bytes-area': ['peso mempool', 'mempool vsize', 'bytes'],
  'mempool-fees-line': ['comisiones mempool', 'fees', 'minrelayfee'],

  // Peers charts
  'peers-by-type-pie': ['nodos por tipo', 'conexiones inbound y outbound'],
  'peers-by-network-pie': ['redes', 'ipv4 ipv6 tor'],
  'peers-traffic-bar': ['trafico de peers', 'ancho de banda', 'bytes enviados'],

  // Orphans charts
  'orphan-count-line': ['cantidad de huerfanas', 'numero orphans'],
  'orphan-vsize-scatter': ['peso de huerfanas', 'tamaño orphans vsize'],
  'orphan-sources-bar': ['fuente orphans', 'quien anuncio orphans'],

  // Logs charts
  'logs-viewer': ['logs', 'stream de logs', 'log viewer', 'visor']
};

// Chart request patterns (common phrases for requesting charts)
const CHART_REQUEST_PATTERNS = [
  'quiero ver el gráfico',
  'muéstrame el gráfico',
  'ver gráfico',
  'gráfico de',
  'chart de',
  'mostrar gráfico',
  'quisiera ver el gráfico',
  'me interesa el gráfico',
  'datos de',
  'información sobre',
  'estadísticas de',
  'análisis de'
];

// Generic topic change patterns (without specifying which topic)
const GENERIC_TOPIC_CHANGE_PATTERNS = [
  'quiero cambiar de tema',
  'cambiemos de tema',
  'cambiar tema',
  'otro tema',
  'diferente tema',
  'cambio de tema',
  'vamos a otro tema',
  'quiero ver otros temas',
  'menu principal',
  'volver al menu',
  'temas disponibles'
];

// Generic chart change patterns (within current topic)
const GENERIC_CHART_CHANGE_PATTERNS = [
  'quiero cambiar de gráfico',
  'cambiemos de gráfico',
  'cambiar gráfico',
  'otro gráfico',
  'diferente gráfico',
  'cambio de gráfico',
  'vamos a otro gráfico',
  'quiero ver otros gráficos',
  'otros gráficos disponibles',
  'gráficos de este tema',
  'más gráficos',
  'otros charts',
  'selector de gráficos'
];

// Map chart IDs to their topics and names
const CHART_TO_TOPIC_MAP: Record<string, { topic: TopicId, name: string }> = {
  'msg-types-bar': { topic: 'network', name: 'Tipos de Mensajes' },
  'msg-rate-line': { topic: 'network', name: 'Tasa de Tráfico' },
  'connections-area': { topic: 'network', name: 'Conexiones' },
  'mempool-count-line': { topic: 'mempool', name: 'Cantidad Tx Mempool' },
  'mempool-bytes-area': { topic: 'mempool', name: 'vSize Mempool' },
  'mempool-fees-line': { topic: 'mempool', name: 'Fees Mempool' },
  'peers-by-type-pie': { topic: 'peers', name: 'Tipo de Peers' },
  'peers-by-network-pie': { topic: 'peers', name: 'Red de Peers' },
  'peers-traffic-bar': { topic: 'peers', name: 'Tráfico P2P' },
  'orphan-count-line': { topic: 'orphans', name: 'Cantidad Orphans' },
  'orphan-vsize-scatter': { topic: 'orphans', name: 'Tamaño Orphans' },
  'orphan-sources-bar': { topic: 'orphans', name: 'Fuente Orphans' },
  'logs-viewer': { topic: 'logs', name: 'Visor de Logs' }
};

export class MockIntentRecognitionService {
  /**
   * Mock service that analyzes user messages and extracts navigation intents
   * In a real implementation, this would be replaced with NLP/LLM integration
   */

  static analyzeUserMessage(message: string): NavigationIntent {
    console.log("🧠 [INTENT PARSER] Analyzing message:", message);

    const normalizedMessage = message.toLowerCase().trim();

    // Step 1: Check for generic navigation requests (highest priority)

    // 1a. Generic topic change (no specific topic mentioned) → Go to topic wheel
    const hasGenericTopicChange = GENERIC_TOPIC_CHANGE_PATTERNS.some(pattern =>
      normalizedMessage.includes(pattern.toLowerCase())
    );

    if (hasGenericTopicChange) {
      // Make sure no specific topic is mentioned
      const hasSpecificTopic = Object.values(TOPIC_PATTERNS).flat().some(pattern =>
        normalizedMessage.includes(pattern.toLowerCase())
      );

      if (!hasSpecificTopic) {
        const intent: NavigationIntent = {
          type: 'go_to_topic_wheel',
          confidence: 0.9
        };
        console.log("🎯 [INTENT PARSER] Generic topic change detected:", intent);
        return intent;
      }
    }

    // 1b. Generic chart change (within current topic) → Go to chart selector
    const hasGenericChartChange = GENERIC_CHART_CHANGE_PATTERNS.some(pattern =>
      normalizedMessage.includes(pattern.toLowerCase())
    );

    if (hasGenericChartChange) {
      // Make sure no specific chart is mentioned
      const hasSpecificChart = Object.values(CHART_PATTERNS).flat().some(pattern =>
        normalizedMessage.includes(pattern.toLowerCase())
      );

      if (!hasSpecificChart) {
        const intent: NavigationIntent = {
          type: 'go_to_chart_selector',
          confidence: 0.9
        };
        console.log("📊 [INTENT PARSER] Generic chart change detected:", intent);
        return intent;
      }
    }

    // Step 2: Check for chart request indicators
    const hasChartRequestIndicator = CHART_REQUEST_PATTERNS.some(pattern =>
      normalizedMessage.includes(pattern.toLowerCase())
    );

    // Step 2: Check for specific chart mentions
    const chartMatches: Array<{ chartId: string, confidence: number, pattern: string }> = [];

    for (const [chartId, patterns] of Object.entries(CHART_PATTERNS)) {
      for (const pattern of patterns) {
        if (normalizedMessage.includes(pattern.toLowerCase())) {
          const confidence = this.calculateConfidence(normalizedMessage, pattern);
          // Boost confidence significantly if there's a chart request indicator
          const boostedConfidence = hasChartRequestIndicator ? Math.min(0.95, confidence + 0.3) : confidence;

          chartMatches.push({
            chartId,
            confidence: boostedConfidence,
            pattern: pattern
          });
        }
      }
    }

    // Step 3: If we found chart matches, return the highest confidence one
    if (chartMatches.length > 0) {
      // Sort by confidence descending
      chartMatches.sort((a, b) => b.confidence - a.confidence);
      const bestMatch = chartMatches[0];
      const chartInfo = CHART_TO_TOPIC_MAP[bestMatch.chartId];

      const intent: NavigationIntent = {
        type: 'navigate_to_chart',
        chartId: bestMatch.chartId,
        topic: chartInfo.topic,
        chartName: chartInfo.name,
        confidence: bestMatch.confidence
      };

      console.log("📊 [INTENT PARSER] Chart intent detected:", intent);
      console.log("📝 [INTENT PARSER] Matched pattern:", bestMatch.pattern);
      console.log("📈 [INTENT PARSER] Chart request indicator found:", hasChartRequestIndicator);
      return intent;
    }

    // Step 4: Check for topic change indicators + topic mentions
    const hasTopicChangeIndicator = TOPIC_CHANGE_PATTERNS.some(pattern =>
      normalizedMessage.includes(pattern.toLowerCase())
    );

    // Step 5: Find all topic mentions with confidence scores
    const topicMatches: Array<{ topic: TopicId, confidence: number, pattern: string }> = [];

    for (const [topicId, patterns] of Object.entries(TOPIC_PATTERNS)) {
      for (const pattern of patterns) {
        if (normalizedMessage.includes(pattern.toLowerCase())) {
          const confidence = this.calculateConfidence(normalizedMessage, pattern);
          // Boost confidence if there's a topic change indicator
          const boostedConfidence = hasTopicChangeIndicator ? Math.min(0.95, confidence + 0.2) : confidence;

          topicMatches.push({
            topic: topicId as TopicId,
            confidence: boostedConfidence,
            pattern: pattern
          });
        }
      }
    }

    // Step 6: If we found topic matches, return the highest confidence one
    if (topicMatches.length > 0) {
      // Sort by confidence descending
      topicMatches.sort((a, b) => b.confidence - a.confidence);
      const bestMatch = topicMatches[0];

      const intent: NavigationIntent = {
        type: 'navigate_to_topic',
        topic: bestMatch.topic,
        confidence: bestMatch.confidence
      };

      console.log("🎯 [INTENT PARSER] Topic intent detected:", intent);
      console.log("📝 [INTENT PARSER] Matched pattern:", bestMatch.pattern);
      console.log("🔄 [INTENT PARSER] Topic change indicator found:", hasTopicChangeIndicator);
      return intent;
    }

    // Step 7: Check for navigation commands (back, home, etc.)
    for (const pattern of NAVIGATION_PATTERNS.back) {
      if (normalizedMessage.includes(pattern)) {
        const intent: NavigationIntent = {
          type: 'go_back',
          confidence: this.calculateConfidence(normalizedMessage, pattern)
        };
        console.log("↩️ [INTENT PARSER] Back navigation intent detected:", intent);
        return intent;
      }
    }

    // Default: unknown intent
    const unknownIntent: NavigationIntent = {
      type: 'unknown',
      confidence: 0
    };
    console.log("❓ [INTENT PARSER] No navigation intent detected");
    return unknownIntent;
  }

  private static calculateConfidence(message: string, pattern: string): number {
    const exactMatch = message.includes(pattern.toLowerCase());
    const wordCount = message.split(' ').length;
    const patternWords = pattern.split(' ').length;

    if (exactMatch) {
      // Base confidence
      let confidence = 0.6;

      // Boost for shorter patterns (single keywords like "pozos", "finanzas")
      if (patternWords === 1) {
        confidence += 0.25;
      }

      // Boost for direct word matches (not just substring)
      const messageWords = message.toLowerCase().split(/\s+/);
      const patternWordsArray = pattern.toLowerCase().split(/\s+/);
      const hasExactWordMatch = patternWordsArray.some(patternWord =>
        messageWords.includes(patternWord)
      );

      if (hasExactWordMatch) {
        confidence += 0.15;
      }

      // Boost for shorter messages (more direct intent)
      if (wordCount <= 3) {
        confidence += 0.1;
      }

      return Math.min(0.95, confidence);
    }

    return 0.1; // Very low confidence for partial matches
  }

  /**
   * Get all supported topics for validation
   */
  static getSupportedTopics(): TopicId[] {
    return Object.keys(TOPIC_PATTERNS) as TopicId[];
  }

  /**
   * Get example phrases for a topic (useful for testing)
   */
  static getExamplePhrasesForTopic(topic: TopicId): string[] {
    return TOPIC_PATTERNS[topic] || [];
  }
}
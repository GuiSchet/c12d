import { TopicId } from "@/types/charts";
import { getChartsForTopic } from "@/lib/chartTemplates";
import OpenAI from "openai";

export interface NavigationIntent {
  type: 'navigate_to_topic' | 'navigate_to_chart' | 'go_back' | 'go_to_topic_wheel' | 'go_to_chart_selector' | 'unknown';
  topic?: TopicId;
  chartType?: string; // General chart type like "perforacion", "activos", etc.
  confidence: number;
  reasoning?: string; // AI reasoning for debugging
}

// Comprehensive chart categories with all possible synonyms and phrases
const CHART_CATEGORIES = {
  network: {
    "tipos_mensaje": ["tipos de mensaje", "p2p", "inv", "tx", "addr", "ping", "tipos de mensajes p2p"],
    "tasa_mensajes": ["tasa de mensajes", "mensajes por segundo", "trafico", "msj/seg", "tasa"],
    "conexiones": ["conexiones activas", "conexiones por tipo", "inbound", "outbound", "block-relay", "feeler"]
  },
  mempool: {
    "cantidad_txs": ["transacciones en mempool", "txs", "mempool count", "cantidad de transacciones"],
    "peso_bytes": ["peso", "bytes", "peso total", "vsize", "vbytes"],
    "fees": ["fee mínimo", "mempool fee", "minrelayfee", "comisiones", "mempoolminfee"]
  },
  peers: {
    "tipo_conexion": ["peers por tipo", "conexion de peers", "nodos inbound", "nodos outbound"],
    "tipo_red": ["peers por red", "redes", "ipv4", "ipv6", "tor", "onion", "i2p", "cjdns", "network_diversity"],
    "trafico": ["top peers", "trafico recibido", "mas trafico", "bytes rx", "peers trafico"]
  },
  orphans: {
    "cantidad": ["orphan transactions", "cantidad orphans", "transacciones huerfanas", "orphan trend"],
    "tamaño": ["orphan vsize vs peers", "tamaño orphans", "scatter orphans", "vsize orphans"],
    "fuente": ["fuente orphans", "peers anunciando orphans", "quien manda orphans", "anunciantes"]
  },
  logs: {
    "visor": ["logs", "debug log", "visor de logs", "stream", "errores", "log viewer"]
  }
};

const TOPICS = ["network", "mempool", "peers", "orphans", "logs"];

export class OpenAIIntentRecognitionService {
  private static openai: OpenAI | null = null;

  private static initOpenAI() {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is not set");
      }
      this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    }
    return this.openai;
  }

  static async analyzeUserMessage(message: string): Promise<NavigationIntent> {
    console.log("🤖 [AI INTENT PARSER] Analyzing message:", message);

    try {
      const client = this.initOpenAI();

      const systemPrompt = `You are an intent classifier for a Bitcoin Core node analysis dashboard navigation system.

AVAILABLE TOPICS: ${TOPICS.join(", ")}

CHART CATEGORIES BY TOPIC:
${Object.entries(CHART_CATEGORIES).map(([topic, categories]) =>
        `${topic}:\n${Object.entries(categories).map(([chartType, keywords]) =>
          `  - ${chartType}: ${keywords.join(", ")}`
        ).join("\n")}`
      ).join("\n\n")}

INTENT TYPES:
1. navigate_to_topic: User wants to go to a specific topic
2. navigate_to_chart: User wants to see a chart about something specific
3. go_to_topic_wheel: User wants to change topic but doesn't specify which
4. go_to_chart_selector: User wants to change chart within current topic
5. go_back: User wants to go back/return
6. unknown: Intent is unclear

RULES:
- If user mentions a topic only (network, mempool, peers, orphans, logs), return navigate_to_topic
- If user mentions ANY keywords from the chart categories above, return navigate_to_chart with the correct topic and chartType
- For chart navigation, use the chartType key from the mapping
- If user says "cambiar tema", "otro tema" without specifying which, return go_to_topic_wheel
- If user says "cambiar gráfico", "otro gráfico" without specifying which, return go_to_chart_selector
- If user says "volver", "atrás", return go_back
- Always include confidence (0.0-1.0) and reasoning
- Be flexible with partial matches and similar phrases in Spanish.

Respond ONLY with valid JSON in this format:

For navigate_to_chart:
{
  "type": "navigate_to_chart",
  "topic": "mempool", 
  "chartType": "fees",
  "confidence": 0.95,
  "reasoning": "User mentioned 'comisiones' which is mapped to fees chartType under mempool topic"
}

For navigate_to_topic:
{
  "type": "navigate_to_topic",
  "topic": "orphans",
  "confidence": 0.95,
  "reasoning": "User mentioned 'transacciones huérfanas' which map to orphans topic"
}`;

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini", // Fast, cheap, perfect for classification
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.1, // Low temperature for consistent classification
        max_tokens: 200,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const result = JSON.parse(content) as NavigationIntent;

      console.log("🎯 [AI INTENT PARSER] Intent detected:", result);
      console.log("💭 [AI INTENT PARSER] AI reasoning:", result.reasoning);

      return result;

    } catch (error) {
      console.error("❌ [AI INTENT PARSER] Error:", error);

      // Fallback to unknown intent
      return {
        type: 'unknown',
        confidence: 0,
        reasoning: `Error during AI analysis: ${error}`
      };
    }
  }

  /**
   * Get all supported topics for validation
   */
  static getSupportedTopics(): TopicId[] {
    return TOPICS as TopicId[];
  }

  /**
   * Get chart information for a topic
   */
  static getChartsForTopic(topic: TopicId) {
    return getChartsForTopic(topic);
  }
}
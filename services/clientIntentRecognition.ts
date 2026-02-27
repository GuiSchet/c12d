import { TopicId } from "@/types/charts";

export interface NavigationIntent {
  type: 'navigate_to_topic' | 'navigate_to_chart' | 'go_back' | 'go_to_topic_wheel' | 'go_to_chart_selector' | 'unknown';
  topic?: TopicId;
  chartType?: string;
  confidence: number;
  reasoning?: string;
}

export class ClientIntentRecognitionService {
  static async analyzeUserMessage(message: string): Promise<NavigationIntent> {
    console.log("🤖 [CLIENT INTENT] Analyzing message:", message);
    
    try {
      const response = await fetch('/api/intent-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed: ${errorData.error || response.statusText}`);
      }

      const intent = await response.json() as NavigationIntent;
      
      console.log("🎯 [CLIENT INTENT] Intent received:", intent);
      console.log("💭 [CLIENT INTENT] AI reasoning:", intent.reasoning);
      
      return intent;

    } catch (error) {
      console.error("❌ [CLIENT INTENT] Error:", error);
      
      // Fallback to unknown intent
      return {
        type: 'unknown',
        confidence: 0,
        reasoning: `Client error: ${error}`
      };
    }
  }
}
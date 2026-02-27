import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are c12d, an open-source assistant for understanding Bitcoin Core P2P network monitoring data.
You help developers, researchers, and curious users understand what the peer-observer dashboard is showing.

When a chart is active, you have access to its current data (statistics, trends, anomalies).
Your role:
1. Explain WHAT the metric measures and WHY it matters in Bitcoin
2. Describe WHAT the user is currently seeing (normal? anomaly? interesting pattern?)
3. Suggest WHAT could cause observed patterns (attacks, eclipse nodes, mempool congestion, etc.)

Be concise but precise. Lead with anomalies if present.
Assume the user may not know Bitcoin internals — explain concepts briefly.
Respond in the same language the user writes in.`;

interface ChartContext {
  name: string;
  description: string;
  stats: Record<string, unknown>;
}

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, chartContext, history } = body as {
      message: string;
      chartContext: ChartContext | null;
      history: HistoryMessage[];
    };

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build system message — inject chart context if available
    let systemContent = SYSTEM_PROMPT;
    if (chartContext) {
      systemContent += `\n\n--- CURRENT CHART CONTEXT ---\nChart: ${chartContext.name}\nDescription: ${chartContext.description}`;
      if (chartContext.stats && Object.keys(chartContext.stats).length > 0) {
        systemContent += `\nCurrent statistics:\n${JSON.stringify(chartContext.stats, null, 2)}`;
      }
      systemContent += "\n--- END CHART CONTEXT ---";
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent },
      ...(history ?? []).map((m: HistoryMessage) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      stream: true,
      max_tokens: 600,
      temperature: 0.7,
    });

    // Stream SSE to the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { Send } from "lucide-react";

export function ChatPanel() {
  const { messages, isLoading, currentChartContext, sendMessage } = useChatContext();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-grow textarea
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-full bg-black/30 backdrop-blur-md border-l border-white/10">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg tracking-tight">c12d</h2>
          {currentChartContext && (
            <span className="text-xs font-mono px-2 py-1 rounded-full bg-[#F7931A]/20 border border-[#F7931A]/40 text-[#F7931A] truncate max-w-[160px]">
              Analyzing: {currentChartContext.name}
            </span>
          )}
        </div>
        <p className="text-white/40 text-xs mt-0.5">Bitcoin Core P2P Assistant</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="text-4xl opacity-20">₿</div>
            <p className="text-white/40 text-sm">
              {currentChartContext
                ? `Ask me anything about the ${currentChartContext.name} chart`
                : "Select a chart and ask me anything about it"}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === "user"
                    ? "bg-[#F7931A] text-black font-medium rounded-br-sm"
                    : "bg-white/10 text-white/90 border border-white/10 rounded-bl-sm"
                }`}
              >
                {msg.content || (
                  <span className="opacity-50 animate-pulse">...</span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/10">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this chart…"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F7931A]/60 disabled:opacity-50 min-h-[40px] max-h-[120px] leading-relaxed"
            style={{ height: "40px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#F7931A] hover:bg-[#E8830F] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </div>
        <p className="text-white/20 text-xs mt-1.5 text-right">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}

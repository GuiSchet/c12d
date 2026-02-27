"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { BitcoinDataProvider } from "@/contexts/BitcoinDataContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChartContextProvider } from "@/components/ChartContextProvider";

export default function DashboardPage() {
  const wsUrl = process.env.NEXT_PUBLIC_BITCOIN_WS_URL ?? "wss://demo.peer.observer/websocket/hal/";

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black z-0" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F7931A]/8 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 h-full w-full">
        <BitcoinDataProvider wsUrl={wsUrl}>
          <ChatProvider>
            <ChartContextProvider>
              <DashboardLayout />
            </ChartContextProvider>
          </ChatProvider>
        </BitcoinDataProvider>
      </div>
    </div>
  );
}

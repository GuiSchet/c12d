# Real-time Bitcoin Core Analysis & Visualization

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Data: peer-observer](https://img.shields.io/badge/Data-peer--observer-brightgreen)](https://github.com/peer-observer/peer-observer)

---

**c12d** is a free, open-source real-time dashboard for analyzing and monitoring a Bitcoin Core node's P2P network activity. It combines beautiful, responsive visual components with an integrated AI assistant to help developers, researchers, and Bitcoin enthusiasts understand what is happening under the hood of a Bitcoin node — in plain English, in real time.

This project retrieves its data directly from a node monitored by [peer-observer](https://github.com/peer-observer/peer-observer), connecting via WebSocket to ingest a live feed of eBPF and RPC events without any modifications to Bitcoin Core itself.

> **Born at [btc++ Floripa 2026](https://btcplusplus.dev/conf/floripa26) hackathon.**
> **Team:**
> - [@GuiSchet](https://github.com/GuiSchet)
> - [@f3r10](https://github.com/f3r10)

---

## ✨ Why?

Running a Bitcoin node generates a massive amount of internal data — P2P messages, mempool dynamics, peer connections, orphan transactions — that is normally hidden from view or requires deep protocol knowledge to interpret. **c12d makes this data accessible to everyone**:

- 📊 **Interactive charts** update in real time as events arrive from the node.
- 🤖 **AI assistant** explains what you're seeing, detects anomalies, and answers questions in natural language.
- 🔌 **Zero node modification** — it connects to [peer-observer](https://github.com/peer-observer/peer-observer), which uses eBPF probes and RPC polling. No Bitcoin Core patches needed.
- 🌐 **Works with any peer-observer instance** — point it to your own node.

---

## 🌟 Key Features

The dashboard provides deep insights into **5 key areas** of the Bitcoin P2P protocol:

### 1. 🌐 Network Activity (P2P Messages)
- **Message Types:** Real-time bar chart of incoming/outgoing P2P message types (`inv`, `tx`, `addr`, `ping`, `getdata`, `headers`, …).
- **Message Rate:** Line chart tracking messages per second over a rolling time window.
- **Connection History:** Area chart of active peers segmented by connection type (inbound, outbound-full, block-relay, feeler).

### 2. 🗂 Mempool State
- **Transaction Count:** Rolling line chart of the total number of transactions in the mempool.
- **Mempool Size:** Area chart visualizing total mempool weight in vbytes.
- **Fee Dynamics:** Tracks `minrelayfee` and fee congestion parameters over time.

### 3. 👥 Peers Information
- **Connection Distribution:** Pie chart — breakdown of peers by connection type.
- **Network Diversity:** Pie chart — distribution across networks (IPv4, IPv6, Tor, I2P, CJDNS).
- **Traffic Analysis:** Horizontal bar chart ranking the top 10 peers by bytes received/transmitted.

### 4. 👻 Orphaned Transactions
- **Orphan Count:** Real-time line chart tracking orphaned transactions held in the node's orphanage.
- **Size vs Announcers:** Scatter plot comparing the virtual size (`vsize`) of orphan transactions with the number of peers that announced them.
- **Source Peers:** Bar chart of the top peers announcing orphan transactions.

### 5. 📋 Debug Logs Stream
- **Live Log Viewer:** Real-time stream of Bitcoin Core `debug.log` events, synthesized from eBPF and RPC data, with `grep`-style filtering and keyword highlighting.

---

### 🤖 Built-in AI Assistant

The dashboard features an integrated, **context-aware AI assistant**.

| Capability | Description |
|---|---|
| **Context-Aware** | Automatically knows which chart you're viewing and ingests its current statistics. |
| **Anomaly Detection** | Proactively highlights unusual patterns: eclipse attempts, fee spikes, mempool congestion, orphan floods. |
| **Educational** | Explains what each metric means and why it matters for Bitcoin network health. |
| **Natural Language Navigation** | Ask the assistant to switch topics: *"Show me mempool data"* or *"Explain block-relay connections"*. |
| **Protocol Expert** | Deep knowledge of P2P flows (`inv`/`getdata`, `addr` propagation, IBD), orphanage mechanics, and RBF fee dynamics. |

---

## 🏗 Architecture

```
peer-observer node  (eBPF probes + RPC polling)
        │
        ▼
wss://[your-peer-observer]/websocket/
        │
        ▼
BitcoinWebSocketManager   (lib/bitcoinWebSocket.dts)
  └─ Parses JSON events → typed BitcoinEvent union
        │
        ▼
BitcoinDataContext   (contexts/BitcoinDataContext.tsx)
  ├─ Rolling buffers (60 data points / ~10 minutes)
  └─ State: PeerInfos, MempoolInfo, OrphanTxs, P2P messages, Logs
        │
        ▼
ShadcnChart / LogViewer   (real-time rendering with Recharts + Vega)
        │
        ▼
ChartContextProvider → OpenAI API
  └─ Sends chart stats (min/max/avg/trend) as AI context
        │
        ▼
c12d AI Assistant   (text interface)
  └─ Responds with analysis, explanations, and anomaly alerts
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Charting** | [Recharts](https://recharts.org/), [Vega-Lite](https://vega.github.io/vega-lite/) |
| **AI Integration** | [OpenAI API](https://platform.openai.com/) — chat completions + intent recognition |
| **Data Source** | WebSocket feed from a [peer-observer](https://github.com/peer-observer/peer-observer) instance |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- An **OpenAI API Key** (for AI assistant features)
- A running **peer-observer** instance, or use the public demo endpoint

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/c12d.git
cd c12d

# 2. Install dependencies
npm install

# 3. Configure environment variables (see below)
cp .env.demo .env.local
# Edit .env.local with your keys

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the project root:

```env
# ─── Required ──────────────────────────────────────────────────────────────
# OpenAI API key for the AI assistant
OPENAI_API_KEY=your_openai_api_key_here

# ─── Optional ──────────────────────────────────────────────────────────────
# WebSocket URL for the peer-observer feed.
# Default (public demo node): wss://your.peer.observer/websocket/
# Set this to point to your own peer-observer instance:
NEXT_PUBLIC_BITCOIN_WS_URL=wss://your-node.example.com/websocket/
```

### Connecting to Your Own Node

To monitor your own Bitcoin Core node, you need to run [peer-observer](https://github.com/peer-observer/peer-observer) alongside it. peer-observer uses eBPF probes to tap into Bitcoin Core's internal P2P activity without patching the binary. Once running, update `NEXT_PUBLIC_BITCOIN_WS_URL` in `.env.local` to point to your instance.

---

## 📁 Project Structure

```
c12d/
├── app/                        # Next.js App Router pages & API routes
│   ├── page.tsx                # Main dashboard page
│   ├── layout.tsx              # Root layout + metadata
│   └── api/                   # Server-side API routes (OpenAI proxy)
├── components/                 # UI components
│   ├── ShadcnChart.tsx         # Main chart renderer
│   ├── LogViewer.tsx           # Real-time log stream viewer
│   ├── TopicWheel.tsx          # Topic navigation wheel
│   └── ChartContextProvider.tsx # Injects chart stats into AI context
├── contexts/
│   └── BitcoinDataContext.tsx  # Global state + rolling data buffers
├── lib/
│   ├── bitcoinWebSocket.ts     # WebSocket manager + event parser
│   ├── bitcoinDataBuffer.ts    # Rolling buffer utility
│   └── bitcoinChartTemplates.ts # Chart definitions for all 5 topics
└── types/                      # Shared TypeScript type definitions
```

---


## 🔒 Data Privacy & Security

- All data displayed by c12d is **public network data** obtained via `peer-observer`. No private key material or wallet data is ever accessed.
- **Do not commit** `.env.local` or any file containing API keys. The `.gitignore` is pre-configured to exclude them.
- The OpenAI API key is used server-side only (via Next.js API routes) and is never exposed to the browser.

---

## 📄 License

**c12d is free and open-source software**, released under the [MIT License](LICENSE).

```
MIT License — Copyright (c) 2025 c12d contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

See the full [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [**peer-observer**](https://github.com/peer-observer/peer-observer) — for the incredible Bitcoin Core instrumentation that makes this project possible.

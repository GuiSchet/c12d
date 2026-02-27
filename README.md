# c12d — Real-time Bitcoin Core Analysis and Visualization 

**c12d** is an open-source real-time dashboard designed for analyzing and monitoring a Bitcoin Core node's P2P network activity. It combines beautiful, responsive visual components with an integrated AI assistant to help developers, researchers, and Bitcoin enthusiasts understand what is happening under the hood of a Bitcoin node in real time.

This project retrieves its data directly from a node monitored by [peer-observer](https://github.com/peer-observer/peer-observer), connecting via WebSockets to ingest a live feed of eBPF and RPC events.

## 🌟 Key Features

The dashboard provides deep insights into 5 key areas of the Bitcoin P2P protocol:

### 1. Network Activity (P2P Messages)
- **Message Types:** Real-time count of incoming and outgoing P2P messages (e.g., `inv`, `tx`, `addr`, `ping`, `getdata`).
- **Message Rate:** Traffic line chart tracking messages per second over time.
- **Connection History:** Active peers segmented by connection type (inbound, outbound-full, block-relay, feeler).

### 2. Mempool State
- **Transaction Count:** Tracks the total number of transactions residing in the mempool over time.
- **Mempool Size:** Visualizes the total weight (vbytes) of the mempool.
- **Mempool Fees:** Monitors the minimum relay fee (`minrelayfee`) dynamics and congestion parameters.

### 3. Peers Information
- **Connection Distribution:** Breakdown of the node's peers by connection type.
- **Network Diversity:** Displays the distribution of peers across networks (IPv4, IPv6, Tor, I2P, CJDNS).
- **Traffic Analysis:** Ranks the top 10 peers by data received/transmitted.

### 4. Orphaned Transactions
- **Orphan Count:** Real-time tracking of orphaned transactions held in the node's orphanage.
- **Size and Announcers:** Scatter plots comparing the virtual size (vsize) of orphan transactions with the number of peers announcing them.

### 5. Debug Logs Stream
- **Live Log Viewer:** A real-time stream of the Bitcoin Core `debug.log`, complete with parsing and filtering functionality to spot anomalies and critical events.

### 🤖 Built-in AI Assistant (c12d)
The dashboard features an integrated intent-recognizing AI assistant, powered by OpenAI.
- **Context-Aware:** The assistant knows which chart you are currently viewing and can analyze its real-time statistics and anomalies.
- **Educational:** It can explain what different metrics mean, why they matter to the Bitcoin network, and the potential causes of unexpected patterns (like eclipse attacks, fee spikes, or mempool congestion).
- **Navigation via Natural Language:** Simply ask the assistant to switch to different charts or topics.

---

## 🛠 Tech Stack

- **Framework:** Next.js 15
- **Styling:** Tailwind CSS, Shadcn UI
- **Animations:** Framer Motion
- **Charting:** Recharts, Vega
- **AI Integration:** OpenAI API for context-aware Chat, Intent Recognition
- **Data Source:** WebSocket connection to `peer-observer` instances (`wss://demo.peer.observer/websocket/hal/`)

---

## 🚀 Getting Started

To run the dashboard locally, follow these steps:

### Prerequisites
- Node.js version 20 or higher.
- An OpenAI API Key (for the AI Assistant features).

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone <your-repo-url>
   cd c12d
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up Environment Variables:**
   Create an `.env.local` file in the root directory and add the following required variables:
   \`\`\`env
   # Your OpenAI API Key for the conversational AI features
   OPENAI_API_KEY=your_openai_api_key_here

   # (Optional) The WebSocket URL for the peer-observer feed
   # Un-comment the next line to override the default connection:
   NEXT_PUBLIC_BITCOIN_WS_URL=wss://xxxxx/websocket/xxx/
   \`\`\`

4. **Run the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser to start using the dashboard.

---

## 🕵️ Data Privacy & Security
This project has been sanitized. **Please ensure you do not commit any `.env`, `.env.local`, or hardcoded API keys.**
All data ingested by the dashboard is public/network data obtained via `peer-observer`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Since this is an open-source tool aiming at making Bitcoin Core's internals more transparent, feel free to submit PRs for new chart templates, better intent parsing, or improved AI prompts.
